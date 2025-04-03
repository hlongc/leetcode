/*
 * @lc app=leetcode.cn id=240 lang=typescript
 *
 * [240] 搜索二维矩阵 II
 *
 * 编写一个高效的算法来搜索 m x n 矩阵 matrix 中的一个目标值 target。
 * 该矩阵具有以下特性：
 * - 每行的元素从左到右升序排列
 * - 每列的元素从上到下升序排列
 */

// @lc code=start

// 优化解法：从右上角开始搜索
function searchMatrix(matrix: number[][], target: number): boolean {
  // 获取矩阵的行数和列数
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 从右上角开始 (0, cols-1)
  let row = 0;
  let col = cols - 1;

  // 当没有超出矩阵边界时继续搜索
  while (row < rows && col >= 0) {
    // 获取当前元素
    const current = matrix[row][col];

    if (current === target) {
      // 找到目标值
      return true;
    } else if (current > target) {
      // 当前值大于目标值，向左移动（减小当前值）
      col--;
    } else {
      // 当前值小于目标值，向下移动（增大当前值）
      row++;
    }
  }

  // 没有找到目标值
  return false;
}
// @lc code=end
