/*
 * @lc app=leetcode.cn id=63 lang=typescript
 *
 * [63] 不同路径 II
 *
 * https://leetcode.cn/problems/unique-paths-ii/description/
 *
 * algorithms
 * Medium (42.40%)
 * Likes:    1444
 * Dislikes: 0
 * Total Accepted:    663.7K
 * Total Submissions: 1.6M
 * Testcase Example:  '[[0,0,0],[0,1,0],[0,0,0]]'
 *
 * 给定一个 m x n 的整数数组 grid。一个机器人初始位于 左上角（即 grid[0][0]）。机器人尝试移动到 右下角（即 grid[m -
 * 1][n - 1]）。机器人每次只能向下或者向右移动一步。
 *
 * 网格中的障碍物和空位置分别用 1 和 0 来表示。机器人的移动路径中不能包含 任何 有障碍物的方格。
 *
 * 返回机器人能够到达右下角的不同路径数量。
 *
 * 测试用例保证答案小于等于 2 * 10^9。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]
 * 输出：2
 * 解释：3x3 网格的正中间有一个障碍物。
 * 从左上角到右下角一共有 2 条不同的路径：
 * 1. 向右 -> 向右 -> 向下 -> 向下
 * 2. 向下 -> 向下 -> 向右 -> 向右
 *
 *
 * 示例 2：
 *
 *
 * 输入：obstacleGrid = [[0,1],[0,0]]
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == obstacleGrid.length
 * n == obstacleGrid[i].length
 * 1 <= m, n <= 100
 * obstacleGrid[i][j] 为 0 或 1
 *
 *
 */

// @lc code=start

/**
 * 空间优化版本：使用一维数组
 * 解题思路：
 * 1. 由于每次计算dp[i][j]时只需要用到dp[i-1][j]和dp[i][j-1]
 * 2. 我们可以用一维数组dp[j]来保存当前行的状态
 * 3. 在计算第i行时，dp[j]在更新前保存的是第i-1行第j列的值
 * 4. 更新后dp[j]保存的是第i行第j列的值
 *
 * 示例说明（3x3网格，中间有障碍物）：
 * 网格：[[0,0,0],[0,1,0],[0,0,0]]
 *
 * 第0行处理：dp = [1,1,1]  (只能从左边来)
 * 第1行处理：
 *   j=0: dp[0]保持1 (从上方继承)
 *   j=1: dp[1] = 0 (障碍物)
 *   j=2: dp[2] = dp[2] + dp[1] = 1 + 0 = 1
 *   结果：dp = [1,0,1]
 * 第2行处理：
 *   j=0: dp[0]保持1 (从上方继承)
 *   j=1: dp[1] = dp[1] + dp[0] = 0 + 1 = 1
 *   j=2: dp[2] = dp[2] + dp[1] = 1 + 1 = 2
 *   结果：dp = [1,1,2]
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(n)
 */
function uniquePathsWithObstacles(obstacleGrid: number[][]): number {
  const m = obstacleGrid.length; // 网格的行数
  const n = obstacleGrid[0].length; // 网格的列数

  // 特殊情况：如果起点或终点有障碍物，无法到达
  if (obstacleGrid[0][0] === 1 || obstacleGrid[m - 1][n - 1] === 1) {
    return 0;
  }

  // 创建一维DP数组，初始值为0
  const dp: number[] = Array(n).fill(0);
  // 设置起点值为1（可到达）
  dp[0] = 1;

  // 逐行扫描网格
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (obstacleGrid[i][j] === 1) {
        // 如果当前位置是障碍物，该位置路径数置为0
        dp[j] = 0;
      } else if (j > 0) {
        // 非障碍物且非第一列：
        // dp[j]在更新前保存的是上一行同列的路径数（相当于dp[i-1][j]）
        // dp[j-1]保存的是当前行前一列的路径数（相当于dp[i][j-1]）
        // 所以：dp[j] = dp[j] + dp[j-1] 等价于 dp[i][j] = dp[i-1][j] + dp[i][j-1]
        dp[j] += dp[j - 1];
      }
      // 注意：当j=0（第一列）且非障碍物时，dp[j]保持不变，表示从上方继承
    }
  }

  // 返回到达右下角的路径数
  return dp[n - 1];
}
// @lc code=end
