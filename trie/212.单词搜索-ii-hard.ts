/*
 * @lc app=leetcode.cn id=212 lang=typescript
 *
 * [212] 单词搜索 II
 *
 * https://leetcode.cn/problems/word-search-ii/description/
 *
 * algorithms
 * Hard (43.40%)
 * Likes:    959
 * Dislikes: 0
 * Total Accepted:    134K
 * Total Submissions: 308.9K
 * Testcase Example:  '[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]]\n' +
  '["oath","pea","eat","rain"]'
 *
 * 给定一个 m x n 二维字符网格 board 和一个单词（字符串）列表 words， 返回所有二维网格上的单词 。
 * 
 * 单词必须按照字母顺序，通过 相邻的单元格
 * 内的字母构成，其中“相邻”单元格是那些水平相邻或垂直相邻的单元格。同一个单元格内的字母在一个单词中不允许被重复使用。
 * 
 * 
 * 
 * 示例 1：
 * 
 * 
 * 输入：board =
 * [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]],
 * words = ["oath","pea","eat","rain"]
 * 输出：["eat","oath"]
 * 
 * 
 * 示例 2：
 * 
 * 
 * 输入：board = [["a","b"],["c","d"]], words = ["abcb"]
 * 输出：[]
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * m == board.length
 * n == board[i].length
 * 1 <= m, n <= 12
 * board[i][j] 是一个小写英文字母
 * 1 <= words.length <= 3 * 10^4
 * 1 <= words[i].length <= 10
 * words[i] 由小写英文字母组成
 * words 中的所有字符串互不相同
 * 
 * 
 */

// @lc code=start

/**
 * Trie 树节点类（针对单词搜索 II 的特化版本）
 * 用于存储单词的前缀树结构
 */
class TrieNode212 {
  children: Map<string, TrieNode212>;
  // 直接存储完整单词，而不是只用 isEnd 标记
  // 这样找到单词时可以直接获取，无需回溯重建
  word: string | null;

  constructor() {
    this.children = new Map();
    this.word = null;
  }
}

/**
 * 单词搜索 II
 *
 * 核心思路：Trie（字典树）+ DFS（深度优先搜索）+ 回溯
 *
 * 为什么用 Trie？
 * - 暴力法：对每个单词分别 DFS 搜索，时间复杂度 O(words.length × m × n × 4^L)
 * - Trie 法：构建 Trie 后，一次 DFS 可以同时匹配多个单词，共享搜索路径
 *
 * 算法步骤：
 * 1. 将所有单词构建成 Trie 树
 * 2. 从棋盘的每个格子作为起点开始 DFS
 * 3. DFS 过程中同时在 Trie 中进行匹配
 * 4. 如果匹配到完整单词，加入结果集
 * 5. 使用回溯确保每个格子在单次搜索中只使用一次
 *
 * 关键优化：
 * 1. 在 Trie 节点中直接存储完整单词（避免重建）
 * 2. 找到单词后立即从 Trie 中删除（避免重复）
 * 3. 使用原地标记代替 visited 数组（节省空间）
 * 4. 剪枝：如果节点没有子节点，提前返回
 *
 * 示例：
 * board = [["o","a","a","n"],
 *          ["e","t","a","e"],
 *          ["i","h","k","r"],
 *          ["i","f","l","v"]]
 * words = ["oath","pea","eat","rain"]
 *
 * 构建 Trie：
 *       root
 *      / | \ \
 *     o  p  e  r
 *     |  |  |  |
 *     a  e  a  a
 *     |  |  |  |
 *     t  a  t* i
 *     |        |
 *     h*       n*
 *
 * 时间复杂度：O(m×n×4^L + W×L)
 *   - 构建 Trie：O(W×L)，W 为单词数，L 为单词平均长度
 *   - DFS 搜索：O(m×n×4^L)，每个格子最多向4个方向搜索L层
 * 空间复杂度：O(W×L)，Trie 树的空间
 */
function findWords(board: string[][], words: string[]): string[] {
  // 结果数组
  const result: string[] = [];

  // 边界检查
  if (!board || board.length === 0 || !words || words.length === 0) {
    return result;
  }

  const m = board.length; // 行数
  const n = board[0].length; // 列数

  // 第一步：构建 Trie 树
  const root = buildTrie(words);

  // 第二步：从每个格子开始 DFS 搜索
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      // 从 (i, j) 位置开始，尝试匹配 Trie 中的单词
      dfs(board, i, j, root, result);
    }
  }

  return result;
}

/**
 * 构建 Trie 树
 * @param words 单词列表
 * @returns Trie 树的根节点
 */
function buildTrie(words: string[]): TrieNode212 {
  const root = new TrieNode212();

  // 将每个单词插入 Trie
  for (const word of words) {
    let node = root;

    // 逐字符插入
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode212());
      }
      node = node.children.get(char)!;
    }

    // 在叶子节点存储完整单词
    // 这样找到时可以直接使用，无需重建
    node.word = word;
  }

  return root;
}

/**
 * DFS 深度优先搜索 + 回溯
 * @param board 二维字符网格
 * @param i 当前行坐标
 * @param j 当前列坐标
 * @param node 当前 Trie 节点
 * @param result 结果数组
 */
function dfs(
  board: string[][],
  i: number,
  j: number,
  node: TrieNode212,
  result: string[]
): void {
  const m = board.length;
  const n = board[0].length;

  // 边界检查：越界或已访问
  if (i < 0 || i >= m || j < 0 || j >= n) {
    return;
  }

  const char = board[i][j];

  // 检查当前格子是否已访问（用 '#' 标记）或不在 Trie 中
  if (char === "#" || !node.children.has(char)) {
    return;
  }

  // 移动到 Trie 的下一个节点
  node = node.children.get(char)!;

  // 检查是否找到完整单词
  if (node.word !== null) {
    // 找到单词，加入结果
    result.push(node.word);

    // 重要优化：立即删除，避免重复添加
    // 例如：board 中有多个相同单词的路径
    node.word = null;
  }

  // 优化剪枝：如果当前节点没有子节点，说明没有更长的单词了，直接返回
  if (node.children.size === 0) {
    return;
  }

  // 做选择：标记当前格子为已访问
  board[i][j] = "#";

  // 向四个方向递归搜索
  // 上下左右
  dfs(board, i - 1, j, node, result); // 上
  dfs(board, i + 1, j, node, result); // 下
  dfs(board, i, j - 1, node, result); // 左
  dfs(board, i, j + 1, node, result); // 右

  // 撤销选择（回溯）：恢复当前格子
  board[i][j] = char;
}

// @lc code=end
