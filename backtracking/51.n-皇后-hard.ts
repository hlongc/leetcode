/*
 * @lc app=leetcode.cn id=51 lang=typescript
 *
 * [51] N 皇后
 *
 * https://leetcode.cn/problems/n-queens/description/
 *
 * algorithms
 * Hard (75.19%)
 * Likes:    2274
 * Dislikes: 0
 * Total Accepted:    513.6K
 * Total Submissions: 683.1K
 * Testcase Example:  '4'
 *
 * 按照国际象棋的规则，皇后可以攻击与之处在同一行或同一列或同一斜线上的棋子。
 *
 * n 皇后问题 研究的是如何将 n 个皇后放置在 n×n 的棋盘上，并且使皇后彼此之间不能相互攻击。
 *
 * 给你一个整数 n ，返回所有不同的 n 皇后问题 的解决方案。
 *
 *
 *
 * 每一种解法包含一个不同的 n 皇后问题 的棋子放置方案，该方案中 'Q' 和 '.' 分别代表了皇后和空位。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：n = 4
 * 输出：[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]
 * 解释：如上图所示，4 皇后问题存在两个不同的解法。
 *
 *
 * 示例 2：
 *
 *
 * 输入：n = 1
 * 输出：[["Q"]]
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
 * N皇后问题 - 经典回溯算法问题
 *
 * 问题描述：在n×n的棋盘上放置n个皇后，使得任意两个皇后都不能相互攻击
 * 皇后攻击规则：同行、同列、同斜线的位置都会被攻击
 *
 * 解题思路：
 * 1. 使用回溯算法，逐行放置皇后
 * 2. 对于每一行，尝试在每一列放置皇后
 * 3. 检查当前位置是否与已放置的皇后冲突
 * 4. 冲突检查包括：列冲突、主对角线冲突、副对角线冲突
 * 5. 使用Set集合快速判断冲突，避免重复遍历
 *
 * 优化点：
 * - 使用Set进行O(1)冲突检查
 * - 巧妙的对角线冲突检查公式
 * - 清晰的变量命名和代码结构
 *
 * 时间复杂度：O(N!) - 每行的选择数量递减，约为N!
 * 空间复杂度：O(N) - 递归栈深度和辅助Set的空间
 */
function solveNQueens(n: number): string[][] {
  const solutions: string[][] = [];

  // 使用Set集合记录已占用的列和对角线，实现O(1)冲突检查
  const occupiedCols = new Set<number>(); // 记录已占用的列
  const occupiedMainDiagonals = new Set<number>(); // 记录已占用的主对角线(左上到右下)
  const occupiedAntiDiagonals = new Set<number>(); // 记录已占用的副对角线(右上到左下)

  // 初始化棋盘，所有位置都是空的
  const board: string[][] = Array.from({ length: n }, () => Array(n).fill("."));

  /**
   * 回溯函数：在指定行放置皇后
   * @param row 当前处理的行号（0-based）
   */
  function backtrack(row: number): void {
    // 递归终止条件：所有行都已放置皇后
    if (row === n) {
      // 将当前棋盘状态转换为字符串数组并保存
      const solution = board.map((boardRow) => boardRow.join(""));
      solutions.push(solution);
      return;
    }

    // 尝试在当前行的每一列放置皇后
    for (let col = 0; col < n; col++) {
      // 检查当前位置(row, col)是否安全
      if (isSafePosition(row, col)) {
        // 放置皇后：更新棋盘和冲突记录
        placeQueen(row, col);

        // 递归处理下一行
        backtrack(row + 1);

        // 回溯：移除皇后，恢复状态
        removeQueen(row, col);
      }
    }
  }

  /**
   * 检查在指定位置放置皇后是否安全
   * @param row 行号
   * @param col 列号
   * @returns 如果位置安全返回true，否则返回false
   */
  function isSafePosition(row: number, col: number): boolean {
    // 检查列冲突：该列是否已有皇后
    if (occupiedCols.has(col)) return false;

    // 检查主对角线冲突：主对角线上的点满足 row - col = 常数
    const mainDiagonal = row - col;
    if (occupiedMainDiagonals.has(mainDiagonal)) return false;

    // 检查副对角线冲突：副对角线上的点满足 row + col = 常数
    const antiDiagonal = row + col;
    if (occupiedAntiDiagonals.has(antiDiagonal)) return false;

    return true;
  }

  /**
   * 在指定位置放置皇后
   * @param row 行号
   * @param col 列号
   */
  function placeQueen(row: number, col: number): void {
    board[row][col] = "Q";
    occupiedCols.add(col);
    occupiedMainDiagonals.add(row - col);
    occupiedAntiDiagonals.add(row + col);
  }

  /**
   * 从指定位置移除皇后
   * @param row 行号
   * @param col 列号
   */
  function removeQueen(row: number, col: number): void {
    board[row][col] = ".";
    occupiedCols.delete(col);
    occupiedMainDiagonals.delete(row - col);
    occupiedAntiDiagonals.delete(row + col);
  }

  // 从第0行开始回溯
  backtrack(0);

  return solutions;
}

/*
算法核心理解：

1. 对角线冲突检查的数学原理：
   - 主对角线(↘)：同一主对角线上的点满足 row - col = 常数
     例如：(0,0), (1,1), (2,2) 都满足 row - col = 0
   - 副对角线(↙)：同一副对角线上的点满足 row + col = 常数  
     例如：(0,2), (1,1), (2,0) 都满足 row + col = 2

2. 回溯过程示例（n=4）：
   尝试第0行：
   - (0,0): 放置皇后 → 继续下一行
   - (0,1): 无法放置（与之前冲突）→ 回溯
   - (0,2): 放置皇后 → 继续下一行
   - ...

3. 优化要点：
   - 使用Set进行O(1)冲突检查，比遍历棋盘更高效
   - 按行放置避免行冲突，只需检查列和对角线
   - 清晰的函数分离提高代码可读性和可维护性
*/
// @lc code=end
