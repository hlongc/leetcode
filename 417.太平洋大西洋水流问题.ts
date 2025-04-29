/*
 * @lc app=leetcode.cn id=417 lang=typescript
 *
 * [417] 太平洋大西洋水流问题
 */

// @lc code=start
/**
 * 太平洋大西洋水流问题
 * 题目要求：找出矩阵中的水既可以流向太平洋也可以流向大西洋的单元格坐标
 *
 * 解题思路：逆向DFS
 * 1. 我们不从每个单元格出发判断水能否流向海洋（这样会重复计算）
 * 2. 而是反过来，从海洋边界开始，看水能"逆流"到哪些单元格
 * 3. 分别找出能从太平洋和大西洋逆流的单元格，取交集
 *
 * 关键点：
 * - 太平洋位于左边界和上边界
 * - 大西洋位于右边界和下边界
 * - 水流方向：从高度较高的单元格流向高度较低的单元格
 * - 逆向思考：水能"逆流"到的单元格，意味着水可以从这些单元格流到海洋
 *
 * 时间复杂度：O(m*n)，其中m和n是矩阵的行数和列数
 * 空间复杂度：O(m*n)，用于存储访问状态
 *
 * @param heights 代表高度的矩阵
 * @return 水既可以流向太平洋也可以流向大西洋的单元格坐标
 */
function pacificAtlantic(heights: number[][]): number[][] {
  // 如果矩阵为空，直接返回空结果
  if (heights.length === 0 || heights[0].length === 0) return [];

  // 获取矩阵的行数和列数
  const rows = heights.length;
  const cols = heights[0].length;

  // 创建两个矩阵记录能从太平洋和大西洋逆流的单元格
  const pacific = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );
  const atlantic = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );

  // 定义四个方向：上、右、下、左
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  /**
   * DFS函数：从海洋边界逆流到可达的单元格
   * @param r 当前行坐标
   * @param c 当前列坐标
   * @param visited 访问矩阵（pacific或atlantic）
   */
  const dfs = (r: number, c: number, visited: boolean[][]) => {
    // 标记当前单元格为已访问（表示从这个海洋可以逆流到此单元格）
    visited[r][c] = true;

    // 遍历四个方向
    for (const [dr, dc] of directions) {
      const newR = r + dr;
      const newC = c + dc;

      // 检查新坐标是否有效
      if (
        newR >= 0 &&
        newR < rows && // 行坐标在范围内
        newC >= 0 &&
        newC < cols && // 列坐标在范围内
        !visited[newR][newC] && // 未被访问过
        heights[newR][newC] >= heights[r][c] // 新单元格高度 >= 当前单元格高度（水可以从高处流向低处）
      ) {
        // 继续DFS
        dfs(newR, newC, visited);
      }
    }
  };

  // 从太平洋边界开始DFS（左边界和上边界）
  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pacific); // 左边界
  }
  for (let c = 0; c < cols; c++) {
    dfs(0, c, pacific); // 上边界
  }

  // 从大西洋边界开始DFS（右边界和下边界）
  for (let r = 0; r < rows; r++) {
    dfs(r, cols - 1, atlantic); // 右边界
  }
  for (let c = 0; c < cols; c++) {
    dfs(rows - 1, c, atlantic); // 下边界
  }

  // 找出既可以流向太平洋也可以流向大西洋的单元格
  const result: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) {
        result.push([r, c]);
      }
    }
  }

  return result;
}
// @lc code=end
