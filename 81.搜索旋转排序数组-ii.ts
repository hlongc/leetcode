/*
 * @lc app=leetcode.cn id=81 lang=typescript
 *
 * [81] 搜索旋转排序数组 II
 */

// @lc code=start
function search(nums: number[], target: number): boolean {
  if (nums.length === 1) return nums[0] === target;
  let left = 0,
    right = nums.length - 1;
  let mid = 0;

  while (left <= right) {
    mid = left + ((right - left) >> 1);

    if (nums[mid] === target) {
      return true;
    }

    if (nums[left] === nums[mid]) {
      left++;
      continue;
    }

    if (nums[mid] >= nums[left]) {
      if (target >= nums[left] && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      if (target > nums[mid] && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return false;
}
// @lc code=end
