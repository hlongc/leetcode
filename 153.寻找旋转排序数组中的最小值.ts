/*
 * @lc app=leetcode.cn id=153 lang=typescript
 *
 * [153] 寻找旋转排序数组中的最小值
 */

// @lc code=start
function findMin(nums: number[]): number {
  if (nums.length === 1) return nums[0];
  let left = 0,
    right = nums.length - 1;
  let mid: number = 0;
  // 说明当前数组已经是单调递增了
  if (nums[right] > nums[left]) return nums[left];
  while (left <= right) {
    mid = left + ((right - left) >> 1);
    // 对应 [4,5,6,7,0,1,2] nums[mid]=0 nums[mid-1]=7
    if (nums[mid] < nums[mid - 1]) {
      return nums[mid];
    }
    // 对应 [4,5,6,7,0,1,2] nums[mid]=7 nums[mid+1]=0
    if (nums[mid] > nums[mid + 1]) {
      return nums[mid + 1];
    }
    if (nums[mid] > nums[0]) {
      // mid大于第一个元素，说明mid左侧是递增的，最小值在mid的右侧，移动左指针
      left = mid + 1;
    } else {
      // 对应 [4,5,6,7,0,1,2] nums[mid]=1 ，最小值在mid的左侧，移动右指针
      right = mid - 1;
    }
  }

  return nums[mid];
}
// @lc code=end
