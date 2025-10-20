/*
 * @lc app=leetcode.cn id=674 lang=typescript
 *
 * [674] 最长连续递增序列
 *
 * https://leetcode.cn/problems/longest-continuous-increasing-subsequence/description/
 *
 * algorithms
 * Easy (59.22%)
 * Likes:    499
 * Dislikes: 0
 * Total Accepted:    314.9K
 * Total Submissions: 531.5K
 * Testcase Example:  '[1,3,5,4,7]'
 *
 * 给定一个未经排序的整数数组，找到最长且 连续递增的子序列，并返回该序列的长度。
 *
 * 连续递增的子序列 可以由两个下标 l 和 r（l < r）确定，如果对于每个 l ，都有 nums[i] < nums[i + 1] ，那么子序列
 * [nums[l], nums[l + 1], ..., nums[r - 1], nums[r]] 就是连续递增子序列。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,3,5,4,7]
 * 输出：3
 * 解释：最长连续递增序列是 [1,3,5], 长度为3。
 * 尽管 [1,3,5,7] 也是升序的子序列, 但它不是连续的，因为 5 和 7 在原数组里被 4 隔开。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [2,2,2,2,2]
 * 输出：1
 * 解释：最长连续递增序列是 [2], 长度为1。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1
 * -10^9
 *
 *
 */

// @lc code=start
/**
 * 解法：滑动窗口 / 双指针 / 一次遍历
 *
 * 算法思路：
 * 1. 使用两个变量维护状态：
 *    - maxLength: 记录遇到的最长连续递增序列的长度
 *    - currentLength: 记录当前正在统计的连续递增序列长度
 * 2. 从左到右遍历数组，比较相邻元素：
 *    - 如果 nums[i] > nums[i-1]，当前序列继续增长，currentLength++
 *    - 否则，序列中断，更新 maxLength，重置 currentLength = 1
 * 3. 遍历结束后，再次更新 maxLength（处理末尾连续递增的情况）
 *
 * 示例演示 [1,3,5,4,7]：
 * i=1: 3>1 ✓ currentLength=2
 * i=2: 5>3 ✓ currentLength=3
 * i=3: 4<5 ✗ maxLength=3, currentLength=1
 * i=4: 7>4 ✓ currentLength=2
 * 最终: maxLength = max(3, 2) = 3
 *
 * 时间复杂度：O(n)，只需遍历数组一次
 * 空间复杂度：O(1)，只使用常数个额外变量
 */
function findLengthOfLCIS(nums: number[]): number {
  // 边界处理：空数组或单元素数组直接返回长度
  // 空数组长度为 0，单元素数组的最长递增序列就是它本身
  if (nums.length <= 1) {
    return nums.length;
  }

  let maxLength = 1; // 最长连续递增序列的长度（初始至少为 1）
  let currentLength = 1; // 当前正在统计的连续递增序列长度

  // 从第二个元素开始遍历，每次比较当前元素与前一个元素
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > nums[i - 1]) {
      // 情况1：当前元素 > 前一个元素，满足递增条件
      // 当前连续递增序列长度 +1
      currentLength++;
    } else {
      // 情况2：当前元素 <= 前一个元素，递增序列中断
      // 先更新全局最大长度（当前序列已结束）
      maxLength = Math.max(maxLength, currentLength);
      // 重置当前序列长度为 1（从当前元素重新开始计数）
      currentLength = 1;
    }
  }

  // 循环结束后最后一次更新最大长度
  // 这是必要的，因为如果数组末尾是一段连续递增序列，
  // 循环内部不会触发更新 maxLength 的逻辑
  // 例如：[1,3,5,7,9] 遍历结束时 currentLength=5，需要在此更新
  return Math.max(maxLength, currentLength);
}
// @lc code=end
