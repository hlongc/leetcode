/*
 * @lc app=leetcode.cn id=53 lang=typescript
 *
 * [53] 最大子数组和
 */

// @lc code=start
/**
 * 解法一：使用动态规划数组
 * 此方法使用一个额外的数组存储中间状态
 * @param nums 输入的整数数组
 * @returns 最大子数组和
 */
function maxSubArray1(nums: number[]): number {
  const len = nums.length;

  // 创建动态规划数组，dp[i]表示以第i个元素结尾的最大子数组和
  const dp: number[] = Array(len).fill(0);

  // 初始化：第一个元素的最大子数组和就是其自身
  dp[0] = nums[0];
  // 初始化最大值为第一个元素
  let max = dp[0];

  // 从第二个元素开始遍历数组
  for (let i = 1; i < len; i++) {
    // 状态转移方程：当前元素要么自成一段，要么与前面的最大子数组和相连
    // 如果前面的最大子数组和为负数，则不如重新开始
    dp[i] = nums[i] + Math.max(dp[i - 1], 0);

    // 更新全局最大值
    if (dp[i] > max) {
      max = dp[i];
    }
  }

  // 返回找到的最大子数组和
  return max;
}

/**
 * 解法二：优化空间的动态规划
 * 此方法使用两个变量代替数组，降低空间复杂度
 * @param nums 输入的整数数组
 * @returns 最大子数组和
 */
function maxSubArray(nums: number[]): number {
  const len = nums.length;

  // cur记录当前位置的最大子数组和（对应dp[i]）
  let cur = nums[0];
  // max记录全局最大子数组和
  let max = cur;

  // 从第二个元素开始遍历数组
  for (let i = 1; i < len; i++) {
    // 与解法一相同的状态转移逻辑，但不使用数组存储所有状态
    // 当前位置的最大和 = 当前元素 + max(前一个位置的最大和, 0)
    cur = nums[i] + Math.max(cur, 0);

    // 更新全局最大值，使用Math.max简化代码
    max = Math.max(max, cur);
  }

  // 返回找到的最大子数组和
  return max;
}
// @lc code=end
