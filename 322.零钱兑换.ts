/*
 * @lc app=leetcode.cn id=322 lang=typescript
 *
 * [322] 零钱兑换
 */

// @lc code=start
/**
 * 计算凑成目标金额所需的最少硬币数量
 * @param coins 可用的硬币面值数组
 * @param amount 目标金额
 * @return 最少需要的硬币数量，如果无法凑出则返回-1
 */
function coinChange(coins: number[], amount: number): number {
  // 特殊情况处理
  if (amount === 0) return 0;
  if (coins.length === 0) return -1;

  // 对硬币面值进行排序（从小到大）
  // 这不会改变时间复杂度的量级，但在实际运行中可能提高效率
  coins.sort((a, b) => a - b);

  // 如果最小面值大于目标金额，无法凑出
  if (coins[0] > amount) return -1;

  // 创建dp数组，dp[i]表示凑齐金额i所需的最少硬币数量
  // 使用amount+1作为初始"无穷大"值，比Number.MAX_SAFE_INTEGER更合理
  // 因为硬币数量最多为amount（全部使用面值为1的硬币）
  const dp: number[] = Array(amount + 1).fill(amount + 1);

  // 基础情况：凑齐金额0不需要任何硬币
  dp[0] = 0;

  // 优化1：先遍历硬币，减少内层循环中的判断
  for (const coin of coins) {
    // 优化2：只计算可以使用当前硬币的金额范围
    for (let i = coin; i <= amount; i++) {
      // 状态转移方程简化，不需要额外的if判断
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }

  // 使用更清晰的判断条件：如果dp[amount]仍然是初始值，说明无法凑出
  return dp[amount] > amount ? -1 : dp[amount];
}

/**
 * 另一种实现：贪心+动态规划结合（对于某些特定情况可能更快）
 * 注意：这只是一个可选的实现，在硬币系统特殊时可能更高效
 */
function coinChangeAlternative(coins: number[], amount: number): number {
  // 特殊情况处理
  if (amount === 0) return 0;
  if (coins.length === 0) return -1;

  // 对硬币面值进行排序（从大到小，用于贪心尝试）
  coins.sort((a, b) => b - a);

  // 创建dp数组
  const dp: number[] = Array(amount + 1).fill(amount + 1);
  dp[0] = 0;

  // 计算所有金额的最少硬币数
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        // 优化3：一旦找到使用最大面值硬币的解，对于当前金额不再尝试其他面值
        // 这在某些情况下是贪心的，但可能不总是最优解，取决于硬币系统
        // 如果需要保证最优解，请移除此优化或使用上面的标准实现
        // if (dp[i] === dp[i - coin] + 1) break;
      }
    }
  }

  return dp[amount] > amount ? -1 : dp[amount];
}
// @lc code=end
