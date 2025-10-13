/*
 * @lc app=leetcode.cn id=414 lang=typescript
 *
 * [414] 第三大的数
 *
 * https://leetcode.cn/problems/third-maximum-number/description/
 *
 * algorithms
 * Easy (41.13%)
 * Likes:    496
 * Dislikes: 0
 * Total Accepted:    190.1K
 * Total Submissions: 462.2K
 * Testcase Example:  '[3,2,1]'
 *
 * 给你一个非空数组，返回此数组中 第三大的数 。如果不存在，则返回数组中最大的数。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：[3, 2, 1]
 * 输出：1
 * 解释：第三大的数是 1 。
 *
 * 示例 2：
 *
 *
 * 输入：[1, 2]
 * 输出：2
 * 解释：第三大的数不存在, 所以返回最大的数 2 。
 *
 *
 * 示例 3：
 *
 *
 * 输入：[2, 2, 3, 1]
 * 输出：1
 * 解释：注意，要求返回第三大的数，是指在所有不同数字中排第三大的数。
 * 此例中存在两个值为 2 的数，它们都排第二。在所有不同数字中排第三大的数为 1 。
 *
 *
 *
 * 提示：
 *
 *
 * 1
 * -2^31
 *
 *
 *
 *
 * 进阶：你能设计一个时间复杂度 O(n) 的解决方案吗？
 *
 */

// @lc code=start
function thirdMax(nums: number[]): number {
  // 使用三个变量来存储前三大的数
  // 初始化为负无穷，确保任何数都能被正确比较
  let first = Number.NEGATIVE_INFINITY; // 第一大的数
  let second = Number.NEGATIVE_INFINITY; // 第二大的数
  let third = Number.NEGATIVE_INFINITY; // 第三大的数

  // 遍历数组中的每个数字
  for (const num of nums) {
    // 如果当前数字大于第一大的数
    if (num > first) {
      // 更新前三大的数：原来的第一变成第二，第二变成第三
      third = second;
      second = first;
      first = num;
    }
    // 如果当前数字大于第二大的数，但小于第一大的数
    // 注意：必须小于第一大的数，避免重复数字影响
    else if (num > second && num < first) {
      // 更新第二和第三大的数
      third = second;
      second = num;
    }
    // 如果当前数字大于第三大的数，但小于第二大的数
    // 注意：必须小于第二大的数，避免重复数字影响
    else if (num > third && num < second) {
      // 只更新第三大的数
      third = num;
    }
  }

  // 如果第三大的数仍然是负无穷，说明数组中不同数字少于3个
  // 根据题目要求，返回最大的数（第一大的数）
  if (third === Number.NEGATIVE_INFINITY) {
    return first;
  }

  // 否则返回第三大的数
  return third;
}
// @lc code=end
