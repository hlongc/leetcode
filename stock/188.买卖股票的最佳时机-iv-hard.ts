/*
 * @lc app=leetcode.cn id=188 lang=typescript
 *
 * [188] 买卖股票的最佳时机 IV
 *
 * https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-iv/description/
 *
 * algorithms
 * Hard (53.70%)
 * Likes:    1311
 * Dislikes: 0
 * Total Accepted:    352.1K
 * Total Submissions: 654.1K
 * Testcase Example:  '2\n[2,4,1]'
 *
 * 给你一个整数数组 prices 和一个整数 k ，其中 prices[i] 是某支给定的股票在第 i 天的价格。
 *
 * 设计一个算法来计算你所能获取的最大利润。你最多可以完成 k 笔交易。也就是说，你最多可以买 k 次，卖 k 次。
 *
 * 注意：你不能同时参与多笔交易（你必须在再次购买前出售掉之前的股票）。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：k = 2, prices = [2,4,1]
 * 输出：2
 * 解释：在第 1 天 (股票价格 = 2) 的时候买入，在第 2 天 (股票价格 = 4) 的时候卖出，这笔交易所能获得利润 = 4-2 = 2 。
 *
 * 示例 2：
 *
 *
 * 输入：k = 2, prices = [3,2,6,5,0,3]
 * 输出：7
 * 解释：在第 2 天 (股票价格 = 2) 的时候买入，在第 3 天 (股票价格 = 6) 的时候卖出, 这笔交易所能获得利润 = 6-2 = 4 。
 * ⁠    随后，在第 5 天 (股票价格 = 0) 的时候买入，在第 6 天 (股票价格 = 3) 的时候卖出, 这笔交易所能获得利润 = 3-0 =
 * 3 。
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= k <= 100
 * 1 <= prices.length <= 1000
 * 0 <= prices[i] <= 1000
 *
 *
 */

// @lc code=start
/**
 * 解法：动态规划（通用 k 笔交易）
 *
 * 核心思想：
 * 这是股票系列最通用的版本，可以完成最多 k 笔交易。
 * 需要维护 2k 个状态：每笔交易的买入和卖出状态。
 *
 * 关键优化：
 * - 如果 k >= prices.length / 2，相当于无限次交易（问题退化为 122 题）
 *   因为一笔交易至少需要2天，n天最多完成 n/2 笔交易
 * - 此时可以用贪心算法：累加所有上涨的差值
 *
 * 状态定义：
 * - buy[i]: 第 i 次买入后的最大利润
 * - sell[i]: 第 i 次卖出后的最大利润
 *
 * 状态转移方程：
 * - buy[i] = max(buy[i], sell[i-1] - price)
 *   第i次买入 = max(之前就买了, 用第i-1次卖出的利润买入)
 *
 * - sell[i] = max(sell[i], buy[i] + price)
 *   第i次卖出 = max(之前就卖了, 今天卖出)
 *
 * 初始状态：
 * - buy[i] = -Infinity (所有买入状态初始化为负无穷)
 * - sell[i] = 0 (所有卖出状态初始化为0)
 *
 * 示例演示 k=2, prices=[3,2,6,5,0,3]：
 * Day 0 (price=3): buy[0]=-3, sell[0]=0, buy[1]=-3, sell[1]=0
 * Day 1 (price=2): buy[0]=-2, sell[0]=0, buy[1]=-2, sell[1]=0
 * Day 2 (price=6): buy[0]=-2, sell[0]=4, buy[1]=-2, sell[1]=4
 * Day 3 (price=5): buy[0]=-2, sell[0]=4, buy[1]=-1, sell[1]=4
 * Day 4 (price=0): buy[0]=0,  sell[0]=4, buy[1]=4,  sell[1]=4
 * Day 5 (price=3): buy[0]=0,  sell[0]=4, buy[1]=4,  sell[1]=7
 * 最终结果：sell[1] = 7
 *
 * 时间复杂度：O(n×k)，其中 n 是天数，k 是交易次数
 * 空间复杂度：O(k)，使用两个数组存储 k 个状态
 */
function maxProfit(k: number, prices: number[]): number {
  // 边界处理：少于2天无法完成交易
  if (prices.length < 2 || k === 0) {
    return 0;
  }

  // 优化：如果 k >= prices.length / 2，相当于无限次交易
  // 此时退化为问题 122（买卖股票的最佳时机 II）
  // 使用贪心算法：累加所有上涨的差值
  if (k >= Math.floor(prices.length / 2)) {
    let profit = 0;
    for (let i = 1; i < prices.length; i++) {
      // 只要今天价格比昨天高，就进行交易
      if (prices[i] > prices[i - 1]) {
        profit += prices[i] - prices[i - 1];
      }
    }
    return profit;
  }

  // 一般情况：k < prices.length / 2
  // 创建两个数组，分别存储每次交易的买入和卖出状态
  const buy: number[] = new Array(k).fill(-Infinity); // 买入状态，初始为负无穷
  const sell: number[] = new Array(k).fill(0); // 卖出状态，初始为0

  // 遍历每一天的价格
  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];

    // 遍历每一笔交易（从第1笔到第k笔）
    for (let j = 0; j < k; j++) {
      // 更新第 j 次买入的状态
      if (j === 0) {
        // 第一次买入：直接用初始资金买入
        buy[j] = Math.max(buy[j], -price);
      } else {
        // 第 j 次买入：用第 j-1 次卖出的利润买入
        buy[j] = Math.max(buy[j], sell[j - 1] - price);
      }

      // 更新第 j 次卖出的状态
      // 第 j 次卖出：在第 j 次买入的基础上卖出
      sell[j] = Math.max(sell[j], buy[j] + price);
    }
  }

  // 返回第 k 次卖出后的最大利润
  // 注意：如果实际交易次数少于 k 次，sell[k-1] 会自动等于最优交易次数的利润
  return sell[k - 1];
}
// @lc code=end
