/*
 * @lc app=leetcode.cn id=677 lang=typescript
 *
 * [677] 键值映射
 *
 * https://leetcode.cn/problems/map-sum-pairs/description/
 *
 * algorithms
 * Medium (65.24%)
 * Likes:    263
 * Dislikes: 0
 * Total Accepted:    55.2K
 * Total Submissions: 84.7K
 * Testcase Example:  '["MapSum","insert","sum","insert","sum"]\n' +
  '[[],["apple",3],["ap"],["app",2],["ap"]]'
 *
 * 设计一个 map ，满足以下几点:
 * 
 * 
 * 字符串表示键，整数表示值
 * 返回具有前缀等于给定字符串的键的值的总和
 * 
 * 
 * 实现一个 MapSum 类：
 * 
 * 
 * MapSum() 初始化 MapSum 对象
 * void insert(String key, int val) 插入 key-val 键值对，字符串表示键 key ，整数表示值 val 。如果键
 * key 已经存在，那么原来的键值对 key-value 将被替代成新的键值对。
 * int sum(string prefix) 返回所有以该前缀 prefix 开头的键 key 的值的总和。
 * 
 * 
 * 
 * 
 * 示例 1：
 * 
 * 
 * 输入：
 * ["MapSum", "insert", "sum", "insert", "sum"]
 * [[], ["apple", 3], ["ap"], ["app", 2], ["ap"]]
 * 输出：
 * [null, null, 3, null, 5]
 * 
 * 解释：
 * MapSum mapSum = new MapSum();
 * mapSum.insert("apple", 3);  
 * mapSum.sum("ap");           // 返回 3 (apple = 3)
 * mapSum.insert("app", 2);    
 * mapSum.sum("ap");           // 返回 5 (apple + app = 3 + 2 = 5)
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 1 <= key.length, prefix.length <= 50
 * key 和 prefix 仅由小写英文字母组成
 * 1 <= val <= 1000
 * 最多调用 50 次 insert 和 sum
 * 
 * 
 */

// @lc code=start

/**
 * Trie 树节点类（用于键值映射）
 */
class TrieNode677 {
  // 子节点映射
  children: Map<string, TrieNode677>;

  // 存储键对应的值
  // 如果当前节点是某个 key 的结尾，val 存储对应的值；否则为 null
  val: number | null;

  constructor() {
    this.children = new Map();
    this.val = null;
  }
}

/**
 * 键值映射（MapSum）
 *
 * 核心思路：Trie（字典树）+ DFS 遍历
 *
 * 功能：
 * 1. insert(key, val)：插入或更新键值对
 * 2. sum(prefix)：返回所有以 prefix 开头的键的值的总和
 *
 * 算法设计：
 * - 使用 Trie 存储所有的键
 * - 在每个键的结尾节点存储对应的值
 * - 求和时：先定位到前缀节点，然后 DFS 遍历所有子树，累加所有值
 *
 * 示例：
 * insert("apple", 3)
 * insert("app", 2)
 *
 * Trie 结构：
 *       root
 *        |
 *        a
 *        |
 *        p
 *        |
 *        p [val=2]  ← "app" 的值
 *        |
 *        l
 *        |
 *        e [val=3]  ← "apple" 的值
 *
 * sum("ap") = 2 + 3 = 5
 *
 * 时间复杂度：
 *   - insert: O(L)，L 为 key 的长度
 *   - sum: O(L + N)，L 为 prefix 长度，N 为以该前缀开头的键的总字符数
 * 空间复杂度：O(N*L)，N 为键的数量，L 为键的平均长度
 */
class MapSum {
  private root: TrieNode677;

  constructor() {
    this.root = new TrieNode677();
  }

  /**
   * 插入或更新键值对
   * @param key 键
   * @param val 值
   *
   * 如果 key 已存在，更新其值；否则插入新键值对
   */
  insert(key: string, val: number): void {
    // 从根节点开始
    let node = this.root;

    // 逐字符插入 key
    for (const char of key) {
      // 如果当前字符对应的子节点不存在，创建新节点
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode677());
      }
      // 移动到子节点
      node = node.children.get(char)!;
    }

    // 在 key 的结尾节点存储值
    node.val = val;
  }

  /**
   * 返回所有以 prefix 开头的键的值的总和
   * @param prefix 前缀
   * @returns 值的总和
   *
   * 算法步骤：
   * 1. 先在 Trie 中定位到前缀的结尾节点
   * 2. 从该节点开始，DFS 遍历整个子树
   * 3. 累加所有节点中存储的值
   */
  sum(prefix: string): number {
    // 第一步：定位到前缀的结尾节点
    let node = this.root;

    // 逐字符匹配前缀
    for (const char of prefix) {
      // 如果前缀不存在，返回 0
      if (!node.children.has(char)) {
        return 0;
      }
      // 移动到下一个节点
      node = node.children.get(char)!;
    }

    // 第二步：从前缀节点开始，DFS 遍历子树，累加所有值
    return this.dfs(node);
  }

  /**
   * DFS 遍历子树，累加所有节点的值
   * @param node 当前节点
   * @returns 子树中所有值的总和
   *
   * 优化说明：
   * - 使用 DFS 递归比 BFS 队列更简洁
   * - 代码更清晰，栈开销可以忽略（前缀最多50字符）
   */
  private dfs(node: TrieNode677): number {
    // 初始化当前节点的值（如果存在）
    let sum = node.val !== null ? node.val : 0;

    // 递归遍历所有子节点，累加子树的值
    for (const [, child] of node.children) {
      sum += this.dfs(child);
    }

    return sum;
  }
}

/**
 * Your MapSum object will be instantiated and called as such:
 * var obj = new MapSum()
 * obj.insert(key,val)
 * var param_2 = obj.sum(prefix)
 */
// @lc code=end
