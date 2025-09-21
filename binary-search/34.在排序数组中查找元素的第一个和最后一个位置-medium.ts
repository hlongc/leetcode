/*
 * @lc app=leetcode.cn id=34 lang=typescript
 *
 * [34] 在排序数组中查找元素的第一个和最后一个位置
 *
 * https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/description/
 *
 * algorithms
 * Medium (44.96%)
 * Likes:    2969
 * Dislikes: 0
 * Total Accepted:    1.2M
 * Total Submissions: 2.7M
 * Testcase Example:  '[5,7,7,8,8,10]\n8'
 *
 * 给你一个按照非递减顺序排列的整数数组 nums，和一个目标值 target。请你找出给定目标值在数组中的开始位置和结束位置。
 *
 * 如果数组中不存在目标值 target，返回 [-1, -1]。
 *
 * 你必须设计并实现时间复杂度为 O(log n) 的算法解决此问题。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [5,7,7,8,8,10], target = 8
 * 输出：[3,4]
 *
 * 示例 2：
 *
 *
 * 输入：nums = [5,7,7,8,8,10], target = 6
 * 输出：[-1,-1]
 *
 * 示例 3：
 *
 *
 * 输入：nums = [], target = 0
 * 输出：[-1,-1]
 *
 *
 *
 * 提示：
 *
 *
 * 0 <= nums.length <= 10^5
 * -10^9 <= nums[i] <= 10^9
 * nums 是一个非递减数组
 * -10^9 <= target <= 10^9
 *
 *
 */

// @lc code=start
/**
 * 在排序数组中查找目标值的第一个和最后一个位置
 * @param nums 非递减排序的整数数组
 * @param target 目标值
 * @returns 目标值的开始位置和结束位置，如果不存在返回[-1, -1]
 */
function searchRange(nums: number[], target: number): number[] {
  // 初始化双指针，left指向数组开始，right指向数组结束
  let left = 0,
    right = nums.length - 1;

  // 使用二分查找寻找目标值
  while (left <= right) {
    // 计算中间位置，使用位运算避免溢出
    const mid = left + ((right - left) >> 1);

    // 找到目标值
    if (nums[mid] === target) {
      // 初始化左右边界为当前找到的位置
      let l = mid,
        r = mid;

      // 向左扩展，找到目标值的第一个位置
      // 注意：需要检查边界条件，避免数组越界
      while (l > 0 && nums[l - 1] === target) l--;

      // 向右扩展，找到目标值的最后一个位置
      // 注意：需要检查边界条件，避免数组越界
      while (r < nums.length - 1 && nums[r + 1] === target) r++;

      // 返回目标值的开始位置和结束位置
      return [l, r];
    } else if (nums[mid] > target) {
      // 中间值大于目标值，在左半部分继续查找
      right = mid - 1;
    } else {
      // 中间值小于目标值，在右半部分继续查找
      left = mid + 1;
    }
  }

  // 未找到目标值，返回[-1, -1]
  return [-1, -1];
}
// @lc code=end
