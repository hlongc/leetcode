# qiankun-head 标签详解

## 📌 问题背景

### 浏览器的 HTML 解析规则

浏览器在解析 HTML 时，有一个重要的规则：

**`<head>` 和 `<body>` 标签必须是 `<html>` 标签的直接子元素，否则浏览器会自动清除或忽略它们。**

### qiankun 中的问题场景

在 qiankun 中，微应用的 HTML 模板会被包装在一个容器 `<div>` 中：

```html
<!-- 微应用的原始 HTML -->
<html>
  <head>
    <title>子应用</title>
    <link rel="stylesheet" href="app.css">
  </head>
  <body>
    <div id="root">应用内容</div>
  </body>
</html>
```

**qiankun 包装后：**

```html
<!-- 主应用的 HTML -->
<html>
  <head>
    <title>主应用</title>
  </head>
  <body>
    <div id="subapp-container">
      <!-- ⚠️ 微应用的 HTML 被包装在这里 -->
      <div id="__qiankun_microapp_wrapper_for_react_app__">
        <head>  <!-- ❌ 浏览器会清除这个 head！ -->
          <title>子应用</title>
          <link rel="stylesheet" href="app.css">
        </head>
        <body>  <!-- ❌ 浏览器也会清除这个 body！ -->
          <div id="root">应用内容</div>
        </body>
      </div>
    </div>
  </body>
</html>
```

**问题：**
- 微应用的 `<head>` 和 `<body>` 不在 `<html>` 的直接子元素位置
- 浏览器会自动清除这些标签本身
- 但会保留标签内的子元素（如 `<style>`、`<link>`、`<script>` 等），这些子元素会"掉出来"到父容器中
- 虽然样式和脚本仍然可以正常加载，但会导致 DOM 结构混乱，影响样式作用域和脚本执行上下文

## 🔧 qiankun 的解决方案

### 1. 替换为自定义标签

qiankun 将 `<head>` 标签替换为 `<qiankun-head>` 自定义标签：

```typescript
// src/utils.ts: 382-404
export function getDefaultTplWrapper(name: string, sandboxOpts: FrameworkConfiguration['sandbox']) {
  return (tpl: string) => {
    let tplWithSimulatedHead: string;

    if (tpl.indexOf('<head>') !== -1) {
      // ⭐ 将 <head> 替换为 <qiankun-head>
      tplWithSimulatedHead = tpl
        .replace('<head>', `<${qiankunHeadTagName}>`)
        .replace('</head>', `</${qiankunHeadTagName}>`);
    } else {
      // 某些模板可能没有 head 标签，需要添加一个
      tplWithSimulatedHead = `<${qiankunHeadTagName}></${qiankunHeadTagName}>${tpl}`;
    }

    // 包装模板
    return `<div id="${getWrapperId(name)}" ...>${tplWithSimulatedHead}</div>`;
  };
}
```

**处理后的结构：**

```html
<div id="__qiankun_microapp_wrapper_for_react_app__">
  <!-- ✅ 使用自定义标签，浏览器不会清除 -->
  <qiankun-head>
    <title>子应用</title>
    <link rel="stylesheet" href="app.css">
  </qiankun-head>
  
  <div id="root">应用内容</div>
</div>
```

### 2. 劫持 document.head 访问

在沙箱中，qiankun 会劫持 `document.head` 的访问，让它返回 `<qiankun-head>` 元素：

```typescript
// src/sandbox/patchers/dynamicAppend/common.ts: 38-40
export const getAppWrapperHeadElement = (appWrapper: Element | ShadowRoot): Element => {
  return appWrapper.querySelector(qiankunHeadTagName)!;
};
```

**在 document 代理中：**

```typescript
// 伪代码示例
const proxyDocument = new Proxy(document, {
  get: (target, prop) => {
    switch (prop) {
      case 'head': {
        // ⭐ 返回容器的 qiankun-head 元素，而不是真实的 document.head
        return getAppWrapperHeadElement(appWrapper);
      }
      case 'querySelector': {
        return function(selector: string) {
          if (selector === 'head') {
            // ⭐ 查询 head 时，返回容器的 qiankun-head
            return getAppWrapperHeadElement(appWrapper);
          }
          return target.querySelector.call(target, selector);
        };
      }
      // ...
    }
  }
});
```

### 3. 劫持 appendChild 等方法

当子应用调用 `document.head.appendChild(style)` 时，qiankun 会拦截这个操作：

```typescript
// src/sandbox/patchers/dynamicAppend/common.ts: 271
const mountDOM = target === 'head' ? getAppWrapperHeadElement(appWrapper) : appWrapper;

// 将样式添加到 qiankun-head 中，而不是真实的 document.head
const result = rawDOMAppendOrInsertBefore.call(mountDOM, stylesheetElement, referenceNode);
```

## 🎯 完整流程示例

### 场景：子应用动态添加样式

**子应用代码：**

```javascript
// 子应用中的代码
const style = document.createElement('style');
style.textContent = '.app { color: red; }';
document.head.appendChild(style);  // ⭐ 子应用正常使用 document.head
```

**qiankun 的处理流程：**

```
1. 子应用调用 document.head
   ↓
2. 沙箱代理拦截，返回 <qiankun-head> 元素
   ↓
3. 子应用调用 document.head.appendChild(style)
   ↓
4. qiankun 劫持 appendChild，将 style 添加到 <qiankun-head> 中
   ↓
5. 如果启用了 scopedCSS，还会改写样式选择器
   ↓
6. 样式只影响容器内的内容，不会污染主应用
```

**最终 DOM 结构：**

```html
<div id="__qiankun_microapp_wrapper_for_react_app__">
  <qiankun-head>
    <!-- ✅ 子应用的样式被添加到这里 -->
    <style data-qiankun="react-app">
      div[data-qiankun="react-app"] .app { color: red; }
    </style>
  </qiankun-head>
  
  <div id="root" data-qiankun="react-app">
    <div class="app">应用内容</div>
  </div>
</div>
```

## 🔍 为什么浏览器会清除 head？

### HTML 规范要求

根据 HTML 规范，`<head>` 和 `<body>` 标签有特殊的位置要求：

1. **必须是 `<html>` 的直接子元素**
2. **每个文档只能有一个 `<head>` 和一个 `<body>`**
3. **如果位置不正确，浏览器会忽略或清除这些标签**

### 实际测试

```html
<!-- 测试 1: 正常情况 -->
<html>
  <head>✅ 正常</head>
  <body>✅ 正常</body>
</html>

<!-- 测试 2: head 在 div 中 -->
<html>
  <body>
    <div>
      <head>❌ 浏览器会清除</head>
    </div>
  </body>
</html>

<!-- 测试 3: 自定义标签 -->
<html>
  <body>
    <div>
      <qiankun-head>✅ 浏览器不会清除</qiankun-head>
    </div>
  </body>
</html>
```

### 浏览器行为

```javascript
// 测试代码
const div = document.createElement('div');
div.innerHTML = '<head><title>Test</title></head><body><div>Content</div></body>';

console.log(div.querySelector('head'));  // null ❌ 被清除了
console.log(div.querySelector('body'));   // null ❌ 被清除了
console.log(div.innerHTML);                // '<div>Content</div>' 只剩下内容

// 使用自定义标签
div.innerHTML = '<qiankun-head><title>Test</title></qiankun-head><div>Content</div>';

console.log(div.querySelector('qiankun-head'));  // <qiankun-head>...</qiankun-head> ✅ 正常
```

## 💡 设计优势

### 1. 隔离性

```html
<!-- 主应用的 head -->
<head>
  <link rel="stylesheet" href="main.css">
</head>

<!-- 子应用的 head（qiankun-head） -->
<qiankun-head>
  <link rel="stylesheet" href="subapp.css">
</qiankun-head>
```

**优势：**
- 子应用的样式不会影响主应用
- 主应用的样式不会影响子应用（如果启用了样式隔离）

### 2. 兼容性

```javascript
// 子应用代码无需修改
document.head.appendChild(style);  // ✅ 正常工作

// qiankun 自动处理
// 子应用感知不到使用的是 qiankun-head
```

### 3. 可管理性

```typescript
// qiankun 可以统一管理所有子应用的 head 内容
const headElement = getAppWrapperHeadElement(appWrapper);

// 可以查询、修改、删除子应用的 head 内容
headElement.querySelectorAll('style').forEach(style => {
  // 处理样式
});
```

## 🎨 实际应用场景

### 场景 1: 动态样式注入

```javascript
// 子应用使用 style-loader 动态注入样式
import './styles.css';

// style-loader 内部会执行：
const style = document.createElement('style');
style.textContent = cssContent;
document.head.appendChild(style);

// qiankun 自动将样式添加到 qiankun-head 中
```

### 场景 2: 动态脚本加载

```javascript
// 子应用动态加载脚本
const script = document.createElement('script');
script.src = 'https://cdn.example.com/library.js';
document.head.appendChild(script);

// qiankun 会拦截并处理脚本执行
```

### 场景 3: Meta 标签管理

```javascript
// 子应用添加 meta 标签
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width';
document.head.appendChild(meta);

// qiankun 将 meta 添加到 qiankun-head 中
// 注意：某些 meta 标签可能需要特殊处理
```

## ⚠️ 注意事项

### 1. body 标签的处理

qiankun 对 `<body>` 标签也有类似处理，但方式不同：

```html
<!-- body 标签不会被替换，而是直接使用容器 -->
<div id="__qiankun_microapp_wrapper_for_react_app__">
  <!-- body 的内容直接放在这里 -->
  <div id="root">应用内容</div>
</div>
```

**原因：**
- body 的内容可以直接放在容器中
- 不需要额外的 body 占位符

### 2. 样式隔离的影响

如果启用了 `scopedCSS`（即 `experimentalStyleIsolation`），qiankun 会改写样式：

```css
/* 原始样式 */
.app { color: red; }

/* qiankun 改写后 */
div[data-qiankun="react-app"] .app { color: red; }
```

**第360行的含义：**
- `div[data-qiankun="react-app"] .app` 组合了**属性选择器 + 后代选择器**
- 表示：在 `data-qiankun="react-app"` 的容器内部，选择带有 `class="app"` 的元素
- 这是 qiankun 的 **scoped CSS** 机制，通过给容器添加前缀实现样式隔离

**生效条件：**

1. **启用配置**：在 qiankun 启动时启用 `experimentalStyleIsolation`
   ```javascript
   start({
     sandbox: {
       experimentalStyleIsolation: true  // ⭐ 必须启用
     }
   });
   ```

2. **容器自动标记**：qiankun 会自动给容器元素添加 `data-qiankun` 属性
   ```html
   <!-- qiankun 自动添加属性 -->
   <div id="subapp-container" data-qiankun="react-app">
     <!-- 子应用内容 -->
   </div>
   ```
   源码位置：`src/loader.ts: 186`

3. **样式自动改写**：所有 `<style>` 标签中的选择器都会被改写
   - 原始：`.app { color: red; }`
   - 改写后：`div[data-qiankun="react-app"] .app { color: red; }`
   - 源码位置：`src/sandbox/patchers/css.ts: 325-332`

4. **容器内匹配**：只有在容器内部的元素才会被命中
   ```html
   <!-- ✅ 会应用样式（红色） -->
   <div data-qiankun="react-app">
     <div class="app">内容</div>
   </div>

   <!-- ❌ 不会应用样式（不在容器内） -->
   <div class="app">内容</div>
   ```

**工作原理：**
- qiankun 通过给所有选择器加上容器前缀限制作用域
- 只有挂载容器 `div[data-qiankun="react-app"]` 内的元素会匹配改写的样式
- 从而实现样式隔离，避免子应用样式污染主应用

### 3. Shadow DOM 模式

如果启用了 `strictStyleIsolation`（Shadow DOM），head 的处理会有所不同：

```html
<div id="__qiankun_microapp_wrapper_for_react_app__">
  #shadow-root (open)
    <qiankun-head>
      <style>/* 样式完全隔离 */</style>
    </qiankun-head>
    <div id="root">应用内容</div>
</div>
```

## 📚 相关代码位置

1. **常量定义**：`src/utils.ts: 361`
2. **模板包装**：`src/utils.ts: 382-404`
3. **head 元素获取**：`src/sandbox/patchers/dynamicAppend/common.ts: 38-40`
4. **appendChild 劫持**：`src/sandbox/patchers/dynamicAppend/common.ts: 206-369`

## 🎯 总结

**核心问题：**
- 浏览器会清除不在 `<html>` 直接子元素位置的 `<head>` 标签

**qiankun 的解决方案：**
1. 将 `<head>` 替换为 `<qiankun-head>` 自定义标签
2. 劫持 `document.head` 访问，返回 `<qiankun-head>` 元素
3. 劫持 `appendChild` 等方法，将内容添加到 `<qiankun-head>` 中

**优势：**
- ✅ 完全隔离子应用的样式和脚本
- ✅ 子应用代码无需修改
- ✅ 统一管理子应用的 head 内容

这个设计是 qiankun 实现样式隔离和资源管理的关键机制之一！

