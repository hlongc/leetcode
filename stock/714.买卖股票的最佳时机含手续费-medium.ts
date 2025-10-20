/*
 * @lc app=leetcode.cn id=714 lang=typescript
 *
 * [714] 买卖股票的最佳时机含手续费
 *
 * https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/description/
 *
 * algorithms
 * Medium (77.40%)
 * Likes:    1156
 * Dislikes: 0
 * Total Accepted:    336.2K
 * Total Submissions: 434.3K
 * Testcase Example:  '[1,3,2,8,4,9]\n2'
 *
 * 给定一个整数数组 prices，其中 prices[i]表示第 i 天的股票价格 ；整数 fee 代表了交易股票的手续费用。
 *
 * 你可以无限次地完成交易，但是你每笔交易都需要付手续费。如果你已经购买了一个股票，在卖出它之前你就不能再继续购买股票了。
 *
 * 返回获得利润的最大值。
 *
 * 注意：这里的一笔交易指买入持有并卖出股票的整个过程，每笔交易你只需要为支付一次手续费。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：prices = [1, 3, 2, 8, 4, 9], fee = 2
 * 输出：8
 * 解释：能够达到的最大利润:
 * 在此处买入 prices[0] = 1
 * 在此处卖出 prices[3] = 8
 * 在此处买入 prices[4] = 4
 * 在此处卖出 prices[5] = 9
 * 总利润: ((8 - 1) - 2) + ((9 - 4) - 2) = 8
 *
 * 示例 2：
 *
 *
 * 输入：prices = [1,3,7,5,10,3], fee = 3
 * 输出：6
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= prices.length <= 5 * 10^4
 * 1 <= prices[i] < 5 * 10^4
 * 0 <= fee < 5 * 10^4
 *
 *
 */

// @lc code=start
/**
 * 解法：动态规划（状态机）
 *
 * 核心思想：
 * 每一天都有两种状态：
 * 1. 持有股票（buy）：要么昨天就持有，要么今天刚买入
 * 2. 不持有股票（sell）：要么昨天就不持有，要么今天刚卖出
 *
 * 状态转移方程：
 * - buy[i] = max(buy[i-1], sell[i-1] - prices[i])
 *   持有股票的最大利润 = max(昨天就持有, 今天买入)
 *
 * - sell[i] = max(sell[i-1], buy[i-1] + prices[i] - fee)
 *   不持有股票的最大利润 = max(昨天就不持有, 今天卖出并扣除手续费)
 *
 * 关键点：
 * - 手续费在卖出时扣除（也可以选择在买入时扣除，结果一样）
 * - 可以无限次交易，但每次交易需要付手续费
 * - 必须先买入才能卖出（不能同时持有多支股票）
 *
 * 示例演示 [1,3,2,8,4,9], fee=2：
 * Day 0: buy=-1, sell=0
 * Day 1: buy=-1, sell=0 (卖出利润1-2=-1，不划算)
 * Day 2: buy=-1, sell=0
 * Day 3: buy=-1, sell=5 (在价格1买入，价格8卖出: 8-1-2=5)
 * Day 4: buy=1, sell=5 (在价格4买入: 5-4=1)
 * Day 5: buy=1, sell=8 (在价格9卖出: 1+9-2=8)
 * 最终结果：8
 *
 * 时间复杂度：O(n)，遍历数组一次
 * 空间复杂度：O(1)，只使用两个变量记录状态
 */
function maxProfit(prices: number[], fee: number): number {
  // 边界处理：少于2天无法完成交易
  if (prices.length < 2) {
    return 0;
  }

  // buy: 当前持有股票时的最大利润
  // 初始值为 -prices[0]，表示第0天买入股票后的现金
  let buy = -prices[0];

  // sell: 当前不持有股票时的最大利润
  // 初始值为 0，表示第0天不进行任何操作
  let sell = 0;

  // 从第1天开始遍历
  for (let i = 1; i < prices.length; i++) {
    // 计算今天持有股票的最大利润
    // 两种选择：
    // 1. 继续持有昨天的股票：buy（不变）
    // 2. 今天买入股票：sell - prices[i]（用昨天不持有股票的利润买入）
    const newBuy = Math.max(buy, sell - prices[i]);

    // 计算今天不持有股票的最大利润
    // 两种选择：
    // 1. 继续不持有股票：sell（不变）
    // 2. 今天卖出股票：buy + prices[i] - fee（卖出并扣除手续费）
    const newSell = Math.max(sell, buy + prices[i] - fee);

    // 更新状态
    buy = newBuy;
    sell = newSell;
  }

  // 最终不持有股票的状态一定比持有股票的利润更高
  // 因为如果持有股票，卖出后利润会更大
  return sell;
}
// @lc code=end
