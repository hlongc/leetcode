# React setState 同步与异步行为详解

本文详细分析 React 中 setState 的执行机制，解释其在不同情况下的同步/异步表现，并对不同版本的 React 进行对比分析。

## 目录

- [一、setState 基础概念](#一setstate-基础概念)
- [二、setState 执行过程](#二setstate-执行过程)
- [三、不同版本的 setState 行为](#三不同版本的-setstate-行为)
- [四、常见场景分析](#四常见场景分析)
- [五、setState 正确使用方式](#五setstate-正确使用方式)
- [六、底层原理解释](#六底层原理解释)
- [七、常见问题与最佳实践](#七常见问题与最佳实践)

---

## 一、setState 基础概念

### 什么是 setState？

`setState` 是 React 中用于更新组件状态的主要 API，它的调用会触发组件的重新渲染。

### 两种调用方式

#### 1. 对象形式

```javascript
this.setState({ count: 1 });
```

#### 2. 函数形式（推荐）

```javascript
this.setState((prevState, props) => ({
  count: prevState.count + 1
}));
```

### 回调函数

```javascript
this.setState({ count: 1 }, () => {
  // 状态更新完成后执行
  console.log('状态已更新', this.state.count);
});
```

---

## 二、setState 执行过程

当调用 setState 时，React 内部会经历以下步骤：

### 1. 状态合并

```javascript
// 新的 state 与之前的 state 进行合并（浅合并）
const newState = Object.assign({}, prevState, partialState);
```

### 2. 触发调和过程（Reconciliation）

- 标记组件需要更新
- 将更新任务加入队列

### 3. Virtual DOM 对比

- 计算新的 Virtual DOM
- 与旧的 Virtual DOM 进行 diff
- 生成最小更新补丁

### 4. 更新实际 DOM

- 根据 diff 结果更新真实 DOM
- 执行生命周期方法

### 性能优化策略

React 为了提高性能，会：

- 🔄 将多个 setState 调用**合并**成一个批量更新
- ⏰ **推迟**更新到合适的时机执行
- 📦 减少不必要的重新渲染

---

## 三、不同版本的 setState 行为

### React 16 及之前版本

setState 的同步/异步表现**取决于调用的环境**：

#### ⚡ 异步更新（批处理）的情况

✅ 在这些情况下，setState 会被批处理：

- React 合成事件处理函数内（`onClick`、`onChange` 等）
- React 生命周期函数内（`componentDidMount`、`componentDidUpdate` 等）

#### ⚙️ 同步更新（立即执行）的情况

✅ 在这些情况下，setState 会立即执行：

- `setTimeout`/`setInterval` 等异步回调函数内
- 原生 DOM 事件回调函数内
- `Promise.then` 等异步操作的回调函数内
- 其他非 React 上下文中

#### 示例1：React 合成事件中的"异步"行为

```jsx
class AsyncExample extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    console.log('点击前 count:', this.state.count); // 0

    // 第一次调用 setState
    this.setState({ count: this.state.count + 1 });
    console.log('第一次 setState 后:', this.state.count); // 仍然是 0 ❌

    // 第二次调用 setState
    this.setState({ count: this.state.count + 1 });
    console.log('第二次 setState 后:', this.state.count); // 仍然是 0 ❌

    // React 会将两次更新合并，最终 count 变为 1，而非 2
  };

  render() {
    return (
      <button onClick={this.handleClick}>
        Click me ({this.state.count})
      </button>
    );
  }
}

// 输出：
// 点击前 count: 0
// 第一次 setState 后: 0  ← 批处理，还没更新
// 第二次 setState 后: 0  ← 批处理，还没更新
// （组件重新渲染，count 变为 1）
```

**问题：** 两次 `setState` 都使用 `this.state.count`（值为 0），所以最终只加了 1。

#### 示例2：setTimeout 中的"同步"行为

```jsx
class SyncExample extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    setTimeout(() => {
      console.log('setTimeout 前 count:', this.state.count); // 0

      // 在 setTimeout 中调用 setState
      this.setState({ count: this.state.count + 1 });
      console.log('第一次 setState 后:', this.state.count); // 1 ✅ 立即更新

      this.setState({ count: this.state.count + 1 });
      console.log('第二次 setState 后:', this.state.count); // 2 ✅ 立即更新
    }, 0);
  };

  render() {
    return (
      <button onClick={this.handleClick}>
        Click me ({this.state.count})
      </button>
    );
  }
}

// 输出：
// setTimeout 前 count: 0
// 第一次 setState 后: 1  ← 立即更新
// 第二次 setState 后: 2  ← 立即更新
```

### React 17

React 17 与 16 的行为基本一致，主要变化：

- 🔄 事件系统从 `document` 级别挂载改为 `root` 级别挂载
- 🚀 内部重构，为 React 18 的并发特性做准备
- ⚠️ setState 行为与 React 16 相同

### React 18（重大变化）⭐

React 18 引入了**自动批处理**（Automatic Batching），使 setState 在**更多情况下**表现为"异步"。

#### 自动批处理的范围

✅ **所有**的 setState 调用都会被批处理，包括：

- ✅ React 事件处理函数
- ✅ 生命周期方法
- ✅ **setTimeout/setInterval 回调**（新增）
- ✅ **Promise 回调**（新增）
- ✅ **原生事件处理函数**（新增）
- ✅ **其他非 React 上下文**（新增）

#### 示例1：React 18 中 setTimeout 也会批处理

```jsx
function AutoBatchingExample() {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    setTimeout(() => {
      console.log('更新前 count:', count); // 0

      setCount(count + 1);
      console.log('第一次 setState 后:', count); // 仍然是 0 ❌（批处理）

      setCount(count + 1);
      console.log('第二次 setState 后:', count); // 仍然是 0 ❌（批处理）

      // ⚠️ 由于两次都使用旧的 count 值，最终 count 只加 1
    }, 0);
  };

  return <button onClick={handleClick}>Click me ({count})</button>;
}
```

#### 示例2：使用 flushSync 强制同步更新

```jsx
import { flushSync } from 'react-dom';

function FlushSyncExample() {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    // 强制同步更新
    flushSync(() => {
      setCount(count + 1);
    });
    console.log(count + 1); // ✅ 可以读取更新后的值

    flushSync(() => {
      setCount(count + 2);
    });
    console.log(count + 2); // ✅ 可以读取更新后的值
  };

  return <button onClick={handleClick}>Click me ({count})</button>;
}
```

**⚠️ 注意：** `flushSync` 会立即刷新 DOM，可能影响性能，应谨慎使用。

---

## 四、常见场景分析

### 场景1：连续多次 setState

#### ❌ 错误示例

```jsx
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1); // count = 0, 设置为 1
  setCount(count + 1); // count 仍然是 0, 设置为 1
  setCount(count + 1); // count 仍然是 0, 设置为 1
  // 最终结果：count = 1（而不是 3）
};
```

#### ✅ 正确示例

```jsx
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(prevCount => prevCount + 1); // 0 + 1 = 1
  setCount(prevCount => prevCount + 1); // 1 + 1 = 2
  setCount(prevCount => prevCount + 1); // 2 + 1 = 3
  // 最终结果：count = 3 ✅
};
```

### 场景2：在 useEffect 中 setState

```jsx
function EffectExample() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // ✅ 在 useEffect 中的 setState 会被批处理
    setCount(1);
    setCount(2);
    setCount(3);
    // 最终：count = 3（只触发一次渲染）
  }, []);

  return <div>{count}</div>;
}
```

### 场景3：在原生事件中 setState

#### React 16

```jsx
class NativeEventExample extends React.Component {
  state = { count: 0 };

  componentDidMount() {
    // 原生事件
    document.getElementById('btn').addEventListener('click', () => {
      this.setState({ count: this.state.count + 1 });
      console.log(this.state.count); // 1 ✅ 同步更新

      this.setState({ count: this.state.count + 1 });
      console.log(this.state.count); // 2 ✅ 同步更新
    });
  }
}
```

#### React 18

```jsx
function NativeEventExample() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.getElementById('btn').addEventListener('click', () => {
      setCount(count + 1);
      console.log(count); // 0 ❌ 异步批处理

      setCount(count + 1);
      console.log(count); // 0 ❌ 异步批处理
      // 最终 count = 1
    });
  }, []);
}
```

### 场景4：异步请求后 setState

#### React 16

```jsx
class FetchExample extends React.Component {
  state = { data: null };

  async componentDidMount() {
    const response = await fetch('/api/data');
    const data = await response.json();

    // ⚠️ await 后的代码相当于在 Promise.then 中
    // React 16: 同步更新
    this.setState({ data });
    console.log(this.state.data); // ✅ 能获取到数据
  }
}
```

#### React 18

```jsx
function FetchExample() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/data');
      const result = await response.json();

      // React 18: 异步批处理
      setData(result);
      console.log(data); // ❌ 仍然是 null（还没更新）
    }
    fetchData();
  }, []);
}
```

---

## 五、setState 正确使用方式

### 1. 使用函数式更新（推荐⭐⭐⭐⭐⭐）

#### Class 组件

```jsx
class Counter extends React.Component {
  state = { count: 0 };

  increment = () => {
    // ✅ 推荐：使用函数式更新
    this.setState((prevState) => ({
      count: prevState.count + 1
    }));
  };

  incrementThree = () => {
    // ✅ 连续更新，每次基于前一个状态
    this.setState((prevState) => ({ count: prevState.count + 1 })); // 0 + 1 = 1
    this.setState((prevState) => ({ count: prevState.count + 1 })); // 1 + 1 = 2
    this.setState((prevState) => ({ count: prevState.count + 1 })); // 2 + 1 = 3
    // 最终：count = 3 ✅
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.incrementThree}>+3</button>
      </div>
    );
  }
}
```

#### Hooks

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const incrementThree = () => {
    // ✅ 推荐：使用函数式更新
    setCount(prev => prev + 1); // 0 + 1 = 1
    setCount(prev => prev + 1); // 1 + 1 = 2
    setCount(prev => prev + 1); // 2 + 1 = 3
    // 最终：count = 3 ✅
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementThree}>+3</button>
    </div>
  );
}
```

### 2. 使用 useEffect 监听状态变化

```jsx
function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetch('/api/data');
    setData(await result.json());
    setLoading(false);
  };

  // ✅ 使用 useEffect 监听 data 变化
  useEffect(() => {
    if (data) {
      console.log('数据已更新:', data);
      // 在这里可以安全地访问更新后的 data
    }
  }, [data]);

  return (
    <div>
      {loading ? 'Loading...' : JSON.stringify(data)}
      <button onClick={fetchData}>Fetch</button>
    </div>
  );
}
```

### 3. 使用 setState 回调（Class 组件）

```jsx
class CallbackExample extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    this.setState(
      { count: this.state.count + 1 },
      () => {
        // ✅ 第二个参数：状态更新完成后的回调
        console.log('更新后的 count:', this.state.count);
        // 这里可以安全地访问更新后的状态
      }
    );
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

### 4. 使用 flushSync 强制同步更新（React 18）

```jsx
import { flushSync } from 'react-dom';

function FlushSyncExample() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    // ✅ 强制同步更新（立即刷新 DOM）
    flushSync(() => {
      setCount(count + 1);
    });

    // 此时 DOM 已经更新，可以读取新值
    const element = document.getElementById('count');
    console.log('DOM 中的值:', element.textContent); // "1"

    // ⚠️ 但 count 变量仍然是旧值（闭包）
    console.log('count 变量:', count); // 0
  };

  return (
    <div>
      <div id="count">{count}</div>
      <button onClick={handleClick}>Update</button>
    </div>
  );
}
```

**⚠️ 注意：** `flushSync` 会破坏批处理，影响性能，应谨慎使用。

---

## 六、底层原理解释

### React 16 及之前：事务机制

#### 批处理事务流程

```
1. 事件触发
   ↓
2. React 开启批处理事务（isBatchingUpdates = true）
   ↓
3. 执行事件处理函数
   - 调用 setState → 将更新加入队列
   - 调用 setState → 将更新加入队列
   - ...
   ↓
4. 事件处理函数执行完毕
   ↓
5. 提交批处理事务（isBatchingUpdates = false）
   - 合并所有更新
   - 触发一次重新渲染
   ↓
6. 更新完成
```

#### 为什么 setTimeout 中是同步的？

```javascript
handleClick = () => {
  // 此时：isBatchingUpdates = true（React 事件处理上下文）

  setTimeout(() => {
    // ⚠️ 此时：isBatchingUpdates = false（已退出 React 上下文）
    // 所以 setState 会立即执行，不会批处理
    this.setState({ count: 1 }); // 立即更新
  }, 0);
};
```

### React 18：自动批处理

React 18 使用新的调度机制：

#### 核心原理

```javascript
// React 18 的批处理机制（简化版）
let isBatchingUpdates = false;
let updateQueue = [];

function scheduleUpdate(update) {
  updateQueue.push(update);

  if (!isBatchingUpdates) {
    isBatchingUpdates = true;

    // ✅ 关键：使用微任务在当前事件循环结束后批量处理
    queueMicrotask(() => {
      processUpdates(updateQueue);
      updateQueue = [];
      isBatchingUpdates = false;
    });
  }
}

// 这样即使在 setTimeout、Promise 等异步回调中
// 更新也会被收集并批处理
```

#### 为什么 setTimeout 中也是异步的？

```javascript
setTimeout(() => {
  // React 18 中
  setCount(1); // 更新加入队列
  setCount(2); // 更新加入队列

  // 立即调度一个微任务
  queueMicrotask(() => {
    // 在这里批量处理所有更新
    batchUpdate();
  });

  console.log(count); // 0（还没更新）
}, 0);

// 微任务执行（在 setTimeout 回调执行完后）
// → 批量处理更新
// → 组件重新渲染
```

---

## 七、常见问题与最佳实践

### 1. 如何获取更新后的状态？

#### 方法1：使用函数式更新 + useEffect（推荐）

```jsx
function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
  };

  // ✅ 在 useEffect 中访问更新后的值
  useEffect(() => {
    console.log('count 已更新为:', count);
  }, [count]);

  return <button onClick={handleClick}>Click</button>;
}
```

#### 方法2：使用 ref 存储最新值

```jsx
function Example() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 保持 ref 同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);

    // ✅ 立即使用计算后的值
    console.log('新值:', newCount);
  };

  return <button onClick={handleClick}>Click</button>;
}
```

#### 方法3：Class 组件使用回调

```jsx
this.setState(
  { count: this.state.count + 1 },
  () => {
    // ✅ 回调中访问更新后的状态
    console.log('更新后:', this.state.count);
  }
);
```

### 2. setState 是真的异步吗？

**❌ 不是！** setState 本身是**同步函数**，但状态更新和渲染是**异步的**。

```javascript
setCount(1); // ← 这行代码立即执行（同步）
// 但状态更新会被推迟（异步）
```

**准确的说法：**
- setState **调用**是同步的
- 状态**更新**可能是异步的（批处理）
- 组件**重新渲染**是异步的

### 3. 为什么需要批处理？

#### 性能优化

```jsx
// ❌ 没有批处理：每次 setState 都重新渲染
handleClick = () => {
  this.setState({ name: 'Alice' });    // 渲染1次
  this.setState({ age: 25 });          // 渲染1次
  this.setState({ city: 'Beijing' });  // 渲染1次
  // 总计：3次渲染 ❌（性能差）
};

// ✅ 有批处理：多次 setState 合并为一次渲染
handleClick = () => {
  this.setState({ name: 'Alice' });
  this.setState({ age: 25 });
  this.setState({ city: 'Beijing' });
  // 总计：1次渲染 ✅（性能好）
};
```

#### 性能对比

| 场景 | 无批处理 | 有批处理 | 性能提升 |
|-----|---------|---------|---------|
| 3次 setState | 3次渲染 | 1次渲染 | **66%** |
| 10次 setState | 10次渲染 | 1次渲染 | **90%** |

### 4. 如何在 React 18 中退出自动批处理？

```jsx
import { flushSync } from 'react-dom';

function OptOutBatching() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 方法1：使用 flushSync 立即更新
    flushSync(() => {
      setCount(count + 1);
    });
    // DOM 已更新

    // 方法2：分别包裹，每次都立即更新
    flushSync(() => {
      setCount(count + 1);
    });
    flushSync(() => {
      setCount(count + 2);
    });
    // 两次更新，两次渲染
  };

  return <button onClick={handleClick}>Click</button>;
}
```

---

## 八、版本对比总结

### 行为对比表

| 场景 | React 16 | React 17 | React 18 |
|-----|----------|----------|----------|
| **合成事件** | 批处理 ✅ | 批处理 ✅ | 批处理 ✅ |
| **生命周期** | 批处理 ✅ | 批处理 ✅ | 批处理 ✅ |
| **setTimeout** | 同步 ⚠️ | 同步 ⚠️ | **批处理 ✅** |
| **Promise.then** | 同步 ⚠️ | 同步 ⚠️ | **批处理 ✅** |
| **原生事件** | 同步 ⚠️ | 同步 ⚠️ | **批处理 ✅** |
| **async/await 后** | 同步 ⚠️ | 同步 ⚠️ | **批处理 ✅** |

### 迁移注意事项

从 React 16/17 迁移到 React 18 时需要注意：

#### 1. setTimeout 中的行为变化

```jsx
// React 16/17
setTimeout(() => {
  setCount(count + 1);
  console.log(count); // 1 ✅ 同步更新
}, 0);

// React 18
setTimeout(() => {
  setCount(count + 1);
  console.log(count); // 0 ❌ 异步批处理
}, 0);
```

**解决方案：** 使用函数式更新或 `flushSync`

#### 2. 原生事件中的行为变化

```jsx
// React 16/17
element.addEventListener('click', () => {
  setCount(count + 1);
  // DOM 立即更新
});

// React 18
element.addEventListener('click', () => {
  setCount(count + 1);
  // DOM 延迟更新（批处理）
});
```

**解决方案：** 使用 `flushSync` 或改用 React 合成事件

---

## 九、最佳实践建议

### ✅ 推荐做法

1. **优先使用函数式更新**
   ```jsx
   setCount(prev => prev + 1);
   ```

2. **在 useEffect 中处理副作用**
   ```jsx
   useEffect(() => {
     // 状态更新后执行
   }, [state]);
   ```

3. **避免依赖 setState 后立即读取状态**
   ```jsx
   // ❌ 不推荐
   setCount(count + 1);
   console.log(count); // 可能是旧值

   // ✅ 推荐
   const newCount = count + 1;
   setCount(newCount);
   console.log(newCount);
   ```

4. **合理使用批处理**
   ```jsx
   // ✅ 让 React 自动批处理
   const handleSubmit = () => {
     setName('Alice');
     setAge(25);
     setCity('Beijing');
     // 只触发一次渲染
   };
   ```

5. **谨慎使用 flushSync**
   ```jsx
   // ⚠️ 只在必要时使用
   // 场景：需要立即读取 DOM、第三方库集成等
   flushSync(() => {
     setCount(count + 1);
   });
   ```

### ❌ 避免的做法

1. **连续使用非函数式更新**
   ```jsx
   // ❌ 错误
   setCount(count + 1);
   setCount(count + 1);
   setCount(count + 1);
   // count 只加 1
   ```

2. **在渲染函数中调用 setState**
   ```jsx
   // ❌ 错误：会导致无限循环
   function BadComponent() {
     const [count, setCount] = useState(0);
     setCount(count + 1); // 死循环！
     return <div>{count}</div>;
   }
   ```

3. **过度使用 flushSync**
   ```jsx
   // ❌ 错误：破坏批处理，性能差
   handleClick = () => {
     flushSync(() => setName('Alice'));
     flushSync(() => setAge(25));
     flushSync(() => setCity('Beijing'));
     // 触发3次渲染，性能差
   };
   ```

---

## 十、实战案例

### 案例1：表单处理

```jsx
function Form() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 0
  });

  // ✅ 使用函数式更新，确保状态正确合并
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // ✅ 批量更新
    setFormData(prev => ({ ...prev, name: 'Alice' }));
    setFormData(prev => ({ ...prev, email: 'alice@example.com' }));
    setFormData(prev => ({ ...prev, age: 25 }));
    // 只触发一次渲染
  };

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <input
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
    </form>
  );
}
```

### 案例2：计数器（正确实现）

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    // ✅ 使用函数式更新
    setCount(prev => prev + 1);
  };

  const incrementByThree = () => {
    // ✅ 每次基于前一个状态
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // 最终 count + 3
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={incrementByThree}>+3</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 案例3：异步数据加载

```jsx
function DataLoader() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/data');
      const result = await response.json();

      // ✅ React 18 会自动批处理这些更新
      setData(result);
      setLoading(false);
      // 只触发一次渲染
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

---

## 十一、调试技巧

### 1. 使用 React DevTools Profiler

```jsx
// 查看组件渲染次数和原因
import { Profiler } from 'react';

function App() {
  return (
    <Profiler id="App" onRender={(id, phase, actualDuration) => {
      console.log(`${id} 渲染耗时: ${actualDuration}ms`);
    }}>
      <YourComponent />
    </Profiler>
  );
}
```

### 2. 添加日志

```jsx
const [count, setCount] = useState(0);

const handleClick = () => {
  console.log('更新前:', count);

  setCount(prev => {
    console.log('函数式更新，prev =', prev);
    return prev + 1;
  });

  console.log('更新后（可能还是旧值）:', count);
};
```

### 3. 使用 useDebugValue

```jsx
function useCounter(initialValue) {
  const [count, setCount] = useState(initialValue);

  // ✅ 在 React DevTools 中显示调试信息
  useDebugValue(`Count: ${count}`);

  return [count, setCount];
}
```

---

## 十二、快速参考

### setState 调用方式

```jsx
// 1. 对象形式
setState({ count: 1 });

// 2. 函数形式（推荐）
setState(prevState => ({ count: prevState.count + 1 }));

// 3. 带回调（Class 组件）
this.setState({ count: 1 }, () => {
  console.log('更新完成');
});

// 4. 强制同步（React 18）
import { flushSync } from 'react-dom';
flushSync(() => {
  setState({ count: 1 });
});
```

### 不同场景的行为

| React 版本 | 合成事件 | setTimeout | Promise | 原生事件 |
|-----------|---------|-----------|---------|---------|
| 16/17 | 批处理 | 同步 | 同步 | 同步 |
| 18 | 批处理 | **批处理** | **批处理** | **批处理** |

### 记忆口诀

```
React 16/17：
  React 上下文内，批处理生效
  React 上下文外，同步执行

React 18：
  所有情况下，默认批处理
  需要同步时，使用 flushSync
```

---

## 十三、参考资源

- 📚 [React 官方文档 - State 和生命周期](https://react.dev/learn/state-a-components-memory)
- 📚 [React 18 自动批处理](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- 📚 [flushSync API](https://react.dev/reference/react-dom/flushSync)
- 🎥 [React 18 更新详解](https://www.youtube.com/watch?v=FZ0cG47msEk)
- 📖 [深入理解 setState](https://github.com/facebook/react/issues/11527)

---

## 总结

### 核心要点

1. ✅ **setState 不是真正的异步**，而是批处理机制
2. ✅ **React 18 的自动批处理**是重大改进，提升性能
3. ✅ **优先使用函数式更新**，避免闭包陷阱
4. ✅ **不要依赖 setState 后立即读取状态**
5. ✅ **谨慎使用 flushSync**，可能影响性能

### 升级建议

- 从 React 16/17 → React 18：注意异步回调中的 setState 行为变化
- 检查代码中是否依赖了 setTimeout/Promise 中的同步更新
- 使用函数式更新替代直接使用状态值
- 测试确保升级后行为正确

**React 18 的自动批处理是一个重大改进，让 setState 的行为更加一致和可预测！** 🎉

