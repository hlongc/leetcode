/*
 * @lc app=leetcode.cn id=59 lang=typescript
 *
 * [59] 螺旋矩阵 II
 *
 * https://leetcode.cn/problems/spiral-matrix-ii/description/
 *
 * algorithms
 * Medium (70.25%)
 * Likes:    1493
 * Dislikes: 0
 * Total Accepted:    576.9K
 * Total Submissions: 821.3K
 * Testcase Example:  '3'
 *
 * 给你一个正整数 n ，生成一个包含 1 到 n^2 所有元素，且元素按顺时针顺序螺旋排列的 n x n 正方形矩阵 matrix 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：n = 3
 * 输出：[[1,2,3],[8,9,4],[7,6,5]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：n = 1
 * 输出：[[1]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1
 *
 *
 */

// @lc code=start
function generateMatrix(n: number): number[][] {
  // 创建一个 n x n 的二维数组，初始值都为 0
  const result: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  // 定义四个边界指针，用于控制螺旋遍历的范围
  let top = 0, // 上边界（第一行）
    right = n - 1, // 右边界（最后一列）
    bottom = n - 1, // 下边界（最后一行）
    left = 0; // 左边界（第一列）

  let num = 0; // 当前要填入的数字，从 1 开始

  // 当还有未填充的区域时继续循环
  while (left <= right && top <= bottom) {
    // 第一步：从左到右填充上边界
    // 遍历范围：从 left 到 right（包含 right）
    for (let col = left; col <= right; col++) {
      result[top][col] = ++num; // 先递增 num，再赋值
    }
    top++; // 上边界向下收缩一行

    // 第二步：从上到下填充右边界
    // 遍历范围：从 top 到 bottom（包含 bottom）
    for (let row = top; row <= bottom; row++) {
      result[row][right] = ++num;
    }
    right--; // 右边界向左收缩一列

    // 第三步：从右到左填充下边界
    // 关键判断：检查是否还有列可以填充
    // 为什么需要这个判断？
    // 1. 当矩阵只有一行时（如 n=1），第一步已经填充了所有元素
    // 2. 当矩阵的行数为奇数时，最后可能只剩下一行，不需要重复填充
    if (left <= right) {
      for (let col = right; col >= left; col--) {
        result[bottom][col] = ++num;
      }
      bottom--; // 下边界向上收缩一行
    }

    // 第四步：从下到上填充左边界
    // 关键判断：检查是否还有行可以填充
    // 为什么需要这个判断？
    // 1. 当矩阵只有一列时，第二步已经填充了所有元素
    // 2. 当矩阵的列数为奇数时，最后可能只剩下一列，不需要重复填充
    if (top <= bottom) {
      for (let row = bottom; row >= top; row--) {
        result[row][left] = ++num;
      }
      left++; // 左边界向右收缩一列
    }
  }

  return result;
}
// @lc code=end
