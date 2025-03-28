/*
 * @lc app=leetcode.cn id=79 lang=typescript
 *
 * [79] 单词搜索
 */

// @lc code=start
function exist(board: string[][], word: string): boolean {
  const m = board.length;
  const n = board[0].length;

  const used: boolean[][] = new Array(m)
    .fill(false)
    .map(() => new Array(n).fill(false));

  const dfs = (row: number, col: number, index: number) => {
    if (index === word.length) {
      return true;
    }
    if (row < 0 || row >= m || col < 0 || col >= n) return false;
    if (board[row][col] !== word[index] || used[row][col]) return false;
    used[row][col] = true;
    const ret =
      dfs(row - 1, col, index + 1) ||
      dfs(row, col + 1, index + 1) ||
      dfs(row + 1, col, index + 1) ||
      dfs(row, col - 1, index + 1);
    if (ret) return true;
    used[row][col] = false;
  };

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (dfs(i, j, 0)) {
        return true;
      }
    }
  }

  return false;
}
// @lc code=end
