/*
 * @lc app=leetcode.cn id=211 lang=typescript
 *
 * [211] 添加与搜索单词 - 数据结构设计
 *
 * https://leetcode.cn/problems/design-add-and-search-words-data-structure/description/
 *
 * algorithms
 * Medium (51.31%)
 * Likes:    627
 * Dislikes: 0
 * Total Accepted:    115.5K
 * Total Submissions: 225.1K
 * Testcase Example:  '["WordDictionary","addWord","addWord","addWord","search","search","search","search"]\n' +
  '[[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]'
 *
 * 请你设计一个数据结构，支持 添加新单词 和 查找字符串是否与任何先前添加的字符串匹配 。
 * 
 * 实现词典类 WordDictionary ：
 * 
 * 
 * WordDictionary() 初始化词典对象
 * void addWord(word) 将 word 添加到数据结构中，之后可以对它进行匹配
 * bool search(word) 如果数据结构中存在字符串与 word 匹配，则返回 true ；否则，返回  false 。word 中可能包含一些
 * '.' ，每个 . 都可以表示任何一个字母。
 * 
 * 
 * 
 * 
 * 示例：
 * 
 * 
 * 输入：
 * 
 * ["WordDictionary","addWord","addWord","addWord","search","search","search","search"]
 * [[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]
 * 输出：
 * [null,null,null,null,false,true,true,true]
 * 
 * 解释：
 * WordDictionary wordDictionary = new WordDictionary();
 * wordDictionary.addWord("bad");
 * wordDictionary.addWord("dad");
 * wordDictionary.addWord("mad");
 * wordDictionary.search("pad"); // 返回 False
 * wordDictionary.search("bad"); // 返回 True
 * wordDictionary.search(".ad"); // 返回 True
 * wordDictionary.search("b.."); // 返回 True
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 1 <= word.length <= 25
 * addWord 中的 word 由小写英文字母组成
 * search 中的 word 由 '.' 或小写英文字母组成
 * 最多调用 10^4 次 addWord 和 search
 * 
 * 
 */

// @lc code=start

/**
 * 字典树（Trie）节点类
 * 用于构建前缀树结构，高效存储和搜索单词
 */
class TrieNode {
  // 子节点映射：key为字符，value为对应的子节点
  children: Map<string, TrieNode>;
  // 标记当前节点是否为某个单词的结尾
  isEnd: boolean;

  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

/**
 * 添加与搜索单词 - 数据结构设计
 *
 * 核心思路：使用字典树（Trie）+ DFS 深度优先搜索
 *
 * 1. addWord：标准的 Trie 插入操作
 *    - 逐字符遍历，不存在则创建新节点
 *    - 最后标记结尾节点
 *
 * 2. search：支持通配符 '.' 的搜索
 *    - 使用 DFS 递归搜索
 *    - 遇到普通字符：直接查找对应子节点
 *    - 遇到 '.'：需要尝试所有可能的子节点（回溯思想）
 *
 * 时间复杂度：
 *   - addWord: O(n)，n为单词长度
 *   - search: O(26^m)，最坏情况（全是'.'）需要遍历所有可能路径，m为单词长度
 * 空间复杂度：O(N*L)，N为单词数量，L为单词平均长度
 */
class WordDictionary {
  // Trie 树的根节点
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * 向字典中添加一个单词
   * @param word 要添加的单词
   */
  addWord(word: string): void {
    // 从根节点开始遍历
    let node = this.root;

    // 逐字符处理
    for (const char of word) {
      // 如果当前字符对应的子节点不存在，创建新节点
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      // 移动到子节点
      node = node.children.get(char)!;
    }

    // 标记当前节点为单词结尾
    node.isEnd = true;
  }

  /**
   * 搜索单词是否存在（支持通配符 '.'）
   * @param word 要搜索的单词，可能包含 '.'
   * @returns 是否找到匹配的单词
   */
  search(word: string): boolean {
    // 从根节点开始搜索
    return this.searchInNode(word, 0, this.root);
  }

  /**
   * DFS 递归搜索辅助函数
   * @param word 搜索的单词
   * @param index 当前处理的字符索引
   * @param node 当前所在的 Trie 节点
   * @returns 是否找到匹配
   */
  private searchInNode(word: string, index: number, node: TrieNode): boolean {
    // 递归终止条件：已处理完所有字符
    if (index === word.length) {
      // 只有当前节点是某个单词的结尾时才返回 true
      return node.isEnd;
    }

    const char = word[index];

    // 情况1：当前字符是 '.' 通配符
    if (char === ".") {
      // 需要尝试所有可能的子节点
      // 遍历当前节点的所有子节点
      for (const [, childNode] of node.children) {
        // 递归搜索每个子节点，只要有一个匹配就返回 true
        if (this.searchInNode(word, index + 1, childNode)) {
          return true;
        }
      }
      // 所有子节点都不匹配，返回 false
      return false;
    }

    // 情况2：当前字符是普通字母
    else {
      // 检查当前字符对应的子节点是否存在
      if (!node.children.has(char)) {
        return false; // 不存在，搜索失败
      }
      // 存在，继续在子节点中搜索下一个字符
      return this.searchInNode(word, index + 1, node.children.get(char)!);
    }
  }
}

/**
 * Your WordDictionary object will be instantiated and called as such:
 * var obj = new WordDictionary()
 * obj.addWord(word)
 * var param_2 = obj.search(word)
 */
// @lc code=end
