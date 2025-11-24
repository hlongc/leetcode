# 16 - commit阶段详解

> **问题**: React的commit阶段分为哪几个子阶段？每个子阶段做什么？为什么要这样分？

---

## 一、commit阶段概述

**commit阶段是React将render阶段的结果提交到DOM的过程**，这个阶段**不可中断**，必须同步执行完成。

### 为什么commit阶段不可中断？

```
render阶段（可中断）：
- 在内存中构建workInProgress树
- 用户看不到中间状态
- 可以随时放弃重来

commit阶段（不可中断）：
- 操作真实DOM
- 用户会看到DOM变化
- 中断会导致UI不一致
- 必须一次性完成
```

### commit阶段的四个子阶段

```
commit阶段的完整流程：

┌─────────────────────────────────────────────┐
│ 1. before mutation阶段（同步）              │
│ - 读取变更前的DOM状态                        │
│ - 调用getSnapshotBeforeUpdate               │
│ - 调度useEffect（异步调度，不执行）          │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 2. mutation阶段（同步）                     │
│ - 执行DOM操作（插入、更新、删除）            │
│ - 调用componentWillUnmount                  │
│ - 调用useLayoutEffect的cleanup函数          │
│ - 调用useInsertionEffect                    │
└──────────────────┬──────────────────────────┘
                   ↓
         【关键时刻：切换current树】
         root.current = finishedWork
                   ↓
┌─────────────────────────────────────────────┐
│ 3. layout阶段（同步）                       │
│ - 调用componentDidMount/Update              │
│ - 调用useLayoutEffect的create函数           │
│ - 更新ref.current                           │
│ - 调用render callback                       │
└──────────────────┬──────────────────────────┘
                   ↓
         【浏览器绘制】用户看到新UI
                   ↓
┌─────────────────────────────────────────────┐
│ 4. passive阶段（异步）                      │
│ - 调度在Scheduler中执行                     │
│ - 调用useEffect的cleanup函数                │
│ - 调用useEffect的create函数                 │
└─────────────────────────────────────────────┘
```

---

## 二、before mutation阶段

### 作用

1. **读取DOM变更前的状态**（如滚动位置）
2. **调用`getSnapshotBeforeUpdate`生命周期**
3. **调度useEffect**（异步调度，不是执行）

### 源码实现

源码：`packages/react-reconciler/src/ReactFiberCommitWork.js`

```javascript
export function commitBeforeMutationEffects(
  root: FiberRoot,
  firstChild: Fiber,
  committedLanes: Lanes,
): void {
  // 设置focus相关状态
  focusedInstanceHandle = prepareForCommit(root.containerInfo);
  
  // 准备View Transition
  shouldStartViewTransition = startViewTransitionIfNeeded(
    root,
    committedLanes,
    firstChild,
  );
  
  // 遍历Fiber树，执行before mutation effects
  nextEffect = firstChild;
  commitBeforeMutationEffects_begin(
    shouldStartViewTransition && canViewTransition(root.containerInfo),
  );
  
  // Reset focus
  const shouldResetFocus = focusedInstanceHandle !== null;
  focusedInstanceHandle = null;
  
  return shouldResetFocus;
}

function commitBeforeMutationEffects_begin(isViewTransitionEligible: boolean) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    const child = fiber.child;
    
    // 检查子树是否有before mutation effects
    if (
      (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
      child !== null
    ) {
      // 有，继续向下遍历
      nextEffect = child;
    } else {
      // 没有子树effects，处理当前节点
      commitBeforeMutationEffects_complete(isViewTransitionEligible);
    }
  }
}

function commitBeforeMutationEffects_complete(
  isViewTransitionEligible: boolean,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    
    try {
      // 执行before mutation effects
      commitBeforeMutationEffectsOnFiber(fiber, isViewTransitionEligible);
    } catch (error) {
      captureCommitPhaseError(fiber, fiber.return, error);
    }

    // 移动到兄弟节点或父节点
    const sibling = fiber.sibling;
    if (sibling !== null) {
      nextEffect = sibling;
      return;
    }

    nextEffect = fiber.return;
  }
}
```

### commitBeforeMutationEffectsOnFiber：处理单个Fiber

```javascript
function commitBeforeMutationEffectsOnFiber(
  finishedWork: Fiber,
  isViewTransitionEligible: boolean,
) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  // ========== 处理focus blur ==========
  if (enableCreateEventHandleAPI) {
    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // 在blur之前检查focus变化
      if ((flags & Update) !== NoFlags) {
        if (
          finishedWork.tag === HostComponent &&
          doesFiberContain(finishedWork, focusedInstanceHandle)
        ) {
          shouldFireAfterActiveInstanceBlur = true;
          beforeActiveInstanceBlur(finishedWork);
        }
      }
    }
  }

  // ========== 根据tag处理不同类型 ==========
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      // 函数组件：处理useEffectEvent
      if (enableUseEffectEventHook) {
        if ((flags & Update) !== NoFlags) {
          const updateQueue: FunctionComponentUpdateQueue | null =
            finishedWork.updateQueue;
          const eventPayloads =
            updateQueue !== null ? updateQueue.events : null;
          if (eventPayloads !== null) {
            for (let ii = 0; ii < eventPayloads.length; ii++) {
              const {ref, nextImpl} = eventPayloads[ii];
              ref.impl = nextImpl;
            }
          }
        }
      }
      break;
    }
    
    case ClassComponent: {
      // ========== 关键：调用getSnapshotBeforeUpdate ==========
      if ((flags & Snapshot) !== NoFlags) {
        if (current !== null) {
          commitClassSnapshot(finishedWork, current);
        }
      }
      break;
    }
    
    case HostRoot: {
      if ((flags & Snapshot) !== NoFlags) {
        if (supportsMutation) {
          const root = finishedWork.stateNode;
          clearContainer(root.containerInfo);
        }
      }
      break;
    }
    
    // 其他类型不需要before mutation处理
    case HostComponent:
    case HostText:
    case HostPortal:
      break;
  }
}
```

### getSnapshotBeforeUpdate的调用

源码：`packages/react-reconciler/src/ReactFiberCommitEffects.js`

```javascript
export function commitClassSnapshot(finishedWork: Fiber, current: Fiber) {
  const prevProps = resolveClassComponentProps(
    finishedWork.type,
    current.memoizedProps,
  );
  const prevState = current.memoizedState;
  const instance = finishedWork.stateNode;
  
  // 准备调用getSnapshotBeforeUpdate
  const resolvedPrevProps = resolveClassComponentProps(
    finishedWork.type,
    prevProps,
  );
  
  let snapshot;
  try {
    // 调用getSnapshotBeforeUpdate
    snapshot = instance.getSnapshotBeforeUpdate(
      resolvedPrevProps,
      prevState,
    );
    
    // 保存snapshot，供componentDidUpdate使用
    instance.__reactInternalSnapshotBeforeUpdate = snapshot;
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
```

**getSnapshotBeforeUpdate的应用场景**：

```javascript
class ChatThread extends React.Component {
  chatListRef = React.createRef();

  getSnapshotBeforeUpdate(prevProps) {
    // 在DOM更新前，保存滚动位置
    if (prevProps.messages.length < this.props.messages.length) {
      const list = this.chatListRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // snapshot是getSnapshotBeforeUpdate的返回值
    if (snapshot !== null) {
      const list = this.chatListRef.current;
      // 恢复滚动位置
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div ref={this.chatListRef}>
        {this.props.messages.map(msg => (
          <Message key={msg.id} text={msg.text} />
        ))}
      </div>
    );
  }
}

// 时序：
// 1. before mutation：调用getSnapshotBeforeUpdate
//    → 保存滚动位置snapshot
// 2. mutation：DOM更新，添加新消息
// 3. layout：调用componentDidUpdate(prevProps, prevState, snapshot)
//    → 使用snapshot恢复滚动位置
```

---

## 三、mutation阶段

### 作用

1. **执行DOM操作**：插入、更新、删除节点
2. **调用componentWillUnmount**
3. **调用useLayoutEffect的cleanup**
4. **调用useInsertionEffect**

### 源码实现

```javascript
export function commitMutationEffects(
  root: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
) {
  // 设置全局变量
  inProgressLanes = committedLanes;
  inProgressRoot = root;

  // 重置View Transition状态
  rootViewTransitionAffected = false;
  inUpdateViewTransition = false;

  resetComponentEffectTimers();

  // 递归遍历Fiber树，执行mutation effects
  commitMutationEffectsOnFiber(finishedWork, root, committedLanes);

  // 清理全局变量
  inProgressLanes = null;
  inProgressRoot = null;
}

function commitMutationEffectsOnFiber(
  finishedWork: Fiber,
  root: FiberRoot,
  lanes: Lanes,
) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  // 根据tag处理不同类型
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // ========== 递归处理子树 ==========
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork, lanes);

      if (flags & Update) {
        // 执行useInsertionEffect和useLayoutEffect的cleanup
        commitHookEffectListUnmount(
          HookInsertion | HookHasEffect,
          finishedWork,
          finishedWork.return,
        );
        commitHookEffectListMount(HookInsertion | HookHasEffect, finishedWork);
        
        // useLayoutEffect cleanup
        commitHookLayoutUnmountEffects(
          finishedWork,
          finishedWork.return,
          HookLayout | HookHasEffect,
        );
      }
      break;
    }
    
    case ClassComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork, lanes);

      if (flags & Ref) {
        if (current !== null) {
          // 清除旧的ref
          safelyDetachRef(current, current.return);
        }
      }
      
      if (flags & Callback && offscreenSubtreeIsHidden) {
        // Offscreen中的setState callback
        commitClassCallbacks(finishedWork);
      }
      break;
    }
    
    case HostRoot: {
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork, lanes);

      if (flags & Update) {
        if (supportsMutation && supportsHydration) {
          if (current !== null) {
            const prevRootState: RootState = current.memoizedState;
            if (prevRootState.isDehydrated) {
              commitHostHydratedContainer(root, finishedWork);
            }
          }
        }
        if (supportsPersistence) {
          commitHostRootContainerChildren(root, finishedWork);
        }
      }
      break;
    }
    
    case HostComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork, lanes);

      if (flags & Ref) {
        if (current !== null) {
          safelyDetachRef(current, current.return);
        }
      }
      
      if (flags & Update) {
        const instance: Instance = finishedWork.stateNode;
        if (instance != null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const type = finishedWork.type;
          const updatePayload: null | UpdatePayload =
            (finishedWork.updateQueue: any);
          finishedWork.updateQueue = null;
          
          if (updatePayload !== null) {
            // 执行DOM更新
            commitHostUpdate(
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork,
            );
          }
        }
      }
      
      if (flags & FormReset) {
        needsFormReset = true;
      }
      break;
    }
    
    // ... 更多类型
  }
}
```

### commitReconciliationEffects：处理DOM插入/移动

```javascript
function commitReconciliationEffects(
  finishedWork: Fiber,
  committedLanes: Lanes,
) {
  // Placement effects（插入、移动）可以在任何fiber类型上调度
  const flags = finishedWork.flags;
  
  if (flags & Placement) {
    // ========== 执行DOM插入/移动 ==========
    commitHostPlacement(finishedWork);
    
    // 清除Placement flag
    finishedWork.flags &= ~Placement;
  }
  
  if (flags & Hydrating) {
    finishedWork.flags &= ~Hydrating;
  }
}

export function commitHostPlacement(finishedWork: Fiber) {
  try {
    commitPlacement(finishedWork);
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

function commitPlacement(finishedWork: Fiber) {
  // ========== 1. 找到父DOM节点 ==========
  const parentFiber = getHostParentFiber(finishedWork);
  
  let parent;
  let isContainer;
  
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentFiber.stateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentFiber.stateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentFiber.stateNode.containerInfo;
      isContainer = true;
      break;
  }

  // ========== 2. 找到插入位置（before节点）==========
  const before = getHostSibling(finishedWork);

  // ========== 3. 执行DOM插入 ==========
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: ?Instance,
  parent: Instance,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  
  if (isHost) {
    // 这是DOM节点，直接插入
    const stateNode = node.stateNode;
    if (before) {
      insertBefore(parent, stateNode, before);  // parent.insertBefore(node, before)
    } else {
      appendChild(parent, stateNode);  // parent.appendChild(node)
    }
  } else {
    // 不是DOM节点（如Fragment），递归处理children
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}
```

### commitDeletionEffects：处理删除

```javascript
function commitDeletionEffects(
  root: FiberRoot,
  returnFiber: Fiber,
  deletedFiber: Fiber,
) {
  if (supportsMutation) {
    // ========== 1. 找到父DOM节点 ==========
    let parent: null | Fiber = returnFiber;
    findParent: while (parent !== null) {
      switch (parent.tag) {
        case HostComponent:
          hostParent = parent.stateNode;
          hostParentIsContainer = false;
          break findParent;
        case HostRoot:
          hostParent = parent.stateNode.containerInfo;
          hostParentIsContainer = true;
          break findParent;
        case HostPortal:
          hostParent = parent.stateNode.containerInfo;
          hostParentIsContainer = true;
          break findParent;
      }
      parent = parent.return;
    }

    // ========== 2. 递归删除子树 ==========
    commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
    
    // ========== 3. 清理 ==========
    hostParent = null;
    hostParentIsContainer = false;
  } else {
    // Persistent模式（非DOM环境）
    commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
  }

  detachFiberAfterEffects(deletedFiber);
}

function commitDeletionEffectsOnFiber(
  finishedRoot: FiberRoot,
  nearestMountedAncestor: Fiber,
  deletedFiber: Fiber,
) {
  // 递归处理子树
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      // ========== 调用componentWillUnmount ==========
      // 在删除DOM前调用
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber,
      );
      
      // ========== 删除DOM节点 ==========
      if (hostParent !== null) {
        if (hostParentIsContainer) {
          commitHostRemoveChildFromContainer(
            deletedFiber,
            nearestMountedAncestor,
            hostParent,
            deletedFiber.stateNode,
          );
        } else {
          commitHostRemoveChild(
            deletedFiber,
            nearestMountedAncestor,
            hostParent,
            deletedFiber.stateNode,
          );
        }
      }
      return;
    }
    
    case ClassComponent: {
      // 调用componentWillUnmount
      safelyDetachRef(deletedFiber, nearestMountedAncestor);
      const instance = deletedFiber.stateNode;
      if (typeof instance.componentWillUnmount === 'function') {
        safelyCallComponentWillUnmount(
          deletedFiber,
          nearestMountedAncestor,
          instance,
        );
      }
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber,
      );
      return;
    }
    
    // ... 其他类型
  }
}
```

---

## 四、切换current树

### 时机：mutation和layout之间

源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
function flushMutationEffects(): void {
  if (pendingEffectsStatus !== PENDING_MUTATION_PHASE) {
    return;
  }
  pendingEffectsStatus = NO_PENDING_EFFECTS;

  const root = pendingEffectsRoot;
  const finishedWork = pendingFinishedWork;
  const lanes = pendingEffectsLanes;
  
  const subtreeMutationHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootMutationHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeMutationHasEffects || rootMutationHasEffect) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    
    try {
      // ========== 执行mutation effects ==========
      commitMutationEffects(root, finishedWork, lanes);

      // 重置DOM容器
      resetAfterCommit(root.containerInfo);
    } finally {
      executionContext = prevExecutionContext;
    }
  }

  // ========== 关键：切换current树 ==========
  // The work-in-progress tree is now the current tree.
  // This must come after the mutation phase, so that the previous tree
  // is still current during componentWillUnmount, but before the layout
  // phase, so that the finished work is current during
  // componentDidMount/Update.
  root.current = finishedWork;
  
  pendingEffectsStatus = PENDING_LAYOUT_PHASE;
}
```

**为什么在mutation和layout之间切换？**

```
时间轴：

┌──────────────────┬─────────────────┬────────────────┬──────────────────┐
│ before mutation  │ mutation        │ 切换current    │ layout           │
└──────────────────┴─────────────────┴────────────────┴──────────────────┘
  访问旧树         执行DOM操作        切换指针          访问新树
  current有效      current仍然有效    切换完成          新current有效

原因：
1. componentWillUnmount需要访问旧的组件实例（current树）
2. mutation阶段操作DOM，但组件实例还是旧的
3. componentDidMount/Update需要访问新的组件实例（新current树）
4. useLayoutEffect需要读取新的DOM和新的组件状态
```

**示例**：

```javascript
class Component extends React.Component {
  componentWillUnmount() {
    // mutation阶段前调用
    // 此时current树还是旧的
    console.log('旧的props:', this.props);
    
    // 可以访问即将被删除的DOM
    const node = ReactDOM.findDOMNode(this);
    console.log('DOM still exists:', node);
  }
}

function FunctionComponent({ count }) {
  const ref = useRef();
  
  useLayoutEffect(() => {
    // layout阶段调用
    // 此时current树已经是新的
    // DOM也已经更新
    console.log('新的count:', count);
    console.log('新的DOM:', ref.current);
    
    // 可以测量DOM布局
    const rect = ref.current.getBoundingClientRect();
    console.log('位置:', rect);
  }, [count]);
  
  return <div ref={ref}>{count}</div>;
}
```

---

## 五、layout阶段

### 作用

1. **调用componentDidMount/Update**
2. **调用useLayoutEffect的create**
3. **更新ref.current**
4. **调用setState的callback**

### 源码实现

```javascript
export function commitLayoutEffects(
  finishedWork: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
): void {
  inProgressLanes = committedLanes;
  inProgressRoot = root;

  resetComponentEffectTimers();

  const current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork, committedLanes);

  inProgressLanes = null;
  inProgressRoot = null;
}

function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  const flags = finishedWork.flags;
  
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      // ========== 递归处理子树 ==========
      recursivelyTraverseLayoutEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
      );
      
      if (flags & Update) {
        // ========== 执行useLayoutEffect ==========
        commitHookLayoutEffects(finishedWork, HookLayout | HookHasEffect);
      }
      break;
    }
    
    case ClassComponent: {
      recursivelyTraverseLayoutEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
      );
      
      if (flags & Update) {
        // ========== 调用componentDidMount/Update ==========
        commitClassLayoutLifecycles(finishedWork, current);
      }

      if (flags & Callback) {
        // ========== 调用setState callback ==========
        commitClassCallbacks(finishedWork);
      }

      if (flags & Ref) {
        // ========== 更新ref ==========
        safelyAttachRef(finishedWork, finishedWork.return);
      }
      break;
    }
    
    case HostComponent: {
      recursivelyTraverseLayoutEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
      );

      // 首次mount时的特殊处理
      if (current === null) {
        if (flags & Update) {
          commitHostMount(finishedWork);  // 如autoFocus
        }
      }

      if (flags & Ref) {
        safelyAttachRef(finishedWork, finishedWork.return);
      }
      break;
    }
    
    // ... 其他类型
  }
}
```

### commitClassLayoutLifecycles：类组件生命周期

源码：`packages/react-reconciler/src/ReactFiberCommitEffects.js`

```javascript
export function commitClassLayoutLifecycles(
  finishedWork: Fiber,
  current: Fiber | null,
) {
  const instance = finishedWork.stateNode;
  
  if (current === null) {
    // ========== mount阶段：调用componentDidMount ==========
    if (shouldProfile(finishedWork)) {
      startEffectTimer();
      try {
        instance.componentDidMount();
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
      recordEffectDuration(finishedWork);
    } else {
      try {
        instance.componentDidMount();
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
  } else {
    // ========== update阶段：调用componentDidUpdate ==========
    const prevProps = resolveClassComponentProps(
      finishedWork.type,
      current.memoizedProps,
    );
    const prevState = current.memoizedState;
    
    // 获取snapshot（getSnapshotBeforeUpdate的返回值）
    const snapshot = instance.__reactInternalSnapshotBeforeUpdate;
    
    if (shouldProfile(finishedWork)) {
      startEffectTimer();
      try {
        instance.componentDidUpdate(
          prevProps,
          prevState,
          snapshot,
        );
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
      recordEffectDuration(finishedWork);
    } else {
      try {
        instance.componentDidUpdate(
          prevProps,
          prevState,
          snapshot,
        );
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
  }
}
```

### commitHookLayoutEffects：useLayoutEffect

```javascript
export function commitHookLayoutEffects(
  finishedWork: Fiber,
  hookFlags: HookFlags,
) {
  // 注意：useLayoutEffect的cleanup在mutation阶段已经执行了
  // 这里只执行create函数
  
  if (shouldProfile(finishedWork)) {
    startEffectTimer();
    commitHookEffectListMount(hookFlags, finishedWork);
    recordEffectDuration(finishedWork);
  } else {
    commitHookEffectListMount(hookFlags, finishedWork);
  }
}

export function commitHookEffectListMount(
  flags: HookFlags,
  finishedWork: Fiber,
) {
  const updateQueue: FunctionComponentUpdateQueue | null =
    (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    
    do {
      if ((effect.tag & flags) === flags) {
        if (enableSchedulingProfiler) {
          markComponentLayoutEffectMountStarted(finishedWork);
        }
        
        // ========== 执行effect.create() ==========
        const create = effect.create;
        const inst = effect.inst;
        const destroy = create();
        inst.destroy = destroy;  // 保存cleanup函数
        
        if (enableSchedulingProfiler) {
          markComponentLayoutEffectMountStopped();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

---

## 六、passive阶段（异步）

### 调度时机

在commit阶段的最后，React会调度passive effects：

```javascript
// commitRoot中
const subtreeHasPassiveEffects =
  (finishedWork.subtreeFlags & PassiveMask) !== NoFlags;
const rootHasPassiveEffect = (finishedWork.flags & PassiveMask) !== NoFlags;

if (subtreeHasPassiveEffects || rootHasPassiveEffect) {
  // ========== 异步调度useEffect ==========
  scheduleCallback(NormalSchedulerPriority, () => {
    flushPassiveEffects();
    return null;
  });
}
```

### flushPassiveEffects：执行useEffect

```javascript
function flushPassiveEffects(): boolean {
  if (pendingEffectsStatus !== PENDING_PASSIVE_PHASE) {
    return false;
  }

  const root = pendingEffectsRoot;
  const lanes = pendingEffectsLanes;
  pendingEffectsStatus = NO_PENDING_EFFECTS;
  pendingEffectsRoot = null;
  pendingFinishedWork = null;
  pendingEffectsLanes = NoLanes;

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Cannot flush passive effects while already rendering.');
  }

  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;

  // ========== 1. 先执行所有cleanup ==========
  commitPassiveUnmountEffects(root.current);
  
  // ========== 2. 再执行所有create ==========
  commitPassiveMountEffects(
    root,
    root.current,
    lanes,
    transitions,
    renderEndTime,
  );

  executionContext = prevExecutionContext;

  // 可能有新的更新被调度
  flushSyncWorkOnAllRoots();

  return true;
}
```

**cleanup和create的执行顺序**：

```javascript
// 示例
function Parent() {
  useEffect(() => {
    console.log('Parent create');
    return () => console.log('Parent cleanup');
  });
  
  return <Child />;
}

function Child() {
  useEffect(() => {
    console.log('Child create');
    return () => console.log('Child cleanup');
  });
  
  return <div>Child</div>;
}

// 更新时的输出顺序：
// 1. Child cleanup   ← 先执行所有cleanup
// 2. Parent cleanup  ← 深度优先遍历
// 3. Child create    ← 再执行所有create
// 4. Parent create   ← 深度优先遍历

// 为什么这样设计？
// - 确保cleanup在create前完成
// - 避免新旧effect交叉执行
// - 保证资源正确释放
```

---

## 七、完整生命周期顺序

### mount阶段

```
render阶段：
1. constructor
2. getDerivedStateFromProps
3. render
  ↓
commit阶段：
4. React更新DOM
5. componentDidMount  ← layout阶段
6. useLayoutEffect create  ← layout阶段
  ↓
浏览器绘制
  ↓
7. useEffect create  ← passive阶段（异步）
```

### update阶段

```
render阶段：
1. getDerivedStateFromProps
2. shouldComponentUpdate
3. render
  ↓
commit before mutation:
4. getSnapshotBeforeUpdate  ← 读取旧DOM
  ↓
commit mutation:
5. React更新DOM
6. useLayoutEffect cleanup  ← 同步
  ↓
【切换current树】
  ↓
commit layout:
7. componentDidUpdate(prevProps, prevState, snapshot)  ← 访问新树
8. useLayoutEffect create  ← 同步，可能触发新render
  ↓
浏览器绘制（用户看到更新）
  ↓
commit passive:
9. useEffect cleanup  ← 异步
10. useEffect create  ← 异步
```

### unmount阶段

```
commit mutation:
1. componentWillUnmount
2. useLayoutEffect cleanup
3. React移除DOM
  ↓
commit passive:
4. useEffect cleanup  ← 异步
```

---

## 八、实际案例分析

### 案例：带生命周期的TodoList

```javascript
class TodoList extends React.Component {
  listRef = React.createRef();

  getSnapshotBeforeUpdate(prevProps) {
    // before mutation：保存滚动位置
    if (prevProps.todos.length < this.props.todos.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // layout：恢复滚动位置
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  componentWillUnmount() {
    // mutation：组件卸载
    console.log('TodoList unmounting');
  }

  render() {
    return (
      <div ref={this.listRef}>
        {this.props.todos.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    );
  }
}

function TodoItem({ todo }) {
  const itemRef = useRef();

  useLayoutEffect(() => {
    // layout：同步读取布局
    console.log('Item height:', itemRef.current.offsetHeight);
  });

  useEffect(() => {
    // passive：异步执行
    console.log('Item mounted/updated');
    
    return () => {
      console.log('Item cleanup');
    };
  });

  return <div ref={itemRef}>{todo.text}</div>;
}
```

**添加新todo时的执行顺序**：

```
========== render阶段 ==========
1. TodoList.render()
2. TodoItem.render() ← 新的item

========== commit before mutation ==========
3. TodoList.getSnapshotBeforeUpdate()
   → 保存scrollHeight - scrollTop

========== commit mutation ==========
4. 新TodoItem的useLayoutEffect cleanup（无，首次mount）
5. React执行DOM操作
   → 将新item的div插入DOM

========== 切换current树 ==========
root.current = workInProgress树

========== commit layout ==========
6. 新TodoItem useLayoutEffect create
   → console.log('Item height:', ...)
   → 可以同步测量新DOM

7. TodoList.componentDidUpdate(prevProps, prevState, snapshot)
   → 使用snapshot恢复滚动位置

========== 浏览器绘制 ==========
用户看到新的todo item

========== commit passive（异步）==========
8. 新TodoItem useEffect create
   → console.log('Item mounted/updated')
```

---

## 九、flags（副作用标记）

### Flags的定义

源码：`packages/react-reconciler/src/ReactFiberFlags.js`

```javascript
export type Flags = number;

// 核心flags
export const NoFlags = 0b0000000000000000000000000000;
export const PerformedWork = 0b0000000000000000000000000001;
export const Placement = 0b0000000000000000000000000010;  // 插入/移动
export const Update = 0b0000000000000000000000000100;     // 更新
export const ChildDeletion = 0b0000000000000000000010000; // 子节点删除
export const Snapshot = 0b0000000000000000000100000000;   // getSnapshotBeforeUpdate
export const Ref = 0b0000000000000000001000000000;        // ref更新
export const Passive = 0b0000000000000001000000000000;    // useEffect
export const LayoutStatic = 0b0000000000001000000000000;  // useLayoutEffect

// Masks（用于批量检查）
export const BeforeMutationMask = Update | Snapshot;
export const MutationMask = Placement | Update | ChildDeletion | Ref | ...;
export const LayoutMask = Update | Callback | Ref | ...;
export const PassiveMask = Passive | ChildDeletion;
```

### 如何使用flags

```javascript
// 检查是否有某个flag
if ((fiber.flags & Update) !== NoFlags) {
  // 有Update flag
}

// 检查是否有多个flags中的任意一个
if ((fiber.flags & (Update | Ref)) !== NoFlags) {
  // 有Update或Ref
}

// 设置flag
fiber.flags |= Placement;

// 清除flag
fiber.flags &= ~Placement;

// 检查子树是否有某类effects
if ((fiber.subtreeFlags & MutationMask) !== NoFlags) {
  // 子树有mutation effects
  recursivelyTraverseMutationEffects(...);
} else {
  // 子树没有，跳过遍历
}
```

---

## 十、性能优化

### 优化1：subtreeFlags快速跳过

```javascript
// 在completeWork阶段收集subtreeFlags
function bubbleProperties(completedWork: Fiber) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  
  completedWork.subtreeFlags |= subtreeFlags;
}

// 在commit阶段利用subtreeFlags跳过
function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
  // 快速检查
  if ((finishedWork.subtreeFlags & MutationMask) === NoFlags) {
    // 子树没有mutation effects，直接跳过！
    // 不需要遍历子树
  } else {
    // 子树有effects，递归处理
    recursivelyTraverseMutationEffects(root, finishedWork, lanes);
  }
}
```

**性能提升**：

```
场景：1000个组件，只有10个需要DOM更新

没有subtreeFlags：
- 遍历所有1000个组件
- 检查每个组件的flags
- 耗时：~100ms

有subtreeFlags：
- 通过位运算快速判断子树
- 只遍历有effects的路径
- 跳过990个组件
- 耗时：~10ms

性能提升：10倍！
```

### 优化2：批量DOM操作

```javascript
// React不是每个节点单独操作DOM
// 而是收集所有变更，批量执行

// 示例：同时插入3个节点
fiber1.flags |= Placement;
fiber2.flags |= Placement;
fiber3.flags |= Placement;

// commit阶段：
commitMutationEffects() {
  // 遍历一次，执行所有Placement
  commitPlacement(fiber1);  // parent.appendChild(node1)
  commitPlacement(fiber2);  // parent.appendChild(node2)
  commitPlacement(fiber3);  // parent.appendChild(node3)
}

// 浏览器优化：
// 3次appendChild在一次reflow中完成
// 而不是3次独立的reflow
```

---

## 十一、源码关键路径

```
commit阶段核心文件：

packages/react-reconciler/src/
├── ReactFiberWorkLoop.js                   # commit入口
│   ├── commitRoot()                        # commit总入口
│   ├── commitRootImpl()                    # commit实现
│   ├── flushMutationEffects()              # mutation + 切换current
│   ├── flushLayoutEffects()                # layout
│   ├── flushPassiveEffects()               # passive（异步）
│   └── flushPassiveEffectsImpl()           # passive实现
│
├── ReactFiberCommitWork.js                 # commit主文件
│   ├── commitBeforeMutationEffects()       # before mutation入口
│   ├── commitBeforeMutationEffectsOnFiber() # 处理单个Fiber
│   ├── commitMutationEffects()             # mutation入口
│   ├── commitMutationEffectsOnFiber()      # 处理单个Fiber
│   ├── commitReconciliationEffects()       # Placement处理
│   ├── commitDeletionEffects()             # 删除处理
│   ├── commitLayoutEffects()               # layout入口
│   ├── commitLayoutEffectOnFiber()         # 处理单个Fiber
│   ├── commitPassiveUnmountEffects()       # useEffect cleanup
│   └── commitPassiveMountEffects()         # useEffect create
│
├── ReactFiberCommitEffects.js             # 生命周期和effects
│   ├── commitClassSnapshot()               # getSnapshotBeforeUpdate
│   ├── commitClassLayoutLifecycles()       # componentDidMount/Update
│   ├── safelyCallComponentWillUnmount()    # componentWillUnmount
│   ├── commitHookLayoutEffects()           # useLayoutEffect
│   ├── commitHookPassiveMountEffects()     # useEffect create
│   ├── commitHookPassiveUnmountEffects()   # useEffect cleanup
│   └── safelyAttachRef()                   # ref更新
│
└── ReactFiberCommitHostEffects.js         # DOM操作
    ├── commitHostPlacement()               # insertBefore/appendChild
    ├── commitHostUpdate()                  # 更新DOM属性
    ├── commitHostRemoveChild()             # removeChild
    └── commitHostTextUpdate()              # 更新文本内容
```

---

## 十二、面试要点速记

### 快速回答框架

**commit阶段分为几个子阶段？**
1. **before mutation**：读取变更前的DOM
2. **mutation**：执行DOM操作
3. **layout**：读取变更后的DOM
4. **passive**：异步执行useEffect

**各阶段做什么？**
- **before mutation**：getSnapshotBeforeUpdate
- **mutation**：插入/更新/删除DOM，componentWillUnmount，useLayoutEffect cleanup
- **layout**：componentDidMount/Update，useLayoutEffect create，更新ref
- **passive**：useEffect cleanup/create（异步）

**current树什么时候切换？**
- mutation之后，layout之前
- 确保componentWillUnmount访问旧树
- 确保componentDidMount访问新树

**为什么这样分？**
1. **时序要求**：某些生命周期需要读取特定时刻的DOM
2. **语义正确**：componentWillUnmount需要旧实例，componentDidMount需要新实例
3. **性能优化**：批量DOM操作，减少reflow

### 加分项

1. **能说明current树切换的精确时机**：
   - mutation之后，layout之前
   - 源码位置：ReactFiberWorkLoop.js flushMutationEffects

2. **能解释生命周期的执行顺序**：
   - mount：constructor → render → componentDidMount
   - update：render → getSnapshotBeforeUpdate → componentDidUpdate
   - unmount：componentWillUnmount

3. **能对比useEffect和useLayoutEffect**：
   - useLayoutEffect：layout阶段，同步，阻塞
   - useEffect：passive阶段，异步，不阻塞

4. **能说明flags的作用**：
   - 位标记，快速判断
   - subtreeFlags优化遍历

5. **能举实际案例**：
   - getSnapshotBeforeUpdate保存滚动位置
   - useLayoutEffect测量布局
   - DOM批量操作

### 常见追问

**Q: 为什么commit阶段不可中断？**
A:
- commit阶段操作真实DOM
- 中断会导致用户看到不完整的UI
- 必须保证DOM状态一致性
- 同步执行，一次性完成

**Q: useLayoutEffect和useEffect的区别？**
A:
- **执行时机**：useLayoutEffect在layout（同步），useEffect在passive（异步）
- **是否阻塞**：useLayoutEffect阻塞绘制，useEffect不阻塞
- **使用场景**：useLayoutEffect用于DOM测量/同步修改，useEffect用于副作用

**Q: getSnapshotBeforeUpdate和componentDidUpdate的关系？**
A:
- getSnapshotBeforeUpdate在mutation前调用，读取旧DOM
- 返回值作为snapshot传给componentDidUpdate
- componentDidUpdate在layout阶段调用，可以使用snapshot

**Q: ref什么时候更新？**
A:
- ref.current在layout阶段更新
- 调用safelyAttachRef/safelyDetachRef
- 确保ref指向最新的DOM节点
- useLayoutEffect可以立即访问更新后的ref

**Q: 为什么useEffect是异步的？**
A:
- 不阻塞浏览器绘制
- 用户能更快看到更新
- 大部分副作用（数据获取、订阅）不需要同步
- 提升性能和用户体验

**Q: componentWillUnmount能访问DOM吗？**
A:
- 可以，在mutation阶段调用
- 此时DOM还未删除
- 可以读取DOM状态、清理事件监听器等
- DOM删除发生在componentWillUnmount之后

**Q: 同一个组件的多个useEffect执行顺序？**
A:
- 按声明顺序执行
- 先执行所有cleanup
- 再执行所有create
- 示例：effect1 cleanup → effect2 cleanup → effect1 create → effect2 create

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`
- React源码：`packages/react-reconciler/src/ReactFiberCommitWork.js`
- [React生命周期图](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)

**最后更新**: 2025-11-05
