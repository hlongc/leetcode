/*
 * @lc app=leetcode.cn id=738 lang=typescript
 *
 * [738] 单调递增的数字
 *
 * https://leetcode.cn/problems/monotone-increasing-digits/description/
 *
 * algorithms
 * Medium (51.46%)
 * Likes:    514
 * Dislikes: 0
 * Total Accepted:    147.9K
 * Total Submissions: 287K
 * Testcase Example:  '10'
 *
 * 当且仅当每个相邻位数上的数字 x 和 y 满足 x <= y 时，我们称这个整数是单调递增的。
 *
 * 给定一个整数 n ，返回 小于或等于 n 的最大数字，且数字呈 单调递增 。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: n = 10
 * 输出: 9
 *
 *
 * 示例 2:
 *
 *
 * 输入: n = 1234
 * 输出: 1234
 *
 *
 * 示例 3:
 *
 *
 * 输入: n = 332
 * 输出: 299
 *
 *
 *
 *
 * 提示:
 *
 *
 * 0 <= n <= 10^9
 *
 *
 */

// @lc code=start
/**
 * 寻找小于等于n的最大单调递增数字
 *
 * 思路：贪心算法 - 从左到右检查，找到第一个非递增的位置，然后进行调整
 *
 * 核心思想：
 * 1. 如果n本身就是单调递增的，直接返回n
 * 2. 如果n不是单调递增的，找到第一个违反单调递增的位置i（即digits[i-1] > digits[i]）
 * 3. 从位置i向前查找，找到需要减1的位置j（最左侧的满足digits[j] > digits[j+1]的位置）
 * 4. 将位置j的数字减1，将j之后的所有位置都设为9
 *
 * 举例说明：
 * n = 332
 * 1. 发现3 > 2，不满足单调递增
 * 2. 需要将前面的数字减小，变成299
 *
 * @param n 给定的整数
 * @returns 小于等于n的最大单调递增数字
 */
function monotoneIncreasingDigits(n: number): number {
  // 特殊情况处理
  if (n < 10) {
    return n; // 个位数字一定是单调递增的
  }

  // 将数字转换为数字数组，方便处理每一位
  const digits: number[] = n.toString().split("").map(Number);
  const length = digits.length;

  // 标记需要从哪个位置开始将后续数字全部置为9
  let markIndex = length;

  // 从右向左扫描，找到第一个不满足递增的位置
  // 注意：我们是从倒数第二个数字开始向左扫描，因为要和右侧比较
  for (let i = length - 2; i >= 0; i--) {
    // 如果当前数字大于右侧数字，不满足单调递增
    if (digits[i] > digits[i + 1]) {
      // 将当前数字减1
      digits[i]--;
      // 标记从i+1位置开始的所有数字都需要变成9
      markIndex = i + 1;
    }
  }

  // 将标记位置及之后的所有数字都设为9
  for (let i = markIndex; i < length; i++) {
    digits[i] = 9;
  }

  // 将数字数组转回整数并返回
  return parseInt(digits.join(""));
}
// @lc code=end
