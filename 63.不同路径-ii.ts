/*
 * @lc app=leetcode.cn id=63 lang=typescript
 *
 * [63] 不同路径 II
 */

// @lc code=start
/**
 * 解法一：二维动态规划
 * 使用二维数组计算有障碍物网格中的不同路径数
 * @param obstacleGrid 包含障碍物的网格（0表示空位，1表示障碍物）
 * @returns 从左上角到右下角的不同路径数
 */
function uniquePathsWithObstacles1(obstacleGrid: number[][]): number {
  // 获取网格的行数和列数
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;

  // 创建动态规划数组，初始化为0
  const dp = Array.from({ length: m }).map(() => Array(n).fill(0));

  // 处理第一列：一旦遇到障碍物，后续位置均无法到达
  let isExist = false; // 标记是否遇到障碍物
  for (let i = 0; i < m; i++) {
    if (obstacleGrid[i][0] === 1) {
      // 遇到障碍物，后续位置均为0
      isExist = true;
    }
    // 如果已遇到障碍物，设为0；否则设为1
    dp[i][0] = isExist ? 0 : 1;
  }

  // 处理第一行：同样，一旦遇到障碍物，后续位置均无法到达
  isExist = false; // 重置标记
  for (let j = 0; j < n; j++) {
    if (obstacleGrid[0][j] === 1) {
      // 遇到障碍物，后续位置均为0
      isExist = true;
    }
    // 如果已遇到障碍物，设为0；否则设为1
    dp[0][j] = isExist ? 0 : 1;
  }

  // 填充dp数组的其余部分
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      // 如果当前位置是障碍物，路径数为0
      // 否则，路径数等于上方格子和左侧格子的路径数之和
      dp[i][j] = obstacleGrid[i][j] === 1 ? 0 : dp[i - 1][j] + dp[i][j - 1];
    }
  }

  // 返回到达右下角的路径数
  return dp[m - 1][n - 1];
}

/**
 * 解法二：一维动态规划（空间优化）
 * 使用一维数组优化空间复杂度
 * @param obstacleGrid 包含障碍物的网格（0表示空位，1表示障碍物）
 * @returns 从左上角到右下角的不同路径数
 */
function uniquePathsWithObstacles(obstacleGrid: number[][]): number {
  // 获取网格的行数和列数
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;

  // 特殊情况处理：起点或终点有障碍物，直接返回0
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
      // 如果当前位置是障碍物，该位置路径数置为0
      if (obstacleGrid[i][j] === 1) {
        dp[j] = 0;
      } else if (j > 0) {
        // 非障碍物且非第一列：当前位置路径数 = 当前位置（上方贡献）+ 左侧位置
        // dp[j]在更新前保存的是上一行同列的路径数
        dp[j] += dp[j - 1];
      }
      // 注意：当j=0（第一列）且非障碍物时，dp[j]保持不变，表示从上方继承
    }
  }

  // 返回到达右下角的路径数
  return dp[n - 1];
}

/**
 * 解法三：更简洁的一维动态规划
 * 减少循环嵌套，代码更加简洁
 * @param obstacleGrid 包含障碍物的网格
 * @returns 从左上角到右下角的不同路径数
 */
function uniquePathsWithObstacles2(obstacleGrid: number[][]): number {
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;

  // 创建DP数组并初始化
  const dp: number[] = Array(n).fill(0);
  // 设置起点值（如果起点不是障碍物）
  dp[0] = obstacleGrid[0][0] === 0 ? 1 : 0;

  // 遍历网格
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      // 如果当前位置是障碍物
      if (obstacleGrid[i][j] === 1) {
        dp[j] = 0;
        continue;
      }

      // 对于第一列之外的位置，更新路径数
      if (j > 0) {
        dp[j] += dp[j - 1];
      }
    }
  }

  return dp[n - 1];
}
// @lc code=end
