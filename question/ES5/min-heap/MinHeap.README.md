# 最小堆（Min Heap）实现

基于 React Scheduler 的 TypeScript 最小堆实现，包含完整的注释和测试示例。

## 📚 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [使用示例](#使用示例)
- [算法复杂度](#算法复杂度)
- [实现原理](#实现原理)

## ✨ 特性

- ✅ **完整的 TypeScript 类型支持**
- ✅ **详细的中文注释**
- ✅ **高性能实现**（基于 React Scheduler）
- ✅ **泛型支持**（可用于任何实现 `HeapNode` 接口的对象）
- ✅ **稳定排序**（相同优先级按 FIFO）
- ✅ **调试工具**（print, validate 方法）
- ✅ **丰富的使用示例**

## 🚀 快速开始

### 基本使用

```typescript
import MinHeap from './MinHeap';

// 定义你的节点类型
interface Task extends HeapNode {
  id: number;
  sortIndex: number;
  name: string;
}

// 创建堆
const heap = new MinHeap<Task>();

// 插入元素
heap.push({ id: 1, sortIndex: 100, name: 'Low Priority' });
heap.push({ id: 2, sortIndex: 50, name: 'High Priority' });
heap.push({ id: 3, sortIndex: 75, name: 'Medium Priority' });

// 查看堆顶（最小值）
const top = heap.peek();
console.log(top?.name); // "High Priority"

// 弹出堆顶
const min = heap.pop();
console.log(min?.name); // "High Priority"

// 继续弹出
console.log(heap.pop()?.name); // "Medium Priority"
console.log(heap.pop()?.name); // "Low Priority"
```

### 运行测试

```bash
# 编译 TypeScript
npx tsc MinHeap.ts MinHeap.test.ts

# 运行测试
node MinHeap.test.js

# 或直接使用 ts-node
npx ts-node MinHeap.test.ts
```

## 📖 API 文档

### 类型定义

```typescript
interface HeapNode {
  id: number;        // 唯一标识
  sortIndex: number; // 排序索引（优先级）
}
```

### MinHeap<T extends HeapNode>

#### 构造函数

```typescript
const heap = new MinHeap<YourNodeType>();
```

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | `number` | 堆中元素数量 |
| `isEmpty` | `boolean` | 堆是否为空 |

#### 方法

| 方法 | 返回值 | 复杂度 | 说明 |
|------|--------|--------|------|
| `push(node)` | `void` | O(log n) | 插入元素 |
| `pop()` | `T \| null` | O(log n) | 弹出最小元素 |
| `peek()` | `T \| null` | O(1) | 查看最小元素 |
| `clear()` | `void` | O(1) | 清空堆 |
| `getAll()` | `T[]` | O(n) | 获取所有元素（浅拷贝） |
| `toArray()` | `T[]` | O(n) | 转换为数组 |
| `print()` | `void` | O(n) | 打印堆结构（调试用） |
| `validate()` | `boolean` | O(n) | 验证堆的正确性 |

## 💡 使用示例

### 示例 1：React Scheduler 任务调度

```typescript
interface SchedulerTask extends HeapNode {
  id: number;
  sortIndex: number;
  callback: () => void;
  expirationTime: number;
}

const taskQueue = new MinHeap<SchedulerTask>();

// 添加任务（sortIndex = expirationTime）
taskQueue.push({
  id: 1,
  sortIndex: Date.now() + 5000,
  callback: () => console.log('Normal task'),
  expirationTime: Date.now() + 5000,
});

taskQueue.push({
  id: 2,
  sortIndex: Date.now() + 250,
  callback: () => console.log('Urgent task'),
  expirationTime: Date.now() + 250,
});

// 按优先级执行任务
while (!taskQueue.isEmpty) {
  const task = taskQueue.pop();
  if (task && task.expirationTime <= Date.now()) {
    task.callback();
  }
}
```

### 示例 2：Top K 问题

```typescript
// 找出数组中最大的 K 个元素
function topK(nums: number[], k: number): number[] {
  const heap = new MinHeap<{ id: number; sortIndex: number }>();

  nums.forEach((num, index) => {
    if (heap.size < k) {
      heap.push({ id: index, sortIndex: num });
    } else {
      const min = heap.peek();
      if (min && num > min.sortIndex) {
        heap.pop();
        heap.push({ id: index, sortIndex: num });
      }
    }
  });

  return heap.getAll().map(node => node.sortIndex);
}

console.log(topK([3, 2, 1, 5, 6, 4], 2)); // [5, 6]
```

### 示例 3：合并 K 个排序链表

```typescript
interface ListNode extends HeapNode {
  id: number;
  sortIndex: number;
  value: number;
  next: ListNode | null;
}

function mergeKLists(lists: ListNode[]): ListNode | null {
  const heap = new MinHeap<ListNode>();

  // 将每个链表的第一个节点加入堆
  lists.forEach((head, index) => {
    if (head) {
      heap.push({ ...head, id: index });
    }
  });

  const dummy: ListNode = { 
    id: -1, 
    sortIndex: -1, 
    value: 0, 
    next: null 
  };
  let current = dummy;

  // 不断取出最小节点
  while (!heap.isEmpty) {
    const node = heap.pop();
    if (node) {
      current.next = node;
      current = current.next;

      // 如果该节点有下一个节点，加入堆
      if (node.next) {
        heap.push({ ...node.next, id: node.id });
      }
    }
  }

  return dummy.next;
}
```

### 示例 4：事件调度器

```typescript
class EventScheduler {
  private events = new MinHeap<{
    id: number;
    sortIndex: number;
    name: string;
    handler: () => void;
  }>();
  
  private idCounter = 0;
  private currentTime = 0;

  schedule(name: string, delay: number, handler: () => void) {
    this.events.push({
      id: this.idCounter++,
      sortIndex: this.currentTime + delay,
      name,
      handler,
    });
  }

  tick(deltaTime: number) {
    this.currentTime += deltaTime;

    while (!this.events.isEmpty) {
      const event = this.events.peek();
      if (!event || event.sortIndex > this.currentTime) break;

      this.events.pop();
      event.handler();
    }
  }
}

const scheduler = new EventScheduler();
scheduler.schedule('event1', 100, () => console.log('Event 1'));
scheduler.schedule('event2', 50, () => console.log('Event 2'));
scheduler.tick(60); // Event 2
scheduler.tick(50); // Event 1
```

## ⏱️ 算法复杂度

| 操作 | 时间复杂度 | 空间复杂度 | 说明 |
|------|-----------|-----------|------|
| 插入 (push) | O(log n) | O(1) | 向上调整 |
| 删除最小值 (pop) | O(log n) | O(1) | 向下调整 |
| 查看最小值 (peek) | O(1) | O(1) | 直接访问数组首元素 |
| 构建堆 | O(n) | O(n) | 使用数组存储 |

## 🔧 实现原理

### 数据结构

最小堆使用**数组**表示完全二叉树：

```
       2              数组表示：[2, 5, 3, 8, 7, 6, 9]
      / \
     5   3            索引关系：
    / \ / \           - 父节点：(i - 1) / 2
   8  7 6  9          - 左子节点：2 * i + 1
                      - 右子节点：2 * i + 2
```

### 核心算法

#### 上浮（Sift Up）

当插入新节点时，将其与父节点比较，如果更小则交换：

```typescript
private siftUp(node: T, i: number): void {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = this.heap[parentIndex];
    
    if (this.compare(parent, node) > 0) {
      // 交换
      this.heap[parentIndex] = node;
      this.heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}
```

#### 下沉（Sift Down）

当删除堆顶时，将最后一个节点放到堆顶，然后与子节点比较，如果更大则交换：

```typescript
private siftDown(node: T, i: number): void {
  let index = i;
  const halfLength = this.heap.length >>> 1;
  
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const rightIndex = leftIndex + 1;
    
    // 找到最小的子节点并交换
    // ...
  }
}
```

### 比较规则

```typescript
private compare(a: HeapNode, b: HeapNode): number {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
```

1. **首先比较 sortIndex**（优先级）
2. **如果相同，比较 id**（保证稳定排序，FIFO）

## 🎯 为什么 React 使用最小堆？

React Scheduler 使用最小堆来管理任务队列，因为：

1. **O(1) 获取最高优先级任务**：`peek()` 直接返回堆顶
2. **O(log n) 插入和删除**：性能优秀
3. **动态优先级**：可以随时插入新任务
4. **稳定排序**：相同优先级的任务按 FIFO 顺序执行

### React Scheduler 中的两个堆

```typescript
var taskQueue: Array<Task> = [];    // 就绪任务（最小堆）
var timerQueue: Array<Task> = [];   // 延迟任务（最小堆）
```

- **taskQueue**：按 `expirationTime` 排序，存储可立即执行的任务
- **timerQueue**：按 `startTime` 排序，存储延迟任务

## 📝 注意事项

1. **HeapNode 接口**：所有存储在堆中的对象必须实现 `HeapNode` 接口
2. **sortIndex 含义**：值越小，优先级越高
3. **不可变性**：插入堆后，不要修改节点的 `sortIndex` 或 `id`
4. **空堆检查**：调用 `pop()` 和 `peek()` 前检查 `isEmpty`

## 🤝 贡献

欢迎提 Issue 和 PR！

## 📄 License

MIT

## 🔗 参考

- [React Scheduler 源码](https://github.com/facebook/react/blob/main/packages/scheduler/src/SchedulerMinHeap.js)
- [堆排序算法](https://en.wikipedia.org/wiki/Heapsort)
- [优先队列](https://en.wikipedia.org/wiki/Priority_queue)

