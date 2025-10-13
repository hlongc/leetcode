/*
 * @lc app=leetcode.cn id=448 lang=typescript
 *
 * [448] 找到所有数组中消失的数字
 *
 * https://leetcode.cn/problems/find-all-numbers-disappeared-in-an-array/description/
 *
 * algorithms
 * Easy (65.83%)
 * Likes:    1382
 * Dislikes: 0
 * Total Accepted:    359.1K
 * Total Submissions: 545.5K
 * Testcase Example:  '[4,3,2,7,8,2,3,1]'
 *
 * 给你一个含 n 个整数的数组 nums ，其中 nums[i] 在区间 [1, n] 内。请你找出所有在 [1, n] 范围内但没有出现在 nums
 * 中的数字，并以数组的形式返回结果。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [4,3,2,7,8,2,3,1]
 * 输出：[5,6]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,1]
 * 输出：[2]
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1
 * 1
 *
 *
 * 进阶：你能在不使用额外空间且时间复杂度为 O(n) 的情况下解决这个问题吗? 你可以假定返回的数组不算在额外空间内。
 *
 */

// @lc code=start
function findDisappearedNumbers(nums: number[]): number[] {
  const result: number[] = [];

  // 第一阶段：标记所有出现的数字
  // 遍历数组中的每个数字，将其对应索引位置的元素标记为负数
  for (const num of nums) {
    // 获取当前数字的绝对值（因为可能已经被标记为负数）
    const absNum = Math.abs(num);

    // 计算该数字应该对应的索引位置（num - 1，因为数组索引从0开始）
    const index = absNum - 1;

    // 如果该索引位置的元素还是正数，说明这是第一次遇到这个数字
    // 将其标记为负数，表示该数字已经出现过
    if (nums[index] > 0) {
      nums[index] = -nums[index];
    }
    // 如果已经是负数，说明该数字已经出现过，不需要重复标记
  }

  // 第二阶段：找出所有消失的数字
  // 遍历数组，找出所有仍为正数的位置
  // 这些位置对应的数字（索引+1）就是消失的数字
  for (let i = 0; i < nums.length; i++) {
    // 如果当前位置的元素仍为正数，说明数字(i+1)没有出现过
    if (nums[i] > 0) {
      result.push(i + 1); // 将消失的数字添加到结果数组中
    }
  }

  return result;
}
// @lc code=end
