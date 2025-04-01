/*
 * @lc app=leetcode.cn id=33 lang=typescript
 *
 * [33] 搜索旋转排序数组
 *
 * 给你一个整数数组 nums ，和一个整数 target 。
 * 该数组原本是按升序排列的，但可能经过旋转。例如，原数组 [0,1,2,4,5,6,7]
 * 旋转后可能变为 [4,5,6,7,0,1,2]。
 * 请你在数组中搜索 target ，如果存在，返回其下标，否则返回 -1。
 * 要求时间复杂度为 O(log n)
 */

// @lc code=start
function search(nums: number[], target: number): number {
  // 初始化二分查找的左右边界指针
  let left = 0;
  let right = nums.length - 1;
  let mid = 0;

  // 二分查找的主循环，当左右指针交叉时停止
  // 使用 <= 是为了处理单个元素的情况
  while (left <= right) {
    // 计算中间位置，使用位运算防止整数溢出
    // ((right - left) >> 1) 相当于 Math.floor((right - left) / 2)
    mid = left + ((right - left) >> 1);

    // 如果中间元素就是目标值，直接返回索引
    if (nums[mid] === target) {
      return mid;
    }

    // 判断中间点在左半部分还是右半部分
    if (nums[mid] >= nums[left]) {
      // 中间点在左半部分的升序区间内
      // 注意：这里使用 >= 处理数组长度为1的边界情况

      // 检查目标值是否在左半部分的升序区间内
      // 条件：target >= nums[left] && target < nums[mid]
      if (target >= nums[left] && target < nums[mid]) {
        // 目标在左半部分，缩小搜索范围到左半部分
        right = mid - 1;
      } else {
        // 目标在右半部分，缩小搜索范围到右半部分
        left = mid + 1;
      }
    } else {
      // 中间点在右半部分的升序区间内

      // 检查目标值是否在右半部分的升序区间内
      // 条件：target > nums[mid] && target <= nums[right]
      if (target > nums[mid] && target <= nums[right]) {
        // 目标在右半部分，缩小搜索范围到右半部分
        left = mid + 1;
      } else {
        // 目标在左半部分，缩小搜索范围到左半部分
        right = mid - 1;
      }
    }
  }

  // 如果循环结束仍未找到目标值，返回 -1
  return -1;
}
// @lc code=end
