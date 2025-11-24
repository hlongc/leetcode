# 问题9：qiankun 的应用注册流程是怎样的？registerMicroApps 函数做了哪些事情？

## 📌 函数签名

```typescript
// packages/qiankun/src/apis/registerMicroApps.ts: 16
export function registerMicroApps<T extends ObjectType>(
    apps: Array<RegistrableApp<T>>, 
    lifeCycles?: LifeCycles<T>
)
```

**参数说明：**
- `apps`: 要注册的微应用配置数组
- `lifeCycles`: 全局生命周期钩子（可选）

**RegistrableApp 结构：**

```typescript
{
    name: string;           // 应用名称（唯一）
    entry: string | {...};  // 应用入口（HTML URL 或配置对象）
    container: string | HTMLElement;  // 挂载容器
    activeRule: string | Function | Array;  // 激活规则
    loader?: Function;      // 加载状态回调
    props?: Object;         // 传递给子应用的数据
}
```

## 🎯 核心功能概述

registerMicroApps 做了三件核心的事：

1. **过滤重复注册**：同名应用只注册一次
2. **包装应用配置**：转换为 single-spa 格式
3. **委托给 single-spa**：调用 single-spa 的 registerApplication

## 📋 完整源码解析

```typescript
// packages/qiankun/src/apis/registerMicroApps.ts
export let started = false;

export const microApps: Array<RegistrableApp<Record<string, unknown>>> = [];
const frameworkConfiguration: AppConfiguration = {};

const frameworkStartedDefer = new Deferred<void>();

export function registerMicroApps<T extends ObjectType>(
    apps: Array<RegistrableApp<T>>, 
    lifeCycles?: LifeCycles<T>
) {
    // ===== 步骤1: 过滤已注册的应用 =====
    const unregisteredApps = apps.filter(
        (app) => !microApps.some((registeredApp) => registeredApp.name === app.name)
    );

    // ===== 步骤2: 保存到全局列表 =====
    microApps.push(...unregisteredApps);

    // ===== 步骤3: 逐个注册到 single-spa =====
    unregisteredApps.forEach((app) => {
        const { name, activeRule, loader = noop, props, entry, container } = app;

        registerApplication({
            name,
            // ⭐ app 是一个异步函数，返回生命周期对象
            app: async () => {
                loader(true);  // 显示 loading
                await frameworkStartedDefer.promise;  // 等待 start() 调用

                // 加载应用
                const { mount, ...otherMicroAppConfigs } = (
                    await loadApp({ name, entry, container, props }, frameworkConfiguration, lifeCycles)
                )(container);

                // 包装 mount 生命周期
                return {
                    mount: [
                        async () => loader(true),   // mount 前显示 loading
                        ...toArray(mount),          // 应用的 mount 函数
                        async () => loader(false)   // mount 后隐藏 loading
                    ],
                    ...otherMicroAppConfigs,
                };
            },
            activeWhen: activeRule,
            customProps: props,
        });
    });
}

export function start(opts: StartOpts = {}) {
    if (!started) {
        startSingleSpa(opts);  // 启动 single-spa
        started = true;
        frameworkStartedDefer.resolve();  // 解除阻塞
    }
}
```

## 🔍 详细步骤解析

### 步骤1: 过滤重复注册

```typescript
const unregisteredApps = apps.filter(
    (app) => !microApps.some((registeredApp) => registeredApp.name === app.name)
);
```

**为什么需要过滤？**

```javascript
// 场景：多次调用 registerMicroApps
registerMicroApps([
    { name: 'app1', entry: '//localhost:8080', ... },
    { name: 'app2', entry: '//localhost:8081', ... }
]);

// 稍后又注册（可能是不同模块调用）
registerMicroApps([
    { name: 'app2', entry: '//localhost:8081', ... },  // 重复
    { name: 'app3', entry: '//localhost:8082', ... }   // 新应用
]);

// 过滤后实际注册：
// 第一次：app1, app2
// 第二次：app3（app2 被过滤）

// 如果不过滤：
// app2 会被注册两次 → single-spa 报错
// ❌ application 'app2' is already registered!
```

**实际效果：**

```javascript
// microApps 全局数组记录所有已注册应用
export const microApps: Array<RegistrableApp> = [];

// 第一次注册
registerMicroApps([
    { name: 'app1', ... },
    { name: 'app2', ... }
]);
// microApps = [app1, app2]

// 第二次注册
registerMicroApps([
    { name: 'app2', ... },  // 已存在，过滤
    { name: 'app3', ... }   // 新应用，保留
]);
// unregisteredApps = [app3]
// microApps = [app1, app2, app3]
```

### 步骤2: 保存到全局列表

```typescript
microApps.push(...unregisteredApps);
```

**作用：**
1. **记录注册历史**：防止重复注册
2. **预加载使用**：start 函数的 prefetch 功能需要知道所有应用
3. **调试辅助**：可以查看当前注册了哪些应用

```javascript
// 在控制台查看已注册的应用
import { microApps } from 'qiankun';
console.log(microApps);
// [
//   { name: 'app1', entry: '//localhost:8080', ... },
//   { name: 'app2', entry: '//localhost:8081', ... }
// ]
```

### 步骤3: 注册到 single-spa

这是最核心的部分，将 qiankun 的应用配置转换为 single-spa 格式。

#### single-spa 的 registerApplication

```typescript
registerApplication({
    name: string,                    // 应用名称
    app: () => Promise<Lifecycle>,   // 返回生命周期的函数
    activeWhen: string | Function,   // 激活条件
    customProps?: Object             // 自定义属性
})
```

#### qiankun 的包装逻辑

```typescript
registerApplication({
    name,
    // ⭐ app 函数：异步加载并返回生命周期
    app: async () => {
        loader(true);  // 1. 显示 loading
        await frameworkStartedDefer.promise;  // 2. 等待启动

        // 3. 加载应用
        const { mount, ...otherMicroAppConfigs } = (
            await loadApp({ name, entry, container, props }, frameworkConfiguration, lifeCycles)
        )(container);

        // 4. 包装 mount，添加 loader
        return {
            mount: [
                async () => loader(true),
                ...toArray(mount),
                async () => loader(false)
            ],
            ...otherMicroAppConfigs,
        };
    },
    activeWhen: activeRule,
    customProps: props,
});
```

## 🔄 应用加载的完整流程

### 1. 注册阶段（registerMicroApps）

```javascript
registerMicroApps([
    {
        name: 'react-app',
        entry: '//localhost:8080',
        container: '#subapp-container',
        activeRule: '/react-app',
        loader: (loading) => {
            console.log('loading:', loading);
        },
        props: { data: 'shared data' }
    }
]);

// 此时应用只是注册，并未加载
// single-spa 会监听路由变化
```

### 2. 启动阶段（start）

```javascript
start({
    prefetch: true,      // 是否预加载
    singular: true,      // 是否单实例
    sandbox: true        // 是否开启沙箱
});

// 此时：
// 1. frameworkStartedDefer.resolve() 被调用
// 2. single-spa 开始工作
// 3. 根据当前路由激活对应的应用
```

### 3. 激活阶段（路由匹配）

```javascript
// 用户访问 /react-app
// single-spa 检测到路由匹配 activeRule

// 触发应用的 app 函数
app: async () => {
    loader(true);  // ✓ 回调执行
    // 输出: loading: true
    
    await frameworkStartedDefer.promise;  // ✓ 已 resolve，继续
    
    // 开始加载应用
    const configGetter = await loadApp(...);
    const config = configGetter(container);
    
    return config;  // 返回生命周期对象
}
```

### 4. 加载阶段（loadApp）

```typescript
// packages/qiankun/src/core/loadApp.ts: 35
export default async function loadApp(app, configuration, lifeCycles) {
    const { name: appName, entry, container } = app;
    
    // 1. 创建沙箱
    if (sandbox) {
        const sandboxContainer = createSandboxContainer(appName, ...);
        sandboxInstance = sandboxContainer.instance;
        global = sandboxInstance.globalThis;
    }
    
    // 2. 加载入口（使用 import-html-entry）
    const lifecyclesPromise = loadEntry<MicroAppLifeCycles>(
        entry, 
        microAppDOMContainer, 
        containerOpts
    );
    
    // 3. 执行 beforeLoad 钩子
    await execHooksChain(toArray(beforeLoad), app, global);
    
    // 4. 等待生命周期加载完成
    const lifecycles = await lifecyclesPromise;
    if (!lifecycles) {
        throw new QiankunError(`${appName} entry ${entry} load failed`);
    }
    
    const { bootstrap, mount, unmount, update } = getLifecyclesFromExports(
        lifecycles,
        appName,
        global,
        sandboxInstance?.latestSetProp,
    );
    
    // 5. 返回配置生成器
    return (mountContainer) => {
        const parcelConfig = {
            name: appName,
            bootstrap,
            mount: [
                // 挂载前的准备工作
                async () => { /* 初始化容器 */ },
                async () => { /* 重新加载 HTML */ },
                async () => mountSandbox(mountContainer),
                async () => execHooksChain(toArray(beforeMount), app, global),
                // 应用的 mount
                async (props) => mount({ ...props, container: mountContainer }),
                // 挂载后的收尾工作
                async () => execHooksChain(toArray(afterMount), app, global),
                async () => { mountTimes++; }
            ],
            unmount: [
                async () => execHooksChain(toArray(beforeUnmount), app, global),
                async (props) => unmount({ ...props, container: mountContainer }),
                unmountSandbox,
                async () => execHooksChain(toArray(afterUnmount), app, global),
                async () => clearContainer(mountContainer),
            ],
        };
        
        return parcelConfig;
    };
}
```

### 5. 执行阶段（single-spa 调用生命周期）

```javascript
// single-spa 自动调用生命周期

// 1. bootstrap（首次加载时，只执行一次）
await app.bootstrap();

// 2. mount（每次激活时）
await app.mount();
// 此时：
// - loader(true) 显示 loading
// - 沙箱激活
// - beforeMount 钩子执行
// - 子应用的 mount 执行
// - afterMount 钩子执行
// - loader(false) 隐藏 loading

// 3. unmount（每次失活时）
await app.unmount();
// 此时：
// - beforeUnmount 钩子执行
// - 子应用的 unmount 执行
// - 沙箱卸载
// - afterUnmount 钩子执行
// - 清空容器
```

## 🎨 loader 的作用

### 问题场景

```javascript
// 应用加载需要时间
// 用户看到的是空白页面 → 体验差

// 解决方案：显示 loading 状态
```

### loader 的调用时机

```typescript
mount: [
    async () => loader(true),   // ⭐ 开始加载，显示 loading
    ...toArray(mount),          // 应用 mount（可能很慢）
    async () => loader(false)   // ⭐ 加载完成，隐藏 loading
]
```

### 实际使用示例

```javascript
registerMicroApps([
    {
        name: 'react-app',
        entry: '//localhost:8080',
        container: '#subapp-container',
        activeRule: '/react-app',
        loader: (loading) => {
            const container = document.querySelector('#subapp-container');
            if (loading) {
                // 显示 loading
                container.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>正在加载应用...</p>
                    </div>
                `;
            } else {
                // 隐藏 loading（子应用内容已渲染）
                // 实际上不需要手动清除，子应用会覆盖
            }
        }
    }
]);
```

## ⏰ frameworkStartedDefer 的作用

### 问题场景

```javascript
// 时间线：
// t=0ms: registerMicroApps() 调用
// t=1ms: 用户访问 /react-app，触发 app 函数
// t=2ms: start() 还没调用 ❌

// 如果不等待 start()：
// - frameworkConfiguration 还是空的
// - 没有配置沙箱、预加载等选项
// - 应用可能无法正常工作
```

### 解决方案：Deferred Promise

```typescript
const frameworkStartedDefer = new Deferred<void>();

// 在 registerApplication 中等待
await frameworkStartedDefer.promise;  // 阻塞在这里

// 在 start() 中解除阻塞
export function start(opts) {
    if (!started) {
        startSingleSpa(opts);
        started = true;
        frameworkStartedDefer.resolve();  // ⭐ 解除阻塞
    }
}
```

### Deferred 实现

```typescript
// @qiankunjs/shared
class Deferred<T> {
    promise: Promise<T>;
    resolve!: (value: T) => void;
    reject!: (reason: any) => void;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
```

**效果：**

```javascript
// 标准流程
registerMicroApps([...]);  // t=0ms
start();                   // t=100ms
// 用户访问 /app → app 函数执行 → 等待 100ms → 继续加载 ✓

// 逆序流程（也能工作）
start();                   // t=0ms (frameworkStartedDefer 立即 resolve)
registerMicroApps([...]);  // t=100ms
// 用户访问 /app → app 函数执行 → 无需等待 ✓

// 错误流程（被阻止）
registerMicroApps([...]);  // t=0ms
// 用户访问 /app → app 函数执行 → 永久等待 ❌
// 需要调用 start() 解除阻塞
```

## 📊 与 single-spa 的关系

### single-spa 是什么？

single-spa 是一个微前端框架，负责：
- 路由管理
- 应用注册
- 生命周期调度

### qiankun 在 single-spa 之上做了什么？

```javascript
// single-spa 提供的功能
registerApplication({
    name: 'app',
    app: () => import('./app.js'),  // 需要手动实现加载逻辑
    activeWhen: '/app',
    customProps: {}
});

// qiankun 的增强
registerMicroApps([{
    name: 'app',
    entry: '//localhost:8080',  // ⭐ 自动加载 HTML 入口
    container: '#container',     // ⭐ 自动挂载到容器
    activeRule: '/app',
    props: {}
}]);

// qiankun 帮你做了：
// 1. HTML 入口解析（import-html-entry）
// 2. 沙箱隔离（JS/CSS）
// 3. 样式隔离
// 4. 预加载
// 5. 生命周期增强
// 6. loader 支持
```

## 🎓 面试要点

### registerMicroApps 的核心职责

1. **去重**：同名应用只注册一次
2. **转换**：qiankun 配置 → single-spa 配置
3. **增强**：添加 loader、生命周期钩子等
4. **委托**：调用 single-spa.registerApplication

### 关键设计

1. **延迟加载**：app 函数返回 Promise，按需加载
2. **启动等待**：frameworkStartedDefer 确保 start 先调用
3. **loader 包装**：在 mount 前后显示/隐藏 loading
4. **生命周期增强**：注入 beforeMount、afterMount 等钩子

### 与 loadMicroApp 的区别

```javascript
// registerMicroApps：基于路由自动加载
registerMicroApps([{
    name: 'app',
    entry: '//localhost:8080',
    activeRule: '/app'  // ⭐ 路由匹配时自动加载
}]);
start();

// loadMicroApp：手动加载
const app = loadMicroApp({
    name: 'app',
    entry: '//localhost:8080',
    container: '#container'  // ⭐ 立即加载，不依赖路由
});
// 手动控制卸载
app.unmount();
```

## 💡 为什么这样设计？

### 1. 为什么需要 frameworkStartedDefer？

```javascript
// 问题：用户可能先注册后启动，也可能先启动后注册

// 场景1: 标准顺序
registerMicroApps([...]);
start({ sandbox: true });  // 配置传入

// 场景2: 逆序（也要支持）
start({ sandbox: true });
registerMicroApps([...]);

// frameworkStartedDefer 确保：
// 无论顺序如何，应用加载时配置一定是可用的
```

### 2. 为什么要包装 mount？

```javascript
// 原始 mount（子应用导出的）
mount: async (props) => {
    ReactDOM.render(<App />, props.container);
}

// qiankun 包装后
mount: [
    async () => loader(true),        // 前置：显示 loading
    async () => beforeMount(),       // 前置：执行钩子
    async (props) => {                // 原始 mount
        ReactDOM.render(<App />, props.container);
    },
    async () => afterMount(),        // 后置：执行钩子
    async () => loader(false)        // 后置：隐藏 loading
]

// 好处：
// 1. 不侵入子应用代码
// 2. 统一的 loading 体验
// 3. 全局钩子支持
```

### 3. 为什么要记录 microApps？

```javascript
// 用途1: 防止重复注册
registerMicroApps([{ name: 'app1', ... }]);
registerMicroApps([{ name: 'app1', ... }]);  // 被过滤

// 用途2: 预加载功能
start({ prefetch: true });
// 遍历 microApps，预加载所有应用

// 用途3: 调试和监控
console.log(microApps);  // 查看所有已注册应用
```

qiankun 的 registerMicroApps 通过精妙的设计，在 single-spa 的基础上提供了更强大、更易用的微前端能力！

