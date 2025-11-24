/**
 * 最小堆（Min Heap）实现 - TypeScript 版本
 * 基于 React Scheduler 的实现
 *
 * 最小堆是一种完全二叉树，满足：父节点的值 ≤ 子节点的值
 * 使用数组存储，对于索引 i 的节点：
 * - 父节点：Math.floor((i - 1) / 2)
 * - 左子节点：2 * i + 1
 * - 右子节点：2 * i + 2
 */

/**
 * 堆节点的基本接口
 * 所有存储在堆中的对象必须实现此接口
 */
export interface HeapNode {
  /** 节点唯一标识 */
  id: number;
  /** 排序索引（优先级），值越小优先级越高 */
  sortIndex: number;
}

/**
 * 最小堆类
 * @template T 必须继承 HeapNode 接口
 */
export class MinHeap<T extends HeapNode> {
  /** 使用数组存储堆元素 */
  private heap: T[] = [];

  /**
   * 获取堆的大小
   */
  get size(): number {
    return this.heap.length;
  }

  /**
   * 检查堆是否为空
   */
  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * 获取堆中所有元素（浅拷贝）
   */
  getAll(): T[] {
    return [...this.heap];
  }

  /**
   * 插入新节点到堆中
   * 时间复杂度：O(log n)
   *
   * 算法步骤：
   * 1. 将新节点添加到数组末尾（完全二叉树的最后一个位置）
   * 2. 调用 siftUp 向上调整，维护堆的性质
   *
   * @param node 要插入的节点
   *
   * @example
   * ```ts
   * const heap = new MinHeap<Task>();
   * heap.push({ id: 1, sortIndex: 10 });
   * heap.push({ id: 2, sortIndex: 5 });  // 优先级更高，会上浮到堆顶
   * ```
   */
  push(node: T): void {
    const index = this.heap.length;
    this.heap.push(node);
    this.siftUp(node, index);
  }

  /**
   * 查看堆顶元素（最小值）但不删除
   * 时间复杂度：O(1)
   *
   * @returns 堆顶元素，如果堆为空则返回 null
   *
   * @example
   * ```ts
   * const top = heap.peek();
   * console.log(top?.sortIndex); // 输出最小的 sortIndex
   * ```
   */
  peek(): T | null {
    return this.heap.length === 0 ? null : this.heap[0];
  }

  /**
   * 弹出堆顶元素（最小值）
   * 时间复杂度：O(log n)
   *
   * 算法步骤：
   * 1. 保存堆顶元素（要返回的最小值）
   * 2. 将数组最后一个元素移到堆顶
   * 3. 调用 siftDown 向下调整，恢复堆的性质
   *
   * @returns 堆顶元素，如果堆为空则返回 null
   *
   * @example
   * ```ts
   * const min = heap.pop();  // 获取并移除最小元素
   * ```
   */
  pop(): T | null {
    if (this.heap.length === 0) {
      return null;
    }

    const first = this.heap[0];
    const last = this.heap.pop();

    // 如果堆中还有其他元素（last !== first）
    if (last !== undefined && last !== first) {
      // 将最后一个元素放到堆顶
      this.heap[0] = last;
      // 向下调整维护堆性质
      this.siftDown(last, 0);
    }

    return first;
  }

  /**
   * 上浮操作（Sift Up / Bubble Up）
   * 将节点向上移动，直到满足堆的性质
   *
   * 算法：不断与父节点比较，如果当前节点更小则交换
   *
   * @param node 要上浮的节点
   * @param i 节点当前索引
   *
   * @example
   * 可视化过程：
   * ```
   * 插入节点 2：
   *        5              5              2
   *       / \            / \            / \
   *      7   8    →     7   2    →     7   5
   *     /              /                /
   *    2              8                8
   *   插入          上浮1次          上浮2次（完成）
   * ```
   */
  private siftUp(node: T, i: number): void {
    let index = i;

    while (index > 0) {
      // 计算父节点索引：(index - 1) >>> 1
      // >>> 1 是无符号右移1位，相当于 Math.floor((index - 1) / 2)
      // 使用位运算性能更好
      const parentIndex = (index - 1) >>> 1;
      const parent = this.heap[parentIndex];

      // 比较当前节点和父节点
      if (this.compare(parent, node) > 0) {
        // 父节点更大，需要交换
        this.heap[parentIndex] = node;
        this.heap[index] = parent;
        // 继续向上检查
        index = parentIndex;
      } else {
        // 父节点更小或相等，堆性质已满足，停止
        return;
      }
    }
  }

  /**
   * 下沉操作（Sift Down / Bubble Down）
   * 将节点向下移动，直到满足堆的性质
   *
   * 算法：不断与子节点比较，如果子节点更小则交换
   *
   * @param node 要下沉的节点
   * @param i 节点当前索引
   *
   * @example
   * 可视化过程：
   * ```
   * 删除堆顶后，将末尾节点 10 移到堆顶：
   *       10             2              2
   *       / \           / \            / \
   *      2   5    →    10  5    →     7   5
   *     / \           / \            / \
   *    9   7         9   7          9  10
   *   初始         下沉1次        下沉2次（完成）
   * ```
   */
  private siftDown(node: T, i: number): void {
    let index = i;
    const length = this.heap.length;
    // 只需要检查到一半，因为后半部分都是叶子节点
    // >>> 1 相当于除以 2 向下取整
    const halfLength = length >>> 1;

    while (index < halfLength) {
      // 计算左右子节点的索引
      // 左子节点：(index + 1) * 2 - 1 = index * 2 + 1
      const leftIndex = (index + 1) * 2 - 1;
      const left = this.heap[leftIndex];

      // 右子节点：leftIndex + 1 = index * 2 + 2
      const rightIndex = leftIndex + 1;
      const right = this.heap[rightIndex];

      // 找出父节点、左子节点、右子节点中的最小值
      // 策略：先比较左子节点和父节点
      if (this.compare(left, node) < 0) {
        // 左子节点更小，需要考虑交换
        // 但还要检查右子节点是否更小
        if (rightIndex < length && this.compare(right, left) < 0) {
          // 右子节点存在且比左子节点更小
          // 与右子节点交换
          this.heap[index] = right;
          this.heap[rightIndex] = node;
          index = rightIndex;
        } else {
          // 左子节点最小，与左子节点交换
          this.heap[index] = left;
          this.heap[leftIndex] = node;
          index = leftIndex;
        }
      } else if (rightIndex < length && this.compare(right, node) < 0) {
        // 左子节点不小于父节点，但右子节点小于父节点
        // 与右子节点交换
        this.heap[index] = right;
        this.heap[rightIndex] = node;
        index = rightIndex;
      } else {
        // 父节点最小，堆性质已满足，停止
        return;
      }
    }
  }

  /**
   * 比较两个节点的大小
   *
   * 比较规则：
   * 1. 首先比较 sortIndex（优先级）
   * 2. 如果 sortIndex 相同，则比较 id（保证稳定排序，FIFO）
   *
   * @param a 节点 A
   * @param b 节点 B
   * @returns
   * - 负数：a < b（a 优先级更高）
   * - 0：a = b（优先级相同）
   * - 正数：a > b（b 优先级更高）
   *
   * @example
   * ```ts
   * // sortIndex 不同
   * compare({id: 1, sortIndex: 5}, {id: 2, sortIndex: 10})  // -5 (第一个优先)
   *
   * // sortIndex 相同，比较 id（先来先服务）
   * compare({id: 1, sortIndex: 5}, {id: 2, sortIndex: 5})   // -1 (第一个优先)
   * ```
   */
  private compare(a: HeapNode, b: HeapNode): number {
    // 先比较排序索引（优先级）
    const diff = a.sortIndex - b.sortIndex;
    // 如果优先级不同，返回差值
    // 如果优先级相同，比较 id 保证稳定排序
    return diff !== 0 ? diff : a.id - b.id;
  }

  /**
   * 清空堆
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * 转换为数组（调试用）
   * 按照堆的数组表示返回
   */
  toArray(): T[] {
    return [...this.heap];
  }

  /**
   * 打印堆结构（调试用）
   * 以树形结构打印堆
   */
  print(): void {
    if (this.heap.length === 0) {
      console.log("Empty heap");
      return;
    }

    console.log("\nMin Heap Structure:");
    console.log("===================");

    let level = 0;
    let levelSize = 1;
    let index = 0;

    while (index < this.heap.length) {
      const levelNodes: string[] = [];
      const levelEnd = Math.min(index + levelSize, this.heap.length);

      for (let i = index; i < levelEnd; i++) {
        const node = this.heap[i];
        levelNodes.push(`[id:${node.id}, sort:${node.sortIndex}]`);
      }

      console.log(`Level ${level}: ${levelNodes.join(" ")}`);

      index = levelEnd;
      levelSize *= 2;
      level++;
    }
    console.log("===================\n");
  }

  /**
   * 验证堆的正确性（调试用）
   * 检查是否满足最小堆的性质
   *
   * @returns true 如果堆是有效的
   */
  validate(): boolean {
    for (let i = 0; i < this.heap.length; i++) {
      const leftIndex = 2 * i + 1;
      const rightIndex = 2 * i + 2;

      // 检查左子节点
      if (leftIndex < this.heap.length) {
        if (this.compare(this.heap[i], this.heap[leftIndex]) > 0) {
          console.error(`Invalid heap: parent ${i} > left child ${leftIndex}`);
          return false;
        }
      }

      // 检查右子节点
      if (rightIndex < this.heap.length) {
        if (this.compare(this.heap[i], this.heap[rightIndex]) > 0) {
          console.error(
            `Invalid heap: parent ${i} > right child ${rightIndex}`
          );
          return false;
        }
      }
    }

    return true;
  }
}

// ============================================================================
// 使用示例和测试
// ============================================================================

/**
 * 任务接口示例（模拟 React Scheduler 的 Task）
 */
interface Task extends HeapNode {
  id: number;
  sortIndex: number;
  name: string;
  expirationTime: number;
}

/**
 * 测试函数
 */
function testMinHeap() {
  console.log("🧪 开始测试最小堆...\n");

  const heap = new MinHeap<Task>();

  // 测试 1：插入元素
  console.log("📝 测试 1: 插入元素");
  const tasks: Task[] = [
    { id: 1, sortIndex: 100, name: "Task-Low", expirationTime: 100 },
    { id: 2, sortIndex: 50, name: "Task-High", expirationTime: 50 },
    { id: 3, sortIndex: 75, name: "Task-Medium", expirationTime: 75 },
    { id: 4, sortIndex: 25, name: "Task-Urgent", expirationTime: 25 },
    { id: 5, sortIndex: 50, name: "Task-High2", expirationTime: 50 },
  ];

  tasks.forEach((task) => {
    console.log(`  插入: ${task.name} (sortIndex: ${task.sortIndex})`);
    heap.push(task);
  });

  heap.print();
  console.log(`✅ 堆大小: ${heap.size}`);
  console.log(`✅ 堆有效性: ${heap.validate()}\n`);

  // 测试 2：查看堆顶
  console.log("📝 测试 2: 查看堆顶");
  const top = heap.peek();
  console.log(`  堆顶元素: ${top?.name} (sortIndex: ${top?.sortIndex})`);
  console.log(`  堆大小: ${heap.size} (peek 不改变大小)\n`);

  // 测试 3：弹出元素（按优先级顺序）
  console.log("📝 测试 3: 按优先级弹出元素");
  const results: Task[] = [];
  while (!heap.isEmpty) {
    const task = heap.pop();
    if (task) {
      results.push(task);
      console.log(
        `  弹出: ${task.name} (sortIndex: ${task.sortIndex}, id: ${task.id})`
      );
    }
  }

  // 验证顺序
  console.log("\n✅ 验证弹出顺序:");
  let isCorrect = true;
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1];
    const curr = results[i];
    if (
      prev.sortIndex > curr.sortIndex ||
      (prev.sortIndex === curr.sortIndex && prev.id > curr.id)
    ) {
      isCorrect = false;
      console.log(`  ❌ 顺序错误: ${prev.name} → ${curr.name}`);
    }
  }
  if (isCorrect) {
    console.log("  ✅ 所有元素按优先级正确排序");
  }

  // 测试 4：性能测试
  console.log("\n📝 测试 4: 性能测试");
  const largeHeap = new MinHeap<Task>();
  const count = 10000;

  console.time("  插入 10000 个元素");
  for (let i = 0; i < count; i++) {
    largeHeap.push({
      id: i,
      sortIndex: Math.floor(Math.random() * 10000),
      name: `Task-${i}`,
      expirationTime: 0,
    });
  }
  console.timeEnd("  插入 10000 个元素");

  console.time("  弹出 10000 个元素");
  while (!largeHeap.isEmpty) {
    largeHeap.pop();
  }
  console.timeEnd("  弹出 10000 个元素");

  console.log("\n🎉 所有测试完成！");
}

// 导出
export default MinHeap;
