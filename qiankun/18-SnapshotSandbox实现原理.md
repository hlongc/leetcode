# 问题18：SnapshotSandbox（快照沙箱）的实现原理是什么？它的优缺点是什么？

## 📌 SnapshotSandbox 的核心思想

**快照（Snapshot）+ 差异对比（Diff）**

1. **激活时**：保存 window 的快照，恢复上次的修改
2. **运行时**：子应用直接修改全局 window
3. **失活时**：对比快照和当前 window，记录差异，恢复原状

## 🎯 完整实现（带详细注释）

```javascript
/**
 * SnapshotSandbox 快照沙箱
 * 适用于不支持 Proxy 的老浏览器
 */
class SnapshotSandbox {
    constructor(name) {
        this.name = name;
        
        // 1. windowSnapshot: 激活时的 window 快照
        this.windowSnapshot = {};
        
        // 2. modifyPropsMap: 子应用修改的属性
        //    key: 属性名
        //    value: 属性值
        this.modifyPropsMap = {};
        
        // 3. sandboxRunning: 沙箱是否激活
        this.sandboxRunning = false;
    }

    /**
     * 激活沙箱
     */
    active() {
        // ===== 步骤1: 保存当前 window 的快照 =====
        this.windowSnapshot = {};
        for (const prop in window) {
            // 只记录 window 自己的属性，不包括原型链
            if (window.hasOwnProperty(prop)) {
                this.windowSnapshot[prop] = window[prop];
            }
        }

        // ===== 步骤2: 恢复上次的修改 =====
        // 如果子应用之前运行过，恢复它的状态
        Object.keys(this.modifyPropsMap).forEach(prop => {
            window[prop] = this.modifyPropsMap[prop];
        });

        this.sandboxRunning = true;
    }

    /**
     * 失活沙箱
     */
    inactive() {
        // ===== 步骤1: 找出所有修改 =====
        this.modifyPropsMap = {};
        
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                // 对比当前值和快照
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 记录修改
                    this.modifyPropsMap[prop] = window[prop];
                    
                    // 恢复原值
                    window[prop] = this.windowSnapshot[prop];
                }
            }
        }

        // ===== 步骤2: 处理新增的属性 =====
        // 如果快照中没有，但现在有，说明是新增的
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                if (!(prop in this.windowSnapshot)) {
                    // 记录新增属性
                    this.modifyPropsMap[prop] = window[prop];
                    
                    // 删除新增属性
                    delete window[prop];
                }
            }
        }

        this.sandboxRunning = false;
    }
}
```

## 🔍 详细执行流程

### 场景1: 首次激活和失活

```javascript
const sandbox = new SnapshotSandbox('app1');

// ===== 初始状态 =====
console.log(window.user);  // undefined
console.log(window.config);  // undefined

// ===== 激活沙箱 =====
sandbox.active();
/*
步骤1: 保存快照
windowSnapshot = {
    location: window.location,
    document: window.document,
    // ... 其他几千个属性
    // 注意：没有 user 和 config
}

步骤2: 恢复修改（首次为空）
modifyPropsMap = {}  // 空的，什么都不做
*/

// ===== 子应用运行 =====
window.user = { id: 1, name: 'App1' };
window.config = { theme: 'dark' };
window.data = [1, 2, 3];

console.log(window.user);  // { id: 1, name: 'App1' }
console.log(window.config);  // { theme: 'dark' }
console.log(window.data);  // [1, 2, 3]

// ===== 失活沙箱 =====
sandbox.inactive();
/*
步骤1: 遍历 window，找出修改
for (const prop in window) {
    // prop = 'user'
    // window.user = { id: 1, name: 'App1' }
    // windowSnapshot.user = undefined
    // 不相等！记录修改
    modifyPropsMap['user'] = { id: 1, name: 'App1' };
    window.user = undefined;  // 恢复
    
    // prop = 'config'
    // 同理...
    modifyPropsMap['config'] = { theme: 'dark' };
    window.config = undefined;
    
    // prop = 'data'
    // 同理...
    modifyPropsMap['data'] = [1, 2, 3];
    window.data = undefined;
}

结果：
modifyPropsMap = {
    user: { id: 1, name: 'App1' },
    config: { theme: 'dark' },
    data: [1, 2, 3]
}
*/

// ===== 失活后 =====
console.log(window.user);  // undefined （恢复了）
console.log(window.config);  // undefined （恢复了）
console.log(window.data);  // undefined （恢复了）
```

### 场景2: 再次激活

```javascript
// ===== 再次激活沙箱 =====
sandbox.active();
/*
步骤1: 保存快照（当前的 window 状态）
windowSnapshot = {
    // ... 所有属性（此时不包括 user, config, data）
}

步骤2: 恢复上次的修改
Object.keys(modifyPropsMap).forEach(prop => {
    window[prop] = modifyPropsMap[prop];
});

恢复：
window.user = { id: 1, name: 'App1' };
window.config = { theme: 'dark' };
window.data = [1, 2, 3];
*/

// ===== 激活后 =====
console.log(window.user);  // { id: 1, name: 'App1' } ✓ 恢复了！
console.log(window.config);  // { theme: 'dark' } ✓ 恢复了！
console.log(window.data);  // [1, 2, 3] ✓ 恢复了！

// 子应用继续修改
window.user.id = 100;
window.newProp = 'new value';

// ===== 再次失活 =====
sandbox.inactive();
/*
对比并记录：
modifyPropsMap = {
    user: { id: 100, name: 'App1' },  // 更新了
    config: { theme: 'dark' },
    data: [1, 2, 3],
    newProp: 'new value'  // 新增了
}

恢复：
window.user = undefined;
window.config = undefined;
window.data = undefined;
delete window.newProp;
*/
```

### 场景3: 多个沙箱切换

```javascript
const sandboxA = new SnapshotSandbox('appA');
const sandboxB = new SnapshotSandbox('appB');

// ===== 激活 A =====
sandboxA.active();
window.appName = 'A';
window.data = 'data from A';
console.log(window.appName);  // 'A'
sandboxA.inactive();

// ===== 激活 B =====
sandboxB.active();
console.log(window.appName);  // undefined （A 的修改已恢复）
window.appName = 'B';
window.data = 'data from B';
console.log(window.appName);  // 'B'
sandboxB.inactive();

// ===== 再次激活 A =====
sandboxA.active();
console.log(window.appName);  // 'A' ✓ 恢复了 A 的状态
console.log(window.data);  // 'data from A' ✓
```

## ⚠️ 为什么不支持多实例？

```javascript
const sandboxA = new SnapshotSandbox('appA');
const sandboxB = new SnapshotSandbox('appB');

// ===== 同时激活两个沙箱 =====
sandboxA.active();
sandboxB.active();

// ===== A 设置数据 =====
window.dataA = 'A';
console.log(window.dataA);  // 'A'

// ===== B 设置数据 =====
window.dataB = 'B';
console.log(window.dataB);  // 'B'

// ===== A 失活 =====
sandboxA.inactive();
/*
问题：A 会恢复快照，把 B 的修改也恢复了！

对比差异：
- window.dataA: 'A' vs undefined → 记录并删除
- window.dataB: 'B' vs undefined → 记录并删除 ❌

结果：
delete window.dataA;  // ✓ 正确
delete window.dataB;  // ❌ 错误！这是 B 的数据
*/

console.log(window.dataA);  // undefined ✓
console.log(window.dataB);  // undefined ❌ B 的数据被误删了！

// ===== B 失活 =====
sandboxB.inactive();
/*
问题：B 发现 dataB 不见了，以为自己删除了它
*/

// 结论：SnapshotSandbox 无法处理多实例！
```

## 🐌 性能问题分析

### 问题：遍历整个 window

```javascript
// window 对象有多少个属性？
console.log(Object.keys(window).length);  // 通常 500-1000+

// 包括原型链上的属性
let count = 0;
for (const prop in window) {
    count++;
}
console.log(count);  // 可能 2000-3000+

// SnapshotSandbox 每次激活/失活都要遍历所有属性
// 性能开销：O(n)，n 是 window 的属性数量
```

### 性能测试

```javascript
const sandbox = new SnapshotSandbox('test');

// 测试激活性能
console.time('active');
sandbox.active();
console.timeEnd('active');
// active: 5-10ms（取决于 window 属性数量）

// 子应用运行
window.testData = { /* ... */ };

// 测试失活性能
console.time('inactive');
sandbox.inactive();
console.timeEnd('inactive');
// inactive: 5-10ms

// 对比 ProxySandbox
const proxySandbox = new ProxySandbox('test');
console.time('proxy-active');
proxySandbox.active();
console.timeEnd('proxy-active');
// proxy-active: < 1ms（几乎无开销）
```

## ✅ 优点

### 1. 兼容性好

```javascript
// 不依赖 Proxy，支持所有浏览器
// IE 9+, Chrome, Firefox, Safari, Edge 等

// 即使在不支持 Proxy 的环境也能工作
if (!window.Proxy) {
    // 使用 SnapshotSandbox ✓
    const sandbox = new SnapshotSandbox('app');
}
```

### 2. 实现简单

```javascript
// 核心逻辑清晰：
// 1. 保存快照
// 2. 恢复快照
// 3. 对比差异

// 代码量少，易于理解和维护
// 不需要复杂的 Proxy trap 处理
```

### 3. 完全恢复

```javascript
// 可以准确恢复子应用的所有状态

sandbox.active();

// 子应用复杂的状态
window.appState = {
    user: { /* ... */ },
    config: { /* ... */ },
    cache: new Map(),
    listeners: [],
    timers: [/* ... */]
};

sandbox.inactive();  // 保存状态
sandbox.active();    // 完全恢复 ✓
```

## ❌ 缺点

### 1. 性能差

```javascript
// 每次激活/失活都要遍历 window
// 时间复杂度：O(n)
// n 可能是几千个属性

// 频繁切换应用时性能问题明显
for (let i = 0; i < 100; i++) {
    sandbox.active();
    sandbox.inactive();
}
// 总耗时：500-1000ms
```

### 2. 不支持多实例

```javascript
// 同一时间只能有一个应用运行
// 多个应用同时运行会相互干扰

const sandboxA = new SnapshotSandbox('A');
const sandboxB = new SnapshotSandbox('B');

sandboxA.active();
sandboxB.active();  // ❌ 会干扰 A
```

### 3. 运行时污染 window

```javascript
// 子应用运行时，直接修改全局 window
sandbox.active();
window.myData = 'value';  // 污染了全局 window

// 其他代码可以访问到
console.log(window.myData);  // 'value' - 不够隔离
```

### 4. 无法拦截某些操作

```javascript
// 无法拦截属性访问
sandbox.active();

// 子应用读取属性
const value = window.someData;
// SnapshotSandbox 无法知道这次读取

// 子应用修改对象内部
window.existingObj.prop = 'new value';
// SnapshotSandbox 无法检测到对象内部的修改
// （只能检测到对象引用的改变）
```

### 5. 快照可能不完整

```javascript
// 某些属性可能无法快照

// 不可枚举属性
Object.defineProperty(window, 'hiddenProp', {
    value: 'hidden',
    enumerable: false  // 不可枚举
});

// for...in 无法遍历到
for (const prop in window) {
    // hiddenProp 不会被遍历到
}

// 快照会遗漏这些属性
```

## 🎯 适用场景

### ✅ 适合的场景

1. **老浏览器项目**

```javascript
// IE 11 或更老的浏览器
// 没有 Proxy 支持
if (!window.Proxy) {
    return new SnapshotSandbox(name);
}
```

2. **单实例应用**

```javascript
// 同一时间只有一个应用运行
start({
    singular: true,  // 单实例模式
    sandbox: true
});
```

3. **应用数量少**

```javascript
// 只有 2-3 个微应用
// 切换不频繁
registerMicroApps([
    { name: 'app1', ... },
    { name: 'app2', ... }
]);
```

### ❌ 不适合的场景

1. **现代浏览器项目**

```javascript
// Chrome、Firefox、Edge 等
// 有 Proxy 支持
// 应该使用 LegacySandbox 或 ProxySandbox
```

2. **多实例应用**

```javascript
// 需要同时运行多个应用
start({
    singular: false,  // 多实例模式
    sandbox: true
});
// ❌ 不要使用 SnapshotSandbox
```

3. **频繁切换的场景**

```javascript
// 用户频繁在应用间切换
// 性能会成为瓶颈
// 应该使用 ProxySandbox
```

4. **性能要求高的场景**

```javascript
// 对首屏性能要求高
// SnapshotSandbox 会增加 5-10ms 的开销
// 累积效应明显
```

## 🎓 面试要点

### 核心原理

1. **快照**：保存 window 当前状态
2. **差异对比**：找出修改的属性
3. **恢复**：恢复原状或恢复修改

### 实现细节

1. **激活**：保存快照 + 恢复修改
2. **失活**：对比差异 + 恢复原状
3. **遍历**：使用 for...in 遍历 window

### 优缺点

**优点：**
- 兼容性好（不需要 Proxy）
- 实现简单
- 完全恢复

**缺点：**
- 性能差（遍历 window）
- 不支持多实例
- 运行时污染

### 适用场景

- 老浏览器
- 单实例
- 应用少
- 切换不频繁

## 💡 为什么qiankun要提供三种沙箱？

```javascript
// 渐进增强策略

function createSandbox(name, options) {
    // 1. 老浏览器：用 SnapshotSandbox
    //    能用 > 不能用
    if (!window.Proxy) {
        return new SnapshotSandbox(name);
    }
    
    // 2. 单实例：用 LegacySandbox
    //    性能好，够用
    if (options.singular) {
        return new LegacySandbox(name);
    }
    
    // 3. 多实例：用 ProxySandbox
    //    功能完整，隔离好
    return new ProxySandbox(name);
}

// 权衡：
// 兼容性 → 性能 → 功能
```

SnapshotSandbox 虽然有诸多限制，但在不支持 Proxy 的环境下，它是唯一的选择。理解它的实现原理，能帮助我们更好地理解沙箱的本质和演进！

