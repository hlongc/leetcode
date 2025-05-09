/*
 * @lc app=leetcode.cn id=714 lang=typescript
 *
 * [714] 买卖股票的最佳时机含手续费
 */

// @lc code=start
function maxProfit(prices: number[], fee: number): number {
  // 如果价格数组为空或长度为1，无法交易，返回0
  if (prices.length <= 1) return 0;

  const n = prices.length;

  // 定义两个状态：
  // cash: 当前不持有股票时的最大利润
  // hold: 当前持有股票时的最大利润
  let cash = 0; // 初始状态：不持有股票，利润为0
  let hold = -prices[0]; // 初始状态：持有股票，利润为负的股票价格

  // 遍历每一天的价格
  for (let i = 1; i < n; i++) {
    const prevCash = cash; // 记录前一天的cash值
    // 计算今天不持有股票的最大利润：
    // 1. 昨天不持有股票，今天继续不持有
    // 2. 昨天持有股票，今天卖出（减去手续费）
    cash = Math.max(cash, hold + prices[i] - fee);

    // 计算今天持有股票的最大利润：
    // 1. 昨天持有股票，今天继续持有
    // 2. 昨天不持有股票，今天买入
    hold = Math.max(hold, prevCash - prices[i]);
  }

  // 最终结果应该是不持有股票状态的最大利润
  // 因为持有股票的话，还需要卖出才能变现
  return cash;
}
// @lc code=end
