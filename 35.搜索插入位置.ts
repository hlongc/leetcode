/*
 * @lc app=leetcode.cn id=35 lang=typescript
 *
 * [35] 搜索插入位置
 *
 * 给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。
 * 如果目标值不存在于数组中，返回它将会被按顺序插入的位置。
 * 请必须使用时间复杂度为 O(log n) 的算法。
 */

// @lc code=start
function searchInsert(nums: number[], target: number): number {
  // 初始化二分查找的左右边界
  let left = 0,
    right = nums.length - 1;

  // 二分查找的主循环
  // 使用 <= 确保能处理所有元素，包括单个元素的情况
  while (left <= right) {
    // 计算中间位置，使用位运算避免整数溢出
    const mid = left + ((right - left) >> 1);

    // 如果找到目标值，直接返回其位置
    if (nums[mid] === target) return mid;

    // 根据中间值与目标值的比较，调整搜索区间
    if (nums[mid] > target) {
      // 中间值大于目标值，目标应该在左半部分
      right = mid - 1;
    } else {
      // 中间值小于目标值，目标应该在右半部分
      left = mid + 1;
    }
  }

  // 为什么返回left？
  // 循环结束时，left > right，且满足以下性质：
  // 1. 如果target存在于数组中，我们已经在循环中返回了
  // 2. 如果target不存在，根据二分查找的性质：
  //    - left指向的是第一个大于等于target的位置
  //    - right指向的是最后一个小于target的位置
  // 3. 因此，left正好是target应该插入的位置
  // 例如：
  //   - 数组[1,3,5,6]，target=2，循环结束时left=1，right=0
  //   - 数组[1,3,5,6]，target=7，循环结束时left=4，right=3
  return left;
}
// @lc code=end
