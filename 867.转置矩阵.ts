/*
 * @lc app=leetcode.cn id=867 lang=typescript
 *
 * [867] 转置矩阵
 *
 * 题目描述：
 * 给你一个二维整数数组 matrix，返回 matrix 的 转置矩阵 。
 * 矩阵的 转置 是指将矩阵的主对角线翻转，交换矩阵的行索引与列索引。
 */

// @lc code=start
/**
 * 返回矩阵的转置
 *
 * @param matrix 输入的二维矩阵
 * @returns 转置后的矩阵
 */
function transpose(matrix: number[][]): number[][] {
  // 获取原矩阵的行数和列数
  const m = matrix.length; // 原矩阵的行数
  const n = matrix[0].length; // 原矩阵的列数

  // 创建一个新的矩阵，尺寸为 n×m（注意行列互换）
  // 转置后，原矩阵的列变成了行，原矩阵的行变成了列
  const result: number[][] = Array(n)
    .fill(0)
    .map(() => Array(m).fill(0));

  // 遍历原矩阵的每个元素
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      // 将原矩阵中位置 (i,j) 的元素放到新矩阵的 (j,i) 位置
      // 这就是转置操作的核心：行列索引互换
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}
// @lc code=end
