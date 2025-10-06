/*
 * @lc app=leetcode.cn id=73 lang=typescript
 *
 * [73] 矩阵置零
 *
 * https://leetcode.cn/problems/set-matrix-zeroes/description/
 *
 * algorithms
 * Medium (71.18%)
 * Likes:    1272
 * Dislikes: 0
 * Total Accepted:    638.5K
 * Total Submissions: 897K
 * Testcase Example:  '[[1,1,1],[1,0,1],[1,1,1]]'
 *
 * 给定一个 m x n 的矩阵，如果一个元素为 0 ，则将其所在行和列的所有元素都设为 0 。请使用 原地 算法。
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：matrix = [[1,1,1],[1,0,1],[1,1,1]]
 * 输出：[[1,0,1],[0,0,0],[1,0,1]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
 * 输出：[[0,0,0,0],[0,4,5,0],[0,3,1,0]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == matrix.length
 * n == matrix[0].length
 * 1 <= m, n <= 200
 * -2^31 <= matrix[i][j] <= 2^31 - 1
 *
 *
 *
 *
 * 进阶：
 *
 *
 * 一个直观的解决方案是使用  O(mn) 的额外空间，但这并不是一个好的解决方案。
 * 一个简单的改进方案是使用 O(m + n) 的额外空间，但这仍然不是最好的解决方案。
 * 你能想出一个仅使用常量空间的解决方案吗？
 *
 *
 */

// @lc code=start
/**
 * 简单易懂的解决方案
 *
 * 解题思路：
 * 1. 第一遍扫描：记录哪些行和列包含0
 * 2. 第二遍扫描：将标记的行和列全部置零
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m+n)
 *
 * 示例说明：
 * 输入：[[1,1,1],[1,0,1],[1,1,1]]
 *
 * 第一遍扫描后：
 * - zeroRows = [1] (第1行包含0)
 * - zeroCols = [1] (第1列包含0)
 *
 * 第二遍扫描后：
 * - 第1行置零：[[1,1,1],[0,0,0],[1,1,1]]
 * - 第1列置零：[[1,0,1],[0,0,0],[1,0,1]]
 *
 * 最终结果：[[1,0,1],[0,0,0],[1,0,1]]
 */
function setZeroes(matrix: number[][]): void {
  const m = matrix.length; // 矩阵的行数
  const n = matrix[0].length; // 矩阵的列数

  // 记录哪些行包含0
  const zeroRows = new Set<number>();
  // 记录哪些列包含0
  const zeroCols = new Set<number>();

  // 第一遍扫描：找出所有包含0的行和列
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] === 0) {
        zeroRows.add(i); // 记录第i行包含0
        zeroCols.add(j); // 记录第j列包含0
      }
    }
  }

  // 第二遍扫描：将标记的行和列全部置零
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      // 如果当前行或列被标记为包含0，则将当前位置置零
      if (zeroRows.has(i) || zeroCols.has(j)) {
        matrix[i][j] = 0;
      }
    }
  }
}
// @lc code=end
