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
/**
 * 在二维有序矩阵中搜索目标值
 *
 * 算法思路：
 * 1. 从矩阵的右上角开始搜索，这是一个关键的观察点
 * 2. 在这个位置，向左数字变小，向下数字变大，形成了决策分支
 * 3. 如果当前元素等于目标值，返回true
 * 4. 如果当前元素大于目标值，则目标值一定在当前元素的左侧，所以向左移动(列索引减1)
 * 5. 如果当前元素小于目标值，则目标值一定在当前元素的下方，所以向下移动(行索引加1)
 * 6. 当行或列索引超出边界时，说明已经搜索完毕但没有找到目标值，返回false
 *
 * 时间复杂度：O(m+n)，其中m是行数，n是列数
 * 空间复杂度：O(1)，只使用了常数级别的额外空间
 *
 * @param matrix - 二维矩阵，满足每行升序、每列升序的特性
 * @param target - 需要搜索的目标值
 * @returns 如果找到目标值返回true，否则返回false
 */
function searchMatrix(matrix: number[][], target: number): boolean {
  // 获取矩阵的行数和列数
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 从右上角开始搜索 (0, cols-1)
  // 这个位置具有特殊性质：向左数字变小，向下数字变大
  let row = 0;
  let col = cols - 1;

  // 当没有超出矩阵边界时继续搜索
  while (row < rows && col >= 0) {
    // 获取当前位置的元素值
    const current = matrix[row][col];

    if (current === target) {
      // 找到目标值，返回true
      return true;
    } else if (current > target) {
      // 当前值大于目标值，说明目标值不可能在当前列及其右侧
      // 因此向左移动一列（减小当前值）
      col--;
    } else {
      // 当前值小于目标值，说明目标值不可能在当前行及其上方
      // 因此向下移动一行（增大当前值）
      row++;
    }
  }

  // 搜索完整个可能区域后仍未找到目标值
  return false;
}
// @lc code=end
