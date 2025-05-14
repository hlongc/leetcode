/*
 * @lc app=leetcode.cn id=621 lang=typescript
 *
 * [621] 任务调度器
 *
 * https://leetcode.cn/problems/task-scheduler/description/
 *
 * algorithms
 * Medium (60.43%)
 * Likes:    1318
 * Dislikes: 0
 * Total Accepted:    163.5K
 * Total Submissions: 270.4K
 * Testcase Example:  '["A","A","A","B","B","B"]\n2'
 *
 * 给你一个用字符数组 tasks 表示的 CPU 需要执行的任务列表，用字母 A 到 Z 表示，以及一个冷却时间
 * n。每个周期或时间间隔允许完成一项任务。任务可以按任何顺序完成，但有一个限制：两个 相同种类 的任务之间必须有长度为 n 的冷却时间。
 *
 * 返回完成所有任务所需要的 最短时间间隔 。
 *
 *
 *
 * 示例 1：
 *
 * 输入：tasks = ["A","A","A","B","B","B"], n = 2
 *
 * 输出：8
 *
 * 解释：
 *
 * 在完成任务 A 之后，你必须等待两个间隔。对任务 B 来说也是一样。在第 3 个间隔，A 和 B 都不能完成，所以你需要待命。在第 4
 * 个间隔，由于已经经过了 2 个间隔，你可以再次执行 A 任务。
 *
 *
 *
 * 示例 2：
 *
 *
 * 输入：tasks = ["A","C","A","B","D","B"], n = 1
 *
 * 输出：6
 *
 * 解释：一种可能的序列是：A -> B -> C -> D -> A -> B。
 *
 * 由于冷却间隔为 1，你可以在完成另一个任务后重复执行这个任务。
 *
 *
 * 示例 3：
 *
 * 输入：tasks = ["A","A","A","B","B","B"], n = 3
 *
 * 输出：10
 *
 * 解释：一种可能的序列为：A -> B -> idle -> idle -> A -> B -> idle -> idle -> A -> B。
 *
 * 只有两种任务类型，A 和 B，需要被 3 个间隔分割。这导致重复执行这些任务的间隔当中有两次待命状态。
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= tasks.length <= 10^4
 * tasks[i] 是大写英文字母
 * 0 <= n <= 100
 *
 *
 */

// @lc code=start
/**
 * 任务调度器 - 贪心算法（矩阵思想）
 * @param tasks 任务列表，用字母A-Z表示不同种类的任务
 * @param n 相同任务之间的冷却时间
 * @returns 完成所有任务所需的最短时间
 *
 * 思路：矩阵面积计算方法
 *
 * 1. 我们可以将任务调度想象成一个矩阵：
 *    - 行数：出现次数最多的任务的频率(maxFreq)
 *    - 列数：冷却时间+1 (即n+1，表示每一轮可以安排的任务数)
 *
 * 2. 矩阵排列示意图（假设A任务出现频率最高为maxFreq次）：
 *    A  X  X  X  ...  (列数为n+1)
 *    A  X  X  X  ...
 *    A  X  X  X  ...
 *    ...
 *    A  (最后一行只有出现频率最高的任务)
 *
 * 3. 解释：
 *    - 每行表示一个执行周期，长度为n+1
 *    - X表示可以安排其他任务的位置
 *    - 最后一行特殊，只包含所有出现频率等于maxFreq的任务
 *
 * 4. 矩阵面积计算：
 *    - 前(maxFreq-1)行的面积：(maxFreq-1)*(n+1)
 *    - 最后一行的元素个数：maxFreqCount（频率为maxFreq的任务种类数）
 *    - 总面积(总执行时间)：(maxFreq-1)*(n+1) + maxFreqCount
 *
 * 5. 特殊情况：当任务种类非常多时，可能不需要空闲时间，此时取max(计算面积, 任务总数)
 */
function leastInterval(tasks: string[], n: number): number {
  // 如果没有冷却时间限制，直接返回任务总数
  if (n === 0) {
    return tasks.length;
  }

  // 1. 统计每种任务的出现次数
  const frequencies: Map<string, number> = new Map();
  for (const task of tasks) {
    frequencies.set(task, (frequencies.get(task) || 0) + 1);
  }

  // 2. 找出最大频率及具有最大频率的任务数量
  let maxFrequency = 0; // 矩阵的行数
  let maxFrequencyCount = 0; // 最后一行的元素个数

  for (const count of frequencies.values()) {
    if (count > maxFrequency) {
      maxFrequency = count;
      maxFrequencyCount = 1;
    } else if (count === maxFrequency) {
      maxFrequencyCount++;
    }
  }

  /**
   * 3. 计算矩阵面积（任务执行的最短时间）
   *
   * 矩阵示意图（以示例1为例）：tasks = ["A","A","A","B","B","B"], n = 2
   *
   * A B idle  <- 第1个周期(n+1=3个单位时间)
   * A B idle  <- 第2个周期
   * A B       <- 最后一个周期(只有maxFreqCount=2个任务)
   *
   * 矩阵面积 = (3-1)*(2+1) + 2 = 6 + 2 = 8 个单位时间
   */

  // 计算矩阵的总面积
  // (maxFrequency-1) 表示完整周期的行数
  // (n+1) 表示每行的长度(每个周期的时间单位数)
  // maxFrequencyCount 表示最后一行的元素数(最后一个周期的任务数)
  const matrixArea = (maxFrequency - 1) * (n + 1) + maxFrequencyCount;

  // 4. 返回计算出的矩阵面积与任务总数的较大值
  // 当任务种类非常多时，矩阵可能被完全填满，不需要空闲时间
  return Math.max(matrixArea, tasks.length);
}
// @lc code=end
