/*
 * @lc app=leetcode.cn id=62 lang=typescript
 *
 * [62] 不同路径
 */

// @lc code=start
/**
 * 解法一：二维动态规划
 * 使用二维数组存储到达每个格子的路径数
 * @param m 网格的行数
 * @param n 网格的列数
 * @returns 从左上角到右下角的不同路径数
 */
function uniquePaths1(m: number, n: number): number {
  // 创建一个m×n的二维数组，初始值为1
  const dp: number[][] = Array.from({ length: m }).map(() => Array(n).fill(1));

  // 初始化第一列的值为1（只能从上方到达）
  for (let i = 0; i < m; i++) {
    dp[i][0] = 1;
  }

  // 初始化第一行的值为1（只能从左侧到达）
  for (let j = 0; j < n; j++) {
    dp[0][j] = 1;
  }

  // 填充dp数组，从(1,1)开始
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      // 状态转移方程：到达当前格子的路径数 = 从上方到达的路径数 + 从左侧到达的路径数
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
  }

  // 返回到达右下角的路径数
  return dp[m - 1][n - 1];
}

/**
 * 解法二：一维动态规划（空间优化）
 * 由于每个格子的值只依赖于上方和左侧的格子，可以使用一维数组节省空间
 * @param m 网格的行数
 * @param n 网格的列数
 * @returns 从左上角到右下角的不同路径数
 */
function uniquePaths(m: number, n: number): number {
  // 创建一个长度为n的一维数组，表示当前行的每个位置的路径数
  // 初始化为1，因为第一行的所有位置路径数都是1
  const dp: number[] = Array(n).fill(1);

  // 从第二行开始逐行更新dp数组
  for (let i = 1; i < m; i++) {
    // 从第二列开始更新，第一列永远是1
    for (let j = 1; j < n; j++) {
      // dp[j]在更新前表示上方格子的路径数，dp[j-1]表示左侧格子的路径数
      // 状态转移方程：dp[j] = dp[j] + dp[j-1]
      dp[j] += dp[j - 1];
    }
  }

  // 数组最后一个元素就是到达右下角的路径数
  return dp[n - 1];
}

/**
 * 解法三：数学组合公式（最优解）
 * 从左上角到右下角，需要向下移动m-1次，向右移动n-1次，总共移动m+n-2次
 * 问题转化为：在m+n-2次移动中选择m-1次向下移动的方案数，即组合数C(m+n-2, m-1)
 * @param m 网格的行数
 * @param n 网格的列数
 * @returns 从左上角到右下角的不同路径数
 */
function uniquePaths3(m: number, n: number): number {
  // 计算组合数C(m+n-2, min(m-1, n-1))
  // 选择较小的值作为组合公式中的k可以减少计算量
  const k = Math.min(m - 1, n - 1);
  const total = m + n - 2;

  let result = 1;

  // 计算组合数C(total, k) = total! / (k! * (total-k)!)
  // 为避免计算阶乘导致的溢出，使用乘法和除法交替进行
  for (let i = 1; i <= k; i++) {
    // 先乘后除，避免浮点数精度问题
    result = (result * (total - k + i)) / i;
  }

  return Math.round(result); // 使用Math.round处理可能的浮点数精度问题
}
// @lc code=end
