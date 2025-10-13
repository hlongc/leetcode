/*
 * @lc app=leetcode.cn id=581 lang=typescript
 *
 * [581] 最短无序连续子数组
 *
 * https://leetcode.cn/problems/shortest-unsorted-continuous-subarray/description/
 *
 * algorithms
 * Medium (42.91%)
 * Likes:    1232
 * Dislikes: 0
 * Total Accepted:    225.7K
 * Total Submissions: 525.8K
 * Testcase Example:  '[2,6,4,8,10,9,15]'
 *
 * 给你一个整数数组 nums ，你需要找出一个 连续子数组 ，如果对这个子数组进行升序排序，那么整个数组都会变为升序排序。
 *
 * 请你找出符合题意的 最短 子数组，并输出它的长度。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [2,6,4,8,10,9,15]
 * 输出：5
 * 解释：你只需要对 [6, 4, 8, 10, 9] 进行升序排序，那么整个表都会变为升序排序。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3,4]
 * 输出：0
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1]
 * 输出：0
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1
 * -10^5
 *
 *
 *
 *
 * 进阶：你可以设计一个时间复杂度为 O(n) 的解决方案吗？
 *
 *
 *
 */

// @lc code=start
function findUnsortedSubarray(nums: number[]): number {
  const n = nums.length;

  // 边界情况：如果数组长度为0或1，已经是有序的
  if (n <= 1) return 0;

  // 第一步：找到无序子数组的左右边界
  let left = 0;
  let right = n - 1;

  // 从左到右找到第一个逆序对的位置
  while (left < n - 1 && nums[left] <= nums[left + 1]) {
    left++;
  }

  // 如果整个数组都是有序的，返回0
  if (left === n - 1) return 0;

  // 从右到左找到第一个逆序对的位置
  while (right > 0 && nums[right] >= nums[right - 1]) {
    right--;
  }

  // 第二步：扩展边界，确保包含所有需要排序的元素
  //
  // 为什么需要扩展？举例说明：
  // 例子1：nums = [1,3,2,4,5]
  // 第一步后：left=1, right=2 (区间[3,2])
  // 但是nums[0]=1 < nums[2]=2，如果只排序[3,2]，排序后[1,2,3,4,5]
  // 这样整个数组就变成有序了，所以需要包含nums[0]
  //
  // 例子2：nums = [1,5,3,2,4]
  // 第一步后：left=1, right=3 (区间[5,3,2])
  // 但是nums[4]=4 > nums[1]=5，如果只排序[5,3,2]，排序后[1,2,3,5,4]
  // 这样整个数组还不是有序的，所以需要包含nums[4]

  // 找到[left, right]区间内的最小值和最大值
  let minVal = nums[left];
  let maxVal = nums[left];

  for (let i = left; i <= right; i++) {
    minVal = Math.min(minVal, nums[i]);
    maxVal = Math.max(maxVal, nums[i]);
  }

  // 向左扩展：如果左边有元素大于区间最小值，需要包含进来
  // 原因：左边的元素如果大于区间最小值，排序后会影响整个数组的有序性
  while (left > 0 && nums[left - 1] > minVal) {
    left--;
  }

  // 向右扩展：如果右边有元素小于区间最大值，需要包含进来
  // 原因：右边的元素如果小于区间最大值，排序后会影响整个数组的有序性
  while (right < n - 1 && nums[right + 1] < maxVal) {
    right++;
  }

  // 返回无序子数组的长度
  return right - left + 1;
}
// @lc code=end
