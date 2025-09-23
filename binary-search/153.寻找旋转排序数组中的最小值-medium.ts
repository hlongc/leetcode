/*
 * @lc app=leetcode.cn id=153 lang=typescript
 *
 * [153] 寻找旋转排序数组中的最小值
 *
 * https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/description/
 *
 * algorithms
 * Medium (58.43%)
 * Likes:    1292
 * Dislikes: 0
 * Total Accepted:    697K
 * Total Submissions: 1.2M
 * Testcase Example:  '[3,4,5,1,2]'
 *
 * 已知一个长度为 n 的数组，预先按照升序排列，经由 1 到 n 次 旋转 后，得到输入数组。例如，原数组 nums = [0,1,2,4,5,6,7]
 * 在变化后可能得到：
 *
 * 若旋转 4 次，则可以得到 [4,5,6,7,0,1,2]
 * 若旋转 7 次，则可以得到 [0,1,2,4,5,6,7]
 *
 *
 * 注意，数组 [a[0], a[1], a[2], ..., a[n-1]] 旋转一次 的结果为数组 [a[n-1], a[0], a[1], a[2],
 * ..., a[n-2]] 。
 *
 * 给你一个元素值 互不相同 的数组 nums ，它原来是一个升序排列的数组，并按上述情形进行了多次旋转。请你找出并返回数组中的 最小元素 。
 *
 * 你必须设计一个时间复杂度为 O(log n) 的算法解决此问题。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,4,5,1,2]
 * 输出：1
 * 解释：原数组为 [1,2,3,4,5] ，旋转 3 次得到输入数组。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [4,5,6,7,0,1,2]
 * 输出：0
 * 解释：原数组为 [0,1,2,4,5,6,7] ，旋转 4 次得到输入数组。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [11,13,15,17]
 * 输出：11
 * 解释：原数组为 [11,13,15,17] ，旋转 4 次得到输入数组。
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1 <= n <= 5000
 * -5000 <= nums[i] <= 5000
 * nums 中的所有整数 互不相同
 * nums 原来是一个升序排序的数组，并进行了 1 至 n 次旋转
 *
 *
 */

// @lc code=start
function findMin(nums: number[]): number {
  /**
   * 寻找旋转排序数组中的最小值
   *
   * 核心思路：
   * 1. 旋转排序数组的特点：最小值是旋转点，左右两部分都是有序的
   * 2. 使用二分查找，通过比较mid与right的值来确定搜索方向
   * 3. 关键判断：nums[mid] 与 nums[right] 的关系
   *
   * 算法分析：
   * - 如果 nums[mid] > nums[right]：最小值在右半部分 [mid+1, right]
   * - 如果 nums[mid] < nums[right]：最小值在左半部分 [left, mid]
   * - 如果 nums[mid] = nums[right]：题目保证元素互不相同，不会出现此情况
   *
   * 示例分析：
   * [4,5,6,7,0,1,2] target: 找最小值0
   *
   * 第1轮：left=0, mid=3, right=6
   * nums[3]=7 > nums[6]=2 → 最小值在右半部分 → left=4
   *
   * 第2轮：left=4, mid=5, right=6
   * nums[5]=1 < nums[6]=2 → 最小值在左半部分(包含mid) → right=5
   *
   * 第3轮：left=4, mid=4, right=5
   * nums[4]=0 < nums[5]=1 → 最小值在左半部分(包含mid) → right=4
   *
   * 第4轮：left=4, right=4 → 找到最小值nums[4]=0
   */

  let left = 0;
  let right = nums.length - 1;

  // 优化：如果数组没有旋转（即已经是有序的），直接返回第一个元素
  if (nums[left] < nums[right]) {
    return nums[left];
  }

  // 使用二分查找寻找最小值
  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    // 关键判断：比较mid和right位置的值
    if (nums[mid] > nums[right]) {
      // 最小值在右半部分 [mid+1, right]
      // 因为mid位置的值比right大，说明mid在左半部分（较大的部分）
      left = mid + 1;
    } else {
      // nums[mid] < nums[right]
      // 最小值在左半部分 [left, mid]（包含mid，因为mid可能就是最小值）
      right = mid;
    }
  }

  // 当 left === right 时，找到了最小值的位置
  return nums[left];
}
// @lc code=end
