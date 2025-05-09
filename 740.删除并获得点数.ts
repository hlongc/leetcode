/*
 * @lc app=leetcode.cn id=740 lang=typescript
 *
 * [740] 删除并获得点数
 *
 * 题目描述:
 * 给你一个整数数组 nums，你可以对它进行一些操作。
 * 每次操作中，选择任意一个 nums[i]，删除它并获得 nums[i] 的点数。
 * 之后，你必须删除所有等于 nums[i] - 1 和 nums[i] + 1 的元素。
 * 开始你拥有 0 个点数。返回你能通过这些操作获得的最大点数。
 */

// @lc code=start

/**
 * 删除并获得点数
 *
 * @param nums 整数数组
 * @returns 能获得的最大点数
 */
function deleteAndEarn1(nums: number[]): number {
  // 如果数组为空，直接返回0
  if (nums.length === 0) return 0;
  // 如果数组只有一个元素，直接返回该元素的值
  if (nums.length === 1) return nums[0];

  // 找出数组中的最大值，用于确定计数数组的大小
  const maxNum = Math.max(...nums);

  // 创建一个计数数组，sums[i]表示数字i在原数组中出现的次数之和
  // 例如：nums=[2,2,3,3,3,4]，则sums=[0,0,4,9,4]
  // 意味着选择数字2能得到2*2=4点，选择数字3能得到3*3=9点，选择数字4能得到4*1=4点
  const sums = Array(maxNum + 1).fill(0);
  for (const num of nums) {
    sums[num] += num;
  }

  // 现在问题转化为打家劫舍问题：
  // 不能同时选择相邻的数字（因为选了i就要删除i-1和i+1）

  // dp[i]表示考虑前i个数字能获得的最大点数
  const dp = Array(maxNum + 1).fill(0);

  // 边界情况
  dp[1] = sums[1]; // 只有数字1时，能获得的最大点数就是sums[1]

  // 状态转移
  for (let i = 2; i <= maxNum; i++) {
    // 两种选择：选择当前数字i或不选
    // 选择i：获得sums[i]点，但不能选i-1，所以加上dp[i-2]
    // 不选i：点数不变，保持dp[i-1]
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + sums[i]);
  }

  // 返回考虑所有数字后能获得的最大点数
  return dp[maxNum];
}

/**
 * 空间优化版本
 * 因为dp[i]只依赖于dp[i-1]和dp[i-2]，可以用两个变量代替数组
 *
 * @param nums 整数数组
 * @returns 能获得的最大点数
 */
function deleteAndEarn(nums: number[]): number {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  const maxNum = Math.max(...nums);
  const sums = Array(maxNum + 1).fill(0);

  for (const num of nums) {
    sums[num] += num;
  }

  // 使用两个变量代替dp数组
  let prevPrev = 0; // 相当于dp[i-2]
  let prev = sums[1]; // 相当于dp[i-1]，初始值为sums[1]

  for (let i = 2; i <= maxNum; i++) {
    const current = Math.max(prev, prevPrev + sums[i]);
    prevPrev = prev;
    prev = current;
  }

  return prev;
}

/*
 * 解题思路：
 *
 * 1. 问题分析
 *    这道题的关键在于理解：选择一个数字后，必须删除其相邻数字（比它大1或小1的数字）。
 *    这意味着我们不能同时选择相邻的数字，这与打家劫舍问题非常相似（不能同时抢劫相邻的房子）。
 *
 * 2. 转化问题
 *    我们首先将输入数组转化为一个计数数组sums，其中sums[i]表示选择数字i能获得的总点数。
 *    例如，如果nums中有三个3，则sums[3] = 3 * 3 = 9。
 *
 * 3. 动态规划
 *    定义dp[i]为考虑到数字i时能获得的最大点数。
 *    状态转移方程：dp[i] = max(dp[i-1], dp[i-2] + sums[i])
 *    - dp[i-1]：不选数字i的情况
 *    - dp[i-2] + sums[i]：选择数字i的情况（不能选i-1，所以加上dp[i-2]）
 *
 * 4. 空间优化
 *    由于dp[i]只依赖于dp[i-1]和dp[i-2]，可以用两个变量代替整个dp数组，将空间复杂度从O(n)降至O(1)。
 *
 * 时间复杂度: O(n + k)，其中n是nums的长度，k是nums中的最大值
 * 空间复杂度: O(k) 或 O(1)（优化版本）
 */
// @lc code=end
