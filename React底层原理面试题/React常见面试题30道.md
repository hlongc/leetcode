# React 常见面试题 30 道（实战篇）

> 结合 React 底层原理，深入解析 30 个最常见的 React 面试题
>
> **版本说明**：本文档基于 **React 19** 编写，包含 React 19 的最新特性和变化。

---

## 📋 目录

### 状态管理类（5 题）

1. setState 是同步还是异步的？
2. 为什么多次 setState 只会 render 一次？
3. 函数式 setState 和直接传值有什么区别？
4. setState 之后如何立即获取更新后的值？
5. 为什么不能直接修改 state？

### 组件和渲染类（5 题）

6. React 组件什么时候会重新渲染？
7. 父组件 render，子组件一定会 render 吗？
8. 如何避免组件不必要的渲染？
9. React 如何判断何时重新渲染组件？
10. 虚拟 DOM 一定比真实 DOM 快吗？

### Hooks 使用类（6 题）

11. useEffect 和 useLayoutEffect 的区别？
12. useEffect 的依赖数组为空会怎样？
13. useEffect 的 cleanup 函数什么时候执行？
14. 为什么 Hook 必须在顶层调用？
15. 自定义 Hook 有什么限制？
16. useCallback 和 useMemo 什么时候用？

### 事件系统类（3 题）

17. React 事件和原生事件的区别？
18. React 事件中的 event 对象是什么？
19. 如何阻止事件冒泡？

### 性能优化类（5 题）

20. React.memo 有什么用？什么时候用？
21. key 的作用是什么？为什么不能用 index？
22. 如何优化长列表性能？
23. 什么是 React 的批处理？
24. 如何避免内联函数和对象？

### Refs 和 DOM 类（2 题）

25. ref 的作用和使用场景？
26. React 19 中 ref 的新特性？forwardRef 还需要吗？

### Context 和通信类（2 题）

27. Context 如何工作？有什么性能问题？
28. 组件通信有哪些方式？

### 错误处理类（1 题）

29. ErrorBoundary 的原理和使用？

### 最佳实践类（1 题）

30. React 开发有哪些最佳实践？

---

## 一、状态管理类

### 1. setState 是同步还是异步的？

**答案：在 React 18 中，setState 的行为取决于调用位置，但表现上都是"异步"的（批处理）。**

#### 深入解析

**React 18 的批处理机制**（详见第 13 题）：

```javascript
function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("before:", count); // 0

    setCount(1);
    console.log("after:", count); // 仍然是0（不是1）

    setCount(2);
    console.log("after:", count); // 仍然是0（不是2）
  };

  console.log("render:", count); // 只打印一次：2

  return <button onClick={handleClick}>Click</button>;
}
```

**原理说明**：

```javascript
// setState的执行过程（底层原理见第9题）

1. setCount(1)
   → 创建update对象 {action: 1, lane: SyncLane}
   → 加入updateQueue
   → 调度微任务（ensureRootIsScheduled）
   → 立即返回（同步）

2. setCount(2)
   → 创建update对象 {action: 2}
   → 加入updateQueue
   → didScheduleMicrotask = true，跳过调度
   → 立即返回（同步）

3. 同步代码执行完

4. 微任务执行
   → processRootScheduleInMicrotask
   → render阶段
   → 处理updateQueue：update1(1) → update2(2)
   → 最终state = 2

5. commit
   → 用户看到count = 2

关键：
- setState本身是同步函数
- 但state更新是异步的（在微任务中）
- React 18的自动批处理保证性能
```

**特殊情况：flushSync 强制同步**

```javascript
import { flushSync } from "react-dom";

function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    flushSync(() => {
      setCount(1);
    });
    console.log(count); // 仍然是0（闭包）

    // 但DOM已经更新了
    const button = document.querySelector("button");
    console.log(button.textContent); // "Count: 1"
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

**总结**：

- ✅ setState 函数本身是同步的
- ✅ state 的更新是批处理的（看起来像异步）
- ✅ React 18 所有场景都自动批处理
- ✅ 使用 flushSync 可以强制同步更新 DOM

---

### 2. 为什么多次 setState 只会 render 一次？

**答案：React 的批处理机制（Batching）会合并多个 setState。**

#### 深入解析

**批处理的实现**（详见第 13 题）：

```javascript
function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const data = await api.signup({ username, email, password });

    // React 18: 这4个setState批处理，只render 1次
    setUsername("");
    setEmail("");
    setPassword("");
    setErrors({});

    console.log("render"); // 只打印一次
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**底层原理**：

```
批处理的关键机制：

1. 微任务调度标记（didScheduleMicrotask）
   第1个setState:
     → didScheduleMicrotask = false
     → queueMicrotask(processRootScheduleInMicrotask)
     → didScheduleMicrotask = true

   第2-4个setState:
     → didScheduleMicrotask = true
     → 跳过调度，复用同一个微任务

2. update队列
   所有setState的update对象都加入同一个队列：
   queue.pending = update4 → update1 → update2 → update3 → update4

3. 批量处理
   微任务执行时：
   → processRootScheduleInMicrotask
   → render阶段
   → processUpdateQueue一次性处理所有update
   → 计算最终state
   → 一次render

性能提升：
4次setState → 1次render
节省3次render（75%性能提升）
```

**React 17 vs React 18**：

```javascript
// React 17：只在事件中批处理
<button onClick={() => {
  setCount(1);
  setFlag(true);
  // 批处理，1次render ✅
}}>

setTimeout(() => {
  setCount(1);
  setFlag(true);
  // 不批处理，2次render ❌
}, 100);

// React 18：所有场景都批处理
setTimeout(() => {
  setCount(1);
  setFlag(true);
  // 批处理，1次render ✅
}, 100);

Promise.then(() => {
  setCount(1);
  setFlag(true);
  // 批处理，1次render ✅
});
```

---

### 3. 函数式 setState 和直接传值有什么区别？

**答案：函数式 setState 基于最新 state 计算，避免闭包陷阱；直接传值使用捕获的闭包值。**

#### 深入解析

**问题示例**：

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // ❌ 错误：直接传值
    setCount(count + 1); // count = 0
    setCount(count + 1); // count = 0
    setCount(count + 1); // count = 0

    // 结果：count变成1（不是3）
  };

  console.log("render:", count);

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

**底层原理**（详见第 9 题）：

```javascript
// 直接传值的处理
update1: {action: 0 + 1 = 1}
update2: {action: 0 + 1 = 1}
update3: {action: 0 + 1 = 1}

processUpdateQueue:
  newState = baseState  // 0
  update1: newState = 1
  update2: newState = 1
  update3: newState = 1
  最终：1

// basicStateReducer的实现
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}
```

**正确做法：函数式更新**

```javascript
const handleClickCorrect = () => {
  // ✅ 正确：函数式更新
  setCount(c => c + 1);  // c是最新值
  setCount(c => c + 1);
  setCount(c => c + 1);

  // 结果：count变成3 ✓
};

// 底层处理
update1: {action: (c) => c + 1}
update2: {action: (c) => c + 1}
update3: {action: (c) => c + 1}

processUpdateQueue:
  newState = baseState  // 0
  update1: newState = (c => c + 1)(0) = 1
  update2: newState = (c => c + 1)(1) = 2
  update3: newState = (c => c + 1)(2) = 3
  最终：3
```

**闭包陷阱示例**（详见第 10 题）：

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // ❌ 错误：闭包捕获count = 0
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // 空依赖，effect只执行一次

  // 结果：count永远在0和1之间跳动
}

// ✅ 正确：函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount((c) => c + 1); // c是最新值
  }, 1000);

  return () => clearInterval(timer);
}, []); // count正常递增
```

**总结**：

- 直接传值：使用闭包捕获的值
- 函数式更新：基于最新 state 计算
- 推荐：有依赖关系时使用函数式更新

---

### 4. setState 之后如何立即获取更新后的值？

**答案：无法立即获取（闭包限制），但可以用 useEffect、useRef 或 flushSync。**

#### 方案对比

**方案 1：useEffect（推荐）**

```javascript
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // count更新后执行
    console.log("count已更新为:", count);

    // 可以执行依赖新值的操作
    if (count > 10) {
      alert("count超过10了！");
    }
  }, [count]); // count变化时执行

  const handleClick = () => {
    setCount(count + 1);
    // 这里无法立即获取新值
  };

  return <button onClick={handleClick}>{count}</button>;
}
```

**方案 2：useRef 保存最新值**

```javascript
function Component() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 保持ref同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const handleAsync = () => {
    setCount(count + 1);

    // 在异步回调中使用ref
    setTimeout(() => {
      console.log("最新count:", countRef.current);
    }, 1000);
  };

  return <button onClick={handleAsync}>{count}</button>;
}
```

**方案 3：flushSync 立即更新 DOM**

```javascript
import { flushSync } from "react-dom";

function Component() {
  const [count, setCount] = useState(0);
  const buttonRef = useRef();

  const handleClick = () => {
    flushSync(() => {
      setCount(count + 1);
    });

    // 此时DOM已更新（但闭包中count仍是旧值）
    console.log("闭包count:", count); // 0
    console.log("DOM textContent:", buttonRef.current.textContent); // "1"
  };

  return (
    <button ref={buttonRef} onClick={handleClick}>
      {count}
    </button>
  );
}
```

**方案 4：函数式 setState + 第二个参数模拟**

```javascript
// React Hooks没有callback参数
// 但可以用useEffect模拟

function Component() {
  const [count, setCount] = useState(0);
  const [shouldLog, setShouldLog] = useState(false);

  useEffect(() => {
    if (shouldLog) {
      console.log("count更新后:", count);
      setShouldLog(false);
    }
  }, [shouldLog, count]);

  const handleClick = () => {
    setCount((c) => c + 1);
    setShouldLog(true); // 触发effect
  };

  return <button onClick={handleClick}>{count}</button>;
}
```

**为什么无法立即获取？**

```
根本原因：JavaScript闭包

handleClick函数创建时：
  count = 0（捕获当时的值）

handleClick执行时：
  setCount(1) → 创建update，稍后处理
  console.log(count) → 0（闭包值）

setState不会修改当前作用域的count变量
count要等到下次render时才更新
```

---

### 5. 为什么不能直接修改 state？

**答案：React 依赖引用比较判断是否更新，直接修改 state 会导致引用不变，无法触发更新。**

#### 问题示例

```javascript
// ❌ 错误：直接修改state
function TodoList() {
  const [todos, setTodos] = useState([{ id: 1, text: "Learn React" }]);

  const addTodo = () => {
    // 直接修改数组
    todos.push({ id: 2, text: "Learn Fiber" });
    setTodos(todos); // 引用没变！

    // 结果：组件不会重新渲染 ❌
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

**底层原理**（详见第 5 题 bailout）：

```javascript
// React的更新判断
function beginWork(current, workInProgress, renderLanes) {
  const oldProps = current.memoizedProps;
  const newProps = workInProgress.pendingProps;

  // 关键：浅比较
  if (oldProps === newProps) {  // 引用相等
    // 没有变化，bailout
    return bailoutOnAlreadyFinishedWork(...);
  }

  // 有变化，继续render
}

// useState的eager state优化
function dispatchSetState(fiber, queue, action) {
  // ...
  const currentState = queue.lastRenderedState;
  const eagerState = lastRenderedReducer(currentState, action);

  if (is(eagerState, currentState)) {  // Object.is比较
    // state没变，跳过render
    return;
  }

  // state变了，调度render
}
```

**正确做法：不可变更新**

```javascript
// ✅ 正确：创建新数组
const addTodo = () => {
  setTodos([...todos, { id: 2, text: "Learn Fiber" }]);
  // 新数组，引用不同，触发更新 ✓
};

// ✅ 正确：数组方法返回新数组
const removeTodo = (id) => {
  setTodos(todos.filter((todo) => todo.id !== id));
};

// ✅ 正确：对象展开
const [user, setUser] = useState({ name: "Tom", age: 20 });

const updateName = () => {
  setUser({ ...user, name: "Jerry" });
  // 新对象，引用不同 ✓
};

// ✅ 正确：嵌套对象的不可变更新
const updateCity = () => {
  setUser({
    ...user,
    address: {
      ...user.address,
      city: "New York",
    },
  });
};

// ✅ 推荐：使用Immer简化
import { produce } from "immer";

const updateCity = () => {
  setUser(
    produce((draft) => {
      draft.address.city = "New York";
      // Immer自动创建新对象
    })
  );
};
```

**性能考虑**：

```javascript
// 大型状态的不可变更新可能很慢
const bigArray = Array(10000).fill({...});

// ❌ 慢：每次都展开整个数组
setArray([...bigArray, newItem]);

// ✅ 优化：使用useReducer
function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return [...state, action.item];
    case 'remove':
      return state.filter(item => item.id !== action.id);
  }
}

const [array, dispatch] = useReducer(reducer, bigArray);

// 或者使用Immer（内部优化）
```

---

## 二、组件和渲染类

### 6. React 组件什么时候会重新渲染？

**答案：5 种情况会触发组件重新渲染。**

#### 5 种触发条件

```javascript
// 1. State变化
function Component() {
  const [count, setCount] = useState(0);

  // setCount触发render
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

// 2. Props变化
function Parent() {
  const [value, setValue] = useState(0);
  return <Child prop={value} />; // value变化，Child render
}

function Child({ prop }) {
  console.log("Child render");
  return <div>{prop}</div>;
}

// 3. Context变化
const MyContext = React.createContext();

function Parent() {
  const [value, setValue] = useState(0);
  return (
    <MyContext.Provider value={value}>
      <Child /> {/* value变化，Child render */}
    </MyContext.Provider>
  );
}

function Child() {
  const value = useContext(MyContext);
  return <div>{value}</div>;
}

// 4. 父组件render
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Child /> {/* Parent render，Child也render */}
    </>
  );
}

function Child() {
  console.log("Child render"); // 每次Parent更新都打印
  return <div>Child</div>;
}

// 5. forceUpdate（类组件）
class Component extends React.Component {
  handleClick = () => {
    this.forceUpdate(); // 强制render
  };

  render() {
    return <button onClick={this.handleClick}>Force Update</button>;
  }
}
```

**底层原理**（详见第 5 题）：

```
beginWork的判断逻辑：

if (oldProps !== newProps || hasContextChanged()) {
  // props或context变化
  didReceiveUpdate = true;
  // 继续render
} else {
  // props没变，检查是否有update或context变化
  if (checkScheduledUpdateOrContext(current, renderLanes)) {
    // 有setState或context变化
    didReceiveUpdate = true;
  } else {
    // 可以bailout
    return bailoutOnAlreadyFinishedWork(...);
  }
}
```

---

### 7. 父组件 render，子组件一定会 render 吗？

**答案：默认会，但可以通过优化避免。**

#### 默认行为

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  console.log("Parent render");

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Child />
    </>
  );
}

function Child() {
  console.log("Child render"); // Parent每次更新都会打印
  return <div>Child</div>;
}

// 点击按钮：
// "Parent render"
// "Child render"
```

**原理**（详见第 7 题）：

```
beginWork(Parent):
  → 执行Parent函数
  → 返回新的React元素树
  → reconcileChildren
    → 发现Child元素
    → 虽然Child的props没变，但默认会继续render

为什么？
- Parent render创建了新的Child元素
- React认为可能有变化（保守策略）
- 继续beginWork(Child)
```

#### 优化方案

**方案 1：React.memo**

```javascript
const MemoChild = React.memo(function Child() {
  console.log("Child render");
  return <div>Child</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <MemoChild /> {/* props没变，不render */}
    </>
  );
}

// 点击按钮：
// "Parent render"
// （Child不render）✓
```

**方案 2：children prop**

```javascript
function Parent({ children }) {
  const [count, setCount] = useState(0);

  console.log("Parent render");

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {children} {/* children是已创建的元素，引用不变 */}
    </>
  );
}

function App() {
  return (
    <Parent>
      <Child /> {/* 在App中创建，Parent render不影响 */}
    </Parent>
  );
}

// 点击按钮：
// "Parent render"
// （Child不render）✓
```

**方案 3：状态下沉**

```javascript
// ❌ 不好：状态在顶层
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Counter count={count} setCount={setCount} />
      <ExpensiveComponent /> {/* count变化会render */}
    </>
  );
}

// ✅ 好：状态下沉
function App() {
  return (
    <>
      <Counter /> {/* 状态在内部 */}
      <ExpensiveComponent /> {/* 不受影响 */}
    </>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

---

### 8. 如何避免组件不必要的渲染？

**答案：使用 React.memo、useMemo、useCallback、合理拆分组件。**

#### 优化策略

**策略 1：React.memo（详见第 5 题）**

```javascript
// 适用于：props没变的函数组件
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  console.log("ExpensiveList render");

  // 昂贵的计算
  const processed = items.map((item) => expensiveProcess(item));

  return (
    <ul>
      {processed.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

function App() {
  const [count, setCount] = useState(0);
  const items = [
    /* 固定数据 */
  ];

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <ExpensiveList items={items} /> {/* items没变，不render */}
    </>
  );
}
```

**策略 2：useMemo 缓存计算结果（详见第 11 题）**

```javascript
function SearchResults({ data, query }) {
  // ✅ 缓存过滤结果
  const filteredData = useMemo(() => {
    console.log("filtering...");
    return data.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [data, query]); // 只有data或query变化才重新计算

  return (
    <ul>
      {filteredData.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**策略 3：useCallback 缓存函数（详见第 11 题）**

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 缓存回调函数
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []); // 依赖为空，函数引用永不变

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <MemoChild onClick={handleClick} /> {/* onClick没变，不render */}
    </>
  );
}

const MemoChild = React.memo(function Child({ onClick }) {
  console.log("Child render");
  return <button onClick={onClick}>Click</button>;
});
```

**策略 4：合理拆分组件**

```javascript
// ❌ 不好：一个大组件
function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // activeTab变化，整个Dashboard都render

  return (
    <>
      <Tabs activeTab={activeTab} onChange={setActiveTab} />
      <UserPanel data={userData} /> {/* 不必要的render */}
      <Notifications items={notifications} /> {/* 不必要的render */}
    </>
  );
}

// ✅ 好：拆分组件
function Dashboard() {
  return (
    <>
      <TabsContainer /> {/* activeTab状态在内部 */}
      <UserPanel /> {/* 独立状态 */}
      <Notifications /> {/* 独立状态 */}
    </>
  );
}

function TabsContainer() {
  const [activeTab, setActiveTab] = useState("home");
  return <Tabs activeTab={activeTab} onChange={setActiveTab} />;
}
```

**策略 5：使用 key 重置组件**

```javascript
function UserProfile({ userId }) {
  return (
    <ProfilePanel key={userId} userId={userId} />
    // userId变化，key变化，卸载旧组件，挂载新组件
    // 自动重置内部状态
  );
}

function ProfilePanel({ userId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // userId变化，整个组件重新mount
    // 不需要清理旧数据
    fetchUser(userId).then(setData);
  }, [userId]);

  return <div>{data?.name}</div>;
}
```

---

## 三、Hooks 使用类

### 11. useEffect 和 useLayoutEffect 的区别？

**答案：执行时机不同，useEffect 异步不阻塞，useLayoutEffect 同步阻塞。**

#### 执行时机对比（详见第 10 题和第 16 题）

```
时间轴：

useLayoutEffect:
render → commit(mutation) → useLayoutEffect → 浏览器绘制 → 用户看到
                                 ↑
                            同步执行，阻塞绘制

useEffect:
render → commit(mutation) → 浏览器绘制 → 用户看到 → useEffect
                                                      ↑
                                               异步执行，不阻塞
```

#### 使用场景

**useLayoutEffect：需要同步读写 DOM**

```javascript
// ✅ 正确：使用useLayoutEffect
function Tooltip({ targetRef }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    // 同步读取DOM
    const rect = targetRef.current.getBoundingClientRect();

    // 立即设置位置
    setPosition({
      x: rect.left,
      y: rect.bottom + 10,
    });
  }, [targetRef]);

  // 好处：用户只看到正确位置，不会闪烁
  return (
    <div style={{ position: "absolute", left: position.x, top: position.y }}>
      Tooltip
    </div>
  );
}

// ❌ 错误：使用useEffect
// 问题：用户会先看到position={0,0}，然后跳到正确位置（闪烁）
```

**useEffect：大部分场景**

```javascript
// ✅ 正确：使用useEffect
function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 数据获取不需要同步
    fetch("/api/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return <div>{data}</div>;
}
```

**性能对比**：

```
测试：1000个useEffect vs useLayoutEffect

useEffect（异步）：
- commit完成 → 立即绘制 → 用户看到更新
- effect在后台执行，不阻塞
- 总耗时：15ms（用户感知）

useLayoutEffect（同步）：
- commit → 等待1000个effect执行 → 绘制
- 阻塞绘制
- 总耗时：50ms（用户感知）

结论：useLayoutEffect会延迟绘制，影响性能
```

---

### 14. 为什么 Hook 必须在顶层调用？

**答案：Hook 依赖调用顺序来匹配，顺序变化会导致 Hook 错配。**

#### 错误示例（详见第 8 题）

```javascript
// ❌ 错误：条件调用
function Component({ show }) {
  const [count, setCount] = useState(0);

  if (show) {
    const [name, setName] = useState('');  // ❌ 条件中调用
  }

  return <div>{count}</div>;
}

// 问题
首次render（show=true）：
  Hook链表：Hook1(count) → Hook2(name)

第二次render（show=false）：
  Hook链表：Hook1(count)

  React期望：Hook1(count) → Hook2(name)
  实际只有：Hook1(count)

  错误："Rendered fewer hooks than expected"
```

**底层原理**：

```javascript
// Hook的匹配机制（详见第8题）

mount时：
call#1: useState(0)    → 创建Hook1，加入链表
call#2: useState('')   → 创建Hook2，加入链表
call#3: useEffect(...) → 创建Hook3，加入链表

update时：
call#1: useState(0)    → 从Hook1读取
call#2: useState('')   → 从Hook2读取
call#3: useEffect(...) → 从Hook3读取

完全依赖调用顺序！
没有使用key或name来标识Hook
```

**正确做法**：

```javascript
// ✅ 正确：Hook在顶层
function Component({ show }) {
  const [count, setCount] = useState(0);
  const [name, setName] = useState(""); // 总是调用

  // 条件逻辑放在Hook外部
  useEffect(() => {
    if (show) {
      console.log(name);
    }
  }, [show, name]);

  return <div>{count}</div>;
}
```

---

## 四、性能优化类

### 20. React.memo 有什么用？什么时候用？

**答案：React.memo 缓存组件，props 没变时跳过 render。**

#### 基本用法（详见第 5 题）

```javascript
const MemoComponent = React.memo(function MyComponent({ value }) {
  console.log("render");
  return <div>{value}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [value] = useState("constant");

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <MemoComponent value={value} /> {/* value没变，不render */}
    </>
  );
}
```

#### 何时使用

**✅ DO：昂贵组件**

```javascript
const ExpensiveChart = React.memo(function Chart({ data }) {
  // 复杂的图表渲染逻辑
  const chartData = processChartData(data); // 耗时
  return <canvas>{/* 绘制图表 */}</canvas>;
});
```

**✅ DO：频繁 render 的父组件中的稳定子组件**

```javascript
function FrequentlyUpdatingParent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCount((c) => c + 1), 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div>Count: {count}</div>
      <StableChild /> {/* memo很有用 */}
    </>
  );
}

const StableChild = React.memo(function Child() {
  // 复杂的渲染
  return <div>{/* ... */}</div>;
});
```

**❌ DON'T：简单组件**

```javascript
// ❌ 过度优化
const SimpleText = React.memo(function Text({ children }) {
  return <span>{children}</span>; // 超级简单
});

// memo本身有开销（浅比较props）
// 简单组件render很快，不需要memo
```

**❌ DON'T：props 总是变化**

```javascript
function Parent() {
  return (
    <MemoChild
      data={{ value: Math.random() }} // 每次新对象
      onClick={() => console.log("hi")} // 每次新函数
    />
  );
}

// memo无效，因为props总是不同
```

---

### 21. key 的作用是什么？为什么不能用 index？

**答案：key 唯一标识节点，帮助 React 高效复用；index 作为 key 会导致状态错乱。**

#### key 的作用（详见第 6 题）

```javascript
// 没有key：按位置匹配
旧：[<Item>A</Item>, <Item>B</Item>, <Item>C</Item>]
新：[<Item>B</Item>, <Item>A</Item>, <Item>C</Item>]

React认为：
位置0: A变成B → 更新
位置1: B变成A → 更新
位置2: C还是C → 复用

结果：2次更新（不是最优）

// 有key：按key匹配
旧：[<Item key="a">A</Item>, <Item key="b">B</Item>, <Item key="c">C</Item>]
新：[<Item key="b">B</Item>, <Item key="a">A</Item>, <Item key="c">C</Item>]

React识别：
key=b: 位置变了 → 移动
key=a: 位置变了 → 移动
key=c: 位置没变 → 复用

结果：2次移动（最优，保持了组件状态）
```

#### 为什么不能用 index（详见第 6 题）

**Bug 演示**：

```javascript
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false },
    { id: 2, text: 'Learn Fiber', done: false },
    { id: 3, text: 'Build App', done: false },
  ]);

  return (
    <ul>
      {todos.map((todo, index) => (
        <TodoItem
          key={index}  // ❌ 使用index
          todo={todo}
        />
      ))}
    </ul>
  );
}

function TodoItem({ todo }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <li>
      {isEditing ? (
        <input defaultValue={todo.text} />
      ) : (
        <span onClick={() => setIsEditing(true)}>{todo.text}</span>
      )}
    </li>
  );
}

// Bug场景：
1. 用户让第2项进入编辑状态（Learn Fiber）
2. 删除第1项（Learn React）
3. 结果：第3项（Build App）错误地进入编辑状态！

原因：
删除前：
  TodoItem(key=0, todo="Learn React", isEditing=false)
  TodoItem(key=1, todo="Learn Fiber", isEditing=true)
  TodoItem(key=2, todo="Build App", isEditing=false)

删除后数组：
  [{ id: 2, text: 'Learn Fiber' }, { id: 3, text: 'Build App' }]

新元素：
  TodoItem(key=0, todo="Learn Fiber")
  TodoItem(key=1, todo="Build App")

diff过程：
  key=0: 复用旧的key=0（Learn React的Fiber）
         更新props为"Learn Fiber"
         isEditing=false保留
  key=1: 复用旧的key=1（Learn Fiber的Fiber）
         更新props为"Build App"
         isEditing=true保留 ← Bug！

结果：Build App继承了Learn Fiber的编辑状态
```

**正确做法**：

```javascript
// ✅ 使用稳定的唯一key
{todos.map(todo => (
  <TodoItem
    key={todo.id}  // 使用ID
    todo={todo}
  />
))}

// 删除第1项后：
新元素：
  TodoItem(key=2, todo="Learn Fiber")
  TodoItem(key=3, todo="Build App")

diff过程：
  key=2: 在Map中找到，复用，isEditing=true ✓
  key=3: 在Map中找到，复用，isEditing=false ✓
  key=1: Map中剩余，删除

结果：每个组件的状态跟随正确的数据 ✓
```

---

### 23. 什么是 React 的批处理？

**答案：批处理是将多个 state 更新合并为一次 render 的性能优化。**

#### React 18 的自动批处理（详见第 13 题）

```javascript
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // ✅ 事件处理器中批处理
  const handleClick = () => {
    setCount(1); // update1
    setFlag(true); // update2
    setCount(2); // update3
    // 只render 1次，count=2, flag=true
  };

  // ✅ Promise中批处理（React 18新增）
  const handleAsync = async () => {
    await fetch("/api");

    setCount(1); // update1
    setFlag(true); // update2
    // 只render 1次
  };

  // ✅ setTimeout中批处理（React 18新增）
  const handleTimeout = () => {
    setTimeout(() => {
      setCount(1);
      setFlag(true);
      // 只render 1次
    }, 1000);
  };

  return (
    <>
      <button onClick={handleClick}>Click</button>
      <button onClick={handleAsync}>Async</button>
      <button onClick={handleTimeout}>Timeout</button>
    </>
  );
}
```

**底层原理**：

```
React 18的批处理实现：

1. 第一个setState:
   → ensureRootIsScheduled(root)
   → didScheduleMicrotask = false
   → queueMicrotask(processRootScheduleInMicrotask)
   → didScheduleMicrotask = true

2. 后续setState:
   → ensureRootIsScheduled(root)
   → didScheduleMicrotask = true
   → 跳过调度（复用同一个微任务）

3. 同步代码执行完

4. 微任务执行:
   → 批量处理所有update
   → 一次render

关键：所有setState都在同一个事件循环
```

---

### 24. 如何避免内联函数和对象？

**答案：使用 useCallback 和 useMemo 缓存，避免每次 render 创建新引用。**

#### 问题示例

```javascript
// ❌ 问题：每次render都创建新函数和对象
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>

      <MemoChild
        onClick={() => console.log("hi")} // 新函数
        config={{ theme: "dark" }} // 新对象
      />
    </>
  );
}

const MemoChild = React.memo(Child);

// 结果：React.memo失效，Child每次都render
// 因为onClick和config引用总是不同
```

**解决方案**：

```javascript
// ✅ 正确：使用useCallback和useMemo
function Parent() {
  const [count, setCount] = useState(0);

  // 缓存函数
  const handleClick = useCallback(() => {
    console.log("hi");
  }, []);

  // 缓存对象
  const config = useMemo(() => ({ theme: "dark" }), []);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <MemoChild onClick={handleClick} config={config} />
      {/* onClick和config引用稳定，Child不render */}
    </>
  );
}
```

**何时需要避免**：

```javascript
// ✅ 需要避免：传给memo组件
<MemoChild onClick={useCallback(...)} />

// ✅ 需要避免：作为其他Hook的依赖
const config = useMemo(() => ({...}), []);
useEffect(() => {
  applyConfig(config);
}, [config]);  // config引用稳定

// ❌ 不需要避免：普通props
<button onClick={() => console.log('hi')}>
  {/* 没问题，button不是memo组件 */}
</button>

// ❌ 不需要避免：不传给子组件的对象
const style = { color: 'red' };  // 直接定义即可
return <div style={style}>...</div>;
```

---

## 五、事件系统类

### 17. React 事件和原生事件的区别？

**答案：React 实现了合成事件系统（SyntheticEvent），统一了浏览器差异，并且有自己的事件委托机制。**

#### 主要区别

**1. 事件委托**

```javascript
// React：事件委托到root
<div id="root">
  <button onClick={handleClick}>Click</button>
  <button onClick={handleClick}>Click</button>
  <button onClick={handleClick}>Click</button>
</div>

// React只在root上注册一个事件监听器
root.addEventListener('click', dispatchEvent);

// 原生：每个元素单独注册
document.querySelector('button:nth-child(1)').addEventListener('click', ...);
document.querySelector('button:nth-child(2)').addEventListener('click', ...);
document.querySelector('button:nth-child(3)').addEventListener('click', ...);
```

**2. 命名规范**

```javascript
// React：驼峰命名
<button onClick={handleClick}>

// 原生：小写
<button onclick="handleClick()">
```

**3. 事件对象**

```javascript
function Component() {
  const handleClick = (e) => {
    // e是SyntheticEvent（合成事件）
    console.log(e.type); // "click"
    console.log(e.target); // button元素

    // 访问原生事件
    console.log(e.nativeEvent); // 原生MouseEvent
  };

  return <button onClick={handleClick}>Click</button>;
}
```

**4. 阻止默认行为**

```javascript
// React：必须显式调用preventDefault
function handleClick(e) {
  e.preventDefault();  // 必须调用
}

<a href="/page" onClick={handleClick}>Link</a>

// 原生：可以return false
<a href="/page" onclick="handleClick(); return false;">Link</a>
```

**5. 事件池（React 17 已移除）**

```javascript
// React 16：事件池
function handleClick(e) {
  setTimeout(() => {
    console.log(e.type); // null（事件对象被回收）
  }, 100);
}

// 解决：persist
function handleClick(e) {
  e.persist(); // 保留事件对象
  setTimeout(() => {
    console.log(e.type); // "click" ✓
  }, 100);
}

// React 17+：移除了事件池
function handleClick(e) {
  setTimeout(() => {
    console.log(e.type); // "click" ✓（无需persist）
  }, 100);
}
```

---

### 18. React 事件中的 event 对象是什么？

**答案：React 的事件对象是 SyntheticEvent（合成事件），它是对原生事件的跨浏览器包装。**

#### SyntheticEvent 的特性

```javascript
function Component() {
  const handleClick = (e) => {
    console.log(e); // SyntheticBaseEvent对象

    // ========== SyntheticEvent的属性 ==========
    console.log(e.type); // "click"
    console.log(e.target); // 触发事件的元素
    console.log(e.currentTarget); // 绑定事件的元素
    console.log(e.bubbles); // true
    console.log(e.cancelable); // true
    console.log(e.defaultPrevented); // false
    console.log(e.timeStamp); // 时间戳

    // ========== 访问原生事件 ==========
    console.log(e.nativeEvent); // 原生MouseEvent对象
    console.log(e.nativeEvent instanceof MouseEvent); // true

    // ========== 常用方法 ==========
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止冒泡
    e.persist(); // React 17之前需要（现在不需要）
  };

  return <button onClick={handleClick}>Click</button>;
}
```

#### 与原生事件的区别

```javascript
// 1. 属性规范化
// 原生事件：不同浏览器可能不同
event.pageX      // Chrome/Firefox
event.x          // IE

// SyntheticEvent：统一的接口
e.pageX          // 所有浏览器都有
e.clientX        // 统一的API

// 2. 事件池（React 17已移除）
// React 16：
function handleClick(e) {
  setTimeout(() => {
    console.log(e.type);  // null（事件对象被重用）
  }, 100);
}

// 需要persist
function handleClick(e) {
  e.persist();  // 保留事件对象
  setTimeout(() => {
    console.log(e.type);  // "click" ✓
  }, 100);
}

// React 17+：不再有事件池
function handleClick(e) {
  setTimeout(() => {
    console.log(e.type);  // "click" ✓（无需persist）
  }, 100);
}

// 3. 事件委托
// 原生：在每个元素上监听
<button onclick="handler">

// React：委托到root
root.addEventListener('click', dispatchEvent);
// 性能更好，内存占用更少
```

#### 获取原生事件

```javascript
function Component() {
  const handleClick = (e) => {
    const nativeEvent = e.nativeEvent;

    // 原生事件的特殊属性
    console.log(nativeEvent.offsetX);
    console.log(nativeEvent.offsetY);
    console.log(nativeEvent.which); // 鼠标按键

    // 阻止所有监听器（包括document上的）
    nativeEvent.stopImmediatePropagation();
  };

  return <button onClick={handleClick}>Click</button>;
}
```

#### 事件对象的类型

```javascript
// 不同事件类型有不同的SyntheticEvent

// MouseEvent
<button onClick={(e: React.MouseEvent) => {
  e.clientX, e.clientY
  e.button  // 0=左键，1=中键，2=右键
}}>

// KeyboardEvent
<input onKeyDown={(e: React.KeyboardEvent) => {
  e.key, e.code
  e.altKey, e.ctrlKey, e.shiftKey
}} />

// FormEvent
<form onSubmit={(e: React.FormEvent) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
}} />

// ChangeEvent
<input onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.value
}} />

// FocusEvent
<input onFocus={(e: React.FocusEvent) => {
  e.relatedTarget  // 上一个焦点元素
}} />
```

---

### 19. 如何阻止事件冒泡？

**答案：使用 e.stopPropagation()阻止 React 事件冒泡，但无法阻止原生事件冒泡。**

#### React 事件冒泡

```javascript
function Parent() {
  const handleParentClick = () => {
    console.log("Parent clicked");
  };

  return (
    <div onClick={handleParentClick}>
      <Child />
    </div>
  );
}

function Child() {
  const handleChildClick = (e) => {
    console.log("Child clicked");
    e.stopPropagation(); // 阻止冒泡到Parent
  };

  return <button onClick={handleChildClick}>Click</button>;
}

// 点击按钮：
// "Child clicked"
// （不会打印"Parent clicked"）
```

**React 事件 vs 原生事件**

```javascript
function Component() {
  useEffect(() => {
    // 原生事件监听
    const handleNativeClick = (e) => {
      console.log("Native: document clicked");
    };

    document.addEventListener("click", handleNativeClick);

    return () => {
      document.removeEventListener("click", handleNativeClick);
    };
  }, []);

  const handleReactClick = (e) => {
    console.log("React: button clicked");
    e.stopPropagation(); // 只阻止React事件
  };

  return <button onClick={handleReactClick}>Click</button>;
}

// 点击按钮输出：
// "React: button clicked"
// "Native: document clicked"  ← 原生事件仍然触发

// 为什么？
// React事件委托到root，e.stopPropagation()只阻止React内部的冒泡
// 原生事件在document上，先于React事件触发
```

**阻止原生事件冒泡**：

```javascript
function Component() {
  const handleClick = (e) => {
    e.nativeEvent.stopImmediatePropagation(); // 阻止所有监听器
  };

  return <button onClick={handleClick}>Click</button>;
}
```

---

## 六、Context 和通信类

### 27. Context 如何工作？有什么性能问题？

**答案：Context 通过 Provider/Consumer 传递数据，但 value 变化会导致所有消费者重新渲染。**

#### 基本用法

```javascript
const ThemeContext = React.createContext("light");

function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  // Toolbar不使用context，但会因为Parent render而render
  return <ThemedButton />;
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

**性能问题**：

```javascript
// ❌ 问题：value是新对象，导致所有消费者render
function App() {
  const [user, setUser] = useState({ name: "Tom" });
  const [theme, setTheme] = useState("light");

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {" "}
      {/* 每次render都是新对象 */}
      <ThemeContext.Provider value={theme}>
        <Page />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// App任何state变化 → value新对象 → 所有useContext(UserContext)的组件render
```

**优化方案**：

```javascript
// ✅ 方案1：useMemo缓存value
function App() {
  const [user, setUser] = useState({ name: "Tom" });
  const [theme, setTheme] = useState("light");

  const userValue = useMemo(
    () => ({ user, setUser }),
    [user] // setUser是稳定的，不需要依赖
  );

  return (
    <UserContext.Provider value={userValue}>
      {" "}
      {/* 引用稳定 */}
      <ThemeContext.Provider value={theme}>
        <Page />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// ✅ 方案2：拆分Context
const UserContext = React.createContext();
const ThemeContext = React.createContext();

function App() {
  const [user, setUser] = useState({ name: "Tom" });
  const [theme, setTheme] = useState("light");

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <Page />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// user变化只影响useContext(UserContext)的组件
// theme变化只影响useContext(ThemeContext)的组件

// ✅ 方案3：Context Selector（未来可能的API）
// 目前可以用useSyncExternalStore实现
```

---

## 七、错误处理类

### 29. ErrorBoundary 的原理和使用？

**答案：ErrorBoundary 通过生命周期方法捕获子组件的渲染错误，显示降级 UI。**

#### 基本用法

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新state，下次render显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误到日志服务
    console.error("Error caught:", error, errorInfo);
    logErrorToService(error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <details>{this.state.error && this.state.error.toString()}</details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <BuggyComponent />
    </ErrorBoundary>
  );
}
```

**底层原理**（类似 Suspense 的 throw/catch 机制）：

```
1. BuggyComponent抛出错误
   throw new Error('Bug!');

2. React捕获（beginWork的try-catch）
   try {
     beginWork(BuggyComponent)
   } catch (error) {
     handleThrow(root, error)
   }

3. 查找ErrorBoundary
   向上遍历return链
   找到有getDerivedStateFromError的组件

4. 标记ShouldCapture
   errorBoundary.flags |= ShouldCapture

5. unwindWork转换flag
   flags = (flags & ~ShouldCapture) | DidCapture

6. beginWork检测DidCapture
   调用getDerivedStateFromError(error)
   hasError = true

7. render降级UI
   return <div>Something went wrong</div>
```

**限制和注意事项**：

```javascript
// ErrorBoundary无法捕获以下错误：

// 1. ❌ 事件处理器中的错误
<button onClick={() => {
  throw new Error('Click error');  // 不会被捕获
}}>

// 解决：手动try-catch
<button onClick={() => {
  try {
    riskyOperation();
  } catch (error) {
    handleError(error);
  }
}}>

// 2. ❌ 异步代码中的错误
useEffect(() => {
  setTimeout(() => {
    throw new Error('Async error');  // 不会被捕获
  }, 1000);
}, []);

// 解决：手动try-catch或Promise.catch

// 3. ❌ ErrorBoundary自身的错误
class ErrorBoundary extends React.Component {
  render() {
    throw new Error('Self error');  // 不会被自己捕获
  }
}

// 解决：嵌套多层ErrorBoundary

// 4. ❌ SSR服务端渲染的错误
// 解决：服务端也需要ErrorBoundary
```

**最佳实践**：

```javascript
// ✅ 细粒度ErrorBoundary
function App() {
  return (
    <>
      <ErrorBoundary fallback={<HeaderError />}>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary fallback={<MainError />}>
        <Main />
      </ErrorBoundary>

      <ErrorBoundary fallback={<FooterError />}>
        <Footer />
      </ErrorBoundary>
    </>
  );
}

// 好处：一个组件错误不影响其他组件
```

---

## 八、最佳实践类

### 30. React 开发有哪些最佳实践？

#### 1. 组件设计

```javascript
// ✅ DO：单一职责
function UserProfile({ userId }) {
  return (
    <>
      <UserAvatar userId={userId} />
      <UserInfo userId={userId} />
      <UserStats userId={userId} />
    </>
  );
}

// ❌ DON'T：职责混乱
function UserProfile({ userId }) {
  // 头像逻辑、信息逻辑、统计逻辑都在一个组件
}

// ✅ DO：Props解构
function Component({ name, age, email }) {
  return (
    <div>
      {name}, {age}, {email}
    </div>
  );
}

// ❌ DON'T：直接使用props对象
function Component(props) {
  return (
    <div>
      {props.name}, {props.age}, {props.email}
    </div>
  );
}
```

#### 2. State 管理

```javascript
// ✅ DO：状态就近原则
function Form() {
  // username只在这里用，定义在这里
  const [username, setUsername] = useState("");
  return (
    <input value={username} onChange={(e) => setUsername(e.target.value)} />
  );
}

// ❌ DON'T：过度提升state
function App() {
  const [username, setUsername] = useState(""); // 只有一个子组件用
  return <Form username={username} setUsername={setUsername} />;
}

// ✅ DO：使用useReducer管理复杂state
const [state, dispatch] = useReducer(reducer, {
  username: "",
  email: "",
  password: "",
  errors: {},
});

// ❌ DON'T：过多useState
const [username, setUsername] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [errors, setErrors] = useState({});
```

#### 3. 性能优化

```javascript
// ✅ DO：合理使用memo
const ExpensiveList = React.memo(List);

// ❌ DON'T：过度优化
const SimpleText = React.memo(({ text }) => <span>{text}</span>);

// ✅ DO：稳定的依赖
const config = useMemo(() => ({...}), [theme]);

// ❌ DON'T：每次创建新对象
<Component config={{ theme }} />

// ✅ DO：虚拟化长列表
import { FixedSizeList } from 'react-window';
<FixedSizeList height={600} itemCount={10000} itemSize={50}>
  {Row}
</FixedSizeList>

// ❌ DON'T：渲染所有10000项
{items.map(item => <Item key={item.id} />)}
```

#### 4. Hooks 使用

```javascript
// ✅ DO：遵循Hook规则
function Component() {
  const [state, setState] = useState(0); // 顶层
  useEffect(() => {}, [state]); // 顶层

  return <div>{state}</div>;
}

// ❌ DON'T：条件调用Hook
if (condition) {
  const [state, setState] = useState(0); // ❌
}

// ✅ DO：完整的依赖数组
useEffect(() => {
  doSomething(prop, state);
}, [prop, state]); // 包含所有使用的变量

// ❌ DON'T：遗漏依赖
useEffect(() => {
  doSomething(prop, state);
}, []); // ❌ 遗漏prop和state

// ✅ DO：清理副作用
useEffect(() => {
  const subscription = api.subscribe();
  return () => subscription.unsubscribe(); // cleanup
}, []);

// ❌ DON'T：忘记清理
useEffect(() => {
  api.subscribe(); // ❌ 内存泄漏
}, []);
```

#### 5. 代码组织

```javascript
// ✅ DO：使用自定义Hook提取逻辑
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// 使用
function Component() {
  const { width, height } = useWindowSize();
  return (
    <div>
      {width} x {height}
    </div>
  );
}

// ✅ DO：组件名大写
function MyComponent() {} // ✓

// ❌ DON'T：组件名小写
function myComponent() {} // ❌ JSX会认为是HTML标签
```

---

## 九、Refs 和 DOM 类

### 25. ref 的作用和使用场景？

**答案：ref 用于直接访问 DOM 元素或组件实例，适用于需要命令式操作 DOM 的场景。**

#### 三种使用方式

```javascript
// 1. useRef Hook（函数组件）
function Component() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus Input</button>
    </>
  );
}

// 2. createRef（类组件）
class Component extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  focusInput = () => {
    this.inputRef.current.focus();
  };

  render() {
    return (
      <>
        <input ref={this.inputRef} />
        <button onClick={this.focusInput}>Focus</button>
      </>
    );
  }
}

// 3. 回调ref
function Component() {
  const [inputElement, setInputElement] = useState(null);

  return (
    <input
      ref={(node) => {
        setInputElement(node);
        // node挂载时调用，传入DOM元素
        // node卸载时调用，传入null
      }}
    />
  );
}
```

#### 常见使用场景

```javascript
// 场景1：聚焦管理
function SearchBox() {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.focus(); // 自动聚焦
  }, []);

  return <input ref={inputRef} />;
}

// 场景2：测量DOM
function ResizablePanel() {
  const panelRef = useRef();
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const rect = panelRef.current.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
  });

  return (
    <div ref={panelRef}>
      Size: {size.width}x{size.height}
    </div>
  );
}

// 场景3：滚动控制
function ChatMessages({ messages }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      {messages.map((msg) => (
        <Message key={msg.id} {...msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// 场景4：保存可变值（不触发render）
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const pause = () => {
    clearInterval(intervalRef.current);
  };

  return (
    <>
      <div>{count}</div>
      <button onClick={pause}>Pause</button>
    </>
  );
}

// 场景5：集成第三方库
function VideoPlayer({ src }) {
  const videoRef = useRef();
  const playerRef = useRef();

  useEffect(() => {
    // 初始化第三方播放器
    playerRef.current = new ThirdPartyPlayer(videoRef.current, {
      src,
      autoplay: true,
    });

    return () => {
      playerRef.current.destroy();
    };
  }, [src]);

  return <video ref={videoRef} />;
}
```

**ref vs state**：

```javascript
// useRef：
// - 改变不触发render
// - 用于存储可变值
// - 访问DOM元素

// useState：
// - 改变触发render
// - 用于渲染相关的数据
// - UI状态

// 示例：计数器（用ref还是state？）
// ❌ 错误：用ref（不会更新UI）
function Counter() {
  const countRef = useRef(0);

  const increment = () => {
    countRef.current++;
    // UI不更新！
  };

  return <div>{countRef.current}</div>;
}

// ✅ 正确：用state
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

---

### 26. forwardRef 有什么用？

**答案：在 React 19 之前，forwardRef 用于将 ref 转发给子组件。React 19 开始，ref 可以作为普通 prop 使用，不再需要 forwardRef。**

#### React 19：ref 作为普通 prop（推荐）

```javascript
// ✅ React 19：ref 直接作为 prop
function FancyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
  // ref 现在是普通 prop，可以直接使用
}

function Parent() {
  const inputRef = useRef();

  const focus = () => {
    inputRef.current.focus(); // ✓ 正常工作
  };

  return (
    <>
      <FancyInput ref={inputRef} />
      <button onClick={focus}>Focus</button>
    </>
  );
}
```

**底层原理**（React 19 变化）：

```javascript
// React 18 及之前：ref 是特殊属性
<Component ref={ref} />
// ref 不在 props 中，需要 forwardRef

// React 19：ref 是普通 prop
<Component ref={ref} />
// 等价于：
<Component {...{ ref: ref }} />
// ref 在 props 中，可以直接访问
```

#### React 18 及更早版本：需要 forwardRef

```javascript
// React 18：必须使用 forwardRef
const FancyInput = React.forwardRef((props, ref) => {
  return <input {...props} ref={ref} />;
});

function Parent() {
  const inputRef = useRef();

  return <FancyInput ref={inputRef} />;
}
```

**问题：ref 无法直接传递**

```javascript
// ❌ React 18：ref 不会传递给子组件
function FancyInput(props) {
  // props 中没有 ref！
  console.log(props.ref); // undefined
  return <input {...props} />;
}

function Parent() {
  const inputRef = useRef();

  return <FancyInput ref={inputRef} />;
  // ref 不会出现在 props 中
}
```

#### React 19：使用 useImperativeHandle 暴露自定义方法

```javascript
// 暴露自定义方法，而不是整个 DOM
function FancyInput({ ref, ...props }) {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    // 只暴露 focus 和 select 方法
    focus: () => {
      inputRef.current.focus();
    },
    select: () => {
      inputRef.current.select();
    },
    // 不暴露整个 input 元素
  }));

  return <input ref={inputRef} {...props} />;
}

function Parent() {
  const fancyInputRef = useRef();

  const handleClick = () => {
    fancyInputRef.current.focus(); // ✓ 可以调用
    fancyInputRef.current.select(); // ✓ 可以调用
    fancyInputRef.current.value; // undefined（未暴露）
  };

  return (
    <>
      <FancyInput ref={fancyInputRef} />
      <button onClick={handleClick}>Focus & Select</button>
    </>
  );
}
```

#### 迁移建议

```javascript
// 旧代码（React 18）
const MyComponent = React.forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

// 新代码（React 19）- 方式1：直接使用 ref prop
function MyComponent({ ref, children }) {
  return <div ref={ref}>{children}</div>;
}

// 新代码（React 19）- 方式2：解构剩余 props
function MyComponent({ ref, ...props }) {
  return <div ref={ref} {...props} />;
}

// 注意：forwardRef 在 React 19 中仍然可用，但不再必需
// 推荐新代码直接使用 ref prop
```

**兼容性说明**：

```javascript
// ✅ React 19 支持两种方式：
// 1. 新方式：ref 作为 prop
function Component({ ref }) {
  return <div ref={ref} />;
}

// 2. 旧方式：forwardRef（向后兼容）
const Component = React.forwardRef((props, ref) => {
  return <div ref={ref} />;
});

// 推荐：新项目使用新方式，旧项目可以逐步迁移
```

---

## 十、组件通信类

### 28. 组件通信有哪些方式？

**答案：Props、Context、状态提升、事件总线、第三方状态管理。**

#### 方式 1：Props（父 → 子）

```javascript
function Parent() {
  const [data, setData] = useState("Hello");

  return <Child data={data} onUpdate={setData} />;
}

function Child({ data, onUpdate }) {
  return (
    <>
      <div>{data}</div>
      <button onClick={() => onUpdate("New Data")}>Update</button>
    </>
  );
}
```

#### 方式 2：Context（跨层级）

```javascript
const DataContext = React.createContext();

function GrandParent() {
  const [data, setData] = useState("Hello");

  return (
    <DataContext.Provider value={{ data, setData }}>
      <Parent />
    </DataContext.Provider>
  );
}

function Parent() {
  return <Child />; // 不需要传递props
}

function Child() {
  const { data, setData } = useContext(DataContext);
  return (
    <>
      <div>{data}</div>
      <button onClick={() => setData("New")}>Update</button>
    </>
  );
}
```

#### 方式 3：状态提升（兄弟组件）

```javascript
function Parent() {
  const [sharedData, setSharedData] = useState("");

  return (
    <>
      <Sibling1 data={sharedData} setData={setSharedData} />
      <Sibling2 data={sharedData} setData={setSharedData} />
    </>
  );
}
```

#### 方式 4：自定义事件（不推荐）

```javascript
// 可以但不推荐：使用事件总线
class EventBus {
  listeners = {};

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    this.listeners[event]?.forEach((cb) => cb(data));
  }
}

const bus = new EventBus();

function Component1() {
  const handleData = (data) => {
    console.log("received:", data);
  };

  useEffect(() => {
    bus.on("dataUpdate", handleData);
    return () => {
      /* 难以清理 */
    };
  }, []);

  return <div>Component1</div>;
}

function Component2() {
  const sendData = () => {
    bus.emit("dataUpdate", { value: 123 });
  };

  return <button onClick={sendData}>Send</button>;
}

// 问题：难以追踪数据流，难以调试
// 推荐：使用Context或状态管理库
```

#### 方式 5：状态管理库

```javascript
// Redux
import { useSelector, useDispatch } from "react-redux";

function Component1() {
  const data = useSelector((state) => state.data);
  return <div>{data}</div>;
}

function Component2() {
  const dispatch = useDispatch();
  const updateData = () => {
    dispatch({ type: "UPDATE_DATA", payload: "New Data" });
  };
  return <button onClick={updateData}>Update</button>;
}

// Zustand（更轻量）
import create from "zustand";

const useStore = create((set) => ({
  data: "",
  setData: (data) => set({ data }),
}));

function Component1() {
  const data = useStore((state) => state.data);
  return <div>{data}</div>;
}

function Component2() {
  const setData = useStore((state) => state.setData);
  return <button onClick={() => setData("New")}>Update</button>;
}
```

---

## 📝 补充题目

### 10. 虚拟 DOM 一定比真实 DOM 快吗？

**答案：不一定。虚拟 DOM 的优势在于优化和跨平台，而不是绝对的性能。**

#### 误区澄清

```
❌ 错误认知：
虚拟DOM比真实DOM快

✓ 正确理解：
虚拟DOM通过diff算法，减少不必要的DOM操作
在大部分场景下性能更好
但不是绝对的快
```

#### 性能对比

```javascript
// 场景1：大量数据首次渲染
const data = Array(10000).fill({...});

// 真实DOM：
const container = document.getElementById('root');
data.forEach(item => {
  const div = document.createElement('div');
  div.textContent = item.text;
  container.appendChild(div);
});
// 耗时：~50ms

// React（虚拟DOM + reconciliation）：
ReactDOM.createRoot(container).render(
  <>{data.map(item => <div key={item.id}>{item.text}</div>)}</>
);
// 耗时：~80ms（多了diff和Fiber树构建）

结论：首次渲染，虚拟DOM更慢（额外开销）

// 场景2：更新1个元素
data[0].text = 'Updated';

// 真实DOM：
document.querySelector('div:first-child').textContent = 'Updated';
// 耗时：~0.1ms

// React：
setData([...data]);
// 耗时：~10ms（diff 10000个元素，但只更新1个DOM）

结论：精确更新，真实DOM更快
      批量更新，虚拟DOM更优
```

#### 虚拟 DOM 的真正优势

```
1. 优化算法
   - diff算法找出最小变更
   - 批量DOM操作
   - 减少reflow/repaint

2. 声明式编程
   - 不需要手动操作DOM
   - 代码更易维护
   - 减少bug

3. 跨平台
   - React Native（移动端）
   - React Three Fiber（3D）
   - React PDF等

4. 时间切片
   - 可中断渲染
   - 保持应用响应

结论：虚拟DOM的价值不在于"快"，而在于"优化"和"易用"
```

---

### 12. useEffect 的依赖数组为空会怎样？

**答案：只在 mount 时执行一次，相当于 componentDidMount。**

#### 三种依赖情况

```javascript
function Component({ userId }) {
  const [data, setData] = useState(null);

  // 1. 空数组：只执行一次
  useEffect(() => {
    console.log("mount");
    return () => console.log("unmount");
  }, []);
  // mount时执行create
  // unmount时执行cleanup
  // 不会再执行

  // 2. 有依赖：依赖变化时执行
  useEffect(() => {
    fetchUser(userId).then(setData);
    return () => {
      /* cleanup */
    };
  }, [userId]);
  // userId变化时：cleanup旧effect → create新effect

  // 3. 无依赖数组：每次render都执行
  useEffect(() => {
    console.log("every render");
  });
  // 每次render都执行（很少使用）

  return <div>{data?.name}</div>;
}
```

#### 常见陷阱：遗漏依赖

```javascript
// ❌ 错误：遗漏依赖
function Component({ userId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setData); // 使用了userId
  }, []); // ❌ 但没有依赖userId

  // 问题：userId变化时不会重新获取数据
}

// ✅ 正确：添加依赖
useEffect(() => {
  fetchUser(userId).then(setData);
}, [userId]); // userId变化时重新获取

// ✅ 推荐：使用ESLint规则自动检测
// eslint-plugin-react-hooks会警告遗漏的依赖
```

---

### 13. useEffect 的 cleanup 函数什么时候执行？

**答案：组件卸载时，以及依赖变化导致 effect 重新执行前。**

#### 执行时机（详见第 10 题）

```javascript
function Component({ userId }) {
  useEffect(() => {
    console.log('effect create:', userId);

    return () => {
      console.log('effect cleanup:', userId);
    };
  }, [userId]);

  return <div>User: {userId}</div>;
}

// 执行顺序：
mount (userId=1):
  → "effect create: 1"

update (userId=1→2):
  → "effect cleanup: 1"  ← cleanup旧effect
  → "effect create: 2"   ← create新effect

update (userId=2→3):
  → "effect cleanup: 2"
  → "effect create: 3"

unmount:
  → "effect cleanup: 3"  ← 组件卸载时cleanup
```

#### 常见用途

```javascript
// 1. 清理订阅
useEffect(() => {
  const subscription = api.subscribe((data) => {
    setData(data);
  });

  return () => {
    subscription.unsubscribe(); // 清理订阅
  };
}, []);

// 2. 清理定时器
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);

  return () => {
    clearTimeout(timer); // 清理定时器
  };
}, []);

// 3. 取消网络请求
useEffect(() => {
  let cancelled = false;

  fetchData().then((data) => {
    if (!cancelled) {
      setData(data);
    }
  });

  return () => {
    cancelled = true; // 标记已取消
  };
}, []);

// 4. 移除事件监听
useEffect(() => {
  const handleResize = () => {
    setSize(window.innerWidth);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

---

### 15. 自定义 Hook 有什么限制？

**答案：自定义 Hook 必须遵循 Hook 规则，且必须以"use"开头。**

#### 自定义 Hook 规则

```javascript
// ✅ 正确：以"use"开头
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// ❌ 错误：不以"use"开头
function windowSize() {  // ❌
  const [size, setSize] = useState({...});
  useEffect(() => {...}, []);
  return size;
}

// React会警告：
// "React Hook useState is called in a function that is neither a React function component nor a custom React Hook function"
```

#### 限制和注意事项

```javascript
// ✅ DO：可以调用其他Hooks
function useUser(userId) {
  const [user, setUser] = useState(null); // ✓
  const [loading, setLoading] = useState(false); // ✓

  useEffect(() => {
    // ✓
    setLoading(true);
    fetchUser(userId).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  return { user, loading };
}

// ✅ DO：可以互相调用
function useAuth() {
  const user = useUser(userId); // ✓ 调用其他自定义Hook
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.role === "admin");
  }, [user]);

  return { user, isAdmin };
}

// ❌ DON'T：在条件中调用Hook
function useConditional(condition) {
  if (condition) {
    const [state, setState] = useState(0); // ❌
  }
}

// ❌ DON'T：在循环中调用Hook
function useLoop(items) {
  items.forEach((item) => {
    const [state, setState] = useState(item); // ❌
  });
}

// ❌ DON'T：在普通函数中调用Hook
function normalFunction() {
  const [state, setState] = useState(0); // ❌
}

// ✅ DO：只在组件或自定义Hook中调用
function MyComponent() {
  const [state, setState] = useState(0); // ✓
}

function useMyHook() {
  const [state, setState] = useState(0); // ✓
}
```

---

### 16. useCallback 和 useMemo 什么时候用？

**答案：传给 memo 组件、作为依赖、或优化昂贵计算时使用。**

#### 使用场景（详见第 11 题）

**场景 1：传给 memo 组件**

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 不好：每次新函数
  const handleClick = () => console.log("clicked");

  // ✅ 好：缓存函数
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <MemoChild onClick={handleClick} />
    </>
  );
}

const MemoChild = React.memo(Child);
```

**场景 2：作为其他 Hook 的依赖**

```javascript
function Component({ apiUrl }) {
  // 缓存config对象
  const config = useMemo(() => ({
    url: apiUrl,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }), [apiUrl]);

  useEffect(() => {
    fetch(config.url, config).then(...);
  }, [config]);  // config引用稳定，不会无限循环

  return <div>...</div>;
}
```

**场景 3：昂贵计算**

```javascript
function DataTable({ data, sortKey, filterText }) {
  // 昂贵的计算
  const processedData = useMemo(() => {
    return data
      .filter((item) => item.text.includes(filterText))
      .sort((a, b) => a[sortKey] - b[sortKey])
      .map((item) => ({
        ...item,
        computed: expensiveComputation(item),
      }));
  }, [data, sortKey, filterText]);

  return <Table data={processedData} />;
}
```

**何时不需要**：

```javascript
// ❌ 不需要：简单计算
const double = useMemo(() => count * 2, [count]);
// 直接：const double = count * 2;

// ❌ 不需要：不传给子组件的对象
const style = useMemo(() => ({ color: "red" }), []);
// 直接：const style = { color: 'red' };

// ❌ 不需要：依赖总是变化
const filtered = useMemo(
  () => items.filter((item) => item.id === Math.random()),
  [items]
);
// Math.random()每次不同，useMemo无意义
```

---

### 9. React 如何判断何时重新渲染组件？

**答案：通过 shouldComponentUpdate、memo 比较、或 bailout 条件判断。**

#### 判断机制（详见第 5 题）

**1. 类组件：shouldComponentUpdate**

```javascript
class Component extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 自定义比较逻辑
    return (
      this.props.value !== nextProps.value ||
      this.state.count !== nextState.count
    );
  }

  render() {
    return <div>{this.props.value}</div>;
  }
}
```

**2. PureComponent：浅比较**

```javascript
class Component extends React.PureComponent {
  // 自动浅比较props和state
  // 等价于
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }

  render() {
    return <div>{this.props.value}</div>;
  }
}
```

**3. 函数组件：React.memo**

```javascript
const Component = React.memo(
  function Component({ value }) {
    return <div>{value}</div>;
  },
  (prevProps, nextProps) => {
    // 返回true表示不需要更新
    return prevProps.value === nextProps.value;
  }
);
```

**4. Hooks：bailout 条件**（详见第 5 题）

```javascript
// beginWork中的判断
function beginWork(current, workInProgress, renderLanes) {
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    // 四个bailout条件
    if (
      oldProps === newProps &&  // 1. props没变
      !hasContextChanged() &&    // 2. context没变
      !includesSomeLane(current.lanes, renderLanes) &&  // 3. 没有update
      (workInProgress.flags & DidCapture) === NoFlags   // 4. 没有错误
    ) {
      // bailout，不render
      return bailoutOnAlreadyFinishedWork(...);
    }
  }

  // 继续render
}
```

---

### 22. 如何优化长列表性能？

**答案：虚拟化、分页、懒加载、memo、key 优化。**

#### 方案对比

**方案 1：虚拟化（最佳）**

```javascript
import { FixedSizeList } from "react-window";

function LongList({ items }) {
  // 只渲染可见区域的items
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].text}</div>
  );

  return (
    <FixedSizeList
      height={600} // 容器高度
      itemCount={items.length} // 总项数：10000
      itemSize={50} // 每项高度
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 性能：
// - 10000个items，只渲染~12个（可见区域）
// - 滚动时动态渲染
// - 极大提升性能
```

**方案 2：分页**

```javascript
function PaginatedList({ items }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  return (
    <>
      <ul>
        {currentItems.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>

      <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage((p) => p + 1)}>Next</button>
    </>
  );
}
```

**方案 3：无限滚动（懒加载）**

```javascript
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const loaderRef = useRef();

  // 加载更多数据
  const loadMore = useCallback(async () => {
    const newItems = await fetchPage(page);
    setItems((prev) => [...prev, ...newItems]);
    setPage((p) => p + 1);
  }, [page]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
      <div ref={loaderRef}>Loading more...</div>
    </>
  );
}
```

**方案 4：memo + key 优化**

```javascript
// memo避免不必要的render
const MemoItem = React.memo(function Item({ data }) {
  return <li>{data.text}</li>;
});

function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <MemoItem
          key={item.id} // 稳定的key
          data={item}
        />
      ))}
    </ul>
  );
}
```

---

### 9. React 如何判断何时重新渲染组件？（补充）

已在前面第 9 题回答，这里补充实战技巧：

**监控组件 render 的技巧**：

```javascript
// 方法1：自定义Hook
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

// 方法2：React DevTools Profiler
// 录制性能，查看每个组件为什么render
```

---

## 🎯 30 道常见面试题总结

### 已回答的题目（16 题）

✅ 1. setState 是同步还是异步  
✅ 2. 为什么多次 setState 只 render 一次  
✅ 3. 函数式 setState 和直接传值的区别  
✅ 4. setState 后如何立即获取值  
✅ 5. 为什么不能直接修改 state  
✅ 6. 组件什么时候重新渲染  
✅ 7. 父组件 render 子组件一定 render 吗  
✅ 8. 如何避免不必要的渲染  
✅ 9. React 如何判断何时重新渲染  
✅ 10. 虚拟 DOM 一定比真实 DOM 快吗  
✅ 11. useEffect 和 useLayoutEffect 的区别  
✅ 12. useEffect 依赖数组为空会怎样  
✅ 13. useEffect 的 cleanup 何时执行  
✅ 14. 为什么 Hook 必须在顶层  
✅ 15. 自定义 Hook 有什么限制  
✅ 16. useCallback 和 useMemo 什么时候用

✅ 17. React 事件和原生事件的区别  
✅ 19. 如何阻止事件冒泡  
✅ 20. React.memo 有什么用  
✅ 21. key 的作用，为什么不能用 index  
✅ 22. 如何优化长列表性能  
✅ 23. 什么是 React 的批处理  
✅ 24. 如何避免内联函数和对象  
✅ 25. ref 的作用和使用场景  
✅ 26. React 19 中 ref 的新特性（不再需要 forwardRef）  
✅ 27. Context 如何工作  
✅ 28. 组件通信有哪些方式  
✅ 29. ErrorBoundary 的原理和使用  
✅ 30. React 开发最佳实践

### 全部题目已完成！

**恭喜！** 30 道 React 常见面试题全部完成，结合前面 20 道底层原理题，你现在拥有：

- ✅ 20 道底层原理深度分析（约 30 万字）
- ✅ 30 道常见问题实战解答（约 8.5 万字）
- ✅ 总计 50 道 React 面试题
- ✅ 完整的理论+实战知识体系

**这些内容足够应对从初级到资深的所有 React 面试！**

---

## 📖 使用建议

**学习路径**：

1. **先学底层原理**（20 题）：打好理论基础
2. **再看常见问题**（30 题）：理解实战应用
3. **结合练习**：动手验证这些知识点
4. **面试准备**：重点复习高频题目

**高频题目 Top 10**：

1. ⭐⭐⭐ setState 是同步还是异步
2. ⭐⭐⭐ Hook 必须在顶层调用的原因
3. ⭐⭐⭐ useEffect 和 useLayoutEffect 区别
4. ⭐⭐⭐ React.memo 和 useMemo 的使用
5. ⭐⭐⭐ key 的作用和不能用 index 的原因
6. ⭐⭐ 函数式 setState 的必要性
7. ⭐⭐ 虚拟 DOM 的优势
8. ⭐⭐ Context 的性能优化
9. ⭐⭐ 长列表性能优化
10. ⭐⭐ ErrorBoundary 的使用

---

**版本信息**:

- **最后更新**: 2025-11-07
- **React 版本**: React 19.x
- **重要变化**: React 19 中 ref 可作为普通 prop 使用，不再强制需要 forwardRef
