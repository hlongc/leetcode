/*
 * @lc app=leetcode.cn id=208 lang=typescript
 *
 * [208] 实现 Trie (前缀树)
 */

// @lc code=start
class Trie {
  // 使用一个Map对象来存储子节点，key是字符，value是对应的节点
  private children: Map<string, Trie>;
  // 用于标记当前节点是否是一个单词的结尾
  private isEnd: boolean;

  constructor() {
    // 初始化子节点Map和结束标记
    this.children = new Map();
    this.isEnd = false;
  }

  /**
   * 插入一个单词到Trie树中
   * @param word 要插入的单词
   */
  insert(word: string): void {
    // 从根节点开始插入
    let node: Trie = this;

    // 遍历单词中的每个字符
    for (const ch of word) {
      // 如果当前节点的子节点中不存在这个字符，就创建一个新节点
      if (!node.children.has(ch)) {
        node.children.set(ch, new Trie());
      }
      // 移动到子节点继续插入
      node = node.children.get(ch)!;
    }

    // 标记单词结束
    node.isEnd = true;
  }

  /**
   * 搜索Trie树中是否存在完整的单词
   * @param word 要搜索的单词
   * @returns 如果单词存在，返回true；否则返回false
   */
  search(word: string): boolean {
    // 获取对应此单词的节点
    const node = this.searchPrefix(word);

    // 如果节点存在且被标记为单词结尾，则返回true
    return node !== null && node.isEnd;
  }

  /**
   * 判断Trie树中是否有以给定前缀开头的单词
   * @param prefix 要检查的前缀
   * @returns 如果存在以该前缀开头的单词，返回true；否则返回false
   */
  startsWith(prefix: string): boolean {
    // 只需要找到对应此前缀的节点是否存在
    return this.searchPrefix(prefix) !== null;
  }

  /**
   * 查找给定字符串对应的节点
   * @param prefix 要查找的字符串
   * @returns 如果找到对应节点，返回该节点；否则返回null
   * @private 私有方法，仅在类内部使用
   */
  private searchPrefix(prefix: string): Trie | null {
    let node: Trie = this;

    // 遍历前缀中的每个字符
    for (const ch of prefix) {
      // 如果当前节点的子节点中不存在这个字符，说明没有对应的前缀
      if (!node.children.has(ch)) {
        return null;
      }
      // 移动到下一个子节点
      node = node.children.get(ch)!;
    }

    // 返回找到的节点
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
