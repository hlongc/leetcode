/*
 * @lc app=leetcode.cn id=35 lang=typescript
 *
 * [35] 搜索插入位置
 *
 * https://leetcode.cn/problems/search-insert-position/description/
 *
 * algorithms
 * Easy (47.88%)
 * Likes:    2481
 * Dislikes: 0
 * Total Accepted:    1.7M
 * Total Submissions: 3.6M
 * Testcase Example:  '[1,3,5,6]\n5'
 *
 * 给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。
 *
 * 请必须使用时间复杂度为 O(log n) 的算法。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [1,3,5,6], target = 5
 * 输出: 2
 *
 *
 * 示例 2:
 *
 *
 * 输入: nums = [1,3,5,6], target = 2
 * 输出: 1
 *
 *
 * 示例 3:
 *
 *
 * 输入: nums = [1,3,5,6], target = 7
 * 输出: 4
 *
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= nums.length <= 10^4
 * -10^4 <= nums[i] <= 10^4
 * nums 为 无重复元素 的 升序 排列数组
 * -10^4 <= target <= 10^4
 *
 *
 */

// @lc code=start
/**
 * 在排序数组中搜索目标值的插入位置
 *
 * 解题思路：
 * 1. 使用二分查找算法，时间复杂度 O(log n)
 * 2. 如果找到目标值，返回其索引
 * 3. 如果没找到，返回应该插入的位置（保持数组有序）
 *
 * 关键点：
 * - 使用左闭右闭区间 [left, right] 进行搜索
 * - 当 nums[mid] >= target 时，答案可能在 mid 位置或其左侧
 * - 当 nums[mid] < target 时，答案一定在 mid 右侧
 */
function searchInsert(nums: number[], target: number): number {
  let left = 0; // 搜索区间的左边界
  let right = nums.length - 1; // 搜索区间的右边界

  // 边界情况优化：目标值小于最小元素，插入到开头
  if (target <= nums[left]) return 0;

  // 边界情况优化：目标值大于最大元素，插入到末尾
  if (target > nums[right]) return nums.length;

  // 二分查找主循环
  while (left <= right) {
    // 计算中点，使用位运算避免溢出
    const mid = left + ((right - left) >> 1);

    if (nums[mid] === target) {
      // 找到目标值，直接返回索引
      return mid;
    } else if (nums[mid] > target) {
      // 🔑 关键理解：nums[mid] > target 时为什么 right = mid - 1？
      //
      // 虽然 mid 位置可能是插入位置，但我们已经检查过 nums[mid] 了！
      //
      // 分析：
      // 1. 我们知道 nums[mid] > target
      // 2. mid 可能是插入位置（如果左侧没有更合适的位置）
      // 3. 但我们需要检查 [left, mid-1] 区间是否有更合适的位置
      // 4. 如果 [left, mid-1] 中没有找到，最终 left 会收敛到 mid
      //
      // 例子：nums=[1,3,5,6], target=4
      // - 初始：left=0, right=3
      // - mid=1, nums[1]=3 < 4, left=2
      // - mid=2, nums[2]=5 > 4, right=1 (设置为 mid-1)
      // - left=2 > right=1，循环结束，返回 left=2
      // - 结果：在索引2处插入4，数组变为[1,3,4,5,6] ✓
      right = mid - 1;
    } else {
      // 中点值小于目标值，目标值在右半部分
      // mid 位置不可能是插入位置，所以搜索 [mid+1, right]
      left = mid + 1;
    }
  }

  // 循环结束时，left 就是插入位置
  // 此时 left > right，left 指向第一个大于 target 的位置
  return left;
}

/**
 * 测试用例验证：
 *
 * 示例 1: nums = [1,3,5,6], target = 5
 * - 初始：left=0, right=3
 * - mid=1, nums[1]=3 < 5, left=2
 * - mid=2, nums[2]=5 = 5, 返回 2 ✓
 *
 * 示例 2: nums = [1,3,5,6], target = 2
 * - 初始：left=0, right=3
 * - mid=1, nums[1]=3 > 2, right=0
 * - mid=0, nums[0]=1 < 2, left=1
 * - left > right，返回 left=1 ✓
 *
 * 示例 3: nums = [1,3,5,6], target = 7
 * - 目标值 > nums[3]=6，直接返回 4 ✓
 *
 * 示例 4: nums = [1,3,5,6], target = 0
 * - 目标值 <= nums[0]=1，直接返回 0 ✓
 *
 *
 * 🤔 常见疑问解答：为什么 right = mid - 1 而不是 right = mid？
 *
 * 问题：当 nums[mid] > target 时，mid 位置可能是插入位置，
 *       为什么不保留 mid 在搜索范围内？
 *
 * 答案：关键在于理解二分查找的"已检查"概念：
 *
 * 1. 📝 我们已经检查了 nums[mid]，知道它 > target
 * 2. 🎯 我们的目标是找到"第一个 >= target 的位置"
 * 3. 🔍 虽然 mid 可能是答案，但我们需要确认左侧是否有更小的答案
 * 4. ⚡ 由于已经检查过 mid，下次搜索范围可以是 [left, mid-1]
 * 5. 🎪 如果左侧没有更合适的位置，left 最终会收敛到 mid 的值
 *
 * 详细过程演示：nums = [1,3,5,6], target = 4
 *
 * 第1轮：left=0, right=3, mid=1
 * - nums[1]=3 < 4，答案在右侧，left=2
 *
 * 第2轮：left=2, right=3, mid=2
 * - nums[2]=5 > 4，mid(索引2)可能是答案
 * - 但需要检查左侧是否有更合适的位置
 * - 设置 right=1 (mid-1)，搜索范围变为 [2,1]
 *
 * 第3轮：left=2 > right=1，循环结束
 * - 返回 left=2，这正好是原来的 mid 值！
 *
 * 结论：通过 right=mid-1，我们确保了：
 * ✅ 不会遗漏任何可能的插入位置
 * ✅ 最终 left 会指向正确的插入位置
 * ✅ 算法的正确性得到保证
 */
// @lc code=end
