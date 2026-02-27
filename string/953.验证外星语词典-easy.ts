/*
 * @lc app=leetcode.cn id=953 lang=typescript
 *
 * [953] 验证外星语词典
 *
 * https://leetcode.cn/problems/verifying-an-alien-dictionary/description/
 *
 * algorithms
 * Easy (57.72%)
 * Likes:    289
 * Dislikes: 0
 * Total Accepted:    63K
 * Total Submissions: 109.1K
 * Testcase Example:  '["hello","leetcode"]\n"hlabcdefgijkmnopqrstuvwxyz"'
 *
 * 某种外星语也使用英文小写字母，但可能顺序 order 不同。字母表的顺序（order）是一些小写字母的排列。
 *
 * 给定一组用外星语书写的单词 words，以及其字母表的顺序 order，只有当给定的单词在这种外星语中按字典序排列时，返回 true；否则，返回
 * false。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：words = ["hello","leetcode"], order = "hlabcdefgijkmnopqrstuvwxyz"
 * 输出：true
 * 解释：在该语言的字母表中，'h' 位于 'l' 之前，所以单词序列是按字典序排列的。
 *
 * 示例 2：
 *
 *
 * 输入：words = ["word","world","row"], order = "worldabcefghijkmnpqstuvxyz"
 * 输出：false
 * 解释：在该语言的字母表中，'d' 位于 'l' 之后，那么 words[0] > words[1]，因此单词序列不是按字典序排列的。
 *
 * 示例 3：
 *
 *
 * 输入：words = ["apple","app"], order = "abcdefghijklmnopqrstuvwxyz"
 * 输出：false
 * 解释：当前三个字符 "app" 匹配时，第二个字符串相对短一些，然后根据词典编纂规则 "apple" > "app"，因为 'l' > '∅'，其中
 * '∅' 是空白字符，定义为比任何其他字符都小（更多信息）。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1
 * 1
 * order.length == 26
 * 在 words[i] 和 order 中的所有字符都是英文小写字母。
 *
 *
 */

// @lc code=start
/**
 * 解题思路：字符映射 + 逐对比较
 *
 * 核心思想：
 * 1. 将外星语字母表映射到索引（字母顺序）
 * 2. 逐对比较相邻单词，判断是否按字典序排列
 * 3. 比较两个单词时，逐字符比较直到找到不同字符或到达某个单词末尾
 *
 * 字典序规则：
 * - 逐字符比较，第一个不同的字符决定顺序
 * - 如果一个单词是另一个的前缀，短的在前（如 "app" < "apple"）
 *
 * 算法流程：
 * 1. 建立字母到索引的映射表
 * 2. 遍历相邻单词对，比较是否有序
 * 3. 比较两个单词：
 *    - 找到第一个不同字符，比较其顺序
 *    - 如果前面都相同，检查长度关系
 *
 * 时间复杂度：O(n*m)，n是单词数，m是单词平均长度
 * 空间复杂度：O(1)，映射表固定26个字母
 */
function isAlienSorted(words: string[], order: string): boolean {
  // 步骤1：建立字母到索引的映射
  // 例如：order = "hlabcd..." → {'h': 0, 'l': 1, 'a': 2, ...}
  const orderMap = new Map<string, number>();
  for (let i = 0; i < order.length; i++) {
    orderMap.set(order[i], i);
  }

  // 步骤2：逐对比较相邻单词
  for (let i = 0; i < words.length - 1; i++) {
    // 比较 words[i] 和 words[i+1]
    if (!isOrdered(words[i], words[i + 1], orderMap)) {
      return false;
    }
  }

  return true;
}

/**
 * 辅助函数：判断两个单词是否按字典序排列
 * @param word1 第一个单词
 * @param word2 第二个单词
 * @param orderMap 字母顺序映射表
 * @returns word1 <= word2 返回 true，否则返回 false
 */
function isOrdered(
  word1: string,
  word2: string,
  orderMap: Map<string, number>
): boolean {
  const len1 = word1.length;
  const len2 = word2.length;
  const minLen = Math.min(len1, len2);

  // 逐字符比较
  for (let i = 0; i < minLen; i++) {
    const char1 = word1[i];
    const char2 = word2[i];

    // 如果字符不同，比较其在外星语字母表中的顺序
    if (char1 !== char2) {
      const order1 = orderMap.get(char1)!;
      const order2 = orderMap.get(char2)!;

      // 如果 word1 的字符顺序大于 word2，说明不符合字典序
      return order1 < order2;
    }
  }

  // 所有比较的字符都相同
  // 此时需要检查长度：短的应该在前
  // 例如："app" 应该在 "apple" 前面
  // 如果 len1 > len2，说明 word1 是 word2 的前缀加上额外字符，不符合字典序
  return len1 <= len2;
}

/**
 * 算法图解：
 *
 * 示例1：words = ["hello","leetcode"], order = "hlabcdefgijkmnopqrstuvwxyz"
 *
 * 映射表：h→0, l→1, a→2, b→3, c→4, ...
 *
 * 比较 "hello" 和 "leetcode"：
 * i=0: 'h'(0) vs 'l'(1) → 0 < 1 ✓ 返回 true
 *
 * 结果：true
 *
 *
 * 示例2：words = ["word","world","row"], order = "worldabcefghijkmnpqstuvxyz"
 *
 * 映射表：w→0, o→1, r→2, l→3, d→4, ...
 *
 * 比较 "word" 和 "world"：
 * i=0: 'w' vs 'w' → 相同，继续
 * i=1: 'o' vs 'o' → 相同，继续
 * i=2: 'r' vs 'r' → 相同，继续
 * i=3: 'd'(4) vs 'l'(3) → 4 > 3 ✗ 返回 false
 *
 * 结果：false（"word" > "world"，不符合字典序）
 *
 *
 * 示例3：words = ["apple","app"], order = "abcdefghijklmnopqrstuvwxyz"
 *
 * 比较 "apple" 和 "app"：
 * i=0: 'a' vs 'a' → 相同
 * i=1: 'p' vs 'p' → 相同
 * i=2: 'p' vs 'p' → 相同
 * 遍历完 minLen=3
 *
 * 检查长度：len1(5) > len2(3) ✗ 返回 false
 *
 * 结果：false（"apple" > "app"，不符合字典序）
 *
 *
 * 关键点：
 * 1. 只需比较相邻单词对，如果所有相邻对都有序，整体就有序
 * 2. 比较时找到第一个不同字符即可判断
 * 3. 如果前缀相同，短单词必须在前
 * 4. 使用 Map 存储字母顺序，O(1) 时间查询
 */
// @lc code=end
