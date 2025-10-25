/*
 * @lc app=leetcode.cn id=208 lang=typescript
 *
 * [208] 实现 Trie (前缀树)
 *
 * https://leetcode.cn/problems/implement-trie-prefix-tree/description/
 *
 * algorithms
 * Medium (72.80%)
 * Likes:    1867
 * Dislikes: 0
 * Total Accepted:    493.6K
 * Total Submissions: 678.1K
 * Testcase Example:  '["Trie","insert","search","search","startsWith","insert","search"]\n' +
  '[[],["apple"],["apple"],["app"],["app"],["app"],["app"]]'
 *
 * Trie（发音类似 "try"）或者说 前缀树
 * 是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。这一数据结构有相当多的应用情景，例如自动补全和拼写检查。
 * 
 * 请你实现 Trie 类：
 * 
 * 
 * Trie() 初始化前缀树对象。
 * void insert(String word) 向前缀树中插入字符串 word 。
 * boolean search(String word) 如果字符串 word 在前缀树中，返回 true（即，在检索之前已经插入）；否则，返回
 * false 。
 * boolean startsWith(String prefix) 如果之前已经插入的字符串 word 的前缀之一为 prefix ，返回 true
 * ；否则，返回 false 。
 * 
 * 
 * 
 * 
 * 示例：
 * 
 * 
 * 输入
 * ["Trie", "insert", "search", "search", "startsWith", "insert", "search"]
 * [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]
 * 输出
 * [null, null, true, false, true, null, true]
 * 
 * 解释
 * Trie trie = new Trie();
 * trie.insert("apple");
 * trie.search("apple");   // 返回 True
 * trie.search("app");     // 返回 False
 * trie.startsWith("app"); // 返回 True
 * trie.insert("app");
 * trie.search("app");     // 返回 True
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 1 <= word.length, prefix.length <= 2000
 * word 和 prefix 仅由小写英文字母组成
 * insert、search 和 startsWith 调用次数 总计 不超过 3 * 10^4 次
 * 
 * 
 */

// @lc code=start

/**
 * 字典树（Trie）节点类
 *
 * Trie 是一种多叉树结构，每个节点代表一个字符
 * 从根节点到某个节点的路径就代表一个字符串
 */
class TrieNode208 {
  // 子节点映射：key 为字符，value 为对应的子节点
  // 使用 Map 而非数组可以节省空间（只存储实际存在的字符）
  children: Map<string, TrieNode208>;

  // 标记当前节点是否为某个单词的结尾
  // 这样可以区分 "app" 和 "apple" 中的 "app" 节点
  isEnd: boolean;

  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

/**
 * 实现 Trie (前缀树)
 *
 * 核心思路：
 * 1. Trie 是一种树形数据结构，用于高效存储和检索字符串
 * 2. 每个节点包含若干子节点，从根节点到某节点的路径代表一个前缀
 * 3. 节点上的 isEnd 标记用于区分完整单词和前缀
 *
 * 优势：
 * - 搜索前缀和完整单词的时间复杂度只与单词长度有关，与单词总数无关
 * - 可以高效实现自动补全、拼写检查等功能
 * - 多个单词共享公共前缀，节省存储空间
 *
 * 时间复杂度（m 为字符串长度）：
 *   - insert: O(m)
 *   - search: O(m)
 *   - startsWith: O(m)
 *
 * 空间复杂度：O(N*L)，N 为单词数量，L 为单词平均长度
 */
class Trie208 {
  // Trie 的根节点（不存储任何字符）
  private root: TrieNode208;

  constructor() {
    this.root = new TrieNode208();
  }

  /**
   * 向 Trie 中插入一个单词
   * @param word 要插入的单词
   *
   * 算法流程：
   * 1. 从根节点开始，逐字符处理
   * 2. 如果当前字符的子节点不存在，创建新节点
   * 3. 移动到子节点，继续处理下一个字符
   * 4. 处理完所有字符后，标记最后一个节点为单词结尾
   */
  insert(word: string): void {
    let node = this.root;

    // 逐字符遍历单词
    for (const char of word) {
      // 如果当前字符对应的子节点不存在，创建新节点
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode208());
      }

      // 移动到子节点（继续处理下一个字符）
      node = node.children.get(char)!;
    }

    // 标记单词结尾
    // 这样即使 "app" 和 "apple" 都存在，也能正确区分
    node.isEnd = true;
  }

  /**
   * 搜索 Trie 中是否存在完整的单词
   * @param word 要搜索的单词
   * @returns 如果单词存在返回 true，否则返回 false
   *
   * 注意：必须是完整单词，不能只是前缀
   * 例如：插入了 "apple"，搜索 "app" 返回 false
   */
  search(word: string): boolean {
    const node = this.find(word);
    // 节点存在 且 被标记为单词结尾，才返回 true
    return node !== null && node.isEnd;
  }

  /**
   * 判断 Trie 中是否存在以给定前缀开头的单词
   * @param prefix 要检查的前缀
   * @returns 如果存在以该前缀开头的单词返回 true，否则返回 false
   *
   * 注意：只要前缀路径存在即可，不要求是完整单词
   * 例如：插入了 "apple"，搜索前缀 "app" 返回 true
   */
  startsWith(prefix: string): boolean {
    // 只需要找到对应前缀的节点是否存在，无需检查 isEnd
    return this.find(prefix) !== null;
  }

  /**
   * 查找给定字符串对应的节点（私有辅助方法）
   * @param target 要查找的字符串（可以是完整单词或前缀）
   * @returns 如果找到对应节点返回该节点，否则返回 null
   *
   * 优化说明：使用迭代而非递归
   * - 迭代更简洁直观
   * - 避免递归调用的栈开销
   * - 对于长字符串性能更好
   */
  private find(target: string): TrieNode208 | null {
    let node = this.root;

    // 逐字符遍历目标字符串
    for (const char of target) {
      // 如果当前字符对应的子节点不存在，说明该字符串不在 Trie 中
      if (!node.children.has(char)) {
        return null;
      }
      // 移动到子节点，继续查找下一个字符
      node = node.children.get(char)!;
    }

    // 返回找到的节点
    // 调用者可以根据需要检查 node.isEnd 来判断是完整单词还是前缀
    return node;
  }
}

/**
 * Your Trie object will be instantiated and called as such:
 * var obj = new Trie()
 * obj.insert(word)
 * var param_2 = obj.search(word)
 * var param_3 = obj.startsWith(prefix)
 */
// @lc code=end
