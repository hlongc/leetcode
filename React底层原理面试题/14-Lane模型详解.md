# 14 - Lane模型详解

> **问题**: 什么是Lane模型？它相比之前的expirationTime有什么优势？

---

## 一、Lane模型是什么？

**Lane（车道）模型是React 17引入的新优先级管理系统**，使用31个二进制位表示不同的优先级级别。

### Lane的定义

源码：`packages/react-reconciler/src/ReactFiberLane.js`

```javascript
// Lane类型
export type Lane = number;    // 单个lane（某一位为1）
export type Lanes = number;   // 多个lanes的集合（多位为1）

export const TotalLanes = 31;  // 共31个lane（位0-30）

// 完整的31个Lane定义
export const NoLanes: Lanes = 0b0000000000000000000000000000000;
export const NoLane: Lane = 0b0000000000000000000000000000000;

// ========== Sync优先级（位0-1）==========
export const SyncHydrationLane: Lane = 0b0000000000000000000000000000001;
export const SyncLane: Lane =          0b0000000000000000000000000000010;

// ========== InputContinuous优先级（位2-3）==========
export const InputContinuousHydrationLane: Lane = 0b0000000000000000000000000000100;
export const InputContinuousLane: Lane =          0b0000000000000000000000000001000;

// ========== Default优先级（位4-5）==========
export const DefaultHydrationLane: Lane = 0b0000000000000000000000000010000;
export const DefaultLane: Lane =          0b0000000000000000000000000100000;

// ========== Gesture优先级（位6）==========
export const GestureLane: Lane = 0b0000000000000000000000001000000;

// ========== Transition优先级（位7-20，共14个）==========
const TransitionHydrationLane: Lane = 0b0000000000000000000000010000000;
const TransitionLane1: Lane =         0b0000000000000000000000100000000;
const TransitionLane2: Lane =         0b0000000000000000000001000000000;
const TransitionLane3: Lane =         0b0000000000000000000010000000000;
// ... TransitionLane4-14

// ========== Retry优先级（位21-24，共4个）==========
const RetryLane1: Lane = 0b0000000010000000000000000000000;
const RetryLane2: Lane = 0b0000000100000000000000000000000;
const RetryLane3: Lane = 0b0000001000000000000000000000000;
const RetryLane4: Lane = 0b0000010000000000000000000000000;

// ========== 特殊优先级 ==========
export const SelectiveHydrationLane: Lane = 0b0000100000000000000000000000000;
export const IdleHydrationLane: Lane =      0b0001000000000000000000000000000;
export const IdleLane: Lane =               0b0010000000000000000000000000000;
export const OffscreenLane: Lane =          0b0100000000000000000000000000000;
export const DeferredLane: Lane =           0b1000000000000000000000000000000;
```

**Lane的优先级规则**：

```
位越小（数字越小），优先级越高

位1: SyncLane              0b...010        最高优先级
位3: InputContinuousLane   0b...001000     
位5: DefaultLane           0b...0100000    
位8: TransitionLane1       0b...100000000  
位29: IdleLane             0b010...         最低优先级（非Offscreen/Deferred）

比较：
SyncLane (2) < DefaultLane (32) < TransitionLane1 (256) < IdleLane
数字越小，优先级越高
```

---

## 二、expirationTime模型的问题

### React 16的expirationTime

```javascript
// React 16的优先级计算
const expirationTime = currentTime + timeout;

// 不同优先级的timeout
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// 示例
const syncUpdate = {
  expirationTime: currentTime - 1  // 立即过期
};

const normalUpdate = {
  expirationTime: currentTime + 5000  // 5秒后过期
};
```

**expirationTime的局限性**：

```
问题1：单一优先级表达
一个Fiber只能有一个expirationTime
无法表达"这个Fiber同时有高优先级和低优先级的更新"

示例冲突场景：
Fiber有两个update:
  update1: expirationTime = 100（高优先级）
  update2: expirationTime = 5000（低优先级）

Fiber只能存储一个expirationTime
选100？→ update2被忽略
选5000？→ update1优先级丢失
选最小值？→ 部分正确，但不够精确

问题2：难以实现批量更新
多个更新需要找到"公共的expirationTime"
计算复杂，容易出错

问题3：优先级表达能力有限
只有5个优先级级别（通过timeout区分）
无法满足React 18并发特性的需求
```

---

## 三、Lane模型的核心优势

### 优势1：位运算，极致性能

源码中的核心位运算：

```javascript
// 1. 包含检查：O(1)
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane): boolean {
  return (a & b) !== NoLanes;
}

// 示例
const lanes = 0b0000000000000000000000000101010;  // 多个lane
const syncLane = 0b0000000000000000000000000000010;
includesSomeLane(lanes, syncLane);  // true（lanes包含SyncLane）

// 2. 合并lanes：O(1)
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;  // 按位或
}

// 示例
const lane1 = 0b010;  // SyncLane
const lane2 = 0b100000;  // DefaultLane
mergeLanes(lane1, lane2);  // 0b100010（同时包含两个lane）

// 3. 移除lane：O(1)
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;  // 按位与非
}

// 示例
const lanes = 0b111;  // 包含3个lane
const toRemove = 0b010;  // 要移除SyncLane
removeLanes(lanes, toRemove);  // 0b101（移除后）

// 4. 获取最高优先级lane：O(1)
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;  // 提取最低位的1
}

// 原理（补码运算）：
// lanes =  0b00010110
// -lanes = 0b11101010（补码：取反+1）
// lanes & -lanes = 0b00000010（只保留最低位的1）
```

**为什么`lanes & -lanes`能提取最低位？**

```
数学原理：
n的补码 = ~n + 1

示例：n = 0b00010110 (22)
1. ~n = 0b11101001（按位取反）
2. ~n + 1 = 0b11101010（补码）
3. n & (-n) = 0b00010110 & 0b11101010 = 0b00000010

只有最低位的1会保留下来
其他位都被清零

应用：
lanes = 0b00110100（包含位2、4、5）
getHighestPriorityLane(lanes) = 0b00000100（位2，最高优先级）
```

### 优势2：支持多优先级并存

```javascript
// expirationTime模型的问题
fiber.expirationTime = 100;  // 只能存一个值

// Lane模型的解决方案
fiber.lanes = 0b00110100;    // 可以同时表示多个优先级

// 实际案例
function Component() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    // 高优先级更新
    setCount(1);  // SyncLane (0b010)
    
    // 低优先级更新
    startTransition(() => {
      setCount(2);  // TransitionLane1 (0b100000000)
    });
  };
  
  return <button onClick={handleClick}>{count}</button>;
}

// Fiber.lanes
fiber.lanes = SyncLane | TransitionLane1
            = 0b000000010 | 0b100000000
            = 0b100000010

// 一次render可以同时处理多个优先级的更新
// 或者分批处理：先处理SyncLane，再处理TransitionLane1
```

### 优势3：entanglement（优先级纠缠）

源码实现：

```javascript
export function markRootEntangled(root: FiberRoot, entangledLanes: Lanes) {
  // 如果C纠缠A，那么纠缠A和B也会纠缠C和B（传递性）
  //
  // 翻译：如果已经存在C纠缠A，
  // 现在要纠缠A和B，
  // 那么C也需要纠缠B
  
  const rootEntangledLanes = (root.entangledLanes |= entangledLanes);
  const entanglements = root.entanglements;
  let lanes = rootEntangledLanes;
  
  while (lanes) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    
    if (
      // 这是新纠缠的lane之一？
      (lane & entangledLanes) |
      // 这个lane传递性地纠缠了新的lanes？
      (entanglements[index] & entangledLanes)
    ) {
      // 纠缠所有相关lanes
      entanglements[index] |= entangledLanes;
    }
    lanes &= ~lane;
  }
}
```

**entanglement的应用场景**：

```javascript
// 场景：startTransition中的多个更新必须一起渲染
function Component() {
  const [tab, setTab] = useState('home');
  const [content, setContent] = useState('');

  const handleTabChange = (newTab) => {
    startTransition(() => {
      setTab(newTab);       // update1: TransitionLane1
      setContent(loadContent(newTab));  // update2: TransitionLane1
    });
  };

  return (
    <>
      <TabBar activeTab={tab} onChange={handleTabChange} />
      <Content data={content} />
    </>
  );
}

// entanglement确保：
// 如果渲染了setTab，就必须渲染setContent
// 不会出现tab已切换，但content还是旧的
```

---

## 四、Lane的核心函数实现

### 1. getHighestPriorityLane

```javascript
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;
}

// 示例
const lanes = 0b0000000000000000000000000110010;
//                                      位1, 4, 5

getHighestPriorityLane(lanes) = 0b0000000000000000000000000000010
//                                                        位1（SyncLane）

// 过程：
lanes =  0b0000000000000000000000000110010
-lanes = 0b1111111111111111111111111001110
result = 0b0000000000000000000000000000010
```

### 2. 合并与移除

```javascript
// 合并
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

// 示例
const lanes1 = 0b010;  // SyncLane
const lanes2 = 0b100;  // InputContinuousLane
mergeLanes(lanes1, lanes2) = 0b110  // 包含两个lane

// 移除
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}

// 示例
const lanes = 0b111;  // 包含3个lane
const toRemove = 0b010;  // 移除SyncLane
removeLanes(lanes, toRemove) = 0b111 & 0b...11111101 = 0b101

// 子集检查
export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane): boolean {
  return (set & subset) === subset;
}

// 示例
const lanes = 0b110;
const subset = 0b010;
isSubsetOfLanes(lanes, subset);  // true（lanes包含subset的所有位）
```

### 3. claimNextTransitionLane：分配Transition Lane

```javascript
let nextTransitionUpdateLane: Lane = TransitionLane1;

export function claimNextTransitionUpdateLane(): Lane {
  const lane = nextTransitionUpdateLane;
  nextTransitionUpdateLane <<= 1;  // 左移，切换到下一个TransitionLane
  
  if ((nextTransitionUpdateLane & TransitionUpdateLanes) === NoLanes) {
    // 用完了所有TransitionUpdateLanes，回到第一个
    nextTransitionUpdateLane = TransitionLane1;
  }
  
  return lane;
}

// 执行过程：
// 第1次调用：返回TransitionLane1 (0b...100000000), next = TransitionLane2
// 第2次调用：返回TransitionLane2 (0b...1000000000), next = TransitionLane3
// ...
// 第10次调用：返回TransitionLane10，next回到TransitionLane1
```

**为什么需要多个TransitionLane？**

```
场景：快速连续多次startTransition

startTransition(() => setTab('home'));    // TransitionLane1
startTransition(() => setTab('profile')); // TransitionLane2
startTransition(() => setTab('settings'));// TransitionLane3

好处：
1. 每个transition独立跟踪
2. 可以单独中断某个transition
3. 不会相互影响
4. 更精细的优先级控制
```

---

## 五、过期时间机制（防止饥饿）

### markStarvedLanesAsExpired实现

```javascript
export function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number,
): void {
  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  const expirationTimes = root.expirationTimes;

  // 遍历所有pending的lanes
  let lanes = enableRetryLaneExpiration
    ? pendingLanes
    : pendingLanes & ~RetryLanes;
    
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);  // 31 - clz32(lanes)
    const lane = 1 << index;

    const expirationTime = expirationTimes[index];
    if (expirationTime === NoTimestamp) {
      // 首次调度，计算过期时间
      if (
        (lane & suspendedLanes) === NoLanes ||
        (lane & pingedLanes) !== NoLanes
      ) {
        expirationTimes[index] = computeExpirationTime(lane, currentTime);
      }
    } else if (expirationTime <= currentTime) {
      // 已过期！标记为expiredLanes
      root.expiredLanes |= lane;
    }

    lanes &= ~lane;
  }
}

function computeExpirationTime(lane: Lane, currentTime: number): number {
  switch (lane) {
    case SyncLane:
    case InputContinuousLane:
      // 同步lane：250ms
      return currentTime + syncLaneExpirationMs;
    case DefaultLane:
    case TransitionLane1:
    case TransitionLane2:
    // ... 所有Transition lanes
      // 过渡lane：5000ms
      return currentTime + transitionLaneExpirationMs;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
      // 重试lane：5000ms
      return currentTime + retryLaneExpirationMs;
    case IdleLane:
    case OffscreenLane:
    case DeferredLane:
      // 空闲lane：永不过期
      return NoTimestamp;
    default:
      return NoTimestamp;
  }
}
```

**过期机制示例**：

```javascript
// 时间轴
t=0: TransitionLane更新入队
  → expirationTime[8] = 0 + 5000 = 5000

t=1000: 高优先级更新插队
  → TransitionLane被跳过
  → 继续等待

t=3000: 又一个高优先级更新
  → TransitionLane继续等待
  
t=5100: markStarvedLanesAsExpired检查
  → currentTime = 5100 > expirationTime[8] = 5000
  → root.expiredLanes |= TransitionLane
  → TransitionLane过期！

t=5101: getNextLanes选择lanes
  → 检测到expiredLanes包含TransitionLane
  → 必须处理，不能再被打断
  → 使用同步渲染

结果：
低优先级任务最多延迟5秒
防止永远得不到执行（饥饿）
```

---

## 六、getNextLanes：选择要处理的lanes

源码核心逻辑：

```javascript
export function getNextLanes(
  root: FiberRoot,
  wipLanes: Lanes,
  rootHasPendingCommit: boolean,
): Lanes {
  // 1. 快速退出
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }

  let nextLanes: Lanes = NoLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;

  // 2. 优先处理非Idle工作
  const nonIdlePendingLanes = pendingLanes & NonIdleLanes;
  
  if (nonIdlePendingLanes !== NoLanes) {
    // 有非Idle工作
    const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    
    if (nonIdleUnblockedLanes !== NoLanes) {
      // 选择最高优先级的未阻塞lane
      nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
    } else {
      // 所有lanes都suspended，选择被ping的
      const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
      if (nonIdlePingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
      }
    }
  } else {
    // 只有Idle工作
    const unblockedLanes = pendingLanes & ~suspendedLanes;
    if (unblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(unblockedLanes);
    } else if (pingedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(pingedLanes);
    }
  }

  if (nextLanes === NoLanes) {
    return NoLanes;
  }

  // 3. 中断判断
  if (
    wipLanes !== NoLanes &&
    wipLanes !== nextLanes &&
    (wipLanes & suspendedLanes) === NoLanes
  ) {
    const nextLane = getHighestPriorityLane(nextLanes);
    const wipLane = getHighestPriorityLane(wipLanes);
    
    if (
      nextLane >= wipLane ||  // 新lane优先级不高，不中断
      (nextLane === DefaultLane && (wipLane & TransitionLanes) !== NoLanes)
    ) {
      // 继续当前工作，不中断
      return wipLanes;
    }
  }

  // 4. 应用entanglement
  nextLanes = entangleLanes(root, nextLanes);

  return nextLanes;
}
```

**决策流程图**：

```
getNextLanes(root, wipLanes)
         ↓
   有pending lanes？
      /        \
    否          是
     ↓          ↓
  NoLanes   区分Idle和非Idle
              ↓
        选择未suspended的
              ↓
        获取最高优先级
              ↓
        是否中断当前render？
          /          \
        否            是
         ↓            ↓
    返回wipLanes  返回nextLanes
         ↓            ↓
    应用entanglement
         ↓
    返回最终lanes
```

---

## 七、实际应用案例

### 案例1：高优先级打断低优先级

```javascript
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    
    // 高优先级：SyncLane
    setQuery(value);
    
    // 低优先级：TransitionLane1
    startTransition(() => {
      setResults(search(value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      <ResultsList results={results} />
    </>
  );
}

// Lane处理流程：
t=0: 用户输入"R"
  → setQuery: fiber.lanes |= SyncLane
  → setResults: fiber.lanes |= TransitionLane1
  → fiber.lanes = 0b100000010
  → getNextLanes → SyncLane（最高优先级）
  → renderRootSync，只处理SyncLane的更新
  → query变成"R"，commit

t=10: 开始处理TransitionLane1
  → renderRootConcurrent
  → 正在渲染ResultsList...

t=15: 用户继续输入"e"
  → setQuery: fiber.lanes |= SyncLane
  → getNextLanes → SyncLane
  → SyncLane优先级 > TransitionLane1
  → 中断TransitionLane1的render！
  → 开始SyncLane的render
  → query变成"Re"，commit

t=20: 恢复TransitionLane1
  → 但query已经是"Re"了
  → 重新计算results
  → commit
```

### 案例2：Lanes的批量处理

```javascript
function Dashboard() {
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [data3, setData3] = useState(null);

  useEffect(() => {
    // 三个异步请求同时发起
    startTransition(() => {
      fetchData1().then(setData1);  // TransitionLane1
      fetchData2().then(setData2);  // TransitionLane2
      fetchData3().then(setData3);  // TransitionLane3
    });
  }, []);

  return (
    <>
      <Panel1 data={data1} />
      <Panel2 data={data2} />
      <Panel3 data={data3} />
    </>
  );
}

// 数据陆续返回时的处理：
t=100: data1返回
  → setData1触发更新
  → fiber.lanes |= TransitionLane1
  → 调度render

t=110: data2也返回（render还没开始）
  → setData2触发更新
  → fiber.lanes |= TransitionLane2
  → fiber.lanes = TransitionLane1 | TransitionLane2

t=120: render开始
  → getNextLanes → TransitionLane1 | TransitionLane2
  → 同时处理两个update，一次render完成

好处：
- 减少render次数
- 状态一致性
- 用户体验更好
```

---

## 八、Lane vs expirationTime对比总结

| 特性 | expirationTime | Lane模型 |
|------|----------------|----------|
| **表达能力** | 单一优先级 | 31个优先级 |
| **多优先级** | ❌ 不支持 | ✅ 位运算表示 |
| **性能** | 比较运算 | 位运算（更快） |
| **批量更新** | 复杂 | 天然支持 |
| **entanglement** | ❌ 不支持 | ✅ 支持 |
| **代码复杂度** | 较低 | 较高 |
| **灵活性** | 有限 | 极强 |

---

## 九、源码关键路径

```
Lane模型核心文件：

packages/react-reconciler/src/
├── ReactFiberLane.js                   # Lane模型核心
│   ├── 31个Lane定义                    # SyncLane, TransitionLane等
│   ├── getHighestPriorityLane()        # 位运算提取最高优先级
│   ├── mergeLanes()                    # 合并lanes
│   ├── removeLanes()                   # 移除lanes
│   ├── includesSomeLane()              # 检查是否包含
│   ├── isSubsetOfLanes()               # 子集检查
│   ├── getNextLanes()                  # 选择下一批lanes
│   ├── markStarvedLanesAsExpired()     # 过期检测
│   ├── markRootEntangled()             # 优先级纠缠
│   ├── claimNextTransitionUpdateLane() # 分配Transition lane
│   └── computeExpirationTime()         # 计算过期时间
│
├── ReactEventPriorities.js            # EventPriority与Lane转换
│   ├── lanesToEventPriority()         # Lane → EventPriority
│   └── eventPriorityToLane()          # EventPriority → Lane
│
└── ReactFiberRootScheduler.js         # 调度器集成
    └── scheduleTaskForRootDuringMicrotask()  # 微任务中调度
```

---

## 十、面试要点速记

### 快速回答框架

**Lane模型的核心？**
- 31个二进制位表示31个优先级级别
- 位越小（数字越小）优先级越高
- 使用位运算操作，性能极佳

**相比expirationTime的优势？**
1. **多优先级并存**：一个数字可表示多个优先级
2. **位运算快速**：O(1)复杂度
3. **表达能力强**：31个级别 vs 5个级别
4. **支持批量操作**：自然支持多个update合并
5. **支持entanglement**：优先级传递性绑定

**Lane的分类（按优先级从高到低）？**
1. Sync（2个）- 同步更新
2. InputContinuous（2个）- 连续输入
3. Default（2个）- 默认更新
4. Gesture（1个）- 手势
5. Transition（14个）- 过渡动画
6. Retry（4个）- 重试
7. Idle（1个）- 空闲
8. 特殊（5个）- Offscreen、Deferred等

**过期机制如何工作？**
- 每个lane有独立的expirationTime
- 超时后标记到expiredLanes
- 过期的lane强制同步执行
- 防止低优先级任务饥饿

### 加分项

1. **能解释位运算原理**：
   - `lanes & -lanes`提取最低位
   - 补码运算的数学原理

2. **能说明entanglement应用**：
   - startTransition中的多个更新
   - Context的传递性纠缠

3. **能对比新旧模型**：
   - expirationTime的局限
   - Lane模型的改进

4. **能分析实际场景**：
   - 高优先级打断
   - 批量处理
   - 过期保护

### 常见追问

**Q: 为什么选择31个lane而不是32个？**
A:
- JavaScript的位运算符使用32位有符号整数
- 最高位是符号位
- 实际可用31位（0-30）
- 31个已经足够表达所有优先级场景

**Q: clz32是什么？**
A:
- Count Leading Zeros in 32-bit
- 计算32位整数前导零的个数
- 用于快速定位最高位的1
- `31 - clz32(lanes)`得到最高位索引

**Q: 为什么Transition需要14个lane？**
A:
- 支持多个并发的transition
- 每个transition独立跟踪
- 可以单独中断某个transition
- 提供足够的并发度

**Q: entanglement的传递性如何理解？**
A:
```
如果A纠缠C，现在要纠缠A和B
那么C也要纠缠B（传递性）

实际场景：
- update1和update3在同一个startTransition中（纠缠）
- update1和update2有Context依赖（纠缠）
- 则update2和update3也需要纠缠（传递）
- 保证状态一致性
```

---

**参考资料**：
- React源码：`packages/react-reconciler/src/ReactFiberLane.js`
- [Lane Model RFC](https://github.com/facebook/react/pull/18796)
- [Lane Model 设计文档](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberLane.js#L10-L86)

**最后更新**: 2025-11-05

