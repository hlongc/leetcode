/*
 * @lc app=leetcode.cn id=279 lang=typescript
 *
 * [279] 完全平方数
 *
 * https://leetcode.cn/problems/perfect-squares/description/
 *
 * algorithms
 * Medium (68.05%)
 * Likes:    2172
 * Dislikes: 0
 * Total Accepted:    700.7K
 * Total Submissions: 1M
 * Testcase Example:  '12'
 *
 * 给你一个整数 n ，返回 和为 n 的完全平方数的最少数量 。
 *
 * 完全平方数 是一个整数，其值等于另一个整数的平方；换句话说，其值等于一个整数自乘的积。例如，1、4、9 和 16 都是完全平方数，而 3 和 11
 * 不是。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：n = 12
 * 输出：3
 * 解释：12 = 4 + 4 + 4
 *
 * 示例 2：
 *
 *
 * 输入：n = 13
 * 输出：2
 * 解释：13 = 4 + 9
 *
 *
 * 提示：
 *
 *
 * 1 <= n <= 10^4
 *
 *
 */

// @lc code=start
// 方法1：动态规划 - 修复版本
// 时间复杂度：O(n * sqrt(n))，空间复杂度：O(n)
function numSquares(n: number): number {
  // dp[i] 表示和为i的完全平方数的最少数量
  // 初始化为Infinity表示不可达状态
  const dp: number[] = Array(n + 1).fill(Infinity);
  dp[0] = 0; // 和为0需要0个完全平方数

  // 遍历每个数字i
  for (let i = 1; i <= n; i++) {
    // 尝试所有可能的完全平方数j*j
    for (let j = 1; j * j <= i; j++) {
      // 状态转移：dp[i] = min(dp[i], dp[i - j*j] + 1)
      // 即：当前数字i的最少平方数 = min(当前值, 去掉j*j后的最少平方数 + 1)
      dp[i] = Math.min(dp[i], dp[i - j * j] + 1);
    }
  }

  return dp[n];
}

// 方法2：BFS广度优先搜索 - 更高效
// 时间复杂度：O(n * sqrt(n))，空间复杂度：O(n)
// 优势：一旦找到解就立即返回，不需要计算所有状态
function numSquaresBFS(n: number): number {
  // 生成所有可能的完全平方数
  const squares: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    squares.push(i * i);
  }

  // BFS队列：[当前和, 使用的平方数个数]
  const queue: [number, number][] = [[0, 0]];
  const visited = new Set<number>(); // 避免重复访问

  while (queue.length > 0) {
    const [currentSum, count] = queue.shift()!;

    // 尝试每个完全平方数
    for (const square of squares) {
      const newSum = currentSum + square;

      // 如果达到目标，返回结果
      if (newSum === n) {
        return count + 1;
      }

      // 如果超过目标，跳过
      if (newSum > n) {
        break;
      }

      // 如果未访问过，加入队列
      if (!visited.has(newSum)) {
        visited.add(newSum);
        queue.push([newSum, count + 1]);
      }
    }
  }

  return -1; // 理论上不会到达这里
}

// 方法3：数学优化 - 四平方定理
// 时间复杂度：O(sqrt(n))，空间复杂度：O(1)
// 优势：利用数学定理，时间复杂度最优
function numSquaresMath(n: number): number {
  // 检查是否为完全平方数
  const isPerfectSquare = (num: number): boolean => {
    const sqrt = Math.floor(Math.sqrt(num));
    return sqrt * sqrt === num;
  };

  // 检查是否可以用两个完全平方数表示
  const isTwoSquares = (num: number): boolean => {
    for (let i = 1; i * i <= num; i++) {
      if (isPerfectSquare(num - i * i)) {
        return true;
      }
    }
    return false;
  };

  // 四平方定理：任何正整数都可以表示为最多4个完全平方数的和
  // 特殊情况：
  if (isPerfectSquare(n)) return 1; // 1个平方数
  if (isTwoSquares(n)) return 2; // 2个平方数

  // 检查是否可以用3个平方数表示（Legendre三平方定理）
  // 如果 n = 4^a * (8b + 7)，则需要4个平方数
  let temp = n;
  while (temp % 4 === 0) {
    temp /= 4;
  }
  if (temp % 8 === 7) {
    return 4; // 4个平方数
  }

  return 3; // 3个平方数
}

// 方法4：优化的动态规划 - 预计算平方数
// 时间复杂度：O(n * sqrt(n))，空间复杂度：O(n)
// 优势：减少重复计算
function numSquaresOptimizedDP(n: number): number {
  // 预计算所有可能的完全平方数
  const squares: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    squares.push(i * i);
  }

  const dp: number[] = Array(n + 1).fill(Infinity);
  dp[0] = 0;

  // 遍历每个数字
  for (let i = 1; i <= n; i++) {
    // 遍历所有完全平方数
    for (const square of squares) {
      if (square > i) break; // 优化：平方数超过当前数字时停止
      dp[i] = Math.min(dp[i], dp[i - square] + 1);
    }
  }

  return dp[n];
}

// 方法5：记忆化递归 - 自顶向下
// 时间复杂度：O(n * sqrt(n))，空间复杂度：O(n)
// 优势：思路清晰，易于理解
function numSquaresMemo(n: number): number {
  const memo = new Map<number, number>();

  const dfs = (num: number): number => {
    if (num === 0) return 0;
    if (memo.has(num)) return memo.get(num)!;

    let minCount = Infinity;
    for (let i = 1; i * i <= num; i++) {
      minCount = Math.min(minCount, dfs(num - i * i) + 1);
    }

    memo.set(num, minCount);
    return minCount;
  };

  return dfs(n);
}

/*
性能对比总结：

1. 动态规划 (numSquares) - 修复版本
   - 时间复杂度：O(n * sqrt(n))
   - 空间复杂度：O(n)
   - 优势：经典DP解法，稳定可靠
   - 适用：一般情况下的首选

2. BFS广度优先搜索 (numSquaresBFS)
   - 时间复杂度：O(n * sqrt(n))
   - 空间复杂度：O(n)
   - 优势：找到解立即返回，实际运行更快
   - 适用：需要快速找到解的场景

3. 数学优化 (numSquaresMath)
   - 时间复杂度：O(sqrt(n))
   - 空间复杂度：O(1)
   - 优势：利用四平方定理，理论最优
   - 适用：对性能要求极高的场景

4. 优化DP (numSquaresOptimizedDP)
   - 时间复杂度：O(n * sqrt(n))
   - 空间复杂度：O(n)
   - 优势：预计算平方数，减少重复计算
   - 适用：需要DP思路但希望优化的场景

5. 记忆化递归 (numSquaresMemo)
   - 时间复杂度：O(n * sqrt(n))
   - 空间复杂度：O(n)
   - 优势：思路清晰，易于理解
   - 适用：学习DP概念的场景

实际选择建议：
- 对于LeetCode等竞赛：推荐使用BFS，实际运行最快
- 对于生产环境：推荐使用数学优化，理论最优
- 对于学习DP：推荐使用记忆化递归，思路最清晰
- 对于一般情况：推荐使用修复后的DP，稳定可靠

注意：原代码的问题在于dp数组初始化为1，这会导致Math.min比较失效，
应该初始化为Infinity表示不可达状态。
*/

// @lc code=end
