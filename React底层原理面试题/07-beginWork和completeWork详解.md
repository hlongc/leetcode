# 07 - beginWork和completeWork详解

> **问题**: React的beginWork和completeWork阶段分别做了什么事情？

---

## 一、render阶段概述

**render阶段**是React协调（Reconciliation）的核心阶段，负责构建新的Fiber树（workInProgress树）。这个阶段由两个关键函数组成：

- **beginWork**：向下遍历，创建/更新Fiber节点
- **completeWork**：向上回溯，处理Fiber节点

### 整体流程

```
workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

performUnitOfWork(fiber) {
  ┌────────────────────────┐
  │   1. beginWork(fiber)  │  ← 向下：处理当前节点，返回子节点
  └──────────┬─────────────┘
             ↓
       有子节点？
         ╱    ╲
       是      否
        ↓      ↓
   继续向下  completeWork
             ↓
        ┌────────────────────────┐
        │ 2. completeWork(fiber) │ ← 向上：完成当前节点
        └──────────┬─────────────┘
                   ↓
             有兄弟节点？
               ╱    ╲
             是      否
              ↓      ↓
         处理兄弟  继续向上
}
```

### 深度优先遍历示意

```javascript
// JSX结构
<div id="root">
  <h1>Title</h1>
  <section>
    <p>Content</p>
  </section>
</div>

// Fiber树遍历顺序
    div
    ├─ h1
    └─ section
       └─ p

遍历顺序：
1. beginWork(div)     → 返回h1
2. beginWork(h1)      → 返回null（叶子节点）
3. completeWork(h1)   → 完成h1，返回section
4. beginWork(section) → 返回p
5. beginWork(p)       → 返回null
6. completeWork(p)    → 完成p，返回null（无兄弟）
7. completeWork(section) → 完成section，返回null
8. completeWork(div)  → 完成div，遍历结束
```

---

## 二、beginWork详解

### 作用

**beginWork的主要职责**：
1. 检查组件是否需要更新（bailout优化）
2. 根据Fiber类型，调用对应的update函数
3. 执行组件的render方法或函数
4. 进行diff算法（reconcileChildren）
5. 返回第一个子Fiber节点

### 核心源码

源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`

```javascript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // ========== 阶段1：bailout优化检查 ==========
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      (__DEV__ ? workInProgress.type !== current.type : false)
    ) {
      // props或context变化，需要更新
      didReceiveUpdate = true;
    } else {
      // props没变，检查是否有update或context变化
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes,
      );
      
      if (
        !hasScheduledUpdateOrContext &&
        (workInProgress.flags & DidCapture) === NoFlags
      ) {
        // 可以bailout，提前退出
        didReceiveUpdate = false;
        return attemptEarlyBailoutIfNoScheduledUpdate(
          current,
          workInProgress,
          renderLanes,
        );
      }
      
      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  }

  // ========== 阶段2：清空lanes ==========
  // 当前节点的lanes在beginWork时被消费
  workInProgress.lanes = NoLanes;

  // ========== 阶段3：根据tag类型处理 ==========
  switch (workInProgress.tag) {
    case FunctionComponent: {
      const Component = workInProgress.type;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        workInProgress.pendingProps,
        renderLanes,
      );
    }
    case ClassComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps = resolveClassComponentProps(
        Component,
        unresolvedProps,
      );
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      return updateHostText(current, workInProgress);
    case Fragment:
      return updateFragment(current, workInProgress, renderLanes);
    case ContextProvider:
      return updateContextProvider(current, workInProgress, renderLanes);
    case ContextConsumer:
      return updateContextConsumer(current, workInProgress, renderLanes);
    case MemoComponent:
      return updateMemoComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes,
      );
    case SuspenseComponent:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    // ... 更多类型
  }

  throw new Error('Unknown unit of work tag');
}
```

### 不同类型的处理示例

#### 1. FunctionComponent

```javascript
function updateFunctionComponent(
  current: null | Fiber,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  // 准备读取Context
  prepareToReadContext(workInProgress, renderLanes);
  
  // 执行函数组件，返回children
  let nextChildren;
  nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    context,
    renderLanes,
  );

  // 检查是否可以bailout
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  // 标记已执行工作
  workInProgress.flags |= PerformedWork;
  
  // diff子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  // 返回第一个子节点
  return workInProgress.child;
}
```

#### 2. HostComponent（DOM节点）

```javascript
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostContext(workInProgress);

  const type = workInProgress.type;  // 'div', 'span'等
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  
  // 优化：如果children是纯文本，标记，completeWork时直接设置textContent
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // 之前是文本，现在不是了，需要重置
    workInProgress.flags |= ContentReset;
  }

  // 标记ref
  markRef(current, workInProgress);
  
  // diff子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  return workInProgress.child;
}
```

#### 3. ClassComponent

```javascript
function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  // ... context处理
  
  const instance = workInProgress.stateNode;
  let shouldUpdate;
  
  if (instance === null) {
    // mount阶段
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    shouldUpdate = true;
  } else {
    // update阶段
    shouldUpdate = updateClassInstance(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes,
    );
  }
  
  // 根据shouldUpdate决定是否执行render
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderLanes,
  );
}

function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
  // 标记ref
  markRef(current, workInProgress);

  if (!shouldUpdate && !didCaptureError) {
    // bailout
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  const instance = workInProgress.stateNode;

  // 执行render方法
  let nextChildren = instance.render();
  
  // 标记已执行工作
  workInProgress.flags |= PerformedWork;
  
  // diff子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  // 缓存memoizedState
  workInProgress.memoizedState = instance.state;
  
  return workInProgress.child;
}
```

---

## 三、completeWork详解

### 作用

**completeWork的主要职责**：
1. 创建或更新真实DOM节点
2. 处理props（事件绑定、属性设置等）
3. 收集子节点的副作用（bubbleProperties）
4. 标记需要commit的副作用
5. 返回下一个要处理的Fiber（兄弟或父节点）

### 核心源码

源码：`packages/react-reconciler/src/ReactFiberCompleteWork.js`

```javascript
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      // 这些类型不需要创建DOM，只需要冒泡属性
      bubbleProperties(workInProgress);
      return null;
      
    case ClassComponent: {
      const Component = workInProgress.type;
      if (isLegacyContextProvider(Component)) {
        popLegacyContext(workInProgress);
      }
      bubbleProperties(workInProgress);
      return null;
    }
    
    case HostRoot: {
      const fiberRoot = workInProgress.stateNode;
      popHostContainer(workInProgress);
      popTopLevelLegacyContextObject(workInProgress);
      
      updateHostContainer(current, workInProgress);
      bubbleProperties(workInProgress);
      return null;
    }
    
    case HostComponent: {
      popHostContext(workInProgress);
      const type = workInProgress.type;
      
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
        const currentHostContext = getHostContext();
        
        // 创建DOM节点
        const instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          currentHostContext,
          workInProgress,
        );
        
        // 将子节点的DOM添加到当前DOM中
        appendAllChildren(instance, workInProgress, false, false);
        
        // 保存DOM实例
        workInProgress.stateNode = instance;
        
        // 设置初始属性（如autoFocus等）
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
      
      bubbleProperties(workInProgress);
      return null;
    }
    
    case HostText: {
      const newText = newProps;
      
      if (current !== null && workInProgress.stateNode != null) {
        // update：文本内容变化
        const oldText = current.memoizedProps;
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
    
    // ... 更多类型处理
  }
}
```

### bubbleProperties：收集副作用

```javascript
function bubbleProperties(completedWork: Fiber) {
  const didBailout =
    completedWork.alternate !== null &&
    completedWork.alternate.child === completedWork.child;

  let newChildLanes: Lanes = NoLanes;
  let subtreeFlags: Flags = NoFlags;

  if (!didBailout) {
    // ========== 正常情况：收集所有子节点的flags ==========
    let child = completedWork.child;
    while (child !== null) {
      // 合并lanes
      newChildLanes = mergeLanes(
        newChildLanes,
        mergeLanes(child.lanes, child.childLanes),
      );

      // 合并flags（使用位运算）
      subtreeFlags |= child.subtreeFlags;
      subtreeFlags |= child.flags;

      child = child.sibling;
    }

    completedWork.subtreeFlags |= subtreeFlags;
  } else {
    // ========== bailout情况：只收集静态flags ==========
    let child = completedWork.child;
    while (child !== null) {
      newChildLanes = mergeLanes(
        newChildLanes,
        mergeLanes(child.lanes, child.childLanes),
      );

      // 只收集静态flags（Ref、LayoutStatic等）
      subtreeFlags |= child.subtreeFlags & StaticMask;
      subtreeFlags |= child.flags & StaticMask;

      child = child.sibling;
    }

    completedWork.subtreeFlags |= subtreeFlags;
  }

  // 保存收集到的childLanes
  completedWork.childLanes = newChildLanes;

  return didBailout;
}
```

**subtreeFlags的作用**：

```
没有subtreeFlags（旧版）：
commit阶段需要遍历整棵树才能找到有副作用的节点

有subtreeFlags（优化）：
通过位运算快速判断子树是否有副作用

if ((fiber.subtreeFlags & MutationMask) === NoFlags) {
  // 子树没有DOM变更，跳过！
  return;
}

示例：
div (subtreeFlags: Update | Placement)
├─ p (flags: Update)
└─ span (flags: Placement)

检查div.subtreeFlags就知道子树有Update和Placement
无需遍历子节点
```

---

## 四、performUnitOfWork完整流程

源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
function performUnitOfWork(unitOfWork: Fiber): void {
  // current指向旧的Fiber节点（current树）
  const current = unitOfWork.alternate;

  // ========== 1. beginWork阶段 ==========
  let next = beginWork(current, unitOfWork, entangledRenderLanes);

  // 保存处理后的props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // ========== 2. completeWork阶段 ==========
    // 没有子节点，开始complete
    completeUnitOfWork(unitOfWork);
  } else {
    // 有子节点，继续向下
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork: Fiber = unitOfWork;
  
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;

    // 执行completeWork
    let next = completeWork(current, completedWork, entangledRenderLanes);

    if (next !== null) {
      // completeWork返回了新的工作（罕见）
      workInProgress = next;
      return;
    }

    // 查找兄弟节点
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // 有兄弟节点，处理兄弟节点
      workInProgress = siblingFiber;
      return;
    }

    // 没有兄弟节点，返回父节点
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);

  // 到达rootFiber，render阶段完成
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}
```

---

## 五、完整案例演示

### 案例：更新计数器

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**用户点击按钮后的完整流程**：

```
========== render阶段开始 ==========

Fiber树结构：
rootFiber
└─ Counter Fiber
   └─ div Fiber
      ├─ h1 Fiber
      │  └─ "Count: 0" TextFiber
      └─ button Fiber
         └─ "Increment" TextFiber

========== beginWork阶段（向下） ==========

1. beginWork(rootFiber)
   - tag: HostRoot
   - updateHostRoot()
   - processUpdateQueue() → 计算新state
   - 返回: Counter Fiber

2. beginWork(Counter Fiber)
   - tag: FunctionComponent
   - updateFunctionComponent()
   - renderWithHooks() → 执行Counter函数
     - useState(0)读取updateQueue
     - 新count = 1
     - 返回: <div>...</div>
   - reconcileChildren() → diff
   - 返回: div Fiber

3. beginWork(div Fiber)
   - tag: HostComponent
   - updateHostComponent()
   - reconcileChildren() → diff子节点
   - 返回: h1 Fiber

4. beginWork(h1 Fiber)
   - tag: HostComponent
   - updateHostComponent()
   - reconcileChildren()
   - 返回: TextFiber

5. beginWork(TextFiber "Count: 1")
   - tag: HostText
   - updateHostText()
   - 文本节点没有子节点
   - 返回: null

========== completeWork阶段（向上） ==========

6. completeWork(TextFiber)
   - 检测到文本变化："Count: 0" → "Count: 1"
   - 标记Update flag
   - bubbleProperties()
   - 无兄弟节点，返回父节点

7. completeWork(h1 Fiber)
   - bubbleProperties()
   - 收集TextFiber的Update flag → h1.subtreeFlags |= Update
   - 有兄弟节点button，返回button

========== 处理button分支 ==========

8. beginWork(button Fiber)
   - tag: HostComponent
   - props没变，bailout
   - 返回: null（button的children是纯文本，没有Fiber）

9. completeWork(button Fiber)
   - bubbleProperties()
   - 无flags，无兄弟节点
   - 返回父节点

10. completeWork(div Fiber)
    - bubbleProperties()
    - div.subtreeFlags |= h1.subtreeFlags (包含Update)
    - 无兄弟节点，返回父节点

11. completeWork(Counter Fiber)
    - tag: FunctionComponent
    - bubbleProperties()
    - 收集div的subtreeFlags
    - 无兄弟节点，返回父节点

12. completeWork(rootFiber)
    - tag: HostRoot
    - bubbleProperties()
    - workInProgress = null
    - render阶段完成！

========== 最终结果 ==========

workInProgress树完成：
rootFiber (subtreeFlags: Update)
└─ Counter Fiber (subtreeFlags: Update)
   └─ div Fiber (subtreeFlags: Update)
      ├─ h1 Fiber (subtreeFlags: Update)
      │  └─ TextFiber (flags: Update) ← 需要更新文本
      └─ button Fiber (无flags)

进入commit阶段，只需要更新TextFiber的DOM文本内容
```

---

## 六、beginWork vs completeWork对比

| 特性 | beginWork | completeWork |
|------|-----------|--------------|
| **方向** | 向下（父→子） | 向上（子→父） |
| **主要任务** | 创建/更新Fiber节点 | 创建/更新DOM节点 |
| **执行组件** | 是（render/函数调用） | 否 |
| **diff算法** | 是（reconcileChildren） | 否 |
| **副作用** | 标记当前节点 | 收集子树副作用 |
| **返回值** | 子Fiber或null | 兄弟Fiber或null |
| **bailout** | 可以提前退出 | 总是执行 |
| **DOM操作** | 否 | 是（mount时创建） |

---

## 七、特殊场景处理

### 1. Suspense的处理

```javascript
// beginWork阶段
function updateSuspenseComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const nextProps = workInProgress.pendingProps;

  // 尝试渲染children
  const nextPrimaryChildren = nextProps.children;
  const nextFallbackChildren = nextProps.fallback;

  if (shouldShowFallback) {
    // 显示fallback
    // 创建两个子树：primary（隐藏）和fallback（显示）
    return mountSuspenseFallbackChildren(
      workInProgress,
      nextPrimaryChildren,
      nextFallbackChildren,
      renderLanes,
    );
  } else {
    // 显示primary内容
    return mountSuspensePrimaryChildren(
      workInProgress,
      nextPrimaryChildren,
      renderLanes,
    );
  }
}

// completeWork阶段
case SuspenseComponent: {
  popSuspenseHandler(workInProgress);
  const nextState: SuspenseState | null = workInProgress.memoizedState;
  
  // 检查是否需要隐藏内容
  if ((workInProgress.flags & DidCapture) !== NoFlags) {
    workInProgress.lanes = renderLanes;
    return workInProgress;  // 返回workInProgress，重新开始
  }
  
  bubbleProperties(workInProgress);
  return null;
}
```

### 2. Context的处理

```javascript
// beginWork阶段
function updateContextProvider(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const newProps = workInProgress.pendingProps;
  const newValue = newProps.value;
  const context = workInProgress.type;

  // 推入新的Context值
  pushProvider(workInProgress, context, newValue);

  if (current !== null) {
    const oldProps = current.memoizedProps;
    const oldValue = oldProps.value;
    
    // 检查value是否变化
    if (is(oldValue, newValue)) {
      // value没变，可能可以bailout
      if (
        oldProps.children === newProps.children &&
        !hasLegacyContextChanged()
      ) {
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes,
        );
      }
    } else {
      // value变化，标记所有consumers
      propagateContextChange(workInProgress, context, renderLanes);
    }
  }

  const newChildren = newProps.children;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}

// completeWork阶段
case ContextProvider: {
  const context = workInProgress.type;
  popProvider(context, workInProgress);
  bubbleProperties(workInProgress);
  return null;
}
```

### 3. 错误边界的处理

```javascript
// beginWork阶段
// 如果子组件抛出错误，会被捕获
try {
  next = beginWork(current, unitOfWork, renderLanes);
} catch (thrownValue) {
  handleThrow(root, thrownValue);
}

// handleThrow会查找最近的错误边界
function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  rootRenderLanes: Lanes,
) {
  // 标记DidThrow
  sourceFiber.flags |= Incomplete;
  
  // 向上查找错误边界
  let workInProgress = returnFiber;
  do {
    switch (workInProgress.tag) {
      case ClassComponent: {
        const ctor = workInProgress.type;
        const instance = workInProgress.stateNode;
        
        // 是错误边界吗？
        if (
          typeof ctor.getDerivedStateFromError === 'function' ||
          (instance !== null &&
            typeof instance.componentDidCatch === 'function')
        ) {
          // 找到了！标记ShouldCapture
          workInProgress.flags |= ShouldCapture;
          const lane = pickArbitraryLane(rootRenderLanes);
          workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
          
          // 创建错误update
          const update = createClassErrorUpdate(lane);
          enqueueUpdate(workInProgress, update, lane);
          return;
        }
        break;
      }
    }
    workInProgress = workInProgress.return;
  } while (workInProgress !== null);
}
```

---

## 八、性能优化点

### 1. beginWork的优化

```javascript
// 优化1：bailout提前退出
if (
  oldProps === newProps &&
  !hasScheduledUpdate &&
  !hasContextChanged
) {
  // 完全不执行beginWork的主逻辑
  return bailoutOnAlreadyFinishedWork(...);
}

// 优化2：复用上次的children
function bailoutOnAlreadyFinishedWork(
  current: Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // 子树也没工作，完全跳过
    return null;
  }
  
  // 克隆children指针，不创建新Fiber
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}
```

### 2. completeWork的优化

```javascript
// 优化1：updatePayload复用
// 只在有变化的props时创建updatePayload
function updateHostComponent(
  current: Fiber,
  workInProgress: Fiber,
  type: Type,
  newProps: Props,
  renderLanes: Lanes,
) {
  const oldProps = current.memoizedProps;
  
  if (oldProps === newProps) {
    // props完全相同，跳过
    return;
  }

  const instance = workInProgress.stateNode;
  
  // 计算需要更新的属性
  const updatePayload = prepareUpdate(
    instance,
    type,
    oldProps,
    newProps,
    currentHostContext,
  );
  
  // 只保存变化的属性
  workInProgress.updateQueue = updatePayload;
  
  if (updatePayload) {
    // 有更新，标记Update flag
    markUpdate(workInProgress);
  }
}

// 优化2：bailout时只收集静态flags
if (didBailout) {
  subtreeFlags |= child.subtreeFlags & StaticMask;
  subtreeFlags |= child.flags & StaticMask;
}
```

---

## 九、实际应用场景

### 场景1：大组件树的优化

```javascript
function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      
      {/* 1000个组件 */}
      <LargeComponentTree />
    </div>
  );
}

const LargeComponentTree = React.memo(() => {
  // 1000个子组件
  return <div>{/* ... */}</div>;
});

// beginWork流程：
// 1. beginWork(App) → 执行render
// 2. beginWork(button) → 更新文本
// 3. beginWork(LargeComponentTree) → bailout！
//    props没变，返回null，不进入1000个子组件

// 性能提升：
// - 不执行1000个组件的beginWork
// - 不进行1000次diff
// - 不执行1000次completeWork
```

### 场景2：条件渲染

```javascript
function App({ showDetails }) {
  return (
    <div>
      <Header />
      {showDetails && <Details />}
      <Footer />
    </div>
  );
}

// showDetails: false → true

// beginWork流程：
// 1. beginWork(App)
//    reconcileChildren([Header, Details, Footer])
//    
// 2. beginWork(Header) → bailout（props没变）
//
// 3. beginWork(Details)
//    - current: null（之前不存在）
//    - mount新组件
//
// 4. beginWork(Footer) → bailout

// completeWork流程：
// 1. completeWork(Details)
//    - mount阶段，创建DOM
//    - 标记Placement flag
//
// 2. completeWork(div)
//    - bubbleProperties
//    - subtreeFlags |= Placement（Details的flags）

// commit阶段：
// - 找到Details的Placement flag
// - 插入Details的DOM到div中
```

### 场景3：列表更新

```javascript
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// 添加新todo

// beginWork流程：
// 1. beginWork(ul)
//    reconcileChildrenArray()
//    
//    第一轮：所有旧todo都能按key复用
//    第二轮：oldFiber为null，创建新todo的Fiber
//    
//    新TodoItem Fiber标记Placement
//
// 2. beginWork(新TodoItem)
//    - current: null
//    - mount流程
//
// completeWork流程：
// 1. completeWork(新TodoItem)
//    - 创建DOM
//    - appendAllChildren
//    - 保持Placement flag
//
// 2. completeWork(ul)
//    - bubbleProperties
//    - subtreeFlags |= Placement

// commit阶段：
// - 将新TodoItem的DOM插入ul
```

---

## 十、源码关键路径

```
render阶段核心文件：

packages/react-reconciler/src/
├── ReactFiberWorkLoop.js               # 工作循环
│   ├── workLoopConcurrent()            # 并发工作循环
│   ├── performUnitOfWork()             # 处理单个工作单元
│   └── completeUnitOfWork()            # 完成单个工作单元
│
├── ReactFiberBeginWork.js              # beginWork阶段
│   ├── beginWork()                     # 主入口
│   ├── updateFunctionComponent()       # 函数组件
│   ├── updateClassComponent()          # 类组件
│   ├── updateHostRoot()                # 根节点
│   ├── updateHostComponent()           # DOM节点
│   └── reconcileChildren()             # diff入口
│
└── ReactFiberCompleteWork.js          # completeWork阶段
    ├── completeWork()                  # 主入口
    ├── bubbleProperties()              # 收集副作用
    ├── createInstance()                # 创建DOM
    ├── appendAllChildren()             # 添加子DOM
    └── finalizeInitialChildren()       # 设置初始属性
```

---

## 十一、面试要点速记

### 快速回答框架

**beginWork做什么？**
1. 检查bailout优化
2. 根据tag调用对应update函数
3. 执行组件render
4. diff子节点（reconcileChildren）
5. 返回第一个子节点

**completeWork做什么？**
1. 创建或更新DOM节点
2. 处理props和事件
3. 收集子节点的副作用（bubbleProperties）
4. 返回兄弟或父节点

**两者的关系？**
- beginWork向下，completeWork向上
- beginWork创建Fiber，completeWork创建DOM
- beginWork标记flags，completeWork收集flags
- 配合实现深度优先遍历

**为什么需要两个阶段？**
- 分工明确：beginWork专注协调，completeWork专注DOM
- 优化机会：beginWork可bailout，completeWork可批量处理
- 错误处理：向上回溯时捕获和处理错误

### 加分项

1. **能画出遍历流程图**：
   - 深度优先遍历
   - beginWork向下，completeWork向上

2. **能说明bubbleProperties的作用**：
   - 收集子树flags
   - 优化commit阶段（快速跳过无副作用的子树）

3. **能举例不同类型的处理**：
   - FunctionComponent：执行函数
   - HostComponent：创建DOM
   - Suspense：处理异步

4. **能分析性能优化点**：
   - bailout提前退出
   - cloneChildFibers复用
   - subtreeFlags快速判断

### 常见追问

**Q: beginWork返回null代表什么？**
A:
- 没有子节点，或者bailout跳过子树
- 触发completeWork向上回溯

**Q: completeWork什么时候返回非null？**
A:
- 很少见，主要在错误处理或Suspense时
- 返回新的Fiber，重新开始beginWork

**Q: DOM是在哪个阶段创建的？**
A:
- mount时在completeWork创建
- update时在commit阶段更新
- 原因：completeWork向上回溯，可以先创建子DOM再添加到父DOM

**Q: 为什么不在beginWork创建DOM？**
A:
- beginWork可能被中断
- 创建DOM是副作用，应该在commit统一处理
- completeWork向上回溯时，子DOM已经ready，可以直接append

**Q: reconcileChildren在哪里调用？**
A:
- 在beginWork的各个update函数中
- 如updateFunctionComponent、updateHostComponent等
- diff出来的子Fiber会在下一次performUnitOfWork中被beginWork处理

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`
- React源码：`packages/react-reconciler/src/ReactFiberCompleteWork.js`
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

**最后更新**: 2025-11-05

