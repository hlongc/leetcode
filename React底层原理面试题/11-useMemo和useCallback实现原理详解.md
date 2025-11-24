# 11 - useMemo和useCallback实现原理详解

> **问题**: useMemo和useCallback的实现原理是什么？它们是如何做缓存的？

---

## 一、useMemo和useCallback的本质

### 核心关系

```javascript
// useCallback就是useMemo的特殊情况
useCallback(fn, deps)
// 等价于
useMemo(() => fn, deps)

// 本质上：
// useMemo缓存计算结果（任意值）
// useCallback缓存函数本身
```

### 为什么需要它们？

```javascript
// ❌ 没有缓存的问题
function Parent() {
  const [count, setCount] = useState(0);
  
  // 每次render都创建新函数
  const handleClick = () => {
    console.log('clicked');
  };
  
  // 每次render都创建新对象
  const config = { theme: 'dark' };
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <MemoChild onClick={handleClick} config={config} />
    </>
  );
}

const MemoChild = React.memo(Child);

// 问题：
// 1. handleClick每次都是新引用
// 2. config每次都是新对象
// 3. React.memo失效，Child每次都render
// 4. 浪费性能

// ✅ 使用缓存优化
function Parent() {
  const [count, setCount] = useState(0);
  
  // 缓存函数
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  // 缓存对象
  const config = useMemo(() => ({ theme: 'dark' }), []);
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <MemoChild onClick={handleClick} config={config} />
    </>
  );
}

// 效果：
// handleClick和config引用不变
// React.memo生效，Child不重新render
```

---

## 二、React.memo的实现原理

### React.memo的本质

```javascript
// React.memo是函数组件的PureComponent
// 通过比较props来决定是否重新渲染组件

// 基础用法
const MemoComponent = React.memo(function MyComponent({ name }) {
  return <div>{name}</div>;
});

// 自定义比较函数
const CustomMemoComponent = React.memo(
  function MyComponent({ data }) {
    return <div>{data.value}</div>;
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    // 返回true表示props相等，跳过渲染
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### 源码实现

#### 1. React.memo创建（packages/react/src/ReactMemo.js）

```javascript
export function memo<Props>(
  type: React$ElementType,
  compare?: (oldProps: Props, newProps: Props) => boolean,
) {
  const elementType = {
    $$typeof: REACT_MEMO_TYPE,  // 标记为memo类型
    type,                        // 原始组件
    compare: compare === undefined ? null : compare,  // 比较函数
  };
  return elementType;
}
```

**数据结构**：
- `$$typeof: REACT_MEMO_TYPE` - 标识这是一个memo组件
- `type` - 被包装的原始组件
- `compare` - 自定义比较函数，`null`表示使用默认的浅比较

#### 2. Fiber节点类型

React.memo会根据组件类型创建不同的Fiber节点：

```javascript
// 两种Fiber类型：
export const MemoComponent = 14;           // 复杂组件（forwardRef等）
export const SimpleMemoComponent = 15;     // 简单函数组件（优化路径）
```

**SimpleMemoComponent的优化**：

```typescript
// packages/react-reconciler/src/ReactFiberBeginWork.js (471:500)
function updateMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
): null | Fiber {
  if (current === null) {
    const type = Component.type;
    if (isSimpleFunctionComponent(type) && Component.compare === null) {
      let resolvedType = type;
      if (__DEV__) {
        resolvedType = resolveFunctionForHotReloading(type);
      }
      // If this is a plain function component without default props,
      // and with only the default shallow comparison, we upgrade it
      // to a SimpleMemoComponent to allow fast path updates.
      workInProgress.tag = SimpleMemoComponent;
      workInProgress.type = resolvedType;
      if (__DEV__) {
        validateFunctionComponentInDev(workInProgress, type);
      }
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        resolvedType,
        nextProps,
        renderLanes,
      );
    }
```

**条件**：
- 普通函数组件（不是forwardRef、class等）
- 没有defaultProps
- 使用默认的浅比较（`compare === null`）

满足以上条件时，会升级为`SimpleMemoComponent`，使用更快的更新路径。

#### 3. SimpleMemoComponent更新逻辑

```typescript
// packages/react-reconciler/src/ReactFiberBeginWork.js (539:610)
function updateSimpleMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
): null | Fiber {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens when the inner render suspends.
  // We'll need to figure out if this is fine or can cause issues.
  if (current !== null) {
    const prevProps = current.memoizedProps;
    if (
      shallowEqual(prevProps, nextProps) &&
      current.ref === workInProgress.ref &&
      // Prevent bailout if the implementation changed due to hot reload.
      (__DEV__ ? workInProgress.type === current.type : true)
    ) {
      didReceiveUpdate = false;

      // The props are shallowly equal. Reuse the previous props object, like we
      // would during a normal fiber bailout.
      //
      // We don't have strong guarantees that the props object is referentially
      // equal during updates where we can't bail out anyway — like if the props
      // are shallowly equal, but there's a local state or context update in the
      // same batch.
      //
      // However, as a principle, we should aim to make the behavior consistent
      // across different ways of memoizing a component. For example, React.memo
      // has a different internal Fiber layout if you pass a normal function
      // component (SimpleMemoComponent) versus if you pass a different type
      // like forwardRef (MemoComponent). But this is an implementation detail.
      // Wrapping a component in forwardRef (or React.lazy, etc) shouldn't
      // affect whether the props object is reused during a bailout.
      workInProgress.pendingProps = nextProps = prevProps;

      if (!checkScheduledUpdateOrContext(current, renderLanes)) {
        // The pending lanes were cleared at the beginning of beginWork. We're
        // about to bail out, but there might be other lanes that weren't
        // included in the current render. Usually, the priority level of the
        // remaining updates is accumulated during the evaluation of the
        // component (i.e. when processing the update queue). But since since
        // we're bailing out early *without* evaluating the component, we need
        // to account for it here, too. Reset to the value of the current fiber.
        // NOTE: This only applies to SimpleMemoComponent, not MemoComponent,
        // because a MemoComponent fiber does not have hooks or an update queue;
        // rather, it wraps around an inner component, which may or may not
        // contains hooks.
        // TODO: Move the reset at in beginWork out of the common path so that
        // this is no longer necessary.
        workInProgress.lanes = current.lanes;
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes,
        );
      } else if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      }
    }
  }
  return updateFunctionComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes,
  );
}
```

**关键步骤**：
1. 比较props：使用`shallowEqual(prevProps, nextProps)`
2. 比较ref：`current.ref === workInProgress.ref`
3. 检查是否有更新：`checkScheduledUpdateOrContext`
4. 如果props相等且无更新：调用`bailoutOnAlreadyFinishedWork`跳过渲染

#### 4. MemoComponent更新逻辑（复杂组件）

```typescript
// packages/react-reconciler/src/ReactFiberBeginWork.js (471:537)
function updateMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
): null | Fiber {
  if (current === null) {
    const type = Component.type;
    if (isSimpleFunctionComponent(type) && Component.compare === null) {
      let resolvedType = type;
      if (__DEV__) {
        resolvedType = resolveFunctionForHotReloading(type);
      }
      // If this is a plain function component without default props,
      // and with only the default shallow comparison, we upgrade it
      // to a SimpleMemoComponent to allow fast path updates.
      workInProgress.tag = SimpleMemoComponent;
      workInProgress.type = resolvedType;
      if (__DEV__) {
        validateFunctionComponentInDev(workInProgress, type);
      }
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        resolvedType,
        nextProps,
        renderLanes,
      );
    }
    const child = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      workInProgress,
      workInProgress.mode,
      renderLanes,
    );
    child.ref = workInProgress.ref;
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }
  const currentChild = ((current.child: any): Fiber); // This is always exactly one child
  const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
    current,
    renderLanes,
  );
  if (!hasScheduledUpdateOrContext) {
    // This will be the props with resolved defaultProps,
    // unlike current.memoizedProps which will be the unresolved ones.
    const prevProps = currentChild.memoizedProps;
    // Default to shallow comparison
    let compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual;
    if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
  }
  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  const newChild = createWorkInProgress(currentChild, nextProps);
  newChild.ref = workInProgress.ref;
  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}
```

**区别**：
- `MemoComponent`：包装了forwardRef等复杂组件，需要创建子Fiber
- `SimpleMemoComponent`：直接优化函数组件，更快

#### 5. shallowEqual实现

```typescript
// packages/shared/shallowEqual.js (18:52)
function shallowEqual(objA: mixed, objB: mixed): boolean {
  if (is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    const currentKey = keysA[i];
    if (
      !hasOwnProperty.call(objB, currentKey) ||
      // $FlowFixMe[incompatible-use] lost refinement of `objB`
      !is(objA[currentKey], objB[currentKey])
    ) {
      return false;
    }
  }

  return true;
}
```

**比较逻辑**：
1. 引用相等：`Object.is(objA, objB)` - 最快路径
2. 类型检查：必须是对象
3. 键数量：`Object.keys`长度必须相同
4. 逐个比较：使用`Object.is`比较每个属性的值（浅比较）

**示例**：

```javascript
// 引用相等
shallowEqual({a: 1}, {a: 1});  // false（不同对象）
const obj = {a: 1};
shallowEqual(obj, obj);         // true（同一引用）

// 浅比较
shallowEqual({a: 1, b: 2}, {a: 1, b: 2});        // true
shallowEqual({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}});  // false（b是对象，只比较引用）

// 键数量不同
shallowEqual({a: 1}, {a: 1, b: 2});  // false

// 值不同
shallowEqual({a: 1}, {a: 2});  // false
```

### React.memo的工作流程

```text
React.memo(Component, compare?)
       ↓
创建elementType: {$$typeof: REACT_MEMO_TYPE, type, compare}
       ↓
render阶段：updateMemoComponent / updateSimpleMemoComponent
       ↓
比较props：
  - 有自定义compare？使用compare(prevProps, nextProps)
  - 否则使用shallowEqual(prevProps, nextProps)
       ↓
props相等？
  /        \
 是         否
  ↓          ↓
跳过渲染    正常渲染
bailout    updateFunctionComponent
```

### React.memo vs useMemo/useCallback

| 特性 | React.memo | useMemo/useCallback |
|------|-----------|---------------------|
| **优化级别** | 组件级 | 值级 |
| **作用** | 跳过组件渲染 | 缓存值/函数 |
| **比较对象** | props | 依赖数组 |
| **配合使用** | 需要稳定的props引用 | 提供稳定的props引用 |

**配合使用示例**：

```javascript
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Tom');
  
  // useMemo稳定对象引用
  const config = useMemo(
    () => ({ theme: 'dark', lang: 'en' }),
    []  // 空依赖，永远不变
  );
  
  // useCallback稳定函数引用
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);  // 空依赖，永远不变
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <MemoChild 
        name={name}        // 基本类型，引用稳定
        config={config}    // useMemo缓存，引用稳定
        onClick={handleClick}  // useCallback缓存，引用稳定
      />
    </>
  );
}

// React.memo跳过渲染
const MemoChild = React.memo(function Child({ name, config, onClick }) {
  console.log('Child render');  // 只在name变化时打印
  return (
    <div>
      <p>{name}</p>
      <button onClick={onClick}>Click</button>
    </div>
  );
});

// count变化时：
// - config引用不变（useMemo）
// - onClick引用不变（useCallback）
// - name不变
// → React.memo检测到props相等
// → 跳过Child的渲染
```

---

## 三、useMemo的实现

### mount阶段

源码：`packages/react-reconciler/src/ReactFiberHooks.js`

```javascript
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 1. 创建Hook对象
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 2. 执行计算函数
  const nextValue = nextCreate();
  
  // 3. 保存 [值, 依赖]
  hook.memoizedState = [nextValue, nextDeps];
  
  return nextValue;
}
```

**数据结构**：

```javascript
// Hook.memoizedState
[
  nextValue,   // 计算结果
  nextDeps     // 依赖数组
]

// 示例
const result = useMemo(() => count * 2, [count]);

// Hook.memoizedState = [0, [0]]（count=0时）
// Hook.memoizedState = [2, [1]]（count=1时）
```

### update阶段

```javascript
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 1. 获取Hook对象
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  
  // 2. 比较依赖
  if (nextDeps !== null) {
    const prevDeps: Array<mixed> | null = prevState[1];
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      // 依赖没变，返回缓存值
      return prevState[0];
    }
  }
  
  // 3. 依赖变了，重新计算
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

**流程图**：

```text
useMemo(create, deps)
       ↓
   update阶段？
     /      \
   mount   update
    ↓        ↓
执行create  比较deps
保存结果      ↓
         deps相同？
          /      \
        是        否
         ↓        ↓
    返回缓存   执行create
              保存新结果
```

---

## 四、useCallback的实现

### mount阶段

```javascript
function mountCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  // 1. 创建Hook对象
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 2. 保存 [函数, 依赖]
  hook.memoizedState = [callback, nextDeps];
  
  return callback;
}
```

### update阶段

```javascript
function updateCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  // 1. 获取Hook对象
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  
  // 2. 比较依赖
  if (nextDeps !== null) {
    const prevDeps: Array<mixed> | null = prevState[1];
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      // 依赖没变，返回缓存的函数
      return prevState[0];
    }
  }
  
  // 3. 依赖变了，保存新函数
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

**关键对比**：

```javascript
useMemo vs useCallback

useMemo(() => value, deps)
  Hook.memoizedState = [value, deps]
  return value

useCallback(fn, deps)
  Hook.memoizedState = [fn, deps]
  return fn

区别：
- useMemo执行函数取结果
- useCallback直接返回函数
```

---

## 五、React.memo的使用场景与最佳实践

### 场景1：列表项优化

```javascript
function TodoList({ todos }) {
  const [filter, setFilter] = useState('all');
  
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'all') return true;
      return todo.status === filter;
    });
  }, [todos, filter]);
  
  return (
    <div>
      {filteredTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

// 优化：使用React.memo避免不必要的渲染
const TodoItem = React.memo(function TodoItem({ todo }) {
  console.log('TodoItem render:', todo.id);
  return (
    <div>
      <input type="checkbox" checked={todo.completed} />
      <span>{todo.text}</span>
    </div>
  );
});

// 当todos数组引用不变，但filter变化时：
// - filteredTodos重新计算（useMemo）
// - 但TodoItem不会重新渲染（React.memo）
// - 只有实际变化的item会渲染
```

### 场景2：表单控件优化

```javascript
function Form() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 0,
  });
  
  // 每个字段单独更新
  const updateName = useCallback((name) => {
    setFormData(prev => ({ ...prev, name }));
  }, []);
  
  const updateEmail = useCallback((email) => {
    setFormData(prev => ({ ...prev, email }));
  }, []);
  
  const updateAge = useCallback((age) => {
    setFormData(prev => ({ ...prev, age }));
  }, []);
  
  return (
    <form>
      <NameInput value={formData.name} onChange={updateName} />
      <EmailInput value={formData.email} onChange={updateEmail} />
      <AgeInput value={formData.age} onChange={updateAge} />
    </form>
  );
}

// 每个输入组件都使用memo
const NameInput = React.memo(function NameInput({ value, onChange }) {
  console.log('NameInput render');
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
});

// name变化时，只有NameInput重新渲染
// EmailInput和AgeInput不会重新渲染
```

### 场景3：自定义比较函数

```javascript
// 场景：深层对象比较
function DataVisualization({ data }) {
  return (
    <div>
      <Chart data={data.chart} />
      <Table data={data.table} />
    </div>
  );
}

// 问题：data对象引用可能变化，但内容相同
// 解决：使用自定义比较函数
const Chart = React.memo(
  function Chart({ data }) {
    // 复杂的图表渲染
    return <svg>...</svg>;
  },
  (prevProps, nextProps) => {
    // 深度比较chart数据
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);

// 更好的方案：比较关键字段
const Chart = React.memo(
  function Chart({ data }) {
    return <svg>...</svg>;
  },
  (prevProps, nextProps) => {
    // 只比较关键字段
    return (
      prevProps.data.id === nextProps.data.id &&
      prevProps.data.values.length === nextProps.data.values.length &&
      prevProps.data.values.every((v, i) => v === nextProps.data.values[i])
    );
  }
);
```

### 场景4：Context优化

```javascript
// ❌ 问题：Context value变化导致所有消费者重新渲染
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  
  // 每次render都创建新对象
  const value = { theme, lang, setTheme, setLang };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ 优化：使用useMemo稳定value引用
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  
  // 只有theme或lang变化时才创建新对象
  const value = useMemo(
    () => ({ theme, lang, setTheme, setLang }),
    [theme, lang]  // setTheme和setLang是稳定的
  );
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 配合React.memo使用
const ThemedButton = React.memo(function ThemedButton() {
  const { theme } = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
});

// lang变化时，ThemedButton不会重新渲染
// 因为theme没变，React.memo检测到props（context value）的theme属性没变
```

### React.memo的注意事项

```javascript
// ⚠️ 注意1：memo只比较props，不比较内部state
function Component() {
  const [count, setCount] = useState(0);
  
  // count变化时，即使props没变，组件也会重新渲染
  // 因为state变化会触发重新渲染
  return <div>{count}</div>;
}

// ⚠️ 注意2：memo不会阻止context变化导致的重新渲染
const Component = React.memo(function Component() {
  const value = useContext(MyContext);
  // context value变化时，组件会重新渲染
  // memo无法阻止
  return <div>{value}</div>;
});

// ⚠️ 注意3：props中的函数/对象引用必须稳定
function Parent() {
  const [count, setCount] = useState(0);
  
  // ❌ 每次render都创建新对象
  const config = { theme: 'dark' };
  
  // ❌ 每次render都创建新函数
  const handleClick = () => console.log('click');
  
  return (
    <MemoChild config={config} onClick={handleClick} />
    // memo失效，因为config和onClick每次都是新引用
  );
}

// ✅ 使用useMemo/useCallback稳定引用
function Parent() {
  const [count, setCount] = useState(0);
  
  const config = useMemo(() => ({ theme: 'dark' }), []);
  const handleClick = useCallback(() => console.log('click'), []);
  
  return (
    <MemoChild config={config} onClick={handleClick} />
    // memo生效
  );
}
```

### 何时不应该使用React.memo

```javascript
// ❌ 不应该：简单组件
function SimpleButton({ text }) {
  return <button>{text}</button>;
}
// 渲染成本很低，memo的开销可能大于收益

// ❌ 不应该：props总是变化
function Component({ timestamp }) {
  return <div>{timestamp}</div>;
}
// timestamp每次都是新值，memo无法优化

// ❌ 不应该：组件很少渲染
function RareComponent({ data }) {
  // 这个组件很少被使用
  return <div>{data}</div>;
}
// 优化收益很小，不需要memo

// ✅ 应该：昂贵的组件
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  // 复杂的渲染逻辑
  // 大量的计算
  // 很多子组件
  return <ComplexUI data={data} />;
});

// ✅ 应该：频繁更新的父组件下的子组件
function Parent() {
  const [count, setCount] = useState(0);
  // Parent频繁更新
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <StableChild />  // 这个组件props不变，应该用memo
    </>
  );
}

const StableChild = React.memo(function StableChild() {
  return <div>Stable</div>;
});
```

---

## 六、完整案例分析

### 案例1：useMemo优化昂贵计算

```javascript
function TodoList({ todos, filter }) {
  // ❌ 没有useMemo：每次render都重新计算
  const filteredTodos = todos.filter(todo => {
    // 假设这是昂贵的计算
    return expensiveFilter(todo, filter);
  });
  
  // ✅ 使用useMemo
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => expensiveFilter(todo, filter));
  }, [todos, filter]);
  
  return (
    <ul>
      {filteredTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// 执行流程：
render1: todos=[A,B,C], filter='all'
  → mountMemo执行
  → filteredTodos = [A,B,C]
  → Hook.memoizedState = [[A,B,C], [todos, 'all']]

render2: count变化，但todos和filter没变
  → updateMemo执行
  → areHookInputsEqual([todos, 'all'], [todos, 'all']) → true
  → 返回缓存值[A,B,C]
  → 跳过filter计算！

render3: filter='active'
  → updateMemo执行
  → areHookInputsEqual([todos, 'active'], [todos, 'all']) → false
  → 重新执行filter
  → Hook.memoizedState = [[A,C], [todos, 'active']]
```

### 案例2：useCallback避免子组件重渲染

```javascript
function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  
  // ❌ 没有useCallback：每次都是新函数
  const handleSubmit = () => {
    console.log('submit:', text);
  };
  
  // ✅ 使用useCallback
  const handleSubmit = useCallback(() => {
    console.log('submit:', text);
  }, [text]);  // 只有text变化时才创建新函数
  
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChild onSubmit={handleSubmit} />
    </>
  );
}

const ExpensiveChild = React.memo(function ExpensiveChild({ onSubmit }) {
  console.log('ExpensiveChild render');
  // 复杂的渲染逻辑
  return <button onClick={onSubmit}>Submit</button>;
});

// count变化时：
// - 没有useCallback：handleSubmit新引用 → ExpensiveChild重渲染
// - 有useCallback：handleSubmit引用不变 → ExpensiveChild跳过渲染
```

### 案例3：配合React.memo优化props

```javascript
function DataTable({ data }) {
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // 缓存排序后的数据
  const sortedData = useMemo(() => {
    return data.slice().sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortOrder === 'asc' 
        ? aVal - bVal 
        : bVal - aVal;
    });
  }, [data, sortKey, sortOrder]);
  
  // 缓存排序处理函数
  const handleSort = useCallback((key) => {
    if (key === sortKey) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);  // sortOrder不需要依赖（函数式更新）
  
  return (
    <>
      <TableHeader onSort={handleSort} />
      <TableBody data={sortedData} />
    </>
  );
}

const TableHeader = React.memo(TableHeader);
const TableBody = React.memo(TableBody);
```

---

## 七、性能优化与反模式

### 何时使用useMemo/useCallback

```javascript
// ✅ DO: 昂贵的计算
const result = useMemo(() => {
  return items.filter(item => {
    // 复杂的过滤逻辑
    // 假设耗时10ms
    return complexFilter(item);
  });
}, [items]);

// ✅ DO: 传递给memo组件的props
const MemoChild = React.memo(Child);
const handleClick = useCallback(() => {
  console.log('click');
}, []);

<MemoChild onClick={handleClick} />

// ✅ DO: 作为其他Hook的依赖
const config = useMemo(() => ({ theme, lang }), [theme, lang]);
useEffect(() => {
  applyConfig(config);
}, [config]);  // config引用稳定

// ❌ DON'T: 简单计算
const double = useMemo(() => count * 2, [count]);
// 直接计算更快：const double = count * 2

// ❌ DON'T: 总是变化的依赖
const filtered = useMemo(() => {
  return items.filter(item => item.id === randomId());
}, [items]);
// randomId()每次不同，useMemo没意义

// ❌ DON'T: 过度优化
const style = useMemo(() => ({ color: 'red' }), []);
// 创建对象很便宜，useMemo反而增加开销
```

### 性能对比

```javascript
// 测试：1000次render

// 不使用useMemo
function Component() {
  const result = items.map(x => x * 2);  // 每次都计算
  return <div>{result}</div>;
}
// 耗时：~5ms/render

// 使用useMemo（依赖不变）
function Component() {
  const result = useMemo(() => items.map(x => x * 2), [items]);
  return <div>{result}</div>;
}
// 耗时：~0.1ms/render（依赖比较的开销）

// 使用useMemo（依赖总是变）
function Component() {
  const items = getItems();  // 每次新数组
  const result = useMemo(() => items.map(x => x * 2), [items]);
  return <div>{result}</div>;
}
// 耗时：~5.1ms/render（计算+依赖比较）

结论：
- 依赖稳定：useMemo有效
- 依赖总变：useMemo增加开销
- 简单计算：不需要useMemo
```

---

## 八、实际应用场景

### 场景1：列表过滤/排序

```javascript
function ProductList({ products, searchText, category }) {
  // 缓存过滤结果
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()))
      .filter(p => category === 'all' || p.category === category)
      .sort((a, b) => b.rating - a.rating);
  }, [products, searchText, category]);
  
  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// 优势：
// - products、searchText、category都没变时，不重新计算
// - 避免了filter、filter、sort三次遍历
```

### 场景2：Context value优化

```javascript
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  // ❌ 问题：每次render都创建新对象
  const value = { theme, setTheme };
  
  // ✅ 优化：缓存value
  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme]  // setTheme是稳定的，不需要依赖
  );
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Context value稳定的好处：
// 所有useContext(ThemeContext)的组件
// 在value不变时不会重新render
```

### 场景3：事件处理器

```javascript
function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // 缓存搜索函数
  const handleSearch = useCallback(async () => {
    const data = await searchAPI(query);
    setResults(data);
  }, [query]);
  
  // 缓存防抖函数
  const debouncedSearch = useMemo(() => {
    return debounce(handleSearch, 300);
  }, [handleSearch]);
  
  return (
    <>
      <input
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          debouncedSearch();  // 防抖搜索
        }}
      />
      <ResultsList results={results} />
    </>
  );
}

// handleSearch只在query变化时重新创建
// debouncedSearch只在handleSearch变化时重新创建
// 避免了每次render都创建新的debounce实例
```

### 场景4：复杂的派生状态

```javascript
function DataDashboard({ rawData }) {
  // 多个昂贵的计算
  const summary = useMemo(() => {
    // 计算总结数据
    return {
      total: rawData.reduce((sum, item) => sum + item.value, 0),
      average: rawData.reduce((sum, item) => sum + item.value, 0) / rawData.length,
      max: Math.max(...rawData.map(item => item.value)),
      min: Math.min(...rawData.map(item => item.value)),
    };
  }, [rawData]);
  
  const chartData = useMemo(() => {
    // 转换为图表格式
    return rawData.map(item => ({
      x: item.timestamp,
      y: item.value,
      label: formatLabel(item),
    }));
  }, [rawData]);
  
  const categories = useMemo(() => {
    // 提取分类
    const catSet = new Set(rawData.map(item => item.category));
    return Array.from(catSet).sort();
  }, [rawData]);
  
  return (
    <div>
      <Summary data={summary} />
      <Chart data={chartData} />
      <CategoryFilter categories={categories} />
    </div>
  );
}
```

---

## 九、常见陷阱与错误

### 陷阱1：在useMemo内部读取state

```javascript
// ❌ 错误：遗漏依赖
function Component() {
  const [count, setCount] = useState(0);
  const [multiplier, setMultiplier] = useState(2);
  
  const result = useMemo(() => {
    return count * multiplier;  // 使用了multiplier
  }, [count]);  // ❌ 缺少multiplier依赖
  
  return <div>{result}</div>;
}

// ESLint会警告：
// React Hook useMemo has a missing dependency: 'multiplier'

// ✅ 正确：添加所有依赖
const result = useMemo(() => {
  return count * multiplier;
}, [count, multiplier]);
```

### 陷阱2：依赖引用类型

```javascript
// ❌ 问题：对象/数组依赖
function Component({ config }) {
  const processed = useMemo(() => {
    return processConfig(config);
  }, [config]);  // config是对象，引用每次可能都变
  
  return <div>{processed}</div>;
}

// ✅ 解决：依赖具体字段
function Component({ config }) {
  const processed = useMemo(() => {
    return processConfig(config);
  }, [config.theme, config.lang]);  // 依赖基本类型
  
  return <div>{processed}</div>;
}
```

### 陷阱3：过度使用

```javascript
// ❌ 过度优化
function Component() {
  const a = useMemo(() => 1 + 1, []);
  const b = useMemo(() => 'hello', []);
  const c = useMemo(() => true, []);
  
  return <div>{a} {b} {c}</div>;
}

// 常量直接定义即可，不需要useMemo
// useMemo本身有开销（创建Hook、比较依赖）

// ✅ 简单值直接定义
function Component() {
  const a = 2;
  const b = 'hello';
  const c = true;
  
  return <div>{a} {b} {c}</div>;
}
```

---

## 十、性能分析与建议

### 使用场景判断

```text
使用useMemo的判断流程：

1. 计算是否昂贵？
   └─ 是 → 继续
   └─ 否 → 不需要useMemo

2. 依赖是否稳定？
   └─ 是 → 有效，使用useMemo
   └─ 否 → 无效，不要用

3. 是否传递给memo组件？
   └─ 是 → 使用useMemo
   └─ 否 → 根据情况1、2判断

4. 是否作为其他Hook的依赖？
   └─ 是 → 使用useMemo稳定引用
   └─ 否 → 根据情况1、2判断
```

### 最佳实践

```javascript
// ✅ 推荐场景
// 1. 昂贵计算
const expensiveResult = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// 2. 稳定引用（配合memo）
const config = useMemo(() => ({ theme, lang }), [theme, lang]);
const handleClick = useCallback(() => {
  doSomething();
}, []);

// 3. 依赖链优化
const a = useMemo(() => processA(data), [data]);
const b = useMemo(() => processB(a), [a]);  // a稳定，b才稳定

// ❌ 不推荐场景
// 1. 基本类型
const double = useMemo(() => count * 2, [count]);
// 直接：const double = count * 2

// 2. 简单对象（不传给子组件）
const style = useMemo(() => ({ color: 'red' }), []);
// 直接：const style = { color: 'red' }（组件内部使用）

// 3. 每次render都创建依赖
const obj = { x: 1 };  // 新对象
const result = useMemo(() => process(obj), [obj]);
// obj每次都变，useMemo失效
```

---

## 十一、源码关键路径

```javascript
useMemo/useCallback/React.memo核心文件：

packages/react/src/
├── ReactMemo.js                        # React.memo创建
│   └── memo()                          # 创建memo组件类型
│
packages/react-reconciler/src/
├── ReactFiberHooks.js                  # useMemo/useCallback实现
│   ├── mountMemo()                     # useMemo mount
│   ├── updateMemo()                    # useMemo update
│   ├── mountCallback()                 # useCallback mount
│   ├── updateCallback()                # useCallback update
│   └── areHookInputsEqual()            # 依赖比较（共享）
│
├── ReactFiberBeginWork.js              # React.memo更新逻辑
│   ├── updateMemoComponent()           # MemoComponent更新
│   ├── updateSimpleMemoComponent()     # SimpleMemoComponent更新（优化路径）
│   └── isSimpleFunctionComponent()     # 判断是否为简单函数组件
│
├── ReactWorkTags.js                    # Fiber节点类型
│   ├── MemoComponent = 14              # 复杂memo组件
│   └── SimpleMemoComponent = 15        # 简单memo组件（优化）
│
└── shared/shallowEqual.js              # 浅比较实现
    └── shallowEqual()                  # props浅比较
```

**数据结构**：

```javascript
// React.memo创建的elementType
{
  $$typeof: REACT_MEMO_TYPE,
  type: Component,        // 原始组件
  compare: compare | null // 自定义比较函数
}

// Hook.memoizedState（useMemo/useCallback）
[value/fn, deps]  // [缓存值, 依赖数组]

// Fiber节点
{
  tag: MemoComponent | SimpleMemoComponent,
  type: Component,
  memoizedProps: prevProps,
  // ...
}
```

---

## 十二、面试要点速记

### 快速回答框架

**useMemo和useCallback的关系？**
- useCallback是useMemo的特殊情况
- useCallback(fn, deps) = useMemo(() => fn, deps)
- 都是缓存优化，避免重复计算/创建

**React.memo的实现原理？**
1. 创建elementType：`{$$typeof: REACT_MEMO_TYPE, type, compare}`
2. 根据组件类型创建MemoComponent或SimpleMemoComponent Fiber
3. 更新时比较props：自定义compare或shallowEqual
4. props相等且无更新：调用bailout跳过渲染

**useMemo/useCallback的实现原理？**
1. Hook.memoizedState保存 [value/fn, deps]
2. 每次render比较deps
3. deps相同返回缓存值
4. deps变化重新计算/创建

**如何比较依赖/props？**
- useMemo/useCallback：areHookInputsEqual，Object.is逐个比较
- React.memo：shallowEqual，浅比较props对象的每个属性
- 都使用Object.is进行值比较

**何时使用？**
- useMemo：昂贵计算、稳定引用、作为依赖
- useCallback：传递给memo组件、事件处理器
- React.memo：昂贵的子组件、props稳定的组件

**React.memo vs useMemo/useCallback？**
- React.memo：组件级优化，跳过组件渲染
- useMemo/useCallback：值级优化，缓存值/函数
- 配合使用：useMemo/useCallback提供稳定props，React.memo跳过渲染

### 加分项

1. **能说明React.memo的两种Fiber类型**：
   - SimpleMemoComponent：普通函数组件，优化路径
   - MemoComponent：复杂组件（forwardRef等），通用路径

2. **能说明与React.memo的配合**：
   - useMemo/useCallback提供稳定props引用
   - React.memo检测到props相等时跳过渲染
   - 两者配合实现完整的优化链路

3. **能分析性能trade-off**：
   - useMemo有开销（创建Hook、比较依赖）
   - React.memo有开销（比较props、检查更新）
   - 只在收益>开销时使用

4. **能识别过度优化**：
   - 简单计算不需要useMemo
   - 简单组件不需要React.memo
   - 依赖/props总变化时无效

5. **能给出最佳实践**：
   - 先profiling，再优化
   - 不要过早优化
   - 理解shallowEqual的局限性

6. **能说明shallowEqual的工作原理**：
   - 先检查引用相等（Object.is）
   - 再检查键数量和每个属性的值
   - 只做浅比较，不递归比较嵌套对象

### 常见追问

**Q: useCallback和useMemo有性能差异吗？**
A:
- 没有，实现几乎相同
- 只是返回值不同（函数 vs 计算结果）

**Q: deps为空数组会怎样？**
A:
- 值/函数永远不变
- 等价于全局常量
- 但每次render都会比较deps（轻微开销）

**Q: 不传deps会怎样？**
A:
- deps = undefined
- 每次都重新计算/创建
- 失去缓存意义

**Q: 缓存保存在哪里？**
A:
- useMemo/useCallback：Hook.memoizedState
- React.memo：Fiber.memoizedProps
- 跟随Fiber生命周期
- 组件卸载时清除

**Q: React.memo的SimpleMemoComponent和MemoComponent有什么区别？**
A:
- SimpleMemoComponent：普通函数组件，直接优化，更快
- MemoComponent：复杂组件（forwardRef等），需要创建子Fiber
- React会根据组件类型自动选择

**Q: React.memo的比较函数什么时候执行？**
A:
- 在beginWork阶段执行
- 每次组件更新时都会比较
- 比较发生在渲染之前，用于决定是否跳过渲染

**Q: shallowEqual为什么是浅比较？**
A:
- 性能：深比较O(n)递归，可能很慢
- 不可变数据：配合不可变更新，浅比较足够
- 开发者控制：通过引用相等性，开发者控制更新时机

**Q: React.memo和PureComponent有什么区别？**
A:
- React.memo：函数组件，只比较props
- PureComponent：类组件，比较props和state
- React.memo更灵活，可以自定义比较函数

**Q: 什么时候不应该使用React.memo？**
A:
- 简单组件（render很快）
- props总是变化的组件
- 优化收益小于memo开销
- 组件很少render

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberHooks.js`
- React源码：`packages/react-reconciler/src/ReactFiberBeginWork.js`
- React源码：`packages/react/src/ReactMemo.js`
- [useMemo文档](https://react.dev/reference/react/useMemo)
- [useCallback文档](https://react.dev/reference/react/useCallback)
- [React.memo文档](https://react.dev/reference/react/memo)
- [Before You memo()](https://overreacted.io/before-you-memo/)

**最后更新**: 2025-01-XX

