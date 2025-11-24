# 05 - bailout 优化策略详解

> **问题**: React 的 bailout 优化策略是什么？它如何判断组件是否需要更新？

---

## 一、bailout 是什么？

**bailout 是 React 的一种性能优化策略**，意为"跳过"或"提前退出"。当 React 判断一个组件不需要更新时，会跳过该组件及其子树的 reconciliation（协调）过程，从而提升性能。

### 为什么需要 bailout？

```
没有bailout的问题：
父组件更新 → 所有子组件都重新render → diff → 可能不需要更新DOM

即使props没变，也要：
1. 执行组件函数/render方法
2. 创建新的React元素
3. diff新旧元素树
4. 最终发现不需要更新DOM

代价：浪费CPU时间和内存

有bailout的优化：
父组件更新 → 检测子组件 → props没变 → 跳过！

跳过：
1. 不执行组件函数
2. 不创建新元素
3. 不进行diff
4. 直接复用旧Fiber

代价：几乎为零
```

### bailout 的核心价值

```
示例：大型应用
┌──────────────┐
│  App (变化)  │
├──────────────┤
│ Header (不变)│ ← bailout!
│ - 100个子组件 │ ← 全部跳过!
├──────────────┤
│ Content(变化)│ ← 继续reconcile
│ - 200个子组件 │
├──────────────┤
│ Footer (不变)│ ← bailout!
│ - 50个子组件  │ ← 全部跳过!
└──────────────┘

节省：150个组件的render + diff
```

---

## 二、bailout 的判断条件

### 核心条件：四个"没有变化"

源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`

```javascript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // ...

  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    // 条件1：props是否相同
    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      (__DEV__ ? workInProgress.type !== current.type : false)
    ) {
      // props或context变化，标记为需要更新
      didReceiveUpdate = true;
    } else {
      // 条件2：是否有pending的update或context变化
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes
      );

      if (
        !hasScheduledUpdateOrContext &&
        (workInProgress.flags & DidCapture) === NoFlags
      ) {
        // 满足bailout条件！
        didReceiveUpdate = false;
        return attemptEarlyBailoutIfNoScheduledUpdate(
          current,
          workInProgress,
          renderLanes
        );
      }

      // 虽然props没变，但有update，设置标记
      didReceiveUpdate = false;
    }
  }

  // ...继续正常更新流程
}
```

**bailout 的四个必要条件**：

```javascript
function canBailout(fiber) {
  // 1. oldProps === newProps
  //    引用相等（浅比较）
  if (fiber.memoizedProps !== fiber.pendingProps) {
    return false;
  }

  // 2. !hasScheduledUpdate
  //    该Fiber上没有pending的更新（setState等）
  if (includesSomeLane(fiber.lanes, renderLanes)) {
    return false;
  }

  // 3. !hasContextChanged
  //    该Fiber依赖的Context没有变化
  if (checkIfContextChanged(fiber.dependencies)) {
    return false;
  }

  // 4. !didCaptureError
  //    没有错误边界捕获的错误需要处理
  if ((fiber.flags & DidCapture) !== NoFlags) {
    return false;
  }

  // 满足所有条件，可以bailout!
  return true;
}
```

### checkScheduledUpdateOrContext 详解

```javascript
function checkScheduledUpdateOrContext(
  current: Fiber,
  renderLanes: Lanes
): boolean {
  // 检查是否有pending的update
  const updateLanes = current.lanes;
  if (includesSomeLane(updateLanes, renderLanes)) {
    return true; // 有update，不能bailout
  }

  // 检查是否有context变化
  const dependencies = current.dependencies;
  if (dependencies !== null && checkIfContextChanged(dependencies)) {
    return true; // context变化，不能bailout
  }

  return false; // 可以bailout
}
```

### bailoutOnAlreadyFinishedWork 详解

```javascript
function bailoutOnAlreadyFinishedWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  if (current !== null) {
    // 复用旧的dependencies
    workInProgress.dependencies = current.dependencies;
  }

  // 标记跳过的lanes
  markSkippedUpdateLanes(workInProgress.lanes);

  // 关键判断：子树是否有工作？
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // 子树也没有工作，完全跳过!
    // 检查context变化（lazy propagation）
    if (current !== null) {
      lazilyPropagateParentContextChanges(current, workInProgress, renderLanes);
      if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
        return null; // 完全跳过此节点及其子树
      }
    } else {
      return null;
    }
  }

  // 当前节点可以bailout，但子树有工作
  // 需要克隆子节点，继续处理子树
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}
```

**两种 bailout 场景**：

```
场景1：完全bailout
条件：当前节点 + 子树都没有工作
返回：null
效果：跳过整个子树

场景2：部分bailout
条件：当前节点没工作，但子树有工作
返回：workInProgress.child
效果：跳过当前节点，继续处理子树
```

---

## 三、相关优化 API

### 1. PureComponent

**原理**：自动进行 props 和 state 的浅比较

源码：`packages/react-reconciler/src/ReactFiberClassComponent.js`

```javascript
function checkShouldComponentUpdate(
  workInProgress: Fiber,
  ctor: any,
  oldProps: any,
  newProps: any,
  oldState: any,
  newState: any,
  nextContext: any
) {
  const instance = workInProgress.stateNode;

  // 如果实现了shouldComponentUpdate，使用它
  if (typeof instance.shouldComponentUpdate === "function") {
    const shouldUpdate = instance.shouldComponentUpdate(
      newProps,
      newState,
      nextContext
    );
    return shouldUpdate;
  }

  // PureComponent的逻辑
  if (ctor.prototype && ctor.prototype.isPureReactComponent) {
    return (
      !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    );
  }

  return true; // 默认总是更新
}
```

**shallowEqual 实现**：

源码：`packages/shared/shallowEqual.js`

```javascript
function shallowEqual(objA: mixed, objB: mixed): boolean {
  // 1. Object.is比较（处理+0/-0, NaN等特殊情况）
  if (is(objA, objB)) {
    return true;
  }

  // 2. 类型检查
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  // 3. 键数量比较
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // 4. 逐个键比较（浅比较）
  for (let i = 0; i < keysA.length; i++) {
    const currentKey = keysA[i];
    if (
      !hasOwnProperty.call(objB, currentKey) ||
      !is(objA[currentKey], objB[currentKey])
    ) {
      return false;
    }
  }

  return true;
}
```

**使用示例**：

```javascript
// ❌ 普通Component：每次父组件更新都会重新render
class RegularComponent extends React.Component {
  render() {
    console.log("RegularComponent render");
    return <div>{this.props.name}</div>;
  }
}

// ✅ PureComponent：props没变不会render
class PureComponentExample extends React.PureComponent {
  render() {
    console.log("PureComponent render");
    return <div>{this.props.name}</div>;
  }
}

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <RegularComponent name="Tom" /> {/* 每次都render */}
      <PureComponentExample name="Tom" /> {/* 只render一次 */}
    </>
  );
}
```

### 2. React.memo

**原理**：函数组件的 PureComponent

源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`

```javascript
function updateSimpleMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes
): null | Fiber {
  if (current !== null) {
    const prevProps = current.memoizedProps;

    // 浅比较props + ref比较
    if (
      shallowEqual(prevProps, nextProps) &&
      current.ref === workInProgress.ref
    ) {
      didReceiveUpdate = false;

      // 复用props对象
      workInProgress.pendingProps = nextProps = prevProps;

      // 检查是否有update或context变化
      if (!checkScheduledUpdateOrContext(current, renderLanes)) {
        // 可以bailout!
        workInProgress.lanes = current.lanes;
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
      }

      // 有update，虽然props没变，但还是要render
      didReceiveUpdate = false;
    }
  }

  // 继续正常更新
  return updateFunctionComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes
  );
}
```

**使用示例**：

```javascript
// 基础用法
const MemoComponent = React.memo(function MyComponent({ name }) {
  console.log("render");
  return <div>{name}</div>;
});

// 自定义比较函数
const CustomMemoComponent = React.memo(
  function MyComponent({ user }) {
    console.log("render");
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // 返回true表示相等，不需要更新
    // 返回false表示不相等，需要更新
    return prevProps.user.id === nextProps.user.id;
  }
);

function Parent() {
  const [count, setCount] = useState(0);
  const user = { id: 1, name: "Tom" }; // 注意：这是个新对象！

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <MemoComponent name="Tom" /> {/* 只render一次 */}
      <CustomMemoComponent user={user} /> {/* 只render一次 */}
    </>
  );
}
```

### 3. shouldComponentUpdate

**原理**：手动控制更新逻辑

```javascript
class OptimizedComponent extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 自定义比较逻辑
    return (
      this.props.id !== nextProps.id || this.state.count !== nextState.count
    );
  }

  render() {
    return (
      <div>
        {this.props.id}: {this.state.count}
      </div>
    );
  }
}
```

**源码处理**：

```javascript
function updateClassInstance(
  current: Fiber,
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes
): boolean {
  const instance = workInProgress.stateNode;

  // ... 处理state更新

  // 调用shouldComponentUpdate或使用PureComponent逻辑
  const shouldUpdate =
    checkHasForceUpdateAfterProcessing() || // forceUpdate优先级最高
    checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext
    ) ||
    checkIfContextChanged(current.dependencies);

  if (shouldUpdate) {
    // 需要更新：调用componentWillUpdate等
    // ...
  } else {
    // 不需要更新：更新memoizedProps/State
    workInProgress.memoizedProps = newProps;
    workInProgress.memoizedState = newState;
  }

  return shouldUpdate;
}
```

---

## 四、实际应用场景与案例

### 案例 1：列表组件优化

```javascript
// ❌ 问题代码
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }) {
  console.log("TodoItem render:", todo.id);
  return <li>{todo.text}</li>;
}

// 问题：父组件任何变化都会导致所有TodoItem重新render

// ✅ 优化方案
const MemoTodoItem = React.memo(function TodoItem({ todo }) {
  console.log("TodoItem render:", todo.id);
  return <li>{todo.text}</li>;
});

function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <MemoTodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// 效果：只有todo对象引用变化时才render
```

### 案例 2：父组件频繁更新

```javascript
// ❌ 问题代码
function App() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([]);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <ExpensiveComponent todos={todos} /> {/* 每次count变化都render */}
    </>
  );
}

function ExpensiveComponent({ todos }) {
  // 昂贵的计算
  const result = heavyComputation(todos);
  return <div>{result}</div>;
}

// ✅ 优化方案1：React.memo
const MemoExpensiveComponent = React.memo(ExpensiveComponent);

// ✅ 优化方案2：拆分组件
function App() {
  const [todos, setTodos] = useState([]);

  return (
    <>
      <Counter /> {/* count状态隔离 */}
      <ExpensiveComponent todos={todos} />
    </>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>;
}
```

### 案例 3：Context 导致的过度渲染

```javascript
// ❌ 问题代码
const UserContext = React.createContext();

function App() {
  const [user, setUser] = useState({ name: "Tom", age: 20 });
  const [theme, setTheme] = useState("light");

  return (
    <UserContext.Provider value={user}>
      <Header /> {/* 使用context */}
      <Content /> {/* 不使用context，但也会render */}
      <Footer /> {/* 不使用context，但也会render */}
    </UserContext.Provider>
  );
}

// user变化时，所有子组件都重新render!

// ✅ 优化方案：分离context
const UserContext = React.createContext();
const ThemeContext = React.createContext();

function App() {
  const [user, setUser] = useState({ name: "Tom", age: 20 });
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <Header />
      </UserContext.Provider>
      <MemoContent theme={theme} /> {/* 不受user影响 */}
      <MemoFooter theme={theme} /> {/* 不受user影响 */}
    </ThemeContext.Provider>
  );
}

const MemoContent = React.memo(Content);
const MemoFooter = React.memo(Footer);
```

### 案例 4：children prop pattern

```javascript
// ✅ 高级优化：利用children
function App() {
  const [count, setCount] = useState(0);

  return (
    <Layout>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <ExpensiveComponent /> {/* 作为children传入 */}
    </Layout>
  );
}

function Layout({ children }) {
  console.log("Layout render");
  // Layout render不会导致children重新render
  // 因为children是已经创建好的React元素
  return <div className="layout">{children}</div>;
}

// 原理：
// children在App中创建，ExpensiveComponent的props（没有）不变
// Layout render时，children是同一个引用，可以bailout!
```

---

## 五、bailout 的陷阱与注意事项

### 陷阱 1：每次创建新对象/函数

```javascript
// ❌ 错误：每次都是新对象
const MemoChild = React.memo(Child);

function Parent() {
  return (
    <MemoChild
      style={{ color: "red" }} // 新对象！
      onClick={() => console.log("hi")} // 新函数！
    />
  );
}
// memo失效！props总是不同

// ✅ 正确：使用useMemo和useCallback
function Parent() {
  const style = useMemo(() => ({ color: "red" }), []);
  const onClick = useCallback(() => console.log("hi"), []);

  return <MemoChild style={style} onClick={onClick} />;
}
```

### 陷阱 2：浅比较的局限

```javascript
// ❌ 浅比较无法检测深层变化
const MemoChild = React.memo(Child);

function Parent() {
  const [user, setUser] = useState({ name: "Tom", address: { city: "NY" } });

  // 修改深层属性
  const updateCity = () => {
    user.address.city = "LA"; // 对象引用不变！
    setUser(user);
  };

  return <MemoChild user={user} />; // memo不会检测到变化！
}

// ✅ 正确：使用不可变更新
const updateCity = () => {
  setUser({
    ...user,
    address: { ...user.address, city: "LA" },
  });
};
```

### 陷阱 3：Context 绕过 bailout

```javascript
// ❌ Context会绕过memo
const ThemeContext = React.createContext();

const MemoChild = React.memo(function Child() {
  const theme = useContext(ThemeContext); // 使用context
  return <div>{theme}</div>;
});

function Parent() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <MemoChild /> {/* count变化不会render，theme变化会render */}
    </ThemeContext.Provider>
  );
}

// Context变化会直接触发使用它的组件更新，绕过memo!
```

### 陷阱 4：过度优化

```javascript
// ❌ 不必要的memo
const SimpleText = React.memo(function SimpleText({ text }) {
  return <span>{text}</span>;  // 超级简单的组件
});

// memo本身有开销（浅比较），对于简单组件可能得不偿失

// ✅ 只对昂贵组件使用memo
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  // 复杂的计算或大量DOM
  const processed = items.map(item => heavyProcess(item));
  return <ul>{processed.map(...)}</ul>;
});
```

---

## 六、性能监控与调试

### 1. React DevTools Profiler

```javascript
// 使用Profiler识别不必要的渲染
import { Profiler } from "react";

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <YourApp />
    </Profiler>
  );
}

function onRenderCallback(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);

  if (actualDuration > 16) {
    console.warn("Slow render detected!");
  }
}
```

**Profiler 能看到**：

- 哪些组件 render 了
- 为什么 render（props、state、hooks、context）
- render 耗时
- 是否可以优化

### 2. 自定义 Hook 检测 render

```javascript
function useWhyDidYouUpdate(name, props) {
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log("[why-did-you-update]", name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// 使用
function MyComponent(props) {
  useWhyDidYouUpdate("MyComponent", props);
  return <div>{props.value}</div>;
}
```

### 3. 检测意外的渲染

```javascript
// 开发环境添加render日志
function MyComponent({ value }) {
  if (__DEV__) {
    console.count(`MyComponent render: ${value}`);
  }

  return <div>{value}</div>;
}

// 或使用自定义Hook
function useRenderCount(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
}
```

---

## 七、bailout 优化最佳实践

### 1. 合理使用 memo

```javascript
// ✅ DO: 昂贵组件
const ExpensiveChart = React.memo(Chart);

// ✅ DO: 频繁渲染的父组件中的稳定子组件
function FrequentlyUpdatingParent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <StableChild /> {/* memo很有用 */}
    </>
  );
}

// ❌ DON'T: 简单组件
const SimpleText = React.memo(({ text }) => <span>{text}</span>);

// ❌ DON'T: 总是变化的props
const AlwaysChanging = React.memo(
  ({ timestamp }) => <div>{timestamp}</div> // timestamp每次都不同，memo浪费
);
```

### 2. 状态下沉与提升

```javascript
// ✅ 状态下沉：隔离频繁变化的状态
function App() {
  return (
    <>
      <Header />
      <Counter /> {/* count状态只在这里 */}
      <Footer />
    </>
  );
}

function Counter() {
  const [count, setCount] = useState(0); // 状态下沉
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

// ✅ 状态提升：共享状态时使用
function App() {
  const [sharedData, setSharedData] = useState({});

  return (
    <>
      <Editor data={sharedData} onChange={setSharedData} />
      <Preview data={sharedData} />
    </>
  );
}
```

### 3. 使用不可变数据

```javascript
// ✅ 正确：创建新对象
const updateUser = (user) => {
  return {
    ...user,
    name: "New Name",
  };
};

// ✅ 使用Immer简化不可变更新
import { produce } from "immer";

const updateUser = (user) => {
  return produce(user, (draft) => {
    draft.name = "New Name";
    draft.address.city = "NY";
  });
};
```

### 4. 优化 Context

```javascript
// ✅ 拆分Context，减少影响范围
const UserContext = React.createContext();
const ThemeContext = React.createContext();
const SettingsContext = React.createContext();

// ✅ 使用useMemo优化Context value
function App() {
  const [user, setUser] = useState({});
  const [theme, setTheme] = useState("light");

  const userValue = useMemo(() => ({ user, setUser }), [user]);
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <YourApp />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

---

## 八、源码关键路径

```
bailout相关核心文件：

packages/react-reconciler/src/
├── ReactFiberBeginWork.js                # beginWork入口
│   ├── beginWork()                       # 判断是否bailout
│   ├── attemptEarlyBailoutIfNoScheduledUpdate()  # 提前bailout
│   ├── bailoutOnAlreadyFinishedWork()   # bailout实现
│   ├── checkScheduledUpdateOrContext()   # 检查update和context
│   ├── updateSimpleMemoComponent()       # React.memo逻辑
│   └── updateMemoComponent()             # 复杂memo逻辑
│
├── ReactFiberClassComponent.js           # 类组件更新
│   ├── checkShouldComponentUpdate()      # SCU检查
│   ├── updateClassInstance()             # 类组件更新
│   └── checkHasForceUpdateAfterProcessing()  # forceUpdate检查
│
└── ReactFiberHooks.js                    # Hooks
    └── bailoutHooks()                    # 跳过Hooks执行

packages/shared/
└── shallowEqual.js                       # 浅比较实现
```

---

## 九、面试要点速记

### 快速回答框架

**bailout 是什么？**

- React 的性能优化策略
- 跳过不需要更新的组件及其子树
- 节省 render + diff 的开销

**bailout 的判断条件？**
四个条件（缺一不可）：

1. oldProps === newProps（引用相等）
2. 没有 pending 的 update（lanes 为空）
3. 没有 context 变化
4. 没有捕获错误

**相关 API？**

1. PureComponent：自动浅比较 props 和 state
2. React.memo：函数组件版的 PureComponent
3. shouldComponentUpdate：手动控制更新

**浅比较原理？**

- Object.is 比较引用
- 遍历键，比较每个键的值（只比较第一层）

### 加分项

1. **能说明两种 bailout 场景**：

   - 完全 bailout（返回 null）
   - 部分 bailout（返回 child）

2. **能分析 Context 绕过 bailout**：

   - Context 变化直接标记使用者
   - 绕过 props 比较

3. **能给出实战优化建议**：

   - 状态下沉
   - 拆分 Context
   - 使用不可变数据

4. **能识别过度优化**：
   - 简单组件不需要 memo
   - memo 本身有开销

### 常见追问

**Q: React.memo 和 useMemo 的区别？**
A:

- React.memo：组件级优化，跳过组件 render
- useMemo：值级优化，缓存计算结果
- 配合使用：useMemo 稳定 props，React.memo 跳过 render

**Q: 为什么是浅比较而不是深比较？**
A:

- 性能：深比较 O(n)递归，可能很慢
- 不可变数据：配合不可变更新，浅比较足够
- 开发者控制：通过引用相等性，开发者控制更新时机

**Q: PureComponent 有什么缺点？**
A:

- 只有浅比较，深层变化检测不到
- 每次都要比较 props 和 state，有开销
- 需要配合不可变数据使用
- 可能隐藏 bug（忘记创建新对象）

**Q: 什么时候不应该使用 memo？**
A:

- 简单组件（render 很快）
- props 总是变化的组件
- 优化收益小于 memo 开销
- 组件很少 render

---

**参考资料**：

- React 源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`
- [React 官方文档 - Memo](https://react.dev/reference/react/memo)
- [Before You memo()](https://overreacted.io/before-you-memo/)

**最后更新**: 2025-11-05
