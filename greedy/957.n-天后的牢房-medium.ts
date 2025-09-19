/*
 * @lc app=leetcode.cn id=957 lang=typescript
 *
 * [957] N 天后的牢房
 *
 * https://leetcode.cn/problems/prison-cells-after-n-days/description/
 *
 * algorithms
 * Medium (38.12%)
 * Likes:    161
 * Dislikes: 0
 * Total Accepted:    22.2K
 * Total Submissions: 58.1K
 * Testcase Example:  '[0,1,0,1,1,0,0,1]\n7'
 *
 * 监狱中 8 间牢房排成一排，每间牢房可能被占用或空置。
 *
 * 每天，无论牢房是被占用或空置，都会根据以下规则进行变更：
 *
 *
 * 如果一间牢房的两个相邻的房间都被占用或都是空的，那么该牢房就会被占用。
 * 否则，它就会被空置。
 *
 *
 * 注意：由于监狱中的牢房排成一行，所以行中的第一个和最后一个牢房不存在两个相邻的房间。
 *
 * 给你一个整数数组 cells ，用于表示牢房的初始状态：如果第 i 间牢房被占用，则 cell[i]==1，否则 cell[i]==0 。另给你一个整数
 * n 。
 *
 * 请你返回 n 天后监狱的状况（即，按上文描述进行 n 次变更）。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：cells = [0,1,0,1,1,0,0,1], n = 7
 * 输出：[0,0,1,1,0,0,0,0]
 * 解释：下表总结了监狱每天的状况：
 * Day 0: [0, 1, 0, 1, 1, 0, 0, 1]
 * Day 1: [0, 1, 1, 0, 0, 0, 0, 0]
 * Day 2: [0, 0, 0, 0, 1, 1, 1, 0]
 * Day 3: [0, 1, 1, 0, 0, 1, 0, 0]
 * Day 4: [0, 0, 0, 0, 0, 1, 0, 0]
 * Day 5: [0, 1, 1, 1, 0, 1, 0, 0]
 * Day 6: [0, 0, 1, 0, 1, 1, 0, 0]
 * Day 7: [0, 0, 1, 1, 0, 0, 0, 0]
 *
 *
 * 示例 2：
 *
 *
 * 输入：cells = [1,0,0,1,0,0,1,0], n = 1000000000
 * 输出：[0,0,1,1,1,1,1,0]
 *
 *
 *
 *
 * 提示：
 *
 *
 * cells.length == 8
 * cells[i] 为 0 或 1
 * 1 <= n <= 10^9
 *
 *
 */

// @lc code=start
/**
 * 计算N天后牢房的状态
 *
 * 关键思路：
 * 1. 由于只有8个牢房，状态数量是有限的(最多2^8=256种状态)
 * 2. 由于变化规则，第一个和最后一个牢房在第一天后必定为0
 * 3. 所以实际上只有中间6个牢房的变化，最多有2^6=64种可能的状态
 * 4. 状态会循环出现，我们需要找到这个循环周期
 *
 * 算法步骤：
 * 1. 使用哈希表记录已经出现过的状态及其对应的天数
 * 2. 模拟每天的状态变化
 * 3. 当发现状态重复时，计算循环周期
 * 4. 利用循环周期直接计算n天后的状态
 *
 * @param cells 初始的牢房状态数组
 * @param n 天数
 * @returns n天后的牢房状态
 */
function prisonAfterNDays1(cells: number[], n: number): number[] {
  // 如果天数为0，直接返回初始状态
  if (n === 0) return cells;

  // 存储已经出现过的状态及对应的天数
  const seen: Map<string, number> = new Map();

  // 当前状态
  let state = [...cells];

  // 模拟n天的变化
  for (let day = 1; day <= n; day++) {
    // 计算下一天的状态
    const nextState = new Array(8).fill(0);

    // 应用牢房变化规则
    for (let i = 1; i <= 6; i++) {
      // 如果相邻两个牢房状态相同(同为0或同为1)，则该牢房变为1，否则变为0
      nextState[i] = state[i - 1] === state[i + 1] ? 1 : 0;
    }

    // 两端的牢房特殊处理：永远没有两个相邻的牢房
    // 题目描述中说明第一个和最后一个牢房不存在两个相邻的房间
    // 因此第一天后这两个位置必定是0
    nextState[0] = 0;
    nextState[7] = 0;

    // 更新当前状态
    state = nextState;

    // 将当前状态转换为字符串用于哈希表存储
    const stateKey = state.join("");

    // 检查是否出现循环
    if (seen.has(stateKey)) {
      const cycleStart = seen.get(stateKey)!;
      const cycleLength = day - cycleStart;

      // 计算n天后的状态在循环中的位置
      // (n - day) 表示还剩余多少天
      // (n - day) % cycleLength 表示剩余天数在循环中的偏移
      // cycleStart + ((n - day) % cycleLength) 表示最终状态对应的天数
      const remainingDays = (n - day) % cycleLength;

      // 如果正好是循环的整数倍，那么当前状态就是答案
      if (remainingDays === 0) {
        return state;
      }

      // 否则需要继续模拟remainingDays天
      // 我们可以直接跳到相应天数的状态
      // 由于我们知道第cycleStart天开始形成循环，循环长度为cycleLength
      // 所以第(cycleStart + remainingDays)天的状态就是n天后的状态

      // 重置模拟，从cycleStart开始
      state = [...cells]; // 重置为初始状态
      for (let i = 0; i < cycleStart + remainingDays; i++) {
        const nextDay = new Array(8).fill(0);
        for (let j = 1; j <= 6; j++) {
          nextDay[j] = state[j - 1] === state[j + 1] ? 1 : 0;
        }
        state = nextDay;
      }

      return state;
    }

    // 记录当前状态出现的天数
    seen.set(stateKey, day);

    // 如果已经达到了目标天数，返回当前状态
    if (day === n) {
      return state;
    }
  }

  // 如果没有发现循环且已模拟完n天，返回最终状态
  return state;
}

/**
 * 优化版实现
 * - 直接使用找到的循环周期计算最终状态
 * - 简化了代码结构
 */
function prisonAfterNDaysOptimized(cells: number[], n: number): number[] {
  // 如果天数为0，直接返回初始状态
  if (n === 0) return cells;

  // 由于模式会循环，我们先模拟第一天的变化
  // 因为第一天后，第一个和最后一个牢房必定为0
  let state = [...cells];
  const nextState = new Array(8).fill(0);

  // 应用第一天的变化规则
  for (let i = 1; i <= 6; i++) {
    nextState[i] = state[i - 1] === state[i + 1] ? 1 : 0;
  }
  state = nextState;

  // 实际需要模拟的天数(减去已经模拟的第一天)
  let days = n - 1;

  // 如果天数非常大，我们需要找到循环
  if (days > 0) {
    // 存储状态及其对应的天数
    const seen: Map<string, number> = new Map();
    let day = 0;

    // 开始模拟并寻找循环
    while (day < days) {
      // 将当前状态转换为字符串用于哈希表存储
      const stateKey = state.join("");

      // 检查是否出现循环
      if (seen.has(stateKey)) {
        // 计算循环长度
        const cycleLength = day - seen.get(stateKey)!;
        // 计算剩余天数在循环中的位置
        days = day + ((days - day) % cycleLength);
      }

      // 记录当前状态
      seen.set(stateKey, day);

      // 如果达到目标天数，退出循环
      if (day === days) break;

      // 模拟下一天
      const next = new Array(8).fill(0);
      for (let i = 1; i <= 6; i++) {
        next[i] = state[i - 1] === state[i + 1] ? 1 : 0;
      }
      state = next;
      day++;
    }
  }

  return state;
}

// 导出优化版本作为最终解决方案
function prisonAfterNDays(cells: number[], n: number): number[] {
  return prisonAfterNDaysOptimized(cells, n);
}
// @lc code=end
