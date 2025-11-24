# 09 - useState和useReducer底层实现详解

> **问题**: useState和useReducer的底层实现有什么区别和联系？update对象是如何组织的？

---

## 一、核心数据结构

### Update对象

源码：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
export type Update<S, A> = {
  lane: Lane,                    // 优先级
  revertLane: Lane,             // 回滚的优先级
  action: A,                    // 更新的动作（新state或函数）
  hasEagerState: boolean,       // 是否有预计算的state
  eagerState: S | null,         // 预计算的state值
  next: Update<S, A>,           // 下一个update（环形链表）
  gesture: null | ScheduledGesture,  // 手势相关
};
```

### UpdateQueue

```javascript
export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null,        // pending update环形链表
  lanes: Lanes,                         // 所有update的lanes合集
  dispatch: (A => mixed) | null,        // dispatch函数
  lastRenderedReducer: ((S, A) => S) | null,  // 上次使用的reducer
  lastRenderedState: S | null,          // 上次渲染的state
};
```

### Hook对象（复习）

```javascript
export type Hook = {
  memoizedState: any,              // 当前state值
  baseState: any,                  // 基础state（跳过低优先级update后的state）
  baseQueue: Update<any, any> | null,  // 基础update队列
  queue: any,                      // UpdateQueue
  next: Hook | null,               // 下一个Hook
};
```

---

## 二、useState的底层实现

### useState = useReducer的简化版

**核心关系**：

```javascript
// useState内部调用useReducer
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // action可以是新值或函数
  return typeof action === 'function' ? action(state) : action;
}

// mount阶段
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountStateImpl(initialState);
  const queue = hook.queue;
  const dispatch: Dispatch<BasicStateAction<S>> = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,  // 闭包捕获Fiber
    queue,
  );
  queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}

function mountStateImpl<S>(initialState: (() => S) | S): Hook {
  const hook = mountWorkInProgressHook();
  
  // 支持函数式初始化
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  
  hook.memoizedState = hook.baseState = initialState;
  
  // 创建updateQueue
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,  // 关键！使用basicStateReducer
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  
  return hook;
}

// update阶段
function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 直接调用updateReducer，传入basicStateReducer
  return updateReducer(basicStateReducer, initialState);
}
```

**关键理解**：

```
useState本质上就是预置了reducer的useReducer
├─ useState的action: 新值 或 (prevState) => newState
├─ useReducer的action: 任意类型（由用户定义）
└─ basicStateReducer处理两种情况：
   - 函数：action(state) → 函数式更新
   - 值：action → 直接设置新值
```

---

## 三、useReducer的完整实现

### mount阶段

```javascript
function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 1. 创建Hook对象
  const hook = mountWorkInProgressHook();
  
  // 2. 初始化state（支持init函数）
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg;
  }
  
  hook.memoizedState = hook.baseState = initialState;
  
  // 3. 创建updateQueue
  const queue: UpdateQueue<S, A> = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  
  // 4. 创建dispatch函数（闭包捕获fiber和queue）
  const dispatch: Dispatch<A> = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  );
  queue.dispatch = dispatch;
  
  return [hook.memoizedState, dispatch];
}
```

### update阶段

```javascript
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  return updateReducerImpl(hook, currentHook, reducer);
}

function updateReducerImpl<S, A>(
  hook: Hook,
  current: Hook,
  reducer: (S, A) => S,
): [S, Dispatch<A>] {
  const queue = hook.queue;
  
  queue.lastRenderedReducer = reducer;

  // ========== 1. 合并pending queue到base queue ==========
  let baseQueue = hook.baseQueue;
  const pendingQueue = queue.pending;
  
  if (pendingQueue !== null) {
    if (baseQueue !== null) {
      // 合并两个环形链表
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  // ========== 2. 处理update队列 ==========
  const baseState = hook.baseState;
  
  if (baseQueue === null) {
    // 没有update，直接使用baseState
    hook.memoizedState = baseState;
  } else {
    // 有update，开始计算
    const first = baseQueue.next;
    let newState = baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    
    do {
      const updateLane = update.lane;
      
      // 检查update的优先级是否足够
      const shouldSkipUpdate = !isSubsetOfLanes(renderLanes, updateLane);
      
      if (shouldSkipUpdate) {
        // ========== 优先级不够，跳过此update ==========
        // 但要保留在baseQueue中
        const clone: Update<S, A> = {
          lane: updateLane,
          revertLane: update.revertLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null,
        };
        
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;  // 记录跳过前的state
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        
        // 合并lanes
        hook.lanes = mergeLanes(hook.lanes, updateLane);
        markSkippedUpdateLanes(updateLane);
      } else {
        // ========== 优先级足够，处理update ==========
        
        // 如果之前有跳过的update，这个update也要加入baseQueue
        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            lane: NoLane,  // 已经处理了，lane设为NoLane
            revertLane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null,
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        const action = update.action;
        
        // 使用eager state或计算新state
        if (update.hasEagerState) {
          // 已经预计算过了
          newState = update.eagerState;
        } else {
          // 调用reducer计算
          newState = reducer(newState, action);
        }
      }
      
      update = update.next;
    } while (update !== null && update !== first);

    // ========== 3. 更新Hook状态 ==========
    if (newBaseQueueLast === null) {
      // 所有update都处理了
      newBaseState = newState;
    } else {
      // 还有跳过的update，形成环形链表
      newBaseQueueLast.next = newBaseQueueFirst;
    }

    // 检测state是否变化
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}
```

---

## 四、dispatch的实现

### dispatchSetState

```javascript
function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
): void {
  // 1. 获取更新的优先级
  const lane = requestUpdateLane(fiber);
  
  const didScheduleUpdate = dispatchSetStateInternal(
    fiber,
    queue,
    action,
    lane,
  );
  
  if (didScheduleUpdate) {
    startUpdateTimerByLane(lane, 'setState()', fiber);
  }
}

function dispatchSetStateInternal<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
  lane: Lane,
): boolean {
  // 2. 创建update对象
  const update: Update<S, A> = {
    lane,
    revertLane: NoLane,
    gesture: null,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };

  // 3. 判断是否是render阶段的update
  if (isRenderPhaseUpdate(fiber)) {
    // render阶段的update，直接入队
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    const alternate = fiber.alternate;
    
    // ========== eager state优化 ==========
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // 队列为空，可以提前计算state
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        try {
          const currentState: S = queue.lastRenderedState;
          const eagerState = lastRenderedReducer(currentState, action);
          
          // 保存eager state
          update.hasEagerState = true;
          update.eagerState = eagerState;
          
          if (is(eagerState, currentState)) {
            // Fast path: 新state和当前state相同，跳过render!
            enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update);
            return false;
          }
        } catch (error) {
          // 计算出错，正常流程处理
        }
      }
    }

    // 4. 入队并调度更新
    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (root !== null) {
      scheduleUpdateOnFiber(root, fiber, lane);
      entangleTransitionUpdate(root, queue, lane);
      return true;
    }
  }
  
  return false;
}
```

**eager state优化的作用**：

```javascript
// 示例
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(0)}>
      Count: {count}
    </button>
  );
}

// 用户点击按钮（count已经是0）：
1. dispatchSetState(0)
2. 检测到队列为空，计算eager state
3. eagerState = 0, currentState = 0
4. is(0, 0) === true
5. 跳过调度更新，不触发render!

性能提升：
- 避免了不必要的render
- 避免了不必要的diff
- 避免了不必要的commit
```

---

## 五、update队列的环形链表

### 环形链表结构

```javascript
// pending指向最后一个update
// pending.next指向第一个update

queue.pending = updateC
                  ↓
    ┌─────────────────────┐
    ↓                     │
updateA → updateB → updateC ──┘
  ↑                       │
  └───────────────────────┘
  first               last

// 优势：
// 1. O(1)时间添加update到队尾：queue.pending.next = newUpdate
// 2. O(1)时间获取第一个update：queue.pending.next
```

### 入队操作

源码：`packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`

```javascript
export function finishQueueingConcurrentUpdates(): void {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;

  let i = 0;
  while (i < endIndex) {
    const fiber: Fiber = concurrentQueues[i++];
    const queue: ConcurrentQueue = concurrentQueues[i++];
    const update: ConcurrentUpdate = concurrentQueues[i++];
    const lane: Lane = concurrentQueues[i++];

    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        // 第一个update：创建环形链表
        update.next = update;
      } else {
        // 插入到环形链表
        update.next = pending.next;  // 新update指向第一个
        pending.next = update;        // 最后一个指向新update
      }
      queue.pending = update;  // pending指向最后一个
    }

    if (lane !== NoLane) {
      markUpdateLaneFromFiberToRoot(fiber, update, lane);
    }
  }
}
```

**可视化过程**：

```
初始状态：
queue.pending = null

添加updateA：
queue.pending = updateA
                  ↓
                updateA ──┐
                  ↑       │
                  └───────┘

添加updateB：
1. updateB.next = updateA.next (updateA)
2. updateA.next = updateB
3. queue.pending = updateB

queue.pending = updateB
                  ↓
    ┌─────────────────┐
    ↓                 │
updateA → updateB ────┘

添加updateC：
1. updateC.next = updateB.next (updateA)
2. updateB.next = updateC
3. queue.pending = updateC

queue.pending = updateC
                  ↓
    ┌─────────────────────┐
    ↓                     │
updateA → updateB → updateC ──┘
```

---

## 六、完整案例：连续多次setState

### 示例代码

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);      // update1
    setCount(count + 1);      // update2
    setCount(c => c + 1);     // update3
  };
  
  return (
    <button onClick={handleClick}>
      Count: {count}
    </button>
  );
}
```

### 执行流程详解

```
========== 用户点击按钮 ==========

1. setCount(count + 1)  // count = 0
   ↓
   dispatchSetState(fiber, queue, 1)
   ↓
   创建update1 { action: 1, lane, ... }
   ↓
   入队：queue.pending = update1

2. setCount(count + 1)  // count = 0（闭包值）
   ↓
   dispatchSetState(fiber, queue, 1)
   ↓
   创建update2 { action: 1, lane, ... }
   ↓
   入队：update1 → update2

3. setCount(c => c + 1)
   ↓
   dispatchSetState(fiber, queue, c => c + 1)
   ↓
   创建update3 { action: function, lane, ... }
   ↓
   入队：update1 → update2 → update3

4. scheduleUpdateOnFiber(root, fiber, lane)
   ↓
   调度更新

========== render阶段 ==========

updateReducer(basicStateReducer, 0)
  ↓
  updateReducerImpl()
  ↓
  处理update队列：

  baseState = 0

  update1: action = 1
    newState = basicStateReducer(0, 1)
           = (typeof 1 === 'function' ? 1(0) : 1)
           = 1

  update2: action = 1
    newState = basicStateReducer(1, 1)
           = 1

  update3: action = (c => c + 1)
    newState = basicStateReducer(1, c => c + 1)
           = (c => c + 1)(1)
           = 2

  最终：newState = 2

  hook.memoizedState = 2

  return [2, dispatch]

========== 结果 ==========
count从0变成2（不是1）

关键点：
1. update1和update2都是直接值（闭包捕获的0+1=1）
2. update3是函数，基于最新state计算
3. 三次setState只触发一次render（批处理）
```

---

## 七、useState vs useReducer对比

### 源码对比

```javascript
// useState
const [state, setState] = useState(0);

// 等价于
const [state, dispatch] = useReducer(
  (state, action) => typeof action === 'function' ? action(state) : action,
  0
);

// 使用
setState(1);              // action是值
setState(prev => prev + 1); // action是函数

// useReducer
const [state, dispatch] = useReducer(reducer, initialState);

// reducer自定义
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

// 使用
dispatch({ type: 'increment' });  // action是对象
```

### 对比表格

| 特性 | useState | useReducer |
|------|----------|------------|
| **reducer** | basicStateReducer（内置） | 用户自定义 |
| **action类型** | 新值 或 函数 | 任意类型（由reducer决定） |
| **适用场景** | 简单state | 复杂state逻辑 |
| **update处理** | basicStateReducer(state, action) | reducer(state, action) |
| **底层实现** | 调用useReducer | 核心实现 |
| **dispatch** | setState | dispatch |
| **性能** | 相同（本质是同一个实现） | 相同 |

### 联系与区别

```
联系：
├─ useState内部调用useReducer
├─ 共享同样的update队列机制
├─ 共享同样的优先级处理逻辑
└─ 共享同样的eager state优化

区别：
├─ useState的reducer是预置的basicStateReducer
├─ useReducer的reducer由用户提供
└─ action的类型和含义不同
```

---

## 八、优先级处理

### 跳过低优先级update

```javascript
// 示例
function Component() {
  const [count, setCount] = useState(0);
  
  return (
    <>
      <button onClick={() => setCount(1)}>
        High Priority
      </button>
      <button onClick={() => startTransition(() => setCount(2))}>
        Low Priority
      </button>
    </>
  );
}
```

**执行时序**：

```
t=0: 点击"Low Priority"
  → 创建update1 { action: 2, lane: TransitionLane }
  → 调度低优先级更新

t=10: 低优先级render开始
  → baseState = 0
  → 处理update1，newState = 2

t=20: 点击"High Priority"（低优先级render还未完成）
  → 创建update2 { action: 1, lane: SyncLane }
  → 调度高优先级更新
  → 中断低优先级render

t=21: 高优先级render
  → baseState = 0
  → 队列：update1(low), update2(high)
  
  处理update1：
    lane = TransitionLane, renderLanes = SyncLane
    !isSubsetOfLanes(SyncLane, TransitionLane) → 跳过
    newBaseState = 0（跳过前的state）
    newBaseQueue = [update1]
    
  处理update2：
    lane = SyncLane, renderLanes = SyncLane
    isSubsetOfLanes(SyncLane, SyncLane) → 处理
    newState = 1
    newBaseQueue = [update1, update2]（update2也要保留）
  
  结果：
    memoizedState = 1（显示给用户）
    baseState = 0
    baseQueue = [update1, update2]

t=30: 低优先级render
  → renderLanes = TransitionLane
  → baseState = 0
  → baseQueue = [update1, update2]
  
  处理update1：
    lane = TransitionLane
    isSubsetOfLanes(TransitionLane, TransitionLane) → 处理
    newState = 2
    
  处理update2：
    lane = NoLane（上次已处理，lane清空了）
    优先级足够 → 处理
    newState = 1
  
  最终：memoizedState = 1

关键：高优先级update在低优先级render中会被重新处理
保证最终结果的一致性
```

---

## 九、实际应用场景

### 场景1：简单计数器（useState）

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    // ❌ 错误：不会累加3次
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    // 结果：count变成1（不是3）
    // 原因：闭包捕获的count都是0
  };
  
  const incrementCorrect = () => {
    // ✅ 正确：使用函数式更新
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
    // 结果：count变成3
    // 原因：每次基于最新state计算
  };
  
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={increment}>错误的+3</button>
      <button onClick={incrementCorrect}>正确的+3</button>
    </>
  );
}
```

### 场景2：复杂状态（useReducer）

```javascript
// 复杂的状态逻辑适合用useReducer
function shoppingCartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.item],
        total: state.total + action.item.price,
      };
    case 'REMOVE_ITEM':
      const item = state.items.find(i => i.id === action.id);
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.id),
        total: state.total - item.price,
      };
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
      };
    default:
      return state;
  }
}

function ShoppingCart() {
  const [cart, dispatch] = useReducer(shoppingCartReducer, {
    items: [],
    total: 0,
  });
  
  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', item });
  };
  
  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', id });
  };
  
  return (
    <div>
      <ul>
        {cart.items.map(item => (
          <li key={item.id}>
            {item.name} - ${item.price}
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: ${cart.total}</p>
      <button onClick={() => dispatch({ type: 'CLEAR_CART' })}>
        Clear
      </button>
    </div>
  );
}

// useReducer的优势：
// 1. 逻辑集中，易于测试
// 2. action类型明确，代码可读性好
// 3. 适合多个相关state的场景
// 4. 易于添加中间件、日志等
```

### 场景3：异步action（配合useEffect）

```javascript
function useAsyncReducer(reducer, initialState) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const asyncDispatch = async (asyncAction) => {
    dispatch({ type: 'LOADING' });
    
    try {
      const result = await asyncAction();
      dispatch({ type: 'SUCCESS', payload: result });
    } catch (error) {
      dispatch({ type: 'ERROR', error });
    }
  };
  
  return [state, asyncDispatch];
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return { loading: false, data: action.payload, error: null };
    case 'ERROR':
      return { loading: false, data: null, error: action.error };
    default:
      return state;
  }
}

function DataFetcher() {
  const [state, asyncDispatch] = useAsyncReducer(reducer, {
    loading: false,
    data: null,
    error: null,
  });
  
  const fetchData = () => {
    asyncDispatch(async () => {
      const response = await fetch('/api/data');
      return response.json();
    });
  };
  
  return (
    <div>
      {state.loading && <p>Loading...</p>}
      {state.error && <p>Error: {state.error.message}</p>}
      {state.data && <pre>{JSON.stringify(state.data, null, 2)}</pre>}
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
}
```

---

## 十、常见陷阱与最佳实践

### 陷阱1：闭包陷阱

```javascript
// ❌ 问题代码
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);  // 闭包捕获的count永远是0
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);  // 依赖为空，effect只执行一次
  
  return <div>{count}</div>;
}

// 结果：count只会变成1，然后不再增加

// ✅ 解决方案1：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);  // 基于最新state
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// ✅ 解决方案2：添加依赖
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  
  return () => clearInterval(timer);
}, [count]);  // 每次count变化重新创建timer

// ✅ 解决方案3：使用useRef
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(countRef.current + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <div>{count}</div>;
}
```

### 陷阱2：对象/数组state

```javascript
// ❌ 问题：直接修改state
function TodoList() {
  const [todos, setTodos] = useState([]);
  
  const addTodo = (text) => {
    todos.push({ id: Date.now(), text });  // ❌ 直接修改
    setTodos(todos);  // 引用相同，不会触发更新
  };
  
  return <div>...</div>;
}

// ✅ 正确：不可变更新
const addTodo = (text) => {
  setTodos([...todos, { id: Date.now(), text }]);
};

// 或使用函数式更新
const addTodo = (text) => {
  setTodos(prevTodos => [...prevTodos, { id: Date.now(), text }]);
};
```

### 陷阱3：reducer的纯函数要求

```javascript
// ❌ 错误：有副作用的reducer
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      // ❌ 直接修改state
      state.count++;
      return state;
      
    case 'FETCH':
      // ❌ 发起异步请求
      fetch('/api').then(data => {
        // 不能在这里dispatch
      });
      return state;
      
    default:
      return state;
  }
}

// ✅ 正确：纯函数，不可变更新
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
      
    case 'SET_DATA':
      return { ...state, data: action.payload };
      
    default:
      return state;
  }
}

// 异步逻辑放在组件中
const fetchData = async () => {
  const data = await fetch('/api').then(r => r.json());
  dispatch({ type: 'SET_DATA', payload: data });
};
```

---

## 十一、性能优化

### 1. 减少不必要的render

```javascript
// 利用eager state优化
function OptimizedComponent() {
  const [value, setValue] = useState(0);
  
  const handleClick = () => {
    // 如果新值等于旧值，不会触发render
    setValue(0);  // value已经是0，跳过render
  };
  
  return <button onClick={handleClick}>Value: {value}</button>;
}
```

### 2. 批量更新

```javascript
// React自动批处理（React 18+）
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  const handleClick = () => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 只触发一次render，不是两次
  };
  
  // 即使在异步中也会批处理
  const handleAsync = async () => {
    await fetch('/api');
    setCount(c => c + 1);
    setFlag(f => !f);
    // React 18: 批处理，一次render
    // React 17: 不批处理，两次render
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

### 3. 使用useReducer提取逻辑

```javascript
// ❌ 多个useState，逻辑分散
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);
  const [errors, setErrors] = useState({});
  
  const handleSubmit = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Required';
    if (!email) newErrors.email = 'Required';
    if (age < 18) newErrors.age = 'Must be 18+';
    setErrors(newErrors);
    // ...
  };
  
  return <div>...</div>;
}

// ✅ useReducer，逻辑集中
const initialState = {
  fields: { name: '', email: '', age: 0 },
  errors: {},
  isSubmitting: false,
};

function formReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        fields: { ...state.fields, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: null },
      };
    case 'VALIDATE':
      const errors = {};
      if (!state.fields.name) errors.name = 'Required';
      if (!state.fields.email) errors.email = 'Required';
      if (state.fields.age < 18) errors.age = 'Must be 18+';
      return { ...state, errors };
    case 'SUBMIT':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return initialState;
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, errors: action.errors };
    default:
      return state;
  }
}

function Form() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  
  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };
  
  const handleSubmit = async () => {
    dispatch({ type: 'VALIDATE' });
    if (Object.keys(state.errors).length === 0) {
      dispatch({ type: 'SUBMIT' });
      try {
        await submitForm(state.fields);
        dispatch({ type: 'SUBMIT_SUCCESS' });
      } catch (error) {
        dispatch({ type: 'SUBMIT_ERROR', errors: error.errors });
      }
    }
  };
  
  return <div>...</div>;
}
```

---

## 十二、源码关键路径

```
useState/useReducer核心文件：

packages/react-reconciler/src/
├── ReactFiberHooks.js                  # Hooks主文件
│   ├── Hook类型定义                    # memoizedState, queue, next
│   ├── Update类型定义                  # lane, action, next
│   ├── UpdateQueue类型定义             # pending, lanes, dispatch
│   ├── basicStateReducer()             # useState的reducer
│   ├── mountState()                    # useState mount
│   ├── updateState()                   # useState update（调用updateReducer）
│   ├── mountReducer()                  # useReducer mount
│   ├── updateReducer()                 # useReducer update
│   ├── updateReducerImpl()             # update的核心实现
│   ├── dispatchSetState()              # setState的实现
│   └── dispatchReducerAction()         # dispatch的实现
│
└── ReactFiberConcurrentUpdates.js     # 并发更新入队
    └── finishQueueingConcurrentUpdates()  # 构建环形链表
```

---

## 十三、面试要点速记

### 快速回答框架

**useState和useReducer的关系？**
- useState内部调用useReducer
- useState = useReducer + basicStateReducer
- 共享同样的update队列机制

**update对象如何组织？**
- 环形链表结构
- queue.pending指向最后一个update
- pending.next指向第一个update
- 优势：O(1)添加、O(1)获取首个

**useState的实现原理？**
1. mount: 创建Hook和queue，返回[state, setState]
2. update: 处理pending queue，计算新state
3. dispatch: 创建update，入队，调度更新

**优先级如何处理？**
- 低优先级update会被跳过
- 跳过的update保留在baseQueue
- 高优先级render后，低优先级render重新处理
- 保证最终结果一致性

### 加分项

1. **能解释eager state优化**：
   - 队列为空时预计算
   - 新state等于旧state时跳过render

2. **能画出环形链表结构**：
   - pending → updateC → updateA → updateB → updateC

3. **能说明闭包陷阱**：
   - setState(count + 1)捕获旧值
   - setState(c => c + 1)使用最新值

4. **能对比useState和useReducer**：
   - 适用场景
   - 实现差异
   - 性能特点

### 常见追问

**Q: 为什么连续多次setState只触发一次render？**
A:
- 批处理机制（Batching）
- 多个update入队到pending
- 一次render统一处理所有update

**Q: useState的函数式更新和直接值更新有什么区别？**
A:
- 直接值：`setState(1)` → action = 1
- 函数：`setState(c => c + 1)` → action = function
- basicStateReducer处理时会判断类型
- 函数式更新基于最新state，避免闭包陷阱

**Q: 为什么需要baseState和baseQueue？**
A:
- 支持优先级跳过
- baseState: 跳过低优先级update前的state
- baseQueue: 被跳过的update + 后续所有update
- 低优先级render时从baseState重新计算

**Q: dispatch函数为什么是稳定的？**
A:
- 使用bind创建，闭包捕获fiber和queue
- fiber和queue的引用在组件生命周期内不变
- 所以dispatch引用也不变
- 可以安全地放入useEffect的deps

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberHooks.js`
- [useState文档](https://react.dev/reference/react/useState)
- [useReducer文档](https://react.dev/reference/react/useReducer)

**最后更新**: 2025-11-05

