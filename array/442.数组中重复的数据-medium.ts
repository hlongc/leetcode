/*
 * @lc app=leetcode.cn id=442 lang=typescript
 *
 * [442] 数组中重复的数据
 *
 * https://leetcode.cn/problems/find-all-duplicates-in-an-array/description/
 *
 * algorithms
 * Medium (75.53%)
 * Likes:    833
 * Dislikes: 0
 * Total Accepted:    145.9K
 * Total Submissions: 193.1K
 * Testcase Example:  '[4,3,2,7,8,2,3,1]'
 *
 * 给你一个长度为 n 的整数数组 nums ，其中 nums 的所有整数都在范围 [1, n] 内，且每个整数出现 最多两次 。请你找出所有出现 两次
 * 的整数，并以数组形式返回。
 *
 * 你必须设计并实现一个时间复杂度为 O(n) 且仅使用常量额外空间（不包括存储输出所需的空间）的算法解决此问题。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [4,3,2,7,8,2,3,1]
 * 输出：[2,3]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,1,2]
 * 输出：[1]
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1]
 * 输出：[]
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1 <= n <= 10^5
 * 1 <= nums[i] <= n
 * nums 中的每个元素出现 一次 或 两次
 *
 *
 */

// @lc code=start
function findDuplicates(nums: number[]): number[] {
  const result: number[] = [];

  // 遍历数组中的每个元素
  for (let i = 0; i < nums.length; i++) {
    // 获取当前元素的绝对值（因为可能被标记为负数）
    const num = Math.abs(nums[i]);

    // 计算该数字应该对应的索引位置（num - 1，因为数组索引从0开始）
    const index = num - 1;

    // 检查该索引位置的元素是否已经被标记为负数
    // 如果已经是负数，说明这个数字之前已经出现过一次
    if (nums[index] < 0) {
      // 这个数字出现了两次，将其添加到结果数组中
      result.push(num);
    } else {
      // 第一次遇到这个数字，将其对应索引位置的元素标记为负数
      // 负数表示该数字已经出现过一次
      nums[index] = -nums[index];
    }
  }

  return result;
}
// @lc code=end
