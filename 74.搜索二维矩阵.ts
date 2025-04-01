/*
 * @lc app=leetcode.cn id=74 lang=typescript
 *
 * [74] 搜索二维矩阵
 *
 * 编写一个高效的算法来判断 m x n 矩阵中，是否存在一个目标值。
 * 该矩阵具有以下特性：
 * - 每行中的整数从左到右按升序排列
 * - 每行的第一个整数大于前一行的最后一个整数
 */

// @lc code=start
function searchMatrix(matrix: number[][], target: number): boolean {
  // 获取矩阵的行数和列数
  const m = matrix.length;
  const n = matrix[0].length;

  // 将二维矩阵视为一维有序数组，进行二分查找
  // 一维数组的长度为 m*n
  let left = 0,
    right = m * n - 1;

  // 标准二分查找过程
  while (left <= right) {
    // 计算中间位置
    const mid = left + ((right - left) >> 1);

    // 关键步骤：将一维索引转换为二维矩阵的坐标
    // 行索引 = 一维索引 / 列数（取整）
    const row = Math.floor(mid / n);
    // 列索引 = 一维索引 % 列数（取余）
    const column = mid % n;

    // 比较目标值与中间元素
    if (matrix[row][column] === target) {
      return true; // 找到目标值
    } else if (matrix[row][column] > target) {
      // 中间值大于目标值，在左半部分继续查找
      right = mid - 1;
    } else {
      // 中间值小于目标值，在右半部分继续查找
      left = mid + 1;
    }
  }

  // 循环结束仍未找到，返回false
  return false;
}
// @lc code=end
