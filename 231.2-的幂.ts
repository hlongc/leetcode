/*
 * @lc app=leetcode.cn id=231 lang=typescript
 *
 * [231] 2 的幂
 */

// @lc code=start
function isPowerOfTwo(n: number): boolean {
  if (n <= 0) return false;
  return (n & (n - 1)) === 0;
}
// @lc code=end
