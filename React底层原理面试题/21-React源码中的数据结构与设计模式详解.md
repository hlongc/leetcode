# React 源码中的数据结构与设计模式详解

> 本文档详细分析 React 源码中使用的数据结构、设计模式和编程技巧，并标注了对应的源码路径，方便深入学习。

## 📖 源码阅读指南

### 如何使用本文档

1. **克隆 React 源码**：

   ```bash
   git clone https://github.com/facebook/react.git
   cd react
   git checkout v18.2.0  # 或其他稳定版本
   ```

2. **查找源码位置**：

   - 每个代码块上方都标注了对应的源码文件路径
   - 路径格式：`packages/包名/src/文件名.js`
   - 例如：`packages/react-reconciler/src/ReactFiber.js`

3. **推荐阅读顺序**：
   - 先阅读本文档理解概念
   - 再根据路径查看对应的源码实现
   - 结合调试工具（如 Chrome DevTools）实际运行

### 源码目录结构

```
react/
├── packages/
│   ├── react/                    # React 核心 API（useState, useEffect 等）
│   ├── react-dom/                # DOM 渲染器
│   ├── react-reconciler/         # 协调器（Fiber、调度、更新逻辑）
│   │   └── src/
│   │       ├── ReactFiber.js           # Fiber 节点创建
│   │       ├── ReactFiberWorkLoop.js   # 工作循环
│   │       ├── ReactFiberHooks.js      # Hooks 实现
│   │       ├── ReactFiberLane.js       # Lane 优先级模型
│   │       ├── ReactChildFiber.js      # Diff 算法
│   │       └── ...
│   ├── scheduler/                # 调度器（时间切片、任务队列）
│   │   └── src/
│   │       ├── Scheduler.js            # 调度器核心
│   │       └── SchedulerMinHeap.js     # 小顶堆实现
│   └── shared/                   # 共享工具函数
```

### 调试技巧

```javascript
// 1. 在浏览器中运行 React DevTools
// 2. 在 Chrome 中设置断点调试
// 3. 使用 console.log 追踪 Fiber 节点

// 示例：打印 Fiber 树结构
function printFiberTree(fiber, indent = 0) {
  if (!fiber) return;
  console.log(" ".repeat(indent) + fiber.type);
  printFiberTree(fiber.child, indent + 2);
  printFiberTree(fiber.sibling, indent);
}
```

## 目录

- [数据结构篇](#数据结构篇)
- [设计模式篇](#设计模式篇)
- [巧妙技巧篇](#巧妙技巧篇)
- [综合应用案例](#综合应用案例)

---

## 数据结构篇

### 1. Fiber 链表结构（核心）

**应用场景**：整个 React 架构的基石

**源码路径**：`packages/react-reconciler/src/ReactInternalTypes.js`

**结构特点**：

```typescript
// packages/react-reconciler/src/ReactInternalTypes.js (88-189行)
export type Fiber = {
  // Tag identifying the type of fiber.
  tag: WorkTag,

  // Unique identifier of this child.
  key: null | string,

  // The value of element.type
  elementType: any,

  // The resolved function/class associated with this fiber.
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  // 三个指针构成单向链表树形结构
  return: Fiber | null,  // 父节点（返回地址）
  child: Fiber | null,   // 第一个子节点
  sibling: Fiber | null, // 下一个兄弟节点
  index: number,

  // Props and state
  pendingProps: any,
  memoizedProps: any,
  updateQueue: mixed,
  memoizedState: any,

  // Dependencies (contexts, events) for this fiber
  dependencies: Dependencies | null,

  // Effect
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null,

  // Lanes
  lanes: Lanes,
  childLanes: Lanes,

  // 双缓存指针 - 指向另一棵树的对应节点
  alternate: Fiber | null,

  // ... 其他性能分析相关属性
};
```

**巧妙之处**：

- **单向链表 + 父指针**：不需要维护整个子节点数组，节省内存
- **深度优先遍历**：通过 child → sibling → return 实现可中断的遍历
- **O(1) 复杂度访问父节点**：直接通过 `return` 指针

**遍历算法**：

**源码路径**：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.js
function workLoop(fiber) {
  let current = fiber;

  while (current) {
    // 1. 处理当前节点（beginWork）
    performUnitOfWork(current);

    // 2. 优先遍历子节点
    if (current.child) {
      current = current.child;
      continue;
    }

    // 3. 没有子节点，处理兄弟节点
    if (current.sibling) {
      current = current.sibling;
      continue;
    }

    // 4. 没有兄弟节点，返回父节点
    while (current.return) {
      current = current.return;

      // 检查父节点是否有兄弟节点
      if (current.sibling) {
        current = current.sibling;
        break;
      }
    }

    // 5. 回到根节点，遍历结束
    if (!current.return) break;
  }
}
```

**为什么这样设计？**

- 可以随时暂停和恢复（保存当前 fiber 引用即可）
- 内存占用更小（只需要 3 个指针）
- 便于实现时间切片

---

### 2. 环形链表（Hooks 链表）

**应用场景**：useState、useEffect 等 Hooks 的存储

**源码路径**：`packages/react-reconciler/src/ReactFiberHooks.js`

**结构特点**：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.js (195-181行)
export type Hook = {
  memoizedState: any,    // 当前状态
  baseState: any,        // 基础状态
  baseQueue: Update<any, any> | null,  // 基础队列
  queue: any,            // 更新队列
  next: Hook | null,     // 下一个 Hook（形成链表）
};

// packages/react-reconciler/src/ReactFiberHooks.js (165-181行)
export type Update<S, A> = {
  lane: Lane,            // 优先级
  revertLane: Lane,
  action: A,             // 更新动作
  hasEagerState: boolean,
  eagerState: S | null,
  next: Update<S, A>,    // 指向下一个更新（形成环）
  gesture: null | ScheduledGesture,
};

export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null,  // 指向环形链表的最后一个更新
  lanes: Lanes,
  dispatch: (A => mixed) | null,
  lastRenderedReducer: ((S, A) => S) | null,
  lastRenderedState: S | null,
};
```

**巧妙之处**：环形链表的妙用

**源码路径**：`packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`

```javascript
// packages/react-reconciler/src/ReactFiberConcurrentUpdates.js (68-77行)
// 环形链表的创建过程
if (queue !== null && update !== null) {
  const pending = queue.pending;
  if (pending === null) {
    // This is the first update. Create a circular list.
    // 第一个更新，创建环形链表
    update.next = update;  // 指向自己
  } else {
    // pending 指向最后一个，pending.next 指向第一个
    update.next = pending.next;  // 新更新指向第一个
    pending.next = update;        // 原最后一个指向新更新
  }
  queue.pending = update;  // pending 更新为新的最后一个
}

// 遍历所有更新（从第一个开始）
function processUpdateQueue(queue) {
  const pending = queue.pending;
  if (pending === null) return;

  const first = pending.next; // 第一个更新
  let update = first;

  do {
    // 处理更新
    processUpdate(update);
    update = update.next;
  } while (update !== first); // 遍历完整个环
}
```

**为什么用环形链表？**

- **O(1) 插入**：始终在尾部插入，只需要修改两个指针
- **保持顺序**：`pending.next` 始终指向第一个更新
- **便于合并**：多个环形链表可以轻松合并

---

### 3. 优先级队列（Lane 模型）

**应用场景**：管理不同优先级的更新

**源码路径**：`packages/react-reconciler/src/ReactFiberLane.js`

**数据结构**：使用**位运算**实现的优先级队列

```typescript
// packages/react-reconciler/src/ReactFiberLane.js (17-40行)
export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;

export const TotalLanes = 31;  // 总共31个优先级通道

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

// 注意：实际源码中的Lane定义更复杂，这里展示主要的几个
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;

// 输入和连续事件
export const InputContinuousLane: Lane = /*             */ 0b0000000000000000000000000000100;

// 默认优先级
export const DefaultLane: Lane = /*                     */ 0b0000000000000000000000000010000;

// 空闲优先级
export const IdleLane: Lane = /*                        */ 0b0100000000000000000000000000000;
```

**巧妙的位运算技巧**：

**源码路径**：`packages/react-reconciler/src/ReactFiberLane.js`

```javascript
// packages/react-reconciler/src/ReactFiberLane.js

// 1. 判断是否包含某个优先级 (779-781行)
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane): boolean {
  return (a & b) !== NoLanes;
}

// 2. 合并优先级 (787-789行)
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;  // 按位或
}

// 3. 移除优先级 (791-793行)
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;  // 按位与 + 按位非
}

// 4. 获取最高优先级（最右边的 1）(751-753行)
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;  // 巧妙！利用补码特性
}

// 5. 交集 (795-797行)
export function intersectLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a & b;
}

// 原理解析：
// lanes  = 0b0010100  (20)
// -lanes = 0b1101100  (补码：取反 + 1)
// &      = 0b0000100  (只保留最右边的 1)
```

**为什么用位运算？**

- **性能极高**：位运算是 CPU 原生指令
- **节省内存**：31 个优先级只需要 1 个数字
- **操作简单**：合并、移除都是一行代码

---

### 4. 小顶堆（任务调度）

**应用场景**：Scheduler 中的任务队列

**源码路径**：`packages/scheduler/src/SchedulerMinHeap.js`

**实现**：

```javascript
// packages/scheduler/src/SchedulerMinHeap.js (1-95行)
// 小顶堆：父节点总是小于子节点
// 注意：React 使用函数式 API，不是 class

type Heap<T: Node> = Array<T>;
type Node = {
  id: number,
  sortIndex: number,  // 用于排序的索引（通常是 expirationTime）
  ...
};

// 插入节点到堆 (17-21行)
export function push<T: Node>(heap: Heap<T>, node: T): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);  // 上浮
}

// 查看堆顶（不移除）(23-25行)
export function peek<T: Node>(heap: Heap<T>): T | null {
  return heap.length === 0 ? null : heap[0];
}

// 取出堆顶元素 (27-40行)
export function pop<T: Node>(heap: Heap<T>): T | null {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    siftDown(heap, last, 0);  // 下沉
  }
  return first;
}

// 上浮操作 (42-57行)
function siftUp<T: Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;  // 父节点索引
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      return;
    }
  }
}

// 下沉操作 (59-89行)
function siftDown<T: Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // If the left or right node is smaller, swap with the smaller of those.
    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // Neither child is smaller. Exit.
      return;
    }
  }
}

// 比较函数 (91-95行)
function compare(a: Node, b: Node) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
```

**为什么用小顶堆？**

- **O(log n) 插入和删除**：比数组高效
- **O(1) 查看最高优先级**：堆顶始终是最紧急的任务
- **自动排序**：不需要手动维护顺序

**应用示例**：

**源码路径**：`packages/scheduler/src/forks/Scheduler.js`

```javascript
// packages/scheduler/src/forks/Scheduler.js (78-80行)
// Tasks are stored on a min heap
var taskQueue: Array<Task> = [];
var timerQueue: Array<Task> = [];

// 实际的工作循环 (188-237行)
function workLoop(initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);  // 从小顶堆中获取最高优先级任务
  
  while (currentTask !== null) {
    if (!enableAlwaysYieldScheduler) {
      if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
        // This currentTask hasn't expired, and we've reached the deadline.
        break;
      }
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      
      if (typeof continuationCallback === 'function') {
        // 如果返回了继续回调，说明任务未完成
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;  // 还有更多工作
      } else {
        // 任务完成，从堆中移除
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    }
    currentTask = peek(taskQueue);  // 获取下一个任务
  }
  
  // 返回是否还有任务
  return currentTask !== null;
}
```

---

### 5. 双向链表（Effect 链表）

**应用场景**：收集 useEffect、useLayoutEffect 等副作用

**源码路径**：`packages/react-reconciler/src/ReactFiberHooks.js`

**结构**：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.js
type Effect = {
  tag: EffectTag; // 副作用类型
  create: () => void; // 创建函数
  destroy: (() => void) | void; // 销毁函数
  deps: Array<any> | null; // 依赖数组
  next: Effect; // 下一个 effect（形成环）
};

type Fiber = {
  // ...
  updateQueue: {
    lastEffect: Effect | null; // 指向最后一个 effect
  };
};
```

**收集和执行**：

**源码路径**：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js
// 收集 effect（添加到环形链表）
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };

  const componentUpdateQueue = currentlyRenderingFiber.updateQueue;

  if (componentUpdateQueue === null) {
    // 第一个 effect
    componentUpdateQueue = { lastEffect: null };
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    effect.next = effect; // 指向自己
    componentUpdateQueue.lastEffect = effect;
  } else {
    // 添加到环形链表
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }

  return effect;
}

// 执行所有 effect
function commitHookEffectList(tag, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;

    do {
      if ((effect.tag & tag) === tag) {
        // 先执行销毁函数
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          destroy();
        }

        // 再执行创建函数
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

---

## 设计模式篇

### 1. 双缓存模式（Double Buffering）

**核心思想**：维护两棵 Fiber 树交替工作

**源码路径**：`packages/react-reconciler/src/ReactFiber.js`

```javascript
// packages/react-reconciler/src/ReactFiber.js
// 当前显示的树
let current = {
  type: "div",
  child: null,
  sibling: null,
  alternate: null, // 指向 workInProgress
};

// 正在构建的树
let workInProgress = {
  type: "div",
  child: null,
  sibling: null,
  alternate: current, // 指向 current
};

// 渲染完成后交换
function commitRoot() {
  // 完成构建，交换指针
  root.current = workInProgress;

  // 下次更新时，再次交换角色
  // 之前的 current 变成新的 workInProgress
}
```

**优势**：

- 可以随时中断和恢复（在 workInProgress 上工作）
- 出错时可以回滚（保留 current 树）
- 避免频繁创建销毁对象（两棵树复用）

---

### 2. 状态机模式（State Machine）

**应用**：Fiber 的工作状态管理

**源码路径**：`packages/react-reconciler/src/ReactFiberFlags.js` 和 `ReactFiberBeginWork.js`

```javascript
// packages/react-reconciler/src/ReactFiberFlags.js
// Fiber 的工作状态
const FiberWorkTag = {
  NoWork: 0,
  PerformedWork: 1,
  Placement: 2, // 插入
  Update: 4, // 更新
  Deletion: 8, // 删除
  // ...
};

// 状态转换
function beginWork(fiber) {
  switch (fiber.tag) {
    case FunctionComponent:
      return updateFunctionComponent(fiber);
    case ClassComponent:
      return updateClassComponent(fiber);
    case HostComponent:
      return updateHostComponent(fiber);
    // 每种类型有不同的处理逻辑
  }
}

// 使用位运算标记多个状态
fiber.flags = Placement | Update; // 同时标记插入和更新

// 检查状态
if (fiber.flags & Update) {
  // 需要更新
}
```

---

### 3. 策略模式（Strategy Pattern）

**应用**：不同优先级的调度策略

**源码路径**：`packages/scheduler/src/forks/Scheduler.js`

```javascript
// packages/scheduler/src/forks/Scheduler.js
// 定义不同的调度策略
const SchedulerPriority = {
  ImmediatePriority: 1, // 立即执行
  UserBlockingPriority: 2, // 用户交互
  NormalPriority: 3, // 正常优先级
  LowPriority: 4, // 低优先级
  IdlePriority: 5, // 空闲时执行
};

// 不同优先级对应不同的超时时间
const timeoutMap = {
  [ImmediatePriority]: -1, // 立即
  [UserBlockingPriority]: 250, // 250ms
  [NormalPriority]: 5000, // 5s
  [LowPriority]: 10000, // 10s
  [IdlePriority]: maxSigned31BitInt, // 最大值
};

// 根据优先级选择策略
function scheduleCallback(priorityLevel, callback) {
  const timeout = timeoutMap[priorityLevel];
  const expirationTime = currentTime + timeout;

  const newTask = {
    callback,
    priorityLevel,
    expirationTime,
  };

  // 插入任务队列
  push(taskQueue, newTask);
}
```

---

### 4. 观察者模式（Publisher-Subscriber）

**应用**：事件系统、状态订阅

**源码路径**：`packages/react-dom/src/events/EventRegistry.js`

```javascript
// packages/react-dom/src/events/EventRegistry.js
// React 的事件系统
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  // 订阅事件
  addListener(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(listener);
  }

  // 触发事件
  emit(eventType, ...args) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  // 取消订阅
  removeListener(eventType, listener) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}

// 使用示例
const eventBus = new EventEmitter();

// 组件订阅状态变化
eventBus.addListener("stateChange", (newState) => {
  console.log("State changed:", newState);
});

// 触发更新
function setState(newState) {
  state = newState;
  eventBus.emit("stateChange", newState);
}
```

---

### 5. 工厂模式（Factory Pattern）

**应用**：创建不同类型的 Fiber 节点

**源码路径**：`packages/react-reconciler/src/ReactFiber.js`

```javascript
// packages/react-reconciler/src/ReactFiber.js
// Fiber 工厂函数
function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}

// 根据不同的元素类型创建对应的 Fiber
function createFiberFromElement(element, mode) {
  const type = element.type;

  if (typeof type === "string") {
    // 原生 DOM 元素
    return createFiberFromHostComponent(element, mode);
  }

  if (typeof type === "function") {
    // 函数组件或类组件
    if (type.prototype && type.prototype.isReactComponent) {
      return createFiberFromClassComponent(element, mode);
    } else {
      return createFiberFromFunctionComponent(element, mode);
    }
  }

  // Fragment、Suspense 等
  return createFiberFromSpecialComponent(element, mode);
}
```

---

### 6. 责任链模式（Chain of Responsibility）

**应用**：事件冒泡、错误边界

**源码路径**：`packages/react-dom/src/events/DOMPluginEventSystem.js` 和 `ReactFiberWorkLoop.js`

```javascript
// packages/react-dom/src/events/DOMPluginEventSystem.js
// 事件冒泡的责任链
function dispatchEvent(event, fiber) {
  const path = [];

  // 1. 收集从目标到根的路径
  let node = fiber;
  while (node) {
    path.push(node);
    node = node.return;
  }

  // 2. 捕获阶段（从根到目标）
  for (let i = path.length - 1; i >= 0; i--) {
    if (event.isPropagationStopped()) break;
    executeListener(path[i], event, true); // 捕获
  }

  // 3. 冒泡阶段（从目标到根）
  for (let i = 0; i < path.length; i++) {
    if (event.isPropagationStopped()) break;
    executeListener(path[i], event, false); // 冒泡
  }
}

// 错误边界的责任链
function handleError(error, fiber) {
  let node = fiber;

  // 向上查找错误边界
  while (node) {
    if (node.tag === ClassComponent) {
      const instance = node.stateNode;
      if (typeof instance.componentDidCatch === "function") {
        // 找到错误边界，处理错误
        instance.componentDidCatch(error);
        return;
      }
    }
    node = node.return; // 继续向上查找
  }

  // 没有错误边界，抛出到全局
  throw error;
}
```

---

### 7. 享元模式（Flyweight Pattern）

**应用**：复用 Fiber 节点

**源码路径**：`packages/react-reconciler/src/ReactFiber.js`

```javascript
// packages/react-reconciler/src/ReactFiber.js
// Fiber 对象池
const fiberPool = [];

// 创建或复用 Fiber
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // 没有可复用的，从对象池获取或创建新的
    workInProgress =
      fiberPool.pop() ||
      createFiber(current.tag, pendingProps, current.key, current.mode);

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用现有的 Fiber，只更新必要属性
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  // 复制其他属性
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  // ...

  return workInProgress;
}

// 回收 Fiber 到对象池
function recycleFiber(fiber) {
  // 清空引用
  fiber.child = null;
  fiber.sibling = null;
  fiber.return = null;
  // ...

  fiberPool.push(fiber);
}
```

---

## 巧妙技巧篇

### 1. 时间切片（Time Slicing）

**核心**：利用 `MessageChannel` 或 `requestIdleCallback` 实现

**源码路径**：`packages/scheduler/src/forks/Scheduler.js`

```javascript
// packages/scheduler/src/forks/Scheduler.js
// React 使用 MessageChannel 实现时间切片

// 选择调度方式 (516-543行)
let schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === 'function') {
  // Node.js and old IE.
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
} else if (typeof MessageChannel !== 'undefined') {
  // DOM and Worker environments.
  // We prefer MessageChannel because of the 4ms setTimeout clamping.
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;  // 接收消息，执行任务
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);  // 触发宏任务
  };
} else {
  // Fallback to setTimeout
  schedulePerformWorkUntilDeadline = () => {
    localSetTimeout(performWorkUntilDeadline, 0);
  };
}

// 执行工作直到截止时间
// 注意：实际源码中的实现更复杂，这里简化展示核心逻辑
function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    const hasTimeRemaining = true;

    try {
      // 执行任务，返回是否还有剩余工作
      const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);

      if (hasMoreWork) {
        // 还有工作，继续调度
        schedulePerformWorkUntilDeadline();
      } else {
        isHostCallbackScheduled = false;
        scheduledHostCallback = null;
      }
    } catch (error) {
      // 重新调度并抛出错误
      schedulePerformWorkUntilDeadline();
      throw error;
    }
  } else {
    isHostCallbackScheduled = false;
  }
  needsPaint = false;
}
```

// 工作循环（可中断）
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;
  let currentTask = peek(taskQueue);

  while (currentTask !== null) {
    // 关键：检查是否超时
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // 时间用完，让出控制权
      break;
    }

    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);

      if (typeof continuationCallback === "function") {
        // 任务未完成，保存继续回调
        currentTask.callback = continuationCallback;
      } else {
        // 任务完成，移除
        pop(taskQueue);
      }
    }

    currentTask = peek(taskQueue);
    currentTime = performance.now();
  }

  // 返回是否还有任务
  return currentTask !== null;
}

// 判断是否应该让出控制权
function shouldYieldToHost() {
  const currentTime = performance.now();
  return currentTime >= deadline;
}
```

**为什么用 MessageChannel？**

- `setTimeout(fn, 0)` 有 4ms 的延迟
- `MessageChannel` 是真正的宏任务，没有延迟
- 比 `requestIdleCallback` 兼容性更好

---

### 2. 批量更新（Batching）

**自动批处理**：

**源码路径**：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.js (407-411行)
// 执行上下文标志位
const NoContext = /*             */ 0b000;
const BatchedContext = /*        */ 0b001;
const RenderContext = /*         */ 0b010;
const CommitContext = /*         */ 0b100;

// packages/react-reconciler/src/ReactFiberWorkLoop.js (423行)
let executionContext: ExecutionContext = NoContext;

// 批处理更新函数 (1763-1787行)
export function batchedUpdates<A, R>(fn: A => R, a: A): R {
  if (disableLegacyMode) {
    // batchedUpdates is a no-op now in concurrent mode
    return fn(a);
  } else {
    const prevExecutionContext = executionContext;
    executionContext |= BatchedContext;  // 设置批处理标记
    
    try {
      return fn(a);
    } finally {
      executionContext = prevExecutionContext;
      // If there were legacy sync updates, flush them at the end of the outer
      // most batchedUpdates-like method.
      if (
        executionContext === NoContext &&
        !(__DEV__ && ReactSharedInternals.isBatchingLegacy)
      ) {
        resetRenderTimer();
        flushSyncWorkOnLegacyRootsOnly();
      }
    }
  }
}

// setState 检查是否在批处理中
function dispatchAction(fiber, queue, action) {
  const update = {
    action,
    next: null,
  };

  // 添加到队列
  enqueueUpdate(fiber, queue, update);

  // 关键：检查执行上下文
  if ((executionContext & BatchedContext) !== NoContext) {
    // 在批处理中，不立即调度
    return;
  }

  // 不在批处理中，立即调度更新
  scheduleUpdateOnFiber(fiber);
}

// 使用示例
function handleClick() {
  // React 事件处理器自动包裹在 batchedUpdates 中
  setState1(1); // 不会立即更新
  setState2(2); // 不会立即更新
  setState3(3); // 不会立即更新
  // 事件处理结束后，一次性更新
}
```

**React 18 的自动批处理**：

```javascript
// 创建根时启用并发模式
const root = ReactDOM.createRoot(container);

// 在并发模式下，所有更新都是批处理
setTimeout(() => {
  setState1(1); // 批处理
  setState2(2); // 批处理
}, 1000);

fetch("/api").then(() => {
  setState1(1); // 批处理
  setState2(2); // 批处理
});
```

---

### 3. 对象池技术

**复用对象，减少 GC 压力**：

**源码路径**：`packages/react-reconciler/src/ReactUpdateQueue.js` 和 `ReactFiber.js`

```javascript
// packages/react-reconciler/src/ReactUpdateQueue.js
// 更新对象池
const updatePool = [];
const POOL_SIZE = 10;

// 创建或复用更新对象
function createUpdate(expirationTime, action) {
  let update = updatePool.pop();

  if (update === undefined) {
    update = {
      expirationTime: 0,
      action: null,
      next: null,
    };
  }

  update.expirationTime = expirationTime;
  update.action = action;
  update.next = null;

  return update;
}

// 回收更新对象
function releaseUpdate(update) {
  if (updatePool.length < POOL_SIZE) {
    update.expirationTime = 0;
    update.action = null;
    update.next = null;
    updatePool.push(update);
  }
}

// Fiber 对象池（前面提到的）
const fiberPool = [];

function createFiberFromPool() {
  return fiberPool.pop() || new FiberNode();
}

function releaseFiberToPool(fiber) {
  // 清空所有引用
  fiber.return = null;
  fiber.child = null;
  fiber.sibling = null;
  fiber.alternate = null;
  // ...

  fiberPool.push(fiber);
}
```

---

### 4. 位运算技巧集合

**源码路径**：`packages/react-reconciler/src/ReactFiberLane.js` 和 `ReactFiberFlags.js`

#### 4.1 检查是否包含某个标志位

```javascript
// packages/react-reconciler/src/ReactFiberFlags.js
const Update = 0b0100;
const Placement = 0b0010;
const Deletion = 0b1000;

let flags = Update | Placement; // 0b0110

// 检查是否包含 Update
if (flags & Update) {
  console.log("包含 Update"); // ✓
}

// 检查是否包含 Deletion
if (flags & Deletion) {
  console.log("包含 Deletion"); // ✗
}
```

#### 4.2 快速计算父节点索引

```javascript
// 在小顶堆中
const parentIndex = (index - 1) >>> 1; // 无符号右移

// 为什么用 >>> 而不是 >> ？
// >>> 无符号右移，结果始终是正数
// >> 有符号右移，负数会保持符号位
```

#### 4.3 判断是否是 2 的幂次

```javascript
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

// 原理：
// 8  = 0b1000
// 7  = 0b0111
// &  = 0b0000 = 0

// 非 2 的幂次：
// 6  = 0b0110
// 5  = 0b0101
// &  = 0b0100 ≠ 0
```

#### 4.4 获取最右边的 1（最高优先级）

```javascript
function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

// 原理（补码）：
// lanes  = 0b0101000  (正数)
// -lanes = 0b1011000  (取反 + 1)
// &      = 0b0001000  (只保留最右边的 1)
```

#### 4.5 移除最右边的 1

```javascript
function removeHighestPriorityLane(lanes) {
  return lanes & (lanes - 1);
}

// 原理：
// lanes    = 0b0101000
// lanes-1  = 0b0100111
// &        = 0b0100000  (移除了最右边的 1)
```

#### 4.6 计算优先级位数（有多少个任务）

```javascript
function countLanes(lanes) {
  let count = 0;
  while (lanes) {
    count++;
    lanes &= lanes - 1; // 每次移除一个 1
  }
  return count;
}

// 或使用内置方法
function countLanesBuiltin(lanes) {
  return lanes.toString(2).replace(/0/g, "").length;
}
```

---

### 5. 双指针技巧（Diff 算法）

**源码路径**：`packages/react-reconciler/src/ReactChildFiber.js`

```javascript
// packages/react-reconciler/src/ReactChildFiber.js (1126-1273行)
// React 的 Diff 算法 - 协调子节点数组
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>,
  lanes: Lanes,
): Fiber | null {
  // This algorithm can't optimize by searching from both ends since we
  // don't have backpointers on fibers. I'm trying to see how far we can get
  // with that model. If it ends up not being worth the tradeoffs, we can
  // add it later.

  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;
  
  // 第一轮：从左向右，处理相同位置的更新节点
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    
    // 尝试更新节点（key 相同才复用）
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes,
    );
    
    if (newFiber === null) {
      // key 不匹配，停止第一轮遍历
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    
    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        // We matched the slot, but we didn't reuse the existing fiber, so we
        // need to delete the existing child.
        deleteChild(returnFiber, oldFiber);
      }
    }
    
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  // 第二轮：处理剩余节点
  if (newIdx === newChildren.length) {
    // 新节点遍历完，删除剩余旧节点
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  if (oldFiber === null) {
    // 旧节点遍历完，插入剩余新节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // 第三轮：使用 Map 处理乱序（既有旧节点也有新节点）
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes,
    );
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          // 复用了旧节点，从 Map 中删除
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key,
          );
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }

  if (shouldTrackSideEffects) {
    // 删除未匹配的旧节点
    existingChildren.forEach(child => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}
```

---

### 6. 惰性初始化

**源码路径**：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js
// useState 的惰性初始化
function useState(initialState) {
  return useReducer(
    basicStateReducer,
    initialState,
    undefined // 没有初始化函数
  );
}

// 可以传入函数，只在首次渲染时执行
function Component() {
  const [state, setState] = useState(() => {
    // 复杂计算只执行一次
    return expensiveComputation();
  });
}

// useReducer 的惰性初始化
function useReducer(reducer, initialArg, init) {
  const hook = updateWorkInProgressHook();

  if (hook.memoizedState === null) {
    // 首次渲染
    let initialState;
    if (init !== undefined) {
      // 有初始化函数，调用它
      initialState = init(initialArg);
    } else {
      initialState = initialArg;
    }
    hook.memoizedState = initialState;
  }

  return [hook.memoizedState, dispatch];
}
```

---

### 7. 闭包陷阱的解决

**源码路径**：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
// 问题：闭包捕获旧值
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 始终是 0（闭包陷阱）
      setCount(count + 1); // 也是错的
    }, 1000);

    return () => clearInterval(timer);
  }, []); // 空依赖，只执行一次

  return <div>{count}</div>;
}

// 解决方案 1：使用函数式更新
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1); // ✓ 获取最新值
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}

// 解决方案 2：使用 ref
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  useEffect(() => {
    countRef.current = count; // 始终更新
  });

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(countRef.current); // ✓ 始终是最新值
      setCount(countRef.current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}

// React 内部实现（函数式更新）
function dispatchAction(fiber, queue, action) {
  const update = {
    action,
    next: null,
  };

  enqueueUpdate(queue, update);
  scheduleUpdateOnFiber(fiber);
}

function updateReducer(reducer, initialArg, init) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  let baseState = hook.baseState;
  const pending = queue.pending;

  if (pending !== null) {
    let update = pending.next;
    do {
      const action = update.action;

      // 关键：如果 action 是函数，传入当前状态
      if (typeof action === "function") {
        baseState = action(baseState); // 获取最新值
      } else {
        baseState = action;
      }

      update = update.next;
    } while (update !== pending.next);
  }

  hook.memoizedState = baseState;
  return [baseState, dispatch];
}
```

---

### 8. 记忆化（Memoization）技巧

**源码路径**：`packages/shared/shallowEqual.js` 和 `ReactFiberHooks.js`

#### 8.1 浅比较优化

```javascript
// packages/shared/shallowEqual.js
// React 的浅比较实现
function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) {
    return true; // 完全相同
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false; // 不是对象
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false; // 键数量不同
  }

  // 检查每个键的值
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!objB.hasOwnProperty(key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}

// useMemo 的实现
function useMemo(create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      // 浅比较依赖数组
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0]; // 返回缓存值
      }
    }
  }

  const nextValue = create(); // 重新计算
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

// 依赖数组比较
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return false;

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
```

#### 8.2 结构共享（Structural Sharing）

**源码路径**：`packages/react-reconciler/src/ReactFiberBeginWork.js`

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.js
// Bailout 优化：如果 props 和 state 都没变，跳过渲染
function bailoutOnAlreadyFinishedWork(current, workInProgress) {
  // 1. 检查 props 是否变化
  const oldProps = current.memoizedProps;
  const newProps = workInProgress.pendingProps;

  if (oldProps !== newProps) {
    return null; // props 变了，需要渲染
  }

  // 2. 检查 context 是否变化
  if (!checkScheduledUpdateOrContext(current, workInProgress)) {
    // 3. 检查子节点是否有更新
    if ((workInProgress.childLanes & renderLanes) === NoLanes) {
      // 完全没有更新，复用整棵子树
      return bailoutAndReuseSubtree(current, workInProgress);
    }
  }

  return null;
}

// 复用子树
function bailoutAndReuseSubtree(current, workInProgress) {
  // 直接复用 current 的子节点
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}
```

---

### 9. Context 优化技巧

**源码路径**：`packages/react-reconciler/src/ReactFiberNewContext.js`

```javascript
// packages/react-reconciler/src/ReactFiberNewContext.js
// Context 的按需订阅机制
function readContext(context) {
  const value = context._currentValue;

  // 记录当前 Fiber 依赖了这个 Context
  const contextItem = {
    context,
    observedBits: 0b11111111111111111111111111111111, // 默认订阅所有
    next: null,
  };

  if (lastContextDependency === null) {
    lastContextDependency = contextItem;
    currentlyRenderingFiber.dependencies = {
      lanes: NoLanes,
      firstContext: contextItem,
    };
  } else {
    lastContextDependency = lastContextDependency.next = contextItem;
  }

  return value;
}

// Context 变化时，只更新订阅的组件
function propagateContextChange(workInProgress, context, changedBits) {
  let fiber = workInProgress.child;

  while (fiber !== null) {
    let nextFiber;

    // 检查这个 fiber 是否依赖了 context
    const dependencies = fiber.dependencies;
    if (dependencies !== null) {
      nextFiber = fiber.child;

      let dependency = dependencies.firstContext;
      while (dependency !== null) {
        // 找到匹配的 context
        if (
          dependency.context === context &&
          (dependency.observedBits & changedBits) !== 0
        ) {
          // 标记需要更新
          scheduleWorkOnFiber(fiber);
        }
        dependency = dependency.next;
      }
    } else {
      nextFiber = fiber.child;
    }

    fiber = nextFiber;
  }
}

// 使用 observedBits 优化（React 18 已移除，但思想值得学习）
const MyContext = React.createContext(
  { count: 0, name: "foo" },
  (prev, next) => {
    // 只有 count 变化时才通知订阅者
    return prev.count === next.count ? 0 : 0b01;
  }
);
```

---

### 10. 异步渲染的 Tearing 问题解决

**源码路径**：`packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js`

```javascript
// packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js
// 问题：外部状态在渲染过程中变化
let externalState = { count: 0 };

function Component() {
  const value = externalState.count; // 读取外部状态
  return <div>{value}</div>;
}

// 在渲染过程中，外部状态变化了
externalState.count = 1;
// 导致 UI 不一致（tearing）

// React 18 的解决方案：useSyncExternalStore
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  const value = getSnapshot();
  const [{ inst }, forceUpdate] = useState({ inst: { value, getSnapshot } });

  // 在布局效果中检查快照是否变化
  useLayoutEffect(() => {
    inst.value = value;
    inst.getSnapshot = getSnapshot;

    // 检查是否在渲染期间变化了
    if (checkIfSnapshotChanged(inst)) {
      forceUpdate({ inst }); // 强制重新渲染
    }
  }, [subscribe, value, getSnapshot]);

  // 订阅外部状态
  useEffect(() => {
    if (checkIfSnapshotChanged(inst)) {
      forceUpdate({ inst });
    }

    const handleStoreChange = () => {
      if (checkIfSnapshotChanged(inst)) {
        forceUpdate({ inst });
      }
    };

    return subscribe(handleStoreChange);
  }, [subscribe]);

  return value;
}

// 检查快照是否变化
function checkIfSnapshotChanged(inst) {
  const latestGetSnapshot = inst.getSnapshot;
  const prevValue = inst.value;

  try {
    const nextValue = latestGetSnapshot();
    return !Object.is(prevValue, nextValue);
  } catch (error) {
    return true;
  }
}
```

---

## 综合应用案例

### 案例 1：优先级调度的完整流程

**涉及文件**：

- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberLane.js`
- `packages/scheduler/src/forks/Scheduler.js`

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.js
// 1. 用户点击按钮（高优先级）
function handleClick() {
  // 创建高优先级更新
  const lane = SyncLane; // 0b00001
  const update = createUpdate(lane);
  enqueueUpdate(fiber, update);

  // 调度更新
  scheduleUpdateOnFiber(fiber, lane);
}

// 2. 调度器接收任务
function scheduleUpdateOnFiber(fiber, lane) {
  // 合并优先级
  fiber.lanes = mergeLanes(fiber.lanes, lane);

  // 向上传播到根
  let node = fiber;
  while (node !== null) {
    node.childLanes = mergeLanes(node.childLanes, lane);
    node = node.return;
  }

  // 调度根节点
  ensureRootIsScheduled(root);
}

// 3. 确保根节点被调度
function ensureRootIsScheduled(root) {
  // 获取最高优先级
  const nextLanes = getNextLanes(root, NoLanes);
  const newCallbackPriority = getHighestPriorityLane(nextLanes);

  // 检查是否有正在进行的调度
  const existingCallbackPriority = root.callbackPriority;

  if (existingCallbackPriority === newCallbackPriority) {
    return; // 优先级相同，不需要重新调度
  }

  // 取消旧的调度
  if (existingCallbackNode !== null) {
    cancelCallback(existingCallbackNode);
  }

  // 创建新的调度
  let newCallbackNode;
  if (newCallbackPriority === SyncLane) {
    // 同步优先级，立即执行
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    newCallbackNode = null;
  } else {
    // 异步优先级，加入调度队列
    const schedulerPriorityLevel =
      lanePriorityToSchedulerPriority(newCallbackPriority);
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}

// 4. Scheduler 执行任务
function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const timeout = timeoutForPriorityLevel(priorityLevel);
  const expirationTime = currentTime + timeout;

  const newTask = {
    callback,
    priorityLevel,
    expirationTime,
    sortIndex: expirationTime,
  };

  // 插入小顶堆
  push(taskQueue, newTask);

  // 请求调度
  requestHostCallback(flushWork);

  return newTask;
}

// 5. 执行工作循环
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

// 6. 检查是否应该让出
function shouldYield() {
  const currentTime = getCurrentTime();
  return currentTime >= deadline; // 超过 5ms，让出控制权
}
```

---

### 案例 2：Hooks 链表 + 更新队列的协同工作

**涉及文件**：

- `packages/react-reconciler/src/ReactFiberHooks.js`
- `packages/react/src/ReactHooks.js`

```javascript
// packages/react-reconciler/src/ReactFiberHooks.js
// 完整的 useState 实现
function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

// Mount 阶段
function mountState(initialState) {
  // 1. 创建 Hook 对象
  const hook = mountWorkInProgressHook();

  // 2. 初始化状态
  if (typeof initialState === "function") {
    initialState = initialState();
  }
  hook.memoizedState = initialState;
  hook.baseState = initialState;

  // 3. 创建更新队列
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;

  // 4. 创建 dispatch 函数
  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));

  return [hook.memoizedState, dispatch];
}

// 创建 Hook 并加入链表
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // 第一个 Hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 加入链表尾部
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

// Update 阶段
function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function updateReducer(reducer, initialArg, init) {
  // 1. 获取对应的 Hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  // 2. 处理更新队列（环形链表）
  const pending = queue.pending;

  if (pending !== null) {
    // 3. 遍历环形链表，应用所有更新
    const first = pending.next;
    let newState = hook.baseState;
    let update = first;

    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== first);

    // 4. 清空队列
    queue.pending = null;

    // 5. 保存新状态
    hook.memoizedState = newState;
    hook.baseState = newState;
  }

  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

// 调用 setState
function dispatchAction(fiber, queue, action) {
  // 1. 创建更新对象
  const update = {
    action,
    next: null,
  };

  // 2. 加入环形链表
  const pending = queue.pending;
  if (pending === null) {
    update.next = update; // 指向自己
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  // 3. 调度更新
  const lane = requestUpdateLane(fiber);
  scheduleUpdateOnFiber(fiber, lane);
}
```

---

## 总结与思考

### 核心思想提炼

1. **数据结构即算法**

   - Fiber 链表 → 可中断遍历
   - 环形链表 → O(1) 插入和遍历
   - 小顶堆 → 自动优先级排序
   - 位运算 → 极致性能优化

2. **设计模式的实战应用**

   - 双缓存 → 可回滚的更新
   - 对象池 → 减少 GC 压力
   - 责任链 → 事件冒泡和错误边界
   - 策略模式 → 灵活的调度策略

3. **性能优化的艺术**
   - 时间切片 → 保持 UI 流畅
   - 批处理 → 减少渲染次数
   - Bailout → 跳过不必要的渲染
   - 结构共享 → 复用已有结果

### 学习建议

1. **从简单的数据结构开始**：先理解链表、队列、堆的基本操作
2. **理解为什么这样设计**：每个设计都是为了解决特定问题
3. **动手实现**：自己实现一遍才能真正理解
4. **关注边界情况**：React 源码处理了很多边界情况

### 延伸阅读

- Fiber 架构详解（01-Fiber 架构详解.md）
- 调度器与时间切片（03-调度器与时间切片详解.md）
- Diff 算法原理（04-Diff 算法原理详解.md）
- Lane 模型详解（14-Lane 模型详解.md）

---

## 📑 快速索引：源码路径速查表

| 知识点                   | 主要源码文件                                                             |
| ------------------------ | ------------------------------------------------------------------------ |
| **Fiber 结构**           | `packages/react-reconciler/src/ReactInternalTypes.js`                    |
| **Fiber 遍历**           | `packages/react-reconciler/src/ReactFiberWorkLoop.js`                    |
| **Hooks 实现**           | `packages/react-reconciler/src/ReactFiberHooks.js`                       |
| **Lane 优先级**          | `packages/react-reconciler/src/ReactFiberLane.js`                        |
| **小顶堆**               | `packages/scheduler/src/SchedulerMinHeap.js`                             |
| **调度器**               | `packages/scheduler/src/forks/Scheduler.js`                              |
| **Diff 算法**            | `packages/react-reconciler/src/ReactChildFiber.js`                       |
| **双缓存**               | `packages/react-reconciler/src/ReactFiber.js`                            |
| **事件系统**             | `packages/react-dom/src/events/DOMPluginEventSystem.js`                  |
| **Context**              | `packages/react-reconciler/src/ReactFiberNewContext.js`                  |
| **Bailout 优化**         | `packages/react-reconciler/src/ReactFiberBeginWork.js`                   |
| **浅比较**               | `packages/shared/shallowEqual.js`                                        |
| **批处理**               | `packages/react-reconciler/src/ReactFiberWorkLoop.js`                    |
| **useSyncExternalStore** | `packages/use-sync-external-store/src/useSyncExternalStoreShimClient.js` |

### 核心文件说明

**1. ReactFiberWorkLoop.js** - 最核心的文件之一

- 工作循环逻辑（workLoop）
- 调度入口（scheduleUpdateOnFiber）
- 批处理机制（batchedUpdates）
- 执行上下文管理

**2. ReactFiberHooks.js** - Hooks 完整实现

- 所有 Hooks 的 mount 和 update 逻辑
- Hook 链表管理
- 更新队列处理
- 闭包陷阱的解决方案

**3. ReactFiberLane.js** - 优先级系统

- Lane 模型定义
- 位运算工具函数
- 优先级计算和合并

**4. ReactChildFiber.js** - Diff 算法

- 单节点 Diff
- 多节点 Diff（双指针优化）
- 节点复用逻辑

**5. Scheduler.js** - 时间切片

- MessageChannel 实现
- 任务队列管理
- shouldYield 判断

### 学习路径推荐

```
初级 → 中级 → 高级
  │      │      │
  │      │      └─→ Lane 模型、并发渲染
  │      └─→ Hooks 实现、Diff 算法、批处理
  └─→ Fiber 结构、工作循环、调度器
```

1. **第一阶段**：理解 Fiber 数据结构和遍历算法
2. **第二阶段**：学习 Hooks、Diff、批处理等核心机制
3. **第三阶段**：深入优先级模型、并发特性

### 实用工具

```bash
# 在 React 源码目录中快速查找
grep -r "function workLoop" packages/react-reconciler/src/

# 统计某个文件的行数
wc -l packages/react-reconciler/src/ReactFiberWorkLoop.js

# 查看某个函数的完整实现
sed -n '/function scheduleUpdateOnFiber/,/^}/p' packages/react-reconciler/src/ReactFiberWorkLoop.js
```

---

**持续更新中，欢迎补充！** 🚀

> 💡 **提示**：建议配合 VS Code 的搜索功能（Cmd/Ctrl + Shift + F）在源码中快速定位函数和变量。
