# 10 - useEffect执行时机详解

> **问题**: useEffect的执行时机是什么？它的依赖比较算法是如何实现的？为什么有时会出现闭包陷阱？

---

## 一、useEffect的执行时机

### commit阶段的三个子阶段

```
React的commit阶段分为三个子阶段：

┌────────────────────────────────────────┐
│ before mutation阶段                    │
│ - getSnapshotBeforeUpdate             │
│ - 准备DOM操作前的工作                   │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ mutation阶段（同步）                    │
│ - 执行DOM操作                          │
│ - 插入、更新、删除DOM节点               │
│ - useLayoutEffect的cleanup            │
└────────────────────────────────────────┘
              ↓
  【切换current树】root.current = finishedWork
              ↓
┌────────────────────────────────────────┐
│ layout阶段（同步）                      │
│ - componentDidMount/Update             │
│ - useLayoutEffect的create             │ ← 同步执行
│ - 更新ref                              │
└────────────────────────────────────────┘
              ↓
  【绘制屏幕】用户看到新的UI
              ↓
┌────────────────────────────────────────┐
│ passive阶段（异步）                     │
│ - useEffect的cleanup                  │ ← 异步执行
│ - useEffect的create                   │ ← 异步执行
└────────────────────────────────────────┘
```

**关键时间点**：

```javascript
// 源码位置：ReactFiberWorkLoop.js

// commit阶段入口
function commitRoot(root, finishedWork, lanes, ...) {
  // ...
  
  // 1. before mutation阶段
  commitBeforeMutationEffects(root, finishedWork);
  
  // 2. mutation阶段
  commitMutationEffects(root, finishedWork, lanes);
  
  // 3. 切换current树
  root.current = finishedWork;
  
  // 4. layout阶段（同步）
  commitLayoutEffects(finishedWork, root, lanes);
  
  // 5. 调度passive effects（异步）
  if (
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
    (finishedWork.flags & PassiveMask) !== NoFlags
  ) {
    scheduleCallback(NormalSchedulerPriority, () => {
      flushPassiveEffects();  // 异步执行
      return null;
    });
  }
}
```

### useEffect vs useLayoutEffect

| 特性 | useEffect | useLayoutEffect |
|------|-----------|----------------|
| **执行时机** | passive阶段（异步） | layout阶段（同步） |
| **是否阻塞渲染** | 否 | 是 |
| **执行顺序** | DOM更新后，浏览器绘制后 | DOM更新后，浏览器绘制前 |
| **适用场景** | 数据获取、订阅、日志 | DOM测量、同步DOM修改 |
| **性能影响** | 不阻塞，用户体验好 | 可能阻塞，影响性能 |

**可视化对比**：

```
时间轴：

useLayoutEffect:
render → commit(mutation) → useLayoutEffect → 浏览器绘制 → 用户看到
                                 ↑
                            同步执行，阻塞绘制

useEffect:
render → commit(mutation) → 浏览器绘制 → 用户看到 → useEffect
                                                      ↑
                                               异步执行，不阻塞
```

---

## 二、useEffect的完整实现

### mount阶段

源码：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  mountEffectImpl(
    PassiveEffect | PassiveStaticEffect,
    HookPassive,
    create,
    deps,
  );
}

function mountEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  // 1. 创建Hook对象
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 2. 标记Fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags;  // PassiveEffect
  
  // 3. 创建并保存effect对象
  hook.memoizedState = pushSimpleEffect(
    HookHasEffect | hookFlags,  // HookHasEffect表示需要执行
    createEffectInstance(),      // { destroy: undefined }
    create,                      // effect函数
    nextDeps,                    // 依赖数组
  );
}
```

### update阶段

```javascript
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const effect: Effect = hook.memoizedState;
  const inst = effect.inst;  // EffectInstance（保存destroy函数）

  // ========== 依赖比较 ==========
  if (currentHook !== null) {
    if (nextDeps !== null) {
      const prevEffect: Effect = currentHook.memoizedState;
      const prevDeps = prevEffect.deps;
      
      // 比较依赖
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖没变，不需要执行effect
        hook.memoizedState = pushSimpleEffect(
          hookFlags,      // 注意：没有HookHasEffect标记
          inst,
          create,
          nextDeps,
        );
        return;
      }
    }
  }

  // 依赖变化了，标记需要执行
  currentlyRenderingFiber.flags |= fiberFlags;
  
  hook.memoizedState = pushSimpleEffect(
    HookHasEffect | hookFlags,  // HookHasEffect标记需要执行
    inst,
    create,
    nextDeps,
  );
}
```

---

## 三、依赖比较算法

### areHookInputsEqual实现

```javascript
function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
): boolean {
  // prevDeps为null表示没有依赖或首次render
  if (prevDeps === null) {
    if (__DEV__) {
      console.error(
        '%s received a final argument that is not an array (instead, received `%s`). ' +
        'When specified, the final argument must be an array.',
        currentHookNameInDev,
        prevDeps,
      );
    }
    return false;
  }

  // 开发环境检查
  if (__DEV__) {
    if (nextDeps.length !== prevDeps.length) {
      console.error(
        'The final argument passed to %s changed size between renders. ' +
        'The order and size of this array must remain constant.',
        currentHookNameInDev,
      );
    }
  }

  // 核心：使用Object.is逐个比较
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    // $FlowFixMe[incompatible-call] Flow doesn't like mixed types
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
```

**Object.is的特性**：

```javascript
// Object.is vs ===

Object.is(0, -0);           // false (=== 认为相等)
Object.is(NaN, NaN);        // true  (=== 认为不等)
Object.is(null, null);      // true
Object.is(undefined, undefined);  // true

// 对象比较：比较引用
const obj1 = { a: 1 };
const obj2 = { a: 1 };
const obj3 = obj1;

Object.is(obj1, obj2);      // false（不同引用）
Object.is(obj1, obj3);      // true（同一引用）

// 数组同理
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];
Object.is(arr1, arr2);      // false
```

**依赖比较示例**：

```javascript
// 案例1：基本类型
useEffect(() => {
  console.log('count changed');
}, [count]);

// count: 0 → 1
// Object.is(1, 0) → false → 执行effect

// 案例2：对象引用
const user = { name: 'Tom' };
useEffect(() => {
  console.log('user changed');
}, [user]);

// 每次render，user都是新对象
// Object.is(newUser, oldUser) → false → 执行effect

// 案例3：多个依赖
useEffect(() => {
  console.log('deps changed');
}, [count, name]);

// 只要有一个变化，就执行
// count没变 && name没变 → 不执行
// count变了 || name变了 → 执行
```

---

## 四、effect链表结构

### Effect对象

```javascript
export type Effect = {
  tag: HookFlags,                        // HookHasEffect | HookPassive等
  inst: EffectInstance,                  // { destroy: cleanup函数 }
  create: () => (() => void) | void,     // effect函数
  deps: Array<mixed> | void | null,      // 依赖数组
  next: Effect,                          // 下一个effect（环形链表）
};
```

### 环形链表结构

```javascript
function pushSimpleEffect(
  tag: HookFlags,
  inst: EffectInstance,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): Effect {
  const effect: Effect = {
    tag,
    create,
    deps,
    inst,
    next: (null: any),  // 环形链表
  };
  return pushEffectImpl(effect);
}

function pushEffectImpl(effect: Effect): Effect {
  let componentUpdateQueue: null | FunctionComponentUpdateQueue =
    currentlyRenderingFiber.updateQueue;
    
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
  }
  
  const lastEffect = componentUpdateQueue.lastEffect;
  if (lastEffect === null) {
    // 第一个effect：形成环形链表
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // 插入到环形链表
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }
  
  return effect;
}
```

**可视化结构**：

```javascript
// 组件
function Component() {
  useEffect(() => { console.log('effect1'); }, [a]);
  useEffect(() => { console.log('effect2'); }, [b]);
  useEffect(() => { console.log('effect3'); }, [c]);
}

// Fiber.updateQueue.lastEffect
lastEffect ────────┐
                   ↓
    ┌──────────────────────────────┐
    ↓                              │
effect1 → effect2 → effect3 ───────┘
  ↑                           │
  └───────────────────────────┘

// 遍历时从lastEffect.next开始
const firstEffect = lastEffect.next;  // effect1
let effect = firstEffect;
do {
  // 处理effect
  effect = effect.next;
} while (effect !== firstEffect);
```

---

## 五、effect的执行流程

### 完整生命周期

```
========== 第一次render（mount） ==========

1. render阶段
   useEffect(() => {
     console.log('mounted');
     return () => console.log('cleanup');
   }, []);
   
   → mountEffect()
   → pushSimpleEffect(HookHasEffect | HookPassive, ...)
   → Fiber.flags |= PassiveEffect

2. commit阶段（layout之后）
   → scheduleCallback(flushPassiveEffects)  // 异步调度

3. 浏览器绘制
   → 用户看到新UI

4. passive阶段（异步）
   → flushPassiveEffects()
   → commitPassiveMountEffects()
   → 执行effect.create()
   → 返回值保存到effect.inst.destroy

========== 第二次render（update） ==========

1. render阶段
   useEffect(() => {
     console.log('updated');
     return () => console.log('cleanup');
   }, [count]);  // count: 0 → 1
   
   → updateEffect()
   → areHookInputsEqual([1], [0]) → false
   → pushSimpleEffect(HookHasEffect | HookPassive, ...)
   → Fiber.flags |= PassiveEffect

2. commit阶段
   → scheduleCallback(flushPassiveEffects)

3. 浏览器绘制

4. passive阶段（异步）
   → flushPassiveEffects()
   → commitPassiveUnmountEffects()  // 先执行cleanup
     → 调用上次effect.inst.destroy()
     → 输出: "cleanup"
   → commitPassiveMountEffects()     // 再执行create
     → 调用effect.create()
     → 输出: "updated"
     → 保存新的cleanup

========== 组件卸载（unmount） ==========

1. commit阶段
   → commitMutationEffects()
   → 删除DOM节点

2. passive阶段
   → commitPassiveUnmountEffects()
   → 调用所有effect.inst.destroy()
   → 输出: "cleanup"
```

### 源码实现

```javascript
// 调度passive effects
function commitRoot(...) {
  // ...
  
  const subtreeHasPassiveEffects =
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags;
  const rootHasPassiveEffect =
    (finishedWork.flags & PassiveMask) !== NoFlags;

  if (subtreeHasPassiveEffects || rootHasPassiveEffect) {
    // 使用Scheduler异步调度
    scheduleCallback(NormalSchedulerPriority, () => {
      flushPassiveEffects();
      return null;
    });
  }
}

// 执行passive effects
function flushPassiveEffects(): boolean {
  const root = pendingEffectsRoot;
  const lanes = pendingEffectsLanes;
  
  // 1. 先执行所有cleanup
  commitPassiveUnmountEffects(root.current);
  
  // 2. 再执行所有create
  commitPassiveMountEffects(root, root.current, lanes, transitions);
  
  return true;
}

// 执行cleanup
function commitPassiveUnmountEffects(finishedWork: Fiber) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    
    do {
      if ((effect.tag & HookPassive) !== NoFlags) {
        if ((effect.tag & HookHasEffect) !== NoFlags) {
          // 调用cleanup
          const inst = effect.inst;
          const destroy = inst.destroy;
          if (destroy !== undefined) {
            inst.destroy = undefined;
            safelyCallDestroy(finishedWork, destroy);
          }
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

// 执行create
function commitPassiveMountEffects(finishedWork: Fiber) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    
    do {
      if ((effect.tag & HookPassive) !== NoFlags) {
        if ((effect.tag & HookHasEffect) !== NoFlags) {
          // 调用create
          const create = effect.create;
          const inst = effect.inst;
          const destroy = create();
          inst.destroy = destroy;  // 保存cleanup函数
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

---

## 六、闭包陷阱详解

### 产生原因

```javascript
// 经典闭包陷阱示例
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Count:', count);  // 闭包捕获
      setCount(count + 1);           // 闭包捕获
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);  // ← 空依赖，effect只执行一次

  return <div>{count}</div>;
}

// 执行过程：
t=0s:  第一次render，count=0
       mountEffect，闭包捕获count=0
       timer每秒执行：setCount(0 + 1)
       
t=1s:  setCount(1)触发render
       count变成1，但effect不重新执行（deps为空）
       timer继续执行：setCount(0 + 1)
       
t=2s:  setCount(1)触发render
       count还是1，因为每次都是setCount(0 + 1)
       
结果：count永远在0和1之间跳动
```

### 本质原因

```
闭包的本质：
函数记住了创建时的词法作用域

effect函数创建时：
const effect = () => {
  const timer = setInterval(() => {
    console.log(count);  // 捕获当时的count值（0）
  }, 1000);
};

即使count后来变成1、2、3...
effect函数内部的count永远是0
因为effect函数只创建了一次（deps为空）
```

### 解决方案

#### 方案1：添加依赖

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Count:', count);  // 每次count变化都重新创建
      setCount(count + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [count]);  // ← 添加count依赖

  return <div>{count}</div>;
}

// 执行过程：
t=0s: count=0, 创建timer1
t=1s: setCount(1), count=1
      cleanup: clearInterval(timer1)
      创建timer2（新的闭包，count=1）
t=2s: setCount(2), count=2
      cleanup: clearInterval(timer2)
      创建timer3（新的闭包，count=2）

问题：
- 每次count变化都重启timer
- timer不是连续的（每次都从头开始）
```

#### 方案2：函数式更新

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1);  // 基于最新state
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);  // 空依赖，effect只执行一次

  return <div>{count}</div>;
}

// setCount(c => c + 1)不依赖闭包的count
// 每次执行时，React传入最新的state
// 完美解决！
```

#### 方案3：使用useRef

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  // 保持ref同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Count:', countRef.current);  // 读取ref
      setCount(countRef.current + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);  // 空依赖

  return <div>{count}</div>;
}

// ref.current是可变的，不受闭包影响
// 总是能读到最新值
```

#### 方案4：useEffectEvent（React 19+）

```javascript
// React 19+ 已正式支持
import { useEffectEvent } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  // useEffectEvent创建的函数引用稳定，但内部总是读取最新值
  const logCount = useEffectEvent(() => {
    console.log('Count:', count);  // 总是读取最新count
  });
  
  useEffect(() => {
    const timer = setInterval(() => {
      logCount();  // 可以安全调用
      setCount(c => c + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);  // 空依赖，logCount不需要加入依赖

  return <div>{count}</div>;
}
```

**useEffectEvent 的工作原理**：

```javascript
// 1. mount阶段：创建ref保存函数实现
function mountEvent(callback) {
  const hook = mountWorkInProgressHook();
  const ref = {impl: callback};  // 保存函数实现
  hook.memoizedState = ref;
  
  // 返回稳定的函数引用
  return function eventFn() {
    // 调用时读取最新的ref.impl
    return ref.impl.apply(undefined, arguments);
  };
}

// 2. update阶段：更新ref.impl，但函数引用不变
function updateEvent(callback) {
  const hook = updateWorkInProgressHook();
  const ref = hook.memoizedState;  // 复用同一个ref
  
  // 将新实现加入更新队列
  useEffectEventImpl({ref, nextImpl: callback});
  
  // 返回同一个函数引用（稳定）
  return function eventFn() {
    return ref.impl.apply(undefined, arguments);
  };
}

// 3. commit阶段（beforeMutation）：更新ref.impl
function commitBeforeMutationEffectsOnFiber(finishedWork) {
  const eventPayloads = updateQueue.events;
  if (eventPayloads !== null) {
    for (let ii = 0; ii < eventPayloads.length; ii++) {
      const {ref, nextImpl} = eventPayloads[ii];
      ref.impl = nextImpl;  // 更新为最新实现
    }
  }
}
```

**关键特性**：
- ✅ 函数引用稳定：可以在 useEffect 依赖数组中省略
- ✅ 总是读取最新值：通过 ref 存储最新实现
- ✅ 不能在渲染时调用：只能在事件处理、effect 等非渲染场景调用
- ✅ 完美解决闭包陷阱：无需手动管理依赖

**使用示例**：

```javascript
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');
  
  // 使用useEffectEvent处理消息发送
  const onSend = useEffectEvent(() => {
    sendMessage(roomId, message);  // 总是读取最新的roomId和message
  });
  
  // effect只在roomId变化时重新建立连接
  useEffect(() => {
    const connection = connect(roomId);
    connection.on('message', onSend);  // onSend不需要加入依赖
    
    return () => connection.disconnect();
  }, [roomId]);  // 只需要roomId依赖
  
  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={onSend}>Send</button>
    </div>
  );
}
```

---

## 七、useEffect的常见场景

### 场景1：数据获取

```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;  // 防止内存泄漏
    
    setLoading(true);
    fetchUser(userId).then(data => {
      if (!cancelled) {
        setUser(data);
        setLoading(false);
      }
    });
    
    return () => {
      cancelled = true;  // cleanup：取消pending的更新
    };
  }, [userId]);  // userId变化时重新获取
  
  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

### 场景2：订阅/事件监听

```javascript
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // 订阅
    window.addEventListener('resize', handleResize);
    
    // cleanup：取消订阅
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);  // 空依赖，只订阅一次
  
  return <div>{size.width} x {size.height}</div>;
}
```

### 场景3：与外部系统同步

```javascript
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // 连接聊天室
    const connection = createConnection(roomId);
    connection.connect();
    
    connection.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    // cleanup：断开连接
    return () => {
      connection.disconnect();
    };
  }, [roomId]);  // roomId变化时重新连接
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
    </div>
  );
}
```

---

## 八、useEffect vs useLayoutEffect对比

### 使用场景

```javascript
// ✅ useEffect：大部分场景
function DataFetcher() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);  // 数据获取
  }, []);
  
  return <div>{data}</div>;
}

// ✅ useLayoutEffect：需要同步读写DOM
function Tooltip({ targetRef }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useLayoutEffect(() => {
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({
      x: rect.left,
      y: rect.bottom + 10,
    });
  }, [targetRef]);
  
  return (
    <div style={{ left: position.x, top: position.y }}>
      Tooltip
    </div>
  );
}

// 为什么用useLayoutEffect？
// 1. getBoundingClientRect需要DOM已更新
// 2. setPosition会触发新render
// 3. 如果用useEffect，用户会看到两次渲染：
//    第一次：position={0,0}
//    第二次：position={正确位置}
//    产生闪烁
// 4. useLayoutEffect在绘制前执行，用户只看到正确位置
```

### 性能对比

```javascript
// 测试：1000个effect
function HeavyEffects() {
  const [count, setCount] = useState(0);
  
  // useEffect：不阻塞
  for (let i = 0; i < 1000; i++) {
    useEffect(() => {
      heavyComputation();  // 耗时操作
    }, [count]);
  }
  
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

结果（useEffect）：
- 点击按钮 → 立即响应
- 页面立即更新
- 1000个effect在后台执行（不阻塞）
- 用户体验：流畅

结果（如果用useLayoutEffect）：
- 点击按钮 → 延迟响应
- 等待1000个effect执行完（阻塞）
- 然后才绘制页面
- 用户体验：卡顿
```

---

## 九、常见问题与最佳实践

### 问题1：依赖数组遗漏

```javascript
// ❌ 错误：遗漏依赖
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    fetchResults(query).then(setResults);
  }, []);  // ❌ 缺少query依赖
  
  return <div>{results.length} results</div>;
}

// 问题：query变化时不会重新获取数据

// ✅ 正确：添加所有依赖
useEffect(() => {
  fetchResults(query).then(setResults);
}, [query]);  // 或使用ESLint规则自动检测
```

### 问题2：无限循环

```javascript
// ❌ 错误：effect中修改依赖
function Component() {
  const [data, setData] = useState({ count: 0 });
  
  useEffect(() => {
    setData({ count: data.count + 1 });  // 修改依赖
  }, [data]);  // data变化 → effect执行 → setData → data变化...
  
  return <div>{data.count}</div>;
}

// 结果：无限循环，浏览器崩溃

// ✅ 正确：只依赖需要的字段
useEffect(() => {
  if (data.count < 10) {  // 添加终止条件
    setData({ count: data.count + 1 });
  }
}, [data.count]);  // 只依赖count

// 或使用函数式更新
useEffect(() => {
  setData(prev => ({ count: prev.count + 1 }));
}, []);  // 空依赖
```

### 问题3：依赖对象/数组

```javascript
// ❌ 问题：对象/数组依赖总是变化
function Component() {
  const config = { theme: 'dark', lang: 'en' };  // 每次render新对象
  
  useEffect(() => {
    applyConfig(config);
  }, [config]);  // config引用总是不同，effect每次都执行
  
  return <div>...</div>;
}

// ✅ 解决方案1：提取到组件外
const config = { theme: 'dark', lang: 'en' };

function Component() {
  useEffect(() => {
    applyConfig(config);
  }, []);  // 空依赖
  
  return <div>...</div>;
}

// ✅ 解决方案2：useMemo
function Component() {
  const config = useMemo(
    () => ({ theme: 'dark', lang: 'en' }),
    []  // 依赖为空，config引用不变
  );
  
  useEffect(() => {
    applyConfig(config);
  }, [config]);
  
  return <div>...</div>;
}

// ✅ 解决方案3：依赖具体字段
function Component({ theme, lang }) {
  useEffect(() => {
    applyConfig({ theme, lang });
  }, [theme, lang]);  // 依赖基本类型
  
  return <div>...</div>;
}
```

---

## 十、源码关键路径

```
useEffect核心文件：

packages/react-reconciler/src/
├── ReactFiberHooks.js                  # effect的创建
│   ├── mountEffect()                   # mount阶段
│   ├── updateEffect()                  # update阶段
│   ├── mountEffectImpl()               # effect实现
│   ├── updateEffectImpl()              # effect实现
│   ├── pushSimpleEffect()              # 添加到effect链表
│   ├── pushEffectImpl()                # 构建环形链表
│   ├── areHookInputsEqual()            # 依赖比较
│   ├── mountEvent()                    # useEffectEvent mount
│   ├── updateEvent()                   # useEffectEvent update
│   ├── useEffectEventImpl()            # useEffectEvent实现
│   └── Effect类型定义                  # tag, create, deps, next
│
├── ReactFiberWorkLoop.js               # effect调度
│   ├── commitRoot()                    # commit入口
│   ├── flushPassiveEffects()           # 执行passive effects
│   └── flushPassiveEffectsImpl()       # passive effects实现
│
└── ReactFiberCommitWork.js             # effect执行
    ├── commitBeforeMutationEffects()   # beforeMutation阶段
    │   └── 更新useEffectEvent的ref.impl
    ├── commitPassiveUnmountEffects()   # 执行cleanup
    ├── commitPassiveMountEffects()     # 执行create
    ├── commitLayoutEffects()           # layout阶段
    └── commitHookLayoutEffects()       # useLayoutEffect执行
```

---

## 十一、面试要点速记

### 快速回答框架

**useEffect的执行时机？**
- commit阶段的passive阶段
- 异步执行（使用Scheduler调度）
- DOM更新后，浏览器绘制后
- 不阻塞渲染

**依赖比较算法？**
- 使用Object.is逐个比较
- 浅比较，比较引用
- 所有依赖都相等才跳过effect

**为什么会有闭包陷阱？**
- effect函数捕获创建时的变量值
- deps为空时，effect只创建一次
- 变量更新了，但effect内部还是旧值
- 解决：添加依赖、使用函数式更新、或使用useEffectEvent

**useEffect vs useLayoutEffect？**
- useEffect：异步，不阻塞，大部分场景
- useLayoutEffect：同步，阻塞，DOM测量/修改

**useEffectEvent 是什么？**
- React 19+ 的新 Hook，用于创建稳定的函数引用
- 函数引用不变，但内部总是读取最新的 props/state
- 可以安全地省略在 useEffect 依赖数组中
- 完美解决闭包陷阱，无需手动管理依赖

### 加分项

1. **能画出commit阶段的时间轴**：
   - mutation → 切换current → layout → 绘制 → passive

2. **能说明effect链表结构**：
   - 环形链表
   - lastEffect.next是firstEffect

3. **能解释cleanup的执行时机**：
   - 组件卸载时
   - 依赖变化时（在新effect前执行）

4. **能分析闭包陷阱的根本原因**：
   - 词法作用域
   - 函数创建时捕获变量

### 常见追问

**Q: cleanup函数什么时候执行？**
A:
- 组件卸载时
- effect依赖变化，重新执行前
- 执行顺序：cleanup → create

**Q: useEffect的deps为空数组和不传有什么区别？**
A:
- `[]`：只在mount时执行一次
- `undefined`：每次render都执行
- `[dep1, dep2]`：依赖变化时执行

**Q: 为什么useEffect是异步的？**
A:
- 不阻塞浏览器绘制
- 用户能更快看到更新
- 副作用（数据获取、订阅等）不需要同步

**Q: 什么情况必须用useLayoutEffect？**
A:
- 需要在绘制前读取DOM布局信息
- 需要同步修改DOM避免闪烁
- 示例：tooltip定位、动画、focus管理

**Q: 多个useEffect的执行顺序？**
A:
- 按声明顺序执行
- 先cleanup，再create
- 示例：effect1 cleanup → effect2 cleanup → effect1 create → effect2 create

**Q: useEffectEvent 和 useCallback 的区别？**
A:
- useCallback：依赖变化时返回新的函数引用，需要在依赖数组中声明
- useEffectEvent：函数引用永远不变，内部总是读取最新值，不需要依赖
- useEffectEvent 专门用于 effect 中的事件处理，避免闭包陷阱

**Q: useEffectEvent 什么时候更新函数实现？**
A:
- 在 commit 阶段的 beforeMutation 阶段更新
- 每次 render 时，新实现被加入 updateQueue.events
- commit 时批量更新所有 event 函数的 ref.impl
- 这样保证函数引用稳定，但实现总是最新的

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberHooks.js`
- [useEffect文档](https://react.dev/reference/react/useEffect)
- [useEffectEvent文档](https://react.dev/reference/react/useEffectEvent)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

**最后更新**: 2025-01-XX

