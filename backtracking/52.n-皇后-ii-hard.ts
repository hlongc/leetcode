/*
 * @lc app=leetcode.cn id=52 lang=typescript
 *
 * [52] N 皇后 II
 *
 * https://leetcode.cn/problems/n-queens-ii/description/
 *
 * algorithms
 * Hard (83.16%)
 * Likes:    587
 * Dislikes: 0
 * Total Accepted:    204.8K
 * Total Submissions: 246.3K
 * Testcase Example:  '4'
 *
 * n 皇后问题 研究的是如何将 n 个皇后放置在 n × n 的棋盘上，并且使皇后彼此之间不能相互攻击。
 *
 * 给你一个整数 n ，返回 n 皇后问题 不同的解决方案的数量。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：n = 4
 * 输出：2
 * 解释：如上图所示，4 皇后问题存在两个不同的解法。
 *
 *
 * 示例 2：
 *
 *
 * 输入：n = 1
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= n <= 9
 *
 *
 *
 *
 */

// @lc code=start
/**
 * N 皇后 II - 返回 n 皇后问题的解决方案数量
 *
 * 核心思路：使用回溯算法（DFS）
 * 1. 逐行放置皇后，每行只能放一个
 * 2. 对于每一行，尝试在每一列放置皇后
 * 3. 检查当前位置是否合法（不与已放置的皇后冲突）
 * 4. 使用三个集合分别记录已占用的列、主对角线、副对角线
 *
 * 时间复杂度：O(N!)，最坏情况下需要尝试所有可能的放置方案
 * 空间复杂度：O(N)，递归深度和集合存储
 */
function totalNQueens(n: number): number {
  let count = 0; // 记录有效解决方案的数量

  // 用于记录已占用的列
  const cols = new Set<number>();

  // 用于记录已占用的主对角线（从左上到右下）
  // 同一主对角线上的格子，row - col 的值相同
  const diag1 = new Set<number>();

  // 用于记录已占用的副对角线（从右上到左下）
  // 同一副对角线上的格子，row + col 的值相同
  const diag2 = new Set<number>();

  /**
   * 回溯函数
   * @param row 当前处理的行号（从 0 开始）
   */
  function backtrack(row: number): void {
    // 递归终止条件：已经成功放置了 n 个皇后
    if (row === n) {
      count++; // 找到一个有效解决方案
      return;
    }

    // 尝试在当前行的每一列放置皇后
    for (let col = 0; col < n; col++) {
      // 检查当前位置是否会与已放置的皇后冲突
      // 1. 检查列是否已被占用
      // 2. 检查主对角线是否已被占用
      // 3. 检查副对角线是否已被占用
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) {
        continue; // 如果冲突，跳过当前列，尝试下一列
      }

      // 做选择：在 (row, col) 位置放置皇后
      cols.add(col);
      diag1.add(row - col);
      diag2.add(row + col);

      // 递归处理下一行
      backtrack(row + 1);

      // 撤销选择（回溯）：移除当前位置的皇后
      cols.delete(col);
      diag1.delete(row - col);
      diag2.delete(row + col);
    }
  }

  // 从第 0 行开始回溯
  backtrack(0);

  return count;
}
// @lc code=end
