# 01 - Fiber架构详解

> **问题**: 请详细解释React 16之后的Fiber架构是什么？它解决了什么问题？Fiber节点包含哪些关键属性？

---

## 一、Fiber架构是什么？

**Fiber是React 16引入的全新协调引擎（Reconciler）架构**，它的核心是一种数据结构，代表着一个工作单元（Unit of Work）。

### 源码中的Fiber类型定义

从源码 `packages/react-reconciler/src/ReactInternalTypes.js` 可以看到Fiber的完整定义：

```typescript
// A Fiber is work on a Component that needs to be done or was done. 
// There can be more than one per component.
export type Fiber = {
  // Instance标识
  tag: WorkTag,                    // Fiber节点类型
  key: null | string,              // React元素的key
  elementType: any,                // 元素类型
  type: any,                       // 组件类型（函数/类/标签名）
  stateNode: any,                  // 真实DOM节点或组件实例

  // Fiber树结构（链表）
  return: Fiber | null,            // 父Fiber（返回地址）
  child: Fiber | null,             // 第一个子Fiber
  sibling: Fiber | null,           // 下一个兄弟Fiber
  index: number,                   // 在父节点中的索引

  // 引用
  ref: ...,                        // ref引用
  refCleanup: null | (() => void), // ref清理函数

  // 状态与Props
  pendingProps: any,               // 新的props（待处理）
  memoizedProps: any,              // 上次渲染的props
  updateQueue: mixed,              // 更新队列
  memoizedState: any,              // 上次渲染的state（Hooks链表存这里）
  dependencies: Dependencies | null, // 依赖（Context等）

  // 模式
  mode: TypeOfMode,                // 并发模式/严格模式等

  // 副作用
  flags: Flags,                    // 当前Fiber的副作用标记
  subtreeFlags: Flags,             // 子树的副作用标记
  deletions: Array<Fiber> | null,  // 需要删除的子节点

  // 优先级
  lanes: Lanes,                    // 当前Fiber的更新优先级
  childLanes: Lanes,               // 子树的更新优先级

  // 双缓存核心
  alternate: Fiber | null,         // 指向另一棵树的对应节点

  // 性能分析（Profiler）
  actualDuration?: number,
  actualStartTime?: number,
  selfBaseDuration?: number,
  treeBaseDuration?: number,
  ...
};
```

**关键理解**：
- Fiber既是一个**数据结构**（描述组件实例和DOM节点）
- 也是一个**工作单元**（包含了需要执行的工作信息）

---

## 二、Fiber解决了什么问题？

### React 15 的Stack Reconciler存在的问题

#### 问题1: 不可中断的递归更新
```javascript
// React 15的协调过程（简化示意）
function reconcile(vdom) {
  // 一旦开始就无法停止
  diff(vdom);
  updateDOM();
  reconcileChildren(vdom.children); // 递归
}
```

**后果**：
- 大型组件树更新可能耗时几百毫秒
- 主线程被阻塞，页面无法响应
- 用户看到的是卡顿、掉帧

#### 问题2: 无法实现优先级调度
- 所有更新同等重要，无法区分
- 用户输入、动画、数据请求都是同步执行
- 无法实现"打断低优先级任务，优先处理高优先级任务"

#### 问题3: CPU密集型操作阻塞用户交互
```javascript
// 假设渲染1000个复杂组件
function LargeList() {
  return items.map(item => <ComplexItem key={item.id} />);
}
// React 15: 一次性渲染完1000个，主线程被占用
// 用户点击、滚动都无响应
```

### Fiber架构的解决方案

#### 解决方案1: 可中断的递归 → 可中断的循环

**核心改变**：将递归改为循环，每次循环处理一个Fiber节点

```javascript
// React 16+ Fiber的工作循环（简化）
function workLoop() {
  while (workInProgress !== null && !shouldYield()) {
    // shouldYield检查是否需要让出控制权
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function shouldYield() {
  // 检查当前帧是否还有剩余时间
  return getCurrentTime() >= deadline;
}
```

**源码位置**：`packages/react-reconciler/src/ReactFiberWorkLoop.js`

```javascript
// 全局变量：当前正在工作的Fiber
let workInProgress: Fiber | null = null;

// 工作循环
function renderRootSync(root, lanes) {
  // ...
  workLoopSync();
  // ...
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent() {
  // 并发模式：可中断
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

#### 解决方案2: 时间切片（Time Slicing）

**核心思想**：
1. 将渲染工作拆分成多个小任务
2. 每个任务执行5ms左右
3. 浏览器有机会处理高优先级任务（用户输入、渲染等）

```
时间轴示意：
|-- Fiber1 --|-- 浏览器渲染 --|-- Fiber2 --|-- 用户输入 --|-- Fiber3 --|
   (5ms)                        (5ms)                      (5ms)
```

#### 解决方案3: 优先级调度

**Lane模型**：支持31个优先级级别

```javascript
// packages/react-reconciler/src/ReactFiberLane.js
export const SyncLane = 0b0000000000000000000000000000001;       // 同步优先级（最高）
export const InputContinuousLane = 0b0000000000000000000000000000100; // 连续输入
export const DefaultLane = 0b0000000000000000000000000010000;   // 默认优先级
export const TransitionLane1 = 0b0000000000000000000000001000000; // 过渡动画
// ... 更多优先级
```

**优先级示例**：
```javascript
function SearchBox() {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    // 高优先级：用户输入立即响应
    setQuery(e.target.value); 
    
    // 低优先级：搜索结果可以稍后渲染
    startTransition(() => {
      fetchAndRenderResults(e.target.value);
    });
  };

  return <input value={query} onChange={handleChange} />;
}
```

---

## 三、Fiber节点的关键属性详解

### 1. 节点类型标识

**tag: WorkTag** - 标识Fiber节点的类型

源码：`packages/react-reconciler/src/ReactWorkTags.js`

```javascript
export const FunctionComponent = 0;       // 函数组件
export const ClassComponent = 1;          // 类组件
export const HostRoot = 3;                // 根节点
export const HostComponent = 5;           // 原生DOM节点（div、span等）
export const HostText = 6;                // 文本节点
export const Fragment = 7;                // Fragment
export const ContextProvider = 10;        // Context.Provider
export const ForwardRef = 11;             // forwardRef
export const Profiler = 12;               // Profiler
export const SuspenseComponent = 13;      // Suspense
export const MemoComponent = 14;          // React.memo
// ... 共31种类型
```

**实际应用**：React通过tag快速判断如何处理Fiber节点

```javascript
// 源码中的使用示例
function beginWork(current, workInProgress, renderLanes) {
  switch (workInProgress.tag) {
    case FunctionComponent: {
      return updateFunctionComponent(current, workInProgress, ...);
    }
    case ClassComponent: {
      return updateClassComponent(current, workInProgress, ...);
    }
    case HostComponent: {
      return updateHostComponent(current, workInProgress, ...);
    }
    // ...
  }
}
```

### 2. 树结构属性（链表结构）

**为什么用链表而不是数组？**
- 链表可以方便地暂停和恢复遍历
- 添加/删除节点时不需要移动其他元素
- 适合深度优先遍历

```javascript
// Fiber树的链表结构
return: Fiber | null;    // 父节点（相当于函数调用栈的返回地址）
child: Fiber | null;     // 第一个子节点
sibling: Fiber | null;   // 下一个兄弟节点
index: number;           // 在父节点中的索引
```

**遍历示意**：

```javascript
// JSX结构
<div>
  <h1>Title</h1>
  <p>Content</p>
  <button>Click</button>
</div>

// Fiber树结构（简化）
divFiber
  ├─ child → h1Fiber
              ├─ sibling → pFiber
                            ├─ sibling → buttonFiber
                                          └─ sibling → null
  └─ return ← (所有子节点的return都指向divFiber)

// 深度优先遍历代码
function performUnitOfWork(fiber) {
  // 1. 处理当前节点
  beginWork(fiber);
  
  // 2. 如果有子节点，返回子节点
  if (fiber.child) {
    return fiber.child;
  }
  
  // 3. 如果没有子节点，查找兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    completeWork(nextFiber);
    
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    
    // 4. 没有兄弟节点，返回父节点
    nextFiber = nextFiber.return;
  }
  
  return null;
}
```

### 3. 状态与Props属性

```javascript
pendingProps: any;        // 新的props（即将处理）
memoizedProps: any;       // 上次渲染使用的props
memoizedState: any;       // 上次渲染的state
updateQueue: mixed;       // 更新队列
```

**重要理解**：

**memoizedState的不同含义**：
- 对于**ClassComponent**：存储class组件的state对象
- 对于**FunctionComponent**：存储Hooks链表的第一个Hook
- 对于**HostRoot**：存储待渲染的元素

```javascript
// 函数组件的memoizedState存储Hooks链表
function FunctionComponent() {
  const [count, setCount] = useState(0);    // Hook1
  const [name, setName] = useState('');     // Hook2
  useEffect(() => {}, []);                  // Hook3
  
  // fiber.memoizedState → Hook1 → Hook2 → Hook3 → null
}
```

**updateQueue**：存储setState产生的update对象

```javascript
// updateQueue的结构
const updateQueue = {
  baseState: {},           // 基础state
  firstBaseUpdate: null,   // 第一个未处理的update
  lastBaseUpdate: null,    // 最后一个未处理的update
  shared: {
    pending: null,         // 新的update（环形链表）
  },
  effects: null,           // 副作用
};
```

### 4. 副作用标记（Effects）

```javascript
flags: Flags;                    // 当前节点的副作用
subtreeFlags: Flags;             // 子树的副作用
deletions: Array<Fiber> | null;  // 需要删除的子节点
```

**常见的flags**（位运算标记）：

```javascript
// packages/react-reconciler/src/ReactFiberFlags.js
export const NoFlags = 0b00000000000000000000000000;
export const Placement = 0b00000000000000000000000010;    // 插入
export const Update = 0b00000000000000000000000100;       // 更新
export const Deletion = 0b00000000000000000000001000;     // 删除
export const ChildDeletion = 0b00000000000000000000010000; // 子节点删除
export const Passive = 0b00000000000000010000000000;      // useEffect
export const LayoutMask = Placement | Update;             // Layout阶段的副作用
```

**使用示意**：

```javascript
// 标记节点需要插入
fiber.flags |= Placement;

// 检查是否有更新
if (fiber.flags & Update) {
  // 执行更新操作
}

// subtreeFlags优化：快速判断子树是否有副作用
if ((fiber.subtreeFlags & MutationMask) === NoFlags) {
  // 子树没有副作用，跳过
  return;
}
```

### 5. 优先级相关

```javascript
lanes: Lanes;         // 当前Fiber的更新优先级
childLanes: Lanes;    // 子树中的更新优先级
```

**Lane模型**：使用二进制位表示优先级

```javascript
// 优先级判断示例
function includesSomeLane(a: Lanes, b: Lanes): boolean {
  return (a & b) !== NoLanes;
}

// 合并优先级
function mergeLanes(a: Lanes, b: Lanes): Lanes {
  return a | b;
}
```

### 6. 双缓存机制核心

```javascript
alternate: Fiber | null;  // 指向另一棵树的对应节点
```

**双缓存机制**是Fiber架构的核心设计之一。

**源码实现**：`packages/react-reconciler/src/ReactFiber.js`

```javascript
// 创建workInProgress树
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次创建alternate
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    // 建立双向引用
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已有的alternate
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    
    // 清空副作用
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  // 复制其他属性
  workInProgress.flags = current.flags & StaticMask;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  // ...

  return workInProgress;
}
```

**双缓存工作流程**：

```
初始状态：
  FiberRootNode.current → currentTree
  
更新开始：
  基于currentTree创建workInProgressTree
  currentFiber.alternate → workInProgressFiber
  workInProgressFiber.alternate → currentFiber
  
更新进行中：
  在workInProgressTree上进行所有修改
  currentTree保持不变（用户看到的还是旧页面）
  
更新完成（commit阶段）：
  FiberRootNode.current = workInProgressTree  // 切换指针
  workInProgressTree变成新的currentTree
  旧的currentTree变成新的workInProgressTree（待复用）
```

**为什么需要双缓存？**
1. **避免闪烁**：在内存中构建完整的新树，一次性切换
2. **可中断**：即使中断更新，current树仍然完整可用
3. **性能优化**：复用Fiber节点，减少内存分配

---

## 四、实际应用场景分析

### 场景1：大型列表渲染优化

```javascript
// 渲染10000个复杂组件
function LargeList() {
  const items = Array(10000).fill(0).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: 'Complex component with heavy calculation'
  }));

  return (
    <div>
      {items.map(item => (
        <ComplexItem key={item.id} {...item} />
      ))}
    </div>
  );
}

function ComplexItem({ id, name, description }) {
  // 假设这里有复杂的计算
  const result = heavyCalculation(id);
  
  return (
    <div>
      <h3>{name}</h3>
      <p>{description}</p>
      <span>{result}</span>
    </div>
  );
}
```

**React 15的问题**：
- 一次性创建10000个组件的VDOM并协调
- 假设每个组件耗时0.1ms，总计1000ms
- 主线程被阻塞1秒，页面完全卡死

**Fiber的解决**：
```
时间切片执行：
Frame1: 处理Item 0-50    (5ms) → 让出控制权
Frame2: 处理Item 51-100  (5ms) → 让出控制权
Frame3: 处理Item 101-150 (5ms) → 让出控制权
...
期间用户可以滚动、点击，页面保持响应
```

### 场景2：实时输入框与搜索

```javascript
function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    
    // 高优先级：输入框立即更新
    setQuery(value);
    
    // 低优先级：搜索结果可以慢慢渲染
    startTransition(() => {
      setIsSearching(true);
      performSearch(value).then(data => {
        setResults(data);
        setIsSearching(false);
      });
    });
  };

  return (
    <div>
      <input 
        value={query} 
        onChange={handleChange}
        placeholder="Search..."
      />
      
      {isSearching && <Spinner />}
      
      <ResultsList results={results} />
    </div>
  );
}
```

**Fiber优势**：
- 输入框更新是**SyncLane**（最高优先级），立即执行
- 搜索结果渲染是**TransitionLane**（低优先级）
- 如果用户继续输入，会打断搜索结果的渲染，优先处理新输入
- 用户体验：输入流畅，不会因为结果渲染而卡顿

### 场景3：动画与数据更新并发

```javascript
function AnimatedDashboard() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 每秒更新大量数据
    const timer = setInterval(() => {
      fetchLargeDataset().then(newData => {
        startTransition(() => {
          setData(newData); // 低优先级
        });
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* 高优先级：60fps的平滑动画 */}
      <SmoothAnimation />
      
      {/* 低优先级：可以被打断的数据渲染 */}
      <DataTable data={data} />
    </div>
  );
}
```

**Fiber优势**：
- 动画更新优先级高，保证60fps流畅度
- 数据表格渲染优先级低，分片执行
- 动画不会因为数据渲染而掉帧

### 场景4：Suspense异步渲染

```javascript
function UserProfile({ userId }) {
  // 读取异步数据（会抛出Promise）
  const user = useData(`/api/users/${userId}`);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userId={123} />
    </Suspense>
  );
}
```

**Fiber如何支持Suspense**：
1. UserProfile组件抛出Promise
2. Fiber捕获Promise，标记此Fiber为Suspended状态
3. 渲染fallback内容（Loading组件）
4. Promise resolve后，React重新调度UserProfile的渲染
5. 使用双缓存机制，无缝切换到真实内容

---

## 五、核心设计亮点总结

### 1. 数据结构设计
- **链表结构**：天然支持遍历的暂停和恢复
- **双向引用**：return指向父节点，实现快速回溯
- **最小化内存**：复用stateNode，共享不变的属性

### 2. 双缓存机制
- **类似显卡的双缓冲**：前台显示current树，后台构建workInProgress树
- **原子切换**：commit阶段一次性切换根指针
- **节省内存**：alternate相互复用，无需每次都创建新对象

### 3. 副作用收集
- **位运算标记**：高效的flags机制
- **subtreeFlags优化**：快速判断子树是否有副作用，避免无谓遍历
- **effectList（旧版）→ flags（新版）**：收集需要DOM操作的节点

### 4. 优先级模型（Lane）
- **31个优先级级别**：精细的优先级控制
- **位运算操作**：快速判断、合并、比较优先级
- **过期时间机制**：防止低优先级任务饿死

### 5. 增量渲染
- **时间切片**：每5ms检查一次是否需要让出控制权
- **可中断可恢复**：保存workInProgress状态，随时可恢复
- **协作式调度**：配合Scheduler实现优雅的任务调度

---

## 六、关键代码路径

```
packages/react-reconciler/src/
├── ReactInternalTypes.js          # Fiber类型定义
├── ReactFiber.js                  # Fiber节点创建与复用
├── ReactFiberWorkLoop.js          # 工作循环、调度
├── ReactFiberBeginWork.js         # beginWork阶段
├── ReactFiberCompleteWork.js      # completeWork阶段
├── ReactFiberCommitWork.js        # commit阶段
├── ReactFiberLane.js              # Lane优先级模型
├── ReactWorkTags.js               # Fiber节点类型枚举
└── ReactFiberFlags.js             # 副作用标记
```

---

## 七、面试要点速记

### 快速回答框架

**Fiber是什么？**
- 数据结构：链表形式的虚拟DOM
- 工作单元：包含了组件的状态、副作用、优先级信息
- 架构名称：React 16的新协调引擎

**解决什么问题？**
- 不可中断 → 可中断（时间切片）
- 无优先级 → Lane优先级模型
- 主线程阻塞 → 增量渲染

**核心属性？**
- 树结构：return/child/sibling
- 状态：memoizedState/memoizedProps
- 副作用：flags/subtreeFlags
- 优先级：lanes/childLanes
- 双缓存：alternate

### 加分项

1. **能画图说明**：Fiber树结构、双缓存切换、工作循环
2. **能说出源码位置**：知道在哪个文件、哪个函数
3. **能结合场景**：说明在实际项目中的应用
4. **能对比旧版**：说清React 15和16的区别
5. **能扩展讨论**：引申到Concurrent Mode、Suspense等新特性

---

**参考资料**：
- React源码：`packages/react-reconciler/`
- [React官方文档 - Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

**最后更新**: 2025-11-05

