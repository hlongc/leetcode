/*
 * @lc app=leetcode.cn id=229 lang=typescript
 *
 * [229] 多数元素 II
 *
 * https://leetcode.cn/problems/majority-element-ii/description/
 *
 * algorithms
 * Medium (54.77%)
 * Likes:    774
 * Dislikes: 0
 * Total Accepted:    118.3K
 * Total Submissions: 216K
 * Testcase Example:  '[3,2,3]'
 *
 * 给定一个大小为 n 的整数数组，找出其中所有出现超过 ⌊ n/3 ⌋ 次的元素。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,2,3]
 * 输出：[3]
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1]
 * 输出：[1]
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1,2]
 * 输出：[1,2]
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 5 * 10^4
 * -10^9 <= nums[i] <= 10^9
 *
 *
 *
 *
 * 进阶：尝试设计时间复杂度为 O(n)、空间复杂度为 O(1)的算法解决此问题。
 *
 */

// @lc code=start
function majorityElement(nums: number[]): number[] {
  // 使用摩尔投票法，最多有两个候选者
  let candidate1: number | null = null;
  let candidate2: number | null = null;
  let count1 = 0;
  let count2 = 0;

  // 第一阶段：找出两个候选者
  for (const num of nums) {
    if (candidate1 === num) {
      count1++;
    } else if (candidate2 === num) {
      count2++;
    } else if (count1 === 0) {
      // 第一个候选者位置为空，设置当前数字为候选者1
      candidate1 = num;
      count1 = 1;
    } else if (count2 === 0) {
      // 第二个候选者位置为空，设置当前数字为候选者2
      candidate2 = num;
      count2 = 1;
    } else {
      // 两个候选者都不为空，且当前数字不是候选者，抵消计数
      count1--;
      count2--;
    }
  }

  // 第二阶段：验证候选者是否真的超过 n/3 次
  count1 = 0;
  count2 = 0;

  for (const num of nums) {
    if (candidate1 === num) {
      count1++;
    } else if (candidate2 === num) {
      count2++;
    }
  }

  const result: number[] = [];
  const threshold = Math.floor(nums.length / 3);

  if (count1 > threshold) {
    result.push(candidate1!);
  }
  if (count2 > threshold) {
    result.push(candidate2!);
  }

  return result;
}
// @lc code=end
