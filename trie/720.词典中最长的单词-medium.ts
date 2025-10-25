/*
 * @lc app=leetcode.cn id=720 lang=typescript
 *
 * [720] 词典中最长的单词
 *
 * https://leetcode.cn/problems/longest-word-in-dictionary/description/
 *
 * algorithms
 * Medium (52.49%)
 * Likes:    363
 * Dislikes: 0
 * Total Accepted:    73.6K
 * Total Submissions: 140.1K
 * Testcase Example:  '["w","wo","wor","worl","world"]'
 *
 * 给出一个字符串数组 words 组成的一本英语词典。返回能够通过 words 中其它单词逐步添加一个字母来构造得到的 words 中最长的单词。
 *
 * 若其中有多个可行的答案，则返回答案中字典序最小的单词。若无答案，则返回空字符串。
 *
 * 请注意，单词应该从左到右构建，每个额外的字符都添加到前一个单词的结尾。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：words = ["w","wo","wor","worl", "world"]
 * 输出："world"
 * 解释： 单词"world"可由"w", "wo", "wor", 和 "worl"逐步添加一个字母组成。
 *
 *
 * 示例 2：
 *
 *
 * 输入：words = ["a", "banana", "app", "appl", "ap", "apply", "apple"]
 * 输出："apple"
 * 解释："apply" 和 "apple" 都能由词典中的单词组成。但是 "apple" 的字典序小于 "apply"
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= words.length <= 1000
 * 1 <= words[i].length <= 30
 * 所有输入的字符串 words[i] 都只包含小写字母。
 *
 *
 */

// @lc code=start

/**
 * Trie 树节点类
 */
class TrieNode720 {
  children: Map<string, TrieNode720>;
  // 存储完整的单词（用于比较字典序）
  word: string | null;

  constructor() {
    this.children = new Map();
    this.word = null;
  }
}

/**
 * 词典中最长的单词
 *
 * 核心思路：Trie（字典树）+ DFS 遍历
 *
 * 问题分析：
 * - 找出能通过其它单词逐步添加一个字母构造的最长单词
 * - 例如："world" 需要 "w", "wo", "wor", "worl" 都在词典中
 * - 如果有多个最长单词，返回字典序最小的
 *
 * 算法设计：
 * 1. 将所有单词插入 Trie 树
 * 2. DFS 遍历 Trie，只访问"可构建"的路径
 *    - 可构建：每个前缀都是一个完整的单词
 * 3. 记录最长且字典序最小的单词
 *
 * 关键点：
 * - 每个节点必须是单词结尾才能继续向下遍历
 * - 根节点例外：根节点不代表任何单词，可以直接向下
 *
 * 示例：words = ["w", "wo", "wor", "worl", "world"]
 *
 * Trie 结构：
 *       root
 *        |
 *        w*     ← "w" 是单词
 *        |
 *        o*     ← "wo" 是单词
 *        |
 *        r*     ← "wor" 是单词
 *        |
 *        l*     ← "worl" 是单词
 *        |
 *        d*     ← "world" 是单词
 *
 * DFS 可以一直走到底，返回 "world"
 *
 * 时间复杂度：O(N×L)，N 为单词数，L 为单词平均长度
 * 空间复杂度：O(N×L)，Trie 树的空间
 */
function longestWord(words: string[]): string {
  // 边界检查
  if (words.length === 0) return "";

  // 第一步：构建 Trie 树
  const root = new TrieNode720();

  for (const word of words) {
    let node = root;

    // 逐字符插入
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode720());
      }
      node = node.children.get(char)!;
    }

    // 在单词结尾存储完整单词
    node.word = word;
  }

  // 第二步：DFS 遍历 Trie，找最长且字典序最小的单词
  let longestResult = "";

  /**
   * DFS 遍历 Trie 树
   * @param node 当前节点
   *
   * 遍历策略：
   * - 只访问那些每一步都是完整单词的路径
   * - 记录遇到的最长单词
   * - 如果长度相同，选择字典序小的
   */
  function dfs(node: TrieNode720): void {
    // 遍历所有子节点
    // 使用 Array.from() 并排序，确保按字典序访问
    // 这样遇到相同长度的单词时，先遇到的就是字典序小的
    const chars = Array.from(node.children.keys()).sort();

    for (const char of chars) {
      const child = node.children.get(char)!;

      // 关键判断：只有当前节点是单词结尾，才能继续向下
      // 这确保了路径上的每个前缀都是一个完整的单词
      if (child.word !== null) {
        // 更新最长单词
        if (child.word.length > longestResult.length) {
          longestResult = child.word;
        }
        // 如果长度相同，选择字典序小的
        else if (
          child.word.length === longestResult.length &&
          child.word < longestResult
        ) {
          longestResult = child.word;
        }

        // 递归访问子节点
        dfs(child);
      }
      // 如果 child.word === null，说明这个节点不是单词结尾
      // 不能继续向下，因为路径不"可构建"
    }
  }

  // 从根节点开始 DFS
  dfs(root);

  return longestResult;
}
// @lc code=end
