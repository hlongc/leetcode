/*
 * @lc app=leetcode.cn id=79 lang=typescript
 *
 * [79] 单词搜索
 *
 * https://leetcode.cn/problems/word-search/description/
 *
 * algorithms
 * Medium (49.79%)
 * Likes:    2064
 * Dislikes: 0
 * Total Accepted:    761.3K
 * Total Submissions: 1.5M
 * Testcase Example:  '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"ABCCED"'
 *
 * 给定一个 m x n 二维字符网格 board 和一个字符串单词 word 。如果 word 存在于网格中，返回 true ；否则，返回 false
 * 。
 *
 * 单词必须按照字母顺序，通过相邻的单元格内的字母构成，其中“相邻”单元格是那些水平相邻或垂直相邻的单元格。同一个单元格内的字母不允许被重复使用。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：board = [['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], word =
 * "ABCCED"
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：board = [['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], word =
 * "SEE"
 * 输出：true
 *
 *
 * 示例 3：
 *
 *
 * 输入：board = [['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], word =
 * "ABCB"
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == board.length
 * n = board[i].length
 * 1 <= m, n <= 6
 * 1 <= word.length <= 15
 * board 和 word 仅由大小写英文字母组成
 *
 *
 *
 *
 * 进阶：你可以使用搜索剪枝的技术来优化解决方案，使其在 board 更大的情况下可以更快解决问题？
 *
 */

// @lc code=start
function exist(board: string[][], word: string): boolean {
  const row = board.length;
  const col = board[0].length;

  /**
   * 深度优先搜索函数
   * @param i 当前行索引
   * @param j 当前列索引
   * @param index 当前匹配的字符索引
   * @returns 是否找到完整单词
   */
  const dfs = (i: number, j: number, index: number): boolean => {
    // 如果已经匹配完所有字符，说明找到了完整单词
    if (index === word.length) return true;

    // 边界检查和字符匹配检查
    if (i < 0 || i >= row || j < 0 || j >= col || board[i][j] !== word[index]) {
      return false;
    }

    // 标记当前单元格为已访问（使用特殊字符标记）
    const temp = board[i][j];
    board[i][j] = "#";

    // 向四个方向递归搜索
    const found =
      dfs(i - 1, j, index + 1) || // 上
      dfs(i, j + 1, index + 1) || // 右
      dfs(i + 1, j, index + 1) || // 下
      dfs(i, j - 1, index + 1); // 左

    // 回溯：恢复原始字符
    board[i][j] = temp;

    return found;
  };

  // 遍历所有可能的起始位置
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      // 如果当前字符匹配单词的第一个字符，开始搜索
      if (board[i][j] === word[0] && dfs(i, j, 0)) {
        return true;
      }
    }
  }

  return false;
}
// @lc code=end
