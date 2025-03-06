/*
 * @lc app=leetcode.cn id=200 lang=typescript
 *
 * [200] 岛屿数量
 */

// @lc code=start
function numIslands(grid: string[][]): number {
  const m = grid.length;
  const n = grid[0].length;

  const dfs = (i: number, j: number) => {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === "0") {
      return;
    }
    grid[i][j] = "0";
    dfs(i, j - 1);
    dfs(i + 1, j);
    dfs(i, j + 1);
    dfs(i - 1, j);
  };
  let count = 0;

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1") {
        count++;
        dfs(i, j);
      }
    }
  }

  return count;
}
// @lc code=end
