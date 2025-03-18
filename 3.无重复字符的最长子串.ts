/*
 * @lc app=leetcode.cn id=3 lang=typescript
 *
 * [3] 无重复字符的最长子串
 */

// @lc code=start
function lengthOfLongestSubstring(s: string): number {
  let max = 0;

  const map = new Map<string, number>();
  for (let l = 0, r = 0; r < s.length; r++) {
    const char = s[r];
    if (map.has(char)) {
      // 这是为了确保窗口不会往回收缩。例如字符串"abba"
      l = Math.max(map.get(char)! + 1, l);
    }
    map.set(char, r);
    max = Math.max(max, r - l + 1);
  }

  return max;
}
// @lc code=end
