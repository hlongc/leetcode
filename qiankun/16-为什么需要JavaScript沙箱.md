# 问题16：qiankun 为什么需要 JavaScript 沙箱？沙箱解决了哪些核心问题？

## 📌 什么是 JavaScript 沙箱？

**沙箱（Sandbox）**：一个隔离的 JavaScript 执行环境，让代码运行在一个受控的范围内，防止对外部环境产生影响。

在微前端场景下，沙箱就是为每个子应用创建一个独立的 JavaScript 运行环境，让多个应用可以在同一个页面中互不干扰地运行。

## 🎯 为什么需要沙箱？核心问题场景

### 问题1: 全局变量污染

```javascript
// 场景：主应用和子应用都使用了相同的全局变量名

// 主应用
window.user = {
    id: 1,
    name: 'Admin',
    role: 'admin'
};

console.log(window.user);  // { id: 1, name: 'Admin', role: 'admin' }

// 加载子应用1
// 子应用1的代码
window.user = {
    id: 100,
    name: 'User1'
};

// 此时主应用的 window.user 被覆盖了！
console.log(window.user);  // { id: 100, name: 'User1' } ❌

// 卸载子应用1后
// 主应用的 window.user 已经被破坏，无法恢复 ❌
```

**后果：**
- 主应用的数据被破坏
- 应用间相互影响
- 难以排查的 bug
- 应用无法独立运行

### 问题2: 副作用无法清除

```javascript
// 子应用添加了全局事件监听
window.addEventListener('resize', handleResize);
window.addEventListener('scroll', handleScroll);

// 设置了定时器
const timer = setInterval(() => {
    console.log('子应用定时任务');
}, 1000);

// 修改了原生对象
Array.prototype.customMethod = function() { /* ... */ };
Object.prototype.customProp = 'value';

// 问题：子应用卸载时，这些副作用仍然存在
// - 事件监听继续触发
// - 定时器继续运行
// - 原型链被污染
// - 内存泄漏
```

### 问题3: 多应用同时运行冲突

```javascript
// 两个子应用同时运行，都使用了相同的全局变量

// 子应用A
window.apiBase = 'https://api-a.com';
window.config = { theme: 'dark' };

// 子应用B（晚加载）
window.apiBase = 'https://api-b.com';  // 覆盖了A的配置
window.config = { theme: 'light' };     // 覆盖了A的配置

// 结果：
// - 子应用A使用了错误的API地址
// - 子应用A使用了错误的主题
// - 两个应用都无法正常工作 ❌
```

### 问题4: 应用间不应知晓彼此

```javascript
// 问题场景：子应用可以访问其他子应用的数据

// 子应用A
window.appASecret = 'password123';
window.appAData = { sensitive: 'data' };

// 子应用B（恶意或无意）
console.log(window.appASecret);     // 'password123' - 泄露了A的数据
window.appAData.sensitive = 'hacked';  // 篡改了A的数据

// 违反了隔离原则
// 安全隐患
```

### 问题5: 无法独立开发和测试

```javascript
// 没有沙箱：子应用依赖全局环境

// 子应用代码
function init() {
    // 假设主应用提供了这些全局变量
    const user = window.mainAppUser;
    const api = window.mainAppAPI;
    
    // 开发时的问题：
    // 1. 必须在主应用环境中测试
    // 2. 无法独立运行
    // 3. 无法编写单元测试
}

// 有沙箱：子应用通过 props 接收数据
function mount(props) {
    const { user, api } = props;
    
    // 优点：
    // 1. 可以独立运行
    // 2. 可以 mock props 进行测试
    // 3. 依赖关系明确
}
```

## 🔒 沙箱解决的核心问题

### 1. 全局变量隔离

```javascript
// 有了沙箱

// 主应用
window.user = { id: 1, name: 'Admin' };

// 子应用1（在沙箱中运行）
window.user = { id: 100, name: 'User1' };
// 实际上是：sandbox1.user = { id: 100, name: 'User1' }

// 子应用2（在另一个沙箱中运行）
window.user = { id: 200, name: 'User2' };
// 实际上是：sandbox2.user = { id: 200, name: 'User2' }

// 主应用
console.log(window.user);  // { id: 1, name: 'Admin' } ✓ 没有被污染

// 三个 user 变量完全隔离
// window.user !== sandbox1.user !== sandbox2.user
```

### 2. 副作用清理

```javascript
// 沙箱记录了所有副作用

// 激活沙箱
sandbox.active();

// 子应用运行
window.addEventListener('resize', handleResize);  // 沙箱记录
window.timer = setInterval(() => {}, 1000);       // 沙箱记录
window.customData = { /* ... */ };                // 沙箱记录

// 卸载沙箱
sandbox.inactive();
// 自动清理：
// - 移除事件监听
// - 清除定时器
// - 删除自定义属性
// - 恢复被修改的属性
```

### 3. 多应用共存

```javascript
// 两个应用各自在独立的沙箱中

// 子应用A的沙箱
sandboxA.active();
window.apiBase = 'https://api-a.com';
console.log(window.apiBase);  // 'https://api-a.com'
sandboxA.inactive();

// 子应用B的沙箱
sandboxB.active();
window.apiBase = 'https://api-b.com';
console.log(window.apiBase);  // 'https://api-b.com'
sandboxB.inactive();

// 真实的 window.apiBase 从未被改变
console.log(window.apiBase);  // undefined（或原始值）
```

### 4. 快照恢复

```javascript
// 沙箱可以保存和恢复状态

// 用户访问子应用A
sandboxA.active();
window.appState = { page: 1, data: [...] };
// 用户操作，修改状态
window.appState = { page: 2, data: [...] };
sandboxA.inactive();  // 保存快照

// 用户切换到子应用B
sandboxB.active();
// ...
sandboxB.inactive();

// 用户再次回到子应用A
sandboxA.active();
console.log(window.appState);  // { page: 2, data: [...] } ✓ 状态恢复
```

## 📊 没有沙箱 vs 有沙箱

### 没有沙箱的微前端

```javascript
// 所有应用共享全局 window

// 主应用
window.jQuery = jQuery;
window.React = React;
window.mainAppConfig = { /* ... */ };

// 子应用1
window.jQuery = jQuery2;  // 版本冲突！
window.subApp1Data = { /* ... */ };

// 子应用2
window.React = React18;  // 版本冲突！
window.subApp2Data = { /* ... */ };

// 问题：
// 1. jQuery 和 React 版本冲突
// 2. 全局对象越来越多
// 3. 卸载后无法清理
// 4. 应用间互相影响

// 后果：
// - 主应用崩溃
// - 子应用崩溃
// - 内存泄漏
// - 安全问题
```

### 有沙箱的微前端

```javascript
// 每个应用有独立的执行环境

// 主应用（真实 window）
window.jQuery = jQuery;
window.React = React;
window.mainAppConfig = { /* ... */ };

// 子应用1（沙箱A - 代理 window）
sandbox1.window.jQuery = jQuery2;  // 不影响主应用
sandbox1.window.subApp1Data = { /* ... */ };

// 子应用2（沙箱B - 代理 window）
sandbox2.window.React = React18;   // 不影响主应用
sandbox2.window.subApp2Data = { /* ... */ };

// 优点：
// 1. 版本隔离
// 2. 各自独立
// 3. 可以清理
// 4. 互不影响

// 结果：
// - 主应用稳定
// - 子应用稳定
// - 无内存泄漏
// - 安全可控
```

## 🎨 沙箱的核心能力

### 1. 属性访问拦截

```javascript
// 通过 Proxy 拦截所有属性访问

const sandbox = new Proxy(window, {
    get(target, property) {
        // 拦截读取
        console.log(`读取: ${property}`);
        
        // 从沙箱缓存读取
        if (sandboxCache.has(property)) {
            return sandboxCache.get(property);
        }
        
        // 从真实 window 读取
        return target[property];
    },
    
    set(target, property, value) {
        // 拦截设置
        console.log(`设置: ${property} = ${value}`);
        
        // 保存到沙箱缓存
        sandboxCache.set(property, value);
        
        return true;
    }
});

// 子应用使用代理对象
sandbox.myData = 'value';  // 触发 set trap
console.log(sandbox.myData);  // 触发 get trap

// 真实 window 未被污染
console.log(window.myData);  // undefined ✓
```

### 2. 状态快照

```javascript
// 保存应用运行前的状态

class SnapshotSandbox {
    constructor() {
        this.snapshot = {};
        this.modifiedProps = {};
    }

    active() {
        // 保存当前 window 的快照
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                this.snapshot[prop] = window[prop];
            }
        }
        
        // 恢复上次的修改
        Object.keys(this.modifiedProps).forEach(prop => {
            window[prop] = this.modifiedProps[prop];
        });
    }

    inactive() {
        // 记录修改
        for (const prop in window) {
            if (window[prop] !== this.snapshot[prop]) {
                this.modifiedProps[prop] = window[prop];
                window[prop] = this.snapshot[prop];
            }
        }
    }
}
```

### 3. 作用域绑定

```javascript
// 子应用的代码在沙箱作用域中执行

// 子应用原始代码
const code = `
    window.user = { id: 1 };
    console.log(window.user);
`;

// 包装后的代码（在沙箱中执行）
const wrappedCode = `
    ;(function(window, self, globalThis) {
        ${code}
    }).bind(sandboxProxy)(sandboxProxy, sandboxProxy, sandboxProxy);
`;

// 效果：
// - window、self、globalThis 都指向 sandboxProxy
// - 子应用以为自己在操作真实 window
// - 实际上所有操作都被沙箱拦截
```

## 🎓 面试要点

### 为什么需要沙箱？

1. **全局变量污染**：防止应用间相互覆盖
2. **副作用清理**：应用卸载时清除所有副作用
3. **多应用共存**：让多个应用同时运行
4. **状态隔离**：每个应用有独立的运行时状态
5. **安全隔离**：应用间不能互相访问数据

### 沙箱解决的核心问题

1. **隔离性**：全局变量、副作用、状态隔离
2. **可恢复性**：应用切换时保存/恢复状态
3. **可预测性**：应用行为不受其他应用影响
4. **可清理性**：应用卸载时完全清理
5. **独立性**：应用可以独立开发和测试

### 沙箱的核心技术

1. **Proxy**：拦截属性访问
2. **快照**：保存和恢复状态
3. **作用域绑定**：代码在沙箱环境中执行
4. **副作用记录**：跟踪所有副作用
5. **差异对比**：检测属性变化

## 💡 实际案例

### 案例1: 版本冲突

```javascript
// 没有沙箱：主应用和子应用都使用 jQuery，但版本不同

// 主应用
<script src="jquery-3.6.0.min.js"></script>
window.$ = jQuery;  // 3.6.0

// 子应用
<script src="jquery-2.2.4.min.js"></script>
window.$ = jQuery;  // 2.2.4 覆盖了主应用的版本！

// 结果：主应用崩溃 ❌

// 有沙箱：版本隔离
// 主应用使用 jQuery 3.6.0
// 子应用在沙箱中使用 jQuery 2.2.4
// 两者互不影响 ✓
```

### 案例2: 定时器泄漏

```javascript
// 没有沙箱：子应用的定时器无法清理

// 子应用
const timer = setInterval(() => {
    console.log('子应用定时任务');
    updateUI();  // UI 已经被卸载，但代码仍在执行
}, 1000);

// 卸载子应用
// timer 仍在运行！
// 导致：
// - 内存泄漏
// - 控制台错误（找不到 DOM）
// - CPU 占用

// 有沙箱：自动清理
sandbox.active();
const timer = setInterval(() => { /* ... */ }, 1000);
sandbox.inactive();  // 自动 clearInterval(timer) ✓
```

### 案例3: 原型链污染

```javascript
// 没有沙箱：子应用污染了原型链

// 子应用
Array.prototype.remove = function(item) {
    const index = this.indexOf(item);
    if (index > -1) this.splice(index, 1);
    return this;
};

// 影响全局：
const arr = [1, 2, 3];
arr.remove(2);  // 主应用的代码也可以调用这个方法

// 问题：
// - 所有数组都被污染
// - 可能与其他库冲突
// - 难以调试

// 有沙箱：原型链隔离
// 子应用的原型修改不影响主应用
```

## 🌟 总结

**沙箱是微前端的核心基础设施：**

| 没有沙箱 | 有沙箱 |
|---------|--------|
| ❌ 全局变量混乱 | ✅ 变量隔离 |
| ❌ 应用相互影响 | ✅ 应用独立 |
| ❌ 副作用无法清除 | ✅ 自动清理 |
| ❌ 内存泄漏 | ✅ 无泄漏 |
| ❌ 难以调试 | ✅ 问题可控 |
| ❌ 安全隐患 | ✅ 安全隔离 |

**沙箱让微前端从"可用"变成"好用"！**

没有沙箱的微前端就像没有隔离的虚拟机，应用间会相互干扰；有了沙箱的微前端就像有了Docker容器，每个应用都在自己的独立环境中运行，互不影响、安全可控。

