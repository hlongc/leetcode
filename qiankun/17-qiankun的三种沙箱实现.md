# 问题17：qiankun 提供了哪几种沙箱实现？它们分别是什么，有什么区别？

## 📌 三种经典沙箱实现

qiankun 的沙箱经历了三代演进（基于旧版本的经典实现）：

1. **SnapshotSandbox**（快照沙箱）- 第一代
2. **LegacySandbox**（单例代理沙箱）- 第二代  
3. **ProxySandbox**（多例代理沙箱）- 第三代

**注意：** 新版qiankun已重构为StandardSandbox，但理解这三种经典实现对掌握沙箱原理非常重要。

## 🎯 三种沙箱对比

| 特性 | SnapshotSandbox | LegacySandbox | ProxySandbox |
|------|----------------|---------------|--------------|
| **原理** | 快照对比 | Proxy代理 + 修改记录 | Proxy代理 + 独立对象 |
| **浏览器要求** | 无要求 | 支持Proxy | 支持Proxy |
| **性能** | 差（遍历window） | 中 | 好 |
| **多实例** | ❌ 不支持 | ❌ 不支持 | ✅ 支持 |
| **隔离程度** | 低 | 中 | 高 |
| **激活时操作** | 恢复快照 | 恢复修改 | 无需恢复 |
| **失活时操作** | 保存快照 | 记录修改 | 无需记录 |
| **适用场景** | 不支持Proxy的老浏览器 | 单实例应用 | 多实例应用 |

## 1️⃣ SnapshotSandbox（快照沙箱）

### 核心思想

通过快照（snapshot）记录 window 对象，每次激活时恢复快照，失活时对比差异并恢复原状。

### 实现原理

```javascript
// 简化版实现
class SnapshotSandbox {
    constructor(name) {
        this.name = name;
        this.snapshot = {};  // 快照
        this.modifyPropsMap = {};  // 修改记录
    }

    // 激活沙箱
    active() {
        // 1. 保存当前 window 状态（快照）
        this.snapshot = {};
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                this.snapshot[prop] = window[prop];
            }
        }

        // 2. 恢复上次的修改
        Object.keys(this.modifyPropsMap).forEach(prop => {
            window[prop] = this.modifyPropsMap[prop];
        });
    }

    // 失活沙箱
    inactive() {
        this.modifyPropsMap = {};

        // 对比当前 window 和快照的差异
        for (const prop in window) {
            if (window[prop] !== this.snapshot[prop]) {
                // 记录修改
                this.modifyPropsMap[prop] = window[prop];
                
                // 恢复原值
                window[prop] = this.snapshot[prop];
            }
        }
    }
}
```

### 使用示例

```javascript
const sandbox = new SnapshotSandbox('app1');

console.log(window.user);  // undefined

// 激活沙箱
sandbox.active();

// 子应用运行，修改全局变量
window.user = { id: 1, name: 'App1' };
window.config = { theme: 'dark' };

console.log(window.user);  // { id: 1, name: 'App1' }

// 失活沙箱
sandbox.inactive();

console.log(window.user);  // undefined （恢复了）
console.log(window.config);  // undefined （恢复了）

// 再次激活
sandbox.active();

console.log(window.user);  // { id: 1, name: 'App1' } （恢复了子应用的状态）
console.log(window.config);  // { theme: 'dark' } （恢复了子应用的状态）
```

### 优点

1. **兼容性好**：不依赖 Proxy，支持所有浏览器
2. **实现简单**：逻辑清晰，易于理解
3. **完全恢复**：可以恢复子应用的运行状态

### 缺点

1. **性能差**：需要遍历整个 window 对象（数千个属性）
2. **不支持多实例**：同一时间只能有一个应用运行
3. **有污染**：运行时直接修改全局 window
4. **无法处理并发**：多个应用同时运行会冲突

### 适用场景

- 不支持 Proxy 的老浏览器（IE11 等）
- 应用数量少，性能要求不高
- 单实例应用

## 2️⃣ LegacySandbox（单例代理沙箱）

### 核心思想

使用 Proxy 代理 window，记录所有修改和新增的属性，失活时恢复。

### 实现原理

```javascript
// 简化版实现
class LegacySandbox {
    constructor(name) {
        this.name = name;
        this.addedPropsMap = new Map();  // 新增属性
        this.modifiedPropsMap = new Map();  // 修改属性（记录原始值）
        this.currentUpdatedPropsMap = new Map();  // 当前值

        const { addedPropsMap, modifiedPropsMap, currentUpdatedPropsMap } = this;
        const rawWindow = window;
        
        // 创建代理
        const fakeWindow = new Proxy(rawWindow, {
            get(target, prop) {
                return target[prop];
            },
            
            set(target, prop, value) {
                // 如果 window 上没有这个属性，记录为新增
                if (!target.hasOwnProperty(prop)) {
                    addedPropsMap.set(prop, value);
                } 
                // 如果之前没有记录过，记录原始值
                else if (!modifiedPropsMap.has(prop)) {
                    const originalValue = target[prop];
                    modifiedPropsMap.set(prop, originalValue);
                }

                // 记录当前值
                currentUpdatedPropsMap.set(prop, value);
                
                // 设置到真实 window
                target[prop] = value;
                
                return true;
            }
        });

        this.proxy = fakeWindow;
    }

    // 激活沙箱
    active() {
        // 恢复所有修改
        this.currentUpdatedPropsMap.forEach((value, prop) => {
            window[prop] = value;
        });
    }

    // 失活沙箱
    inactive() {
        // 恢复被修改的属性
        this.modifiedPropsMap.forEach((value, prop) => {
            window[prop] = value;
        });

        // 删除新增的属性
        this.addedPropsMap.forEach((_, prop) => {
            delete window[prop];
        });
    }
}
```

### 使用示例

```javascript
const sandbox = new LegacySandbox('app1');

// 激活沙箱
sandbox.active();

// 子应用使用代理对象（而不是直接使用 window）
const fakeWindow = sandbox.proxy;

// 修改属性（通过代理）
fakeWindow.user = { id: 1, name: 'App1' };
fakeWindow.newProp = 'new value';

console.log(window.user);  // { id: 1, name: 'App1' } （真实window被修改）
console.log(window.newProp);  // 'new value'

// 失活沙箱
sandbox.inactive();

console.log(window.user);  // undefined （恢复了）
console.log(window.newProp);  // undefined （删除了）

// 再次激活
sandbox.active();

console.log(window.user);  // { id: 1, name: 'App1' } （恢复了）
console.log(window.newProp);  // 'new value' （恢复了）
```

### 优点

1. **性能好**：使用 Proxy，不需要遍历
2. **记录精确**：准确记录新增和修改的属性
3. **恢复准确**：可以准确恢复到任意状态

### 缺点

1. **不支持多实例**：同一时间只能激活一个沙箱
2. **有污染**：运行时仍会修改全局 window
3. **需要 Proxy**：不支持老浏览器

### 关键差异

```javascript
// 问题：多个应用同时运行

// 应用A激活
sandboxA.active();
sandboxA.proxy.dataA = 'A';  
// window.dataA = 'A'

// 应用B激活（在A还运行时）
sandboxB.active();
sandboxB.proxy.dataB = 'B';
// window.dataB = 'B'

// 应用B修改了应用A的数据
sandboxB.proxy.dataA = 'Modified by B';
// window.dataA = 'Modified by B'  ❌ 冲突了！

// LegacySandbox 无法处理这种情况
```

### 适用场景

- 单实例应用（singular: true）
- 需要较好性能
- 支持 Proxy 的现代浏览器

## 3️⃣ ProxySandbox（多例代理沙箱）

### 核心思想

为每个沙箱创建一个独立的 fakeWindow 对象，通过 Proxy 代理这个对象，不直接修改全局 window。

### 实现原理

```javascript
// 简化版实现
class ProxySandbox {
    constructor(name) {
        this.name = name;
        this.running = false;
        
        // ⭐ 关键：创建独立的 fakeWindow 对象
        const fakeWindow = Object.create(null);
        
        const proxy = new Proxy(fakeWindow, {
            get(target, prop) {
                // 优先从 fakeWindow 读取
                if (prop in target) {
                    return target[prop];
                }
                
                // 不存在则从真实 window 读取
                const value = window[prop];
                
                // 如果是函数，绑定 window 作为 this
                if (typeof value === 'function' && !value.prototype) {
                    return value.bind(window);
                }
                
                return value;
            },
            
            set(target, prop, value) {
                if (this.running) {
                    // ⭐ 设置到 fakeWindow，不影响真实 window
                    target[prop] = value;
                }
                return true;
            },
            
            has(target, prop) {
                // 先查 fakeWindow，再查 window
                return prop in target || prop in window;
            }
        });

        this.proxy = proxy;
    }

    active() {
        this.running = true;
    }

    inactive() {
        this.running = false;
    }
}
```

### 使用示例

```javascript
const sandboxA = new ProxySandbox('appA');
const sandboxB = new ProxySandbox('appB');

// 激活两个沙箱
sandboxA.active();
sandboxB.active();

// 应用A设置数据
sandboxA.proxy.user = { id: 1, name: 'UserA' };
sandboxA.proxy.config = { theme: 'dark' };

// 应用B设置数据
sandboxB.proxy.user = { id: 2, name: 'UserB' };
sandboxB.proxy.config = { theme: 'light' };

// 读取各自的数据
console.log(sandboxA.proxy.user);  // { id: 1, name: 'UserA' }
console.log(sandboxB.proxy.user);  // { id: 2, name: 'UserB' }

// 真实 window 未被污染
console.log(window.user);  // undefined ✓
console.log(window.config);  // undefined ✓

// 可以同时运行，互不影响 ✓
```

### 优点

1. **完全隔离**：每个沙箱有独立的 fakeWindow
2. **支持多实例**：可以同时运行多个应用
3. **无污染**：不修改真实 window
4. **性能好**：使用 Proxy，不需要遍历

### 缺点

1. **无法处理非标准属性访问**：某些特殊场景可能有问题
2. **需要 Proxy**：不支持老浏览器

### 关键设计

```javascript
// ProxySandbox 的核心：独立的 fakeWindow

// 应用A的 fakeWindow
fakeWindowA = {
    user: { id: 1 },
    data: 'A'
}

// 应用B的 fakeWindow
fakeWindowB = {
    user: { id: 2 },
    data: 'B'
}

// 真实 window（完全未被修改）
window = {
    // 原有属性
    location: { ... },
    document: { ... },
    // 没有 user
    // 没有 data
}

// 完美隔离 ✓
```

### 适用场景

- 多实例应用（singular: false）
- 需要同时运行多个应用
- 对隔离性要求高
- 支持 Proxy 的现代浏览器

## 📊 三种沙箱的演进

### 第一代：SnapshotSandbox

```javascript
// 思路：遍历 window，记录快照

// 问题：
// 1. 性能差（遍历几千个属性）
// 2. 不支持多实例
// 3. 运行时污染 window

// 优点：
// 1. 兼容性好
// 2. 实现简单
```

### 第二代：LegacySandbox

```javascript
// 思路：使用 Proxy，记录修改

// 改进：
// 1. 性能好（不需要遍历）
// 2. 记录精确

// 遗留问题：
// 1. 仍不支持多实例
// 2. 仍污染 window
```

### 第三代：ProxySandbox

```javascript
// 思路：独立的 fakeWindow

// 终极方案：
// 1. 完全隔离
// 2. 支持多实例
// 3. 不污染 window
// 4. 性能好
```

## 🎯 如何选择沙箱？

### qiankun 的自动选择逻辑（旧版）

```javascript
function createSandbox(name, options) {
    const { singular, loose } = options;
    
    // 1. 不支持 Proxy → SnapshotSandbox
    if (!window.Proxy) {
        return new SnapshotSandbox(name);
    }
    
    // 2. 单实例模式 → LegacySandbox
    if (singular) {
        return new LegacySandbox(name);
    }
    
    // 3. 多实例模式 → ProxySandbox
    return new ProxySandbox(name);
}
```

### 推荐配置

```javascript
// 现代浏览器 + 单实例
start({
    singular: true,  // LegacySandbox
    sandbox: true
});

// 现代浏览器 + 多实例
start({
    singular: false,  // ProxySandbox
    sandbox: true
});

// 老浏览器
start({
    singular: true,  // SnapshotSandbox（自动降级）
    sandbox: true
});
```

## 🆕 新版本：StandardSandbox

新版qiankun重构了沙箱实现，使用了Membrane和Compartment架构：

```typescript
// packages/sandbox/src/core/sandbox/StandardSandbox.ts
export class StandardSandbox extends Compartment implements Sandbox {
    private readonly membrane: Membrane;
    
    // 使用 Membrane（膜）来隔离全局对象
    // 使用 Compartment（隔间）来创建独立的执行环境
    
    // 优点：
    // 1. 更彻底的隔离
    // 2. 更好的性能
    // 3. 更灵活的配置
}
```

## 🎓 面试要点

### 三种沙箱

1. **SnapshotSandbox**：快照对比，兼容性好但性能差
2. **LegacySandbox**：Proxy + 修改记录，单实例
3. **ProxySandbox**：Proxy + 独立对象，多实例

### 核心区别

1. **隔离程度**：Snapshot < Legacy < Proxy
2. **性能**：Snapshot < Legacy ≈ Proxy
3. **多实例**：只有 Proxy 支持
4. **污染程度**：Snapshot = Legacy > Proxy

### 选择依据

1. **浏览器支持**：Proxy 可用性
2. **实例数量**：单实例 vs 多实例
3. **性能要求**：遍历 vs 代理
4. **隔离要求**：污染 vs 隔离

### 演进趋势

1. **第一代**：解决有无问题
2. **第二代**：解决性能问题
3. **第三代**：解决隔离问题
4. **新版本**：架构重构，更彻底的隔离

## 💡 总结

| 沙箱 | 原理 | 优点 | 缺点 | 场景 |
|------|------|------|------|------|
| Snapshot | 快照对比 | 兼容性好 | 性能差 | 老浏览器 |
| Legacy | Proxy + 记录 | 性能好 | 不支持多实例 | 单实例 |
| Proxy | Proxy + 独立对象 | 完全隔离 | 需要Proxy | 多实例 |

**qiankun 的沙箱演进体现了工程上的权衡：兼容性 → 性能 → 隔离性**

理解这三种沙箱的原理和演进，不仅能应对面试，更能深入理解微前端的核心技术！

