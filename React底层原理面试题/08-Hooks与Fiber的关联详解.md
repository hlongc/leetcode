# 08 - Hooks与Fiber的关联详解

> **问题**: Hooks是如何与Fiber节点关联的？为什么Hooks必须在函数组件顶层调用？从源码角度解释。

---

## 一、Hooks与Fiber的关系

### Hook的数据结构

源码：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
export type Hook = {
  memoizedState: any,           // 当前Hook的状态值
  baseState: any,               // 基础state（用于update合并）
  baseQueue: Update<any, any> | null,  // 基础更新队列
  queue: any,                   // 更新队列
  next: Hook | null,            // 指向下一个Hook（链表）
};
```

### Hook链表存储在Fiber上

```javascript
// Fiber节点
type Fiber = {
  // ...
  memoizedState: any,    // 对于函数组件，这里存储Hook链表的第一个Hook
  updateQueue: any,      // 函数组件的updateQueue（effect链表等）
  // ...
};

// 示例组件
function Counter() {
  const [count, setCount] = useState(0);        // Hook1
  const [name, setName] = useState('Tom');      // Hook2
  useEffect(() => { console.log(count); }, [count]);  // Hook3
  const memoValue = useMemo(() => count * 2, [count]); // Hook4
  
  return <div>{count}</div>;
}

// 对应的Fiber.memoizedState结构
Counter Fiber {
  memoizedState: Hook1 → Hook2 → Hook3 → Hook4 → null
                  ↓       ↓       ↓       ↓
               useState  useState useEffect useMemo
              (count=0) (name)   (effect)  (memo)
}
```

**可视化结构**：

```
┌─────────────────────────┐
│   Counter Fiber         │
├─────────────────────────┤
│ tag: FunctionComponent  │
│ memoizedState: ────────►│──┐
│ updateQueue: ──────────►│  │
│ ...                     │  │
└─────────────────────────┘  │
                             │
        ┌────────────────────┘
        ↓
    Hook链表（memoizedState）:
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ Hook1 (useState)│───►│ Hook2 (useState)│───►│ Hook3 (useEffect)│───► null
    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
    │memoizedState: 0 │    │memoizedState:'Tom'│  │memoizedState:effect│
    │queue: {...}     │    │queue: {...}     │    │queue: null      │
    │next: ────────────────►│next: ────────────────►│next: null       │
    └─────────────────┘    └─────────────────┘    └─────────────────┘

    Effect链表（updateQueue.lastEffect）:
    ┌──────────────────┐
    │ Effect (circular)│◄──┐
    ├──────────────────┤   │
    │ create: fn       │   │
    │ deps: [count]    │   │
    │ next: ───────────────┘
    └──────────────────┘
```

---

## 二、renderWithHooks：建立关联的核心

### 全局变量

```javascript
// 全局变量，用于追踪当前正在render的Fiber和Hook

// 当前正在render的Fiber
let currentlyRenderingFiber: Fiber = null;

// 当前Hook指针（current树的Hook链表）
let currentHook: Hook | null = null;

// 工作中的Hook指针（workInProgress树的Hook链表）
let workInProgressHook: Hook | null = null;

// 当前的渲染优先级
let renderLanes: Lanes = NoLanes;
```

### renderWithHooks函数

```javascript
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  // ========== 1. 设置全局上下文 ==========
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;  // 关键！建立关联

  // 清空旧的Hook链表（将在组件执行时重新构建）
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // ========== 2. 根据mount/update选择Dispatcher ==========
  if (current !== null && current.memoizedState !== null) {
    // update阶段：使用updateDispatcher
    ReactSharedInternals.H = HooksDispatcherOnUpdate;
  } else {
    // mount阶段：使用mountDispatcher
    ReactSharedInternals.H = HooksDispatcherOnMount;
  }

  // ========== 3. 执行组件函数 ==========
  // 此时调用useState、useEffect等会访问ReactSharedInternals.H
  let children = Component(props, secondArg);

  // ========== 4. 检查render阶段的update ==========
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // 有render阶段的update，需要重新render
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      localIdCounter = 0;
      
      numberOfReRenders += 1;
      
      // 重新执行
      currentHook = null;
      workInProgressHook = null;
      
      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // ========== 5. 清理全局变量 ==========
  ReactSharedInternals.H = ContextOnlyDispatcher;  // 防止在外部调用Hook

  renderLanes = NoLanes;
  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;

  return children;
}
```

**关键理解**：

```
renderWithHooks的作用：
1. 设置currentlyRenderingFiber = workInProgress
   → Hooks通过这个全局变量找到对应的Fiber

2. 选择合适的Dispatcher
   → mount时调用mountState
   → update时调用updateState

3. 执行组件函数
   → useState()实际调用的是Dispatcher.useState
   → Dispatcher根据阶段不同有不同实现

4. 返回children
   → 供reconcileChildren进行diff
```

---

## 三、Hook的创建与更新

### 1. mount阶段：mountWorkInProgressHook

```javascript
function mountWorkInProgressHook(): Hook {
  // 创建新的Hook对象
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // 这是第一个Hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 追加到链表末尾
    workInProgressHook = workInProgressHook.next = hook;
  }
  
  return workInProgressHook;
}

// 调用示例
function mountState(initialState) {
  // 1. 创建Hook对象
  const hook = mountWorkInProgressHook();
  
  // 2. 初始化state
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  
  // 3. 创建updateQueue
  const queue = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  
  // 4. 创建dispatch函数
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,  // 闭包捕获Fiber
    queue,
  ));
  
  return [hook.memoizedState, dispatch];
}
```

### 2. update阶段：updateWorkInProgressHook

```javascript
function updateWorkInProgressHook(): Hook {
  // ========== 1. 获取nextCurrentHook ==========
  let nextCurrentHook: null | Hook;
  if (currentHook === null) {
    // 这是第一个Hook，从Fiber.alternate.memoizedState读取
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // 不是第一个Hook，从currentHook.next读取
    nextCurrentHook = currentHook.next;
  }

  // ========== 2. 获取nextWorkInProgressHook ==========
  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  // ========== 3. 复用或克隆Hook ==========
  if (nextWorkInProgressHook !== null) {
    // 已经有workInProgress Hook（重复render的情况）
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;
    currentHook = nextCurrentHook;
  } else {
    // 克隆currentHook
    if (nextCurrentHook === null) {
      // 这次render的Hook数量比上次多！
      throw new Error('Rendered more hooks than during the previous render.');
    }

    currentHook = nextCurrentHook;

    // 克隆Hook对象
    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null,
    };

    if (workInProgressHook === null) {
      // 第一个Hook
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // 追加到链表
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  
  return workInProgressHook;
}

// 调用示例
function updateState(initialState) {
  // 1. 获取Hook对象（从current克隆）
  const hook = updateWorkInProgressHook();
  
  // 2. 处理updateQueue，计算新state
  const queue = hook.queue;
  const pending = queue.pending;
  
  let newState = hook.memoizedState;
  if (pending !== null) {
    // 遍历update链表，计算最终state
    const first = pending.next;
    let update = first;
    do {
      const action = update.action;
      newState = typeof action === 'function' 
        ? action(newState) 
        : action;
      update = update.next;
    } while (update !== first);
    
    queue.pending = null;
  }
  
  hook.memoizedState = newState;
  
  return [newState, queue.dispatch];
}
```

---

## 四、为什么Hooks必须在顶层调用？

### 问题演示

```javascript
// ❌ 错误：在条件语句中调用Hook
function BadComponent({ show }) {
  const [count, setCount] = useState(0);
  
  if (show) {
    const [name, setName] = useState('Tom');  // ❌ 条件调用
  }
  
  return <div>{count}</div>;
}
```

**第一次render（show=true）**：

```
Hook链表：
Hook1 (useState, count)
  ↓ next
Hook2 (useState, name)
  ↓ next
null

Fiber.memoizedState → Hook1
```

**第二次render（show=false）**：

```
预期：
Hook1 (useState, count)  ← 对应current的Hook1
  ↓
null

实际执行：
1. updateState() → 取currentHook1 → 返回count ✓
2. if (show) 跳过，不调用useState
3. 组件结束

结果：
workInProgress.memoizedState只有Hook1
但current.memoizedState有Hook1和Hook2

下次render（show=true）：
1. updateState() → 取currentHook1 → 返回count ✓
2. if (show) 进入
3. updateState() → 取currentHook2 → 返回name ✓

看起来正常？

第三次render（show=false）：
1. updateState() → 取currentHook1 → 返回count ✓
2. if (show) 跳过
3. 组件结束

但此时currentHook1实际是count，currentHook2是name
Hook链表不一致！可能导致bug
```

### 源码中的检测

```javascript
function updateWorkInProgressHook(): Hook {
  // ...
  
  if (nextCurrentHook === null) {
    const currentFiber = currentlyRenderingFiber.alternate;
    if (currentFiber === null) {
      throw new Error(
        'Update hook called on initial render.'
      );
    } else {
      // 这次render的Hook数量比上次多！
      throw new Error(
        'Rendered more hooks than during the previous render.'
      );
    }
  }
  
  // ...
}
```

**为什么Hook必须在顶层？**

```
核心原因：Hook依赖调用顺序来匹配

mount时：
  call#1: useState(0)    → Hook1
  call#2: useState('Tom') → Hook2
  call#3: useEffect(...)  → Hook3

update时：
  call#1: 期待是Hook1（useState）
  call#2: 期待是Hook2（useState）
  call#3: 期待是Hook3（useEffect）

如果顺序变了：
  call#1: useState(0)    → 匹配Hook1 ✓
  call#2: useEffect(...) → 匹配Hook2 ✗ 类型不匹配！

React没有用key或name来标识Hook
完全依赖调用顺序
所以Hook调用顺序必须一致！
```

---

## 五、Dispatcher机制

### Dispatcher的定义

```javascript
export type Dispatcher = {
  readContext<T>(context: ReactContext<T>): T,
  use<T>(usable: Usable<T>): T,
  useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>],
  useReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: (I) => S,
  ): [S, Dispatch<A>],
  useContext<T>(context: ReactContext<T>): T,
  useRef<T>(initialValue: T): {current: T},
  useEffect(
    create: () => (() => void) | void,
    deps: Array<mixed> | void | null,
  ): void,
  useLayoutEffect(
    create: () => (() => void) | void,
    deps: Array<mixed> | void | null,
  ): void,
  useMemo<T>(create: () => T, deps: Array<mixed> | void | null): T,
  useCallback<T>(callback: T, deps: Array<mixed> | void | null): T,
  // ... 更多Hooks
};
```

### 三种Dispatcher

```javascript
// 1. ContextOnlyDispatcher：防止在错误位置调用Hook
const ContextOnlyDispatcher: Dispatcher = {
  useState: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  // ...
};

function throwInvalidHookError() {
  throw new Error(
    'Invalid hook call. Hooks can only be called inside of the body of a function component.'
  );
}

// 2. HooksDispatcherOnMount：mount阶段
const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
  useEffect: mountEffect,
  useMemo: mountMemo,
  useCallback: mountCallback,
  // ...
};

// 3. HooksDispatcherOnUpdate：update阶段
const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
  useEffect: updateEffect,
  useMemo: updateMemo,
  useCallback: updateCallback,
  // ...
};
```

### Dispatcher的切换

```javascript
// renderWithHooks中
if (current !== null && current.memoizedState !== null) {
  // update阶段
  ReactSharedInternals.H = HooksDispatcherOnUpdate;
} else {
  // mount阶段
  ReactSharedInternals.H = HooksDispatcherOnMount;
}

// 执行组件
children = Component(props, secondArg);

// 恢复到ContextOnlyDispatcher
ReactSharedInternals.H = ContextOnlyDispatcher;

// 这样确保Hook只能在组件render期间调用
```

### 用户调用Hook的过程

```javascript
// 用户代码
import { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);  // ← 这里发生了什么？
  return <div>{count}</div>;
}

// 实际调用链
1. useState(0)
   ↓
2. ReactSharedInternals.H.useState(0)
   ↓
3. mount时: mountState(0)
   update时: updateState(0)
   ↓
4. mountWorkInProgressHook() 或 updateWorkInProgressHook()
   ↓
5. 创建/获取Hook对象
   ↓
6. Hook.memoizedState = 0
   ↓
7. 返回 [0, dispatch]
```

---

## 六、完整案例：Counter组件的Hook链表

### 组件代码

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Tom');
  const doubleCount = useMemo(() => count * 2, [count]);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  useEffect(() => {
    console.log('Name:', name);
  }, [name]);
  
  return (
    <div>
      <p>{name}: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### mount阶段

```javascript
// renderWithHooks开始
currentlyRenderingFiber = Counter Fiber (workInProgress)
ReactSharedInternals.H = HooksDispatcherOnMount

// 执行Counter()

// 1. useState(0)
mountState(0)
  → mountWorkInProgressHook()
  → Hook1 { memoizedState: 0, queue: {...}, next: null }
  → Fiber.memoizedState = Hook1

// 2. useState('Tom')
mountState('Tom')
  → mountWorkInProgressHook()
  → Hook2 { memoizedState: 'Tom', queue: {...}, next: null }
  → Hook1.next = Hook2

// 3. useMemo(() => 0 * 2, [0])
mountMemo(() => 0 * 2, [0])
  → mountWorkInProgressHook()
  → Hook3 { memoizedState: [0, [0]], next: null }
  → Hook2.next = Hook3

// 4. useEffect(effect1, [0])
mountEffect(effect1, [0])
  → mountWorkInProgressHook()
  → Hook4 { memoizedState: { tag, create, deps: [0], inst }, next: null }
  → Hook3.next = Hook4
  → 创建Effect对象，添加到updateQueue.lastEffect

// 5. useEffect(effect2, ['Tom'])
mountEffect(effect2, ['Tom'])
  → mountWorkInProgressHook()
  → Hook5 { memoizedState: { tag, create, deps: ['Tom'], inst }, next: null }
  → Hook4.next = Hook5
  → 创建Effect对象，添加到updateQueue.lastEffect

// renderWithHooks结束
ReactSharedInternals.H = ContextOnlyDispatcher
currentlyRenderingFiber = null

// 最终结构
Counter Fiber {
  memoizedState: Hook1 → Hook2 → Hook3 → Hook4 → Hook5 → null
                  ↓       ↓       ↓       ↓       ↓
                count   name   memo   effect1  effect2
                
  updateQueue: {
    lastEffect: Effect1 ⟲ Effect2 (环形链表)
  }
}
```

### update阶段

```javascript
// renderWithHooks开始
currentlyRenderingFiber = Counter Fiber (workInProgress)
current = Counter Fiber (current树，有Hook链表)
ReactSharedInternals.H = HooksDispatcherOnUpdate

// 执行Counter()

// 1. useState(0)
updateState(0)
  → updateWorkInProgressHook()
  → currentHook = current.memoizedState (Hook1)
  → 克隆为新的Hook1
  → 处理updateQueue，计算新count
  → workInProgress.memoizedState = Hook1'

// 2. useState('Tom')
updateState('Tom')
  → updateWorkInProgressHook()
  → currentHook = currentHook.next (Hook2)
  → 克隆为新的Hook2
  → 处理updateQueue
  → Hook1'.next = Hook2'

// 3. useMemo(() => count * 2, [count])
updateMemo(() => count * 2, [count])
  → updateWorkInProgressHook()
  → currentHook = currentHook.next (Hook3)
  → 克隆为新的Hook3
  → 比较deps [0] vs [1]，不同，重新计算
  → Hook3'.memoizedState = [2, [1]]

// 4. useEffect(effect1, [count])
updateEffect(effect1, [count])
  → updateWorkInProgressHook()
  → currentHook = currentHook.next (Hook4)
  → 比较deps，标记需要执行

// 5. useEffect(effect2, [name])
updateEffect(effect2, [name])
  → updateWorkInProgressHook()
  → currentHook = currentHook.next (Hook5)
  → 比较deps，deps相同，不执行

// 最终：新的Hook链表构建完成
```

---

## 七、常见错误与检测

### 错误1：条件调用

```javascript
// ❌ 错误
function Component({ show }) {
  const [count, setCount] = useState(0);
  
  if (show) {
    const [name, setName] = useState('Tom');  // ❌
  }
  
  return <div>{count}</div>;
}

// React检测：
// show从true变false时
// updateWorkInProgressHook()会发现Hook数量不一致
// 抛出错误：Rendered more/fewer hooks than during the previous render.
```

### 错误2：循环调用

```javascript
// ❌ 错误
function Component({ items }) {
  items.forEach(item => {
    const [value, setValue] = useState(item);  // ❌ 循环中调用
  });
  
  return <div>...</div>;
}

// items长度变化会导致Hook数量变化
```

### 错误3：嵌套函数调用

```javascript
// ❌ 错误
function Component() {
  const handleClick = () => {
    const [value, setValue] = useState(0);  // ❌ 回调中调用
  };
  
  return <button onClick={handleClick}>Click</button>;
}

// Hook在handleClick中调用，不在组件顶层
// currentlyRenderingFiber此时是null
```

### 正确用法

```javascript
// ✅ 正确
function Component({ show, items }) {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Tom');
  
  // Hook总是按顺序调用，数量固定
  
  // 条件逻辑放在Hook内部
  useEffect(() => {
    if (show) {
      console.log(name);
    }
  }, [show, name]);
  
  // 循环逻辑放在Hook外部
  const values = items.map(item => item.value);
  const total = useMemo(() => {
    return values.reduce((a, b) => a + b, 0);
  }, [values]);
  
  return <div>{count}</div>;
}
```

---

## 八、Hook的生命周期

### mount → update → unmount

```
┌─────────────────────────────────────────────┐
│ mount阶段                                   │
├─────────────────────────────────────────────┤
│ renderWithHooks                             │
│   → Dispatcher = HooksDispatcherOnMount     │
│   → 执行组件                                 │
│     → useState() → mountState()              │
│       → mountWorkInProgressHook()            │
│       → 创建Hook，添加到链表                  │
│   → 返回children                             │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ update阶段                                  │
├─────────────────────────────────────────────┤
│ renderWithHooks                             │
│   → Dispatcher = HooksDispatcherOnUpdate    │
│   → 执行组件                                 │
│     → useState() → updateState()             │
│       → updateWorkInProgressHook()           │
│       → 从current克隆Hook                    │
│       → 处理updateQueue                      │
│   → 返回children                             │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ unmount阶段                                 │
├─────────────────────────────────────────────┤
│ commit阶段                                  │
│   → 遍历Fiber.updateQueue.lastEffect       │
│   → 调用每个effect的destroy函数             │
│   → 清理Hook链表                             │
└─────────────────────────────────────────────┘
```

---

## 九、实际应用场景

### 场景1：自定义Hook

```javascript
// 自定义Hook也遵循相同规则
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);
  
  return { count, increment, decrement };
}

// 使用
function Component() {
  const counter = useCounter(10);
  
  return (
    <>
      <p>{counter.count}</p>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.decrement}>-</button>
    </>
  );
}

// Hook链表：
// Component Fiber.memoizedState:
//   Hook1 (useState from useCounter)
//     → Hook2 (useCallback increment)
//       → Hook3 (useCallback decrement)
//         → null
```

### 场景2：动态Hook（错误示例与修正）

```javascript
// ❌ 错误：动态数量的Hook
function DynamicHooks({ fields }) {
  const states = fields.map(field => {
    return useState(field.default);  // ❌ 循环中调用
  });
  
  return <div>...</div>;
}

// ✅ 正确：使用单个state存储所有值
function DynamicFields({ fields }) {
  const [values, setValues] = useState(() => {
    const initial = {};
    fields.forEach(field => {
      initial[field.name] = field.default;
    });
    return initial;
  });
  
  const updateField = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div>
      {fields.map(field => (
        <input
          key={field.name}
          value={values[field.name]}
          onChange={e => updateField(field.name, e.target.value)}
        />
      ))}
    </div>
  );
}
```

### 场景3：Hook的复用

```javascript
// 多个组件可以使用相同的自定义Hook
function useWindowSize() {
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
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}

// 每个组件都有自己的Hook链表
function ComponentA() {
  const size = useWindowSize();  // 独立的Hook链表
  return <div>A: {size.width}</div>;
}

function ComponentB() {
  const size = useWindowSize();  // 另一个独立的Hook链表
  return <div>B: {size.width}</div>;
}

// ComponentA和ComponentB各自的Fiber有各自的Hook链表
// 互不影响
```

---

## 十、源码关键路径

```
Hooks核心文件：

packages/react-reconciler/src/
├── ReactFiberHooks.js                  # Hooks主文件
│   ├── Hook类型定义                    # memoizedState, queue, next
│   ├── renderWithHooks()               # 关联Fiber和Hooks
│   ├── mountWorkInProgressHook()       # mount时创建Hook
│   ├── updateWorkInProgressHook()      # update时克隆Hook
│   ├── HooksDispatcherOnMount          # mount阶段的Dispatcher
│   ├── HooksDispatcherOnUpdate         # update阶段的Dispatcher
│   ├── ContextOnlyDispatcher           # 错误检测Dispatcher
│   └── 各种具体Hook的实现
│       ├── mountState / updateState
│       ├── mountEffect / updateEffect
│       ├── mountMemo / updateMemo
│       └── ...
│
├── ReactFiberBeginWork.js              # beginWork调用renderWithHooks
│   └── updateFunctionComponent()       # 函数组件更新入口
│
└── ReactInternalTypes.js               # 类型定义
    └── Dispatcher类型

packages/react/src/
└── ReactHooks.js                       # 用户导入的Hook
    └── 导出ReactSharedInternals.H的各个方法
```

---

## 十一、面试要点速记

### 快速回答框架

**Hooks如何与Fiber关联？**
- Hook链表存储在Fiber.memoizedState上
- renderWithHooks时设置currentlyRenderingFiber
- Hook通过这个全局变量找到对应的Fiber

**Hook的数据结构？**
```javascript
Hook {
  memoizedState,  // 状态值
  queue,          // 更新队列
  next,           // 下一个Hook
}
```

**为什么必须在顶层调用？**
- Hook依赖调用顺序匹配
- 没有用key或name标识
- 顺序变化会导致Hook错配

**Dispatcher是什么？**
- 三种Dispatcher：mount、update、ContextOnly
- renderWithHooks根据阶段切换
- 保证Hook只在正确时机调用

### 加分项

1. **能画出Hook链表结构**：
   - Fiber → Hook1 → Hook2 → Hook3

2. **能说明renderWithHooks的作用**：
   - 设置全局变量
   - 选择Dispatcher
   - 执行组件
   - 清理上下文

3. **能举例错误用法**：
   - 条件调用
   - 循环调用
   - 回调中调用

4. **能解释检测机制**：
   - updateWorkInProgressHook检测数量
   - ContextOnlyDispatcher防止错误调用

### 常见追问

**Q: 为什么不给Hook加key/name？**
A:
- 增加API复杂度
- 用户容易犯错（忘记写key）
- 顺序依赖简单有效
- 通过lint规则强制保证顺序

**Q: useEffect的deps是如何比较的？**
A:
- 浅比较，使用Object.is
- 遍历数组，逐个比较
- 不同则执行effect

**Q: 为什么Hooks不能在类组件中使用？**
A:
- Hooks依赖Fiber.memoizedState存储链表
- 类组件的memoizedState存储state对象
- 类组件用instance.state，不兼容Hook链表

**Q: 多次调用同一个Hook会怎样？**
A:
```javascript
const [a] = useState(0);
const [b] = useState(1);
const [c] = useState(2);
// 三个独立的Hook对象，形成链表
// 每次调用都会创建/更新下一个Hook
```

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberHooks.js`
- [React Hooks RFC](https://github.com/reactjs/rfcs/blob/main/text/0068-react-hooks.md)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

**最后更新**: 2025-11-05

