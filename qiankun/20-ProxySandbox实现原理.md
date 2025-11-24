# 问题20：ProxySandbox（多例代理沙箱）的实现原理是什么？它如何实现多个应用同时运行？

## 📌 ProxySandbox 的核心思想

**独立 fakeWindow + Proxy 代理**

1. **独立对象**：每个沙箱创建独立的 fakeWindow 对象
2. **Proxy 代理**：代理 fakeWindow，不操作真实 window
3. **属性查找**：先查 fakeWindow，再查真实 window
4. **完全隔离**：多个沙箱互不影响

## 🎯 核心区别

| 特性 | LegacySandbox | ProxySandbox |
|------|--------------|--------------|
| **代理目标** | 真实 window | 独立的 fakeWindow |
| **属性设置** | 设置到真实 window | 设置到 fakeWindow |
| **多实例** | ❌ 不支持 | ✅ 支持 |
| **window 污染** | ✅ 有污染 | ❌ 无污染 |
| **激活成本** | 恢复属性 | 无需恢复 |
| **失活成本** | 恢复属性 | 无需恢复 |

## 💻 完整实现（带详细注释）

```javascript
/**
 * ProxySandbox 多例代理沙箱
 * 支持多个应用同时运行
 */
class ProxySandbox {
    constructor(name) {
        this.name = name;
        this.running = false;
        
        // ⭐ 关键：创建独立的 fakeWindow 对象
        const fakeWindow = Object.create(null);
        
        const rawWindow = window;
        const { running } = this;

        // ===== 创建 Proxy =====
        this.proxy = new Proxy(fakeWindow, {
            // ===== set trap: 拦截属性设置 =====
            set: (target, prop, value) => {
                if (this.running) {
                    // ⭐ 核心：设置到 fakeWindow，不影响真实 window
                    target[prop] = value;
                    return true;
                }

                // 沙箱未激活时，警告但不抛错
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[qiankun] Set window.${prop} while sandbox ${this.name} is not running!`);
                }

                return true;
            },

            // ===== get trap: 拦截属性读取 =====
            get: (target, prop) => {
                // 避免通过 window.window 逃逸
                if (prop === 'top' || prop === 'parent' || prop === 'window' || prop === 'self') {
                    return this.proxy;
                }

                // ⭐ 优先从 fakeWindow 读取
                if (prop in target) {
                    return target[prop];
                }

                // ⭐ 不存在则从真实 window 读取
                const value = rawWindow[prop];

                // 如果是函数，需要特殊处理
                if (typeof value === 'function') {
                    // 有 prototype 的函数（构造函数），直接返回
                    if (value.prototype) {
                        return value;
                    }

                    // 没有 prototype 的函数（箭头函数、内置方法）
                    // 绑定 this 为真实 window
                    const boundValue = value.bind(rawWindow);

                    // 复制函数的属性
                    Object.keys(value).forEach(key => {
                        boundValue[key] = value[key];
                    });

                    return boundValue;
                }

                return value;
            },

            // ===== has trap: 拦截 in 操作符 =====
            has: (target, prop) => {
                // 先查 fakeWindow，再查 window
                return prop in target || prop in rawWindow;
            },

            // ===== getOwnPropertyDescriptor trap =====
            getOwnPropertyDescriptor: (target, prop) => {
                // 优先从 fakeWindow 获取
                if (prop in target) {
                    return Object.getOwnPropertyDescriptor(target, prop);
                }

                // 从 window 获取
                const descriptor = Object.getOwnPropertyDescriptor(rawWindow, prop);
                
                // 处理不可配置的属性
                if (descriptor && !descriptor.configurable) {
                    // 将不可配置改为可配置，避免 Proxy 报错
                    descriptor.configurable = true;
                }

                return descriptor;
            },

            // ===== ownKeys trap: 拦截 Object.keys() =====
            ownKeys: (target) => {
                // 合并 fakeWindow 和 window 的 keys
                return Array.from(new Set([
                    ...Object.keys(target),
                    ...Object.keys(rawWindow)
                ]));
            },

            // ===== deleteProperty trap: 拦截 delete =====
            deleteProperty: (target, prop) => {
                if (this.running) {
                    if (prop in target) {
                        delete target[prop];
                    }
                    return true;
                }
                return true;
            },

            // ===== getPrototypeOf trap: 支持 instanceof =====
            getPrototypeOf: () => {
                // 让 proxy instanceof Window 返回 true
                return Reflect.getPrototypeOf(rawWindow);
            }
        });
    }

    /**
     * 激活沙箱
     */
    active() {
        this.running = true;
        // ⭐ 无需恢复操作！
    }

    /**
     * 失活沙箱
     */
    inactive() {
        this.running = false;
        // ⭐ 无需恢复操作！
    }
}
```

## 🔍 多实例运行原理

### 核心：每个沙箱有独立的 fakeWindow

```javascript
const sandboxA = new ProxySandbox('appA');
const sandboxB = new ProxySandbox('appB');

// 两个独立的 fakeWindow
sandboxA.proxy.__fakeWindow__ = {
    // 应用A的数据
};

sandboxB.proxy.__fakeWindow__ = {
    // 应用B的数据
};

// 真实 window（完全不被修改）
window = {
    location: { /* ... */ },
    document: { /* ... */ },
    // 原有属性
};
```

### 详细执行示例

```javascript
const sandboxA = new ProxySandbox('appA');
const sandboxB = new ProxySandbox('appB');

// ===== 同时激活两个沙箱 =====
sandboxA.active();
sandboxB.active();

// ===== 应用A设置数据 =====
sandboxA.proxy.user = { id: 1, name: 'UserA' };
sandboxA.proxy.config = { theme: 'dark' };
/*
触发 sandboxA 的 set trap:
1. this.running = true ✓
2. target['user'] = { id: 1, name: 'UserA' }
3. target['config'] = { theme: 'dark' }

sandboxA 的 fakeWindow:
{
    user: { id: 1, name: 'UserA' },
    config: { theme: 'dark' }
}

真实 window: {} (未被修改)
*/

// ===== 应用B设置数据 =====
sandboxB.proxy.user = { id: 2, name: 'UserB' };
sandboxB.proxy.config = { theme: 'light' };
/*
触发 sandboxB 的 set trap:
1. this.running = true ✓
2. target['user'] = { id: 2, name: 'UserB' }
3. target['config'] = { theme: 'light' }

sandboxB 的 fakeWindow:
{
    user: { id: 2, name: 'UserB' },
    config: { theme: 'light' }
}

真实 window: {} (未被修改)
*/

// ===== 读取各自的数据 =====
console.log(sandboxA.proxy.user);
/*
触发 sandboxA 的 get trap:
1. 'user' in target? → true
2. return target['user'] → { id: 1, name: 'UserA' } ✓
*/

console.log(sandboxB.proxy.user);
/*
触发 sandboxB 的 get trap:
1. 'user' in target? → true
2. return target['user'] → { id: 2, name: 'UserB' } ✓
*/

console.log(window.user);  // undefined ✓ 真实 window 未被污染

// ===== 完美隔离 =====
// sandboxA.fakeWindow.user !== sandboxB.fakeWindow.user
// 两个应用完全独立
```

## 🔄 属性查找的优先级

```javascript
// fakeWindow 优先，window 兜底

const sandbox = new ProxySandbox('app');
sandbox.active();

// ===== 情况1: 设置新属性 =====
sandbox.proxy.myData = 'value';
// 设置到 fakeWindow.myData

console.log(sandbox.proxy.myData);
/*
get trap:
1. 'myData' in fakeWindow? → true
2. return fakeWindow.myData → 'value' ✓
*/

// ===== 情况2: 读取原生属性 =====
console.log(sandbox.proxy.location);
/*
get trap:
1. 'location' in fakeWindow? → false
2. 'location' in window? → true
3. return window.location → Location对象 ✓
*/

// ===== 情况3: 覆盖原生属性 =====
sandbox.proxy.location = 'https://new-location.com';
// 设置到 fakeWindow.location（不影响真实 window.location）

console.log(sandbox.proxy.location);  // 'https://new-location.com'
console.log(window.location);  // Location对象（未被修改）✓

// ===== 情况4: 删除自定义属性 =====
delete sandbox.proxy.myData;
/*
deleteProperty trap:
delete fakeWindow.myData
*/

console.log(sandbox.proxy.myData);
/*
get trap:
1. 'myData' in fakeWindow? → false
2. 'myData' in window? → false
3. return undefined
*/
```

## 🎨 激活/失活的零成本

```javascript
const sandbox = new ProxySandbox('app');

// ===== 激活 =====
console.time('active');
sandbox.active();
console.timeEnd('active');
// active: < 0.01ms ✓ 几乎无开销

// 原因：只是设置 running = true
// 不需要恢复任何属性

// ===== 失活 =====
console.time('inactive');
sandbox.inactive();
console.timeEnd('inactive');
// inactive: < 0.01ms ✓ 几乎无开销

// 原因：只是设置 running = false
// 不需要恢复任何属性

// fakeWindow 中的数据仍然存在
// 下次激活时直接可用
```

**对比其他沙箱：**

```javascript
// SnapshotSandbox
active: 5-10ms  (遍历 window)
inactive: 5-10ms  (对比差异)

// LegacySandbox
active: 0.5-1ms  (恢复修改)
inactive: 0.5-1ms  (记录修改)

// ProxySandbox
active: < 0.01ms  (只改标志位)
inactive: < 0.01ms  (只改标志位)

// ProxySandbox 性能最优！
```

## 🔐 完全隔离的实现

### 新增属性完全隔离

```javascript
sandboxA.active();
sandboxB.active();

sandboxA.proxy.dataA = 'A';
// fakeWindowA = { dataA: 'A' }
// fakeWindowB = {}
// window = {}

sandboxB.proxy.dataB = 'B';
// fakeWindowA = { dataA: 'A' }
// fakeWindowB = { dataB: 'B' }
// window = {}

console.log(sandboxA.proxy.dataA);  // 'A' ✓
console.log(sandboxA.proxy.dataB);  // undefined ✓
console.log(sandboxB.proxy.dataA);  // undefined ✓
console.log(sandboxB.proxy.dataB);  // 'B' ✓
console.log(window.dataA);  // undefined ✓
console.log(window.dataB);  // undefined ✓

// 完全隔离！
```

### 修改原生属性隔离

```javascript
// 真实 window
window.originalProp = 'original';

sandboxA.active();
sandboxB.active();

// A 修改原生属性
sandboxA.proxy.originalProp = 'modified by A';
/*
set trap:
1. this.running = true
2. fakeWindowA['originalProp'] = 'modified by A'
*/

// B 也修改原生属性
sandboxB.proxy.originalProp = 'modified by B';
/*
set trap:
1. this.running = true
2. fakeWindowB['originalProp'] = 'modified by B'
*/

// 读取各自的值
console.log(sandboxA.proxy.originalProp);
/*
get trap:
1. 'originalProp' in fakeWindowA? → true
2. return fakeWindowA.originalProp → 'modified by A' ✓
*/

console.log(sandboxB.proxy.originalProp);
/*
get trap:
1. 'originalProp' in fakeWindowB? → true
2. return fakeWindowB.originalProp → 'modified by B' ✓
*/

// 真实 window 未被修改
console.log(window.originalProp);  // 'original' ✓

// 完美隔离！
```

## 🔍 关键实现细节

### 1. fakeWindow 的创建

```javascript
// 为什么用 Object.create(null)?

// ❌ 错误：使用 {}
const fakeWindow = {};
console.log(fakeWindow.toString);  // [Function: toString]
// 继承了 Object.prototype 的属性

// ✅ 正确：使用 Object.create(null)
const fakeWindow = Object.create(null);
console.log(fakeWindow.toString);  // undefined
// 纯净的对象，没有任何继承属性

// 好处：
// 1. 避免原型链污染
// 2. 属性查找更纯粹
// 3. 性能更好（减少原型链查找）
```

### 2. 属性查找链

```javascript
get: (target, prop) => {
    // 查找顺序：
    // 1. fakeWindow（沙箱自己的属性）
    if (prop in target) {
        return target[prop];
    }
    
    // 2. window（原生属性）
    const value = window[prop];
    
    // 3. 函数绑定处理
    if (typeof value === 'function' && !value.prototype) {
        return value.bind(window);
    }
    
    return value;
}
```

**查找示例：**

```javascript
const sandbox = new ProxySandbox('app');
sandbox.active();

// 场景1: 读取原生属性
sandbox.proxy.document;
/*
1. 'document' in fakeWindow? → false
2. 返回 window.document ✓
*/

// 场景2: 读取自定义属性
sandbox.proxy.myData = 'value';
sandbox.proxy.myData;
/*
1. 'myData' in fakeWindow? → true
2. 返回 fakeWindow.myData → 'value' ✓
*/

// 场景3: 读取被覆盖的原生属性
sandbox.proxy.location = 'custom';
sandbox.proxy.location;
/*
1. 'location' in fakeWindow? → true
2. 返回 fakeWindow.location → 'custom' ✓
（不是 window.location）
*/
```

### 3. 函数绑定的重要性

```javascript
// 问题场景：DOM API 必须在真实 window 上调用

const sandbox = new ProxySandbox('app');
sandbox.active();

// ===== 没有绑定（会报错）=====
const addEventListener = sandbox.proxy.addEventListener;
// addEventListener 的 this 是 fakeWindow

addEventListener('click', handler);
// ❌ TypeError: Illegal invocation
// 因为 addEventListener 期望 this 是真实 window

// ===== 有绑定（正常工作）=====
const addEventListener = sandbox.proxy.addEventListener;
// get trap 返回 window.addEventListener.bind(window)
// this 绑定为真实 window

addEventListener('click', handler);
// ✓ 正常工作

// ===== 其他需要绑定的 API =====
sandbox.proxy.fetch('https://api.com');  // 需要绑定
sandbox.proxy.setTimeout(fn, 1000);       // 需要绑定
sandbox.proxy.requestAnimationFrame(fn);  // 需要绑定
sandbox.proxy.alert('hello');             // 需要绑定
```

### 4. 构造函数的特殊处理

```javascript
get: (target, prop) => {
    const value = window[prop];
    
    if (typeof value === 'function') {
        // ===== 有 prototype：构造函数 =====
        if (value.prototype) {
            // 直接返回，不绑定
            return value;
        }
        
        // ===== 无 prototype：普通函数/箭头函数 =====
        // 绑定 this
        return value.bind(window);
    }
    
    return value;
}
```

**为什么构造函数不绑定？**

```javascript
const sandbox = new ProxySandbox('app');

// ===== 构造函数 =====
const MyClass = sandbox.proxy.XMLHttpRequest;
const xhr = new MyClass();  // 需要用 new 调用

// 如果绑定了：
const boundXHR = XMLHttpRequest.bind(window);
const xhr = new boundXHR();
// ❌ 可能会有问题（某些构造函数不允许 bind）

// 不绑定，直接返回：
const MyClass = XMLHttpRequest;
const xhr = new MyClass();
// ✓ 正常工作

// ===== 普通函数/方法 =====
const fetch = sandbox.proxy.fetch;
fetch('https://api.com');  // 不用 new，必须绑定 this

// 如果不绑定：
const fetch = window.fetch;
fetch('https://api.com');
// ❌ TypeError: Illegal invocation

// 绑定后：
const fetch = window.fetch.bind(window);
fetch('https://api.com');
// ✓ 正常工作
```

## 📊 三种沙箱的数据结构对比

```javascript
// ===== SnapshotSandbox =====
{
    windowSnapshot: {
        prop1: value1,
        prop2: value2,
        // ... 整个 window 的副本
    },
    modifyPropsMap: {
        userProp1: value,
        userProp2: value
    }
}

// ===== LegacySandbox =====
{
    addedPropsMap: Map {
        'newProp1' => value1,
        'newProp2' => value2
    },
    modifiedPropsOriginalValueMap: Map {
        'existingProp1' => originalValue1,
        'existingProp2' => originalValue2
    },
    currentUpdatedPropsValueMap: Map {
        'newProp1' => value1,
        'newProp2' => value2,
        'existingProp1' => modifiedValue1,
        'existingProp2' => modifiedValue2
    }
}

// ===== ProxySandbox =====
{
    fakeWindow: {
        // 只存储子应用的属性
        userProp1: value1,
        userProp2: value2,
        // 没有 window 的几千个原生属性
    }
}

// ProxySandbox 内存占用最小！
```

## 🎓 面试要点

### 核心原理

1. **独立 fakeWindow**：每个沙箱有独立对象
2. **Proxy 代理**：代理 fakeWindow
3. **属性查找**：fakeWindow 优先，window 兜底
4. **零成本激活**：无需恢复操作

### 多实例支持

1. **独立存储**：每个沙箱的数据在独立的 fakeWindow
2. **完全隔离**：沙箱间互不影响
3. **window 不污染**：真实 window 保持纯净

### 关键技术

1. **Object.create(null)**：创建纯净对象
2. **函数绑定**：处理 this 丢失
3. **构造函数识别**：有无 prototype
4. **原型链处理**：支持 instanceof

### 性能优势

1. **激活快**：< 0.01ms
2. **失活快**：< 0.01ms
3. **内存小**：只存储修改的属性
4. **查找快**：直接对象查找

## 💡 为什么 ProxySandbox 是最优方案？

### 解决了所有问题

```javascript
// ✅ 兼容性：需要 Proxy（现代浏览器都支持）
// ✅ 性能：激活/失活零成本
// ✅ 隔离性：完全隔离，不污染 window
// ✅ 多实例：支持同时运行多个应用
// ✅ 内存：只存储修改的属性
// ✅ 准确性：不会误伤其他应用
```

### 唯一的限制

```javascript
// 需要 Proxy 支持

if (!window.Proxy) {
    // 降级到 SnapshotSandbox
    return new SnapshotSandbox(name);
}

// 现代浏览器支持情况：
// Chrome 49+  ✓
// Firefox 18+ ✓
// Safari 10+  ✓
// Edge 12+    ✓
// IE 11       ❌ (不支持)

// 覆盖率: > 95% 的用户
```

ProxySandbox 通过引入独立的 fakeWindow，彻底解决了沙箱隔离的问题，是 qiankun 沙箱的最终形态，也是理解微前端隔离机制的关键！

