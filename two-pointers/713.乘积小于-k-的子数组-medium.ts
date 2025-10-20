/*
 * @lc app=leetcode.cn id=713 lang=typescript
 *
 * [713] 乘积小于 K 的子数组
 *
 * https://leetcode.cn/problems/subarray-product-less-than-k/description/
 *
 * algorithms
 * Medium (53.68%)
 * Likes:    883
 * Dislikes: 0
 * Total Accepted:    166.2K
 * Total Submissions: 309.1K
 * Testcase Example:  '[10,5,2,6]\n100'
 *
 * 给你一个整数数组 nums 和一个整数 k ，请你返回子数组内所有元素的乘积严格小于 k 的连续子数组的数目。
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [10,5,2,6], k = 100
 * 输出：8
 * 解释：8 个乘积小于 100 的子数组分别为：[10]、[5]、[2]、[6]、[10,5]、[5,2]、[2,6]、[5,2,6]。
 * 需要注意的是 [10,5,2] 并不是乘积小于 100 的子数组。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3], k = 0
 * 输出：0
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= nums.length <= 3 * 10^4
 * 1 <= nums[i] <= 1000
 * 0 <= k <= 10^6
 *
 *
 */

// @lc code=start
/**
 * 解法：滑动窗口（双指针）
 *
 * 关键思路：
 * - 维护一个乘积小于 k 的窗口区间 [left, right]；当窗口乘积 >= k 时，右扩会失效，
 *   需要不断右移 left（缩小窗口）直到乘积再次 < k。
 * - 每次将 right 向右移动一格并保持窗口乘积 < k 后，
 *   以 right 为结尾的符合条件的子数组个数为 (right - left + 1)。
 *   这是因为所有以 right 结尾、起点在 [left, right] 任一点的子数组都有效。
 *
 * 边界：
 * - 若 k <= 1，则不存在正整数乘积严格小于 k 的非空子数组（nums[i] >= 1），直接返回 0。
 *
 * 复杂度：
 * - 时间复杂度 O(n)：每个元素最多被 left/right 指针访问两次。
 * - 空间复杂度 O(1)：仅常数额外空间。
 */
function numSubarrayProductLessThanK(nums: number[], k: number): number {
  if (k <= 1) {
    return 0;
  }

  let count = 0; // 结果：符合条件的子数组数量
  let product = 1; // 当前窗口内所有元素的乘积
  let left = 0; // 窗口左指针

  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];

    // 若当前窗口乘积不满足 < k，则不断右移 left 缩小窗口
    while (product >= k && left <= right) {
      product /= nums[left];
      left++;
    }

    // 此时窗口 [left, right] 的乘积 < k
    // 以 right 为结尾的有效子数组个数为窗口长度
    count += right - left + 1;
  }

  return count;
}
// @lc code=end
