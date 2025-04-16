/*
 * @lc app=leetcode.cn id=441 lang=typescript
 *
 * [441] 排列硬币
 */

// @lc code=start
function arrangeCoins(n: number): number {
  let rows = 0;

  while (n >= rows + 1) {
    rows++;
    n -= rows;
  }

  return rows;
}
// @lc code=end
