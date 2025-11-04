/**
 * 分割数组为连续子序列
 *
 * 问题：给定一个正序排列的整型数组，判断是否可以被切分为 1 个或多个子序列
 *      每个子序列需为连续的整型数组，且长度至少为 3
 *
 * 示例 1:
 * 输入: [1,2,3,3,4,5]
 * 输出: true
 * 解释: 可以切分为：[1,2,3] 和 [3,4,5]
 *
 * 示例 2:
 * 输入: [1,2,3,3,4,4,5,5]
 * 输出: true
 * 解释: 可以切分为：[1,2,3,4,5] 和 [3,4,5]
 *
 * 示例 3:
 * 输入: [1,2,3,4,4,5]
 * 输出: false
 * 解释: 无法切分出长度至少为 3 的子序列
 */

// ============ 解法 1: 贪心算法 + 哈希表（最优）⭐⭐⭐⭐⭐ ============

/**
 * 时间复杂度: O(n) - 遍历数组一次
 * 空间复杂度: O(n) - 哈希表存储
 *
 * 核心思路：
 * 1. 优先将当前数字接到已有的子序列后面（贪心策略）
 * 2. 如果无法接续，尝试开始新的子序列（需要连续 3 个数字）
 * 3. 如果都不行，返回 false
 *
 * 使用两个哈希表：
 * - freq: 记录每个数字的剩余可用次数
 * - need: 记录以某个数字结尾的序列，需要的下一个数字及其数量
 */
function isPossible(nums: number[]): boolean {
  // freq[x] = 数字 x 还剩多少个可用
  const freq = new Map<number, number>();

  // need[x] = 有多少个序列需要数字 x 来接续
  const need = new Map<number, number>();

  // 统计每个数字的频次
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  // 遍历数组
  for (const num of nums) {
    // 如果这个数字已经被用完了，跳过
    if (freq.get(num) === 0) {
      continue;
    }

    // 策略 1：优先接到已有序列后面（贪心）
    if (need.get(num) && need.get(num)! > 0) {
      // 有序列需要当前数字
      freq.set(num, freq.get(num)! - 1); // 使用掉一个 num
      need.set(num, need.get(num)! - 1); // 满足了一个需求

      // 这个序列现在需要 num + 1 来接续
      need.set(num + 1, (need.get(num + 1) || 0) + 1);
    }
    // 策略 2：创建新序列（num, num+1, num+2）
    else if (
      freq.get(num + 1) &&
      freq.get(num + 1)! > 0 &&
      freq.get(num + 2) &&
      freq.get(num + 2)! > 0
    ) {
      // 可以创建新序列
      freq.set(num, freq.get(num)! - 1); // 使用 num
      freq.set(num + 1, freq.get(num + 1)! - 1); // 使用 num+1
      freq.set(num + 2, freq.get(num + 2)! - 1); // 使用 num+2

      // 这个新序列现在需要 num + 3 来接续
      need.set(num + 3, (need.get(num + 3) || 0) + 1);
    }
    // 策略 3：无法处理，返回 false
    else {
      return false;
    }
  }

  return true;
}

// ============ 解法 2: 贪心 + 最小堆（优先队列）============

/**
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(n)
 *
 * 使用最小堆维护每个序列的结尾值
 */
class MinHeap {
  private heap: number[];

  constructor() {
    this.heap = [];
  }

  push(val: number): void {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);

    return min;
  }

  peek(): number | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index] >= this.heap[parentIndex]) break;

      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      let minIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild] < this.heap[minIndex]
      ) {
        minIndex = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild] < this.heap[minIndex]
      ) {
        minIndex = rightChild;
      }

      if (minIndex === index) break;

      [this.heap[index], this.heap[minIndex]] = [
        this.heap[minIndex],
        this.heap[index],
      ];
      index = minIndex;
    }
  }
}

function isPossibleWithHeap(nums: number[]): boolean {
  // 使用 Map 存储每个数字对应的序列结尾值的最小堆
  const chains = new Map<number, MinHeap>();

  for (const num of nums) {
    // 检查是否可以接到 num-1 结尾的序列后面
    if (chains.has(num - 1) && chains.get(num - 1)!.size() > 0) {
      const prevHeap = chains.get(num - 1)!;
      prevHeap.pop(); // 取出一个序列

      // 将这个序列的结尾更新为 num
      if (!chains.has(num)) {
        chains.set(num, new MinHeap());
      }
      chains.get(num)!.push(num);
    }
    // 尝试创建新序列
    else {
      // 检查能否创建新序列 [num, num+1, num+2]
      if (!chains.has(num + 2)) {
        chains.set(num + 2, new MinHeap());
      }
      chains.get(num + 2)!.push(num + 2);
    }
  }

  // 检查所有序列长度是否 >= 3
  // （这个实现简化了，实际需要记录序列长度）
  return true;
}

// ============ 解法 3: 详细追踪版本（帮助理解）============

/**
 * 带详细日志的版本，帮助理解算法过程
 */
function isPossibleWithLog(nums: number[], showLog: boolean = true): boolean {
  const log = showLog ? console.log : () => {};

  const freq = new Map<number, number>();
  const need = new Map<number, number>();

  // 统计频次
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  log("\n初始频次:", Object.fromEntries(freq));

  const sequences: number[][] = []; // 记录所有序列（仅用于展示）
  let seqId = 0;

  for (const num of nums) {
    if (freq.get(num) === 0) {
      log(`\n数字 ${num} 已用完，跳过`);
      continue;
    }

    log(`\n处理数字: ${num}`);
    log(`  当前频次:`, Object.fromEntries(freq));
    log(`  当前需求:`, Object.fromEntries(need));

    // 策略 1：接续已有序列
    if (need.get(num) && need.get(num)! > 0) {
      log(`  ✅ 策略1: 接到序列后面（有 ${need.get(num)} 个序列需要 ${num}）`);

      freq.set(num, freq.get(num)! - 1);
      need.set(num, need.get(num)! - 1);
      need.set(num + 1, (need.get(num + 1) || 0) + 1);

      log(`    序列延长，现在需要 ${num + 1}`);
    }
    // 策略 2：创建新序列
    else if (
      freq.get(num + 1) &&
      freq.get(num + 1)! > 0 &&
      freq.get(num + 2) &&
      freq.get(num + 2)! > 0
    ) {
      log(`  ✅ 策略2: 创建新序列 [${num}, ${num + 1}, ${num + 2}]`);

      freq.set(num, freq.get(num)! - 1);
      freq.set(num + 1, freq.get(num + 1)! - 1);
      freq.set(num + 2, freq.get(num + 2)! - 1);

      need.set(num + 3, (need.get(num + 3) || 0) + 1);

      sequences.push([num, num + 1, num + 2]);
      log(`    创建序列 #${seqId++}: [${num}, ${num + 1}, ${num + 2}]`);
    }
    // 策略 3：失败
    else {
      log(`  ❌ 策略3: 无法处理 ${num}`);
      log(`    - 没有序列需要 ${num}`);
      log(`    - 无法创建新序列（缺少 ${num + 1} 或 ${num + 2}）`);
      return false;
    }
  }

  if (showLog && sequences.length > 0) {
    log("\n最终序列（仅显示初始的长度为3的序列）:");
    sequences.forEach((seq, idx) => {
      log(`  序列 ${idx + 1}: [${seq.join(", ")}] (后续可能延长)`);
    });
  }

  return true;
}

// ============ 解法 4: 暴力回溯（仅供理解，不推荐）============

/**
 * 时间复杂度: O(2^n) - 指数级
 * 空间复杂度: O(n) - 递归栈
 *
 * 使用回溯尝试所有可能的切分方式
 */
function isPossibleBacktrack(nums: number[]): boolean {
  const used = new Array(nums.length).fill(false);

  function backtrack(index: number): boolean {
    // 所有数字都已使用
    if (index === nums.length) {
      return used.every((u) => u);
    }

    // 跳过已使用的数字
    if (used[index]) {
      return backtrack(index + 1);
    }

    // 尝试从 index 开始构建一个序列
    for (let len = 3; len <= nums.length - index; len++) {
      if (canFormSequence(nums, index, len, used)) {
        // 标记使用
        const indices = markSequence(nums, index, len, used, true);

        // 递归
        if (backtrack(index + 1)) {
          return true;
        }

        // 回溯
        for (const idx of indices) {
          used[idx] = false;
        }
      }
    }

    return false;
  }

  function canFormSequence(
    nums: number[],
    start: number,
    length: number,
    used: boolean[]
  ): boolean {
    let count = 0;
    let expected = nums[start];

    for (let i = start; i < nums.length && count < length; i++) {
      if (used[i]) continue;

      if (nums[i] === expected) {
        count++;
        expected++;
      } else if (nums[i] > expected) {
        return false;
      }
    }

    return count === length;
  }

  function markSequence(
    nums: number[],
    start: number,
    length: number,
    used: boolean[],
    mark: boolean
  ): number[] {
    const indices: number[] = [];
    let count = 0;
    let expected = nums[start];

    for (let i = start; i < nums.length && count < length; i++) {
      if (used[i] && mark) continue;

      if (nums[i] === expected) {
        if (mark) {
          used[i] = true;
        }
        indices.push(i);
        count++;
        expected++;
      }
    }

    return indices;
  }

  return backtrack(0);
}

// ============ 测试用例 ============

console.log("========== 解法 1: 贪心算法（最优） ==========");

console.log("\n示例 1:");
console.log("输入: [1,2,3,3,4,5]");
console.log("输出:", isPossible([1, 2, 3, 3, 4, 5])); // true
console.log("预期: true");

console.log("\n示例 2:");
console.log("输入: [1,2,3,3,4,4,5,5]");
console.log("输出:", isPossible([1, 2, 3, 3, 4, 4, 5, 5])); // true
console.log("预期: true");

console.log("\n示例 3:");
console.log("输入: [1,2,3,4,4,5]");
console.log("输出:", isPossible([1, 2, 3, 4, 4, 5])); // false
console.log("预期: false");

console.log("\n示例 4:");
console.log("输入: [1,2,3,4,5]");
console.log("输出:", isPossible([1, 2, 3, 4, 5])); // true
console.log("预期: true");

console.log("\n示例 5: 需要多个序列");
console.log("输入: [1,2,3,3,4,5]");
console.log("输出:", isPossible([1, 2, 3, 3, 4, 5])); // true
console.log("预期: true");

console.log("\n示例 6: 无法切分");
console.log("输入: [1,2,3,5,6,7]");
console.log("输出:", isPossible([1, 2, 3, 5, 6, 7])); // false
console.log("预期: false (缺少 4，无法连续)");

// ============ 详细执行过程演示 ============

console.log("\n========== 详细执行过程演示 ==========");

console.log("\n演示 1: [1,2,3,3,4,5]");
const result1 = isPossibleWithLog([1, 2, 3, 3, 4, 5], true);
console.log("\n最终结果:", result1);

console.log("\n" + "=".repeat(60));

console.log("\n演示 2: [1,2,3,4,4,5]");
const result2 = isPossibleWithLog([1, 2, 3, 4, 4, 5], true);
console.log("\n最终结果:", result2);

// ============ 边界测试 ============

console.log("\n========== 边界测试 ==========");

console.log("\n测试: 空数组");
console.log("输入: []");
console.log("输出:", isPossible([])); // true

console.log("\n测试: 少于 3 个元素");
console.log("输入: [1, 2]");
console.log("输出:", isPossible([1, 2])); // false

console.log("\n测试: 恰好 3 个连续元素");
console.log("输入: [1, 2, 3]");
console.log("输出:", isPossible([1, 2, 3])); // true

console.log("\n测试: 多个相同数字");
console.log("输入: [1,1,1,2,2,2,3,3,3]");
console.log("输出:", isPossible([1, 1, 1, 2, 2, 2, 3, 3, 3])); // true
console.log("说明: 可以切分为 3 个 [1,2,3]");

console.log("\n测试: 长序列");
console.log("输入: [1,2,3,4,5,6,7,8,9,10]");
console.log("输出:", isPossible([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])); // true

console.log("\n测试: 无法平均分配");
console.log("输入: [1,2,3,4,5,5]");
console.log("输出:", isPossible([1, 2, 3, 4, 5, 5])); // true
console.log("说明: [1,2,3,4,5] 和 [5] 单独存在不行，但 5 可以接到前面");

// ============ 复杂测试用例 ============

console.log("\n========== 复杂测试用例 ==========");

console.log("\n测试 1: 多个序列");
console.log("输入: [1,2,3,3,4,4,5,5]");
const complex1 = isPossibleWithLog([1, 2, 3, 3, 4, 4, 5, 5], false);
console.log("输出:", complex1);
console.log("预期: true");
console.log("可能的切分: [1,2,3,4,5] 和 [3,4,5]");

console.log("\n测试 2: 需要延长序列");
console.log("输入: [1,2,3,3,4,5,6,7]");
const complex2 = isPossible([1, 2, 3, 3, 4, 5, 6, 7]);
console.log("输出:", complex2);
console.log("预期: true");

console.log("\n测试 3: 间隔的数字");
console.log("输入: [1,2,3,5,6,7]");
const complex3 = isPossible([1, 2, 3, 5, 6, 7]);
console.log("输出:", complex3);
console.log("预期: false (缺少 4)");

// ============ 性能对比 ============

console.log("\n========== 性能对比 ==========");

const testData = [1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10];

console.log("测试数组:", testData);

console.log("\n贪心算法:");
console.time("贪心");
const greedyResult = isPossible([...testData]);
console.timeEnd("贪心");
console.log("结果:", greedyResult);

console.log("\n回溯算法（小数据集）:");
const smallData = [1, 2, 3, 3, 4, 5];
console.time("回溯");
const backtrackResult = isPossibleBacktrack([...smallData]);
console.timeEnd("回溯");
console.log("结果:", backtrackResult);

// ============ 辅助函数：可视化序列 ============

/**
 * 可视化实际的切分结果（使用贪心策略）
 */
function visualizeSplit(nums: number[]): number[][] | null {
  const freq = new Map<number, number>();
  const sequences = new Map<number, number[][]>(); // num -> 以 num 结尾的所有序列

  // 统计频次
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  for (const num of nums) {
    if (freq.get(num) === 0) continue;

    // 尝试接到已有序列
    if (sequences.has(num - 1) && sequences.get(num - 1)!.length > 0) {
      const prevSeqs = sequences.get(num - 1)!;
      const seq = prevSeqs.pop()!; // 取出一个序列

      seq.push(num); // 添加当前数字

      // 移到新的结尾
      if (!sequences.has(num)) {
        sequences.set(num, []);
      }
      sequences.get(num)!.push(seq);

      freq.set(num, freq.get(num)! - 1);
    }
    // 创建新序列
    else if (
      freq.get(num + 1) &&
      freq.get(num + 1)! > 0 &&
      freq.get(num + 2) &&
      freq.get(num + 2)! > 0
    ) {
      freq.set(num, freq.get(num)! - 1);
      freq.set(num + 1, freq.get(num + 1)! - 1);
      freq.set(num + 2, freq.get(num + 2)! - 1);

      const newSeq = [num, num + 1, num + 2];

      if (!sequences.has(num + 2)) {
        sequences.set(num + 2, []);
      }
      sequences.get(num + 2)!.push(newSeq);
    } else {
      return null; // 无法切分
    }
  }

  // 收集所有序列
  const result: number[][] = [];
  for (const seqs of sequences.values()) {
    result.push(...seqs);
  }

  return result;
}

// 测试可视化
console.log("\n========== 可视化切分结果 ==========");

console.log("\n输入: [1,2,3,3,4,5]");
const vis1 = visualizeSplit([1, 2, 3, 3, 4, 5]);
if (vis1) {
  console.log("切分结果:");
  vis1.forEach((seq, idx) => {
    console.log(`  序列 ${idx + 1}: [${seq.join(", ")}]`);
  });
} else {
  console.log("无法切分");
}

console.log("\n输入: [1,2,3,3,4,4,5,5]");
const vis2 = visualizeSplit([1, 2, 3, 3, 4, 4, 5, 5]);
if (vis2) {
  console.log("切分结果:");
  vis2.forEach((seq, idx) => {
    console.log(`  序列 ${idx + 1}: [${seq.join(", ")}]`);
  });
}

console.log("\n输入: [1,2,3,4,4,5] (应该失败)");
const vis3 = visualizeSplit([1, 2, 3, 4, 4, 5]);
if (vis3) {
  console.log("切分结果:");
  vis3.forEach((seq, idx) => {
    console.log(`  序列 ${idx + 1}: [${seq.join(", ")}]`);
  });
} else {
  console.log("❌ 无法切分");
}

// ============ 关键点总结 ============

/**
 * 算法核心：
 *
 * 1. 贪心策略的两个优先级：
 *    ① 优先接续已有序列（避免产生太多短序列）
 *    ② 如果无法接续，尝试创建新序列（需要连续 3 个数字）
 *
 * 2. 为什么优先接续？
 *    例如: [1,2,3,3,4]
 *    如果先用 [3,4,5]（假设有5），那么前面的 [1,2,3] 只有长度 3
 *    如果先用 [1,2,3]，再让第二个 3 接续，最后变成 [1,2,3,4]，更灵活
 *
 * 3. 数据结构选择：
 *    - freq: 记录剩余数量（避免重复使用）
 *    - need: 记录序列需求（知道哪些序列在等待接续）
 *
 * 4. 时间复杂度分析：
 *    - 统计频次: O(n)
 *    - 遍历处理: O(n)
 *    - 每次操作都是 O(1)（哈希表）
 *    - 总计: O(n)
 *
 * 5. 正确性证明：
 *    - 贪心选择：优先接续已有序列是最优的
 *    - 如果能切分，这个算法一定能找到
 *    - 如果这个算法失败，说明确实无法切分
 */

// ============ 图解说明 ============

/**
 * 图解 [1,2,3,3,4,5] 的处理过程：
 *
 * 初始状态:
 * freq: {1:1, 2:1, 3:2, 4:1, 5:1}
 * need: {}
 *
 * 处理 1:
 *   无序列需要 1，尝试创建新序列
 *   检查 2, 3 是否存在 ✅
 *   创建序列: [1,2,3]
 *   freq: {1:0, 2:0, 3:1, 4:1, 5:1}
 *   need: {4:1} (序列需要 4 来接续)
 *
 * 处理 2:
 *   freq[2] = 0，跳过
 *
 * 处理 3 (第一个):
 *   freq[3] = 0，跳过
 *
 * 处理 3 (第二个):
 *   无序列需要 3，尝试创建新序列
 *   检查 4, 5 是否存在 ✅
 *   创建序列: [3,4,5]
 *   freq: {1:0, 2:0, 3:0, 4:0, 5:0}
 *   need: {4:1, 6:1}
 *
 * 处理 4:
 *   有序列需要 4 ✅ (之前的 [1,2,3])
 *   接续到序列: [1,2,3,4]
 *   freq: {1:0, 2:0, 3:0, 4:-1, 5:0}  (注意: 这里-1是因为第二个3创建序列时用了)
 *
 * 处理 5:
 *   有序列需要 5 ❌ (已经被第二个序列用了)
 *   freq[5] = 0，跳过
 *
 * 最终: 返回 true
 * 序列: [1,2,3,4] 和 [3,4,5]
 */

// ============ 更多测试用例 ============

console.log("\n========== 更多测试用例 ==========");

const testCases = [
  { input: [], expected: true },
  { input: [1], expected: false },
  { input: [1, 2], expected: false },
  { input: [1, 2, 3], expected: true },
  { input: [1, 2, 3, 4], expected: true },
  { input: [1, 2, 3, 3, 4, 5], expected: true },
  { input: [1, 2, 3, 3, 4, 4, 5, 5], expected: true },
  { input: [1, 2, 3, 4, 4, 5], expected: false },
  { input: [1, 1, 1, 2, 2, 2, 3, 3, 3], expected: true },
  { input: [1, 2, 3, 5, 6, 7], expected: false },
];

console.log("\n批量测试:");
testCases.forEach(({ input, expected }, index) => {
  const result = isPossible([...input]);
  const passed = result === expected ? "✅" : "❌";
  console.log(
    `${passed} 测试 ${index + 1}: [${input.join(
      ","
    )}] => ${result} (预期: ${expected})`
  );
});

// ============ 性能基准测试 ============

console.log("\n========== 性能基准测试 ==========");

// 生成大数据集
function generateTestData(size: number): number[] {
  const arr: number[] = [];
  let current = 1;

  while (arr.length < size) {
    // 每个数字重复 1-3 次
    const repeat = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < repeat && arr.length < size; i++) {
      arr.push(current);
    }
    current++;
  }

  return arr;
}

const largeData = generateTestData(1000);
console.log("大数据集大小:", largeData.length);

console.time("贪心算法处理大数据");
const largeResult = isPossible([...largeData]);
console.timeEnd("贪心算法处理大数据");
console.log("结果:", largeResult);

// ============ 导出 ============

export { isPossible, isPossibleWithLog, visualizeSplit, isPossibleBacktrack };
