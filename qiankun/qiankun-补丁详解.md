# qiankun 对 DOM 和 window API 的补丁详解

## 📋 目录
1. [补丁概览](#补丁概览)
2. [Window API 补丁](#window-api-补丁)
3. [DOM API 补丁](#dom-api-补丁)
4. [补丁原因总结](#补丁原因总结)

---

## 补丁概览

qiankun 在微前端场景下，需要对多个 DOM 和 window API 进行补丁（patch），以实现：
- **副作用清理**：应用卸载时清理定时器、事件监听器等
- **样式隔离**：防止子应用样式污染全局
- **DOM 隔离**：将动态创建的 DOM 元素正确挂载到子应用容器
- **脚本隔离**：确保动态脚本在正确的沙箱环境中执行

所有补丁在 `src/sandbox/patchers/` 目录下实现。

---

## Window API 补丁

### 1. setInterval / clearInterval 补丁

**文件位置**：`src/sandbox/patchers/interval.ts`

**补丁内容**：
```typescript
// 拦截 setInterval 和 clearInterval
global.setInterval = (handler, timeout, ...args) => {
  const intervalId = rawWindowInterval(handler, timeout, ...args);
  intervals = [...intervals, intervalId];  // 记录所有定时器 ID
  return intervalId;
};

global.clearInterval = (intervalId) => {
  intervals = intervals.filter((id) => id !== intervalId);
  return rawWindowClearInterval.call(window, intervalId);
};
```

**为什么需要补丁**：
- ❌ **问题**：子应用创建的定时器在卸载后仍会继续运行，造成内存泄漏和意外行为
- ✅ **解决**：记录所有定时器 ID，在应用卸载时统一清理

**清理时机**：
```typescript
return function free() {
  intervals.forEach((id) => global.clearInterval(id));  // 清理所有定时器
  global.setInterval = rawWindowInterval;  // 恢复原始方法
  global.clearInterval = rawWindowClearInterval;
};
```

---

### 2. addEventListener / removeEventListener 补丁

**文件位置**：`src/sandbox/patchers/windowListener.ts`

**补丁内容**：
```typescript
const listenerMap = new Map<string, ListenerMapObject[]>();

global.addEventListener = (type, rawListener, rawOptions) => {
  const addListener = addCacheListener(listenerMap, type, rawListener, rawOptions);
  if (!addListener) return;  // 已添加过，避免重复
  const { listener, options } = addListener;
  return rawAddEventListener.call(window, type, listener, options);
};

global.removeEventListener = (type, rawListener, rawOptions) => {
  const { listener, options } = removeCacheListener(listenerMap, type, rawListener, rawOptions);
  return rawRemoveEventListener.call(window, type, listener, options);
};
```

**为什么需要补丁**：
- ❌ **问题1**：子应用添加的事件监听器在卸载后仍会触发，影响其他应用
- ❌ **问题2**：需要处理 `once` 选项，确保只执行一次的事件能正确清理
- ❌ **问题3**：需要区分 `capture` 选项，避免错误移除监听器
- ✅ **解决**：记录所有监听器，卸载时统一清理

**特殊处理**：
- 处理 `once: true` 选项，自动在触发后移除
- 区分 `capture` 选项，确保正确匹配和移除
- 防止重复添加相同的监听器

**清理时机**：
```typescript
return function free() {
  listenerMap.forEach((listeners, type) =>
    [...listeners].forEach(({ rawListener, options }) => 
      global.removeEventListener(type, rawListener, options)
    )
  );
  listenerMap.clear();
  global.addEventListener = rawAddEventListener;
  global.removeEventListener = rawRemoveEventListener;
};
```

---

### 3. g_history.listen 补丁（Umi 框架）

**文件位置**：`src/sandbox/patchers/historyListener.ts`

**补丁内容**：
```typescript
// 拦截 umi 的 g_history.listen
if ((window as any).g_history && isFunction((window as any).g_history.listen)) {
  rawHistoryListen = (window as any).g_history.listen.bind((window as any).g_history);
  
  (window as any).g_history.listen = (listener) => {
    historyListeners.push(listener);
    const unListen = rawHistoryListen(listener);
    historyUnListens.push(unListen);
    return () => {
      unListen();
      historyUnListens.splice(historyUnListens.indexOf(unListen), 1);
      historyListeners.splice(historyListeners.indexOf(listener), 1);
    };
  };
}
```

**为什么需要补丁**：
- ❌ **问题**：Umi 框架使用 `g_history.listen` 监听路由变化，子应用卸载后这些监听器仍会触发
- ✅ **解决**：记录所有 history 监听器，卸载时清理，重新挂载时恢复

**特殊场景**：
- 如果应用在 unmount 时未正确卸载 listener，需要在下次 mount 前重新绑定
- 提供 `rebuild` 函数用于重新绑定遗留的监听器

---

## DOM API 补丁

### 4. 动态 DOM 操作补丁（appendChild / insertBefore / removeChild）

**文件位置**：`src/sandbox/patchers/dynamicAppend/common.ts`

**补丁内容**：
```typescript
// 拦截 HTMLHeadElement 和 HTMLBodyElement 的 appendChild、insertBefore、removeChild
HTMLHeadElement.prototype.appendChild = getOverwrittenAppendChildOrInsertBefore({
  rawDOMAppendOrInsertBefore: rawHeadAppendChild,
  containerConfigGetter,
  isInvokedByMicroApp,
  target: 'head',
});

HTMLBodyElement.prototype.appendChild = getOverwrittenAppendChildOrInsertBefore({
  rawDOMAppendOrInsertBefore: rawBodyAppendChild,
  containerConfigGetter,
  isInvokedByMicroApp,
  target: 'body',
});
```

**为什么需要补丁**：
- ❌ **问题1**：子应用动态创建的 `<style>`、`<link>`、`<script>` 标签会被插入到全局 `<head>` 或 `<body>`，污染全局环境
- ❌ **问题2**：样式标签需要应用 CSS 作用域隔离
- ❌ **问题3**：脚本标签需要在正确的沙箱环境中执行
- ✅ **解决**：拦截这些操作，将元素插入到子应用的容器中

**处理的标签类型**：
- `<style>`：样式标签，需要作用域隔离
- `<link rel="stylesheet">`：外部样式表，转换为内联样式并应用隔离
- `<script>`：脚本标签，在沙箱中执行

**处理流程**：
```typescript
function appendChildOrInsertBefore(newChild, refChild) {
  if (!isHijackingTag(element.tagName) || !isInvokedByMicroApp(element)) {
    return rawDOMAppendOrInsertBefore.call(this, element, refChild);
  }
  
  switch (element.tagName) {
    case 'STYLE':
    case 'LINK':
      // 1. 应用 CSS 作用域隔离
      if (scopedCSS) {
        css.process(appWrapper, stylesheetElement, appName);
      }
      // 2. 插入到子应用容器而非全局 head/body
      const mountDOM = target === 'head' ? getAppWrapperHeadElement(appWrapper) : appWrapper;
      return rawDOMAppendOrInsertBefore.call(mountDOM, stylesheetElement, referenceNode);
      
    case 'SCRIPT':
      // 1. 在沙箱中执行脚本
      execScripts(null, [src], proxy, { fetch, strictGlobal });
      // 2. 用注释节点替换原 script 标签
      const comment = document.createComment(`dynamic script ${src} replaced by qiankun`);
      return rawDOMAppendOrInsertBefore.call(mountDOM, comment, referenceNode);
  }
}
```

---

### 5. CSS 作用域隔离补丁

**文件位置**：`src/sandbox/patchers/css.ts`

**补丁内容**：
```typescript
export class ScopedCSS {
  process(styleNode: HTMLStyleElement, prefix: string) {
    // 1. 解析 CSS 规则
    const rules = arrayify<CSSRule>(sheet?.cssRules ?? []);
    // 2. 重写选择器，添加作用域前缀
    const css = this.rewrite(rules, prefix);
    // 3. 写回 style 标签
    styleNode.textContent = css;
  }
  
  private rewrite(rules: CSSRule[], prefix: string) {
    // 处理普通样式、媒体查询、@supports 等
    rules.forEach((rule) => {
      switch (rule.type) {
        case RuleType.STYLE:
          css += this.ruleStyle(rule as CSSStyleRule, prefix);
          break;
        case RuleType.MEDIA:
          css += this.ruleMedia(rule as CSSMediaRule, prefix);
          break;
        // ...
      }
    });
  }
}
```

**为什么需要补丁**：
- ❌ **问题**：子应用的 CSS 样式会全局生效，影响其他应用和主应用
- ✅ **解决**：为所有 CSS 选择器添加作用域前缀，如 `div[data-qiankun="app-name"]`

**重写示例**：
```css
/* 原始样式 */
.btn { color: red; }
html, body { margin: 0; }

/* 重写后 */
div[data-qiankun="app-name"] .btn { color: red; }
div[data-qiankun="app-name"] { margin: 0; }
```

**特殊处理**：
- `html`、`body`、`:root` 选择器直接替换为作用域前缀
- 媒体查询 `@media` 内部规则递归处理
- `@supports` 内部规则递归处理
- `@keyframes`、`@font-face` 等保持原样

---

### 6. document.createElement 补丁（严格沙箱模式）

**文件位置**：`src/sandbox/patchers/dynamicAppend/forStrictSandbox.ts`

**补丁内容**：
```typescript
// 方式1：Proxy 代理（speedy 模式）
const proxyDocument = new Proxy(document, {
  get: (target, p) => {
    switch (p) {
      case 'createElement':
        return function createElement(...args) {
          const element = targetCreateElement.call(target, ...args);
          // 将元素与当前沙箱绑定
          attachElementToProxy(element, sandbox.proxy);
          return element;
        };
      case 'querySelector':
        return function querySelector(...args) {
          if (args[0] === 'head') {
            // 返回子应用的 head 元素而非全局 head
            return getAppWrapperHeadElement(containerConfig.appWrapperGetter());
          }
          return targetQuerySelector.call(target, ...args);
        };
    }
  }
});

// 方式2：直接覆盖（非 speedy 模式）
Document.prototype.createElement = function createElement(tagName, options) {
  const element = rawDocumentCreateElement.call(this, tagName, options);
  if (isHijackingTag(tagName)) {
    const { window: currentRunningSandboxProxy } = getCurrentRunningApp() || {};
    if (currentRunningSandboxProxy) {
      attachElementToProxy(element, currentRunningSandboxProxy);
    }
  }
  return element;
};
```

**为什么需要补丁**：
- ❌ **问题1**：子应用通过 `document.createElement('style')` 创建的样式标签无法被识别为属于该应用
- ❌ **问题2**：`document.querySelector('head')` 应该返回子应用的 head 而非全局 head
- ✅ **解决**：标记创建的元素属于哪个沙箱，确保后续的 appendChild 能正确路由

---

### 7. document.querySelector('head') 补丁

**补丁内容**：
```typescript
case 'querySelector':
  return function querySelector(...args) {
    const selector = args[0];
    switch (selector) {
      case 'head':
        const containerConfig = proxyAttachContainerConfigMap.get(sandbox.proxy);
        if (containerConfig) {
          // 返回子应用的 head 元素
          return getAppWrapperHeadElement(containerConfig.appWrapperGetter());
        }
        break;
    }
    return targetQuerySelector.call(target, ...args);
  };
```

**为什么需要补丁**：
- ❌ **问题**：子应用调用 `document.querySelector('head')` 会获取全局 head，导致样式插入错误位置
- ✅ **解决**：拦截 `querySelector('head')`，返回子应用容器内的 head 元素

---

### 8. MutationObserver.observe 补丁

**文件位置**：`src/sandbox/patchers/dynamicAppend/forStrictSandbox.ts`

**补丁内容**：
```typescript
const nativeMutationObserverObserveFn = MutationObserver.prototype.observe;
MutationObserver.prototype.observe = function observe(target: Node, options: MutationObserverInit) {
  // 如果 target 是代理的 document，替换为真实 document
  const realTarget = target instanceof Document ? nativeDocument : target;
  return nativeMutationObserverObserveFn.call(this, realTarget, options);
};
```

**为什么需要补丁**：
- ❌ **问题**：某些库会监听 `sandbox.document`，但浏览器 API 要求传入真实的 Document 对象
- ✅ **解决**：检测到代理 document 时，自动替换为真实 document

---

### 9. Node.prototype.compareDocumentPosition 补丁

**补丁内容**：
```typescript
const prevCompareDocumentPosition = Node.prototype.compareDocumentPosition;
Node.prototype.compareDocumentPosition = function compareDocumentPosition(node) {
  // 如果 node 是代理的 document，替换为真实 document
  const realNode = node instanceof Document ? nativeDocument : node;
  return prevCompareDocumentPosition.call(this, realNode);
};
```

**为什么需要补丁**：
- ❌ **问题**：第三方库可能比较 `documentProxy.compareDocumentPosition(documentProxy.documentElement)`，导致类型错误
- ✅ **解决**：自动将代理 document 转换为真实 document

---

### 10. Node.prototype.parentNode 补丁

**补丁内容**：
```typescript
const parentNodeDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'parentNode');
const patchedParentNodeDescriptor = {
  ...parentNodeDescriptor,
  get(this: Node) {
    const parentNode = parentNodeGetter.call(this);
    if (parentNode instanceof Document) {
      const proxy = getCurrentRunningApp()?.window;
      if (proxy) {
        // 确保 sandbox.document.body.parentNode === sandbox.document
        return proxy.document;
      }
    }
    return parentNode;
  },
};
Object.defineProperty(Node.prototype, 'parentNode', patchedParentNodeDescriptor);
```

**为什么需要补丁**：
- ❌ **问题**：`sandbox.document.body.parentNode` 应该等于 `sandbox.document`，但可能返回真实 document
- ✅ **解决**：拦截 `parentNode` getter，确保返回代理 document

---

## 补丁原因总结

### 核心问题

1. **副作用清理问题**
   - 定时器、事件监听器在应用卸载后仍会运行
   - 导致内存泄漏和意外行为

2. **样式污染问题**
   - 子应用的 CSS 全局生效
   - 影响其他应用和主应用

3. **DOM 隔离问题**
   - 动态创建的 DOM 元素插入到全局位置
   - 无法正确清理和隔离

4. **脚本执行环境问题**
   - 动态脚本需要在正确的沙箱中执行
   - 需要正确的 `document.currentScript` 上下文

5. **代理对象兼容性问题**
   - 某些浏览器 API 不接受代理对象
   - 需要自动转换为真实对象

### 补丁分类

| 补丁类型 | 补丁内容 | 目的 |
|---------|---------|------|
| **副作用清理** | interval、windowListener、historyListener | 应用卸载时清理副作用 |
| **样式隔离** | CSS 作用域重写 | 防止样式污染 |
| **DOM 路由** | appendChild、insertBefore、removeChild | 将 DOM 插入到正确位置 |
| **元素标记** | createElement、querySelector | 识别元素归属 |
| **兼容性修复** | MutationObserver、compareDocumentPosition、parentNode | 处理代理对象兼容性 |

### 补丁执行时机

```typescript
// 应用挂载时
patchAtMounting(appName, elementGetter, sandbox, scopedCSS)

// 应用启动时
patchAtBootstrapping(appName, elementGetter, sandbox, scopedCSS)

// 应用卸载时
freer()  // 清理所有补丁和副作用
```

---

## 总结

qiankun 通过补丁机制解决了微前端场景下的多个核心问题：

1. ✅ **副作用管理**：统一记录和清理定时器、事件监听器
2. ✅ **样式隔离**：通过 CSS 作用域前缀实现样式隔离
3. ✅ **DOM 隔离**：将动态 DOM 操作路由到子应用容器
4. ✅ **脚本隔离**：确保脚本在正确的沙箱环境中执行
5. ✅ **兼容性处理**：处理代理对象与浏览器 API 的兼容性问题

这些补丁共同确保了多个微应用可以在同一个页面中安全、隔离地运行。

