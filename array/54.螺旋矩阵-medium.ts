/*
 * @lc app=leetcode.cn id=54 lang=typescript
 *
 * [54] 螺旋矩阵
 *
 * https://leetcode.cn/problems/spiral-matrix/description/
 *
 * algorithms
 * Medium (54.25%)
 * Likes:    1995
 * Dislikes: 0
 * Total Accepted:    834.5K
 * Total Submissions: 1.5M
 * Testcase Example:  '[[1,2,3],[4,5,6],[7,8,9]]'
 *
 * 给你一个 m 行 n 列的矩阵 matrix ，请按照 顺时针螺旋顺序 ，返回矩阵中的所有元素。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：matrix = [[1,2,3],[4,5,6],[7,8,9]]
 * 输出：[1,2,3,6,9,8,7,4,5]
 *
 *
 * 示例 2：
 *
 *
 * 输入：matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
 * 输出：[1,2,3,4,8,12,11,10,9,5,6,7]
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == matrix.length
 * n == matrix[i].length
 * 1
 * -100
 *
 *
 */

// @lc code=start
function spiralOrder(matrix: number[][]): number[] {
  // 边界情况：如果矩阵为空，直接返回空数组
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  // 获取矩阵的行数和列数
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 定义四个边界：上、下、左、右
  let top = 0; // 上边界（第一行）
  let bottom = rows - 1; // 下边界（最后一行）
  let left = 0; // 左边界（第一列）
  let right = cols - 1; // 右边界（最后一列）

  // 存储结果的数组
  const result: number[] = [];

  // 当还有元素未遍历时继续循环
  while (top <= bottom && left <= right) {
    // 第一步：从左到右遍历上边界
    // 遍历范围：从left到right（包含right）
    for (let col = left; col <= right; col++) {
      result.push(matrix[top][col]);
    }
    top++; // 上边界向下移动一行

    // 第二步：从上到下遍历右边界
    // 遍历范围：从top到bottom（包含bottom）
    for (let row = top; row <= bottom; row++) {
      result.push(matrix[row][right]);
    }
    right--; // 右边界向左移动一列

    // 第三步：从右到左遍历下边界（如果还有行的话）
    // 检查条件：确保还有行可以遍历
    if (top <= bottom) {
      // 遍历范围：从right到left（包含left）
      for (let col = right; col >= left; col--) {
        result.push(matrix[bottom][col]);
      }
      bottom--; // 下边界向上移动一行
    }

    // 第四步：从下到上遍历左边界（如果还有列的话）
    // 检查条件：确保还有列可以遍历
    if (left <= right) {
      // 遍历范围：从bottom到top（包含top）
      for (let row = bottom; row >= top; row--) {
        result.push(matrix[row][left]);
      }
      left++; // 左边界向右移动一列
    }
  }

  return result;
}
// @lc code=end
