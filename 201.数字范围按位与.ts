/*
 * @lc app=leetcode.cn id=201 lang=typescript
 *
 * [201] 数字范围按位与
 */

// @lc code=start
function rangeBitwiseAnd(left: number, right: number): number {
  // 不断抹去最右边的1
  while (left < right) {
    right = right & (right - 1);
  }

  return right;
}
// @lc code=end
