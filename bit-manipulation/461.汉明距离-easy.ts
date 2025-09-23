/*
 * @lc app=leetcode.cn id=461 lang=typescript
 *
 * [461] 汉明距离
 *
 * https://leetcode.cn/problems/hamming-distance/description/
 *
 * algorithms
 * Easy (82.03%)
 * Likes:    769
 * Dislikes: 0
 * Total Accepted:    339.3K
 * Total Submissions: 413.2K
 * Testcase Example:  '1\n4'
 *
 * 两个整数之间的 汉明距离 指的是这两个数字对应二进制位不同的位置的数目。
 *
 * 给你两个整数 x 和 y，计算并返回它们之间的汉明距离。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：x = 1, y = 4
 * 输出：2
 * 解释：
 * 1   (0 0 0 1)
 * 4   (0 1 0 0)
 * ⁠      ↑   ↑
 * 上面的箭头指出了对应二进制位不同的位置。
 *
 *
 * 示例 2：
 *
 *
 * 输入：x = 3, y = 1
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * 0 <= x, y <= 2^31 - 1
 *
 *
 *
 *
 * 注意：本题与 2220. 转换数字的最少位翻转次数 相同。
 *
 */

// @lc code=start
function hammingDistance(x: number, y: number): number {
  /**
   * 汉明距离：两个整数对应二进制位不同的位置数目
   *
   * 【核心思路】
   * 1. 使用异或运算找出不同的位：x ^ y
   *    - 相同位异或结果为0，不同位异或结果为1
   *    - 因此 x ^ y 的结果中，1的个数就是汉明距离
   *
   * 2. 计算二进制中1的个数
   *
   * 【示例分析】
   * x = 1 = 0001 (二进制)
   * y = 4 = 0100 (二进制)
   * x ^ y = 0101 (二进制) = 5
   * 0101 中有2个1，所以汉明距离为2
   *
   * 【关键优化：Brian Kernighan算法】
   * 普通方法需要检查每一位，时间复杂度O(32)
   * Brian Kernighan算法只需要检查为1的位，时间复杂度O(k)，k为1的个数
   *
   * 核心技巧：n & (n-1) 会清除最右边的1
   * 原理：
   * - n-1 会将最右边的1变为0，并将其右边的0全部变为1
   * - n & (n-1) 保持其他位不变，只清除最右边的1
   *
   * 例如：
   * n     = 1100 (12)
   * n-1   = 1011 (11)
   * n&(n-1)= 1000 (8)   ← 清除了最右边的1
   */

  // 第一步：异或运算找出所有不同的位
  let xor = x ^ y;
  let count = 0;

  // 第二步：使用Brian Kernighan算法计算1的个数
  while (xor !== 0) {
    // 清除最右边的1，每清除一次计数器加1
    xor &= xor - 1;
    count++;
  }

  return count;

  /*
   * 【其他解法对比】
   *
   * 解法1：逐位检查（朴素方法）
   * while (xor !== 0) {
   *     if (xor & 1) count++;
   *     xor >>= 1;
   * }
   * 时间复杂度：O(32) - 需要检查每一位
   *
   * 解法2：使用内置函数（JavaScript特有）
   * return (x ^ y).toString(2).split('1').length - 1;
   * 或者：return (x ^ y).toString(2).replace(/0/g, '').length;
   * 时间复杂度：O(log n) - 字符串操作有额外开销
   *
   * 解法3：Brian Kernighan算法（当前采用）
   * 时间复杂度：O(k) - k为不同位的个数，最优解法
   * 空间复杂度：O(1)
   *
   * 选择Brian Kernighan算法的原因：
   * 1. 时间复杂度最优，只处理为1的位
   * 2. 空间复杂度O(1)
   * 3. 不依赖语言特性，通用性强
   * 4. 代码简洁优雅
   */
}
// @lc code=end
