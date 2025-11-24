# 问题10：qiankun 如何实现路由劫持和应用切换？start 函数的核心逻辑是什么？

## 📌 start 函数签名

```typescript
// packages/qiankun/src/apis/registerMicroApps.ts: 46
export function start(opts: StartOpts = {})
```

**StartOpts 选项：**
```typescript
{
    prefetch?: boolean | 'all' | string[] | Function;  // 预加载策略
    singular?: boolean;        // 是否单实例模式
    sandbox?: boolean | {...}; // 沙箱配置
    fetch?: Function;          // 自定义 fetch
    getPublicPath?: Function;  // 自定义 publicPath
    getTemplate?: Function;    // 自定义模板处理
    // ... 其他配置
}
```

## 🎯 start 函数的核心职责

```typescript
// packages/qiankun/src/apis/registerMicroApps.ts: 46-62
export function start(opts: StartOpts = {}) {
    if (!started) {
        // frameworkConfiguration = { prefetch: true, singular: true, sandbox: true, ...opts };
        // const { prefetch, urlRerouteOnly = defaultUrlRerouteOnly, ...importEntryOpts } = frameworkConfiguration;

        // if (prefetch) {
        //   doPrefetchStrategy(microApps, prefetch, importEntryOpts);
        // }

        // frameworkConfiguration = autoDowngradeForLowVersionBrowser(frameworkConfiguration);

        startSingleSpa(opts);  // ⭐ 核心：启动 single-spa
        started = true;

        frameworkStartedDefer.resolve();  // ⭐ 解除应用加载的阻塞
    }
}
```

**start 函数的三大核心动作：**

1. **保存全局配置**：将配置保存到 `frameworkConfiguration`
2. **启动 single-spa**：调用 `startSingleSpa(opts)`
3. **解除阻塞**：`frameworkStartedDefer.resolve()`

## 🔗 qiankun 不直接劫持路由

**关键认知：qiankun 本身不做路由劫持，而是委托给 single-spa。**

### single-spa 的路由劫持机制

single-spa 通过监听以下事件来实现路由监听：

```javascript
// single-spa 内部实现（简化版）
window.addEventListener('hashchange', reroute);
window.addEventListener('popstate', reroute);

// 劫持 pushState 和 replaceState
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function(...args) {
    const result = originalPushState.apply(this, args);
    reroute();  // 触发路由重新匹配
    return result;
};

window.history.replaceState = function(...args) {
    const result = originalReplaceState.apply(this, args);
    reroute();  // 触发路由重新匹配
    return result;
};

function reroute() {
    // 1. 获取当前 URL
    const currentUrl = window.location.href;
    
    // 2. 遍历所有注册的应用
    apps.forEach(app => {
        // 3. 检查应用的 activeWhen 规则
        const shouldBeActive = app.activeWhen(currentUrl);
        const isActive = app.status === 'MOUNTED';
        
        // 4. 应该激活但未激活 → mount
        if (shouldBeActive && !isActive) {
            mountApp(app);
        }
        // 5. 不应激活但已激活 → unmount
        else if (!shouldBeActive && isActive) {
            unmountApp(app);
        }
    });
}
```

### qiankun 的角色

```javascript
// qiankun 通过 registerApplication 注册应用时，指定 activeWhen
registerApplication({
    name: 'react-app',
    app: async () => { /* 加载逻辑 */ },
    activeWhen: '/react-app',  // ⭐ 激活规则
});

// single-spa 会在路由变化时检查这个规则
// 当 location.pathname.startsWith('/react-app') 时激活应用
```

## 🚀 应用切换的完整流程

### 场景：从 app1 切换到 app2

```javascript
// 1. 用户操作
<Link to="/app2">切换到应用2</Link>

// 2. 路由变化
// 假设使用 react-router 或 vue-router
history.push('/app2');

// 3. single-spa 监听到路由变化
// pushState 被劫持，触发 reroute()

// 4. single-spa 重新匹配应用
reroute() {
    // app1: activeWhen = '/app1'
    // location.pathname = '/app2'
    // shouldBeActive = false, isActive = true
    // → 需要卸载 app1
    
    // app2: activeWhen = '/app2'
    // location.pathname = '/app2'
    // shouldBeActive = true, isActive = false
    // → 需要加载 app2
}

// 5. 卸载 app1
unmountApp('app1') {
    // 5.1 执行 beforeUnmount 钩子
    await execHooksChain(toArray(beforeUnmount), app1, global);
    
    // 5.2 调用 app1 的 unmount 生命周期
    await app1.unmount();
    
    // 5.3 卸载沙箱
    await unmountSandbox();
    
    // 5.4 执行 afterUnmount 钩子
    await execHooksChain(toArray(afterUnmount), app1, global);
    
    // 5.5 清空容器
    clearContainer(container);
}

// 6. 加载 app2
mountApp('app2') {
    // 6.1 检查是否首次加载
    if (!app2.loaded) {
        // 6.1.1 执行 beforeLoad 钩子
        await execHooksChain(toArray(beforeLoad), app2, global);
        
        // 6.1.2 加载入口（import-html-entry）
        const { template, execScripts } = await importHTML(app2.entry);
        
        // 6.1.3 渲染 HTML
        container.innerHTML = template;
        
        // 6.1.4 创建沙箱
        const sandbox = createSandboxContainer(app2.name);
        
        // 6.1.5 执行脚本
        const lifecycles = await execScripts(sandbox.proxy);
        
        // 6.1.6 调用 bootstrap
        await lifecycles.bootstrap();
        
        app2.loaded = true;
    }
    
    // 6.2 执行 beforeMount 钩子
    await execHooksChain(toArray(beforeMount), app2, global);
    
    // 6.3 激活沙箱
    await mountSandbox(container);
    
    // 6.4 调用 app2 的 mount 生命周期
    await app2.mount({ container });
    
    // 6.5 执行 afterMount 钩子
    await execHooksChain(toArray(afterMount), app2, global);
}
```

## 🎨 activeRule 的匹配规则

### 1. 字符串路径

```javascript
registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: '/app1',  // 字符串
    }
]);

// 匹配规则：
// ✓ /app1          → 激活
// ✓ /app1/page1    → 激活
// ✓ /app1/page2    → 激活
// ✗ /app2          → 不激活
// ✗ /              → 不激活
```

### 2. 路径数组

```javascript
registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: ['/app1', '/application1'],  // 数组
    }
]);

// 匹配规则：
// ✓ /app1          → 激活
// ✓ /app1/page     → 激活
// ✓ /application1  → 激活
// ✗ /app2          → 不激活
```

### 3. 自定义函数

```javascript
registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: (location) => {
            // 自定义匹配逻辑
            return location.pathname.startsWith('/app1') || 
                   location.hash.startsWith('#/app1');
        }
    }
]);

// 完全自定义匹配规则
// 可以基于 pathname、hash、search 等任意条件
```

### 4. 正则表达式（通过函数实现）

```javascript
registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: (location) => {
            return /^\/app1(\/.*)?$/.test(location.pathname);
        }
    }
]);
```

## 🔄 单实例 vs 多实例模式

### singular: true（单实例模式，默认）

```javascript
start({ singular: true });

// 同一时间只有一个微应用处于激活状态
// 切换应用时：
// 1. 先卸载旧应用（unmount）
// 2. 再加载新应用（mount）

// 优点：
// - 简单可控
// - 避免应用间冲突
// - 性能开销小

// 缺点：
// - 不能同时展示多个应用
```

**实际效果：**

```javascript
// 用户在 /app1
// 页面显示：app1 ✓

// 用户导航到 /app2
// 1. app1 unmount
// 2. app2 mount
// 页面显示：app2 ✓

// 不可能同时看到 app1 和 app2
```

### singular: false（多实例模式）

```javascript
start({ singular: false });

// 可以同时激活多个微应用
// 前提：它们的 activeRule 同时匹配

// 场景：
// app1: activeRule = '/app1'
// app2: activeRule = '/app2'
// 当路由是 /app1/app2 时：
// - 如果 app1 的规则匹配 '/app1' 开头 → app1 激活
// - 如果 app2 的规则匹配 '/app2' 子串 → app2 激活
// - 两个应用同时运行
```

**实际使用场景：**

```javascript
// 场景：多区域布局
// +------------------+
// | app1 (顶部导航)   |
// +------------------+
// | app2 (左侧菜单)   | app3 (主内容) |
// +------------------+

registerMicroApps([
    {
        name: 'navbar',
        entry: '//localhost:8080',
        container: '#navbar',
        activeRule: () => true,  // 始终激活
    },
    {
        name: 'sidebar',
        entry: '//localhost:8081',
        container: '#sidebar',
        activeRule: () => true,  // 始终激活
    },
    {
        name: 'content',
        entry: '//localhost:8082',
        container: '#content',
        activeRule: '/content',  // 按路由激活
    }
]);

start({ singular: false });  // 允许多个应用同时运行
```

## ⚙️ start 配置项详解

### 1. prefetch（预加载）

```javascript
start({
    prefetch: true  // 默认值
});

// prefetch 策略：
// - true: 首屏加载完成后，空闲时预加载其他应用
// - 'all': 立即预加载所有应用
// - string[]: 预加载指定的应用
// - function: 自定义预加载逻辑
```

**预加载时机：**

```javascript
// prefetch: true
start({ prefetch: true });

// 流程：
// 1. 首屏应用加载完成
// 2. 等待浏览器空闲（requestIdleCallback）
// 3. 预加载其他应用的资源（HTML/JS/CSS）
// 4. 不执行脚本，只下载

// 好处：
// - 用户切换应用时，资源已在缓存
// - 加速后续应用的加载
```

**自定义预加载：**

```javascript
start({
    prefetch: (apps) => {
        // 自定义预加载逻辑
        const importantApps = apps.filter(app => app.priority === 'high');
        
        importantApps.forEach(app => {
            // 预加载应用
            importHTML(app.entry).then(({ getExternalScripts, getExternalStyleSheets }) => {
                getExternalScripts();
                getExternalStyleSheets();
            });
        });
    }
});
```

### 2. sandbox（沙箱）

```javascript
start({
    sandbox: true  // 默认开启
});

// sandbox 选项：
// - true: 开启沙箱（自动选择最佳实现）
// - false: 关闭沙箱（所有应用共享全局对象）
// - { strictStyleIsolation: true }: 严格样式隔离
// - { experimentalStyleIsolation: true }: 实验性样式隔离
```

**沙箱模式对比：**

```javascript
// 关闭沙箱
start({ sandbox: false });
// 所有应用共享 window 对象
// app1.window === app2.window === window
// 全局变量会相互污染 ⚠️

// 开启沙箱
start({ sandbox: true });
// 每个应用有独立的 Proxy 对象
// app1.window !== app2.window
// 全局变量隔离 ✓
```

### 3. fetch（自定义请求）

```javascript
start({
    fetch: (url, opts) => {
        // 添加认证 token
        return window.fetch(url, {
            ...opts,
            headers: {
                ...opts.headers,
                'Authorization': `Bearer ${getToken()}`
            }
        });
    }
});

// 所有微应用的资源请求都会使用这个 fetch
```

## 🌐 路由模式的兼容性

### Hash 模式

```javascript
// 主应用：hash 路由
// #/app1
// #/app2

registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: (location) => {
            return location.hash.startsWith('#/app1');
        }
    }
]);
```

### History 模式

```javascript
// 主应用：history 路由
// /app1
// /app2

registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: '/app1'  // 默认就是 pathname 匹配
    }
]);
```

### 混合模式

```javascript
// 主应用：history 模式
// 子应用：hash 模式

registerMicroApps([
    {
        name: 'app1',
        entry: '//localhost:8080',  // 子应用内部用 hash 路由
        container: '#container',
        activeRule: '/app1'  // 主应用用 history 路由
    }
]);

// 实际 URL：
// http://main.com/app1#/page1
// 主应用匹配：/app1
// 子应用匹配：#/page1
```

## 🎓 面试要点

### 路由劫持机制

1. **委托给 single-spa**：qiankun 不直接劫持，而是利用 single-spa
2. **监听路由变化**：hashchange、popstate、pushState、replaceState
3. **自动重新匹配**：路由变化时，检查所有应用的 activeRule
4. **自动切换**：unmount 旧应用，mount 新应用

### start 函数职责

1. **保存配置**：frameworkConfiguration
2. **启动框架**：startSingleSpa
3. **解除阻塞**：frameworkStartedDefer.resolve()
4. **预加载**：根据 prefetch 策略预加载应用

### 应用切换流程

1. **路由变化** → single-spa 监听
2. **规则匹配** → 检查 activeRule
3. **卸载旧应用** → beforeUnmount → unmount → afterUnmount
4. **加载新应用** → beforeLoad → load → bootstrap（首次）
5. **挂载新应用** → beforeMount → mount → afterMount

### 配置项

1. **prefetch**: 预加载策略（true/all/array/function）
2. **singular**: 单实例/多实例模式
3. **sandbox**: 沙箱配置（boolean/object）
4. **fetch**: 自定义资源请求

## 💡 为什么这样设计？

### 1. 为什么不自己实现路由劫持？

```javascript
// 如果 qiankun 自己实现：
// - 需要维护复杂的路由匹配逻辑
// - 需要处理各种边界情况
// - 与现有路由库可能冲突

// 利用 single-spa：
// - single-spa 已经很成熟
// - 专注于应用加载和隔离
// - 职责分离，降低复杂度
```

### 2. 为什么需要 frameworkStartedDefer？

```javascript
// 问题场景：
// t=0ms: registerMicroApps()  // 注册应用
// t=1ms: 用户访问 /app1        // 触发加载
// t=100ms: start()             // 配置才传入

// 如果不等待：
// 应用在 t=1ms 开始加载，但配置还没传入
// sandbox、prefetch 等功能无法使用 ❌

// 使用 Deferred：
// 应用在 t=1ms 阻塞等待
// t=100ms start() 调用，resolve Deferred
// 应用继续加载，配置生效 ✓
```

### 3. 为什么支持多种 activeRule 格式？

```javascript
// 字符串：简单场景
activeRule: '/app1'

// 数组：多个路径激活同一应用
activeRule: ['/app1', '/legacy-app1']

// 函数：复杂匹配规则
activeRule: (location) => {
    // 基于 query 参数
    return new URLSearchParams(location.search).get('app') === 'app1';
}

// 灵活性 vs 简洁性的平衡
```

### 4. 为什么需要 singular 选项？

```javascript
// 大多数场景：一次只展示一个应用（singular: true）
// - 简单直观
// - 避免冲突
// - 性能更好

// 特殊场景：同时展示多个应用（singular: false）
// - 多区域布局
// - 组合式应用
// - 共享导航栏

// 提供选项，满足不同需求
```

qiankun 通过巧妙地利用 single-spa 的路由机制，配合自己的应用加载和隔离能力，实现了一个强大而灵活的微前端解决方案！

