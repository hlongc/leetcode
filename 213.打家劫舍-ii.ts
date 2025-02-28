/*
 * @lc app=leetcode.cn id=213 lang=typescript
 *
 * [213] 打家劫舍 II
 */

// @lc code=start
function steal(nums: number[]): number {
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return Math.max(...nums);

  let prev = nums[0];
  let current = Math.max(nums[0], nums[1]);

  for (let i = 2; i < nums.length; i++) {
    const tmp = current;
    current = Math.max(current, prev + nums[i]);
    prev = tmp;
  }

  return current;
}

function rob(nums: number[]): number {
  if (nums.length === 1) return nums[0];
  return Math.max(steal(nums.slice(0, -1)), steal(nums.slice(1)));
}
// @lc code=end
