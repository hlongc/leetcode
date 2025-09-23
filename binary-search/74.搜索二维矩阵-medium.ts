/*
 * @lc app=leetcode.cn id=74 lang=typescript
 *
 * [74] 搜索二维矩阵
 *
 * https://leetcode.cn/problems/search-a-2d-matrix/description/
 *
 * algorithms
 * Medium (50.93%)
 * Likes:    1038
 * Dislikes: 0
 * Total Accepted:    535.5K
 * Total Submissions: 1.1M
 * Testcase Example:  '[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n3'
 *
 * 给你一个满足下述两条属性的 m x n 整数矩阵：
 *
 *
 * 每行中的整数从左到右按非严格递增顺序排列。
 * 每行的第一个整数大于前一行的最后一个整数。
 *
 *
 * 给你一个整数 target ，如果 target 在矩阵中，返回 true ；否则，返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == matrix.length
 * n == matrix[i].length
 * 1 <= m, n <= 100
 * -10^4 <= matrix[i][j], target <= 10^4
 *
 *
 */

// @lc code=start
/**
 * 搜索二维矩阵 - 经典二分查找应用
 *
 * 问题描述：在一个满足特定条件的 m×n 整数矩阵中搜索目标值
 * 矩阵特点：
 * 1. 每行中的整数从左到右按非严格递增顺序排列
 * 2. 每行的第一个整数大于前一行的最后一个整数
 *
 * 核心洞察：
 * 由于矩阵的特殊排列性质，我们可以将其视为一个"展开"的有序数组
 * 例如: [[1,3,5,7],[10,11,16,20]] 可以视为 [1,3,5,7,10,11,16,20]
 *
 * 解题思路：
 * 1. 将二维矩阵映射为一维数组进行二分查找
 * 2. 通过数学公式在一维索引和二维坐标间转换
 * 3. 使用标准二分查找模板
 *
 * 坐标转换公式：
 * - 一维索引 → 二维坐标: row = index / n, col = index % n
 * - 二维坐标 → 一维索引: index = row * n + col
 *
 * 时间复杂度：O(log(m*n)) - 二分查找的对数时间复杂度
 * 空间复杂度：O(1) - 只使用常数额外空间
 */
function searchMatrix(matrix: number[][], target: number): boolean {
  // 获取矩阵的行数和列数
  const rows = matrix.length;
  const cols = matrix[0].length;

  // 二分查找的边界：将二维矩阵视为长度为 rows*cols 的一维数组
  let left = 0;
  let right = rows * cols - 1;

  // 标准二分查找模板
  while (left <= right) {
    // 计算中间位置，使用位运算优化（避免整数溢出）
    const mid = left + Math.floor((right - left) / 2);

    // 核心：将一维索引转换为二维坐标
    const row = Math.floor(mid / cols); // 行号 = 索引 ÷ 列数
    const col = mid % cols; // 列号 = 索引 % 列数

    // 获取中间位置的值
    const midValue = matrix[row][col];

    // 二分查找的三种情况
    if (midValue === target) {
      // 找到目标值
      return true;
    } else if (midValue < target) {
      // 中间值小于目标值，搜索右半部分
      left = mid + 1;
    } else {
      // 中间值大于目标值，搜索左半部分
      right = mid - 1;
    }
  }

  // 遍历完所有可能位置都没找到目标值
  return false;
}

/*
算法详解和示例：

示例矩阵：
[
  [1,  3,  5,  7 ],
  [10, 11, 16, 20],
  [23, 30, 34, 60]
]

将其视为一维数组：[1, 3, 5, 7, 10, 11, 16, 20, 23, 30, 34, 60]
索引对应关系：     0  1  2  3   4   5   6   7   8   9  10  11

搜索 target = 11 的过程：

1. 初始状态：left = 0, right = 11
   mid = 5 → row = 5÷4 = 1, col = 5%4 = 1 → matrix[1][1] = 11
   11 === 11 → 找到目标值，返回 true

搜索 target = 13 的过程：

1. 初始状态：left = 0, right = 11
   mid = 5 → row = 1, col = 1 → matrix[1][1] = 11
   11 < 13 → left = 6

2. left = 6, right = 11
   mid = 8 → row = 8÷4 = 2, col = 8%4 = 0 → matrix[2][0] = 23
   23 > 13 → right = 7

3. left = 6, right = 7
   mid = 6 → row = 6÷4 = 1, col = 6%4 = 2 → matrix[1][2] = 16
   16 > 13 → right = 5

4. left = 6, right = 5 → left > right，结束循环
   返回 false

关键优化点：
1. 修复了原代码的关键错误：right-- 和 left++ 改为正确的 right = mid - 1 和 left = mid + 1
2. 使用 Math.floor() 替代位运算符 ~~，提高代码可读性
3. 添加了详细的变量命名和注释
4. 提供了完整的算法执行示例

原代码的问题：
- right-- 和 left++ 会导致二分查找收敛极慢，时间复杂度退化
- 位运算符 ~~ 可读性差，且在某些边界情况下可能有问题
*/
// @lc code=end
