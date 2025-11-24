# 最小堆 - 快速开始指南

## 📦 文件说明

| 文件 | 说明 |
|------|------|
| `MinHeap.ts` | 最小堆核心实现（包含详细注释） |
| `MinHeap.test.ts` | 完整的测试和使用示例 |
| `MinHeap.README.md` | 完整文档 |
| `tsconfig.heap.json` | TypeScript 配置 |

## 🚀 快速运行

### 方式 1：使用 ts-node（推荐）

```bash
# 安装 ts-node（如果还没安装）
npm install -g ts-node typescript

# 运行测试
ts-node MinHeap.test.ts
```

### 方式 2：编译后运行

```bash
# 编译
npx tsc --project tsconfig.heap.json

# 运行
node dist/MinHeap.test.js
```

### 方式 3：直接在代码中使用

```typescript
// 1. 导入
import MinHeap, { HeapNode } from './MinHeap';

// 2. 定义你的数据类型
interface MyTask extends HeapNode {
  id: number;
  sortIndex: number;
  name: string;
}

// 3. 创建堆
const heap = new MinHeap<MyTask>();

// 4. 使用
heap.push({ id: 1, sortIndex: 10, name: 'Task 1' });
heap.push({ id: 2, sortIndex: 5, name: 'Task 2' });

console.log(heap.peek()?.name); // "Task 2" (优先级更高)
```

## 💡 核心概念

### HeapNode 接口

所有存入堆的对象必须有这两个属性：

```typescript
interface HeapNode {
  id: number;        // 唯一标识（用于稳定排序）
  sortIndex: number; // 排序值（越小优先级越高）
}
```

### 最小堆特性

```
堆顶永远是 sortIndex 最小的元素

       5              ← 堆顶（最小）
      / \
     7   8
    / \
   9   10
```

## 📊 常见使用场景

### 1. 优先级队列

```typescript
const priorityQueue = new MinHeap<{
  id: number;
  sortIndex: number;
  priority: number;
  task: () => void;
}>();

// 添加任务
priorityQueue.push({
  id: 1,
  sortIndex: 1,  // 高优先级
  priority: 1,
  task: () => console.log('High priority task'),
});

priorityQueue.push({
  id: 2,
  sortIndex: 10, // 低优先级
  priority: 10,
  task: () => console.log('Low priority task'),
});

// 按优先级执行
while (!priorityQueue.isEmpty) {
  const item = priorityQueue.pop();
  item?.task();
}
```

### 2. Top K 问题

```typescript
function findTopK(numbers: number[], k: number): number[] {
  const heap = new MinHeap<{ id: number; sortIndex: number }>();

  numbers.forEach((num, index) => {
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

const result = findTopK([3, 2, 1, 5, 6, 4], 2);
console.log(result); // [5, 6] 或 [6, 5]
```

### 3. 定时任务调度

```typescript
class Timer {
  private tasks = new MinHeap<{
    id: number;
    sortIndex: number;
    executeTime: number;
    callback: () => void;
  }>();
  
  private idCounter = 0;

  schedule(delay: number, callback: () => void) {
    const executeTime = Date.now() + delay;
    this.tasks.push({
      id: this.idCounter++,
      sortIndex: executeTime,
      executeTime,
      callback,
    });
  }

  execute() {
    const now = Date.now();
    while (!this.tasks.isEmpty) {
      const task = this.tasks.peek();
      if (!task || task.executeTime > now) break;
      
      this.tasks.pop();
      task.callback();
    }
  }
}

const timer = new Timer();
timer.schedule(1000, () => console.log('1 second later'));
timer.schedule(500, () => console.log('0.5 second later'));

setTimeout(() => timer.execute(), 1500);
```

## 🔍 调试工具

### 打印堆结构

```typescript
heap.print();
```

输出：
```
Min Heap Structure:
===================
Level 0: [id:2, sort:5]
Level 1: [id:1, sort:10] [id:3, sort:8]
===================
```

### 验证堆的正确性

```typescript
const isValid = heap.validate();
console.log(isValid); // true
```

## ⚡ 性能提示

### ✅ DO - 推荐做法

```typescript
// 1. 批量插入后再使用
for (let i = 0; i < 1000; i++) {
  heap.push(data[i]);
}
// 然后再弹出

// 2. 使用 peek 检查是否需要处理
if (heap.peek()?.sortIndex < threshold) {
  const item = heap.pop();
  process(item);
}

// 3. 检查是否为空
if (!heap.isEmpty) {
  const item = heap.pop();
}
```

### ❌ DON'T - 避免做法

```typescript
// 1. 不要频繁修改已插入的节点
const node = { id: 1, sortIndex: 10 };
heap.push(node);
node.sortIndex = 5;  // ❌ 不要这样做！

// 2. 不要在堆中存储大对象
heap.push({
  id: 1,
  sortIndex: 10,
  largeData: new Array(10000).fill(0), // ❌ 避免
});

// 3. 不要忘记检查 null
const item = heap.pop();
item.callback();  // ❌ 可能是 null！

// ✅ 正确：
const item = heap.pop();
if (item) {
  item.callback();
}
```

## 📈 复杂度速查

| 操作 | 时间复杂度 |
|------|-----------|
| push() | O(log n) |
| pop() | O(log n) |
| peek() | O(1) |
| isEmpty | O(1) |
| size | O(1) |

## 🎯 与其他数据结构对比

| 需求 | 最小堆 | 数组排序 | 链表 |
|------|--------|---------|------|
| 插入 | O(log n) | O(n) | O(1) |
| 获取最小值 | O(1) | O(1) | O(n) |
| 删除最小值 | O(log n) | O(n) | O(n) |
| **适用场景** | ✅ 动态优先级 | 静态数据 | 无序数据 |

## 🆘 常见问题

### Q: 为什么需要 id 字段？

A: 保证**稳定排序**。当两个元素的 `sortIndex` 相同时，先插入的先弹出（FIFO）。

### Q: 可以用来排序吗？

A: 可以，但不是最优选择。堆排序的时间复杂度是 O(n log n)，但常数因子较大。如果只需要排序，直接用 `Array.sort()` 更快。

### Q: sortIndex 可以是负数吗？

A: 可以！任何数字都可以，值越小优先级越高。

### Q: 如何实现最大堆？

A: 将 `sortIndex` 取反即可：

```typescript
heap.push({
  id: 1,
  sortIndex: -value, // 取反
});
```

## 📚 延伸阅读

- [React Scheduler 源码分析](https://github.com/facebook/react/blob/main/packages/scheduler)
- [堆数据结构详解](https://en.wikipedia.org/wiki/Heap_(data_structure))
- [优先队列应用](https://en.wikipedia.org/wiki/Priority_queue)

## 🎉 开始使用

运行测试看看实际效果：

```bash
ts-node MinHeap.test.ts
```

你会看到 5 个详细的使用示例！

