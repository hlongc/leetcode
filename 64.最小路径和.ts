/*
 * @lc app=leetcode.cn id=64 lang=typescript
 *
 * [64] 最小路径和
 */

// @lc code=start
/**
 * 解法一：二维动态规划
 * 使用二维数组存储到达每个位置的最小路径和
 * @param grid 网格，每个单元格包含非负整数
 * @returns 从左上角到右下角的最小路径和
 */
function minPathSum1(grid: number[][]): number {
  // 获取网格的行数和列数
  const m = grid.length;
  const n = grid[0].length;

  // 创建二维DP数组，dp[i][j]表示从起点到位置(i,j)的最小路径和
  const dp: number[][] = Array.from({ length: m }).map(() => Array(n).fill(0));

  // 初始化起点位置的值
  dp[0][0] = grid[0][0];

  // 初始化第一列：每个位置只能从其上方的位置到达
  for (let i = 1; i < m; i++) {
    dp[i][0] = dp[i - 1][0] + grid[i][0];
  }

  // 初始化第一行：每个位置只能从其左侧的位置到达
  for (let j = 1; j < n; j++) {
    dp[0][j] = dp[0][j - 1] + grid[0][j];
  }

  // 填充DP数组的其余部分
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      // 状态转移方程：当前位置的最小路径和 = 当前位置的值 + min(上方位置的最小路径和, 左侧位置的最小路径和)
      dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // 返回右下角位置的最小路径和
  return dp[m - 1][n - 1];
}

/**
 * 解法二：一维动态规划（空间优化）
 * 使用一维数组优化空间复杂度
 * @param grid 网格，每个单元格包含非负整数
 * @returns 从左上角到右下角的最小路径和
 */
function minPathSum(grid: number[][]): number {
  // 获取网格的行数和列数
  const m = grid.length;
  const n = grid[0].length;

  // 创建一维DP数组，dp[j]表示当前行中，到达第j列的最小路径和
  const dp: number[] = Array(n).fill(0);

  // 初始化DP数组的第一个元素（起点）
  dp[0] = grid[0][0];

  // 初始化第一行：每个位置只能从其左侧位置到达
  for (let j = 1; j < n; j++) {
    dp[j] = dp[j - 1] + grid[0][j];
  }

  // 逐行更新DP数组
  for (let i = 1; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (j === 0) {
        // 第一列的特殊处理：只能从上方到达
        dp[j] += grid[i][j];
      } else {
        // 其他位置：可以从上方或左侧到达，选择路径和较小的方向
        // dp[j]在更新前保存的是上一行同列的最小路径和
        // dp[j-1]是当前行左侧列的最小路径和
        dp[j] = grid[i][j] + Math.min(dp[j], dp[j - 1]);
      }
    }
  }

  // 返回数组最后一个元素，即到达右下角的最小路径和
  return dp[n - 1];
}
// @lc code=end
