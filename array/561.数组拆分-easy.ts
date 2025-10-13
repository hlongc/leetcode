/*
 * @lc app=leetcode.cn id=561 lang=typescript
 *
 * [561] 数组拆分
 *
 * https://leetcode.cn/problems/array-partition/description/
 *
 * algorithms
 * Easy (78.62%)
 * Likes:    384
 * Dislikes: 0
 * Total Accepted:    175.5K
 * Total Submissions: 223.2K
 * Testcase Example:  '[1,4,3,2]'
 *
 * 给定长度为 2n 的整数数组 nums ，你的任务是将这些数分成 n 对, 例如 (a1, b1), (a2, b2), ..., (an, bn)
 * ，使得从 1 到 n 的 min(ai, bi) 总和最大。
 *
 * 返回该 最大总和 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,4,3,2]
 * 输出：4
 * 解释：所有可能的分法（忽略元素顺序）为：
 * 1. (1, 4), (2, 3) -> min(1, 4) + min(2, 3) = 1 + 2 = 3
 * 2. (1, 3), (2, 4) -> min(1, 3) + min(2, 4) = 1 + 2 = 3
 * 3. (1, 2), (3, 4) -> min(1, 2) + min(3, 4) = 1 + 3 = 4
 * 所以最大总和为 4
 *
 * 示例 2：
 *
 *
 * 输入：nums = [6,2,6,5,1,2]
 * 输出：9
 * 解释：最优的分法为 (2, 1), (2, 5), (6, 6). min(2, 1) + min(2, 5) + min(6, 6) = 1 + 2
 * + 6 = 9
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= n <= 10^4
 * nums.length == 2 * n
 * -10^4 <= nums[i] <= 10^4
 *
 *
 */

// @lc code=start
function arrayPairSum(nums: number[]): number {
  // 对数组进行排序，这是贪心策略的关键
  // 排序后，相邻的元素配对可以最大化min值的总和
  nums.sort((a, b) => a - b);

  // 记录所有min值的总和
  let maxSum = 0;

  // 遍历排序后的数组，每次取两个元素
  // 由于数组长度为2n，我们只需要取偶数索引位置的元素
  // 因为排序后，偶数索引位置的元素总是较小值
  for (let i = 0; i < nums.length; i += 2) {
    // 取每对中的较小值（即偶数索引位置的元素）
    maxSum += nums[i];
  }

  return maxSum;
}
// @lc code=end
