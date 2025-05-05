/*
 * @lc app=leetcode.cn id=211 lang=typescript
 *
 * [211] 添加与搜索单词 - 数据结构设计
 */

// @lc code=start
class TrieNode {
  // 使用Map存储子节点，键为字符，值为子节点
  children: Map<string, TrieNode>;
  // 标记当前节点是否是单词结尾
  isEnd: boolean;

  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

class WordDictionary {
  // Trie树的根节点
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * 添加单词到字典中
   * @param word 要添加的单词
   */
  addWord(word: string): void {
    let node = this.root;

    // 遍历单词的每个字符，将其添加到Trie树中
    for (const ch of word) {
      if (!node.children.has(ch)) {
        // 如果当前字符不存在，创建新节点
        node.children.set(ch, new TrieNode());
      }
      // 移动到下一个节点
      node = node.children.get(ch)!;
    }

    // 标记单词结束
    node.isEnd = true;
  }

  /**
   * 在字典中搜索单词，支持'.'通配符匹配任意字符
   * @param word 要搜索的单词，可包含'.'通配符
   * @returns 如果单词存在于字典中，返回true；否则返回false
   */
  search(word: string): boolean {
    // 使用递归函数处理通配符
    return this.dfs(this.root, word, 0);
  }

  /**
   * 深度优先搜索处理单词匹配，包括通配符
   * @param node 当前节点
   * @param word 要搜索的单词
   * @param index 当前处理的字符索引
   * @returns 是否找到匹配
   */
  private dfs(node: TrieNode, word: string, index: number): boolean {
    // 递归终止条件：已处理完所有字符
    if (index === word.length) {
      // 检查是否是单词结尾
      return node.isEnd;
    }

    const ch = word[index];

    if (ch === ".") {
      // 通配符情况：尝试当前节点的所有子节点
      for (const [, childNode] of node.children) {
        if (this.dfs(childNode, word, index + 1)) {
          return true; // 如果任何一条路径匹配成功，返回true
        }
      }
      return false; // 所有路径都不匹配
    } else {
      // 普通字符：检查是否存在该字符的子节点
      if (!node.children.has(ch)) {
        return false; // 不存在该字符，匹配失败
      }

      // 继续匹配下一个字符
      return this.dfs(node.children.get(ch)!, word, index + 1);
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
