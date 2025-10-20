/*
 * @lc app=leetcode.cn id=643 lang=typescript
 *
 * [643] 子数组最大平均数 I
 *
 * https://leetcode.cn/problems/maximum-average-subarray-i/description/
 *
 * algorithms
 * Easy (44.12%)
 * Likes:    420
 * Dislikes: 0
 * Total Accepted:    207.2K
 * Total Submissions: 469.5K
 * Testcase Example:  '[1,12,-5,-6,50,3]\n4'
 *
 * 给你一个由 n 个元素组成的整数数组 nums 和一个整数 k 。
 *
 * 请你找出平均数最大且 长度为 k 的连续子数组，并输出该最大平均数。
 *
 * 任何误差小于 10^-5 的答案都将被视为正确答案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,12,-5,-6,50,3], k = 4
 * 输出：12.75
 * 解释：最大平均数 (12-5-6+50)/4 = 51/4 = 12.75
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [5], k = 1
 * 输出：5.00000
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1 <= k <= n <= 10^5
 * -10^4 <= nums[i] <= 10^4
 *
 *
 */

// @lc code=start
function findMaxAverage(nums: number[], k: number): number {
  // 题意：在数组中找一个长度为 k 的连续子数组，使其平均值最大
  // 等价转化：最大化长度为 k 的窗口的元素和（最后再除以 k），
  // 因此使用固定长度的滑动窗口求最大窗口和。

  // 1) 先计算前 k 个元素的和，作为初始窗口和
  let curSum = 0;
  for (let i = 0; i < k; i++) {
    curSum += nums[i];
  }
  let maxSum = curSum; // 初始最大和为第一个完整窗口

  // 2) 从第 k 个元素开始滑动窗口：每次加入新元素、移除窗口左端元素
  for (let i = k; i < nums.length; i++) {
    curSum += nums[i] - nums[i - k];
    // 仅在窗口长度恰为 k 时比较最大值（此时恒成立）
    maxSum = Math.max(maxSum, curSum);
  }

  // 3) 返回最大平均值
  return maxSum / k;
}
// @lc code=end
