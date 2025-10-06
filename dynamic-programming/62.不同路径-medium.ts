/*
 * @lc app=leetcode.cn id=62 lang=typescript
 *
 * [62] 不同路径
 *
 * https://leetcode.cn/problems/unique-paths/description/
 *
 * algorithms
 * Medium (69.87%)
 * Likes:    2274
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 1.5M
 * Testcase Example:  '3\n7'
 *
 * 一个机器人位于一个 m x n 网格的左上角 （起始点在下图中标记为 “Start” ）。
 *
 * 机器人每次只能向下或者向右移动一步。机器人试图达到网格的右下角（在下图中标记为 “Finish” ）。
 *
 * 问总共有多少条不同的路径？
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：m = 3, n = 7
 * 输出：28
 *
 * 示例 2：
 *
 *
 * 输入：m = 3, n = 2
 * 输出：3
 * 解释：
 * 从左上角开始，总共有 3 条路径可以到达右下角。
 * 1. 向右 -> 向下 -> 向下
 * 2. 向下 -> 向下 -> 向右
 * 3. 向下 -> 向右 -> 向下
 *
 *
 * 示例 3：
 *
 *
 * 输入：m = 7, n = 3
 * 输出：28
 *
 *
 * 示例 4：
 *
 *
 * 输入：m = 3, n = 3
 * 输出：6
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= m, n <= 100
 * 题目数据保证答案小于等于 2 * 10^9
 *
 *
 */

// @lc code=start

// ========== 解法1：一维DP（空间优化） ==========
function uniquePaths(m: number, n: number): number {
  // 创建一维数组，初始化为1（第一行的所有位置都只有1种路径）
  const dp: number[] = Array(n).fill(1);

  // 从第二行开始计算（i=1），因为第一行已经初始化完成
  for (let i = 1; i < m; i++) {
    // 从第二列开始计算（j=1），因为第一列始终为1
    for (let j = 1; j < n; j++) {
      // dp[j] 表示从上方来的路径数
      // dp[j-1] 表示从左方来的路径数
      // 当前位置的路径数 = 上方路径数 + 左方路径数
      dp[j] = dp[j] + dp[j - 1];
    }
  }

  // 返回右下角位置的路径数
  return dp[n - 1];
}

// ========== 解法2：二维DP（最直观） ==========
function uniquePaths2D(m: number, n: number): number {
  // 创建二维DP数组，dp[i][j] 表示从(0,0)到(i,j)的路径数
  const dp: number[][] = Array(m)
    .fill(0)
    .map(() => Array(n).fill(0));

  // 初始化第一行：从(0,0)到第一行任意位置都只有1种路径（一直向右）
  for (let j = 0; j < n; j++) {
    dp[0][j] = 1;
  }

  // 初始化第一列：从(0,0)到第一列任意位置都只有1种路径（一直向下）
  for (let i = 0; i < m; i++) {
    dp[i][0] = 1;
  }

  // 填充其余位置
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      // 状态转移方程：当前位置的路径数 = 上方路径数 + 左方路径数
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
  }

  return dp[m - 1][n - 1];
}

// ========== 解法3：数学组合数（最优解） ==========
function uniquePathsMath(m: number, n: number): number {
  // 从(0,0)到(m-1,n-1)需要移动 (m-1) 次向下 + (n-1) 次向右
  // 总共需要移动 (m+n-2) 步，其中选择 (m-1) 步向下（或 (n-1) 步向右）
  // 这是一个组合问题：C(m+n-2, m-1) = C(m+n-2, n-1)

  // 选择较小的数进行计算，避免大数运算
  const total = m + n - 2;
  const choose = Math.min(m - 1, n - 1);

  let result = 1;
  // 计算 C(total, choose) = total! / (choose! * (total-choose)!)
  // 使用公式：C(n,k) = n * (n-1) * ... * (n-k+1) / (k * (k-1) * ... * 1)
  for (let i = 0; i < choose; i++) {
    result = (result * (total - i)) / (i + 1);
  }

  return Math.round(result); // 避免浮点数精度问题
}

// ========== 解法4：递归 + 记忆化 ==========
function uniquePathsRecursive(m: number, n: number): number {
  // 创建记忆化数组
  const memo: number[][] = Array(m)
    .fill(0)
    .map(() => Array(n).fill(-1));

  function dfs(i: number, j: number): number {
    // 边界条件：到达目标位置
    if (i === m - 1 && j === n - 1) {
      return 1;
    }

    // 边界条件：越界
    if (i >= m || j >= n) {
      return 0;
    }

    // 如果已经计算过，直接返回结果
    if (memo[i][j] !== -1) {
      return memo[i][j];
    }

    // 递归计算：向下 + 向右
    memo[i][j] = dfs(i + 1, j) + dfs(i, j + 1);
    return memo[i][j];
  }

  return dfs(0, 0);
}

// ========== 解法5：纯递归（会超时，仅用于理解） ==========
function uniquePathsPureRecursive(m: number, n: number): number {
  function dfs(i: number, j: number): number {
    // 到达目标位置
    if (i === m - 1 && j === n - 1) {
      return 1;
    }

    // 越界
    if (i >= m || j >= n) {
      return 0;
    }

    // 递归：向下 + 向右
    return dfs(i + 1, j) + dfs(i, j + 1);
  }

  return dfs(0, 0);
}

// @lc code=end
