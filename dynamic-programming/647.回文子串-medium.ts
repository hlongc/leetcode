/*
 * @lc app=leetcode.cn id=647 lang=typescript
 *
 * [647] 回文子串
 *
 * https://leetcode.cn/problems/palindromic-substrings/description/
 *
 * algorithms
 * Medium (68.18%)
 * Likes:    1482
 * Dislikes: 0
 * Total Accepted:    423.7K
 * Total Submissions: 621.5K
 * Testcase Example:  '"abc"'
 *
 * 给你一个字符串 s ，请你统计并返回这个字符串中 回文子串 的数目。
 *
 * 回文字符串 是正着读和倒过来读一样的字符串。
 *
 * 子字符串 是字符串中的由连续字符组成的一个序列。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：s = "abc"
 * 输出：3
 * 解释：三个回文子串: "a", "b", "c"
 *
 *
 * 示例 2：
 *
 *
 * 输入：s = "aaa"
 * 输出：6
 * 解释：6个回文子串: "a", "a", "a", "aa", "aa", "aaa"
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= s.length <= 1000
 * s 由小写英文字母组成
 *
 *
 */

// @lc code=start
/**
 * 解题思路：中心扩展法
 *
 * 核心思想：
 * 1. 回文串的特点是从中心向两边扩展，左右字符相同
 * 2. 遍历每个可能的回文中心，向两边扩展统计回文串数量
 * 3. 回文中心有两种情况：
 *    - 奇数长度回文：中心是单个字符，如 "aba"
 *    - 偶数长度回文：中心是两个字符之间，如 "abba"
 *
 * 示例：s = "aaa"
 * 中心i=0: "a", "aa", "aaa" → 3个
 * 中心i=1: "a", "aa" → 2个
 * 中心i=2: "a" → 1个
 * 总共6个回文子串
 *
 * 时间复杂度：O(n²)，n个中心，每个中心最多扩展n次
 * 空间复杂度：O(1)
 */
function countSubstrings(s: string): number {
  const n = s.length;
  let count = 0;

  /**
   * 从中心向两边扩展，统计回文串数量
   * @param left 左边界
   * @param right 右边界
   * @returns 以(left,right)为中心的回文串数量
   */
  const expandAroundCenter = (left: number, right: number): number => {
    let result = 0;

    // 当左右边界合法且字符相同时，继续扩展
    while (left >= 0 && right < n && s[left] === s[right]) {
      result++; // 找到一个回文串
      left--; // 左边界向左扩展
      right++; // 右边界向右扩展
    }

    return result;
  };

  // 遍历每个可能的回文中心
  for (let i = 0; i < n; i++) {
    // 情况1：奇数长度回文，中心是单个字符 s[i]
    // 例如："aba" 中心是 'b'
    count += expandAroundCenter(i, i);

    // 情况2：偶数长度回文，中心是 s[i] 和 s[i+1] 之间
    // 例如："abba" 中心是 'bb' 之间
    count += expandAroundCenter(i, i + 1);
  }

  return count;
}
// @lc code=end
