/*
 * @lc app=leetcode.cn id=567 lang=typescript
 *
 * [567] 字符串的排列
 *
 * https://leetcode.cn/problems/permutation-in-string/description/
 *
 * algorithms
 * Medium (46.30%)
 * Likes:    1076
 * Dislikes: 0
 * Total Accepted:    338.1K
 * Total Submissions: 730.2K
 * Testcase Example:  '"ab"\n"eidbaooo"'
 *
 * 给你两个字符串 s1 和 s2 ，写一个函数来判断 s2 是否包含 s1 的 排列。如果是，返回 true ；否则，返回 false 。
 *
 * 换句话说，s1 的排列之一是 s2 的 子串 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：s1 = "ab" s2 = "eidbaooo"
 * 输出：true
 * 解释：s2 包含 s1 的排列之一 ("ba").
 *
 *
 * 示例 2：
 *
 *
 * 输入：s1= "ab" s2 = "eidboaoo"
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= s1.length, s2.length <= 10^4
 * s1 和 s2 仅包含小写字母
 *
 *
 */

// @lc code=start
/**
 * 解题思路：固定长度滑动窗口 + 字符频率匹配
 *
 * 核心思想：
 * 1. s1的排列意味着字符种类和数量完全相同，顺序可以不同
 * 2. 在s2中维护一个长度为s1.length的滑动窗口
 * 3. 判断窗口内的字符频率是否与s1完全匹配
 *
 * 优化技巧：
 * - 使用一个变量valid记录已匹配的字符种类数
 * - 当valid === s1中不同字符的种类数时，说明找到了排列
 *
 * 示例：s1="ab", s2="eidbaooo"
 * need = {a:1, b:1}  // s1的字符频率
 * 窗口滑动过程：
 * [ei] → [id] → [db] → [ba] ✓ 匹配！
 *
 * 时间复杂度：O(n)，n为s2的长度
 * 空间复杂度：O(1)，最多26个小写字母
 */
function checkInclusion(s1: string, s2: string): boolean {
  // 边界情况：s1比s2长，不可能包含
  if (s1.length > s2.length) return false;

  // need记录s1中每个字符需要的数量
  const need = new Map<string, number>();
  for (const char of s1) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  // window记录当前窗口中每个字符的数量
  const window = new Map<string, number>();

  let left = 0; // 窗口左边界
  let right = 0; // 窗口右边界
  let valid = 0; // 窗口中已匹配的字符种类数

  while (right < s2.length) {
    // 扩大窗口：将right位置的字符加入窗口
    const charIn = s2[right];
    right++;

    // 如果加入的字符在need中，更新窗口数据
    if (need.has(charIn)) {
      window.set(charIn, (window.get(charIn) || 0) + 1);
      // 当窗口中该字符数量与need中相等时，valid+1
      if (window.get(charIn) === need.get(charIn)) {
        valid++;
      }
    }

    // 当窗口长度达到s1.length时，开始判断和收缩
    while (right - left >= s1.length) {
      // 如果所有字符都匹配，找到了s1的排列
      if (valid === need.size) {
        return true;
      }

      // 缩小窗口：将left位置的字符移出窗口
      const charOut = s2[left];
      left++;

      // 如果移出的字符在need中，更新窗口数据
      if (need.has(charOut)) {
        // 如果移出前该字符数量与need中相等，valid-1
        if (window.get(charOut) === need.get(charOut)) {
          valid--;
        }
        window.set(charOut, window.get(charOut)! - 1);
      }
    }
  }

  return false;
}
// @lc code=end
