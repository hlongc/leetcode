/**
 * 任务分配 - 最短完成时间
 *
 * 题目描述：
 * 有一个需求列表 taskList，数组每一项是该需求需要耗费的天数。
 * 现在有 n 个开发人员，每个开发人员可以同时处理一个任务。
 * 请问该需求列表完成的最短时间是多久？
 *
 * 示例：
 * taskList = [9, 10, 2, 4, 6, 7, 3]
 * n = 3（3个开发人员）
 *
 * 说明：
 * - 数组中的 9 代表该需求需要消耗 1 个开发人员 9 天的时间
 * - 每个开发人员可以依次处理多个任务
 * - 目标是让所有任务完成的总时间最短
 *
 * 输入描述：
 * - taskList: 任务列表，每项表示任务耗时
 * - n: 开发人员数量
 *
 * 输出描述：
 * - 返回完成所有任务的最短时间
 */

/**
 * 解题思路：贪心算法 + 最小堆
 *
 * 核心思想：
 * 1. 每次将新任务分配给当前工作量最少的开发人员
 * 2. 这样可以尽量平衡每个人的工作量，使总时间最短
 * 3. 最终的最短时间 = 工作量最多的那个开发人员的总工作时间
 *
 * 算法流程：
 * 1. 创建一个数组记录每个开发人员的当前工作时间（初始都为0）
 * 2. 对任务列表按耗时从大到小排序（贪心策略：先分配耗时长的任务）
 * 3. 遍历每个任务：
 *    - 找到当前工作时间最少的开发人员
 *    - 将任务分配给他
 *    - 更新他的工作时间
 * 4. 返回所有开发人员中工作时间最长的那个
 *
 * 为什么要先排序？
 * - 先分配耗时长的任务，可以更好地平衡工作量
 * - 避免最后剩下大任务无法合理分配的情况
 *
 * 时间复杂度：O(m*log(m) + m*n)，m 为任务数，n 为开发人员数
 * 空间复杂度：O(n)
 */

/**
 * 方法1：贪心算法（最容易理解）
 * @param taskList 任务列表
 * @param n 开发人员数量
 * @returns 最短完成时间
 */
function minCompletionTime(taskList: number[], n: number): number {
  // 边界检查
  if (taskList.length === 0) return 0;
  if (n <= 0) return Infinity;
  if (n >= taskList.length) {
    // 开发人员数量 >= 任务数量，每人做一个任务
    return Math.max(...taskList);
  }

  // 创建开发人员工作时间数组，初始都为 0
  const developers: number[] = new Array(n).fill(0);

  // 对任务按耗时从大到小排序（贪心策略）
  const sortedTasks = [...taskList].sort((a, b) => b - a);

  // 遍历每个任务，分配给当前工作时间最少的开发人员
  for (const task of sortedTasks) {
    // 找到当前工作时间最少的开发人员
    let minIndex = 0;
    let minTime = developers[0];

    for (let i = 1; i < n; i++) {
      if (developers[i] < minTime) {
        minTime = developers[i];
        minIndex = i;
      }
    }

    // 将任务分配给工作时间最少的开发人员
    developers[minIndex] += task;
  }

  // 返回工作时间最长的开发人员的时间（即完成所有任务的最短时间）
  return Math.max(...developers);
}

/**
 * 方法2：使用最小堆优化（更高效）
 * 时间复杂度：O(m*log(n))，m 为任务数，n 为开发人员数
 */
function minCompletionTimeOptimized(taskList: number[], n: number): number {
  // 边界检查
  if (taskList.length === 0) return 0;
  if (n <= 0) return Infinity;
  if (n >= taskList.length) {
    return Math.max(...taskList);
  }

  // 使用最小堆（优先队列）存储开发人员的工作时间
  // JavaScript 没有内置堆，这里用数组模拟
  const heap: number[] = new Array(n).fill(0);

  // 对任务按耗时从大到小排序
  const sortedTasks = [...taskList].sort((a, b) => b - a);

  // 遍历每个任务
  for (const task of sortedTasks) {
    // 堆顶元素（最小值）加上当前任务时间
    heap[0] += task;

    // 下沉操作，维护最小堆性质
    heapifyDown(heap, 0);
  }

  // 返回堆中的最大值（工作时间最长的开发人员）
  return Math.max(...heap);
}

/**
 * 堆的下沉操作
 */
function heapifyDown(heap: number[], index: number): void {
  const n = heap.length;
  let smallest = index;
  const left = 2 * index + 1;
  const right = 2 * index + 2;

  if (left < n && heap[left] < heap[smallest]) {
    smallest = left;
  }

  if (right < n && heap[right] < heap[smallest]) {
    smallest = right;
  }

  if (smallest !== index) {
    [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
    heapifyDown(heap, smallest);
  }
}

/**
 * 算法图解：
 *
 * 示例：taskList = [9, 10, 2, 4, 6, 7, 3], n = 3
 *
 * 步骤1：排序任务（从大到小）
 * [10, 9, 7, 6, 4, 3, 2]
 *
 * 步骤2：初始化开发人员工作时间
 * 开发人员1: 0
 * 开发人员2: 0
 * 开发人员3: 0
 *
 * 步骤3：依次分配任务
 *
 * 分配任务 10：
 * - 找到工作时间最少的：开发人员1（0天）
 * - 分配给开发人员1
 * 开发人员1: 10 ← 分配了任务10
 * 开发人员2: 0
 * 开发人员3: 0
 *
 * 分配任务 9：
 * - 找到工作时间最少的：开发人员2（0天）
 * - 分配给开发人员2
 * 开发人员1: 10
 * 开发人员2: 9 ← 分配了任务9
 * 开发人员3: 0
 *
 * 分配任务 7：
 * - 找到工作时间最少的：开发人员3（0天）
 * - 分配给开发人员3
 * 开发人员1: 10
 * 开发人员2: 9
 * 开发人员3: 7 ← 分配了任务7
 *
 * 分配任务 6：
 * - 找到工作时间最少的：开发人员3（7天）
 * - 分配给开发人员3
 * 开发人员1: 10
 * 开发人员2: 9
 * 开发人员3: 13 ← 分配了任务6
 *
 * 分配任务 4：
 * - 找到工作时间最少的：开发人员2（9天）
 * - 分配给开发人员2
 * 开发人员1: 10
 * 开发人员2: 13 ← 分配了任务4
 * 开发人员3: 13
 *
 * 分配任务 3：
 * - 找到工作时间最少的：开发人员1（10天）
 * - 分配给开发人员1
 * 开发人员1: 13 ← 分配了任务3
 * 开发人员2: 13
 * 开发人员3: 13
 *
 * 分配任务 2：
 * - 找到工作时间最少的：开发人员1（13天）
 * - 分配给开发人员1
 * 开发人员1: 15 ← 分配了任务2
 * 开发人员2: 13
 * 开发人员3: 13
 *
 * 步骤4：返回最大值
 * 最短完成时间 = max(15, 13, 13) = 15 天
 *
 * 任务分配结果：
 * 开发人员1: [10, 3, 2] = 15天
 * 开发人员2: [9, 4] = 13天
 * 开发人员3: [7, 6] = 13天
 *
 * 时间线图示：
 * 天数: 0    5    10   15
 * 人员1: [---10---][3][2]
 * 人员2: [---9---][--4--]
 * 人员3: [--7--][---6---]
 *                      ↑
 *                   完成时间
 */

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1：基本测试
  console.log("示例1:");
  const taskList1 = [9, 10, 2, 4, 6, 7, 3];
  const n1 = 3;
  console.log(`任务列表: [${taskList1.join(", ")}]`);
  console.log(`开发人员数量: ${n1}`);
  console.log("方法1输出:", minCompletionTime(taskList1, n1));
  console.log("方法2输出:", minCompletionTimeOptimized(taskList1, n1));
  console.log("预期: 15\n");

  // 示例2：开发人员数量 = 任务数量
  console.log("示例2:");
  const taskList2 = [5, 3, 8, 2];
  const n2 = 4;
  console.log(`任务列表: [${taskList2.join(", ")}]`);
  console.log(`开发人员数量: ${n2}`);
  console.log("方法1输出:", minCompletionTime(taskList2, n2));
  console.log("方法2输出:", minCompletionTimeOptimized(taskList2, n2));
  console.log("预期: 8（每人做一个任务，最长的是8）\n");

  // 示例3：只有1个开发人员
  console.log("示例3:");
  const taskList3 = [1, 2, 3, 4, 5];
  const n3 = 1;
  console.log(`任务列表: [${taskList3.join(", ")}]`);
  console.log(`开发人员数量: ${n3}`);
  console.log("方法1输出:", minCompletionTime(taskList3, n3));
  console.log("方法2输出:", minCompletionTimeOptimized(taskList3, n3));
  console.log("预期: 15（1+2+3+4+5）\n");

  // 示例4：开发人员数量 > 任务数量
  console.log("示例4:");
  const taskList4 = [10, 5];
  const n4 = 5;
  console.log(`任务列表: [${taskList4.join(", ")}]`);
  console.log(`开发人员数量: ${n4}`);
  console.log("方法1输出:", minCompletionTime(taskList4, n4));
  console.log("方法2输出:", minCompletionTimeOptimized(taskList4, n4));
  console.log("预期: 10（开发人员多，每人做一个，最长的是10）\n");

  // 示例5：所有任务耗时相同
  console.log("示例5:");
  const taskList5 = [5, 5, 5, 5, 5, 5];
  const n5 = 2;
  console.log(`任务列表: [${taskList5.join(", ")}]`);
  console.log(`开发人员数量: ${n5}`);
  console.log("方法1输出:", minCompletionTime(taskList5, n5));
  console.log("方法2输出:", minCompletionTimeOptimized(taskList5, n5));
  console.log("预期: 15（每人做3个任务，5*3=15）\n");

  console.log("=== 测试结束 ===");
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
}

export { minCompletionTime, minCompletionTimeOptimized };
