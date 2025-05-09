/**
 * 01背包问题
 *
 * 问题描述：
 * 有N件物品和一个容量为V的背包。第i件物品的重量是w[i]，价值是v[i]。
 * 求解将哪些物品装入背包，可使这些物品的总重量不超过背包容量，且总价值最大。
 * 每件物品只能使用一次（0-1）。
 *
 * 输入：
 * - weights: 物品的重量数组
 * - values: 物品的价值数组
 * - capacity: 背包的容量
 *
 * 输出：
 * - 能获得的最大价值
 */

/**
 * 01背包问题的解决方案（二维DP数组实现）
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} - 最大价值
 */
function knapsack01_2D(weights, values, capacity) {
  const n = weights.length; // 物品数量

  // 创建二维dp数组，dp[i][j]表示前i个物品放入容量为j的背包中能获得的最大价值
  // dp[i][j] 定义：考虑前i个物品，背包容量为j时，能获得的最大价值
  const dp = Array(n + 1)
    .fill()
    .map(() => Array(capacity + 1).fill(0));

  // 填充dp表格
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= capacity; j++) {
      // 当前物品的重量和价值（注意索引从0开始）
      const weight = weights[i - 1];
      const value = values[i - 1];

      if (weight > j) {
        // 如果当前物品重量大于背包剩余容量，无法装入
        dp[i][j] = dp[i - 1][j];
      } else {
        // 可以选择装入或不装入当前物品，取最大值
        // 不装入：dp[i-1][j]
        // 装入：dp[i-1][j-weight] + value
        dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - weight] + value);
      }
    }
  }

  // 返回最终结果：考虑所有n个物品，容量为capacity的背包能获得的最大价值
  return dp[n][capacity];
}

/**
 * 01背包问题的解决方案（一维DP数组优化实现）
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} - 最大价值
 */
function knapsack01_1D(weights, values, capacity) {
  const n = weights.length; // 物品数量

  // 创建一维dp数组，dp[j]表示容量为j的背包能获得的最大价值
  // 初始值都为0，表示没有物品时背包价值为0
  const dp = Array(capacity + 1).fill(0);

  // 遍历每个物品
  for (let i = 0; i < n; i++) {
    const weight = weights[i];
    const value = values[i];

    // 注意：必须逆序遍历背包容量！
    // 这是为了确保每个物品只被使用一次（01背包的核心）
    // 如果正序遍历，会导致物品被重复使用（变成完全背包问题）
    for (let j = capacity; j >= weight; j--) {
      // 状态转移方程：dp[j] = max(dp[j], dp[j-weight] + value)
      dp[j] = Math.max(dp[j], dp[j - weight] + value);
    }
  }

  // 返回最终结果：容量为capacity的背包能获得的最大价值
  return dp[capacity];
}

// 测试案例
function testKnapsack() {
  // 物品重量
  const weights = [2, 3, 4, 5];
  // 物品价值
  const values = [3, 4, 5, 6];
  // 背包容量
  const capacity = 8;

  console.log("二维DP解法结果:", knapsack01_2D(weights, values, capacity));
  console.log("一维DP优化解法结果:", knapsack01_1D(weights, values, capacity));

  // 验证两种方法的结果是否一致
  console.log(
    "两种解法结果是否一致:",
    knapsack01_2D(weights, values, capacity) ===
      knapsack01_1D(weights, values, capacity)
  );
}

// 运行测试
testKnapsack();

/**
 * 01背包问题的解法思路：
 *
 * 1. 状态定义：
 *    dp[i][j] 表示从前i个物品中选择放入容量为j的背包中能获得的最大价值
 *
 * 2. 状态转移方程：
 *    - 如果不把第i个物品放入背包：dp[i][j] = dp[i-1][j]
 *    - 如果把第i个物品放入背包：dp[i][j] = dp[i-1][j-weights[i-1]] + values[i-1]
 *    - 综合：dp[i][j] = max(dp[i-1][j], dp[i-1][j-weights[i-1]] + values[i-1])
 *
 * 3. 边界条件：
 *    - dp[0][j] = 0（没有物品可选时，价值为0）
 *    - dp[i][0] = 0（背包容量为0时，价值为0）
 *
 * 4. 优化：
 *    - 二维DP可以优化为一维DP，节省空间
 *    - 关键点：必须逆序遍历背包容量，确保每个物品只被使用一次
 *
 * 5. 时间复杂度：O(n * capacity)，其中n是物品数量
 *    空间复杂度：二维DP为O(n * capacity)，一维优化后为O(capacity)
 */
