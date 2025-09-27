/*
 * @lc app=leetcode.cn id=417 lang=typescript
 *
 * [417] 太平洋大西洋水流问题
 *
 * https://leetcode.cn/problems/pacific-atlantic-water-flow/description/
 *
 * algorithms
 * Medium (56.67%)
 * Likes:    750
 * Dislikes: 0
 * Total Accepted:    111.8K
 * Total Submissions: 197.2K
 * Testcase Example:  '[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]'
 *
 * 有一个 m × n 的矩形岛屿，与 太平洋 和 大西洋 相邻。 “太平洋” 处于大陆的左边界和上边界，而 “大西洋” 处于大陆的右边界和下边界。
 *
 * 这个岛被分割成一个由若干方形单元格组成的网格。给定一个 m x n 的整数矩阵 heights ， heights[r][c] 表示坐标 (r, c)
 * 上单元格 高于海平面的高度 。
 *
 * 岛上雨水较多，如果相邻单元格的高度 小于或等于 当前单元格的高度，雨水可以直接向北、南、东、西流向相邻单元格。水可以从海洋附近的任何单元格流入海洋。
 *
 * 返回网格坐标 result 的 2D 列表 ，其中 result[i] = [ri, ci] 表示雨水从单元格 (ri, ci) 流动
 * 既可流向太平洋也可流向大西洋 。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
 * 输出: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
 *
 *
 * 示例 2：
 *
 *
 * 输入: heights = [[2,1],[1,2]]
 * 输出: [[0,0],[0,1],[1,0],[1,1]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == heights.length
 * n == heights[r].length
 * 1 <= m, n <= 200
 * 0 <= heights[r][c] <= 10^5
 *
 *
 */

// @lc code=start
function pacificAtlantic(heights: number[][]): number[][] {
  const m = heights.length;
  const n = heights[0].length;

  // 创建两个标记数组，分别表示能否到达太平洋和大西洋
  const canReachPacific: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));
  const canReachAtlantic: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));

  // 四个方向：上、下、左、右
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // DFS函数：从边界开始反向搜索
  const dfs = (
    row: number,
    col: number,
    ocean: boolean[][],
    prevHeight: number
  ): void => {
    // 边界检查
    if (row < 0 || row >= m || col < 0 || col >= n) return;

    // 如果已经访问过，直接返回
    if (ocean[row][col]) return;

    // 如果当前高度小于前一个高度，无法流动（反向搜索）
    if (heights[row][col] < prevHeight) return;

    // 标记当前位置可以到达对应海洋
    ocean[row][col] = true;

    // 向四个方向继续搜索
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      dfs(newRow, newCol, ocean, heights[row][col]);
    }
  };

  // 从太平洋边界开始搜索（左边界和上边界）
  // 左边界：所有行的第0列
  for (let i = 0; i < m; i++) {
    dfs(i, 0, canReachPacific, heights[i][0]);
  }
  // 上边界：第0行的所有列
  for (let j = 0; j < n; j++) {
    dfs(0, j, canReachPacific, heights[0][j]);
  }

  // 从大西洋边界开始搜索（右边界和下边界）
  // 右边界：所有行的最后一列
  for (let i = 0; i < m; i++) {
    dfs(i, n - 1, canReachAtlantic, heights[i][n - 1]);
  }
  // 下边界：最后一行的所有列
  for (let j = 0; j < n; j++) {
    dfs(m - 1, j, canReachAtlantic, heights[m - 1][j]);
  }

  // 收集既能到达太平洋又能到达大西洋的坐标
  const result: number[][] = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (canReachPacific[i][j] && canReachAtlantic[i][j]) {
        result.push([i, j]);
      }
    }
  }

  return result;
}

// 方法2：BFS广度优先搜索 - 优化版本
// 时间复杂度：O(m * n)，空间复杂度：O(m * n)
// 优势：使用队列避免递归栈溢出，适合大数据量
function pacificAtlanticBFS(heights: number[][]): number[][] {
  const m = heights.length;
  const n = heights[0].length;

  const canReachPacific: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));
  const canReachAtlantic: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // BFS函数：从边界开始反向搜索
  const bfs = (startPoints: number[][], ocean: boolean[][]): void => {
    const queue: number[][] = [...startPoints];

    // 标记起始点为可到达
    for (const [row, col] of startPoints) {
      ocean[row][col] = true;
    }

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;

      // 向四个方向搜索
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // 边界检查
        if (newRow < 0 || newRow >= m || newCol < 0 || newCol >= n) continue;

        // 如果已经访问过，跳过
        if (ocean[newRow][newCol]) continue;

        // 如果新位置高度大于等于当前位置，可以流动
        if (heights[newRow][newCol] >= heights[row][col]) {
          ocean[newRow][newCol] = true;
          queue.push([newRow, newCol]);
        }
      }
    }
  };

  // 太平洋边界起始点
  const pacificStarts: number[][] = [];
  for (let i = 0; i < m; i++) pacificStarts.push([i, 0]);
  for (let j = 0; j < n; j++) pacificStarts.push([0, j]);

  // 大西洋边界起始点
  const atlanticStarts: number[][] = [];
  for (let i = 0; i < m; i++) atlanticStarts.push([i, n - 1]);
  for (let j = 0; j < n; j++) atlanticStarts.push([m - 1, j]);

  // 执行BFS搜索
  bfs(pacificStarts, canReachPacific);
  bfs(atlanticStarts, canReachAtlantic);

  // 收集结果
  const result: number[][] = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (canReachPacific[i][j] && canReachAtlantic[i][j]) {
        result.push([i, j]);
      }
    }
  }

  return result;
}

// 方法3：迭代式DFS - 避免递归栈溢出
// 时间复杂度：O(m * n)，空间复杂度：O(m * n)
// 优势：使用显式栈，避免递归深度限制
function pacificAtlanticIterative(heights: number[][]): number[][] {
  const m = heights.length;
  const n = heights[0].length;

  const canReachPacific: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));
  const canReachAtlantic: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 迭代式DFS函数
  const dfsIterative = (startPoints: number[][], ocean: boolean[][]): void => {
    const stack: number[][] = [...startPoints];

    while (stack.length > 0) {
      const [row, col] = stack.pop()!;

      // 边界检查
      if (row < 0 || row >= m || col < 0 || col >= n) continue;

      // 如果已经访问过，跳过
      if (ocean[row][col]) continue;

      // 标记为可到达
      ocean[row][col] = true;

      // 向四个方向搜索
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // 边界检查
        if (newRow < 0 || newRow >= m || newCol < 0 || newCol >= n) continue;

        // 如果新位置高度大于等于当前位置，可以流动
        if (heights[newRow][newCol] >= heights[row][col]) {
          stack.push([newRow, newCol]);
        }
      }
    }
  };

  // 太平洋边界起始点
  const pacificStarts: number[][] = [];
  for (let i = 0; i < m; i++) pacificStarts.push([i, 0]);
  for (let j = 0; j < n; j++) pacificStarts.push([0, j]);

  // 大西洋边界起始点
  const atlanticStarts: number[][] = [];
  for (let i = 0; i < m; i++) atlanticStarts.push([i, n - 1]);
  for (let j = 0; j < n; j++) atlanticStarts.push([m - 1, j]);

  // 执行迭代式DFS搜索
  dfsIterative(pacificStarts, canReachPacific);
  dfsIterative(atlanticStarts, canReachAtlantic);

  // 收集结果
  const result: number[][] = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (canReachPacific[i][j] && canReachAtlantic[i][j]) {
        result.push([i, j]);
      }
    }
  }

  return result;
}

/*
算法解析：

核心思想：反向搜索
- 正向思考：从每个点出发，看能否到达两个海洋（复杂度高）
- 反向思考：从海洋边界出发，看能到达哪些点（复杂度低）

算法步骤：
1. 创建两个标记数组：canReachPacific 和 canReachAtlantic
2. 从太平洋边界（左边界+上边界）开始DFS，标记能到达的点
3. 从大西洋边界（右边界+下边界）开始DFS，标记能到达的点
4. 遍历所有点，找出既能到达太平洋又能到达大西洋的点

关键点：
- 反向搜索：从海洋向陆地搜索，而不是从陆地向海洋搜索
- 高度判断：heights[newRow][newCol] >= heights[row][col] 才能流动
- 边界处理：太平洋边界是左边界和上边界，大西洋边界是右边界和下边界

性能对比：

1. DFS递归版本 (pacificAtlantic)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n) - 递归栈空间
   - 优势：代码简洁，易于理解
   - 适用：一般情况下的首选

2. BFS版本 (pacificAtlanticBFS)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n) - 队列空间
   - 优势：避免递归栈溢出，适合大数据量
   - 适用：数据量很大的场景

3. 迭代式DFS (pacificAtlanticIterative)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n) - 显式栈空间
   - 优势：避免递归深度限制，控制内存使用
   - 适用：需要精确控制内存的场景

实际选择建议：
- 对于LeetCode等竞赛：推荐使用DFS递归版本，代码最简洁
- 对于生产环境大数据量：推荐使用BFS版本，避免栈溢出
- 对于内存敏感场景：推荐使用迭代式DFS，精确控制内存

注意：所有方法的时间复杂度都是O(m * n)，这是理论最优的，
因为我们需要访问每个网格单元至少一次。
*/

// @lc code=end
