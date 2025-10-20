/*
 * @lc app=leetcode.cn id=670 lang=typescript
 *
 * [670] 最大交换
 *
 * https://leetcode.cn/problems/maximum-swap/description/
 *
 * algorithms
 * Medium (49.25%)
 * Likes:    527
 * Dislikes: 0
 * Total Accepted:    102.3K
 * Total Submissions: 207.7K
 * Testcase Example:  '2736'
 *
 * 给定一个非负整数，你至多可以交换一次数字中的任意两位。返回你能得到的最大值。
 *
 * 示例 1 :
 *
 *
 * 输入: 2736
 * 输出: 7236
 * 解释: 交换数字2和数字7。
 *
 *
 * 示例 2 :
 *
 *
 * 输入: 9973
 * 输出: 9973
 * 解释: 不需要交换。
 *
 *
 * 注意:
 *
 *
 * 给定数字的范围是 [0, 10^8]
 *
 *
 */

// @lc code=start
function maximumSwap(num: number): number {
  // 题意：最多交换一次数字中的任意两位，使结果最大
  // 策略：对每个位置i，找到右边最大的数字，如果它大于digits[i]就交换

  const digits = num.toString().split("").map(Number);
  const n = digits.length;

  // 对每个位置，尝试与右边最大的数字交换
  for (let i = 0; i < n; i++) {
    let maxDigit = digits[i];
    let maxIndex = i;

    // 在位置i的右边找最大数字
    for (let j = i + 1; j < n; j++) {
      if (digits[j] >= maxDigit) {
        // 使用>=确保选择最右边的最大数字
        maxDigit = digits[j];
        maxIndex = j;
      }
    }

    // 如果找到更大的数字，进行交换
    if (maxDigit > digits[i]) {
      [digits[i], digits[maxIndex]] = [digits[maxIndex], digits[i]];
      break; // 只交换一次
    }
  }

  return parseInt(digits.join(""));
}
// @lc code=end
