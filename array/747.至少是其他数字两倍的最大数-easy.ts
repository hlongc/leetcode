/*
 * @lc app=leetcode.cn id=747 lang=typescript
 *
 * [747] 至少是其他数字两倍的最大数
 *
 * https://leetcode.cn/problems/largest-number-at-least-twice-of-others/description/
 *
 * algorithms
 * Easy (47.47%)
 * Likes:    216
 * Dislikes: 0
 * Total Accepted:    108K
 * Total Submissions: 227.4K
 * Testcase Example:  '[3,6,1,0]'
 *
 * 给你一个整数数组 nums ，其中总是存在 唯一的 一个最大整数 。
 *
 * 请你找出数组中的最大元素并检查它是否 至少是数组中每个其他数字的两倍 。如果是，则返回 最大元素的下标 ，否则返回 -1 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,6,1,0]
 * 输出：1
 * 解释：6 是最大的整数，对于数组中的其他整数，6 至少是数组中其他元素的两倍。6 的下标是 1 ，所以返回 1 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3,4]
 * 输出：-1
 * 解释：4 没有超过 3 的两倍大，所以返回 -1 。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 2 <= nums.length <= 50
 * 0 <= nums[i] <= 100
 * nums 中的最大元素是唯一的
 *
 *
 */

// @lc code=start

/**
 *
 * 核心思路：
 * 1. 只需要找到最大值和第二大值
 * 2. 判断：最大值 >= 2 * 第二大值
 * 3. 关键：不需要遍历所有元素比较，只需要知道第二大的元素即可
 *
 * 为什么只需要第二大值？
 * - 如果最大值 >= 2 * 第二大值，那么最大值肯定 >= 2 * 其他所有值
 * - 因为第二大值已经是除了最大值外最大的了
 *
 * 时间复杂度：O(n) - 只需遍历一次
 * 空间复杂度：O(1) - 只用了几个变量
 */
function dominantIndex(nums: number[]): number {
  // 特殊情况：只有一个元素，直接返回下标 0
  if (nums.length === 1) return 0;

  let maxVal = -1; // 最大值（题目保证 nums[i] >= 0）
  let maxIndex = -1; // 最大值的下标
  let secondMax = -1; // 第二大值

  // 一次遍历找到最大值和第二大值
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    if (num > maxVal) {
      // 当前值更大，更新最大值和第二大值
      secondMax = maxVal; // 原来的最大值变成第二大值
      maxVal = num; // 更新最大值
      maxIndex = i; // 记录最大值的下标
    } else if (num > secondMax) {
      // 当前值不是最大，但比第二大值大
      secondMax = num; // 更新第二大值
    }
    // 如果 num <= secondMax，不需要任何操作
  }

  // 判断最大值是否至少是第二大值的两倍
  return maxVal >= 2 * secondMax ? maxIndex : -1;
}

// @lc code=end
