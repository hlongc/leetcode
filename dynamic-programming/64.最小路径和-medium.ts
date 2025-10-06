/*
 * @lc app=leetcode.cn id=64 lang=typescript
 *
 * [64] 最小路径和
 *
 * https://leetcode.cn/problems/minimum-path-sum/description/
 *
 * algorithms
 * Medium (72.31%)
 * Likes:    1862
 * Dislikes: 0
 * Total Accepted:    848.9K
 * Total Submissions: 1.2M
 * Testcase Example:  '[[1,3,1],[1,5,1],[4,2,1]]'
 *
 * 给定一个包含非负整数的 m x n 网格 grid ，请找出一条从左上角到右下角的路径，使得路径上的数字总和为最小。
 *
 * 说明：每次只能向下或者向右移动一步。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：grid = [[1,3,1],[1,5,1],[4,2,1]]
 * 输出：7
 * 解释：因为路径 1→3→1→1→1 的总和最小。
 *
 *
 * 示例 2：
 *
 *
 * 输入：grid = [[1,2,3],[4,5,6]]
 * 输出：12
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == grid.length
 * n == grid[i].length
 * 1 <= m, n <= 200
 * 0 <= grid[i][j] <= 200
 *
 *
 */

// @lc code=start

/**
 * 解法一：二维DP数组（易于理解）
 * 解题思路：
 * 1. 状态定义：dp[i][j] 表示从起点(0,0)到位置(i,j)的最小路径和
 * 2. 状态转移方程：
 *    - dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])
 *    - 即：当前位置的值 + 从上方或左方来的最小路径和
 * 3. 边界条件：
 *    - dp[0][0] = grid[0][0]（起点）
 *    - 第一行：只能从左边来
 *    - 第一列：只能从上边来
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m*n)
 */
function minPathSum2D(grid: number[][]): number {
  const m = grid.length; // 网格的行数
  const n = grid[0].length; // 网格的列数

  // 创建二维DP数组，dp[i][j]表示从(0,0)到(i,j)的最小路径和
  const dp: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(0));

  // 初始化起点
  dp[0][0] = grid[0][0];

  // 初始化第一行：每个位置只能从其左侧位置到达
  for (let j = 1; j < n; j++) {
    dp[0][j] = dp[0][j - 1] + grid[0][j];
  }

  // 初始化第一列：每个位置只能从其上方位置到达
  for (let i = 1; i < m; i++) {
    dp[i][0] = dp[i - 1][0] + grid[i][0];
  }

  // 填充DP数组：从(1,1)开始
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      // 当前位置的最小路径和 = 当前位置的值 + min(从上方来, 从左方来)
      dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // 返回到达右下角的最小路径和
  return dp[m - 1][n - 1];
}

/**
 * 解法二：一维DP数组（空间优化）
 * 解题思路：
 * 1. 由于每次计算dp[i][j]时只需要用到dp[i-1][j]和dp[i][j-1]
 * 2. 我们可以用一维数组dp[j]来保存当前行的状态
 * 3. 在计算第i行时，dp[j]在更新前保存的是第i-1行第j列的值
 * 4. 更新后dp[j]保存的是第i行第j列的值
 *
 * 示例说明（3x3网格）：
 * 网格：[[1,3,1],[1,5,1],[4,2,1]]
 *
 * 第0行处理：dp = [1,4,5]  (只能从左边来)
 * 第1行处理：
 *   j=0: dp[0] = grid[1][0] + dp[0] = 1 + 1 = 2
 *   j=1: dp[1] = grid[1][1] + min(dp[1], dp[0]) = 5 + min(4,2) = 7
 *   j=2: dp[2] = grid[1][2] + min(dp[2], dp[1]) = 1 + min(5,7) = 6
 *   结果：dp = [2,7,6]
 * 第2行处理：
 *   j=0: dp[0] = grid[2][0] + dp[0] = 4 + 2 = 6
 *   j=1: dp[1] = grid[2][1] + min(dp[1], dp[0]) = 2 + min(7,6) = 8
 *   j=2: dp[2] = grid[2][2] + min(dp[2], dp[1]) = 1 + min(6,8) = 7
 *   结果：dp = [6,8,7]
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(n)
 */
function minPathSum(grid: number[][]): number {
  const m = grid.length; // 网格的行数
  const n = grid[0].length; // 网格的列数

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
        // dp[j]在更新前保存的是上一行同列的最小路径和
        dp[j] += grid[i][j];
      } else {
        // 其他位置：可以从上方或左侧到达，选择路径和较小的方向
        // dp[j]在更新前保存的是上一行同列的最小路径和（相当于dp[i-1][j]）
        // dp[j-1]是当前行左侧列的最小路径和（相当于dp[i][j-1]）
        dp[j] = grid[i][j] + Math.min(dp[j], dp[j - 1]);
      }
    }
  }

  // 返回数组最后一个元素，即到达右下角的最小路径和
  return dp[n - 1];
}
// @lc code=end
