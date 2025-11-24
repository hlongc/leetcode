# 20 - Suspense实现原理详解

> **问题**: Suspense的实现原理是什么？它是如何捕获Promise并处理异步组件的？

---

## 一、Suspense是什么？

**Suspense是React提供的用于处理异步操作的内置组件**，它允许组件在等待异步数据时显示fallback UI。

### 基本用法

```javascript
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userId={123} />
    </Suspense>
  );
}

function UserProfile({ userId }) {
  // use会读取Promise，如果pending则抛出
  const user = use(fetchUser(userId));
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

function Loading() {
  return <div>Loading user...</div>;
}
```

**执行流程**：

```
1. 渲染UserProfile
2. use(fetchUser(123))检测到Promise pending
3. 抛出Promise
4. Suspense捕获Promise
5. 显示fallback（Loading）
6. Promise resolve
7. 重新渲染UserProfile
8. 显示用户信息
```

---

## 二、核心机制：throw/catch

### 1. 组件抛出Promise

源码：`packages/react-reconciler/src/ReactFiberThenable.js`

```javascript
// use Hook的核心实现
export function use<T>(usable: Usable<T>): T {
  if (usable !== null && typeof usable === 'object') {
    if (typeof usable.then === 'function') {
      // ========== 这是Promise/Thenable ==========
      const thenable: Thenable<T> = (usable: any);
      
      // 检查Promise状态
      const index = thenableIndexCounter;
      thenableIndexCounter += 1;
      
      if (thenableState === null) {
        thenableState = createThenableState();
      }
      
      const trackedThenable = trackUsedThenable(thenableState, thenable, index);
      
      // 读取Promise状态
      if (trackedThenable.status === 'fulfilled') {
        // ========== 已完成：返回值 ==========
        return trackedThenable.value;
      } else if (trackedThenable.status === 'rejected') {
        // ========== 已拒绝：抛出错误 ==========
        const rejectedError = trackedThenable.reason;
        throw rejectedError;
      }

      // ========== pending：挂起 ==========
      // 抛出SuspenseException（不是Promise本身）
      // 这是实现细节，防止用户代码捕获
      suspendedThenable = thenable;
      throw SuspenseException;
    }
  }

  // 其他类型（Context等）
  // ...
}
```

**为什么抛出SuspenseException而不是Promise？**

```
问题：如果直接throw promise
try {
  const data = use(promise);  // throw promise
} catch (e) {
  // 用户代码可能捕获Promise
  console.log('caught promise:', e);
}

解决：throw SuspenseException
- SuspenseException是React内部的占位符
- 用户代码不知道这个值
- 只有React的workLoop能捕获
- 真正的Promise保存在suspendedThenable变量中
```

### 2. React捕获异常

源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
// renderRootConcurrent中的try-catch
outer: do {
  try {
    // ========== 正常工作循环 ==========
    workLoopConcurrent();
    break;
  } catch (thrownValue) {
    // ========== 捕获到异常 ==========
    handleThrow(root, thrownValue);
  }
} while (true);

function handleThrow(root: FiberRoot, thrownValue: any): void {
  // 重置Hooks状态
  resetHooksAfterThrow();

  if (
    thrownValue === SuspenseException ||
    thrownValue === SuspenseActionException
  ) {
    // ========== Suspense异常 ==========
    // 获取真正的Promise
    thrownValue = getSuspendedThenable();
    
    // 标记挂起原因
    workInProgressSuspendedReason = SuspendedOnImmediate;
  } else if (thrownValue === SuspenseyCommitException) {
    // Commit阶段的Suspense
    thrownValue = getSuspendedThenable();
    workInProgressSuspendedReason = SuspendedOnInstance;
  } else {
    // 普通错误
    // ...
  }

  // 保存抛出的值
  workInProgressThrownValue = thrownValue;
  
  // 调用throwException处理
  throwException(
    root,
    workInProgress.return,
    workInProgress,
    thrownValue,
    workInProgressRootRenderLanes,
  );
  
  // 完成当前unit
  completeUnitOfWork(workInProgress);
}
```

---

## 三、throwException：处理Suspense

源码：`packages/react-reconciler/src/ReactFiberThrow.js`

```javascript
function throwException(
  root: FiberRoot,
  returnFiber: Fiber | null,
  sourceFiber: Fiber,
  value: mixed,
  rootRenderLanes: Lanes,
): boolean {
  // 标记source fiber为Incomplete
  sourceFiber.flags |= Incomplete;

  // ========== 检查是否是Promise/Thenable ==========
  if (value !== null && typeof value === 'object') {
    if (typeof value.then === 'function') {
      // 这是Promise/Wakeable
      const wakeable: Wakeable = value;
      
      // 重置挂起的组件
      resetSuspendedComponent(sourceFiber, rootRenderLanes);

      // ========== 查找最近的Suspense边界 ==========
      const suspenseBoundary = getSuspenseHandler();
      
      if (suspenseBoundary !== null) {
        switch (suspenseBoundary.tag) {
          case ActivityComponent:
          case SuspenseComponent:
          case SuspenseListComponent: {
            // ========== 找到Suspense边界 ==========
            
            if (sourceFiber.mode & ConcurrentMode) {
              if (getShellBoundary() === null) {
                // 在"shell"中挂起，这是不理想的loading状态
                // 应该避免commit这棵树
                renderDidSuspendDelayIfPossible();
              } else {
                // 在shell之下挂起，可以正常处理
                const current = suspenseBoundary.alternate;
                if (current === null) {
                  renderDidSuspend();
                }
              }
            }

            suspenseBoundary.flags &= ~ForceClientRender;
            
            // ========== 标记Suspense边界 ==========
            markSuspenseBoundaryShouldCapture(
              suspenseBoundary,
              returnFiber,
              sourceFiber,
              root,
              rootRenderLanes,
            );

            // ========== 添加wakeable到retry队列 ==========
            const isSuspenseyResource =
              wakeable === noopSuspenseyCommitThenable;
              
            if (isSuspenseyResource) {
              suspenseBoundary.flags |= ScheduleRetry;
            } else {
              const retryQueue: RetryQueue | null =
                suspenseBoundary.updateQueue;
                
              if (retryQueue === null) {
                // 创建retry队列
                suspenseBoundary.updateQueue = new Set([wakeable]);
              } else {
                // 添加到retry队列
                retryQueue.add(wakeable);
              }

              // ========== 附加ping监听器 ==========
              if (suspenseBoundary.mode & ConcurrentMode) {
                attachPingListener(root, wakeable, rootRenderLanes);
              }
            }
            
            return false;
          }
        }
      }
      
      // 没有找到Suspense边界，向上抛出
      // ...
    }
  }

  // 不是Promise，是普通错误
  // ...
}
```

### markSuspenseBoundaryShouldCapture：标记Suspense

```javascript
function markSuspenseBoundaryShouldCapture(
  suspenseBoundary: Fiber,
  returnFiber: Fiber | null,
  sourceFiber: Fiber,
  root: FiberRoot,
  rootRenderLanes: Lanes,
): Fiber | null {
  // ========== 标记ShouldCapture flag ==========
  suspenseBoundary.flags |= ShouldCapture;
  suspenseBoundary.lanes = rootRenderLanes;
  
  return suspenseBoundary;
}
```

---

## 四、attachPingListener：附加ping监听器

源码：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
export function attachPingListener(
  root: FiberRoot,
  wakeable: Wakeable,
  lanes: Lanes,
) {
  // ========== 检查pingCache ==========
  // pingCache用于防止重复附加监听器
  let pingCache = root.pingCache;
  let threadIDs;
  
  if (pingCache === null) {
    // 创建pingCache
    pingCache = root.pingCache = new PossiblyWeakMap();
    threadIDs = new Set<mixed>();
    pingCache.set(wakeable, threadIDs);
  } else {
    threadIDs = pingCache.get(wakeable);
    if (threadIDs === undefined) {
      threadIDs = new Set();
      pingCache.set(wakeable, threadIDs);
    }
  }
  
  // ========== 检查是否已经附加过 ==========
  if (!threadIDs.has(lanes)) {
    workInProgressRootDidAttachPingListener = true;

    // 记录lanes（作为"thread ID"）
    threadIDs.add(lanes);
    
    // ========== 创建ping函数 ==========
    const ping = pingSuspendedRoot.bind(null, root, wakeable, lanes);
    
    // ========== 附加then监听器 ==========
    wakeable.then(ping, ping);  // resolve和reject都调用ping
  }
}

function pingSuspendedRoot(
  root: FiberRoot,
  wakeable: Wakeable,
  pingedLanes: Lanes,
) {
  // ========== Promise resolve后的处理 ==========
  
  // 1. 清理pingCache
  const pingCache = root.pingCache;
  if (pingCache !== null) {
    // wakeable已解决，不再需要memoize
    pingCache.delete(wakeable);
  }

  // 2. 标记pingedLanes
  markRootPinged(root, pingedLanes);

  // 3. Profiling
  if (enableProfilerTimer && enableComponentPerformanceTrack) {
    startPingTimerByLanes(pingedLanes);
  }

  // 4. 检查是否可以重新render
  if (
    workInProgressRoot === root &&
    includesSomeLane(workInProgressRootRenderLanes, pingedLanes)
  ) {
    // 当前正在render这个root，且lanes匹配
    
    if (
      workInProgressRootExitStatus === RootSuspendedWithDelay ||
      (workInProgressRootExitStatus === RootSuspended &&
        includesOnlyRetries(workInProgressRootRenderLanes) &&
        now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS)
    ) {
      // ========== 强制重新render ==========
      // 中断当前render，重新开始
      prepareFreshStack(root, NoLanes);
    } else {
      // ========== 标记pinged，继续当前render ==========
      workInProgressRootPingedLanes = mergeLanes(
        workInProgressRootPingedLanes,
        pingedLanes,
      );
    }
  }

  // 5. 调度新的render
  ensureRootIsScheduled(root);
}
```

**ping机制的作用**：

```
pingCache的结构：
WeakMap {
  promise1 => Set([SyncLane, DefaultLane]),
  promise2 => Set([TransitionLane1]),
}

为什么需要pingCache？
1. 防止重复附加监听器
2. 一个Promise可能被多个Suspense boundary使用
3. 一个Suspense可能在不同lanes下render
4. 使用lanes作为"thread ID"区分

示例：
render1: TransitionLane，UserProfile挂起
  → attachPingListener(promise, TransitionLane)
  → pingCache.set(promise, Set([TransitionLane]))

render2: SyncLane，UserProfile挂起（同一个promise）
  → 检查pingCache
  → threadIDs = Set([TransitionLane])
  → threadIDs.has(SyncLane) = false
  → 添加新的监听器
  → threadIDs.add(SyncLane)
  → 现在Set([TransitionLane, SyncLane])

Promise resolve:
  → 触发所有监听器
  → pingSuspendedRoot(root, promise, TransitionLane)
  → pingSuspendedRoot(root, promise, SyncLane)
```

---

## 五、updateSuspenseComponent：渲染Suspense

源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`

```javascript
function updateSuspenseComponent(
  current: null | Fiber,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  const nextProps = workInProgress.pendingProps;

  // ========== 1. 检查是否应该显示fallback ==========
  let showFallback = false;
  const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
  
  if (
    didSuspend ||
    shouldRemainOnFallback(current, workInProgress, renderLanes)
  ) {
    // 捕获到挂起，或者应该保持fallback
    showFallback = true;
    workInProgress.flags &= ~DidCapture;  // 清除DidCapture flag
  }

  // ========== 2. 检查是否有deferred work ==========
  const didPrimaryChildrenDefer = (workInProgress.flags & DidDefer) !== NoFlags;
  workInProgress.flags &= ~DidDefer;

  // ========== 3. 处理mount阶段 ==========
  if (current === null) {
    // Mount阶段
    const nextPrimaryChildren = nextProps.children;
    const nextFallbackChildren = nextProps.fallback;

    if (showFallback) {
      // ========== 显示fallback ==========
      pushFallbackTreeSuspenseHandler(workInProgress);
      
      // 创建两个子树：primary（隐藏）和fallback（显示）
      const fallbackFragment = mountSuspenseFallbackChildren(
        workInProgress,
        nextPrimaryChildren,
        nextFallbackChildren,
        renderLanes,
      );
      
      const primaryChildFragment: Fiber = workInProgress.child;
      primaryChildFragment.memoizedState =
        mountSuspenseOffscreenState(renderLanes);
      primaryChildFragment.childLanes = getRemainingWorkInPrimaryTree(
        current,
        didPrimaryChildrenDefer,
        renderLanes,
      );
      workInProgress.memoizedState = SUSPENDED_MARKER;
      
      return fallbackFragment;
    } else {
      // ========== 显示primary ==========
      pushPrimaryTreeSuspenseHandler(workInProgress);
      
      return mountSuspensePrimaryChildren(
        workInProgress,
        nextPrimaryChildren,
        renderLanes,
      );
    }
  } else {
    // Update阶段
    // ...
  }
}
```

### mountSuspenseFallbackChildren：创建fallback子树

```javascript
function mountSuspenseFallbackChildren(
  workInProgress: Fiber,
  primaryChildren: $FlowFixMe,
  fallbackChildren: $FlowFixMe,
  renderLanes: Lanes,
) {
  const mode = workInProgress.mode;

  // ========== 1. 创建primary子树（隐藏）==========
  const primaryChildProps: OffscreenProps = {
    mode: 'hidden',  // 隐藏状态
    children: primaryChildren,
  };

  const primaryChildFragment = mountWorkInProgressOffscreenFiber(
    primaryChildProps,
    mode,
    NoLanes,  // 不处理，因为是隐藏的
  );
  
  // ========== 2. 创建fallback子树（显示）==========
  const fallbackChildFragment = createFiberFromFragment(
    fallbackChildren,
    mode,
    renderLanes,  // 使用当前renderLanes
    null,
  );

  // ========== 3. 建立链接 ==========
  primaryChildFragment.return = workInProgress;
  fallbackChildFragment.return = workInProgress;
  primaryChildFragment.sibling = fallbackChildFragment;
  workInProgress.child = primaryChildFragment;
  
  // ========== 4. 返回fallback（会被render）==========
  return fallbackChildFragment;
}
```

**Suspense的Fiber树结构**：

```
显示fallback时：
Suspense Fiber
├─ child → OffscreenComponent (primary, mode='hidden')
│          ├─ child → UserProfile (不可见)
│          └─ sibling → Fragment (fallback, 可见)
│                       └─ child → Loading

显示primary时：
Suspense Fiber
└─ child → OffscreenComponent (primary, mode='visible')
           └─ child → UserProfile (可见)

注意：
- primary始终存在，只是mode不同
- fallback是临时的，resolve后被删除
- OffscreenComponent控制子树的可见性
```

---

## 六、Promise resolve后的流程

### 完整时序

```
========== 1. 初始render ==========

t=0: 渲染App
  → Suspense
  → UserProfile
  → use(fetchUser(123))

t=1: fetchUser返回pending Promise
  → use检测到pending
  → throw SuspenseException

t=2: handleThrow捕获
  → thrownValue = promise
  → throwException(...)
    → getSuspenseHandler() → Suspense Fiber
    → suspenseBoundary.flags |= ShouldCapture
    → attachPingListener(root, promise, lanes)
      promise.then(ping, ping)
    → suspenseBoundary.updateQueue = Set([promise])

t=3: completeUnitOfWork
  → 向上遍历到Suspense
  → 检测到ShouldCapture flag

t=4: beginWork(Suspense)
  → updateSuspenseComponent
  → didSuspend = (flags & DidCapture) !== NoFlags ✓
  → showFallback = true
  → mountSuspenseFallbackChildren
    创建primary（hidden）和fallback子树

t=5: render完成
  → Suspense.child = Offscreen(primary, hidden)
  → Offscreen.sibling = Fragment(fallback)

t=6: commit
  → 显示Loading

========== 2. Promise resolve ==========

t=100: fetchUser Promise resolve
  → promise.then(ping, ping)触发
  → ping = pingSuspendedRoot(root, promise, lanes)

t=101: pingSuspendedRoot
  → pingCache.delete(promise)
  → markRootPinged(root, lanes)
    root.pingedLanes |= lanes
  → ensureRootIsScheduled(root)

t=102: 调度新render
  → getNextLanes(root, NoLanes)
  → 包含pingedLanes
  → 调度render

========== 3. 重新render ==========

t=110: renderRootConcurrent
  → workLoopConcurrent

t=111: UserProfile重新render
  → use(fetchUser(123))
  → promise.status = 'fulfilled'
  → 返回user对象
  → 不抛出异常！

t=112: Suspense的beginWork
  → didSuspend = false（没有DidCapture flag）
  → showFallback = false
  → updateSuspensePrimaryChildren
    → 删除fallback fragment
    → primary.mode = 'visible'

t=113: render完成
  → Suspense.child = Offscreen(primary, visible)
  → UserProfile可见

t=114: commit
  → 显示UserProfile
  → 删除Loading
```

---

## 七、Suspense的状态管理

### SuspenseState

```javascript
type SuspenseState = {
  alreadyCaptured: boolean,  // 是否已经捕获过
  didTimeout: boolean,       // 是否已超时
  timedOutAt: number,        // 超时时间
};

// Suspense Fiber.memoizedState
const SUSPENDED_MARKER = {
  dehydrated: null,
  treeContext: null,
  retryLane: NoLane,
};

// 使用示例
workInProgress.memoizedState = SUSPENDED_MARKER;  // 标记已挂起
```

### Flags的使用

```javascript
// Suspense相关的flags
ShouldCapture  // 应该捕获（throwException设置）
DidCapture     // 已经捕获（beginWork检测并清除）
ScheduleRetry  // 需要重试

// 流程
throwException:
  suspenseBoundary.flags |= ShouldCapture

unwindWork:
  if (flags & ShouldCapture) {
    flags = (flags & ~ShouldCapture) | DidCapture
    return workInProgress  // 重新进入beginWork
  }

beginWork(Suspense):
  didSuspend = (flags & DidCapture) !== NoFlags
  if (didSuspend) {
    showFallback = true
    flags &= ~DidCapture  // 清除
  }
```

---

## 八、完整案例：数据获取

### 代码示例

```javascript
// 缓存系统
const cache = new Map();

function fetchUser(userId) {
  if (cache.has(userId)) {
    return cache.get(userId);
  }
  
  const promise = fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => {
      promise.status = 'fulfilled';
      promise.value = data;
      return data;
    })
    .catch(error => {
      promise.status = 'rejected';
      promise.reason = error;
      throw error;
    });
  
  promise.status = 'pending';
  cache.set(userId, promise);
  return promise;
}

function UserProfile({ userId }) {
  const user = use(fetchUser(userId));
  
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState(123);
  
  return (
    <>
      <button onClick={() => setUserId(456)}>Switch User</button>
      
      <Suspense fallback={<Spinner />}>
        <UserProfile userId={userId} />
      </Suspense>
    </>
  );
}
```

### 执行流程（75步）

```
========== 首次渲染 ==========

1. render(<App />)
2. Suspense beginWork
3. UserProfile beginWork
4. use(fetchUser(123))
   → cache miss
   → 创建promise
   → promise.status = 'pending'
   → throw SuspenseException

5. handleThrow捕获
   → getSuspendedThenable() → promise
   → throwException
     → getSuspenseHandler() → Suspense Fiber
     → suspenseBoundary.flags |= ShouldCapture
     → attachPingListener(root, promise, SyncLane)
       promise.then(ping, ping)

6. completeUnitOfWork(UserProfile)
   → 向上遍历

7. 到达Suspense，检测到ShouldCapture
   → unwindWork
   → flags = (flags & ~ShouldCapture) | DidCapture
   → 返回Suspense（重新进入beginWork）

8. beginWork(Suspense)
   → didSuspend = (flags & DidCapture) ✓
   → showFallback = true
   → mountSuspenseFallbackChildren
     → 创建Offscreen(primary, hidden)
     → 创建Fragment(fallback)

9. render完成
   → Suspense.memoizedState = SUSPENDED_MARKER
   → Suspense.child = Offscreen → UserProfile（隐藏）
   → Offscreen.sibling = Fragment → Spinner（显示）

10. commit
   → 用户看到Spinner

========== Promise resolve ==========

t=500ms: fetch完成
   → promise.status = 'fulfilled'
   → promise.value = userData
   → promise.then的回调触发
   → ping(root, promise, SyncLane)

11. pingSuspendedRoot
   → pingCache.delete(promise)
   → markRootPinged(root, SyncLane)
     root.pingedLanes |= SyncLane
   → ensureRootIsScheduled(root)

12. 调度新render

========== 重新render ==========

13. renderRootConcurrent
   → workLoopConcurrent

14. UserProfile beginWork
   → use(fetchUser(123))
   → cache hit
   → promise.status = 'fulfilled'
   → 返回userData
   → 不抛出异常！

15. Suspense beginWork
   → didSuspend = false
   → showFallback = false
   → updateSuspensePrimaryChildren
     → Offscreen.mode = 'visible'
     → 删除fallback fragment

16. render完成
   → Suspense.memoizedState = null
   → Suspense.child = Offscreen → UserProfile（可见）

17. commit
   → 删除Spinner
   → 显示UserProfile

========== 切换用户 ==========

18. 点击Switch User
   → setUserId(456)

19. UserProfile重新render
   → use(fetchUser(456))
   → cache miss
   → 新的promise pending
   → throw SuspenseException

20. 又走一遍挂起流程
   → 显示Spinner
   → 等待新Promise
   → resolve后显示新用户
```

---

## 九、Suspense vs ErrorBoundary

### 对比

| 特性 | Suspense | ErrorBoundary |
|------|----------|---------------|
| **捕获内容** | Promise（异步数据） | Error（错误） |
| **触发方式** | throw promise | throw error |
| **降级UI** | fallback prop | static getDerivedStateFromError |
| **恢复** | Promise resolve后自动 | 需要重新渲染 |
| **标记** | ShouldCapture → DidCapture | ShouldCapture → DidCapture |
| **用途** | 数据加载、代码分割 | 错误处理 |

### 共同点

```
都使用throw/catch机制：
1. 组件throw value
2. React捕获
3. 向上查找边界
4. 标记ShouldCapture
5. unwindWork转换为DidCapture
6. beginWork检测DidCapture
7. 显示降级UI
```

---

## 十、源码关键路径

```
Suspense核心文件：

packages/react-reconciler/src/
├── ReactFiberThenable.js               # use Hook
│   ├── use()                           # 检测Promise状态
│   └── getSuspendedThenable()          # 获取挂起的Promise
│
├── ReactFiberThrow.js                  # 异常处理
│   ├── throwException()                # 处理抛出的Promise
│   ├── getSuspenseHandler()            # 查找Suspense边界
│   └── markSuspenseBoundaryShouldCapture() # 标记边界
│
├── ReactFiberBeginWork.js              # Suspense组件
│   ├── updateSuspenseComponent()       # Suspense的beginWork
│   ├── mountSuspensePrimaryChildren()  # mount primary
│   ├── mountSuspenseFallbackChildren() # mount fallback
│   ├── updateSuspensePrimaryChildren() # update primary
│   └── updateSuspenseFallbackChildren()# update fallback
│
├── ReactFiberWorkLoop.js               # ping机制
│   ├── handleThrow()                   # 捕获异常
│   ├── attachPingListener()            # 附加监听器
│   └── pingSuspendedRoot()             # Promise resolve回调
│
└── ReactFiberUnwindWork.js             # unwind处理
    └── unwindWork()                    # ShouldCapture → DidCapture
```

---

## 十一、面试要点速记

### 快速回答框架

**Suspense的工作原理？**
1. 组件抛出Promise（throw）
2. React捕获Promise（catch）
3. 查找最近的Suspense边界
4. 标记边界ShouldCapture
5. 重新渲染Suspense，显示fallback
6. Promise resolve后ping
7. 重新渲染，显示真实内容

**核心机制？**
- **throw/catch**：异常捕获机制
- **flags**：ShouldCapture、DidCapture
- **ping监听器**：Promise.then(ping)
- **双子树**：primary（hidden）+ fallback（visible）

**与ErrorBoundary的区别？**
- Suspense捕获Promise，ErrorBoundary捕获Error
- Suspense自动恢复，ErrorBoundary需要手动
- 都使用throw/catch和flags机制

**use Hook的作用？**
- 检查Promise状态
- fulfilled → 返回值
- rejected → 抛出错误
- pending → 抛出SuspenseException

### 加分项

1. **能说明双子树结构**：
   - Offscreen(primary, hidden)
   - Fragment(fallback, visible)
   - mode控制可见性

2. **能解释ping机制**：
   - attachPingListener附加监听器
   - pingCache防止重复
   - pingSuspendedRoot触发重新render

3. **能说明flags的转换**：
   - ShouldCapture（throwException）
   - unwindWork转换
   - DidCapture（updateSuspenseComponent）

4. **能举完整案例**：
   - 数据获取的75步流程
   - 切换用户的挂起流程

### 常见追问

**Q: Suspense可以嵌套吗？**
A:
- 可以，getSuspenseHandler查找最近的边界
- 内层Suspense捕获内层Promise
- 外层Suspense捕获外层Promise
- 各自独立处理

**Q: 多个组件同时挂起怎么办？**
A:
- 每个Promise都会触发throwException
- 都会被同一个Suspense捕获
- Suspense.updateQueue是Set，存储所有promises
- 所有Promise都resolve后才显示内容

**Q: Suspense会影响性能吗？**
A:
- throw/catch有轻微开销
- 但好处远大于开销
- 用户看到loading状态，体验更好
- 避免空白页面或闪烁

**Q: 为什么不直接throw Promise？**
A:
- 防止用户代码捕获
- throw SuspenseException（内部占位符）
- 真实Promise保存在suspendedThenable
- 只有React的workLoop能处理

**Q: Suspense可以用于数据获取以外的场景吗？**
A:
- 可以，任何异步操作都可以
- React.lazy（代码分割）
- 图片加载
- 字体加载
- 任何返回Promise的操作

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberThenable.js`
- React源码：`packages/react-reconciler/src/ReactFiberThrow.js`
- React源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`
- [Suspense文档](https://react.dev/reference/react/Suspense)
- [use Hook RFC](https://github.com/reactjs/rfcs/pull/229)

**最后更新**: 2025-11-05
