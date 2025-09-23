/*
 * @lc app=leetcode.cn id=81 lang=typescript
 *
 * [81] 搜索旋转排序数组 II
 *
 * https://leetcode.cn/problems/search-in-rotated-sorted-array-ii/description/
 *
 * algorithms
 * Medium (41.54%)
 * Likes:    850
 * Dislikes: 0
 * Total Accepted:    257.3K
 * Total Submissions: 619.5K
 * Testcase Example:  '[2,5,6,0,0,1,2]\n0'
 *
 * 已知存在一个按非降序排列的整数数组 nums ，数组中的值不必互不相同。
 *
 * 在传递给函数之前，nums 在预先未知的某个下标 k（0 <= k < nums.length）上进行了 旋转 ，使数组变为 [nums[k],
 * nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]（下标 从 0 开始
 * 计数）。例如， [0,1,2,4,4,4,5,6,6,7] 在下标 5 处经旋转后可能变为 [4,5,6,6,7,0,1,2,4,4] 。
 *
 * 给你 旋转后 的数组 nums 和一个整数 target ，请你编写一个函数来判断给定的目标值是否存在于数组中。如果 nums 中存在这个目标值
 * target ，则返回 true ，否则返回 false 。
 *
 * 你必须尽可能减少整个操作步骤。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [2,5,6,0,0,1,2], target = 0
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [2,5,6,0,0,1,2], target = 3
 * 输出：false
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 5000
 * -10^4 <= nums[i] <= 10^4
 * 题目数据保证 nums 在预先未知的某个下标上进行了旋转
 * -10^4 <= target <= 10^4
 *
 *
 *
 *
 * 进阶：
 *
 *
 * 此题与 搜索旋转排序数组 相似，但本题中的 nums  可能包含 重复 元素。这会影响到程序的时间复杂度吗？会有怎样的影响，为什么？
 *
 *
 *
 *
 */

// @lc code=start
function search(nums: number[], target: number): boolean {
  /**
   * 搜索旋转排序数组II - 处理重复元素的情况
   *
   * 核心思路：
   * 1. 使用二分查找，但需要处理重复元素导致的边界模糊问题
   * 2. 当 nums[left] === nums[mid] === nums[right] 时，无法判断哪一边是有序的
   * 3. 此时需要收缩边界：left++ 和 right--
   * 4. 其他情况与旋转排序数组I相同
   *
   * 边界收缩示例：
   * 数组：[1,0,1,1,1,1,1,1,1] target = 0
   *
   * 第1轮：left=0, mid=4, right=8
   * nums[0]=1, nums[4]=1, nums[8]=1 (都相等！)
   * 无法判断哪边有序 → left=1, right=7
   *
   * 第2轮：left=1, mid=4, right=7
   * nums[1]=0, nums[4]=1, nums[7]=1
   * nums[left] < nums[mid]，左半部分有序
   * target=0在[0,1)范围内 → right=3
   *
   * 第3轮：left=1, mid=2, right=3
   * nums[1]=0, nums[2]=1, nums[3]=1
   * nums[left] < nums[mid]，左半部分有序
   * target=0在[0,1)范围内 → right=1
   *
   * 第4轮：left=1, mid=1, right=1
   * nums[1]=0 === target → 找到！返回true
   */

  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    // 找到目标值，直接返回true
    if (nums[mid] === target) {
      return true;
    }

    // 关键：处理重复元素的情况
    // 当左边界、中点、右边界的值都相等时，无法判断哪一边是有序的
    // 此时只能收缩边界，去除重复元素的干扰
    if (nums[left] === nums[mid] && nums[mid] === nums[right]) {
      left++;
      right--;
    }
    // 左半部分是有序的 (nums[left] <= nums[mid])
    else if (nums[left] <= nums[mid]) {
      // 目标值在左半部分的有序区间内
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1; // 在左半部分搜索
      } else {
        left = mid + 1; // 在右半部分搜索
      }
    }
    // 右半部分是有序的 (nums[mid] <= nums[right])
    else {
      // 目标值在右半部分的有序区间内
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1; // 在右半部分搜索
      } else {
        right = mid - 1; // 在左半部分搜索
      }
    }
  }

  return false; // 未找到目标值
}
// @lc code=end
