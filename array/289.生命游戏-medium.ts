/*
 * @lc app=leetcode.cn id=289 lang=typescript
 *
 * [289] 生命游戏
 *
 * https://leetcode.cn/problems/game-of-life/description/
 *
 * algorithms
 * Medium (77.35%)
 * Likes:    684
 * Dislikes: 0
 * Total Accepted:    158.5K
 * Total Submissions: 205K
 * Testcase Example:  '[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]'
 *
 * 根据 百度百科 ， 生命游戏 ，简称为 生命 ，是英国数学家约翰·何顿·康威在 1970 年发明的细胞自动机。
 *
 * 给定一个包含 m × n 个格子的面板，每一个格子都可以看成是一个细胞。每个细胞都具有一个初始状态： 1 即为 活细胞 （live），或 0 即为
 * 死细胞 （dead）。每个细胞与其八个相邻位置（水平，垂直，对角线）的细胞都遵循以下四条生存定律：
 *
 *
 * 如果活细胞周围八个位置的活细胞数少于两个，则该位置活细胞死亡；
 * 如果活细胞周围八个位置有两个或三个活细胞，则该位置活细胞仍然存活；
 * 如果活细胞周围八个位置有超过三个活细胞，则该位置活细胞死亡；
 * 如果死细胞周围正好有三个活细胞，则该位置死细胞复活；
 *
 *
 * 下一个状态是通过将上述规则同时应用于当前状态下的每个细胞所形成的，其中细胞的出生和死亡是 同时 发生的。给你 m x n 网格面板 board
 * 的当前状态，返回下一个状态。
 *
 * 给定当前 board 的状态，更新 board 到下一个状态。
 *
 * 注意 你不需要返回任何东西。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：board = [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]
 * 输出：[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：board = [[1,1],[1,0]]
 * 输出：[[1,1],[1,1]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == board.length
 * n == board[i].length
 * 1 <= m, n <= 25
 * board[i][j] 为 0 或 1
 *
 *
 *
 *
 * 进阶：
 *
 *
 * 你可以使用原地算法解决本题吗？请注意，面板上所有格子需要同时被更新：你不能先更新某些格子，然后使用它们的更新后的值再更新其他格子。
 * 本题中，我们使用二维数组来表示面板。原则上，面板是无限的，但当活细胞侵占了面板边界时会造成问题。你将如何解决这些问题？
 *
 *
 */

// @lc code=start
/**
 Do not return anything, modify board in-place instead.
 */
function gameOfLife(board: number[][]): void {
  const m = board.length; // 行数
  const n = board[0].length; // 列数

  // 定义八个方向的偏移量（上下左右和四个对角线方向）
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1], // 上一行的三个位置
    [0, -1],
    [0, 1], // 当前行的左右两个位置
    [1, -1],
    [1, 0],
    [1, 1], // 下一行的三个位置
  ];

  // 辅助函数：计算指定位置周围活细胞的数量
  function countLiveNeighbors(row: number, col: number): number {
    let count = 0;

    // 遍历八个方向
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      // 检查边界条件
      if (newRow >= 0 && newRow < m && newCol >= 0 && newCol < n) {
        // 注意：这里需要检查原始状态，而不是已经修改过的状态
        // 由于我们使用特殊值来标记状态变化，需要特殊处理
        if (board[newRow][newCol] === 1 || board[newRow][newCol] === -1) {
          count++;
        }
      }
    }

    return count;
  }

  // 第一遍遍历：根据规则标记状态变化
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const liveNeighbors = countLiveNeighbors(i, j);
      const currentCell = board[i][j];

      // 应用生命游戏规则
      if (currentCell === 1) {
        // 当前是活细胞
        if (liveNeighbors < 2 || liveNeighbors > 3) {
          // 规则1和3：活细胞死亡
          // 使用 -1 表示：原来是活细胞(1)，现在要变成死细胞(0)
          board[i][j] = -1;
        }
        // 规则2：活细胞继续存活，保持 1 不变
      } else {
        // 当前是死细胞
        if (liveNeighbors === 3) {
          // 规则4：死细胞复活
          // 使用 2 表示：原来是死细胞(0)，现在要变成活细胞(1)
          board[i][j] = 2;
        }
        // 其他情况死细胞保持死亡，保持 0 不变
      }
    }
  }

  // 第二遍遍历：将标记的状态转换为最终状态
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === -1) {
        // -1 表示原来是活细胞，现在变成死细胞
        board[i][j] = 0;
      } else if (board[i][j] === 2) {
        // 2 表示原来是死细胞，现在变成活细胞
        board[i][j] = 1;
      }
      // 其他情况（0 和 1）保持不变
    }
  }
}
// @lc code=end
