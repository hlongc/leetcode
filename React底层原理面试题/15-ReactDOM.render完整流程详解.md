# 15 - ReactDOM.render完整流程详解

> **问题**: 从调用ReactDOM.render()到页面渲染，整个流程经历了哪些阶段？每个阶段的主要工作是什么？

---

## 一、完整流程概览

从用户调用`ReactDOM.createRoot().render()`到页面显示，React经历了**7个主要阶段**：

```
用户代码：
const root = ReactDOM.createRoot(container);
root.render(<App />);

完整流程：
┌─────────────────────────────────────────┐
│ 阶段1：创建FiberRoot和rootFiber         │
│ - createFiberRoot()                     │
│ - createHostRootFiber()                 │
│ - 建立双向引用                           │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 阶段2：创建Update对象                   │
│ - createUpdate(lane)                    │
│ - update.payload = {element}            │
│ - enqueueUpdate(rootFiber, update)      │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 阶段3：调度更新                         │
│ - scheduleUpdateOnFiber()               │
│ - markRootUpdated()                     │
│ - ensureRootIsScheduled()               │
│ - 调度微任务或Scheduler任务             │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 阶段4：render阶段（构建workInProgress树）│
│ - prepareFreshStack()                   │
│ - workLoopSync/workLoopConcurrent()     │
│ - beginWork（向下遍历，创建Fiber）       │
│ - completeWork（向上回溯，创建DOM）      │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 阶段5：commit阶段（提交到DOM）          │
│ - before mutation（读取变更前的DOM）    │
│ - mutation（执行DOM操作）               │
│ - 切换current树                         │
│ - layout（执行layout effects）          │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 阶段6：passive effects（异步）          │
│ - 调度微任务                             │
│ - flushPassiveEffects()                 │
│ - 执行useEffect                         │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 阶段7：用户看到页面                     │
│ - DOM已更新                             │
│ - 浏览器完成绘制                         │
└─────────────────────────────────────────┘
```

---

## 二、阶段1：创建FiberRoot和rootFiber

### createRoot的用户API

源码：`packages/react-dom/src/client/ReactDOMRoot.js`

```javascript
// 用户代码
const root = ReactDOM.createRoot(container, options);
root.render(<App />);

// createRoot实现
export function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  // 1. 参数校验
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  // 2. 处理options
  let isStrictMode = false;
  let identifierPrefix = '';
  let onUncaughtError = defaultOnUncaughtError;
  let onCaughtError = defaultOnCaughtError;
  let onRecoverableError = defaultOnRecoverableError;
  let transitionCallbacks = null;

  if (options != null) {
    if (options.unstable_strictMode === true) {
      isStrictMode = true;
    }
    // ... 其他options处理
  }

  // 3. 创建FiberRoot
  const root = createContainer(
    container,
    ConcurrentRoot,
    null,
    isStrictMode,
    null,
    identifierPrefix,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    null,
    transitionCallbacks,
  );

  // 4. 标记DOM容器
  markContainerAsRoot(root.current, container);
  listenToAllSupportedEvents(container);

  // 5. 返回ReactDOMRoot实例
  return new ReactDOMRoot(root);
}
```

### createFiberRoot的内部实现

源码：`packages/react-reconciler/src/ReactFiberRoot.js`

```javascript
export function createFiberRoot(
  containerInfo: Container,
  tag: RootTag,
  hydrate: boolean,
  initialChildren: ReactNodeList,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  identifierPrefix: string,
  formState: ReactFormState<any, any> | null,
  onUncaughtError: (error: mixed, errorInfo: {+componentStack?: ?string}) => void,
  onCaughtError: (error: mixed, errorInfo: {...}) => void,
  onRecoverableError: (error: mixed, errorInfo: {+componentStack?: ?string}) => void,
  onDefaultTransitionIndicator: () => void | (() => void),
  transitionCallbacks: null | TransitionTracingCallbacks,
): FiberRoot {
  // ========== 1. 创建FiberRootNode ==========
  const root: FiberRoot = new FiberRootNode(
    containerInfo,    // DOM容器（div#root）
    tag,              // ConcurrentRoot
    hydrate,
    identifierPrefix,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    formState,
  );

  // ========== 2. 设置hydration回调 ==========
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  if (enableTransitionTracing) {
    root.transitionCallbacks = transitionCallbacks;
  }

  // ========== 3. 创建HostRoot Fiber ==========
  const uninitializedFiber = createHostRootFiber(tag, isStrictMode);
  
  // ========== 4. 建立循环引用 ==========
  root.current = uninitializedFiber;         // FiberRoot → rootFiber
  uninitializedFiber.stateNode = root;       // rootFiber → FiberRoot

  // ========== 5. 初始化缓存系统 ==========
  const initialCache = createCache();
  retainCache(initialCache);
  root.pooledCache = initialCache;
  retainCache(initialCache);
  
  const initialState: RootState = {
    element: initialChildren,  // null（mount时）
    isDehydrated: hydrate,
    cache: initialCache,
  };
  uninitializedFiber.memoizedState = initialState;

  // ========== 6. 初始化updateQueue ==========
  initializeUpdateQueue(uninitializedFiber);

  return root;
}
```

**FiberRootNode的数据结构**：

```javascript
function FiberRootNode(
  containerInfo,  // DOM容器
  tag,           // ConcurrentRoot = 1
  hydrate,
  identifierPrefix,
  onUncaughtError,
  onCaughtError,
  onRecoverableError,
  onDefaultTransitionIndicator,
  formState,
) {
  // ========== 基本信息 ==========
  this.tag = ConcurrentRoot;
  this.containerInfo = containerInfo;  // div#root
  this.pendingChildren = null;
  this.current = null;  // 指向rootFiber

  // ========== 任务调度相关 ==========
  this.pingCache = null;
  this.timeoutHandle = noTimeout;
  this.cancelPendingCommit = null;
  this.callbackNode = null;      // Scheduler的回调节点
  this.callbackPriority = NoLane;

  // ========== 优先级相关 ==========
  this.pendingLanes = NoLanes;      // 等待处理的lanes
  this.suspendedLanes = NoLanes;    // 挂起的lanes
  this.pingedLanes = NoLanes;       // 被ping的lanes
  this.expiredLanes = NoLanes;      // 过期的lanes
  this.warmLanes = NoLanes;         // 预热的lanes
  
  // ========== 过期时间和纠缠 ==========
  this.expirationTimes = createLaneMap(NoTimestamp);  // 每个lane的过期时间
  this.entangledLanes = NoLanes;    // 纠缠的lanes
  this.entanglements = createLaneMap(NoLanes);  // 纠缠映射
  
  // ========== 错误处理 ==========
  this.onUncaughtError = onUncaughtError;
  this.onCaughtError = onCaughtError;
  this.onRecoverableError = onRecoverableError;

  // ========== Transition相关 ==========
  this.incompleteTransitions = new Map();
  
  // ... 更多属性
}
```

**创建后的数据结构**：

```
┌────────────────────────────┐
│      FiberRootNode         │
│                            │
│ containerInfo: div#root    │
│ current: ──────────────┐   │
│ pendingLanes: NoLanes  │   │
│ callbackNode: null     │   │
│ ...                    │   │
└────────────────────────┼───┘
                         │
                         ↓
              ┌──────────────────────┐
              │   rootFiber (current)│
              │                      │
              │ tag: HostRoot (3)    │
              │ stateNode: ─────────►│ FiberRoot
              │ alternate: null      │
              │ child: null          │
              │ memoizedState: {     │
              │   element: null,     │
              │   cache: Cache       │
              │ }                    │
              │ updateQueue: {       │
              │   baseState: {...}   │
              │   shared: {          │
              │     pending: null    │
              │   }                  │
              │ }                    │
              └──────────────────────┘
```

---

## 三、阶段2：创建Update对象并入队

### root.render(<App />)

源码：`packages/react-reconciler/src/ReactFiberReconciler.js`

```javascript
export function updateContainer(
  element: ReactNodeList,  // <App />
  container: OpaqueRoot,   // FiberRoot
  parentComponent: ?component(...props: any),
  callback: ?Function,
): Lane {
  const current = container.current;  // rootFiber
  const lane = requestUpdateLane(current);  // 获取优先级
  
  updateContainerImpl(
    current,
    lane,
    element,
    container,
    parentComponent,
    callback,
  );
  
  return lane;
}

function updateContainerImpl(
  rootFiber: Fiber,
  lane: Lane,
  element: ReactNodeList,  // <App />
  container: OpaqueRoot,
  parentComponent: ?component(...props: any),
  callback: ?Function,
): void {
  // ========== 1. 处理context ==========
  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  // ========== 2. 创建update对象 ==========
  const update = createUpdate(lane);
  
  // Caution: React DevTools依赖这个属性叫"element"
  update.payload = {element};  // 保存<App />

  // ========== 3. 处理callback ==========
  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }

  // ========== 4. 将update加入队列 ==========
  const root = enqueueUpdate(rootFiber, update, lane);
  
  // ========== 5. 调度更新 ==========
  if (root !== null) {
    scheduleUpdateOnFiber(root, rootFiber, lane);
    entangleTransitions(root, rootFiber, lane);
  }
}
```

**Update对象的结构**：

```javascript
// createUpdate返回的Update对象
const update = {
  lane: SyncLane,           // 优先级
  tag: UpdateState,         // 更新类型（0=UpdateState）
  payload: {                // 更新内容
    element: <App />        // React元素
  },
  callback: null,           // render回调
  next: null,               // 下一个update（环形链表）
};
```

**入队过程**：

```javascript
export function enqueueUpdate<State>(
  fiber: Fiber,
  update: Update<State>,
  lane: Lane,
): FiberRoot | null {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return null;  // Fiber已卸载
  }

  const sharedQueue: SharedQueue<State> = updateQueue.shared;
  
  // 将update添加到pending环形链表
  const pending = sharedQueue.pending;
  if (pending === null) {
    // 第一个update，创建环形链表
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;

  return getRootForUpdatedFiber(fiber);
}
```

---

## 四、阶段3：调度更新

### scheduleUpdateOnFiber

源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
) {
  // ========== 1. 标记root上的lanes ==========
  markRootUpdated(root, lane);

  // ========== 2. 无限循环检测 ==========
  if (
    enableInfiniteRenderLoopDetection &&
    (executionContext & RenderContext) !== NoContext &&
    (fiber.mode & ConcurrentMode) === NoMode
  ) {
    // 检测render阶段的无限更新
    if (isRendering && (executionContext & RenderContext) !== NoContext) {
      workInProgressRootDidIncludeRecursiveRenderUpdate = true;
    } else if (executionContext & CommitContext) {
      didIncludeCommitPhaseUpdate = true;
    }
    
    throwIfInfiniteUpdateLoopDetected();
  }

  // ========== 3. 根据lane决定调度方式 ==========
  if (lane === SyncLane) {
    // 同步lane：可能需要立即flush
    if (executionContext === NoContext) {
      // 不在React的执行上下文中，立即flush
      flushSyncWork();
    }
  } else {
    // 异步lane：延迟调度
  }

  // ========== 4. 调度root ==========
  ensureRootIsScheduled(root);
}
```

### ensureRootIsScheduled（已在第13题详细说明）

```javascript
export function ensureRootIsScheduled(root: FiberRoot): void {
  // 添加root到调度队列
  if (root === lastScheduledRoot || root.next !== null) {
    // Fast path：已在队列中
  } else {
    // 添加到队列
    if (lastScheduledRoot === null) {
      firstScheduledRoot = lastScheduledRoot = root;
    } else {
      lastScheduledRoot.next = root;
      lastScheduledRoot = root;
    }
  }

  mightHavePendingSyncWork = true;

  // 调度微任务（React 18的自动批处理）
  ensureScheduleIsScheduled();
}
```

---

## 五、阶段4：render阶段

### 准备工作：prepareFreshStack

```javascript
function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  // ========== 1. 清理上次的render状态 ==========
  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    root.timeoutHandle = noTimeout;
    cancelTimeout(timeoutHandle);
  }
  
  const cancelPendingCommit = root.cancelPendingCommit;
  if (cancelPendingCommit !== null) {
    root.cancelPendingCommit = null;
    cancelPendingCommit();
  }

  // ========== 2. 重置工作栈 ==========
  resetWorkInProgressStack();

  // ========== 3. 设置全局变量 ==========
  workInProgressRoot = root;
  
  // ========== 4. 创建workInProgress rootFiber ==========
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  
  workInProgressRootRenderLanes = lanes;
  workInProgressSuspendedReason = NotSuspended;
  workInProgressThrownValue = null;
  workInProgressRootDidSkipSuspendedSiblings = false;
  workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root, lanes);
  workInProgressRootDidAttachPingListener = false;

  // ... Profiling相关初始化

  return rootWorkInProgress;
}
```

### workLoop：工作循环

```javascript
// 同步工作循环
function workLoopSync() {
  // 不检查shouldYield，一直执行到完成
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// 并发工作循环
function workLoopConcurrent() {
  // 检查shouldYield，可中断
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

// 处理单个工作单元
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;  // current树的对应节点

  // ========== beginWork阶段 ==========
  let next = beginWork(current, unitOfWork, entangledRenderLanes);

  // 保存处理后的props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // ========== 没有子节点，开始completeWork ==========
    completeUnitOfWork(unitOfWork);
  } else {
    // ========== 有子节点，继续向下 ==========
    workInProgress = next;
  }
}
```

### beginWork：创建子Fiber节点

```javascript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // ========== bailout优化检查 ==========
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (oldProps !== newProps || hasLegacyContextChanged()) {
      didReceiveUpdate = true;
    } else {
      // props没变，检查是否可以bailout
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes,
      );
      if (!hasScheduledUpdateOrContext) {
        // 可以bailout
        didReceiveUpdate = false;
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
    }
  }

  // ========== 清空当前节点的lanes ==========
  workInProgress.lanes = NoLanes;

  // ========== 根据tag处理不同类型 ==========
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, ...);
    case ClassComponent:
      return updateClassComponent(current, workInProgress, ...);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    // ... 更多类型
  }
}
```

**updateHostRoot处理根节点**：

```javascript
function updateHostRoot(
  current: null | Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostRootContext(workInProgress);

  if (current === null) {
    throw new Error('Should have a current fiber.');
  }

  const nextProps = workInProgress.pendingProps;
  const prevState: RootState = workInProgress.memoizedState;
  const prevChildren = prevState.element;  // null（首次）
  
  // ========== 克隆updateQueue ==========
  cloneUpdateQueue(current, workInProgress);
  
  // ========== 处理update队列，计算新state ==========
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);

  const nextState: RootState = workInProgress.memoizedState;
  const root: FiberRoot = workInProgress.stateNode;
  
  // ========== 推送各种context ==========
  pushRootTransition(workInProgress, root, renderLanes);
  pushCacheProvider(workInProgress, nextState.cache);
  
  // ========== 获取要渲染的children ==========
  const nextChildren = nextState.element;  // <App />
  
  if (prevChildren === nextChildren) {
    // children没变，bailout
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  // ========== diff children ==========
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  return workInProgress.child;  // 返回App Fiber
}
```

### completeWork：创建DOM节点

```javascript
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostComponent: {
      // DOM节点（div, span等）
      popHostContext(workInProgress);
      const type = workInProgress.type;  // 'div', 'span'

      if (current !== null && workInProgress.stateNode != null) {
        // ========== update阶段 ==========
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          renderLanes,
        );
        
        if (current.ref !== workInProgress.ref) {
          markRef(workInProgress);
        }
      } else {
        // ========== mount阶段 ==========
        
        // 1. 创建DOM节点
        const rootContainerInstance = getRootHostContainer();
        const instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          currentHostContext,
          workInProgress,
        );

        // 2. 将所有子DOM添加到当前DOM
        appendAllChildren(instance, workInProgress, false, false);

        // 3. 保存DOM实例
        workInProgress.stateNode = instance;

        // 4. 设置初始属性（如autoFocus）
        if (
          finalizeInitialChildren(
            instance,
            type,
            newProps,
            currentHostContext,
          )
        ) {
          markUpdate(workInProgress);
        }
      }

      // ========== 收集副作用 ==========
      bubbleProperties(workInProgress);
      
      return null;
    }
    
    case HostText: {
      // 文本节点
      const newText = newProps;
      
      if (current !== null && workInProgress.stateNode != null) {
        // update
        updateHostText(current, workInProgress, oldText, newText);
      } else {
        // mount：创建文本节点
        workInProgress.stateNode = createTextInstance(
          newText,
          rootContainerInstance,
          currentHostContext,
          workInProgress,
        );
      }
      
      bubbleProperties(workInProgress);
      return null;
    }
    
    // ... 其他类型
  }
}
```

---

## 六、阶段5：commit阶段

### commit三个子阶段概览

源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
function commitRoot(
  root: FiberRoot,
  finishedWork: Fiber,
  lanes: Lanes,
  recoverableErrors: null | Array<CapturedValue<mixed>>,
  transitions: Array<Transition> | null,
  didIncludeRenderPhaseUpdate: boolean,
  spawnedLane: Lane,
  updatedLanes: Lanes,
  suspendedRetryLanes: Lanes,
  exitStatus: RootExitStatus,
  suspendedState: null | SuspendedState,
  suspendedCommitReason: null | SuspendedCommitReason,
  completedRenderStartTime: number,
  completedRenderEndTime: number,
) {
  // ========== 准备工作 ==========
  const previousPriority = getCurrentUpdatePriority();
  const prevTransition = ReactSharedInternals.T;

  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    ReactSharedInternals.T = null;
    
    // ========== 执行commit ==========
    commitRootImpl(
      root,
      finishedWork,
      lanes,
      recoverableErrors,
      transitions,
      didIncludeRenderPhaseUpdate,
      renderPriorityLevel,
      spawnedLane,
      updatedLanes,
      suspendedRetryLanes,
      exitStatus,
      suspendedState,
      suspendedCommitReason,
      completedRenderStartTime,
      completedRenderEndTime,
    );
  } finally {
    ReactSharedInternals.T = prevTransition;
    setCurrentUpdatePriority(previousPriority);
  }

  return null;
}
```

### commitRootImpl：commit的核心实现

```javascript
function commitRootImpl(...) {
  // ========== 子阶段1：before mutation ==========
  const subtreeHasBeforeMutationEffects =
    (finishedWork.subtreeFlags & (BeforeMutationMask | MutationMask)) !== NoFlags;
  const rootHasBeforeMutationEffect =
    (finishedWork.flags & (BeforeMutationMask | MutationMask)) !== NoFlags;

  if (subtreeHasBeforeMutationEffects || rootHasBeforeMutationEffect) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    
    try {
      // 执行before mutation effects
      commitBeforeMutationEffects(root, finishedWork, lanes);
    } finally {
      executionContext = prevExecutionContext;
    }
  }

  // ========== 子阶段2：mutation ==========
  const subtreeMutationHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootMutationHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeMutationHasEffects || rootMutationHasEffect) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    
    try {
      // 执行DOM操作
      commitMutationEffects(root, finishedWork, lanes);
      
      // 重置DOM容器（如需要）
      resetAfterCommit(root.containerInfo);
    } finally {
      executionContext = prevExecutionContext;
    }
  }

  // ========== 关键：切换current树 ==========
  // mutation之后，layout之前
  root.current = finishedWork;
  pendingEffectsStatus = PENDING_LAYOUT_PHASE;

  // ========== 子阶段3：layout ==========
  const subtreeHasLayoutEffects =
    (finishedWork.subtreeFlags & LayoutMask) !== NoFlags;
  const rootHasLayoutEffect = (finishedWork.flags & LayoutMask) !== NoFlags;

  if (subtreeHasLayoutEffects || rootHasLayoutEffect) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    
    try {
      // 执行layout effects
      commitLayoutEffects(finishedWork, root, lanes);
    } finally {
      executionContext = prevExecutionContext;
    }
  }

  // ========== 调度passive effects（异步）==========
  const subtreeHasPassiveEffects =
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags;
  const rootHasPassiveEffect = (finishedWork.flags & PassiveMask) !== NoFlags;

  if (subtreeHasPassiveEffects || rootHasPassiveEffect) {
    // 调度异步执行useEffect
    scheduleCallback(NormalSchedulerPriority, () => {
      flushPassiveEffects();
      return null;
    });
  }

  // ========== 清理工作 ==========
  if (root === workInProgressRoot) {
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  }

  // ========== 调度下一个更新 ==========
  ensureRootIsScheduled(root);

  return null;
}
```

---

## 七、完整案例：Counter组件的渲染流程

### 示例代码

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('effect: count =', count);
    return () => console.log('cleanup');
  }, [count]);
  
  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

// 首次渲染
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Counter />);
```

### 完整执行流程（140+步）

```
========== 阶段1：初始化（createRoot）==========

步骤1: ReactDOM.createRoot(container)
  → createRoot(container, undefined)
  
步骤2: createContainer(container, ConcurrentRoot, ...)
  → createFiberRoot(container, ConcurrentRoot, false, null, ...)
  
步骤3: new FiberRootNode(...)
  创建FiberRootNode对象：
  {
    tag: ConcurrentRoot,
    containerInfo: div#root,
    current: null,
    pendingLanes: NoLanes,
    callbackNode: null,
    ...
  }

步骤4: createHostRootFiber(ConcurrentRoot, false)
  → createFiber(HostRoot, null, null, ConcurrentMode)
  创建rootFiber：
  {
    tag: HostRoot,
    mode: ConcurrentMode,
    stateNode: null,
    memoizedState: null,
    updateQueue: null,
    ...
  }

步骤5: 建立双向引用
  root.current = uninitializedFiber
  uninitializedFiber.stateNode = root

步骤6: 初始化Cache和State
  const initialCache = createCache()
  uninitializedFiber.memoizedState = {
    element: null,
    isDehydrated: false,
    cache: initialCache
  }

步骤7: initializeUpdateQueue(uninitializedFiber)
  uninitializedFiber.updateQueue = {
    baseState: { element: null, ... },
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
      lanes: NoLanes
    },
    callbacks: null
  }

步骤8: markContainerAsRoot(rootFiber, container)
  container._reactRootContainer = root

步骤9: listenToAllSupportedEvents(container)
  注册所有事件监听器到container

步骤10: return new ReactDOMRoot(root)

========== 阶段2：render调用 ==========

步骤11: root.render(<Counter />)
  → ReactDOMRoot.prototype.render(children)

步骤12: updateContainer(<Counter />, root, null, undefined)
  const current = root.current  // rootFiber
  
步骤13: requestUpdateLane(current)
  → getCurrentEventPriority()
  → DefaultEventPriority
  → lane = DefaultLane

步骤14: updateContainerImpl(current, DefaultLane, <Counter />, root, ...)

步骤15: createUpdate(DefaultLane)
  update = {
    lane: DefaultLane,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null
  }

步骤16: update.payload = {element: <Counter />}

步骤17: enqueueUpdate(rootFiber, update, DefaultLane)
  → updateQueue.shared.pending = update
  → update.next = update（环形链表）

步骤18: scheduleUpdateOnFiber(root, rootFiber, DefaultLane)
  → markRootUpdated(root, DefaultLane)
    root.pendingLanes |= DefaultLane

步骤19: ensureRootIsScheduled(root)
  → 添加root到firstScheduledRoot
  → ensureScheduleIsScheduled()
    → scheduleImmediateRootScheduleTask()
      → queueMicrotask(processRootScheduleInMicrotask)

========== 微任务执行 ==========

步骤20: processRootScheduleInMicrotask()
  → scheduleTaskForRootDuringMicrotask(root, currentTime)
    → getNextLanes(root, NoLanes) → DefaultLane
    → scheduleSyncCallback(performSyncWorkOnRoot)
  → flushSyncWorkAcrossRoots_impl()

步骤21: performSyncWorkOnRoot(root, DefaultLane)

========== 阶段4：render阶段开始 ==========

步骤22: renderRootSync(root, DefaultLane, true)
  → executionContext |= RenderContext

步骤23: prepareFreshStack(root, DefaultLane)
  → resetWorkInProgressStack()
  → workInProgressRoot = root
  
步骤24: createWorkInProgress(root.current, null)
  创建workInProgress rootFiber（复用alternate或创建新的）
  → workInProgress = wip rootFiber

步骤25: workLoopSync()
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }

步骤26: performUnitOfWork(wip rootFiber)
  const current = wip rootFiber.alternate  // current rootFiber
  
步骤27: beginWork(current rootFiber, wip rootFiber, DefaultLane)
  → tag = HostRoot
  → updateHostRoot(current, wip, DefaultLane)

步骤28: processUpdateQueue(wip rootFiber, ...)
  处理update队列：
  → baseQueue = update（包含<Counter />）
  → newState = { element: <Counter />, cache: ... }
  → wip rootFiber.memoizedState = newState

步骤29: nextChildren = nextState.element  // <Counter />

步骤30: reconcileChildren(current, wip, <Counter />, DefaultLane)
  → reconcileChildFibers(wip, current.child, <Counter />, DefaultLane)
  → current.child = null（首次渲染）
  → reconcileSingleElement(wip, null, <Counter />, DefaultLane)

步骤31: createFiberFromElement(<Counter />, ConcurrentMode, DefaultLane)
  创建Counter Fiber：
  {
    tag: FunctionComponent,
    type: Counter函数,
    pendingProps: {},
    memoizedState: null,
    updateQueue: null,
    ...
  }

步骤32: wip rootFiber.child = Counter Fiber
  → performUnitOfWork返回Counter Fiber

步骤33: workInProgress = Counter Fiber

步骤34: performUnitOfWork(Counter Fiber)

步骤35: beginWork(null, Counter Fiber, DefaultLane)
  → tag = FunctionComponent
  → updateFunctionComponent(...)

步骤36: renderWithHooks(null, Counter Fiber, Counter函数, {}, ...)
  → currentlyRenderingFiber = Counter Fiber
  → ReactSharedInternals.H = HooksDispatcherOnMount

步骤37: 执行Counter函数
  const [count, setCount] = useState(0);
  
步骤38: mountState(0)
  → mountWorkInProgressHook()
    Hook1 = {
      memoizedState: 0,
      queue: {...},
      next: null
    }
  → Counter Fiber.memoizedState = Hook1
  → dispatch = dispatchSetState.bind(null, Counter Fiber, queue)
  → 返回[0, dispatch]

步骤39: useEffect(() => {...}, [count])

步骤40: mountEffect(effect函数, [0])
  → mountEffectImpl(PassiveEffect, HookPassive, effect, [0])
  → mountWorkInProgressHook()
    Hook2 = {
      memoizedState: {
        tag: HookHasEffect | HookPassive,
        create: effect函数,
        deps: [0],
        inst: {destroy: undefined},
        next: effect链表
      },
      next: null
    }
  → Hook1.next = Hook2
  → pushSimpleEffect(...)
  → Counter Fiber.flags |= PassiveEffect
  → Counter Fiber.updateQueue = {
      lastEffect: Effect环形链表
    }

步骤41: Counter函数返回JSX
  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={...}>Increment</button>
    </div>
  )

步骤42: reconcileChildren(null, Counter Fiber, JSX, DefaultLane)
  → reconcileSingleElement(...)
  → createFiberFromElement(<div className="counter">)
  创建div Fiber

步骤43-60: beginWork继续遍历
  div → h1 → "Count: 0" TextFiber
  div → button → "Increment" TextFiber

步骤61: TextFiber没有子节点
  → beginWork返回null

========== completeWork阶段（向上回溯）==========

步骤62: completeUnitOfWork(TextFiber)

步骤63: completeWork(null, TextFiber, DefaultLane)
  → tag = HostText
  → mount阶段
  → createTextInstance("Count: 0")
  → TextFiber.stateNode = Text DOM节点
  → bubbleProperties(TextFiber)

步骤64: 找兄弟节点 → null
  → 返回父节点h1

步骤65: completeWork(null, h1 Fiber, DefaultLane)
  → tag = HostComponent
  → mount阶段
  → createInstance('h1', props, ...)
    h1 DOM = document.createElement('h1')
  → appendAllChildren(h1 DOM, h1 Fiber, ...)
    遍历h1 Fiber.child：
      TextFiber.stateNode（Text节点）
    h1 DOM.appendChild(Text节点)
  → h1 Fiber.stateNode = h1 DOM
  → finalizeInitialChildren(h1 DOM, 'h1', props)
  → bubbleProperties(h1 Fiber)

步骤66-80: 继续completeWork
  button Fiber → div Fiber → Counter Fiber → rootFiber

步骤81: render阶段完成
  → exitStatus = RootCompleted
  → workInProgress = null

========== 阶段5：commit阶段 ==========

步骤82: commitRoot(root, finishedWork, ...)

步骤83: commitBeforeMutationEffects(root, finishedWork, lanes)
  → 遍历Fiber树
  → 调用getSnapshotBeforeUpdate（如果有ClassComponent）
  → 本例中无操作

步骤84: commitMutationEffects(root, finishedWork, lanes)
  → commitMutationEffectsOnFiber(finishedWork, root, lanes)
  → 递归遍历Fiber树

步骤85: 处理div Fiber的Placement flag
  → commitReconciliationEffects(div Fiber, lanes)
  → commitPlacement(div Fiber)
  → insertOrAppendPlacementNode(div Fiber, ...)
    parent = container (div#root)
    node = div Fiber.stateNode (div DOM)
    parent.appendChild(node)
  → div DOM及所有子DOM插入到container！

步骤86: 切换current树
  root.current = finishedWork (wip rootFiber变成新的current)

步骤87: commitLayoutEffects(finishedWork, root, lanes)
  → commitLayoutEffectOnFiber(...)
  → 遍历Fiber树
  → 执行componentDidMount（ClassComponent）
  → 执行useLayoutEffect（FunctionComponent）
  → 本例中Counter有useEffect（passive），这里不执行

步骤88: 调度passive effects
  scheduleCallback(NormalSchedulerPriority, () => {
    flushPassiveEffects();
    return null;
  });

========== 阶段6：浏览器绘制 ==========

步骤89: commit阶段完成
  → 浏览器开始绘制

步骤90: 用户看到页面
  显示：
  ┌─────────────────┐
  │ Count: 0        │
  │ [Increment]     │
  └─────────────────┘

========== 阶段7：passive effects（异步）==========

步骤91: Scheduler调度的passive effects执行

步骤92: flushPassiveEffects()
  → commitPassiveUnmountEffects(root.current)
    无cleanup（首次mount）
  → commitPassiveMountEffects(root, root.current, lanes, ...)

步骤93: 遍历effect链表
  → Counter Fiber.updateQueue.lastEffect
  → 找到useEffect的Effect对象

步骤94: commitHookPassiveMountEffects(Counter Fiber, ...)
  → commitHookEffectListMount(HookPassive | HookHasEffect, Counter Fiber)
  → 遍历effect链表
    effect.tag & HookPassive !== NoFlags ✓
    effect.tag & HookHasEffect !== NoFlags ✓
  → 执行effect.create()
    console.log('effect: count =', 0)
  → destroy = create()的返回值
  → effect.inst.destroy = destroy（保存cleanup函数）

========== 完成！==========

总耗时：
- 阶段1-3：~1ms
- 阶段4（render）：~5ms
- 阶段5（commit）：~2ms
- 阶段6（绘制）：~8ms
- 阶段7（passive）：~1ms（异步，不阻塞）

总计：~17ms（不含passive）
```

---

## 八、用户点击按钮后的更新流程

### 用户点击Increment按钮

```
========== 触发更新 ==========

步骤1: onClick事件触发
  → React事件系统捕获
  → setCurrentUpdatePriority(DiscreteEventPriority)

步骤2: setCount(count + 1)
  → setCount(0 + 1)
  → dispatchSetState(Counter Fiber, queue, 1)

步骤3: createUpdate(SyncLane)  // 点击事件是SyncLane
  update = {
    lane: SyncLane,
    action: 1,
    hasEagerState: false,
    ...
  }

步骤4: enqueueConcurrentHookUpdate(Counter Fiber, queue, update, SyncLane)
  → queue.pending = update

步骤5: scheduleUpdateOnFiber(root, Counter Fiber, SyncLane)
  → markRootUpdated(root, SyncLane)
  → ensureRootIsScheduled(root)
    → queueMicrotask(processRootScheduleInMicrotask)

步骤6: 事件处理器结束

========== 微任务执行 ==========

步骤7: processRootScheduleInMicrotask()
  → getNextLanes(root, NoLanes) → SyncLane
  → performSyncWorkOnRoot(root, SyncLane)

========== render阶段 ==========

步骤8: renderRootSync(root, SyncLane, true)

步骤9: prepareFreshStack(root, SyncLane)
  → createWorkInProgress(current rootFiber, null)
  → workInProgress = wip rootFiber

步骤10: workLoopSync()

步骤11: performUnitOfWork(wip rootFiber)
  → beginWork(current rootFiber, wip rootFiber, SyncLane)
  → updateHostRoot(...)
  → processUpdateQueue(...)
    处理之前的update：payload = {element: <Counter />}
    newState = { element: <Counter />, cache: ... }
  → reconcileChildren(...)
  → 返回Counter Fiber

步骤12: performUnitOfWork(Counter Fiber)
  → beginWork(current Counter Fiber, wip Counter Fiber, SyncLane)
  → updateFunctionComponent(...)

步骤13: renderWithHooks(current, wip, Counter函数, {}, ...)
  → currentlyRenderingFiber = wip Counter Fiber
  → ReactSharedInternals.H = HooksDispatcherOnUpdate

步骤14: 执行Counter函数
  const [count, setCount] = useState(0);

步骤15: updateState(0)
  → updateWorkInProgressHook()
    从current.memoizedState克隆Hook1
  → updateReducerImpl(hook, current hook, basicStateReducer)
  → 处理queue.pending（update.action = 1）
  → newState = basicStateReducer(0, 1) = 1
  → hook.memoizedState = 1
  → 返回[1, dispatch]

步骤16: useEffect(() => {...}, [count])

步骤17: updateEffect(effect函数, [1])
  → updateWorkInProgressHook()
    从current克隆Hook2
  → areHookInputsEqual([1], [0]) → false
  → deps变化了！
  → pushSimpleEffect(HookHasEffect | HookPassive, ...)
  → Counter Fiber.flags |= PassiveEffect

步骤18: Counter函数返回JSX（count已经是1）
  return (
    <div className="counter">
      <h1>Count: 1</h1>  ← count变成1
      <button onClick={...}>Increment</button>
    </div>
  )

步骤19-35: reconcileChildren(...)
  → diff算法
  → div: key相同，type相同 → 复用
  → h1: 复用
  → TextFiber: 内容变化 "Count: 0" → "Count: 1"
    → 标记Update flag
  → button: 复用

步骤36-50: completeWork阶段
  → TextFiber: 检测到文本变化，标记Update
  → h1: bubbleProperties，收集TextFiber的Update
  → div: bubbleProperties
  → Counter: bubbleProperties，flags包含PassiveEffect
  → rootFiber: bubbleProperties

========== commit阶段 ==========

步骤51: commitRoot(...)

步骤52: commitMutationEffects(root, finishedWork, lanes)
  → 遍历Fiber树
  → 找到TextFiber的Update flag
  → commitTextUpdate(TextFiber.stateNode, "Count: 0", "Count: 1")
    textNode.nodeValue = "Count: 1"

步骤53: 切换current树
  root.current = wip rootFiber（变成新的current）

步骤54: commitLayoutEffects(...)
  → 遍历Fiber树
  → 执行useLayoutEffect（本例中无）

步骤55: 调度passive effects
  scheduleCallback(NormalPriority, flushPassiveEffects)

========== 浏览器绘制 ==========

步骤56: 用户看到更新
  显示：
  ┌─────────────────┐
  │ Count: 1        │  ← 更新了！
  │ [Increment]     │
  └─────────────────┘

========== passive effects ==========

步骤57: flushPassiveEffects()

步骤58: commitPassiveUnmountEffects(...)
  → 找到上次的useEffect
  → 执行cleanup
    console.log('cleanup')

步骤59: commitPassiveMountEffects(...)
  → 找到新的useEffect
  → 执行create
    console.log('effect: count =', 1)
  → 保存新的cleanup函数

========== 完成！==========
```

---

## 九、render阶段 vs commit阶段对比

| 特性 | render阶段 | commit阶段 |
|------|-----------|------------|
| **是否可中断** | ✅ 可中断（并发模式） | ❌ 不可中断（同步） |
| **主要工作** | 构建Fiber树、diff | 操作DOM、执行副作用 |
| **执行函数** | beginWork、completeWork | commitMutation、commitLayout |
| **创建内容** | Fiber节点、DOM节点 | 无（使用render阶段创建的） |
| **DOM可见** | ❌ 用户看不到 | ✅ mutation后用户可见 |
| **异步操作** | ✅ 可能挂起（Suspense） | ❌ 同步执行 |
| **pure function** | ✅ 应该是纯函数 | ❌ 有副作用 |
| **可重复执行** | ✅ 可以（被中断后重新开始） | ❌ 不可以（只执行一次） |

---

## 十、源码关键路径

```
ReactDOM.render完整流程涉及的核心文件：

packages/react-dom/src/
└── client/ReactDOMRoot.js              # createRoot入口
    └── createRoot()                    # 用户API

packages/react-reconciler/src/
├── ReactFiberRoot.js                   # FiberRoot创建
│   ├── FiberRootNode构造函数           # FiberRoot数据结构
│   └── createFiberRoot()               # 创建FiberRoot
│
├── ReactFiber.js                       # Fiber创建
│   ├── createHostRootFiber()           # 创建rootFiber
│   └── createWorkInProgress()          # 创建workInProgress节点
│
├── ReactFiberReconciler.js             # 协调器入口
│   ├── updateContainer()               # render入口
│   └── updateContainerImpl()           # 创建update
│
├── ReactFiberClassUpdateQueue.js       # Update队列
│   ├── createUpdate()                  # 创建update对象
│   ├── enqueueUpdate()                 # update入队
│   └── processUpdateQueue()            # 处理update队列
│
├── ReactFiberWorkLoop.js               # 工作循环
│   ├── scheduleUpdateOnFiber()         # 调度更新
│   ├── ensureRootIsScheduled()         # 确保调度
│   ├── performSyncWorkOnRoot()         # 同步工作
│   ├── renderRootSync()                # 同步render
│   ├── renderRootConcurrent()          # 并发render
│   ├── prepareFreshStack()             # 准备工作栈
│   ├── workLoopSync()                  # 同步工作循环
│   ├── workLoopConcurrent()            # 并发工作循环
│   ├── performUnitOfWork()             # 处理单个工作单元
│   └── commitRoot()                    # commit入口
│
├── ReactFiberBeginWork.js              # beginWork阶段
│   ├── beginWork()                     # beginWork入口
│   ├── updateHostRoot()                # 处理HostRoot
│   ├── updateFunctionComponent()       # 处理函数组件
│   ├── updateClassComponent()          # 处理类组件
│   └── reconcileChildren()             # diff算法入口
│
├── ReactFiberCompleteWork.js          # completeWork阶段
│   ├── completeWork()                  # completeWork入口
│   ├── createInstance()                # 创建DOM
│   ├── appendAllChildren()             # 添加子DOM
│   └── bubbleProperties()              # 收集副作用
│
└── ReactFiberCommitWork.js             # commit阶段
    ├── commitBeforeMutationEffects()   # before mutation
    ├── commitMutationEffects()         # mutation（DOM操作）
    ├── commitLayoutEffects()           # layout
    └── commitPassiveMountEffects()     # passive（useEffect）
```

---

## 十一、面试要点速记

### 快速回答框架

**从ReactDOM.render到页面渲染的主要阶段？**
1. **初始化**：创建FiberRoot和rootFiber
2. **创建Update**：update.payload = {element}
3. **调度**：scheduleUpdateOnFiber，ensureRootIsScheduled
4. **render阶段**：beginWork + completeWork，构建Fiber树
5. **commit阶段**：before mutation + mutation + layout
6. **passive effects**：异步执行useEffect
7. **用户可见**：浏览器完成绘制

**render阶段做什么？**
- **beginWork**：向下遍历，执行组件，diff，创建子Fiber
- **completeWork**：向上回溯，创建DOM，收集副作用

**commit阶段做什么？**
- **before mutation**：读取变更前的DOM状态
- **mutation**：执行DOM操作（插入、更新、删除）
- **切换current树**：root.current = finishedWork
- **layout**：执行useLayoutEffect，componentDidMount

**关键节点？**
- createFiberRoot - 初始化
- updateContainer - 创建update
- ensureRootIsScheduled - 调度
- prepareFreshStack - 准备render
- workLoop - 执行render
- commitRoot - 提交更新

### 加分项

1. **能画出完整流程图**：
   - 7个阶段的完整流程
   - 每个阶段的关键函数

2. **能说明数据结构**：
   - FiberRoot的属性
   - rootFiber的结构
   - Update对象的字段

3. **能详细说明render阶段**：
   - prepareFreshStack准备
   - workLoop循环
   - performUnitOfWork处理
   - beginWork和completeWork的配合

4. **能详细说明commit阶段**：
   - 三个子阶段的时序
   - current树切换时机
   - 为什么这样设计

5. **能举完整案例**：
   - 首次渲染的140步流程
   - 更新时的60步流程

### 常见追问

**Q: render阶段可以中断，中断后如何恢复？**
A:
- workInProgress保存当前进度
- workInProgressRoot保存root
- prepareFreshStack检查是否可以继续
- Fiber链表结构支持从任意节点恢复

**Q: commit阶段为什么不能中断？**
A:
- commit阶段有副作用（DOM操作）
- 中断会导致用户看到不完整的UI
- 必须一次性完成保证一致性

**Q: current树什么时候切换？**
A:
- mutation阶段之后，layout阶段之前
- 确保componentWillUnmount访问旧树
- 确保componentDidMount访问新树

**Q: 首次渲染和更新的区别？**
A:
- 首次：current为null，beginWork走mount逻辑
- 更新：current不为null，beginWork走update逻辑，可以bailout
- 首次：completeWork创建所有DOM
- 更新：completeWork只更新变化的DOM

**Q: 为什么需要FiberRoot和rootFiber两个对象？**
A:
- FiberRoot：应用的根，全局唯一，持久化，不会变
- rootFiber：Fiber树的根节点，参与双缓存，会切换
- FiberRoot.current指向当前的rootFiber
- rootFiber.stateNode指向FiberRoot

---

**参考资料**：
- React源码：`packages/react-dom/src/client/ReactDOMRoot.js`
- React源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`
- [React 18 架构](https://react.dev/blog/2022/03/29/react-v18)

**最后更新**: 2025-11-05
