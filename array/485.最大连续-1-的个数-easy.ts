/*
 * @lc app=leetcode.cn id=485 lang=typescript
 *
 * [485] 最大连续 1 的个数
 *
 * https://leetcode.cn/problems/max-consecutive-ones/description/
 *
 * algorithms
 * Easy (61.90%)
 * Likes:    456
 * Dislikes: 0
 * Total Accepted:    283.9K
 * Total Submissions: 458.6K
 * Testcase Example:  '[1,1,0,1,1,1]'
 *
 * 给定一个二进制数组 nums ， 计算其中最大连续 1 的个数。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,1,0,1,1,1]
 * 输出：3
 * 解释：开头的两位和最后的三位都是连续 1 ，所以最大连续 1 的个数是 3.
 *
 *
 * 示例 2:
 *
 *
 * 输入：nums = [1,0,1,1,0,1]
 * 输出：2
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * nums[i] 不是 0 就是 1.
 *
 *
 */

// @lc code=start
function findMaxConsecutiveOnes(nums: number[]): number {
  // 记录全局最大连续1的个数
  let maxCount = 0;
  // 记录当前连续1的个数
  let currentCount = 0;

  // 遍历数组中的每个元素
  for (const num of nums) {
    if (num === 1) {
      // 如果当前元素是1，增加当前连续计数
      currentCount++;
      // 更新全局最大值
      maxCount = Math.max(maxCount, currentCount);
    } else {
      // 如果当前元素是0，重置当前连续计数
      currentCount = 0;
    }
  }

  return maxCount;
}
// @lc code=end
