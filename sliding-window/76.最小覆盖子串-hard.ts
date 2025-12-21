/*
 * @lc app=leetcode.cn id=76 lang=typescript
 *
 * [76] 最小覆盖子串
 *
 * https://leetcode.cn/problems/minimum-window-substring/description/
 *
 * algorithms
 * Hard (48.56%)
 * Likes:    3439
 * Dislikes: 0
 * Total Accepted:    943K
 * Total Submissions: 1.9M
 * Testcase Example:  '"ADOBECODEBANC"\n"ABC"'
 *
 * 给定两个字符串 s 和 t，长度分别是 m 和 n，返回 s 中的 最短窗口 子串，使得该子串包含 t
 * 中的每一个字符（包括重复字符）。如果没有这样的子串，返回空字符串 ""。
 *
 * 测试用例保证答案唯一。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：s = "ADOBECODEBANC", t = "ABC"
 * 输出："BANC"
 * 解释：最小覆盖子串 "BANC" 包含来自字符串 t 的 'A'、'B' 和 'C'。
 *
 *
 * 示例 2：
 *
 *
 * 输入：s = "a", t = "a"
 * 输出："a"
 * 解释：整个字符串 s 是最小覆盖子串。
 *
 *
 * 示例 3:
 *
 *
 * 输入: s = "a", t = "aa"
 * 输出: ""
 * 解释: t 中两个字符 'a' 均应包含在 s 的子串中，
 * 因此没有符合条件的子字符串，返回空字符串。
 *
 *
 *
 * 提示：
 *
 *
 * m == s.length
 * n == t.length
 * 1 <= m, n <= 10^5
 * s 和 t 由英文字母组成
 *
 *
 *
 * 进阶：你能设计一个在 O(m + n) 时间内解决此问题的算法吗？
 */

// @lc code=start
/**
 * 最小覆盖子串 - 滑动窗口算法
 *
 * 算法思路：
 * 1. 使用两个哈希表：need 记录 t 中每个字符的需求数量，window 记录窗口中每个字符的数量
 * 2. 使用双指针 left 和 right 构成滑动窗口
 * 3. right 指针向右扩展窗口，直到窗口包含 t 的所有字符
 * 4. 当窗口满足条件时，left 指针向右收缩窗口，尝试找到最小窗口
 * 5. 重复步骤 3-4，直到遍历完整个字符串
 *
 * 时间复杂度：O(m + n)，m 是 s 的长度，n 是 t 的长度
 * 空间复杂度：O(k)，k 是字符集大小（这里是英文字母，最多 52 个）
 */
function minWindow(s: string, t: string): string {
  // 边界情况：如果 s 比 t 短，不可能包含 t，直接返回空字符串
  if (s.length < t.length) return "";

  // need 哈希表：记录 t 中每个字符需要出现的次数
  const need = new Map<string, number>();
  // window 哈希表：记录当前窗口中每个字符出现的次数
  const window = new Map<string, number>();

  // 统计 t 中每个字符的出现次数
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  // left: 窗口左边界，right: 窗口右边界
  let left = 0;
  let right = 0;

  // valid: 记录窗口中满足 need 条件的字符种类数
  // 当 valid === need.size 时，说明窗口已经包含了 t 的所有字符
  let valid = 0;

  // 记录最小覆盖子串的起始位置和长度
  let start = 0;
  let minLen = Infinity;

  // 右指针向右移动，扩大窗口
  while (right < s.length) {
    // 获取将要进入窗口的字符
    const charIn = s[right];
    // 扩大窗口
    right++;

    // 如果进入窗口的字符是 t 中需要的字符，更新窗口数据
    if (need.has(charIn)) {
      // 窗口中该字符的数量 +1
      window.set(charIn, (window.get(charIn) || 0) + 1);

      // 如果窗口中该字符的数量达到了需要的数量，valid +1
      // 注意：这里用 === 而不是 >=，因为我们只在刚好满足时才增加 valid
      // 超过需要的数量不会增加 valid（也不会减少）
      if (window.get(charIn) === need.get(charIn)) {
        valid++;
      }
    }

    // 当窗口包含了 t 的所有字符时，开始收缩窗口
    // valid === need.size 表示所有需要的字符种类都已满足
    while (valid === need.size) {
      // 更新最小覆盖子串
      // right - left 是当前窗口的长度
      if (right - left < minLen) {
        start = left;
        minLen = right - left;
      }

      // 获取将要移出窗口的字符
      const charOut = s[left];
      // 缩小窗口
      left++;

      // 如果移出窗口的字符是 t 中需要的字符，更新窗口数据
      if (need.has(charOut)) {
        // 如果窗口中该字符的数量刚好等于需要的数量
        // 移除后会导致不满足条件，所以 valid -1
        if (window.get(charOut) === need.get(charOut)) {
          valid--;
        }
        // 窗口中该字符的数量 -1
        window.set(charOut, window.get(charOut)! - 1);
      }
    }
  }

  // 如果 minLen 没有被更新过，说明没有找到覆盖子串，返回空字符串
  // 否则返回最小覆盖子串
  return minLen === Infinity ? "" : s.substring(start, start + minLen);
}

/**
 * 示例运行过程（s = "ADOBECODEBANC", t = "ABC"）：
 *
 * need = { A: 1, B: 1, C: 1 }
 *
 * 1. 扩大窗口，right 从 0 移动到 5：
 *    - window = { A: 1, D: 1, O: 1, B: 1, E: 1 }
 *    - valid = 2 (A 和 B 满足)
 *
 * 2. right = 6 时，window = { A: 1, D: 1, O: 1, B: 1, E: 1, C: 1 }
 *    - valid = 3，满足条件
 *    - 当前窗口 "ADOBEC"，长度 6
 *
 * 3. 收缩窗口，left 从 0 移动：
 *    - left = 1: 移除 'A'，valid = 2，不再满足
 *
 * 4. 继续扩大窗口...最终找到 "BANC"，长度 4
 *
 * 返回 "BANC"
 */

// 测试用例
// console.log(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
// console.log(minWindow("a", "a")); // "a"
// console.log(minWindow("a", "aa")); // ""
// @lc code=end
