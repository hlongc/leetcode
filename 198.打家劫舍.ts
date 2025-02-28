/*
 * @lc app=leetcode.cn id=198 lang=typescript
 *
 * [198] 打家劫舍
 */

// @lc code=start
function rob(nums: number[]): number {
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return Math.max(...nums);
  let prev = nums[0];
  let current = Math.max(nums[0], nums[1]);

  for (let i = 2; i < nums.length; i++) {
    const tmp = current;
    current = Math.max(nums[i] + prev, current);
    prev = tmp;
  }

  return current;
}
// @lc code=end
