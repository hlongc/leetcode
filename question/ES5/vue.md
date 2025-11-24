# Vue 3 Proxy 响应式原理详解

## 一、Vue 2 vs Vue 3 响应式对比

### Vue 2（Object.defineProperty）
```javascript
// Vue 2 的问题
const obj = { a: 1 };

// 1. 只能监听已存在的属性
// 2. 新增属性需要用 Vue.set() 才能转为响应式
// 3. 删除属性需要用 Vue.delete()
// 4. 无法监听数组下标变化
```

### Vue 3（Proxy）
```javascript
// Vue 3 的优势
const obj = new Proxy({}, {
  get() {},
  set() {},
  deleteProperty() {},
  has() {},
  ownKeys() {},
  // ... 更多陷阱
});

// 1. 可以拦截任何操作
// 2. 新增属性自动响应式
// 3. 原生支持数组变化
// 4. 支持 Map、Set 等容器类型
```

---

## 二、Proxy 的基本用法

```javascript
const handler = {
  get(target, key, receiver) {
    console.log(`访问属性: ${key}`);
    return Reflect.get(target, key, receiver);
  },
  
  set(target, key, value, receiver) {
    console.log(`设置属性: ${key} = ${value}`);
    return Reflect.set(target, key, value, receiver);
  }
};

const obj = new Proxy({ a: 1 }, handler);
obj.a;      // 访问属性: a
obj.b = 2;  // 设置属性: b = 2
```

---

## 三、递归响应式的核心问题

### 问题：为什么需要递归？

```javascript
const obj = {
  user: {
    name: 'Alice',
    address: {
      city: 'Beijing'
    }
  }
};

// 如果只代理顶层对象
const proxy = new Proxy(obj, handler);

// ✅ 这样可以监听
proxy.user = { name: 'Bob' }; // 触发 set

// ❌ 这样无法监听（嵌套对象不是 Proxy）
proxy.user.name = 'Charlie';  // 不触发 set
proxy.user.address.city = 'Shanghai'; // 不触发 set
```

所以需要**递归地将嵌套对象也转为 Proxy**。

---

## 四、递归响应式的实现方案

### 方案 1：简单递归（立即转换）

```javascript
function createReactive(target) {
  // 处理基本类型
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // 处理数组和对象
  const handler = {
    get(target, key, receiver) {
      console.log(`获取: ${key}`);
      const result = Reflect.get(target, key, receiver);
      
      // 关键：在 get 时递归处理嵌套对象
      // 这样只有被访问的属性才会被代理
      return createReactive(result);
    },
    
    set(target, key, value, receiver) {
      console.log(`设置: ${key} = ${value}`);
      return Reflect.set(target, key, value, receiver);
    },
    
    deleteProperty(target, key) {
      console.log(`删除: ${key}`);
      return Reflect.deleteProperty(target, key);
    }
  };

  return new Proxy(target, handler);
}

const obj = createReactive({
  user: {
    name: 'Alice',
    address: {
      city: 'Beijing'
    }
  }
});

// 现在嵌套对象也能被监听
obj.user.name = 'Bob';           // 设置: name = Bob
obj.user.address.city = 'Shanghai'; // 设置: city = Shanghai
```

**优点：**
- 延迟代理：只有被访问的对象才会被代理
- 节省内存

**缺点：**
- 每次 get 都要检查是否需要递归
- 多次访问同一对象会创建多个 Proxy

---

### 方案 2：缓存优化（推荐）

```javascript
function createReactive(target, handlers = {}) {
  // 缓存已代理的对象，避免重复代理
  const proxyCache = new WeakMap();

  function createProxy(target, path = '') {
    if (target === null || typeof target !== 'object') {
      return target;
    }

    // 检查是否已经被代理过
    if (proxyCache.has(target)) {
      return proxyCache.get(target);
    }

    const handler = {
      get(target, key, receiver) {
        console.log(`[GET] ${path}.${String(key)}`);
        const result = Reflect.get(target, key, receiver);
        
        // 递归处理嵌套对象，传递新的路径
        return createProxy(result, `${path}.${String(key)}`);
      },

      set(target, key, value, receiver) {
        console.log(`[SET] ${path}.${String(key)} = ${value}`);
        
        // 值相同时不更新
        if (target[key] === value) {
          return true;
        }
        
        return Reflect.set(target, key, value, receiver);
      },

      deleteProperty(target, key) {
        console.log(`[DELETE] ${path}.${String(key)}`);
        return Reflect.deleteProperty(target, key);
      },

      has(target, key) {
        console.log(`[HAS] ${path}.${String(key)}`);
        return Reflect.has(target, key);
      },

      ownKeys(target) {
        console.log(`[KEYS] ${path}`);
        return Reflect.ownKeys(target);
      },

      getOwnPropertyDescriptor(target, key) {
        return Reflect.getOwnPropertyDescriptor(target, key);
      }
    };

    const proxy = new Proxy(target, handler);
    proxyCache.set(target, proxy); // 缓存 Proxy
    return proxy;
  }

  return createProxy(target, 'root');
}

// 测试
const state = createReactive({
  user: {
    name: 'Alice',
    address: {
      city: 'Beijing'
    }
  },
  items: [1, 2, 3]
});

// 输出：[GET] root.user
const user = state.user;

// 输出：[GET] root.user.name
const name = state.user.name;

// 输出：[SET] root.user.name = Bob
state.user.name = 'Bob';

// 输出：[SET] root.user.address.city = Shanghai
state.user.address.city = 'Shanghai';
```

---

## 五、Vue 3 真实源码解析

### 核心实现（简化版）

```javascript
const isObject = (value) => typeof value === 'object' && value !== null;

const reactiveMap = new WeakMap();

function reactive(target) {
  // 如果目标不是对象，直接返回
  if (!isObject(target)) {
    return target;
  }

  // 如果已经被代理过，返回缓存的 Proxy
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }

  const handler = {
    get(target, key, receiver) {
      // 追踪依赖（收集响应式依赖）
      track(target, key);
      
      const result = Reflect.get(target, key, receiver);
      
      // *** 关键递归点 ***
      // 如果获取的值是对象，也转为响应式
      if (isObject(result)) {
        return reactive(result);
      }
      
      return result;
    },

    set(target, key, value, receiver) {
      const oldValue = target[key];
      
      // 值没有变化，不需要更新
      if (oldValue === value) {
        return true;
      }
      
      const result = Reflect.set(target, key, value, receiver);
      
      // 触发依赖（更新响应式）
      trigger(target, key);
      
      return result;
    },

    deleteProperty(target, key) {
      const hadKey = key in target;
      const result = Reflect.deleteProperty(target, key);
      
      if (hadKey) {
        trigger(target, key);
      }
      
      return result;
    }
  };

  const proxy = new Proxy(target, handler);
  reactiveMap.set(target, proxy);
  
  return proxy;
}

// 依赖追踪系统（简化）
let activeEffect = null;
const targetMap = new WeakMap();

function track(target, key) {
  if (!activeEffect) return;
  
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  
  dep.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  
  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect());
  }
}

function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}
```

---

## 六、递归响应式的关键点

### 1. **延迟递归（Lazy Recursion）**
```javascript
// ❌ 不好：立即递归所有嵌套对象
function badReactive(target) {
  const handler = { /* ... */ };
  const proxy = new Proxy(target, handler);
  
  // 遍历所有属性，立即转为响应式
  for (const key in target) {
    if (isObject(target[key])) {
      target[key] = reactive(target[key]); // 修改原对象
    }
  }
  
  return proxy;
}

// ✅ 好：在 get 时才递归
function goodReactive(target) {
  const handler = {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      
      // 只有被访问的对象才会被代理
      return isObject(result) ? reactive(result) : result;
    }
  };
  
  return new Proxy(target, handler);
}
```

### 2. **缓存 Proxy 实例**
```javascript
// 使用 WeakMap 缓存，避免重复代理同一对象
const cache = new WeakMap();

function reactive(target) {
  if (cache.has(target)) {
    return cache.get(target); // 返回缓存
  }
  
  const proxy = new Proxy(target, handler);
  cache.set(target, proxy);
  return proxy;
}
```

### 3. **处理循环引用**
```javascript
const obj = { a: 1 };
obj.self = obj; // 循环引用

const reactive = (target, visited = new WeakSet()) => {
  if (visited.has(target)) {
    return target; // 已访问过，避免无限递归
  }
  
  visited.add(target);
  
  const handler = {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      return isObject(result) ? reactive(result, visited) : result;
    }
  };
  
  return new Proxy(target, handler);
};
```

### 4. **性能优化：避免重复创建 Proxy**
```javascript
const state = reactive({ user: { name: 'Alice' } });

// 多次访问同一属性，不会重复创建 Proxy
const user1 = state.user;
const user2 = state.user;
const user3 = state.user;

// 使用缓存后，user1、user2、user3 是同一个 Proxy 实例
console.log(user1 === user2); // true（如果有缓存）
```

---

## 七、实战例子

### 完整的响应式系统实现

```javascript
class ReactiveSystem {
  constructor() {
    this.reactiveMap = new WeakMap();
    this.targetMap = new WeakMap();
    this.activeEffect = null;
  }

  // 创建响应式对象
  reactive(target) {
    if (typeof target !== 'object' || target === null) {
      return target;
    }

    if (this.reactiveMap.has(target)) {
      return this.reactiveMap.get(target);
    }

    const handler = {
      get: (target, key, receiver) => {
        // 追踪依赖
        this.track(target, key);
        
        const result = Reflect.get(target, key, receiver);
        
        // 递归处理嵌套对象
        if (typeof result === 'object' && result !== null) {
          return this.reactive(result);
        }
        
        return result;
      },

      set: (target, key, value, receiver) => {
        if (target[key] === value) {
          return true;
        }
        
        const result = Reflect.set(target, key, value, receiver);
        
        // 触发更新
        this.trigger(target, key);
        
        return result;
      }
    };

    const proxy = new Proxy(target, handler);
    this.reactiveMap.set(target, proxy);
    return proxy;
  }

  // 追踪依赖
  track(target, key) {
    if (!this.activeEffect) return;

    let depsMap = this.targetMap.get(target);
    if (!depsMap) {
      this.targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }

    dep.add(this.activeEffect);
  }

  // 触发更新
  trigger(target, key) {
    const depsMap = this.targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (dep) {
      dep.forEach(effect => effect());
    }
  }

  // 副作用收集
  effect(fn) {
    this.activeEffect = fn;
    fn();
    this.activeEffect = null;
  }
}

// 使用示例
const system = new ReactiveSystem();

const state = system.reactive({
  user: {
    name: 'Alice',
    age: 18
  }
});

// 当属性变化时，自动执行副作用
system.effect(() => {
  console.log(`用户名: ${state.user.name}`);
});
// 输出：用户名: Alice

state.user.name = 'Bob';
// 输出：用户名: Bob

state.user.age = 19;
// 无输出（副作用只追踪了 name）
```

---

## 八、Vue 3 vs Vue 2 的递归方式对比

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 实现方式 | Object.defineProperty | Proxy |
| 递归时机 | 初始化时全部递归 | 懒加载，访问时递归 |
| 新增属性 | ❌ 不响应式 | ✅ 自动响应式 |
| 删除属性 | ❌ 需要 Vue.delete | ✅ 原生支持 |
| 数组变化 | 需要特殊处理 | ✅ 完全支持 |
| 性能 | 初始化快，运行慢 | 初始化慢，运行快 |
| 内存占用 | 高（需要 setter/getter） | 低（按需创建） |

---

## 九、总结

**Vue 3 Proxy 递归响应式的核心思想：**

1. **延迟递归**：在 `get` 时才判断是否需要递归转为 Proxy
2. **缓存机制**：使用 WeakMap 缓存已代理的对象，避免重复代理
3. **依赖追踪**：在 `get` 时收集依赖，在 `set` 时触发更新
4. **性能优化**：只处理被访问的对象，降低初始化成本

这种方式既保证了响应式的完整性，又优化了性能和内存占用。