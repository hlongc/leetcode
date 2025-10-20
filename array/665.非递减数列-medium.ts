/*
 * @lc app=leetcode.cn id=665 lang=typescript
 *
 * [665] 非递减数列
 *
 * https://leetcode.cn/problems/non-decreasing-array/description/
 *
 * algorithms
 * Medium (28.11%)
 * Likes:    813
 * Dislikes: 0
 * Total Accepted:    118.8K
 * Total Submissions: 422.4K
 * Testcase Example:  '[4,2,3]'
 *
 * 给你一个长度为 n 的整数数组 nums ，请你判断在 最多 改变 1 个元素的情况下，该数组能否变成一个非递减数列。
 *
 * 我们是这样定义一个非递减数列的： 对于数组中任意的 i (0 <= i <= n-2)，总满足 nums[i] <= nums[i + 1]。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [4,2,3]
 * 输出: true
 * 解释: 你可以通过把第一个 4 变成 1 来使得它成为一个非递减数列。
 *
 *
 * 示例 2:
 *
 *
 * 输入: nums = [4,2,1]
 * 输出: false
 * 解释: 你不能在只改变一个元素的情况下将其变为非递减数列。
 *
 *
 *
 *
 * 提示：
 *
 *
 *
 * n == nums.length
 * 1 <= n <= 10^4
 * -10^5 <= nums[i] <= 10^5
 *
 *
 */

// @lc code=start
function checkPossibility(nums: number[]): boolean {
  // 题意：最多修改一个元素，使数组变成非递减（nums[i] <= nums[i+1]）
  // 关键：遇到逆序对时，需要决定修改哪个元素，并验证修改后是否仍保持非递减
  // 策略：遇到 nums[i] > nums[i+1] 时，优先尝试修改 nums[i] = nums[i+1]，
  // 若修改后仍不满足，则尝试修改 nums[i+1] = nums[i]

  let modified = false; // 记录是否已经修改过

  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] > nums[i + 1]) {
      // 如果已经修改过，再次遇到逆序对则无法满足条件
      if (modified) return false;

      // 尝试修改策略1：将 nums[i] 改为 nums[i+1]
      // 需要检查修改后是否与前面的元素保持非递减
      if (i === 0 || nums[i - 1] <= nums[i + 1]) {
        nums[i] = nums[i + 1];
      } else {
        // 策略1不可行，尝试策略2：将 nums[i+1] 改为 nums[i]
        nums[i + 1] = nums[i];
      }

      modified = true;
    }
  }

  return true;
}
// @lc code=end
