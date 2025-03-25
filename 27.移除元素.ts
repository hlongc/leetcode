/*
 * @lc app=leetcode.cn id=27 lang=typescript
 *
 * [27] 移除元素
 */

// @lc code=start
/**
 * 遇到不同于 val 的项，就将它直接覆盖到 nums 数组中，从第一项开始覆盖
 * 遍历完数组，不同于 val 的项都安排到了 nums 数组的前头
 */
function removeElement(nums: number[], val: number): number {
  let slow = 0;

  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== val) {
      nums[slow] = nums[fast];
      slow++;
    }
  }

  return slow;
}
// @lc code=end
