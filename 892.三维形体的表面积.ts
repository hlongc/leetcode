/*
 * @lc app=leetcode.cn id=892 lang=typescript
 *
 * [892] 三维形体的表面积
 *
 * 在 N * N 的网格上，我们放置一些 1 * 1 * 1 的立方体。
 * 每个值 v = grid[i][j] 表示 v 个正方体叠放在对应单元格 (i, j) 上。
 * 请你返回最终形体的表面积。
 */

// @lc code=start
/**
 * 计算三维形体的表面积
 *
 * 思路：
 * 1. 对于每个位置的立方体堆，计算其独立的表面积
 * 2. 减去与相邻立方体堆接触的表面积
 * 3. 注意处理每个堆内部立方体之间的接触面
 *
 * @param grid 表示立方体分布的网格
 * @returns 三维形体的总表面积
 */
function surfaceArea(grid: number[][]): number {
  const n = grid.length;
  let totalArea = 0;

  // 遍历网格中的每个位置
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cubesCount = grid[i][j];

      // 如果当前位置有立方体
      if (cubesCount > 0) {
        // 计算当前堆的表面积
        // 每个立方体有6个面，但堆叠时内部会有重叠
        // 一堆cubesCount个立方体的表面积 = 6*cubesCount - 2*(cubesCount-1)
        // 简化为 6*cubesCount - 2*cubesCount + 2 = 4*cubesCount + 2
        totalArea += 4 * cubesCount + 2;

        // 减去与相邻位置重叠的表面积

        // 与上方位置的重叠（如果存在）
        if (i > 0) {
          // 重叠的面积等于两堆中较小高度的2倍（上下各一个面）
          totalArea -= 2 * Math.min(cubesCount, grid[i - 1][j]);
        }

        // 与左侧位置的重叠（如果存在）
        if (j > 0) {
          // 重叠的面积等于两堆中较小高度的2倍（左右各一个面）
          totalArea -= 2 * Math.min(cubesCount, grid[i][j - 1]);
        }
      }
    }
  }

  return totalArea;
}
// @lc code=end

/**
 * 解题说明：
 *
 * 1. 每个立方体有6个面
 * 2. 当两个立方体相邻时，它们之间会各自损失1个面，总共损失2个面
 *
 * 计算过程：
 * 1. 首先计算每个位置立方体堆独立的表面积
 * 2. 对于堆内部：
 *    - 如果有v个立方体堆叠，则内部损失的面积是2*(v-1)
 *    - 独立表面积 = 6*v - 2*(v-1) = 4*v + 2
 * 3. 对于堆之间：
 *    - 检查当前位置与上方和左侧的重叠情况
 *    - 重叠的面积是min(当前高度,相邻高度)*2
 *    - 不需要检查右侧和下方，因为它们会在遍历到那些位置时计算
 *
 * 示例：
 * grid = [[1,2],[3,4]]
 * (0,0)处：1个立方体，表面积4*1+2=6，无上方和左侧重叠
 * (0,1)处：2个立方体，表面积4*2+2=10，与左侧重叠min(2,1)*2=2
 * (1,0)处：3个立方体，表面积4*3+2=14，与上方重叠min(3,1)*2=2
 * (1,1)处：4个立方体，表面积4*4+2=18，与上方重叠min(4,2)*2=4，与左侧重叠min(4,3)*2=6
 * 总表面积 = 6+10+14+18-2-2-4-6 = 34
 */
