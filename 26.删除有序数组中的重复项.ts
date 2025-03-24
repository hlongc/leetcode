/*
 * @lc app=leetcode.cn id=26 lang=typescript
 *
 * [26] 删除有序数组中的重复项
 */

// @lc code=start
/**
 * 1.创建一个慢指针 i，指向数组第一位数字，再创建一个快指针 j，指向数组第二位。
 * 2.若 nums[j] 和 nums[i] 不等，则先将 i 递增 1，然后把 nums[i] 改为 nums[j]。
 * 3.因为最初 i 等于 0 时的数字未统计，所以最终返回结果需要 +1。
 */
function removeDuplicates(nums: number[]): number {
  let slow = 0;

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }

  return slow + 1;
}
// @lc code=end
