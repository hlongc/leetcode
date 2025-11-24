# 04 - React Diff算法原理详解

> **问题**: 请详细描述React的diff算法原理，特别是单节点diff和多节点diff的区别和实现策略。

---

## 一、Diff算法是什么？

**Diff算法是React协调（Reconciliation）过程的核心**，用于比较新旧两棵虚拟DOM树，找出差异并高效地更新真实DOM。

### 为什么需要Diff算法？

```
没有Diff：
旧DOM树: <div><p>Hello</p><span>World</span></div>
新DOM树: <div><p>Hi</p><span>World</span></div>

暴力方案：删除整个div，重新创建
┌─────────────────────────┐
│ 1. 销毁所有子节点        │
│ 2. 销毁div              │
│ 3. 创建新div            │
│ 4. 创建新的所有子节点    │
└─────────────────────────┘
代价：昂贵！

有Diff：
React Diff检测：
- div: 类型相同 → 复用 ✓
- p: 类型相同，内容变化 → 更新文本 ✓
- span: 类型和内容相同 → 复用 ✓

只需要：更新p节点的textContent
代价：极小！
```

### React Diff的三大策略

React基于三个假设设计Diff算法：

1. **Tree Diff（树层级）**：只对同层节点进行比较
   - 跨层级移动极少见
   - 不同层级的节点不做比较

2. **Component Diff（组件级）**：相同类型组件生成相似树结构
   - type不同的组件，生成不同的树
   - type相同的组件，可能生成相似的树（继续diff）

3. **Element Diff（元素级）**：通过key标识节点
   - 有key，可以快速定位
   - 没key，按位置比较

---

## 二、单节点Diff

### 什么是单节点？

```javascript
// 单节点：只有一个子元素
function App() {
  return <div>Hello</div>;
}

// 或者条件渲染切换单个子元素
function App({ show }) {
  return show ? <div>Hello</div> : <span>Hi</span>;
}
```

### 单节点Diff的核心逻辑

源码：`packages/react-reconciler/src/ReactChildFiber.js`

```javascript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement,
  lanes: Lanes,
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  
  // 遍历所有旧的子节点（可能有多个）
  while (child !== null) {
    // 第一步：判断key是否相同
    if (child.key === key) {
      const elementType = element.type;
      
      // 第二步：判断type是否相同
      if (
        child.elementType === elementType ||
        // Lazy类型的特殊处理
        (typeof elementType === 'object' &&
          elementType !== null &&
          elementType.$$typeof === REACT_LAZY_TYPE &&
          resolveLazy(elementType) === child.type)
      ) {
        // key和type都相同 → 可以复用
        // 删除剩余的兄弟节点
        deleteRemainingChildren(returnFiber, child.sibling);
        
        // 复用当前节点
        const existing = useFiber(child, element.props);
        existing.ref = coerceRef(element);
        existing.return = returnFiber;
        
        return existing;
      }
      
      // key相同但type不同 → 不能复用
      // 删除所有旧节点（包括当前节点和兄弟节点）
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // key不同 → 删除当前节点，继续比较兄弟节点
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  // 没有找到可复用的节点，创建新节点
  const created = createFiberFromElement(element, returnFiber.mode, lanes);
  created.ref = coerceRef(element);
  created.return = returnFiber;
  return created;
}
```

### 单节点Diff流程图

```
┌──────────────────────────┐
│ 新节点: <div key="a" />  │
│ 旧节点链表: Fiber链       │
└────────────┬─────────────┘
             ↓
    ┌────────────────┐
    │ 遍历旧子节点    │
    └────────┬───────┘
             ↓
    ┌────────────────────┐
    │ 第一步：比较key    │
    │ child.key === key? │
    └────┬──────────┬────┘
      否 │          │ 是
         ↓          ↓
    deleteChild  ┌──────────────────┐
    继续下一个   │ 第二步：比较type │
                 │ type相同?        │
                 └────┬──────┬──────┘
                   是 │      │ 否
                      ↓      ↓
              ┌──────────┐  deleteRemaining
              │ 复用节点  │  创建新节点
              │ useFiber │
              └──────────┘
```

### 实际案例分析

#### 案例1：更新属性

```javascript
// 旧节点
<div key="a" className="old">Hello</div>

// 新节点
<div key="a" className="new">Hello</div>

// Diff过程：
1. 比较key: "a" === "a" ✓
2. 比较type: "div" === "div" ✓
3. 复用Fiber节点
4. 标记Update flag
5. commit阶段更新className
```

#### 案例2：更换类型

```javascript
// 旧节点
<div key="a">Hello</div>

// 新节点
<span key="a">Hello</span>

// Diff过程：
1. 比较key: "a" === "a" ✓
2. 比较type: "div" !== "span" ✗
3. 删除旧的div Fiber
4. 创建新的span Fiber
5. commit阶段：先删除div DOM，再创建span DOM
```

#### 案例3：key不同

```javascript
// 旧节点
<div key="a">Hello</div>

// 新节点
<div key="b">Hello</div>

// Diff过程：
1. 比较key: "a" !== "b" ✗
2. 删除key="a"的节点
3. 继续比较（已无更多节点）
4. 创建key="b"的新节点
```

---

## 三、多节点Diff

### 什么是多节点？

```javascript
// 多节点：数组形式的子元素
function App() {
  return (
    <div>
      {items.map(item => (
        <Item key={item.id} data={item} />
      ))}
    </div>
  );
}
```

### 多节点Diff的难点

```
旧节点：[A, B, C, D]
新节点：[B, A, E, C]

需要处理：
1. 删除：D被删除
2. 新增：E被新增
3. 移动：B移到前面，A移到后面
4. 更新：C的位置没变，但可能属性变了

一次性处理所有情况 → 复杂度高
React的策略：分轮次处理，优化常见场景
```

### 多节点Diff的三轮遍历

源码：`packages/react-reconciler/src/ReactChildFiber.js`

```javascript
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>,
  lanes: Lanes,
): Fiber | null {
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;  // 最后一个可复用节点的位置
  let newIdx = 0;
  let nextOldFiber = null;

  // ==================== 第一轮遍历 ====================
  // 处理：节点更新
  // 策略：从左往右，依次比较，遇到不能复用的就停止
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    
    // updateSlot: 如果key不同，返回null
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes,
    );
    
    if (newFiber === null) {
      // key不同，无法复用，跳出第一轮
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    
    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        // 没有复用（type不同），删除旧节点
        deleteChild(returnFiber, oldFiber);
      }
    }
    
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    
    // 构建新的Fiber链表
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  // ==================== 第二轮遍历的情况1 ====================
  // 新节点遍历完，旧节点还有 → 删除剩余旧节点
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  // ==================== 第二轮遍历的情况2 ====================
  // 旧节点遍历完，新节点还有 → 创建剩余新节点
  if (oldFiber === null) {
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

  // ==================== 第三轮遍历 ====================
  // 新旧节点都还有 → 处理移动、删除、新增
  // 策略：将剩余旧节点存入Map，通过key快速查找
  
  const existingChildren = mapRemainingChildren(oldFiber);

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
          // 复用了旧节点，从Map中删除
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
    // Map中剩余的节点都是要删除的
    existingChildren.forEach(child => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}
```

### 关键函数详解

#### 1. updateSlot：按位置更新

```javascript
function updateSlot(
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  const key = oldFiber !== null ? oldFiber.key : null;

  if (typeof newChild === 'object' && newChild !== null) {
    if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
      // key不同，返回null，告诉调用者无法复用
      if (newChild.key !== key) {
        return null;
      }
      // key相同，尝试更新
      return updateElement(returnFiber, oldFiber, newChild, lanes);
    }
  }

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    // 文本节点没有key
    if (key !== null) {
      return null;
    }
    return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
  }

  return null;
}
```

#### 2. placeChild：决定节点位置

```javascript
function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number,
): number {
  newFiber.index = newIndex;
  
  if (!shouldTrackSideEffects) {
    // 首次渲染，不需要标记
    return lastPlacedIndex;
  }
  
  const current = newFiber.alternate;
  if (current !== null) {
    const oldIndex = current.index;
    
    if (oldIndex < lastPlacedIndex) {
      // 旧位置 < 最后一个复用节点的位置
      // 需要移动到右边
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      // 位置没变或向右移动
      // 不需要移动，更新lastPlacedIndex
      return oldIndex;
    }
  } else {
    // 新增节点
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}
```

**lastPlacedIndex的关键作用**：

```
规则：
- 如果oldIndex >= lastPlacedIndex：不移动，更新lastPlacedIndex
- 如果oldIndex < lastPlacedIndex：需要移动

为什么这样设计？
→ 尽量减少DOM移动次数
→ 优化"向右移动"的场景（最常见）

示例：
旧: A(0) B(1) C(2) D(3)
新: B    C    A    D

第一轮遍历：
- newIdx=0, 新=B, 旧=A, key不同 → break

第三轮遍历（使用Map）：
- newIdx=0, B: oldIndex=1, lastPlaced=0 → 1>=0, 不移动, lastPlaced=1
- newIdx=1, C: oldIndex=2, lastPlaced=1 → 2>=1, 不移动, lastPlaced=2
- newIdx=2, A: oldIndex=0, lastPlaced=2 → 0<2, 需要移动! lastPlaced=2
- newIdx=3, D: oldIndex=3, lastPlaced=2 → 3>=2, 不移动, lastPlaced=3

结果：只需要移动A到C后面
```

#### 3. mapRemainingChildren：建立Map索引

```javascript
function mapRemainingChildren(
  currentFirstChild: Fiber,
): Map<string | number, Fiber> {
  const existingChildren: Map<string | number, Fiber> = new Map();

  let existingChild: null | Fiber = currentFirstChild;
  while (existingChild !== null) {
    // 有key用key，没key用index
    if (existingChild.key !== null) {
      existingChildren.set(existingChild.key, existingChild);
    } else {
      existingChildren.set(existingChild.index, existingChild);
    }
    existingChild = existingChild.sibling;
  }
  
  return existingChildren;
}
```

---

## 四、三轮遍历的详细案例

### 案例1：纯新增

```javascript
旧: []
新: [A, B, C]

第一轮遍历：
- oldFiber = null，直接跳出

第二轮遍历（情况2）：
- 旧节点遍历完，创建所有新节点
- 创建A、B、C
- 全部标记Placement

结果：3次插入操作
```

### 案例2：纯删除

```javascript
旧: [A, B, C]
新: []

第一轮遍历：
- newIdx = 0, newChildren.length = 0，跳出

第二轮遍历（情况1）：
- 新节点遍历完，删除所有旧节点
- 删除A、B、C
- 全部标记Deletion

结果：3次删除操作
```

### 案例3：更新属性

```javascript
旧: [<div key="a" class="old">1</div>, <div key="b">2</div>]
新: [<div key="a" class="new">1</div>, <div key="b">2</div>]

第一轮遍历：
- newIdx=0, A: key相同, type相同 → 复用，标记Update
- newIdx=1, B: key相同, type相同 → 复用，不需要Update
- 遍历结束

第二轮遍历（情况1）：
- newIdx === newChildren.length，结束

结果：只更新A的className
```

### 案例4：简单移动

```javascript
旧: [A(0), B(1), C(2)]
新: [C, A, B]

第一轮遍历：
- newIdx=0, 新=C(key=c), 旧=A(key=a) → key不同，break

第三轮遍历：
Map: {a: A(0), b: B(1), c: C(2)}

- newIdx=0, C: 
    oldIndex=2, lastPlaced=0 → 2>=0, 不移动, lastPlaced=2
    从Map删除c

- newIdx=1, A:
    oldIndex=0, lastPlaced=2 → 0<2, 移动! lastPlaced=2
    标记Placement
    从Map删除a

- newIdx=2, B:
    oldIndex=1, lastPlaced=2 → 1<2, 移动! lastPlaced=2
    标记Placement
    从Map删除b

Map为空，没有节点需要删除

结果：移动A和B到C后面
```

### 案例5：复杂场景

```javascript
旧: [A(0), B(1), C(2), D(3), E(4)]
新: [B, E, C, A]

第一轮遍历：
- newIdx=0, 新=B, 旧=A → key不同，break

第三轮遍历：
Map: {a: A(0), b: B(1), c: C(2), d: D(3), e: E(4)}

- newIdx=0, B:
    oldIndex=1, lastPlaced=0 → 1>=0, 不移动, lastPlaced=1
    从Map删除b

- newIdx=1, E:
    oldIndex=4, lastPlaced=1 → 4>=1, 不移动, lastPlaced=4
    从Map删除e

- newIdx=2, C:
    oldIndex=2, lastPlaced=4 → 2<4, 移动! lastPlaced=4
    标记Placement
    从Map删除c

- newIdx=3, A:
    oldIndex=0, lastPlaced=4 → 0<4, 移动! lastPlaced=4
    标记Placement
    从Map删除a

Map剩余: {d: D(3)}
删除D，标记Deletion

结果：
- 删除：D
- 移动：C移到E后，A移到C后
- 不动：B、E
```

---

## 五、key的作用与最佳实践

### key的核心作用

1. **唯一标识**：帮助React识别哪些元素改变了
2. **复用优化**：相同key的节点可以复用
3. **顺序调整**：通过key快速定位移动的节点

### 为什么不能用index作为key？

```javascript
// ❌ 错误示例
const list = ['A', 'B', 'C'];
list.map((item, index) => <div key={index}>{item}</div>);

// 删除B后
const list = ['A', 'C'];

旧Fiber: 
  div(key=0, content='A')
  div(key=1, content='B')
  div(key=2, content='C')

新Element:
  div(key=0, content='A')
  div(key=1, content='C')

Diff过程：
- key=0: A === A → 复用 ✓
- key=1: B !== C → 认为B变成了C，标记Update
- key=2: 旧节点还有，新节点没有 → 标记Deletion

问题：
1. 本应该删除B，但React删除了C
2. 本应该保持C不变，但React更新了B的内容为C
3. DOM操作更多（1次更新 + 1次删除，而不是1次删除）
```

**正确做法**：

```javascript
// ✅ 正确示例
const list = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
];
list.map(item => <div key={item.id}>{item.name}</div>);

// 删除B后
const list = [
  { id: 'a', name: 'A' },
  { id: 'c', name: 'C' },
];

旧Fiber:
  div(key='a', content='A')
  div(key='b', content='B')
  div(key='c', content='C')

新Element:
  div(key='a', content='A')
  div(key='c', content='C')

Diff过程：
- key='a': A === A → 复用 ✓
- key='c': 在Map中找到 → 复用 ✓
- key='b': Map中剩余 → 标记Deletion

结果：
1. 正确删除B
2. A和C都被复用，保持了组件状态
3. 最少的DOM操作（只有1次删除）
```

### key的最佳实践

#### ✅ 推荐做法

```javascript
// 1. 使用数据库ID
{users.map(user => (
  <User key={user.id} data={user} />
))}

// 2. 使用唯一标识符
import { v4 as uuidv4 } from 'uuid';

const items = data.map(item => ({
  ...item,
  id: item.id || uuidv4()
}));

// 3. 组合多个字段形成唯一key
{orders.map(order => (
  <Order key={`${order.userId}-${order.timestamp}`} data={order} />
))}

// 4. 稳定的顺序可以用index（只读列表）
const months = ['Jan', 'Feb', 'Mar', ...];
months.map((month, index) => (
  <li key={index}>{month}</li>
));
```

#### ❌ 避免的做法

```javascript
// 1. 动态生成的key
{items.map(item => (
  <Item key={Math.random()} data={item} />
  // ❌ 每次render都变，无法复用
))}

// 2. 使用index（动态列表）
{items.map((item, index) => (
  <Item key={index} data={item} />
  // ❌ 删除/插入会导致key错乱
))}

// 3. 使用对象作为key
{items.map(item => (
  <Item key={item} data={item} />
  // ❌ 对象会被转成字符串[object Object]
))}
```

---

## 六、Diff算法的性能优化

### 1. 时间复杂度分析

**传统Diff算法**：O(n³)
- 树的编辑距离问题
- 需要考虑所有可能的变换

**React Diff算法**：O(n)
- 只比较同层级节点
- 通过key快速定位
- 三轮遍历策略

### 2. 优化原理

```
传统算法：
比较两棵树的所有节点
┌─────────┐        ┌─────────┐
│ 树1     │   ←→   │ 树2     │
│ 1000个  │        │ 1000个  │
│ 节点    │        │ 节点    │
└─────────┘        └─────────┘
复杂度：O(1000³) = 10亿次比较

React算法：
只比较同层级
┌─────────┐        ┌─────────┐
│ 第1层   │   →    │ 第1层   │
├─────────┤        ├─────────┤
│ 第2层   │   →    │ 第2层   │
├─────────┤        ├─────────┤
│ 第3层   │   →    │ 第3层   │
└─────────┘        └─────────┘
复杂度：O(1000) = 1000次比较
```

### 3. 实战优化技巧

#### 技巧1：使用PureComponent/React.memo

```javascript
// 跳过不必要的diff
const MemoItem = React.memo(function Item({ data }) {
  return <div>{data.name}</div>;
}, (prevProps, nextProps) => {
  // 返回true表示不需要重新渲染
  return prevProps.data.id === nextProps.data.id &&
         prevProps.data.name === nextProps.data.name;
});

// 好处：props没变时，跳过reconcileChildren
```

#### 技巧2：合理拆分组件

```javascript
// ❌ 不好：整个列表重新diff
function App() {
  const [query, setQuery] = useState('');
  const [items] = useState(largeList);
  
  const filtered = items.filter(item => 
    item.name.includes(query)
  );

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {filtered.map(item => <Item key={item.id} data={item} />)}
    </>
  );
}

// ✅ 好：列表组件独立，input变化不影响列表diff
function App() {
  const [query, setQuery] = useState('');
  
  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ItemList query={query} />
    </>
  );
}

const ItemList = React.memo(function ItemList({ query }) {
  const [items] = useState(largeList);
  const filtered = items.filter(item => 
    item.name.includes(query)
  );
  
  return filtered.map(item => <Item key={item.id} data={item} />);
});
```

#### 技巧3：虚拟化长列表

```javascript
import { FixedSizeList } from 'react-window';

// 只渲染可见区域的items，减少diff数量
function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <Item 
          key={items[index].id}
          data={items[index]}
          style={style}
        />
      )}
    </FixedSizeList>
  );
}

// 10000个item，只diff可见的20个
```

---

## 七、边界情况与特殊处理

### 1. Fragment的diff

```javascript
// Fragment会被当作透明容器
function App() {
  return (
    <>
      <div>A</div>
      <div>B</div>
    </>
  );
}

// 等价于
function App() {
  return [
    <div key="0">A</div>,
    <div key="1">B</div>,
  ];
}

// Diff时会走数组的多节点diff流程
```

### 2. null/undefined/boolean

```javascript
// 这些值会被忽略
function App({ show }) {
  return (
    <div>
      {show && <Component />}
      {false}
      {null}
      {undefined}
    </div>
  );
}

// React内部会过滤这些值
// 实际children: show ? [Component] : []
```

### 3. 跨层级移动

```javascript
// ❌ React不会检测跨层级移动
旧:
<div>
  <span>A</span>
</div>

新:
<div>
  <p>
    <span>A</span>
  </p>
</div>

React的处理：
1. 删除旧的span
2. 创建p
3. 创建新的span

// 不会识别为"移动"，而是"删除+创建"
```

---

## 八、源码关键路径

```
Diff算法核心文件：

packages/react-reconciler/src/
├── ReactChildFiber.js                # Diff算法主文件
│   ├── reconcileSingleElement()      # 单节点diff
│   ├── reconcileChildrenArray()      # 多节点diff（数组）
│   ├── updateSlot()                  # 按位置更新
│   ├── updateFromMap()               # 从Map中查找更新
│   ├── placeChild()                  # 决定节点位置
│   ├── mapRemainingChildren()        # 建立Map索引
│   └── deleteRemainingChildren()     # 删除剩余节点
│
├── ReactFiberBeginWork.js            # beginWork调用diff
│   └── reconcileChildren()           # diff入口
│
└── ReactFiberFlags.js                # 副作用标记
    ├── Placement                     # 插入/移动
    ├── Update                        # 更新
    └── Deletion                      # 删除
```

---

## 九、面试要点速记

### 快速回答框架

**Diff算法是什么？**
- 比较新旧虚拟DOM，找出差异
- O(n)时间复杂度
- 基于三大策略：Tree Diff、Component Diff、Element Diff

**单节点diff？**
1. 比较key，不同则删除继续找
2. key相同比较type，相同则复用
3. type不同则删除所有旧节点，创建新节点

**多节点diff？**
三轮遍历：
1. 第一轮：处理更新，从左到右，遇到key不同就停止
2. 第二轮：处理新增和删除的边界情况
3. 第三轮：处理移动，使用Map优化查找

**key的作用？**
- 唯一标识节点
- 帮助React快速定位和复用
- 不要用index（动态列表）

### 加分项

1. **能说明lastPlacedIndex的作用**：减少DOM移动次数
2. **能分析不同场景的复杂度**：最好O(n)，最坏O(n²)
3. **能给出性能优化建议**：memo、虚拟化、合理拆分
4. **能解释为什么不用传统算法**：O(n³) → O(n)

### 常见追问

**Q: 为什么只比较同层级？**
A:
- 跨层级移动极少见（< 1%）
- 同层比较：O(n)
- 跨层比较：O(n²)或O(n³)
- 性能优先，牺牲极少场景

**Q: 如果非要跨层级移动怎么办？**
A:
- React会删除旧节点，创建新节点
- 可以通过state提升避免
- 或者使用Portal

**Q: 多节点diff为什么要三轮遍历？**
A:
- 优化常见场景：
  - 第一轮：处理最常见的更新（80%）
  - 第二轮：快速处理纯新增/删除（15%）
  - 第三轮：处理复杂移动（5%）
- 避免每次都建立Map（性能优化）

**Q: key相同type不同会怎样？**
A:
- 删除旧节点
- 创建新节点
- 不会复用（type变了，结构完全不同）

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactChildFiber.js`
- [React官方文档 - Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [Lin Clark - A Cartoon Intro to Fiber](https://www.youtube.com/watch?v=ZCuYPiUIONs)

**最后更新**: 2025-11-05

