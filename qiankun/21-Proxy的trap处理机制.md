# 问题21：沙箱如何处理 window 对象的属性修改？Proxy 的 get、set、has 等 trap 分别做了什么？

## 📌 Proxy 的核心 Traps

qiankun 沙箱使用 Proxy 拦截对 window 的各种操作，主要使用以下 traps：

1. **set**：拦截属性设置（`window.prop = value`）
2. **get**：拦截属性读取（`window.prop`）
3. **has**：拦截 in 操作符（`'prop' in window`）
4. **deleteProperty**：拦截 delete 操作（`delete window.prop`）
5. **getOwnPropertyDescriptor**：拦截属性描述符获取
6. **ownKeys**：拦截 `Object.keys(window)`
7. **getPrototypeOf**：拦截原型链查询

## 🎯 1. set Trap（属性设置）

### ProxySandbox 的 set 实现

```javascript
set: (target, prop, value) => {
    // ===== 检查沙箱状态 =====
    if (this.running) {
        // ⭐ 设置到 fakeWindow
        target[prop] = value;
        return true;
    }

    // 沙箱未激活，警告但不阻止
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[qiankun] Set window.${prop} while sandbox is not running!`);
    }

    return true;
}
```

### 新版 Membrane 的 set 实现（更复杂）

```typescript
// packages/sandbox/src/core/membrane/index.ts: 98-134
set: (membraneTarget, p, value: never) => {
    if (!this.locking) {
        // ===== 白名单属性：设置到真实 window =====
        if (typeof p === 'string' && whitelistVars.indexOf(p) !== -1) {
            incubatorContext[p as never] = value;
        } else {
            // ===== 普通属性：设置到 membraneTarget =====
            
            // 如果原来在 incubatorContext（真实window）上存在
            if (!hasOwnProperty(membraneTarget, p) && hasOwnProperty(incubatorContext, p)) {
                const descriptor = getOwnPropertyDescriptor(incubatorContext, p);
                const { writable, configurable, enumerable } = descriptor!;
                
                // 只有可写属性才能覆盖
                if (writable || hasOwnProperty(descriptor, 'set')) {
                    defineProperty(membraneTarget, p, { 
                        configurable, 
                        enumerable, 
                        writable: true, 
                        value 
                    });
                }
            } else {
                // 新属性或已在 membraneTarget 上的属性
                membraneTarget[p] = value;
            }
        }

        // ⭐ 记录修改
        this.modifications.add(p);

        // ⭐ 记录最后设置的属性（用于获取 entry 导出）
        this.latestSetProp = p;

        return true;
    }

    // 沙箱已锁定（失活），忽略设置
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[qiankun] Set window.${p.toString()} while sandbox destroyed or inactive!`);
    }

    return true;
}
```

### 白名单机制

```typescript
// packages/sandbox/src/core/membrane/index.ts: 39-48
const globalVariableWhiteList: string[] = [
    'System',  // System.js 需要在真实 window 上
    '__cjsWrapper',  // CommonJS wrapper
    // 开发环境
    '__REACT_ERROR_OVERLAY_GLOBAL_HOOK__',  // React 热更新
    'event',  // React 开发事件
];
```

**为什么需要白名单？**

```javascript
// 某些全局变量必须在真实 window 上，否则功能会失效

// 例子1: System.js
// System.js 通过间接 eval 调用，需要逃逸到全局作用域
sandbox.proxy.System = SystemJS;
// 如果设置到 fakeWindow，System.js 无法工作
// 必须设置到真实 window

// 例子2: React 热更新
sandbox.proxy.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = hook;
// 热更新需要在真实 window 上才能跨应用工作

// 白名单属性会穿透沙箱，直接设置到真实 window
```

### 属性描述符处理

```javascript
// 问题：某些属性可能有特殊的描述符

// 例子：只读属性
Object.defineProperty(window, 'readOnly', {
    value: 'fixed',
    writable: false,
    configurable: false
});

// 子应用尝试修改
sandbox.proxy.readOnly = 'new value';

// 处理逻辑：
set: (target, prop, value) => {
    if (!hasOwnProperty(target, prop) && hasOwnProperty(window, prop)) {
        const descriptor = getOwnPropertyDescriptor(window, prop);
        
        // 检查是否可写
        if (descriptor.writable || hasOwnProperty(descriptor, 'set')) {
            // 可以写入
            defineProperty(target, prop, { 
                configurable: true,
                enumerable: true,
                writable: true,
                value 
            });
        } else {
            // 不可写，忽略（或在严格模式下报错）
            return false;
        }
    }
    
    target[prop] = value;
    return true;
}
```

## 🔍 2. get Trap（属性读取）

### ProxySandbox 的 get 实现

```javascript
get: (target, prop) => {
    // ===== 特殊属性处理 =====
    // 防止通过这些属性逃逸
    if (prop === 'top' || prop === 'parent' || prop === 'window' || prop === 'self') {
        return this.proxy;
    }

    // ===== 优先从 fakeWindow 读取 =====
    if (prop in target) {
        return target[prop];
    }

    // ===== 从真实 window 读取 =====
    const value = window[prop];

    // ===== 函数处理 =====
    if (typeof value === 'function') {
        // 构造函数：直接返回
        if (value.prototype) {
            return value;
        }

        // 普通函数/方法：绑定 this
        const boundValue = value.bind(window);

        // 复制静态属性
        Object.keys(value).forEach(key => {
            boundValue[key] = value[key];
        });

        return boundValue;
    }

    return value;
}
```

### 新版 Membrane 的 get 实现

```typescript
// packages/sandbox/src/core/membrane/index.ts: 136-173
get: (membraneTarget, p, receiver) => {
    // ===== Symbol.unscopables =====
    if (p === Symbol.unscopables) return unscopables;

    // ===== endowments（注入的属性）=====
    if (hasOwnProperty(endowments, p)) {
        return membraneTarget[p];
    }

    // ===== 白名单属性 =====
    if (p === 'string' && whitelistVars.indexOf(p) !== -1) {
        return incubatorContext[p as never];
    }

    // ===== 选择查找目标 =====
    // 有 getter 的属性，从 incubatorContext 读取
    // 否则优先从 membraneTarget 读取
    const actualTarget = propertiesWithGetter.has(p)
        ? incubatorContext
        : p in membraneTarget
            ? membraneTarget
            : incubatorContext;
    
    const value = actualTarget[p as never];

    // ===== frozen 属性直接返回 =====
    if (isPropertyFrozen(actualTarget, p)) {
        return value;
    }

    // ===== 非原生属性直接返回 =====
    if (!isNativeGlobalProp(p as string) && !useNativeWindowForBindingsProps.has(p)) {
        return value;
    }

    // ===== 绑定原生函数 =====
    const boundTarget = useNativeWindowForBindingsProps.get(p) ? nativeGlobal : incubatorContext;
    return rebindTarget2Fn(boundTarget, value, receiver);
}
```

### rebindTarget2Fn 实现

```typescript
// packages/sandbox/src/core/membrane/utils.ts
export function rebindTarget2Fn(target: unknown, value: unknown, receiver: unknown) {
    if (isCallable(value)) {
        // 绑定到指定 target
        const boundValue = Function.prototype.bind.call(value, target);
        
        // 复制原函数的属性
        for (const key in value) {
            boundValue[key] = value[key];
        }
        
        // 保持 prototype
        if (value.hasOwnProperty('prototype') && !boundValue.hasOwnProperty('prototype')) {
            Object.defineProperty(boundValue, 'prototype', {
                value: value.prototype,
                enumerable: false,
                writable: true
            });
        }
        
        return boundValue;
    }
    
    return value;
}
```

## 🔒 3. has Trap（in 操作符）

```javascript
has: (target, prop) => {
    // ⭐ 先查 fakeWindow，再查 window
    return prop in target || prop in window;
}
```

**使用场景：**

```javascript
const sandbox = new ProxySandbox('app');
sandbox.active();

sandbox.proxy.customProp = 'value';

// ===== in 操作符 =====
console.log('customProp' in sandbox.proxy);  // true
/*
has trap:
1. 'customProp' in fakeWindow? → true
2. return true ✓
*/

console.log('document' in sandbox.proxy);  // true
/*
has trap:
1. 'document' in fakeWindow? → false
2. 'document' in window? → true
3. return true ✓
*/

// ===== styled-components 的使用 =====
// styled-components 会检查：
if ('HTMLElement' in window) {
    // 使用浏览器环境的样式
}

// has trap 确保这个检查正常工作
```

## 🗑️ 4. deleteProperty Trap（delete 操作）

```javascript
deleteProperty: (target, prop) => {
    if (this.running) {
        // 从 fakeWindow 删除
        if (prop in target) {
            delete target[prop];
        }
        return true;
    }
    return true;
}
```

**使用场景：**

```javascript
const sandbox = new ProxySandbox('app');
sandbox.active();

// 设置属性
sandbox.proxy.temp = 'temporary data';
console.log(sandbox.proxy.temp);  // 'temporary data'

// 删除属性
delete sandbox.proxy.temp;
/*
deleteProperty trap:
1. this.running = true
2. 'temp' in fakeWindow? → true
3. delete fakeWindow.temp
4. return true
*/

console.log(sandbox.proxy.temp);  // undefined ✓

// 真实 window 未受影响
console.log(window.temp);  // undefined（本来就没有）
```

**处理原生属性：**

```javascript
// 尝试删除原生属性
delete sandbox.proxy.location;
/*
deleteProperty trap:
1. this.running = true
2. 'location' in fakeWindow? → false
3. 不做任何操作
4. return true
*/

// fakeWindow 没有 location
// 下次读取时会从 window 读取
console.log(sandbox.proxy.location);  // window.location ✓
```

## 📋 5. getOwnPropertyDescriptor Trap

```javascript
getOwnPropertyDescriptor: (target, prop) => {
    // 优先从 fakeWindow 获取
    if (prop in target) {
        return Object.getOwnPropertyDescriptor(target, prop);
    }

    // 从 window 获取
    const descriptor = Object.getOwnPropertyDescriptor(window, prop);
    
    // ⭐ 处理不可配置的属性
    if (descriptor && !descriptor.configurable) {
        // 修改为可配置，避免 Proxy 报错
        descriptor.configurable = true;
    }

    return descriptor;
}
```

**为什么需要修改 configurable？**

```javascript
// 问题：Proxy 的限制

// 真实 window 上的属性
Object.defineProperty(window, 'fixedProp', {
    value: 'fixed',
    configurable: false  // 不可配置
});

// Proxy 规则：
// 如果目标对象的属性是不可配置的，
// 那么 Proxy 返回的描述符也必须标记为不可配置
// 否则会抛出 TypeError

const descriptor = Object.getOwnPropertyDescriptor(sandbox.proxy, 'fixedProp');
/*
getOwnPropertyDescriptor trap:
1. 'fixedProp' in fakeWindow? → false
2. 从 window 获取: { value: 'fixed', configurable: false }
3. 修改: descriptor.configurable = true
4. 返回: { value: 'fixed', configurable: true }
*/

// 避免了 TypeError ✓
```

## 🔑 6. ownKeys Trap（遍历属性）

```javascript
ownKeys: (target) => {
    // ⭐ 合并 fakeWindow 和 window 的 keys
    return Array.from(new Set([
        ...Object.keys(target),     // fakeWindow 的属性
        ...Object.keys(window)      // window 的属性
    ]));
}
```

**使用场景：**

```javascript
const sandbox = new ProxySandbox('app');
sandbox.active();

sandbox.proxy.customProp1 = 'value1';
sandbox.proxy.customProp2 = 'value2';

// ===== Object.keys() =====
const keys = Object.keys(sandbox.proxy);
/*
ownKeys trap:
1. Object.keys(fakeWindow) → ['customProp1', 'customProp2']
2. Object.keys(window) → ['location', 'document', ...]
3. 合并去重 → ['customProp1', 'customProp2', 'location', 'document', ...]
*/

// ===== for...in =====
for (const key in sandbox.proxy) {
    console.log(key);
}
/*
也会触发 ownKeys trap
输出：customProp1, customProp2, location, document, ...
*/

// 子应用看到的是完整的 window 属性列表 ✓
```

## 🔄 7. getPrototypeOf Trap（原型查询）

```javascript
getPrototypeOf: () => {
    // ⭐ 返回真实 window 的原型
    return Reflect.getPrototypeOf(window);
}
```

**为什么重要？**

```javascript
// 问题：instanceof 检查

const sandbox = new ProxySandbox('app');

// 没有 getPrototypeOf trap：
sandbox.proxy instanceof Window;
// false ❌ 
// 因为 proxy 的原型是 Object.prototype

// 有 getPrototypeOf trap：
sandbox.proxy instanceof Window;
// true ✓
// 返回 window 的原型，通过 instanceof 检查

// 实际应用：
if (window instanceof Window) {
    // 浏览器环境
} else {
    // Node.js 环境
}

// 子应用的这种检查能正常工作 ✓
```

## 🎨 特殊属性的处理

### 1. window、self、globalThis

```javascript
get: (target, prop) => {
    // ⭐ 防止逃逸
    if (prop === 'window' || prop === 'self' || prop === 'globalThis') {
        return this.proxy;
    }
    // ...
}
```

**防止逃逸：**

```javascript
// 子应用尝试逃逸

const sandbox = new ProxySandbox('app');

// 尝试1: 通过 window.window
const realWindow = sandbox.proxy.window.window.window;
// 每次都返回 proxy，无法逃逸 ✓

// 尝试2: 通过 self
const realWindow = sandbox.proxy.self;
// 返回 proxy ✓

// 尝试3: 通过 globalThis
const realWindow = sandbox.proxy.globalThis;
// 返回 proxy ✓

// 无法获取真实 window ✓
```

### 2. top、parent（iframe 场景）

```typescript
// packages/sandbox/src/core/sandbox/StandardSandbox.ts: 22-28
const getTopValue = (p: 'top' | 'parent'): WindowProxy => {
    // 如果主应用在 iframe 中，允许访问外层 window
    if (incubatorContext === incubatorContext.parent) {
        return realmGlobal;  // 返回沙箱的 globalThis
    }
    return incubatorContext[p]!;  // 返回真实的 top/parent
};

// 在 intrinsics 中定义
{
    top: {
        get() {
            return getTopValue('top');
        },
        configurable: false,
        enumerable: true,
    },
    parent: {
        get() {
            return getTopValue('parent');
        },
        configurable: false,
        enumerable: true,
    }
}
```

### 3. document、location 等 BOM 对象

```typescript
// 这些对象需要特殊处理

get: (target, prop) => {
    // document、location 等从 window 读取
    const value = window[prop];
    
    // 不绑定，直接返回
    // 因为它们不是函数
    return value;
}

// 子应用可以正常使用
sandbox.proxy.document.getElementById('app');  // ✓
sandbox.proxy.location.href;  // ✓
sandbox.proxy.history.pushState(...);  // ✓
```

## 🎓 面试要点

### 7个主要 Traps

1. **set**：设置到 fakeWindow，记录修改
2. **get**：fakeWindow 优先，window 兜底，函数绑定
3. **has**：支持 in 操作符
4. **deleteProperty**：支持 delete 操作
5. **getOwnPropertyDescriptor**：处理属性描述符
6. **ownKeys**：支持遍历操作
7. **getPrototypeOf**：支持 instanceof

### 关键处理

1. **函数绑定**：普通函数绑定 this，构造函数直接返回
2. **特殊属性**：window、self 返回 proxy，防止逃逸
3. **白名单**：某些属性必须设置到真实 window
4. **属性描述符**：处理不可配置的属性

### 设计精妙之处

1. **双层查找**：fakeWindow → window
2. **函数区分**：有无 prototype
3. **逃逸防护**：window.window 返回 proxy
4. **兼容性**：处理各种边界情况

## 💡 实际应用示例

### 示例1: 完整的属性操作

```javascript
const sandbox = new ProxySandbox('app');
sandbox.active();

// ===== 设置属性 =====
sandbox.proxy.user = { id: 1 };  // set trap
sandbox.proxy.config = { theme: 'dark' };  // set trap

// ===== 读取属性 =====
console.log(sandbox.proxy.user);  // get trap
console.log(sandbox.proxy.document);  // get trap（从 window）

// ===== 检查属性 =====
console.log('user' in sandbox.proxy);  // has trap → true
console.log('document' in sandbox.proxy);  // has trap → true

// ===== 遍历属性 =====
Object.keys(sandbox.proxy);  // ownKeys trap
for (const key in sandbox.proxy) { }  // ownKeys trap

// ===== 删除属性 =====
delete sandbox.proxy.user;  // deleteProperty trap

// ===== 原型检查 =====
console.log(sandbox.proxy instanceof Window);  // getPrototypeOf trap → true

// ===== 调用原生 API =====
sandbox.proxy.addEventListener('click', handler);  // get trap（绑定 this）
sandbox.proxy.fetch('https://api.com');  // get trap（绑定 this）
```

### 示例2: 防止逃逸

```javascript
// 各种逃逸尝试都会失败

const sandbox = new ProxySandbox('app');

// 尝试1
const w1 = sandbox.proxy.window;  // 返回 proxy
const w2 = w1.window;  // 返回 proxy
const w3 = w2.window;  // 返回 proxy
console.log(w3 === sandbox.proxy);  // true（永远拿不到真实 window）

// 尝试2
const realWindow = sandbox.proxy.self.self.self;  // 返回 proxy

// 尝试3
const realWindow = sandbox.proxy.globalThis;  // 返回 proxy

// 尝试4（高级）
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const realWindow = iframe.contentWindow.parent;  // 可能逃逸（但qiankun有处理）

// 所有常见逃逸方式都被阻止 ✓
```

通过精心设计的 Proxy traps，qiankun 实现了强大而安全的沙箱隔离机制，确保多个微应用可以和平共处！

