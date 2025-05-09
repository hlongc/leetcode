/*
 * @lc app=leetcode.cn id=221 lang=typescript
 *
 * [221] 最大正方形
 */

// @lc code=start
function maximalSquare1(matrix: string[][]): number {
  // 特殊情况处理：如果矩阵为空，直接返回0
  if (matrix.length === 0 || matrix[0].length === 0) return 0;

  // 获取矩阵的行数和列数
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 创建dp数组，dp[i][j]表示以(i,j)为右下角的最大正方形的边长
  // 初始化为0
  const dp: number[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  // 记录最大正方形的边长
  let maxSide = 0;

  // 遍历矩阵的每个位置
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // 如果当前位置是'1'，则可以形成正方形
      if (matrix[i][j] === "1") {
        // 处理边界情况：第一行或第一列
        if (i === 0 || j === 0) {
          dp[i][j] = 1; // 边长为1的正方形
        } else {
          // 核心状态转移方程：取左、上、左上三个位置的最小值加1
          // 这是因为一个正方形的边长由其三个方向的最小可能值决定
          dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
        // 更新最大边长
        maxSide = Math.max(maxSide, dp[i][j]);
      }
      // 如果当前位置是'0'，dp[i][j]默认为0，不需要额外处理
    }
  }

  // 返回最大正方形的面积（边长的平方）
  return maxSide * maxSide;
}

/**
 * 空间优化版本的最大正方形解法
 * 使用一维数组代替二维数组，将空间复杂度从O(m*n)优化到O(n)
 */
function maximalSquare(matrix: string[][]): number {
  // 特殊情况处理：如果矩阵为空，直接返回0
  if (matrix.length === 0 || matrix[0].length === 0) return 0;

  // 获取矩阵的行数和列数
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 创建一维dp数组，长度为列数cols
  // dp[j]表示当前行中，以位置(i,j)为右下角的最大正方形的边长
  const dp: number[] = new Array(cols).fill(0);

  // 记录最大正方形的边长
  let maxSide = 0;
  // 用于保存左上角的值（即dp[i-1][j-1]）
  let prev = 0;

  // 遍历矩阵的每个位置
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // 在处理每列之前，保存当前dp[j]的值作为下一个位置的左上角值
      const temp = dp[j];

      // 如果当前位置是'1'，则可以形成正方形
      if (matrix[i][j] === "1") {
        // 处理边界情况：第一行或第一列
        if (i === 0 || j === 0) {
          dp[j] = 1; // 边长为1的正方形
        } else {
          // 核心状态转移方程：
          // dp[j]已经包含了上方值(dp[i-1][j])
          // dp[j-1]是左边的值(dp[i][j-1])
          // prev是左上角的值(dp[i-1][j-1])
          dp[j] = Math.min(dp[j], dp[j - 1], prev) + 1;
        }
        // 更新最大边长
        maxSide = Math.max(maxSide, dp[j]);
      } else {
        // 如果当前位置是'0'，则不能形成正方形
        dp[j] = 0;
      }

      // 更新prev为当前处理位置的原值，为下一个位置做准备
      prev = temp;
    }
  }

  // 返回最大正方形的面积（边长的平方）
  return maxSide * maxSide;
}
// @lc code=end
