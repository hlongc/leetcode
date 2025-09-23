/*
 * @lc app=leetcode.cn id=201 lang=typescript
 *
 * [201] 数字范围按位与
 *
 * https://leetcode.cn/problems/bitwise-and-of-numbers-range/description/
 *
 * algorithms
 * Medium (55.27%)
 * Likes:    563
 * Dislikes: 0
 * Total Accepted:    119.3K
 * Total Submissions: 214K
 * Testcase Example:  '5\n7'
 *
 * 给你两个整数 left 和 right ，表示区间 [left, right] ，返回此区间内所有数字 按位与 的结果（包含 left 、right
 * 端点）。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：left = 5, right = 7
 * 输出：4
 *
 *
 * 示例 2：
 *
 *
 * 输入：left = 0, right = 0
 * 输出：0
 *
 *
 * 示例 3：
 *
 *
 * 输入：left = 1, right = 2147483647
 * 输出：0
 *
 *
 *
 *
 * 提示：
 *
 *
 * 0
 *
 *
 */

// @lc code=start
/**
 * 数字范围按位与
 *
 * 解题思路：
 * 对于区间 [left, right] 内所有数字的按位与结果，关键观察是：
 * 只有在left和right的二进制表示中，从最高位开始相同的前缀部分才会保留在最终结果中。
 * 因为在区间内必然存在某些数字，使得后面的位会变成0。
 *
 * 算法：找到left和right的公共二进制前缀
 * 方法1：右移法 - 同时右移left和right，直到它们相等，然后左移回去
 * 方法2：消除right最右边的1 - 不断清除right的最低位1，直到right小于等于left
 */
function rangeBitwiseAnd(left: number, right: number): number {
  // 方法1：右移法（推荐）
  // 记录右移的次数
  let shift = 0;

  // 当left和right不相等时，继续右移
  // 直到找到它们的公共前缀
  while (left !== right) {
    left = left >> 1; // 右移一位
    right = right >> 1; // 右移一位
    shift++; // 记录移位次数
  }

  // 将公共前缀左移回原位置，后面补0
  return left << shift;

  // 方法2：消除最右边的1（备选方案）
  // while (left < right) {
  //   // right & (right - 1) 的作用是消除right二进制表示中最右边的1
  //   // 例如：right = 1100, right-1 = 1011, right & (right-1) = 1000
  //   right = right & (right - 1);
  // }
  // return right;
}
// @lc code=end
