/*
 * @lc app=leetcode.cn id=476 lang=typescript
 *
 * [476] 数字的补数
 *
 * https://leetcode.cn/problems/number-complement/description/
 *
 * algorithms
 * Easy (69.21%)
 * Likes:    375
 * Dislikes: 0
 * Total Accepted:    100.2K
 * Total Submissions: 145K
 * Testcase Example:  '5'
 *
 * 对整数的二进制表示取反（0 变 1 ，1 变 0）后，再转换为十进制表示，可以得到这个整数的补数。
 *
 *
 * 例如，整数 5 的二进制表示是 "101" ，取反后得到 "010" ，再转回十进制表示得到补数 2 。
 *
 *
 * 给你一个整数 num ，输出它的补数。
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：num = 5
 * 输出：2
 * 解释：5 的二进制表示为 101（没有前导零位），其补数为 010。所以你需要输出 2 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：num = 1
 * 输出：0
 * 解释：1 的二进制表示为 1（没有前导零位），其补数为 0。所以你需要输出 0 。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= num < 2^31
 *
 *
 *
 *
 * 注意：本题与 1009 https://leetcode-cn.com/problems/complement-of-base-10-integer/
 * 相同
 *
 */

// @lc code=start
function findComplement(num: number): number {
  /**
   * 数字的补数：对整数的二进制表示取反（0变1，1变0）
   * 关键：只对有效位取反，不包括前导零
   *
   * 【问题分析】
   * 示例：num = 5
   * 5 的二进制：101 (有效位长度为3)
   * 取反结果：010 = 2
   *
   * 如果直接使用按位取反运算符 ~，会对所有32位都取反：
   * ~5 = ~00000000000000000000000000000101
   *    = 11111111111111111111111111111010 (这不是我们想要的)
   *
   * 【核心思路】
   * 1. 找出数字的有效位长度
   * 2. 创建一个掩码，只保留有效位
   * 3. 对数字取反后与掩码进行AND运算
   *
   * 【算法步骤】
   * 方法1：计算有效位长度
   * - 使用 Math.floor(Math.log2(num)) + 1 计算位数
   * - 创建掩码：(1 << bitLength) - 1
   * - 返回 (~num) & mask
   *
   * 方法2：逐位构造（更直观）
   * - 从最高位开始，逐位取反并构造结果
   */

  // 方法1：使用位长度和掩码（推荐）
  // 计算数字的有效位长度
  const bitLength = Math.floor(Math.log2(num)) + 1;

  // 创建掩码：例如bitLength=3时，mask = (1<<3)-1 = 111(二进制) = 7
  const mask = (1 << bitLength) - 1;

  // 对num取反后与掩码进行AND运算，只保留有效位
  return ~num & mask;

  /*
   * 【详细示例】
   * num = 5 = 101(二进制)
   *
   * 1. bitLength = floor(log2(5)) + 1 = floor(2.32) + 1 = 3
   * 2. mask = (1 << 3) - 1 = 8 - 1 = 7 = 111(二进制)
   * 3. ~num = ~5 = ...11111010 (32位，这里只显示后8位)
   * 4. (~num) & mask = ...11111010 & 00000111 = 00000010 = 2
   *
   * num = 1 = 1(二进制)
   *
   * 1. bitLength = floor(log2(1)) + 1 = 0 + 1 = 1
   * 2. mask = (1 << 1) - 1 = 2 - 1 = 1 = 1(二进制)
   * 3. ~num = ~1 = ...11111110
   * 4. (~num) & mask = ...11111110 & 00000001 = 00000000 = 0
   */

  /*
   * 【其他解法】
   *
   * 方法2：逐位构造
   * let result = 0;
   * let bitPos = 0;
   * let temp = num;
   *
   * while (temp > 0) {
   *     if ((temp & 1) === 0) {
   *         result |= (1 << bitPos);
   *     }
   *     temp >>= 1;
   *     bitPos++;
   * }
   * return result;
   *
   * 方法3：字符串操作（不推荐，性能较差）
   * return parseInt(
   *     num.toString(2)
   *        .split('')
   *        .map(bit => bit === '0' ? '1' : '0')
   *        .join(''),
   *     2
   * );
   *
   * 【性能对比】
   * 方法1（当前采用）：时间O(1)，空间O(1) - 最优
   * 方法2：时间O(log n)，空间O(1) - 较好
   * 方法3：时间O(log n)，空间O(log n) - 不推荐
   */
}
// @lc code=end
