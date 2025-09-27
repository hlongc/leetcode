/*
 * @lc app=leetcode.cn id=542 lang=typescript
 *
 * [542] 01 矩阵
 *
 * https://leetcode.cn/problems/01-matrix/description/
 *
 * algorithms
 * Medium (47.39%)
 * Likes:    991
 * Dislikes: 0
 * Total Accepted:    153.3K
 * Total Submissions: 323.3K
 * Testcase Example:  '[[0,0,0],[0,1,0],[0,0,0]]'
 *
 * 给定一个由 0 和 1 组成的矩阵 mat ，请输出一个大小相同的矩阵，其中每一个格子是 mat 中对应位置元素到最近的 0 的距离。
 *
 * 两个相邻元素间的距离为 1 。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：mat = [[0,0,0],[0,1,0],[0,0,0]]
 * 输出：[[0,0,0],[0,1,0],[0,0,0]]
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入：mat = [[0,0,0],[0,1,0],[1,1,1]]
 * 输出：[[0,0,0],[0,1,0],[1,2,1]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == mat.length
 * n == mat[i].length
 * 1
 * 1
 * mat[i][j] is either 0 or 1.
 * mat 中至少有一个 0
 *
 *
 */

// @lc code=start
// 方法1：BFS多源最短路径 - 推荐解法
// 时间复杂度：O(m * n)，空间复杂度：O(m * n)
// 优势：思路清晰，性能优秀，适合面试
function updateMatrix(mat: number[][]): number[][] {
  const m = mat.length;
  const n = mat[0].length;

  // 初始化结果矩阵，所有位置设为无穷大
  const result: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(Infinity));

  // 四个方向：上、下、左、右
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 队列存储所有0的位置
  const queue: number[][] = [];

  // 将所有0的位置加入队列，并设置距离为0
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] === 0) {
        result[i][j] = 0;
        queue.push([i, j]);
      }
    }
  }

  // BFS遍历，从所有0开始向外扩展
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;

    // 向四个方向扩展
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      // 边界检查
      if (newRow < 0 || newRow >= m || newCol < 0 || newCol >= n) continue;

      // 如果新位置的距离可以更新（更小）
      if (result[newRow][newCol] > result[row][col] + 1) {
        result[newRow][newCol] = result[row][col] + 1;
        queue.push([newRow, newCol]);
      }
    }
  }

  return result;
}

// 方法2：动态规划 - 两次遍历
// 时间复杂度：O(m * n)，空间复杂度：O(1) 如果不算结果矩阵
// 优势：空间复杂度低，逻辑清晰
function updateMatrixDP(mat: number[][]): number[][] {
  const m = mat.length;
  const n = mat[0].length;

  // 初始化结果矩阵
  const result: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(Infinity));

  // 第一遍：从左上到右下
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] === 0) {
        result[i][j] = 0;
      } else {
        // 检查上方和左方的最小距离
        if (i > 0) {
          result[i][j] = Math.min(result[i][j], result[i - 1][j] + 1);
        }
        if (j > 0) {
          result[i][j] = Math.min(result[i][j], result[i][j - 1] + 1);
        }
      }
    }
  }

  // 第二遍：从右下到左上
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (mat[i][j] !== 0) {
        // 检查下方和右方的最小距离
        if (i < m - 1) {
          result[i][j] = Math.min(result[i][j], result[i + 1][j] + 1);
        }
        if (j < n - 1) {
          result[i][j] = Math.min(result[i][j], result[i][j + 1] + 1);
        }
      }
    }
  }

  return result;
}

// 方法3：动态规划优化版本 - 原地修改
// 时间复杂度：O(m * n)，空间复杂度：O(1)
// 优势：不需要额外空间，直接修改原矩阵
function updateMatrixDPInPlace(mat: number[][]): number[][] {
  const m = mat.length;
  const n = mat[0].length;

  // 将1替换为无穷大，0保持不变
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] === 1) {
        mat[i][j] = Infinity;
      }
    }
  }

  // 第一遍：从左上到右下
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] !== 0) {
        if (i > 0) {
          mat[i][j] = Math.min(mat[i][j], mat[i - 1][j] + 1);
        }
        if (j > 0) {
          mat[i][j] = Math.min(mat[i][j], mat[i][j - 1] + 1);
        }
      }
    }
  }

  // 第二遍：从右下到左上
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (mat[i][j] !== 0) {
        if (i < m - 1) {
          mat[i][j] = Math.min(mat[i][j], mat[i + 1][j] + 1);
        }
        if (j < n - 1) {
          mat[i][j] = Math.min(mat[i][j], mat[i][j + 1] + 1);
        }
      }
    }
  }

  return mat;
}

// 方法4：DFS深度优先搜索 - 记忆化
// 时间复杂度：O(m * n)，空间复杂度：O(m * n)
// 优势：思路直观，易于理解
function updateMatrixDFS(mat: number[][]): number[][] {
  const m = mat.length;
  const n = mat[0].length;

  // 初始化结果矩阵
  const result: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(Infinity));

  // 四个方向
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // DFS函数，带记忆化
  const dfs = (row: number, col: number): number => {
    // 边界检查
    if (row < 0 || row >= m || col < 0 || col >= n) {
      return Infinity;
    }

    // 如果已经计算过，直接返回
    if (result[row][col] !== Infinity) {
      return result[row][col];
    }

    // 如果是0，距离为0
    if (mat[row][col] === 0) {
      result[row][col] = 0;
      return 0;
    }

    // 递归计算四个方向的最小距离
    let minDist = Infinity;
    for (const [dr, dc] of directions) {
      minDist = Math.min(minDist, dfs(row + dr, col + dc) + 1);
    }

    result[row][col] = minDist;
    return minDist;
  };

  // 从每个位置开始DFS
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (result[i][j] === Infinity) {
        dfs(i, j);
      }
    }
  }

  return result;
}

// 方法5：BFS优化版本 - 使用Set避免重复
// 时间复杂度：O(m * n)，空间复杂度：O(m * n)
// 优势：避免重复访问，性能更优
function updateMatrixBFSOptimized(mat: number[][]): number[][] {
  const m = mat.length;
  const n = mat[0].length;

  const result: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(Infinity));
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 使用Set存储待处理的坐标
  const queue = new Set<string>();

  // 将所有0的位置加入队列
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] === 0) {
        result[i][j] = 0;
        queue.add(`${i},${j}`);
      }
    }
  }

  // BFS遍历
  while (queue.size > 0) {
    const currentQueue = Array.from(queue);
    queue.clear();

    for (const coord of currentQueue) {
      const [row, col] = coord.split(",").map(Number);

      // 向四个方向扩展
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // 边界检查
        if (newRow < 0 || newRow >= m || newCol < 0 || newCol >= n) continue;

        // 如果新位置的距离可以更新
        if (result[newRow][newCol] > result[row][col] + 1) {
          result[newRow][newCol] = result[row][col] + 1;
          queue.add(`${newRow},${newCol}`);
        }
      }
    }
  }

  return result;
}

// 方法6：多源BFS - 分层处理
// 时间复杂度：O(m * n)，空间复杂度：O(m * n)
// 优势：分层处理，逻辑清晰
function updateMatrixMultiSourceBFS(mat: number[][]): number[][] {
  const m = mat.length;
  const n = mat[0].length;

  const result: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(Infinity));
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 队列存储 [行, 列, 距离]
  const queue: [number, number, number][] = [];

  // 将所有0的位置加入队列
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (mat[i][j] === 0) {
        result[i][j] = 0;
        queue.push([i, j, 0]);
      }
    }
  }

  // BFS遍历
  while (queue.length > 0) {
    const [row, col, dist] = queue.shift()!;

    // 向四个方向扩展
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      // 边界检查
      if (newRow < 0 || newRow >= m || newCol < 0 || newCol >= n) continue;

      // 如果新位置的距离可以更新
      if (result[newRow][newCol] > dist + 1) {
        result[newRow][newCol] = dist + 1;
        queue.push([newRow, newCol, dist + 1]);
      }
    }
  }

  return result;
}

/*
算法解析：

核心思想：多源最短路径
- 从所有0的位置开始，向外扩展计算到每个1的最短距离
- 这是一个典型的多源BFS问题

方法对比：

1. BFS多源最短路径 (updateMatrix) - 推荐
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n)
   - 优势：思路清晰，性能优秀，适合面试
   - 适用：一般情况下的首选

2. 动态规划 (updateMatrixDP)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(1) 如果不算结果矩阵
   - 优势：空间复杂度低，逻辑清晰
   - 适用：对空间要求高的场景

3. 动态规划原地修改 (updateMatrixDPInPlace)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(1)
   - 优势：不需要额外空间，直接修改原矩阵
   - 适用：内存受限的场景

4. DFS记忆化 (updateMatrixDFS)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n)
   - 优势：思路直观，易于理解
   - 适用：学习DFS概念的场景

5. BFS优化版本 (updateMatrixBFSOptimized)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n)
   - 优势：避免重复访问，性能更优
   - 适用：需要优化BFS性能的场景

6. 多源BFS分层处理 (updateMatrixMultiSourceBFS)
   - 时间复杂度：O(m * n)
   - 空间复杂度：O(m * n)
   - 优势：分层处理，逻辑清晰
   - 适用：需要理解BFS分层概念的场景

实际选择建议：
- 对于LeetCode等竞赛：推荐使用BFS多源最短路径，代码简洁高效
- 对于面试场景：推荐使用动态规划，思路清晰，空间复杂度低
- 对于生产环境：推荐使用动态规划原地修改，内存使用最少
- 对于学习目的：推荐使用DFS记忆化，思路最直观

关键点：
1. 多源BFS：从所有0开始同时扩展
2. 动态规划：两次遍历，分别处理左上到右下和右下到左上
3. 记忆化：避免重复计算，提高效率
4. 边界处理：注意矩阵边界检查
*/

// @lc code=end
