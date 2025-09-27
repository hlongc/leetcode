/*
 * @lc app=leetcode.cn id=130 lang=typescript
 *
 * [130] 被围绕的区域
 *
 * https://leetcode.cn/problems/surrounded-regions/description/
 *
 * algorithms
 * Medium (47.05%)
 * Likes:    1239
 * Dislikes: 0
 * Total Accepted:    345.7K
 * Total Submissions: 730.7K
 * Testcase Example:  '[["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]'
 *
 * 给你一个 m x n 的矩阵 board ，由若干字符 'X' 和 'O' 组成，捕获 所有 被围绕的区域：
 *
 *
 * 连接：一个单元格与水平或垂直方向上相邻的单元格连接。
 * 区域：连接所有 'O' 的单元格来形成一个区域。
 * 围绕：如果您可以用 'X' 单元格 连接这个区域，并且区域中没有任何单元格位于 board 边缘，则该区域被 'X' 单元格围绕。
 *
 *
 * 通过 原地 将输入矩阵中的所有 'O' 替换为 'X' 来 捕获被围绕的区域。你不需要返回任何值。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：board =
 * [['X','X','X','X'],['X','O','O','X'],['X','X','O','X'],['X','O','X','X']]
 *
 *
 * 输出：[['X','X','X','X'],['X','X','X','X'],['X','X','X','X'],['X','O','X','X']]
 *
 * 解释：
 *
 * 在上图中，底部的区域没有被捕获，因为它在 board 的边缘并且不能被围绕。
 *
 *
 * 示例 2：
 *
 *
 * 输入：board = [['X']]
 *
 * 输出：[['X']]
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == board.length
 * n == board[i].length
 * 1 <= m, n <= 200
 * board[i][j] 为 'X' 或 'O'
 *
 *
 *
 *
 */

// @lc code=start
/**
 Do not return anything, modify board in-place instead.
 */
/**
 * 被围绕的区域 - DFS标记法
 * 思路：从边界开始DFS，标记所有与边界相连的'O'，然后翻转剩余的'O'
 *
 * 算法步骤：
 * 1. 从边界开始DFS，将所有与边界相连的'O'标记为特殊字符（如'XO'）
 * 2. 遍历整个矩阵，将剩余的'O'改为'X'，将'XO'改回'O'
 *
 * 时间复杂度：O(m*n)，其中 m 和 n 分别是矩阵的行数和列数
 * 空间复杂度：O(m*n)，DFS递归调用栈的深度
 */
function solve(board: string[][]): void {
  const m = board.length;
  const n = board[0].length;

  /**
   * DFS函数：标记与边界相连的'O'
   * @param row 当前行索引
   * @param col 当前列索引
   */
  const dfs = (row: number, col: number) => {
    // 边界检查：越界或遇到'X'时返回
    if (row < 0 || row >= m || col < 0 || col >= n || board[row][col] === "X") {
      return;
    }

    // 如果当前是'O'，标记为'XO'（表示与边界相连）
    if (board[row][col] === "O") {
      board[row][col] = "XO"; // 标记为与边界相连的'O'

      // 向四个方向递归搜索
      dfs(row - 1, col); // 上
      dfs(row, col + 1); // 右
      dfs(row + 1, col); // 下
      dfs(row, col - 1); // 左
    }
  };

  // 第一步：从边界开始DFS，标记所有与边界相连的'O'
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      // 检查边界位置（第一行、最后一行、第一列、最后一列）
      if (
        (i === 0 || i === m - 1 || j === 0 || j === n - 1) &&
        board[i][j] === "O"
      ) {
        dfs(i, j); // 从边界'O'开始DFS标记
      }
    }
  }

  // 第二步：遍历整个矩阵，翻转字符
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === "O") {
        // 剩余的'O'（被围绕的区域）改为'X'
        board[i][j] = "X";
      } else if (board[i][j] === "XO") {
        // 与边界相连的'O'改回'O'
        board[i][j] = "O";
      }
    }
  }
}

/**
 * 方法二：BFS实现（迭代方式）
 * 思路：使用队列进行广度优先搜索，避免递归调用栈过深
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m*n)，队列存储的节点数
 */
function solveBFS(board: string[][]): void {
  const m = board.length;
  const n = board[0].length;
  const queue: [number, number][] = [];

  // 第一步：找到所有边界上的'O'，加入队列
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (
        (i === 0 || i === m - 1 || j === 0 || j === n - 1) &&
        board[i][j] === "O"
      ) {
        queue.push([i, j]);
        board[i][j] = "XO"; // 标记为与边界相连
      }
    }
  }

  // 第二步：BFS处理队列中的节点
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]; // 上下左右四个方向

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;

    // 检查四个方向的相邻节点
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      // 边界检查和字符检查
      if (
        newRow >= 0 &&
        newRow < m &&
        newCol >= 0 &&
        newCol < n &&
        board[newRow][newCol] === "O"
      ) {
        board[newRow][newCol] = "XO"; // 标记为与边界相连
        queue.push([newRow, newCol]); // 加入队列继续处理
      }
    }
  }

  // 第三步：翻转字符
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === "O") {
        board[i][j] = "X";
      } else if (board[i][j] === "XO") {
        board[i][j] = "O";
      }
    }
  }
}
// @lc code=end
