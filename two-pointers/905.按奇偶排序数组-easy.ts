/*
 * @lc app=leetcode.cn id=905 lang=typescript
 *
 * [905] 按奇偶排序数组
 *
 * https://leetcode.cn/problems/sort-array-by-parity/description/
 *
 * algorithms
 * Easy (71.42%)
 * Likes:    418
 * Dislikes: 0
 * Total Accepted:    148.5K
 * Total Submissions: 207.9K
 * Testcase Example:  '[3,1,2,4]'
 *
 * 给你一个整数数组 nums，将 nums 中的的所有偶数元素移动到数组的前面，后跟所有奇数元素。
 *
 * 返回满足此条件的 任一数组 作为答案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,1,2,4]
 * 输出：[2,4,3,1]
 * 解释：[4,2,3,1]、[2,4,1,3] 和 [4,2,1,3] 也会被视作正确答案。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0]
 * 输出：[0]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 5000
 * 0 <= nums[i] <= 5000
 *
 *
 */

// @lc code=start
/**
 * 【详细解题思路】
 *
 * 1. 问题分析：
 *    - 将数组分为两部分：前面是偶数，后面是奇数
 *    - 不需要保持原有顺序（任意符合条件的排列都可以）
 *    - 需要原地修改数组
 *
 * 2. 核心思想 - 双指针：
 *    使用左右双指针，从两端向中间移动
 *
 *    策略：
 *    - left 指针负责检查左侧元素
 *    - 如果 left 指向偶数 → 位置正确，left++
 *    - 如果 left 指向奇数 → 位置错误，和 right 交换，right--
 *
 *    为什么交换后不移动 left？
 *    - 交换后 nums[left] 是从右边来的元素，可能是奇数也可能是偶数
 *    - 需要在下一轮继续检查，确保 left 位置最终是偶数
 *
 * 3. 算法流程示例：
 *    nums = [3, 1, 2, 4]
 *
 *    初始：[3, 1, 2, 4]
 *           ↑        ↑
 *          left    right
 *          奇数 → 交换
 *
 *    第1轮：[4, 1, 2, 3]  交换后 right--
 *           ↑     ↑
 *          left right
 *          偶数 → left++
 *
 *    第2轮：[4, 1, 2, 3]
 *              ↑  ↑
 *            left right
 *             奇数 → 交换
 *
 *    第3轮：[4, 2, 1, 3]  交换后 right--
 *              ↑↑
 *            left=right
 *
 *    结束：[4, 2, 1, 3] ✓（偶数在前，奇数在后）
 *
 * 4. 为什么这个算法正确？
 *
 *    不变量：在每次循环后
 *    - [0, left) 区间内都是偶数（已处理）
 *    - (right, n-1] 区间内都是奇数（已处理）
 *    - [left, right] 区间是待处理区域
 *
 *    当 left == right 时，整个数组处理完成
 *
 * 5. 时间复杂度：O(n)
 *    - left 和 right 总共移动 n 次
 *    - 每个元素最多被访问常数次
 *
 * 6. 空间复杂度：O(1)
 *    - 原地修改，只使用常数空间
 */
function sortArrayByParity(nums: number[]): number[] {
  // 双指针：left 从左向右，right 从右向左
  let left = 0;
  let right = nums.length - 1;

  // 当两个指针未相遇时继续处理
  while (left < right) {
    // 检查 left 位置的元素
    if (nums[left] % 2 === 0) {
      // 情况1：left 指向偶数（符合要求）
      // 偶数应该在左边，位置正确，继续检查下一个
      left++;
    } else {
      // 情况2：left 指向奇数（不符合要求）
      // 奇数不应该在左边，和右边的元素交换
      // 注意：此时不知道 nums[right] 是奇数还是偶数
      [nums[left], nums[right]] = [nums[right], nums[left]];

      // 交换后 right 位置变成了奇数，符合要求，right--
      // left 位置的新元素（从 right 交换来的）可能是奇数或偶数
      // 所以 left 不动，下一轮继续检查
      right--;
    }
  }

  // 循环结束时，[0, left) 是偶数，[right+1, n-1] 是奇数
  return nums;
}
// @lc code=end
