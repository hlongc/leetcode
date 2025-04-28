/*
 * @lc app=leetcode.cn id=130 lang=typescript
 *
 * [130] 被围绕的区域
 */

// @lc code=start
/**
 * 解决被围绕的区域问题
 * 题目要求：找到所有被'X'围绕的'O'并将其替换为'X'
 * 注意：只有完全被'X'围绕的'O'才需要被替换，边界上的'O'及其相连的'O'不会被替换
 *
 * 解题思路：
 * 1. 从边界上的'O'开始进行DFS/BFS，标记所有与边界相连的'O'
 * 2. 遍历整个矩阵，将未标记的'O'替换为'X'，将标记过的'O'恢复
 *
 * 时间复杂度：O(m*n)，其中m和n分别是矩阵的行数和列数
 * 空间复杂度：O(m*n)，最坏情况下，递归深度为m*n
 *
 * Do not return anything, modify board in-place instead.
 */
function solve(board: string[][]): void {
  // 获取矩阵的行数
  const row = board.length;
  // 如果矩阵为空，直接返回
  if (row === 0) return;
  // 获取矩阵的列数
  const col = board[0].length;

  /**
   * 深度优先搜索函数
   * 作用：标记所有与当前'O'相连的'O'为'NO'(不会被替换的'O')
   * @param i 当前行索引
   * @param j 当前列索引
   */
  const dfs = (i: number, j: number) => {
    // 越界检查：如果坐标超出矩阵范围，直接返回
    if (i < 0 || i >= row || j < 0 || j >= col) return;

    // 如果当前位置是'O'，则将其标记为'NO'(不被替换的'O')
    if (board[i][j] === "O") {
      // 标记为'NO'，表示这个'O'不需要被替换
      board[i][j] = "NO";

      // 递归遍历上、右、下、左四个方向
      dfs(i - 1, j); // 上
      dfs(i, j + 1); // 右
      dfs(i + 1, j); // 下
      dfs(i, j - 1); // 左
    }
  };

  // 第一步：从边界上的'O'开始DFS，标记所有与边界相连的'O'
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      // 检查当前位置是否在边界上，并且值为'O'
      if (
        (i === 0 || i === row - 1 || j === 0 || j === col - 1) &&
        board[i][j] === "O"
      ) {
        // 从边界上的'O'开始DFS
        dfs(i, j);
      }
    }
  }

  // 第二步：遍历整个矩阵，处理'O'和'NO'
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      // 如果是未标记的'O'，说明它被'X'完全包围，替换为'X'
      if (board[i][j] === "O") {
        board[i][j] = "X";
      }
      // 如果是标记过的'NO'，说明它与边界相连，恢复为'O'
      else if (board[i][j] === "NO") {
        board[i][j] = "O";
      }
    }
  }
}
// @lc code=end
