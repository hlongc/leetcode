/*
 * @lc app=leetcode.cn id=392 lang=typescript
 *
 * [392] 判断子序列
 */

// @lc code=start
function isSubsequence(s: string, t: string): boolean {
  let slow = 0,
    fast = 0;

  while (slow < s.length && fast < t.length) {
    if (t[fast++] === s[slow]) {
      slow++;
    }
    if (slow === s.length) return true;
  }

  return slow === s.length;
}
// @lc code=end
