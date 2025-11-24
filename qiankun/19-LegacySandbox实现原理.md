# 问题19：LegacySandbox（单例代理沙箱）是如何工作的？为什么叫"Legacy"？

## 📌 LegacySandbox 的核心思想

**Proxy 代理 + 修改记录 + 差分恢复**

1. **使用 Proxy**：代理真实 window，拦截属性访问
2. **记录修改**：记录所有新增和修改的属性
3. **直接操作**：实际操作的是真实 window
4. **差分恢复**：失活时根据记录恢复

## 🎯 为什么叫 "Legacy"？

**Legacy = 遗留的、传统的**

因为它是**单实例模式**，一次只能运行一个应用，是从 SnapshotSandbox 到 ProxySandbox 的**过渡方案**：

- 相比 SnapshotSandbox：性能更好（使用 Proxy）
- 相比 ProxySandbox：功能受限（不支持多实例）
- 定位：过渡期的"遗留"实现

## 💻 完整实现（带详细注释）

```javascript
/**
 * LegacySandbox 单例代理沙箱
 * 基于 Proxy，但只支持单实例运行
 */
class LegacySandbox {
    constructor(name) {
        this.name = name;
        this.running = false;
        
        // 1. addedPropsMap: 记录新增的属性
        //    在沙箱运行期间，window 上新增的属性
        this.addedPropsMap = new Map();
        
        // 2. modifiedPropsOriginalValueMap: 记录被修改属性的原始值
        //    用于失活时恢复
        this.modifiedPropsOriginalValueMap = new Map();
        
        // 3. currentUpdatedPropsValueMap: 记录当前的修改值
        //    用于激活时恢复
        this.currentUpdatedPropsValueMap = new Map();

        const { addedPropsMap, modifiedPropsOriginalValueMap, currentUpdatedPropsValueMap } = this;
        const rawWindow = window;
        const fakeWindow = Object.create(null);  // 创建一个空对象作为代理目标

        // ===== 创建 Proxy =====
        this.proxy = new Proxy(fakeWindow, {
            // ===== set trap: 拦截属性设置 =====
            set(target, prop, value) {
                if (!rawWindow.hasOwnProperty(prop)) {
                    // 情况1: window 上不存在这个属性 → 新增
                    addedPropsMap.set(prop, value);
                } else if (!modifiedPropsOriginalValueMap.has(prop)) {
                    // 情况2: window 上有这个属性，但还没记录过 → 修改
                    // 记录原始值（只记录一次）
                    const originalValue = rawWindow[prop];
                    modifiedPropsOriginalValueMap.set(prop, originalValue);
                }

                // 记录当前值
                currentUpdatedPropsValueMap.set(prop, value);

                // ⭐ 关键：直接设置到真实 window
                rawWindow[prop] = value;

                return true;
            },

            // ===== get trap: 拦截属性读取 =====
            get(target, prop) {
                // 避免使用 window.window 或 window.self 逃逸
                if (prop === 'top' || prop === 'parent' || prop === 'window' || prop === 'self') {
                    return this.proxy;
                }

                // ⭐ 从真实 window 读取
                const value = rawWindow[prop];

                // 如果是函数，需要绑定 this 为 window
                // 避免 Illegal invocation 错误
                if (typeof value === 'function' && !value.prototype) {
                    const boundValue = value.bind(rawWindow);
                    
                    // 复制函数的静态属性
                    for (const key in value) {
                        boundValue[key] = value[key];
                    }
                    
                    return boundValue;
                }

                return value;
            },

            // ===== has trap: 拦截 in 操作符 =====
            has(target, prop) {
                return prop in rawWindow;
            },

            // ===== getOwnPropertyDescriptor trap =====
            getOwnPropertyDescriptor(target, prop) {
                return Object.getOwnPropertyDescriptor(rawWindow, prop);
            },

            // ===== ownKeys trap: 拦截 Object.keys() =====
            ownKeys(target) {
                return Object.keys(rawWindow);
            }
        });
    }

    /**
     * 激活沙箱
     */
    active() {
        if (!this.running) {
            // 恢复上次的修改
            this.currentUpdatedPropsValueMap.forEach((value, prop) => {
                window[prop] = value;
            });

            this.running = true;
        }
    }

    /**
     * 失活沙箱
     */
    inactive() {
        if (this.running) {
            // 恢复被修改的属性
            this.modifiedPropsOriginalValueMap.forEach((value, prop) => {
                window[prop] = value;
            });

            // 删除新增的属性
            this.addedPropsMap.forEach((_, prop) => {
                delete window[prop];
            });

            this.running = false;
        }
    }
}
```

## 🔍 详细执行流程

### 场景1: 首次运行

```javascript
const sandbox = new LegacySandbox('app1');

// ===== 初始状态 =====
console.log(window.user);  // undefined
console.log(window.data);  // undefined

// ===== 激活沙箱 =====
sandbox.active();
/*
currentUpdatedPropsValueMap 为空，什么都不做
running = true
*/

// ===== 子应用使用代理对象 =====
const fakeWindow = sandbox.proxy;

// 情况1: 设置新属性
fakeWindow.user = { id: 1, name: 'App1' };
/*
触发 set trap:
1. window.hasOwnProperty('user') → false
2. addedPropsMap.set('user', { id: 1, name: 'App1' })
3. currentUpdatedPropsValueMap.set('user', { id: 1, name: 'App1' })
4. window.user = { id: 1, name: 'App1' }  // ⭐ 直接设置到真实 window

状态：
addedPropsMap = { user: { id: 1, name: 'App1' } }
modifiedPropsOriginalValueMap = {}
currentUpdatedPropsValueMap = { user: { id: 1, name: 'App1' } }
*/

// 假设 window.location 已存在
// 情况2: 修改已存在的属性
const originalLocation = window.location;
fakeWindow.location = 'https://new-location.com';
/*
触发 set trap:
1. window.hasOwnProperty('location') → true
2. modifiedPropsOriginalValueMap.has('location') → false
3. modifiedPropsOriginalValueMap.set('location', originalLocation)
4. currentUpdatedPropsValueMap.set('location', 'https://new-location.com')
5. window.location = 'https://new-location.com'  // ⭐ 直接设置

状态：
addedPropsMap = { user: { id: 1, name: 'App1' } }
modifiedPropsOriginalValueMap = { location: originalLocation }
currentUpdatedPropsValueMap = { 
    user: { id: 1, name: 'App1' },
    location: 'https://new-location.com'
}
*/

// ===== 读取属性 =====
console.log(fakeWindow.user);  
// 触发 get trap → 返回 window.user → { id: 1, name: 'App1' }

console.log(window.user);
// { id: 1, name: 'App1' } - 真实 window 被修改了

// ===== 失活沙箱 =====
sandbox.inactive();
/*
步骤1: 恢复被修改的属性
modifiedPropsOriginalValueMap.forEach((value, prop) => {
    window.location = originalLocation;  // 恢复
});

步骤2: 删除新增的属性
addedPropsMap.forEach((_, prop) => {
    delete window.user;  // 删除
});

步骤3: 标记失活
running = false
*/

// ===== 失活后 =====
console.log(window.user);  // undefined ✓ 恢复了
console.log(window.location);  // originalLocation ✓ 恢复了
```

### 场景2: 再次激活

```javascript
// ===== 再次激活 =====
sandbox.active();
/*
恢复上次的修改：
currentUpdatedPropsValueMap.forEach((value, prop) => {
    window.user = { id: 1, name: 'App1' };
    window.location = 'https://new-location.com';
});

running = true
*/

console.log(window.user);  // { id: 1, name: 'App1' } ✓ 恢复了
console.log(window.location);  // 'https://new-location.com' ✓ 恢复了

// 子应用继续修改
fakeWindow.user.id = 100;  // 修改对象内部
fakeWindow.newData = 'new';  // 新增属性

// ===== 再次失活 =====
sandbox.inactive();
/*
恢复原状：
delete window.user;
delete window.newData;
window.location = originalLocation;
*/
```

## ⚠️ 为什么不支持多实例？

```javascript
const sandboxA = new LegacySandbox('appA');
const sandboxB = new LegacySandbox('appB');

// ===== 激活两个沙箱 =====
sandboxA.active();
sandboxB.active();

// ===== A 设置数据 =====
sandboxA.proxy.dataA = 'A';
/*
set trap 执行：
window.dataA = 'A'  // 设置到真实 window
sandboxA.addedPropsMap.set('dataA', 'A')
*/

// ===== B 设置数据 =====
sandboxB.proxy.dataB = 'B';
/*
set trap 执行：
window.dataB = 'B'  // 设置到真实 window
sandboxB.addedPropsMap.set('dataB', 'B')
*/

// ===== A 失活 =====
sandboxA.inactive();
/*
问题：A 会删除它新增的所有属性

sandboxA.addedPropsMap.forEach((_, prop) => {
    delete window.dataA;  // ✓ 正确
});

但此时 window 上还有 window.dataB（B 设置的）
A 的失活不会影响 B ✓

看起来没问题？
*/

// ===== 冲突场景 =====
sandboxA.active();
sandboxB.active();

// A 和 B 都操作同一个属性
sandboxA.proxy.shared = 'value from A';
/*
window.shared = 'value from A'
sandboxA.addedPropsMap.set('shared', 'value from A')
*/

sandboxB.proxy.shared = 'value from B';
/*
window.shared = 'value from B'  // 覆盖了 A 的值！
sandboxB.addedPropsMap.set('shared', 'value from B')
*/

// A 读取
console.log(sandboxA.proxy.shared);  // 'value from B' ❌ 期望是 'value from A'

// ===== 结论 =====
// 因为两个沙箱操作的是同一个 window
// 后设置的值会覆盖先设置的值
// 无法实现真正的隔离
```

## 🔑 关键设计特点

### 1. 直接操作真实 window

```javascript
set(target, prop, value) {
    // ...记录逻辑...
    
    // ⭐ 直接设置到真实 window
    window[prop] = value;
    
    return true;
}
```

**为什么这样设计？**

```javascript
// 问题：某些 API 必须在真实 window 上调用

// 场景1: DOM API
const div = document.createElement('div');
div.addEventListener('click', handler);

// 如果 document 不是真实的：
// TypeError: Illegal invocation

// 场景2: BOM API
window.addEventListener('resize', handler);
window.requestAnimationFrame(callback);

// 这些 API 内部会检查 this 是否是真实 window
// 必须在真实 window 上调用
```

### 2. 函数绑定处理

```javascript
get(target, prop) {
    const value = window[prop];

    // 如果是函数且没有 prototype（箭头函数或内置方法）
    if (typeof value === 'function' && !value.prototype) {
        // ⭐ 绑定 this 为真实 window
        const boundValue = value.bind(window);
        
        // 复制静态属性
        for (const key in value) {
            boundValue[key] = value[key];
        }
        
        return boundValue;
    }

    return value;
}
```

**为什么需要绑定？**

```javascript
// 问题：直接调用会丢失 this

const fakeWindow = sandbox.proxy;

// 没有绑定
const fetch1 = fakeWindow.fetch;
fetch1('https://api.com');
// ❌ TypeError: Illegal invocation
// 因为 fetch 内部的 this 不是 window

// 有绑定
const fetch2 = fakeWindow.fetch;  // get trap 返回 fetch.bind(window)
fetch2('https://api.com');
// ✓ 正常工作
```

### 3. 三个 Map 的协作

```javascript
// 示例：演示三个 Map 的关系

const sandbox = new LegacySandbox('app');
sandbox.active();

// ===== 操作1: 新增属性 =====
sandbox.proxy.newProp = 'new';
/*
addedPropsMap: { newProp: 'new' }
modifiedPropsOriginalValueMap: {}
currentUpdatedPropsValueMap: { newProp: 'new' }
*/

// ===== 操作2: 修改已存在的属性 =====
window.existingProp = 'original';
sandbox.proxy.existingProp = 'modified';
/*
addedPropsMap: { newProp: 'new' }
modifiedPropsOriginalValueMap: { existingProp: 'original' }  // 记录原始值
currentUpdatedPropsValueMap: { 
    newProp: 'new',
    existingProp: 'modified'  // 记录当前值
}
*/

// ===== 操作3: 再次修改 =====
sandbox.proxy.existingProp = 'modified again';
/*
addedPropsMap: { newProp: 'new' }
modifiedPropsOriginalValueMap: { existingProp: 'original' }  // 不变（已记录）
currentUpdatedPropsValueMap: { 
    newProp: 'new',
    existingProp: 'modified again'  // 更新当前值
}
*/

// ===== 失活沙箱 =====
sandbox.inactive();
/*
1. 恢复修改：
   window.existingProp = 'original'

2. 删除新增：
   delete window.newProp

结果：
window.existingProp = 'original' ✓
window.newProp = undefined ✓
*/

// ===== 再次激活 =====
sandbox.active();
/*
恢复当前值：
window.newProp = 'new'
window.existingProp = 'modified again'

结果：
window.existingProp = 'modified again' ✓
window.newProp = 'new' ✓
*/
```

## 🎨 与 SnapshotSandbox 的对比

### 性能对比

```javascript
// ===== SnapshotSandbox =====
active() {
    // 遍历整个 window
    for (const prop in window) {
        this.snapshot[prop] = window[prop];  // O(n)
    }
}

inactive() {
    // 再次遍历整个 window
    for (const prop in window) {
        if (window[prop] !== this.snapshot[prop]) {  // O(n)
            // ...
        }
    }
}

// 时间复杂度: O(n)，n = window 属性数量（几千个）

// ===== LegacySandbox =====
active() {
    // 只恢复修改过的属性
    this.currentUpdatedPropsValueMap.forEach((value, prop) => {
        window[prop] = value;  // O(m)
    });
}

inactive() {
    // 只恢复修改过的属性
    this.modifiedPropsOriginalValueMap.forEach((value, prop) => {
        window[prop] = value;  // O(m)
    });
}

// 时间复杂度: O(m)，m = 修改的属性数量（通常几十个）
// m << n，性能提升明显！
```

**实测：**

```javascript
// 假设 window 有 1000 个属性，子应用修改了 10 个

// SnapshotSandbox
// active: 遍历 1000 个属性，耗时 ~5ms
// inactive: 遍历 1000 个属性，耗时 ~5ms

// LegacySandbox  
// active: 恢复 10 个属性，耗时 ~0.5ms
// inactive: 恢复 10 个属性，耗时 ~0.5ms

// 性能提升: 10倍！
```

### 记录精确度对比

```javascript
// ===== SnapshotSandbox =====
// 问题：无法区分新增和修改

inactive() {
    for (const prop in window) {
        if (window[prop] !== this.snapshot[prop]) {
            // 是新增还是修改？不知道
            this.modifyPropsMap[prop] = window[prop];
        }
    }
}

// ===== LegacySandbox =====
// 准确区分新增和修改

set(target, prop, value) {
    if (!window.hasOwnProperty(prop)) {
        // 明确是新增
        addedPropsMap.set(prop, value);
    } else if (!modifiedPropsOriginalValueMap.has(prop)) {
        // 明确是修改
        modifiedPropsOriginalValueMap.set(prop, window[prop]);
    }
}

// 好处：
// 1. 失活时可以精确恢复
// 2. 新增的属性可以删除
// 3. 修改的属性可以还原
```

## ✅ 优点

### 1. 性能好

```javascript
// 只处理修改的属性，不遍历整个 window
// 激活/失活耗时: < 1ms
```

### 2. 记录精确

```javascript
// 准确记录新增、修改、当前值
// 可以精确恢复任意状态
```

### 3. 支持 Proxy 的所有特性

```javascript
// 可以拦截各种操作
'prop' in fakeWindow  // 触发 has trap
Object.keys(fakeWindow)  // 触发 ownKeys trap
Object.getOwnPropertyDescriptor(fakeWindow, 'prop')  // 触发 getOwnPropertyDescriptor trap
```

## ❌ 缺点

### 1. 仍然污染 window

```javascript
sandbox.active();
sandbox.proxy.data = 'value';

// 真实 window 被修改了
console.log(window.data);  // 'value' - 有污染
```

### 2. 不支持多实例

```javascript
// 两个沙箱会冲突
sandboxA.active();
sandboxB.active();

sandboxA.proxy.shared = 'A';
sandboxB.proxy.shared = 'B';  // 覆盖了 A 的值

console.log(sandboxA.proxy.shared);  // 'B' ❌ 不是 'A'
```

### 3. 某些属性无法代理

```javascript
// 不可配置的属性
Object.defineProperty(window, 'fixed', {
    value: 'fixed value',
    configurable: false,
    writable: false
});

// 无法修改
sandbox.proxy.fixed = 'new value';  // 静默失败或报错
```

## 🎓 面试要点

### 核心原理

1. **Proxy 代理**：拦截属性访问
2. **直接操作**：操作真实 window
3. **三个 Map**：记录新增、修改、当前值
4. **差分恢复**：根据记录精确恢复

### 与 SnapshotSandbox 的改进

1. **性能**：O(m) vs O(n)，m << n
2. **精确性**：区分新增和修改
3. **实时性**：通过 Proxy 实时拦截

### 为什么叫 Legacy

1. **过渡方案**：从 Snapshot 到 Proxy 的中间态
2. **单实例限制**：只能运行一个应用
3. **仍有污染**：修改真实 window
4. **被 ProxySandbox 替代**：多实例场景

### 关键技术

1. **Proxy traps**：set、get、has 等
2. **函数绑定**：避免 this 丢失
3. **Map 数据结构**：高效记录修改
4. **差分算法**：最小化恢复操作

## 💡 为什么不直接用 ProxySandbox？

```javascript
// 问题：为什么要有 LegacySandbox 这个过渡方案？

// 原因1: 单实例场景下，LegacySandbox 更简单
// - 不需要创建 fakeWindow
// - 直接操作真实 window，某些 API 兼容性更好

// 原因2: 渐进式迁移
// - 从 SnapshotSandbox 迁移到 LegacySandbox 风险小
// - 验证 Proxy 方案的可行性
// - 为 ProxySandbox 积累经验

// 原因3: 性能考虑
// - 单实例场景下，LegacySandbox 可能更快
// - 减少一层 fakeWindow 的查找

// 未来趋势：
// - 支持 Proxy 的浏览器占比越来越高
// - ProxySandbox 会成为主流
// - LegacySandbox 逐渐淡出（因此叫 Legacy）
```

LegacySandbox 是 qiankun 沙箱演进的重要一步，它用 Proxy 解决了性能问题，但仍保留了单实例的限制，为最终的 ProxySandbox 铺平了道路！

