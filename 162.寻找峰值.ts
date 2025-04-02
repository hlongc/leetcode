/*
 * @lc app=leetcode.cn id=162 lang=typescript
 *
 * [162] 寻找峰值
 *
 * 峰值元素是指其值严格大于左右相邻值的元素。
 * 给你一个整数数组 nums，找到峰值元素并返回其索引。
 * 假设 nums[-1] = nums[n] = -∞，即数组两侧边界外的元素视为负无穷大。
 * 要求时间复杂度为 O(log n)。
 */

// @lc code=start
function findPeakElement(nums: number[]): number {
  // 初始化二分查找的左右边界
  let left = 0,
    right = nums.length - 1;

  // 注意这里使用 < 而不是 <=
  // 当 left == right 时循环结束，此时指向同一个可能的峰值元素
  while (left < right) {
    // 计算中间位置
    const mid = left + ((right - left) >> 1);

    // 比较中间元素和它右侧元素的大小
    // 利用题目给出的向左/右移动时一定能找到峰值的性质
    if (nums[mid] > nums[mid + 1]) {
      // 当前元素比右侧元素大，说明峰值在左侧或当前位置
      // 收缩右边界，但保留mid位置，因为mid可能就是峰值
      right = mid;
    } else {
      // 当前元素小于或等于右侧元素，峰值一定在右侧
      // 因为我们向递增方向移动时，最终要么遇到峰值，要么到达数组边界
      // 而数组边界外的元素是负无穷，所以边界也是峰值
      left = mid + 1;
    }
  }

  // 为什么返回left是正确答案？
  // 1. 当循环结束时，left == right，它们指向同一个位置
  // 2. 在循环过程中，我们的移动策略确保了峰值要么在right指向的位置，要么在左侧
  // 3. 如果nums[mid] > nums[mid+1]，我们保留mid可能是峰值
  // 4. 如果nums[mid] <= nums[mid+1]，我们排除mid不可能是峰值
  // 5. 这个过程不断缩小范围，最终left和right会指向同一个位置
  // 6. 根据我们的移动策略，这个位置必然是峰值：
  //    - 要么是局部最大值
  //    - 要么是递增序列的最右端点(右侧是-∞)
  return left;
}
// @lc code=end
