/*
 * @lc app=leetcode.cn id=33 lang=typescript
 *
 * [33] 搜索旋转排序数组
 *
 * https://leetcode.cn/problems/search-in-rotated-sorted-array/description/
 *
 * algorithms
 * Medium (44.98%)
 * Likes:    3158
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 2.3M
 * Testcase Example:  '[4,5,6,7,0,1,2]\n0'
 *
 * 整数数组 nums 按升序排列，数组中的值 互不相同 。
 *
 * 在传递给函数之前，nums 在预先未知的某个下标 k（0 <= k < nums.length）上进行了 旋转，使数组变为 [nums[k],
 * nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]（下标 从 0 开始
 * 计数）。例如， [0,1,2,4,5,6,7] 在下标 3 处经旋转后可能变为 [4,5,6,7,0,1,2] 。
 *
 * 给你 旋转后 的数组 nums 和一个整数 target ，如果 nums 中存在这个目标值 target ，则返回它的下标，否则返回 -1 。
 *
 * 你必须设计一个时间复杂度为 O(log n) 的算法解决此问题。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [4,5,6,7,0,1,2], target = 0
 * 输出：4
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [4,5,6,7,0,1,2], target = 3
 * 输出：-1
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1], target = 0
 * 输出：-1
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 5000
 * -10^4 <= nums[i] <= 10^4
 * nums 中的每个值都 独一无二
 * 题目数据保证 nums 在预先未知的某个下标上进行了旋转
 * -10^4 <= target <= 10^4
 *
 *
 */

// @lc code=start
/**
 * 在旋转排序数组中搜索目标值
 * @param nums 旋转后的有序数组
 * @param target 目标值
 * @returns 目标值的索引，如果不存在返回-1
 */
function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    // 找到目标值，直接返回索引
    if (nums[mid] === target) {
      return mid;
    }

    // 判断哪一边是有序的
    // 关键思路：旋转数组被分为两部分，至少有一部分是完全有序的

    if (nums[left] <= nums[mid]) {
      // 左半部分是有序的 [left...mid]

      if (nums[left] <= target && target < nums[mid]) {
        // 目标值在左半部分的有序区间内
        right = mid - 1;
      } else {
        // 目标值在右半部分
        left = mid + 1;
      }
    } else {
      // 右半部分是有序的 [mid...right]

      if (nums[mid] < target && target <= nums[right]) {
        // 目标值在右半部分的有序区间内
        left = mid + 1;
      } else {
        // 目标值在左半部分
        right = mid - 1;
      }
    }
  }

  // 未找到目标值
  return -1;
}
// @lc code=end
