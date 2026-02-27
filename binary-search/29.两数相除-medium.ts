/*
 * @lc app=leetcode.cn id=29 lang=typescript
 *
 * [29] 两数相除
 *
 * https://leetcode.cn/problems/divide-two-integers/description/
 *
 * algorithms
 * Medium (22.50%)
 * Likes:    1323
 * Dislikes: 0
 * Total Accepted:    269.9K
 * Total Submissions: 1.2M
 * Testcase Example:  '10\n3'
 *
 * 给你两个整数，被除数 dividend 和除数 divisor。将两数相除，要求 不使用 乘法、除法和取余运算。
 *
 * 整数除法应该向零截断，也就是截去（truncate）其小数部分。例如，8.345 将被截断为 8 ，-2.7335 将被截断至 -2 。
 *
 * 返回被除数 dividend 除以除数 divisor 得到的 商 。
 *
 * 注意：假设我们的环境只能存储 32 位 有符号整数，其数值范围是 [−2^31,  2^31 − 1] 。本题中，如果商 严格大于 2^31 − 1
 * ，则返回 2^31 − 1 ；如果商 严格小于 -2^31 ，则返回 -2^31^ 。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: dividend = 10, divisor = 3
 * 输出: 3
 * 解释: 10/3 = 3.33333.. ，向零截断后得到 3 。
 *
 * 示例 2:
 *
 *
 * 输入: dividend = 7, divisor = -3
 * 输出: -2
 * 解释: 7/-3 = -2.33333.. ，向零截断后得到 -2 。
 *
 *
 *
 * 提示：
 *
 *
 * -2^31 <= dividend, divisor <= 2^31 - 1
 * divisor != 0
 *
 *
 */

// @lc code=start
/**
 * 两数相除 - 快速减法（指数级逼近）
 *
 * 解题思路：
 * 不能用乘除法和取余，那就用减法。但是一次次减太慢了。
 *
 * 核心思想：让除数快速翻倍，找到最接近被除数的值
 *
 * 举例：100 ÷ 3
 *
 * 第一轮：找到最大的 3 的倍数不超过 100
 * - 3 × 1 = 3
 * - 3 × 2 = 6
 * - 3 × 4 = 12
 * - 3 × 8 = 24
 * - 3 × 16 = 48
 * - 3 × 32 = 96  ✓ (不超过 100)
 * - 3 × 64 = 192 ✗ (超过了)
 *
 * 所以第一轮：100 - 96 = 4，商累加 32
 *
 * 第二轮：对剩余的 4 继续处理
 * - 3 × 1 = 3  ✓ (不超过 4)
 * - 3 × 2 = 6  ✗ (超过了)
 *
 * 所以第二轮：4 - 3 = 1，商累加 1
 *
 * 最终：商 = 32 + 1 = 33
 *
 * 技巧说明：
 * 1. 用位运算代替乘法：左移 1 位 (<<1) 相当于乘以 2
 * 2. 用负数处理避免溢出：因为负数范围比正数大（-2^31 vs 2^31-1）
 */
function divide(dividend: number, divisor: number): number {
  // 步骤1：定义边界值（32 位有符号整数范围）
  const INT_MIN = -(2 ** 31); // -2147483648
  const INT_MAX = 2 ** 31 - 1; // 2147483647
  // 注意：不能用 Number.MAX_SAFE_INTEGER，它是 2^53-1，范围更大

  // 步骤2：处理溢出的特殊情况
  // 只有 -2147483648 ÷ (-1) = 2147483648 会溢出
  if (dividend === INT_MIN && divisor === -1) {
    return INT_MAX;
  }

  // 步骤3：记录结果的符号（同号为正，异号为负）
  const isNegative = dividend > 0 !== divisor > 0;

  // 步骤4：统一转换为负数处理（避免正数溢出）
  // 例如：-2147483648 转正数会溢出，但正数转负数不会
  let a = dividend > 0 ? -dividend : dividend;
  let b = divisor > 0 ? -divisor : divisor;

  let result = 0;

  // 步骤5：主循环 - 当被除数的绝对值 >= 除数的绝对值时继续
  // 注意：负数比较，-10 < -3，所以用 a <= b
  while (a <= b) {
    // 步骤5.1：初始化当前轮次的除数和对应的商
    let currentDivisor = b; // 当前除数（从原始除数开始）
    let currentQuotient = 1; // 当前商的贡献（从 1 开始）

    // 步骤5.2：让除数快速翻倍，直到超过被除数
    // 例如：-3 -> -6 -> -12 -> -24 -> -48 -> -96
    //
    // 关键理解：因为都是负数，所以比较逻辑相反
    // - 正数世界：6 < 100 表示 6 还没超过 100
    // - 负数世界：-6 > -100 表示 |-6| < |-100|，即 6 还没超过 100
    //
    // 所以 currentDivisor + currentDivisor >= a 的含义是：
    // 翻倍后的除数（绝对值）仍然 <= 被除数（绝对值）
    //
    // 举例：a = -100, currentDivisor = -48
    // - currentDivisor + currentDivisor = -96
    // - -96 >= -100 ✓ (因为 |-96| <= |-100|，即 96 <= 100)
    // - 继续翻倍
    //
    // 下一轮：currentDivisor = -96
    // - currentDivisor + currentDivisor = -192
    // - -192 >= -100 ✗ (因为 |-192| > |-100|，即 192 > 100)
    // - 停止翻倍
    while (
      currentDivisor >= INT_MIN >> 1 && // 防止溢出：不能小于 -2^30
      currentDivisor + currentDivisor >= a // 翻倍后绝对值仍不超过被除数绝对值
    ) {
      currentDivisor += currentDivisor; // 除数翻倍（相当于 << 1）
      currentQuotient += currentQuotient; // 商也翻倍
    }

    // 步骤5.3：减去当前找到的最大倍数
    a -= currentDivisor;

    // 步骤5.4：累加商
    result += currentQuotient;
  }

  // 步骤6：根据符号返回结果
  return isNegative ? -result : result;
}
// @lc code=end
