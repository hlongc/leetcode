/*
 * @lc app=leetcode.cn id=367 lang=typescript
 *
 * [367] 有效的完全平方数
 */

// @lc code=start
function isPerfectSquare(num: number): boolean {
  let left = 1,
    right = Math.ceil(num / 2);
  while (left <= right) {
    const mid = left + ((right - left) >> 1);
    const tmp = mid * mid;

    if (tmp > num) {
      right = mid - 1;
    } else if (tmp < num) {
      left = mid + 1;
    } else {
      return true;
    }
  }

  return false;
}
// @lc code=end
