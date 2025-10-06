/*
 * @lc app=leetcode.cn id=283 lang=typescript
 *
 * [283] 移动零
 *
 * https://leetcode.cn/problems/move-zeroes/description/
 *
 * algorithms
 * Easy (63.98%)
 * Likes:    2731
 * Dislikes: 0
 * Total Accepted:    2M
 * Total Submissions: 3.1M
 * Testcase Example:  '[0,1,0,3,12]'
 *
 * 给定一个数组 nums，编写一个函数将所有 0 移动到数组的末尾，同时保持非零元素的相对顺序。
 *
 * 请注意 ，必须在不复制数组的情况下原地对数组进行操作。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [0,1,0,3,12]
 * 输出: [1,3,12,0,0]
 *
 *
 * 示例 2:
 *
 *
 * 输入: nums = [0]
 * 输出: [0]
 *
 *
 *
 * 提示:
 *
 *
 *
 * 1 <= nums.length <= 10^4
 * -2^31 <= nums[i] <= 2^31 - 1
 *
 *
 *
 *
 * 进阶：你能尽量减少完成的操作次数吗？
 *
 */

// @lc code=start
/**
 Do not return anything, modify nums in-place instead.
 */
function moveZeroes(nums: number[]): void {
  // 使用双指针技术：slow指针指向下一个非零元素应该放置的位置
  let slow = 0;

  // 第一步：将所有非零元素移动到数组前面
  // fast指针遍历整个数组
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      // 如果当前元素不是0，将其移动到slow位置
      nums[slow] = nums[fast];
      slow++; // slow指针向前移动
    }
    // 如果当前元素是0，跳过不处理，fast指针继续向前
  }

  // 第二步：将剩余位置填充为0
  // 从slow位置开始到数组末尾，所有位置都应该填充为0
  for (let i = slow; i < nums.length; i++) {
    nums[i] = 0;
  }
}
// @lc code=end
