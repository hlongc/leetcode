# qiankun 微前端框架核心原理深度解析

## 一、核心架构概览

### 1.1 qiankun 的定位和使命

qiankun 是一个**基于 single-spa 的企业级微前端解决方案**，它不是从零开始的框架，而是对 single-spa 的增强和扩展。

```
┌─────────────────────────────────────────────────────────────────┐
│                      主应用（Main App）                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         qiankun 框架核心（基于 single-spa）              │   │
│  │  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐  │   │
│  │  │ registerMicro  │  │    start    │  │ loadMicroApp │  │   │
│  │  │    Apps        │  │             │  │              │  │   │
│  │  └────────────────┘  └─────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              核心增强功能（vs single-spa）                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │HTML Entry│ │Sandbox隔离│ │样式隔离   │ │预加载      │   │   │
│  │  │Mode      │ │(Proxy)   │ │机制      │ │策略      │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  React   │  │   Vue    │  │ Angular  │  │ HTML App │        │
│  │ MicroApp │  │ MicroApp │  │MicroApp  │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、核心工作流程（从 registerMicroApps 入手）

### 2.1 应用注册流程

#### 入口函数：`registerMicroApps`

```typescript
// src/apis.ts 第 225-268 行
export function registerMicroApps<T extends ObjectType>(
  apps: Array<RegistrableApp<T>>,
  lifeCycles?: FrameworkLifeCycles<T>,
) {
  // 步骤1：过滤已注册应用，避免重复注册
  const unregisteredApps = apps.filter(
    (app) => !microApps.some((registeredApp) => registeredApp.name === app.name)
  );

  // 步骤2：合并到已注册应用列表
  microApps = [...microApps, ...unregisteredApps];

  // 步骤3：为每个应用调用 single-spa 的注册
  unregisteredApps.forEach((app) => {
    const { name, activeRule, loader = noop, props, ...appConfig } = app;

    registerApplication({
      name,
      app: async () => {
        // 关键：在应用真正加载前等待框架启动
        await frameworkStartedDefer.promise;
        
        // 调用 qiankun 的核心加载函数
        const { mount, ...otherConfigs } = (
          await loadApp({ name, props, ...appConfig }, frameworkConfiguration, lifeCycles)
        )();

        // 包装 mount 钩子，处理 loading 状态
        return {
          mount: [
            async () => loader(true),
            ...toArray(mount),
            async () => loader(false)
          ],
          ...otherConfigs,
        };
      },
      // 定义应用激活规则
      activeWhen: activeRule,
      // 传递自定义属性
      customProps: props,
    });
  });
}
```

**关键设计特点：**

1. **延迟加载**：应用不会立即加载，而是等待框架启动完毕（`frameworkStartedDefer.promise`）
2. **配置缓存**：每个应用只注册一次，重复调用会自动去重
3. **loading 状态管理**：自动处理应用加载前后的 loading 状态
4. **生命周期钩子组合**：支持全局生命周期钩子和应用级别的钩子

---

### 2.2 框架启动流程

#### 入口函数：`start`

```typescript
// src/apis.ts 第 528-553 行
export function start(opts: FrameworkConfiguration = {}) {
  // 步骤1：合并配置和默认配置
  frameworkConfiguration = { 
    prefetch: true,      // 启用预加载
    singular: true,      // 单例模式（同时只运行一个应用）
    sandbox: true,       // 启用沙箱
    ...opts 
  };

  const { prefetch, urlRerouteOnly = defaultUrlRerouteOnly, ...importEntryOpts } = frameworkConfiguration;

  // 步骤2：如果启用预加载，执行预加载策略
  if (prefetch) {
    doPrefetchStrategy(microApps, prefetch, importEntryOpts);
  }

  // 步骤3：自动降级处理低版本浏览器兼容性
  frameworkConfiguration = autoDowngradeForLowVersionBrowser(frameworkConfiguration);

  // 步骤4：启动 single-spa 路由系统
  startSingleSpa({ urlRerouteOnly });
  started = true;

  // 步骤5：释放信号，通知所有等待中的应用可以开始加载
  frameworkStartedDefer.resolve();
}
```

**核心机制：**
- **延迟启动模式**：确保注册和启动的正确顺序
- **预加载优化**：根据网络状况自动调整预加载策略
- **浏览器兼容性**：自动检测浏览器能力并降级配置

---

## 三、应用加载核心：loadApp

### 3.1 加载流程概览

```typescript
// src/loader.ts 第 376-607 行
export async function loadApp<T extends ObjectType>(
  app: LoadableApp<T>,
  configuration: FrameworkConfiguration = {},
  lifeCycles?: FrameworkLifeCycles<T>,
): Promise<ParcelConfigObjectGetter>
```

**返回值设计特点**：
- 返回一个 **Getter 函数**，而不是直接返回配置对象
- 这个 Getter 支持应用在不同容器间的**重新挂载**
- 每次调用 Getter 时可以传入新的容器参数

### 3.2 加载的6大步骤

#### 步骤1：HTML Entry - 加载应用资源

```typescript
// 使用 import-html-entry 库
const { template, execScripts, assetPublicPath, getExternalScripts } = 
  await importEntry(entry, importEntryOpts);

// 预加载外部脚本
await getExternalScripts();
```

**工作原理**：
- 解析应用的 HTML 入口
- 自动提取 `<script>` 和 `<link>` 资源
- 支持在线 CDN 资源和本地资源
- 返回模板字符串和脚本执行器

**vs single-spa 的增强**：
- single-spa 需要手动配置 scripts 和 styles
- qiankun 自动从 HTML 解析，降低配置成本

---

#### 步骤2：单例模式处理 - 等待前一个应用卸载

```typescript
// 在单例模式下，确保新应用加载前，旧应用已完全卸载
if (await validateSingularMode(singular, app)) {
  await (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise);
}
```

**意义**：
- 防止两个应用同时运行时的内存泄漏和事件冲突
- 支持动态单例模式判断（支持函数式判断逻辑）

---

#### 步骤3：样式隔离 - 创建应用元素

```typescript
function createElement(
  appContent: string,
  strictStyleIsolation: boolean,
  scopedCSS: boolean,
  appInstanceId: string,
): HTMLElement {
  // 创建容器
  const containerElement = document.createElement('div');
  containerElement.innerHTML = appContent;
  const appElement = containerElement.firstChild as HTMLElement;
  
  // 方案1：Shadow DOM（严格隔离）
  if (strictStyleIsolation && supportShadowDOM) {
    const shadow = appElement.attachShadow({ mode: 'open' });
    shadow.innerHTML = innerHTML;
  }
  
  // 方案2：Scoped CSS（实验性，推荐）
  if (scopedCSS) {
    appElement.setAttribute(css.QiankunCSSRewriteAttr, appInstanceId);
    // 处理所有 style 标签，添加作用域前缀
    const styleNodes = appElement.querySelectorAll('style');
    forEach(styleNodes, (stylesheetElement) => {
      css.process(appElement, stylesheetElement, appInstanceId);
    });
  }
  
  return appElement;
}
```

**两种隔离方案对比**：

| 方案 | 实现方式 | 隔离程度 | 兼容性 | 使用场景 |
|-----|---------|---------|------|---------|
| **strictStyleIsolation** | Shadow DOM | 完全隔离 | 现代浏览器 | 样式冲突严重的场景 |
| **experimentalStyleIsolation** | Scoped CSS | 属性选择器 | 所有浏览器 | 大多数场景（推荐） |

**Scoped CSS 原理**：
```css
/* 原始样式 */
h1 { color: red; }

/* 转换后（使用组合选择器） */
div[data-qiankun="app1"] h1 { color: red; }

/* 对于根选择器（html/body/:root），直接替换 */
body { margin: 0; }
/* 转换后 */
div[data-qiankun="app1"] { margin: 0; }
```

**关键实现细节**（来自 css.ts 的 ruleStyle 方法）：
1. **根选择器替换**：`html { } → div[data-qiankun="app-name"] { }`
2. **组合选择器处理**：`html body → ` (去掉 html 前缀)
3. **普通选择器插入前缀**：`.btn { } → div[data-qiankun="app-name"] .btn { }`
4. **分组选择器处理**：`div, body { } → div[data-qiankun="app-name"] div, div[data-qiankun="app-name"] { }`
5. **媒体查询内递归处理**：`@media (max-width: 300px) { .btn { } } → @media (max-width: 300px) { div[data-qiankun="app-name"] .btn { } }`

---

#### 步骤4：创建沙箱 - 应用运行环境隔离

```typescript
let global = globalContext;
let mountSandbox = () => Promise.resolve();
let unmountSandbox = () => Promise.resolve();

if (sandbox) {
  // 创建沙箱容器
  sandboxContainer = createSandboxContainer(
    appInstanceId,
    initialAppWrapperGetter,
    scopedCSS,
    useLooseSandbox,      // 是否使用宽松沙箱
    excludeAssetFilter,
    global,
    speedySandbox,        // 是否启用 speedy 模式
  );
  
  // 使用沙箱的代理对象作为全局对象
  global = sandboxContainer.instance.proxy as typeof window;
  mountSandbox = sandboxContainer.mount;
  unmountSandbox = sandboxContainer.unmount;
}
```

**关键设计**：
- 沙箱是一个代理对象，拦截所有对 window 的操作
- 应用的所有全局变量修改都被记录在沙箱内部
- 不会污染主应用的全局作用域

---

#### 步骤5：执行脚本和获取生命周期

```typescript
// 执行应用的 JavaScript 代码
const scriptExports: any = await execScripts(
  global,                    // 使用沙箱的全局对象
  sandbox && !useLooseSandbox, // 严格全局模式
  {
    scopedGlobalVariables: speedySandbox ? cachedGlobals : [],
  }
);

// 提取生命周期函数
const { bootstrap, mount, unmount, update } = getLifecyclesFromExports(
  scriptExports,
  appName,
  global,
  sandboxContainer?.instance?.latestSetProp,
);
```

**执行顺序**：
1. 在沙箱全局对象中执行应用代码
2. 应用代码可以导出生命周期函数
3. 如果没有找到导出，会回退到全局变量查找

---

#### 步骤6：构建 Parcel Config 对象

```typescript
const parcelConfigGetter: ParcelConfigObjectGetter = (remountContainer) => {
  let appWrapperElement: HTMLElement | null;

  const parcelConfig: ParcelConfigObject = {
    name: appInstanceId,
    
    bootstrap: [
      // bootstrap 阶段的钩子链
    ],
    
    mount: [
      // 前置钩子1: 性能标记
      async () => { performanceMark(markName); },
      
      // 前置钩子2: 单例模式等待
      async () => {
        if (await validateSingularMode(singular, app) && prevAppUnmountedDeferred) {
          return prevAppUnmountedDeferred.promise;
        }
      },
      
      // 前置钩子3: 初始化 wrapper 元素
      async () => { appWrapperElement = initialAppWrapperElement; },
      
      // 前置钩子4: 渲染应用到容器
      async () => {
        appWrapperElement = createElement(...);
        render({ element: appWrapperElement, loading: true, container: remountContainer }, 'mounting');
      },
      
      // 前置钩子5: 挂载沙箱
      mountSandbox,
      
      // 前置钩子6: 执行应用前置钩子
      async () => execHooksChain(toArray(beforeMount), app, global),
      
      // 核心钩子：执行应用的 mount 生命周期
      async (props) => mount({
        ...props,
        container: appWrapperGetter(),
        setGlobalState,
        onGlobalStateChange
      }),
      
      // 后置钩子1: 隐藏 loading
      async () => render({ element: appWrapperElement, loading: false, container: remountContainer }, 'mounted'),
      
      // 后置钩子2: 执行应用后置钩子
      async () => execHooksChain(toArray(afterMount), app, global),
    ],
    
    unmount: [
      // 前置钩子: 执行应用卸载前钩子
      async () => execHooksChain(toArray(beforeUnmount), app, global),
      
      // 核心钩子：执行应用的 unmount 生命周期
      async (props) => unmount({ ...props, container: appWrapperGetter() }),
      
      // 卸载沙箱
      unmountSandbox,
      
      // 后置钩子1: 执行应用卸载后钩子
      async () => execHooksChain(toArray(afterUnmount), app, global),
      
      // 后置钩子2: 清理 DOM
      async () => {
        render({ element: null, loading: false, container: remountContainer }, 'unmounted');
        offGlobalStateChange(appInstanceId);
        appWrapperElement = null;
      },
      
      // 后置钩子3: 释放单例模式信号
      async () => {
        if (await validateSingularMode(singular, app) && prevAppUnmountedDeferred) {
          prevAppUnmountedDeferred.resolve();
        }
      },
    ],
  };

  return parcelConfig;
};
```

**生命周期钩子的组织**：
- **bootstrap**：应用初始化（只执行一次）
- **mount**：应用挂载（可执行多次）
- **unmount**：应用卸载（可执行多次）

---

## 四、沙箱隔离机制详解

### 4.1 三种沙箱类型

#### ProxySandbox（默认推荐）

```typescript
// src/sandbox/proxySandbox.ts
class ProxySandbox implements SandBox {
  // 假的 window 对象
  private fakeWindow: FakeWindow;
  
  // Proxy 代理对象
  private proxy: WindowProxy;
  
  constructor(appName: string, globalContext = window) {
    // 创建假的 window，作为 Proxy 的 target
    this.fakeWindow = Object.create(null);
    
    // 创建 Proxy 代理，拦截所有操作
    this.proxy = new Proxy(this.fakeWindow, {
      get: (target, prop, receiver) => {
        // 优先从 fakeWindow 读取
        if (prop in target) return target[prop];
        // 回退到真实 window
        return Reflect.get(globalContext, prop, globalContext);
      },
      
      set: (target, prop, value, receiver) => {
        // 写入到 fakeWindow，不污染真实 window
        target[prop] = value;
        return true;
      },
      
      defineProperty: (target, prop, descriptor) => {
        // 定义属性到 fakeWindow
        return Reflect.defineProperty(target, prop, descriptor);
      },
      
      has: (target, prop) => {
        // 检查属性是否存在
        return prop in target || prop in globalContext;
      },
    });
  }
  
  active() {
    // 激活沙箱
  }
  
  inactive() {
    // 卸载沙箱
  }
}
```

**特点**：
- ✅ 支持多个应用同时运行
- ✅ 性能最好，无需快照恢复
- ✅ 完全隔离应用的全局变量
- ✅ 支持 speedy 模式（性能优化）

---

#### LegacySandbox（宽松沙箱）

使用场景：
- 启用 `sandbox: { loose: true }`
- 用于单例模式或特殊兼容场景

特点：
- 单一全局对象
- 应用间无法真正隔离
- 效率低，需要修改全局变量

---

#### SnapshotSandbox（快照沙箱）

使用场景：
- 浏览器不支持 Proxy（如 IE11）
- 自动降级选择

原理：
- 在 mount 时记录 window 快照
- 在 unmount 时恢复快照
- 完整但性能差

---

### 4.2 Sandbox 的挂载/卸载流程

```typescript
// src/sandbox/index.ts 第 116-162 行
return {
  instance: sandbox,
  
  async mount() {
    // 1. 激活沙箱
    sandbox.active();
    
    // 2. 重建 bootstrapping 阶段的副作用
    const sideEffectsRebuildersAtBootstrapping = sideEffectsRebuilders.slice(0, bootstrappingFreers.length);
    if (sideEffectsRebuildersAtBootstrapping.length) {
      sideEffectsRebuildersAtBootstrapping.forEach((rebuild) => rebuild());
    }
    
    // 3. 应用 mounting 阶段的补丁
    // 劫持全局事件监听、定时器等副作用
    mountingFreers = patchAtMounting(appName, elementGetter, sandbox, scopedCSS, excludeAssetFilter, speedySandBox);
    
    // 4. 重建 mounting 阶段的副作用
    const sideEffectsRebuildersAtMounting = sideEffectsRebuilders.slice(bootstrappingFreers.length);
    if (sideEffectsRebuildersAtMounting.length) {
      sideEffectsRebuildersAtMounting.forEach((rebuild) => rebuild());
    }
    
    // 清理
    sideEffectsRebuilders = [];
  },
  
  async unmount() {
    // 记录副作用的重建器，用于下次 mount 时恢复
    sideEffectsRebuilders = [...bootstrappingFreers, ...mountingFreers].map((free) => free());
    
    // 停用沙箱
    sandbox.inactive();
  }
};
```

**核心逻辑**：
- **Bootstrapping 阶段**：一次性初始化
- **Mounting 阶段**：每次 mount 时重新应用
- **副作用管理**：记录并重建事件监听、定时器等

---

## 五、vs single-spa 的核心增强

### 5.1 对比表

| 功能 | single-spa | qiankun |
|------|-----------|---------|
| **应用加载** | 手动配置 scripts/styles | HTML Entry 自动解析 |
| **沙箱隔离** | ❌ 无 | ✅ 三种沙箱（Proxy/Snapshot/Legacy） |
| **样式隔离** | ❌ 无 | ✅ Shadow DOM + Scoped CSS |
| **全局变量污染** | ❌ 无保护 | ✅ Proxy 完全隔离 |
| **预加载** | ❌ 无 | ✅ 智能预加载策略 |
| **生命周期钩子** | bootstrap/mount/unmount | + beforeLoad/afterMount/beforeUnmount/afterUnmount |
| **应用间通信** | ❌ 无 | ✅ 全局状态管理（deprecated） |
| **错误处理** | 基础 | ✅ 完整错误边界 |
| **浏览器兼容性** | 自动降级能力差 | ✅ 自动降级（Proxy → Snapshot） |
| **事件隔离** | ❌ 应用事件会冒泡 | ✅ addEventListener/removeEventListener 拦截 |
| **定时器隔离** | ❌ 应用定时器不清理 | ✅ 自动清理 setTimeout/setInterval |

---

### 5.2 关键增强 #1: HTML Entry 模式

#### single-spa 的方式（繁琐）

```javascript
registerApplication({
  name: '@org/navbar',
  app: () => System.import('@org/navbar'),
  activeWhen: '/navbar'
});
```

需要手动配置：
```javascript
{
  scripts: [
    'https://unpkg.com/@org/navbar@latest/dist/navbar.js'
  ],
  styles: [
    'https://unpkg.com/@org/navbar@latest/dist/navbar.css'
  ]
}
```

#### qiankun 的方式（简洁）

```typescript
registerMicroApps([{
  name: 'react-app',
  entry: '//localhost:8080',  // 直接指向 HTML 入口
  container: '#subapp-container',
  activeRule: '/react',
}]);
```

**工作原理**：
```javascript
// import-html-entry 自动：
// 1. 加载 HTML 文件
// 2. 解析 <script> 和 <link> 标签
// 3. 获取所有资源的 URL
// 4. 返回执行器给 qiankun
```

---

### 5.3 关键增强 #2: JavaScript 沙箱隔离

#### single-spa 没有沙箱

应用代码直接运行在全局作用域：
```javascript
// app1 代码
window.foo = 'app1';
window.addEventListener('load', handler1);

// app2 代码
window.foo = 'app2';  // ❌ 污染 app1 的 window.foo
```

#### qiankun 的 Proxy 沙箱

```typescript
class ProxySandbox {
  constructor(appName) {
    // 为每个应用创建独立的全局对象
    this.fakeWindow = Object.create(null);
    
    this.proxy = new Proxy(this.fakeWindow, {
      get: (target, prop) => {
        // 应用读取的变量优先从自己的沙箱读取
        if (prop in target) return target[prop];
        // 访问浏览器原生属性从真实 window 读取
        return window[prop];
      },
      
      set: (target, prop, value) => {
        // 应用修改的全局变量保存在自己的沙箱中
        target[prop] = value;
        // 真实 window 不受影响
        return true;
      }
    });
  }
}

// 结果：
// app1 中 window.foo = 'app1'  → 存储在 app1 的 fakeWindow
// app2 中 window.foo = 'app2'  → 存储在 app2 的 fakeWindow
// 真实 window.foo 保持未定义
```

**隔离效果**：
```javascript
┌─────────────┐
│   真实 window │（未被污染）
└─────────────┘
     ↑  ↑  ↑
     │  │  │
  ┌──┘  │  └──┐
  │     │     │
┌──────┐ │ ┌──────┐
│app1  │ │ │app2  │
│沙箱  │ │ │沙箱  │
└──────┘ │ └──────┘
     ┌───┴────┐
     │ 共享属性 │（location等）
     └────────┘
```

---

### 5.4 关键增强 #3: CSS 样式隔离

#### single-spa 无样式隔离

```css
/* app1 的样式 */
h1 { color: red; }

/* app2 的样式 */
h1 { color: blue; }  /* ❌ 覆盖 app1 的样式 */
```

#### qiankun 的两种隔离方案

**方案1：Scoped CSS（推荐）**

```css
/* 原始样式 */
h1 { color: red; }

/* 自动转换（使用属性选择器前缀） */
div[data-qiankun-app-id="app1"] h1 { color: red; }
```

实现方式:
```typescript
function processCss(styleElement, appInstanceId) {
  const css = styleElement.textContent;
  const prefix = `div[data-qiankun-app-id="${appInstanceId}"]`;
  
  // 正则表达式为每个选择器添加前缀
  const scopedCss = css.replace(/([^{,]+)(\{|,)/g, (match, selector, delimiter) => {
    // 处理根选择器（html/body/:root）
    if (/^\s*(html|body|:root)\s*$/.test(selector)) {
      return `${prefix}${delimiter}`;
    }
    // 处理普通选择器
    return `${prefix} ${selector.trim()}${delimiter}`;
  });
  
  styleElement.textContent = scopedCss;
}
```

**方案2：Shadow DOM（最严格）**

```typescript
const shadow = appElement.attachShadow({ mode: 'open' });
shadow.innerHTML = appContent;

// 样式完全隔离在 Shadow DOM 内部
// 不受任何外部样式影响
```

---

### 5.5 关键增强 #4: 预加载策略

#### single-spa 无预加载

应用在激活时才开始加载，用户需要等待。

#### qiankun 的智能预加载

```typescript
// start(opts) 中
if (prefetch) {
  doPrefetchStrategy(microApps, prefetch, importEntryOpts);
}
```

**三种预加载策略**：

```typescript
// 1. 自动预加载（默认）
start({ prefetch: true });
// → 第一个应用挂载后预加载其他应用

// 2. 立即全量预加载
start({ prefetch: 'all' });
// → 应用启动时立即加载所有应用

// 3. 自定义预加载
start({ 
  prefetch: (apps) => {
    // 返回要预加载的应用列表
    return apps.filter(app => app.name !== 'heavy-app');
  }
});
```

**网络自适应**：
```typescript
// 检测网络状况
const isSlowNetwork = navigator.connection
  ? navigator.connection.saveData ||
    (navigator.connection.type !== 'wifi' &&
      navigator.connection.type !== 'ethernet' &&
      /([23])g/.test(navigator.connection.effectiveType))
  : false;

if (isSlowNetwork) {
  // 慢速网络下禁用预加载
  return;
}

// 使用 requestIdleCallback 在浏览器空闲时预加载
requestIdleCallback(() => {
  prefetch(entry, opts);
});
```

---

### 5.6 关键增强 #5: 完整的生命周期钩子

#### single-spa 只有3个钩子

```typescript
{
  bootstrap: () => {},  // 初始化
  mount: () => {},      // 挂载
  unmount: () => {}     // 卸载
}
```

#### qiankun 提供9个钩子

```typescript
// 全局框架级钩子
registerMicroApps(apps, {
  beforeLoad: (app) => {},      // 应用加载前
  afterLoad: (app) => {},       // 应用加载后
  beforeMount: (app) => {},     // 应用挂载前
  afterMount: (app) => {},      // 应用挂载后
  beforeUnmount: (app) => {},   // 应用卸载前
  afterUnmount: (app) => {},    // 应用卸载后
});

// 应用级钩子
{
  bootstrap: () => {},  // 初始化（应用导出）
  mount: () => {},      // 挂载（应用导出）
  unmount: () => {}     // 卸载（应用导出）
}
```

**钩子执行顺序**：
```
加载过程：
beforeLoad
  ↓
加载应用资源
  ↓
afterLoad
  ↓
bootstrap（仅第一次）

挂载过程：
beforeMount
  ↓
mount
  ↓
afterMount
  ↓
初始化单例模式信号

卸载过程：
beforeUnmount
  ↓
unmount
  ↓
afterUnmount
  ↓
释放单例模式信号
```

---

## 六、高级特性

### 6.1 单例模式 vs 多实例模式

#### 单例模式（singular: true）

```typescript
start({
  singular: true  // 同时只能运行一个应用
});

// 示例时间线：
// t1: app1 mount
// t2: app1 → app2（app1 自动卸载）
// t3: app2 mount
// 【任何时刻只有一个应用在运行】
```

**优势**：
- 内存占用少
- 全局状态管理简单
- 默认配置合理

**实现原理**：
```typescript
if (await validateSingularMode(singular, app)) {
  // 等待前一个应用完全卸载
  await (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise);
  
  // 创建新的卸载信号
  prevAppUnmountedDeferred = new Deferred<void>();
}

// 卸载完成后释放信号
prevAppUnmountedDeferred.resolve();
```

---

#### 多实例模式（singular: false）

```typescript
// 使用 loadMicroApp 手动加载
loadMicroApp({
  name: 'app1',
  entry: '//localhost:8080',
  container: '#container1'
}, { singular: false });

loadMicroApp({
  name: 'app2',
  entry: '//localhost:8081',
  container: '#container2'
}, { singular: false });

// 【同时运行多个应用】
```

**关键处理**：
```typescript
// 同一容器上的多个应用挂载时的处理
const wrapParcelConfigForRemount = (config) => {
  const mount = [
    async () => {
      // 获取前面的应用实例
      const prevLoadMicroApps = containerMicroApps.slice(0, containerMicroApps.indexOf(microApp));
      
      // 等待所有前面的应用卸载完成
      await Promise.all(prevLoadMicroApps.map((v) => v.unmountPromise));
    },
    ...toArray(config.mount),
  ];
  
  return {
    ...config,
    mount,
    // 跳过 bootstrap（已初始化过）
    bootstrap: () => Promise.resolve(),
  };
};
```

---

### 6.2 全局状态管理（已弃用）

```typescript
// 主应用初始化
const actions = initGlobalState({
  user: null,
  theme: 'light'
});

// 子应用监听
export async function mount(props) {
  const { onGlobalStateChange, setGlobalState } = props;
  
  onGlobalStateChange((state, prevState) => {
    console.log('状态变化:', state);
  });
  
  // 修改全局状态
  setGlobalState({ user: { name: 'John' } });
}
```

**注意**：
- ⚠️ 将在 qiankun 3.0 中移除
- 建议使用 Redux、MobX 等独立状态管理库

---

## 七、重要的内部机制

### 7.1 Speedy 模式（性能优化）

```typescript
// 配置启用
start({
  sandbox: {
    speedy: true  // 默认启用
  }
});
```

**原理**：
- 缓存全局变量的引用
- 避免每次都通过 Proxy 查询
- 大幅提升性能

```typescript
// speedy 模式下的优化
const cachedGlobals = ['document', 'window', 'location', ...];

// 应用加载时
const scopedGlobalVariables = speedy ? cachedGlobals : [];

// execScripts 使用缓存加速全局变量访问
await execScripts(global, true, {
  scopedGlobalVariables
});
```

---

### 7.2 浏览器兼容性自动降级

```typescript
function autoDowngradeForLowVersionBrowser(configuration) {
  if (sandbox) {
    // 检查 Proxy 支持
    if (!window.Proxy) {
      console.warn('Missing window.Proxy, proxySandbox will degenerate into snapshotSandbox');
      // ProxySandbox → SnapshotSandbox
      return {
        ...configuration,
        sandbox: { ...sandbox, loose: true }
      };
    }
    
    // 检查 const 解构支持（用于 speedy 模式）
    if (!isConstDestructAssignmentSupported()) {
      console.warn('Speedy mode will turn off as const destruct assignment not supported');
      // 禁用 speedy 模式
      return {
        ...configuration,
        sandbox: { ...sandbox, speedy: false }
      };
    }
  }
  
  return configuration;
}
```

---

## 八、完整工作示例

### 8.1 主应用

```typescript
// main.js
import { registerMicroApps, start } from 'qiankun';

// 注册微应用
registerMicroApps([
  {
    name: 'react-app',
    entry: '//localhost:8080',
    container: '#react-container',
    activeRule: '/react',
    props: {
      apiBaseUrl: 'https://api.example.com'
    }
  },
  {
    name: 'vue-app',
    entry: '//localhost:8081',
    container: '#vue-container',
    activeRule: '/vue',
  }
], {
  beforeLoad: (app) => console.log(`App ${app.name} is loading...`),
  beforeMount: (app) => console.log(`App ${app.name} is mounting...`),
  afterMount: (app) => console.log(`App ${app.name} mounted!`),
});

// 启动 qiankun
start({
  prefetch: 'all',        // 预加载所有应用
  singular: true,         // 单例模式
  sandbox: {
    strictStyleIsolation: false,
    experimentalStyleIsolation: true,  // 启用 Scoped CSS
  }
});
```

### 8.2 子应用（React 示例）

```typescript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

let root;

// qiankun 生命周期
export async function bootstrap() {
  console.log('React 应用 bootstrapped');
}

export async function mount(props) {
  console.log('React 应用 mounting');
  
  // props 包含来自主应用的数据
  const { container, apiBaseUrl } = props;
  
  root = ReactDOM.createRoot(container);
  root.render(<App apiBaseUrl={apiBaseUrl} />);
}

export async function unmount() {
  console.log('React 应用 unmounting');
  root?.unmount();
}
```

---

## 九、性能优化建议

### 9.1 预加载策略优化

```typescript
start({
  // 仅预加载必要的应用
  prefetch: (apps) => {
    return apps.filter(app => 
      app.name !== 'heavy-app' &&
      app.name !== 'rarely-used-app'
    );
  }
});
```

### 9.2 沙箱性能优化

```typescript
start({
  sandbox: {
    speedy: true,                          // 启用 speedy 模式
    experimentalStyleIsolation: true,      // 使用 Scoped CSS（比 Shadow DOM 快）
    strictStyleIsolation: false,           // 不使用 Shadow DOM
  }
});
```

### 9.3 应用加载优化

```typescript
registerMicroApps([
  {
    name: 'app',
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app',
    
    // 自定义加载器
    loader: (loading) => {
      if (loading) {
        // 显示进度条
        showProgressBar();
      } else {
        hideProgressBar();
      }
    }
  }
]);
```

---

## 十、总结：qiankun 对 single-spa 的核心价值

| 维度 | single-spa | qiankun | 体现的价值 |
|------|-----------|---------|----------|
| **易用性** | 低 | 高 | 开箱即用，配置简单 |
| **隔离能力** | 无 | 完善 | 真正的应用隔离 |
| **样式管理** | 无 | 完善 | CSS 不冲突 |
| **资源加载** | 手动 | 自动 | 降低配置成本 |
| **性能优化** | 无 | 完善 | 预加载、speedy 模式等 |
| **生态完整性** | 基础 | 完整 | 提供完整的微前端解决方案 |
| **企业适用** | 不适合 | 适合 | 真正企业级方案 |

**总结**：
- qiankun 不是对 single-spa 的替代，而是**增强**
- 它提供了企业级微前端开发所需的完整功能
- 在 single-spa 之上进行了重要的工程化封装
- 使微前端开发变得**更简单、更安全、更高效**
