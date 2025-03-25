/*
 * @lc app=leetcode.cn id=34 lang=typescript
 *
 * [34] 在排序数组中查找元素的第一个和最后一个位置
 */

// @lc code=start
function searchRange(nums: number[], target: number): number[] {
  let left = 0,
    right = nums.length - 1;
  let lIndex = -1,
    rIndex = -1;
  while (left <= right) {
    const mid = left + ((right - left) >> 1);

    if (nums[mid] === target) {
      lIndex = mid;
      rIndex = mid;

      while (nums[lIndex - 1] === target) lIndex--;
      while (nums[rIndex + 1] === target) rIndex++;

      break;
    }
    if (target >= nums[left] && target < nums[mid]) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return [lIndex, rIndex];
}
// @lc code=end
