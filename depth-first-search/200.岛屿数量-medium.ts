/*
 * @lc app=leetcode.cn id=200 lang=typescript
 *
 * [200] 岛屿数量
 *
 * https://leetcode.cn/problems/number-of-islands/description/
 *
 * algorithms
 * Medium (62.56%)
 * Likes:    2753
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 1.7M
 * Testcase Example:  '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]'
 *
 * 给你一个由 '1'（陆地）和 '0'（水）组成的的二维网格，请你计算网格中岛屿的数量。
 *
 * 岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。
 *
 * 此外，你可以假设该网格的四条边均被水包围。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：grid = [
 * ⁠ ["1","1","1","1","0"],
 * ⁠ ["1","1","0","1","0"],
 * ⁠ ["1","1","0","0","0"],
 * ⁠ ["0","0","0","0","0"]
 * ]
 * 输出：1
 *
 *
 * 示例 2：
 *
 *
 * 输入：grid = [
 * ⁠ ["1","1","0","0","0"],
 * ⁠ ["1","1","0","0","0"],
 * ⁠ ["0","0","1","0","0"],
 * ⁠ ["0","0","0","1","1"]
 * ]
 * 输出：3
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == grid.length
 * n == grid[i].length
 * 1
 * grid[i][j] 的值为 '0' 或 '1'
 *
 *
 */

// @lc code=start
/**
 * 岛屿数量 - DFS递归方式
 * 思路：遍历网格，遇到'1'时进行DFS标记整个岛屿，然后计数
 *
 * 算法步骤：
 * 1. 遍历网格中的每个位置
 * 2. 遇到'1'时，岛屿数量+1，然后DFS标记整个岛屿
 * 3. DFS过程中将访问过的'1'标记为'0'，避免重复计算
 *
 * 时间复杂度：O(m*n)，其中 m 和 n 分别是网格的行数和列数
 * 空间复杂度：O(m*n)，DFS递归调用栈的深度
 */
function numIslands(grid: string[][]): number {
  let count = 0;
  const m = grid.length;
  const n = grid[0].length;

  /**
   * DFS递归函数：标记整个岛屿
   * @param row 当前行索引
   * @param col 当前列索引
   */
  const dfs = (row: number, col: number) => {
    // 边界检查：越界或遇到水('0')时返回
    if (row < 0 || row >= m || col < 0 || col >= n || grid[row][col] === "0") {
      return;
    }

    // 标记当前陆地为已访问（改为'0'）
    grid[row][col] = "0";

    // 向四个方向递归搜索
    dfs(row - 1, col); // 上
    dfs(row, col + 1); // 右
    dfs(row + 1, col); // 下
    dfs(row, col - 1); // 左
  };

  // 遍历整个网格
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1") {
        count++; // 发现新岛屿
        dfs(i, j); // 标记整个岛屿
      }
    }
  }

  return count;
}

/**
 * 方法二：BFS迭代方式
 * 思路：使用队列进行广度优先搜索，避免递归调用栈过深
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(min(m,n))，队列中最多存储的节点数
 */
function numIslandsBFS(grid: string[][]): number {
  let count = 0;
  const m = grid.length;
  const n = grid[0].length;

  /**
   * BFS函数：使用队列标记整个岛屿
   * @param startRow 起始行索引
   * @param startCol 起始列索引
   */
  const bfs = (startRow: number, startCol: number) => {
    const queue: [number, number][] = [[startRow, startCol]];
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]; // 上下左右四个方向

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;

      // 检查四个方向的相邻位置
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // 边界检查和陆地检查
        if (
          newRow >= 0 &&
          newRow < m &&
          newCol >= 0 &&
          newCol < n &&
          grid[newRow][newCol] === "1"
        ) {
          grid[newRow][newCol] = "0"; // 标记为已访问
          queue.push([newRow, newCol]); // 加入队列
        }
      }
    }
  };

  // 遍历整个网格
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1") {
        count++; // 发现新岛屿
        grid[i][j] = "0"; // 标记起始位置
        bfs(i, j); // 标记整个岛屿
      }
    }
  }

  return count;
}

/**
 * 方法三：使用并查集（Union-Find）
 * 思路：将相邻的陆地合并到同一个集合中，最后统计集合数量
 *
 * 时间复杂度：O(m*n*α(m*n))，其中 α 是阿克曼函数的反函数
 * 空间复杂度：O(m*n)
 */
function numIslandsUnionFind(grid: string[][]): number {
  const m = grid.length;
  const n = grid[0].length;
  const parent: number[] = [];
  const rank: number[] = [];
  let count = 0;

  // 初始化并查集
  for (let i = 0; i < m * n; i++) {
    parent[i] = i;
    rank[i] = 0;
  }

  /**
   * 查找根节点（路径压缩）
   * @param x 节点索引
   * @returns 根节点索引
   */
  const find = (x: number): number => {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]); // 路径压缩
    }
    return parent[x];
  };

  /**
   * 合并两个集合（按秩合并）
   * @param x 节点1索引
   * @param y 节点2索引
   */
  const union = (x: number, y: number) => {
    const rootX = find(x);
    const rootY = find(y);

    if (rootX !== rootY) {
      if (rank[rootX] < rank[rootY]) {
        parent[rootX] = rootY;
      } else if (rank[rootX] > rank[rootY]) {
        parent[rootY] = rootX;
      } else {
        parent[rootY] = rootX;
        rank[rootX]++;
      }
    }
  };

  // 统计陆地数量并处理相邻陆地
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1") {
        count++; // 假设每个陆地都是独立的岛屿

        // 检查右边和下边的相邻陆地
        const current = i * n + j;

        // 检查右边
        if (j + 1 < n && grid[i][j + 1] === "1") {
          const right = i * n + (j + 1);
          if (find(current) !== find(right)) {
            union(current, right);
            count--; // 合并后岛屿数量减少
          }
        }

        // 检查下边
        if (i + 1 < m && grid[i + 1][j] === "1") {
          const down = (i + 1) * n + j;
          if (find(current) !== find(down)) {
            union(current, down);
            count--; // 合并后岛屿数量减少
          }
        }
      }
    }
  }

  return count;
}

/**
 * 方法四：不修改原数组的DFS实现
 * 思路：使用visited数组记录访问状态，不修改原grid
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m*n)
 */
function numIslandsNoModify(grid: string[][]): number {
  let count = 0;
  const m = grid.length;
  const n = grid[0].length;
  const visited: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));

  /**
   * DFS递归函数：标记整个岛屿
   * @param row 当前行索引
   * @param col 当前列索引
   */
  const dfs = (row: number, col: number) => {
    // 边界检查：越界或已访问或遇到水时返回
    if (
      row < 0 ||
      row >= m ||
      col < 0 ||
      col >= n ||
      visited[row][col] ||
      grid[row][col] === "0"
    ) {
      return;
    }

    // 标记当前位置为已访问
    visited[row][col] = true;

    // 向四个方向递归搜索
    dfs(row - 1, col); // 上
    dfs(row, col + 1); // 右
    dfs(row + 1, col); // 下
    dfs(row, col - 1); // 左
  };

  // 遍历整个网格
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1" && !visited[i][j]) {
        count++; // 发现新岛屿
        dfs(i, j); // 标记整个岛屿
      }
    }
  }

  return count;
}

/**
 * 方法五：优化的DFS实现（使用方向数组）
 * 思路：使用方向数组简化代码，提高可读性
 *
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m*n)
 */
function numIslandsOptimized(grid: string[][]): number {
  let count = 0;
  const m = grid.length;
  const n = grid[0].length;
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]; // 上下左右四个方向

  /**
   * DFS递归函数：标记整个岛屿
   * @param row 当前行索引
   * @param col 当前列索引
   */
  const dfs = (row: number, col: number) => {
    // 边界检查：越界或遇到水时返回
    if (row < 0 || row >= m || col < 0 || col >= n || grid[row][col] === "0") {
      return;
    }

    // 标记当前陆地为已访问
    grid[row][col] = "0";

    // 使用方向数组简化代码
    for (const [dr, dc] of directions) {
      dfs(row + dr, col + dc);
    }
  };

  // 遍历整个网格
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === "1") {
        count++; // 发现新岛屿
        dfs(i, j); // 标记整个岛屿
      }
    }
  }

  return count;
}
// @lc code=end
