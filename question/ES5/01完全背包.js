/**
 * 完全背包问题
 *
 * 问题描述：
 * 有N种物品和一个容量为V的背包。第i种物品的重量是w[i]，价值是v[i]。
 * 求解将哪些物品装入背包，可使这些物品的总重量不超过背包容量，且总价值最大。
 * 每种物品都有无限个可用（完全背包）。
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
 * 完全背包问题的解决方案（二维DP数组实现）
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} - 最大价值
 */
function completeKnapsack2D(weights, values, capacity) {
  const n = weights.length; // 物品种类数量

  // 创建二维dp数组，dp[i][j]表示前i种物品放入容量为j的背包中能获得的最大价值
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
        // 完全背包问题的核心区别：可以重复选择当前物品
        // 不装入：dp[i-1][j]
        // 装入：dp[i][j-weight] + value （注意：是dp[i]而不是dp[i-1]，表示可以重复使用）
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - weight] + value);
      }
    }
  }

  // 返回最终结果：考虑所有n种物品，容量为capacity的背包能获得的最大价值
  return dp[n][capacity];
}

/**
 * 完全背包问题的解决方案（一维DP数组优化实现）
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} - 最大价值
 */
function completeKnapsack1D(weights, values, capacity) {
  const n = weights.length; // 物品种类数量

  // 创建一维dp数组
  const dp = Array(capacity + 1).fill(0);

  // 遍历每种物品
  for (let i = 0; i < n; i++) {
    const weight = weights[i];
    const value = values[i];

    // 注意：完全背包问题需要正序遍历背包容量！
    // 这与01背包的逆序遍历正好相反
    // 正序遍历允许物品被多次使用（完全背包的核心）
    for (let j = weight; j <= capacity; j++) {
      // 状态转移方程：dp[j] = max(dp[j], dp[j-weight] + value)
      dp[j] = Math.max(dp[j], dp[j - weight] + value);
    }
  }

  // 返回最终结果：容量为capacity的背包能获得的最大价值
  return dp[capacity];
}

/**
 * 完全背包问题的解决方案（多重循环实现 - 展示多种策略）
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} - 最大价值
 */
function completeKnapsackMultipleChoices(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(capacity + 1).fill(0);

  for (let j = 0; j <= capacity; j++) {
    for (let i = 0; i < n; i++) {
      if (weights[i] <= j) {
        dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
      }
    }
  }

  return dp[capacity];
}

// 测试案例
function testCompleteKnapsack() {
  // 物品重量
  const weights = [2, 3, 4, 5];
  // 物品价值
  const values = [3, 4, 5, 6];
  // 背包容量
  const capacity = 10;

  console.log("二维DP解法结果:", completeKnapsack2D(weights, values, capacity));
  console.log(
    "一维DP优化解法结果:",
    completeKnapsack1D(weights, values, capacity)
  );
  console.log(
    "多重循环实现结果:",
    completeKnapsackMultipleChoices(weights, values, capacity)
  );

  // 验证不同方法结果是否一致
  console.log(
    "三种方法结果是否一致:",
    completeKnapsack2D(weights, values, capacity) ===
      completeKnapsack1D(weights, values, capacity) &&
      completeKnapsack1D(weights, values, capacity) ===
        completeKnapsackMultipleChoices(weights, values, capacity)
  );
}

// 运行测试
testCompleteKnapsack();

/**
 * 完全背包问题与01背包问题的区别：
 *
 * 1. 物品使用限制：
 *    - 01背包：每种物品只能使用0或1次
 *    - 完全背包：每种物品可以使用无限次
 *
 * 2. 状态转移方程的区别：
 *    - 01背包：dp[i][j] = max(dp[i-1][j], dp[i-1][j-weight] + value)
 *    - 完全背包：dp[i][j] = max(dp[i-1][j], dp[i][j-weight] + value)
 *                                           ↑
 *                                      注意这里是dp[i]而不是dp[i-1]
 *
 * 3. 一维优化实现的遍历顺序：
 *    - 01背包：必须逆序遍历容量（从大到小）
 *    - 完全背包：必须正序遍历容量（从小到大）
 *
 * 4. 完全背包的多种实现方式：
 *    - 二维DP实现
 *    - 一维DP优化（常用）
 *    - 物品和容量循环顺序可以互换（在完全背包中）
 *
 * 5. 时间复杂度：两种问题都是O(n * capacity)
 *    空间复杂度：二维DP为O(n * capacity)，一维优化后为O(capacity)
 *
 * 完全背包的应用场景：
 * - 硬币找零问题（每种硬币可以使用无限次）
 * - 物品可以无限次购买的购物问题
 * - 某些资源可以重复利用的规划问题
 */
