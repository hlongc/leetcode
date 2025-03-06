/*
 * @lc app=leetcode.cn id=695 lang=typescript
 *
 * [695] 岛屿的最大面积
 */

// @lc code=start
function maxAreaOfIsland(grid: number[][]): number {
  let max = 0;
  const m = grid.length;
  const n = grid[0].length;

  const dfs = (i: number, j: number) => {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === 0) {
      return 0;
    }

    let area = 1;
    grid[i][j] = 0;
    area += dfs(i - 1, j);
    area += dfs(i, j + 1);
    area += dfs(i + 1, j);
    area += dfs(i, j - 1);

    return area;
  };

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) {
        max = Math.max(max, dfs(i, j));
      }
    }
  }

  return max;
}
// @lc code=end
