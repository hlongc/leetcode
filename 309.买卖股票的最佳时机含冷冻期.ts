/*
 * @lc app=leetcode.cn id=309 lang=typescript
 *
 * [309] 买卖股票的最佳时机含冷冻期
 */

// @lc code=start
function maxProfit(prices: number[]): number {
  // 特殊情况处理：如果价格数组为空或只有一个元素，无法交易，返回0
  if (prices.length <= 1) {
    return 0;
  }

  const n = prices.length;

  // 定义三种状态：
  // hold[i]: 第i天结束时，持有股票的最大利润
  // sold[i]: 第i天结束时，不持有股票，且当天卖出了股票的最大利润
  // rest[i]: 第i天结束时，不持有股票，且当天没有卖出股票的最大利润（处于冷冻期或不操作）

  // 初始化第0天的状态
  let hold = -prices[0]; // 第0天买入，利润为负的股票价格
  let sold = 0; // 第0天不可能卖出股票
  let rest = 0; // 第0天不做任何操作

  // 从第1天开始遍历
  for (let i = 1; i < n; i++) {
    // 保存前一天的状态，避免状态污染
    const prevHold = hold;
    const prevSold = sold;
    const prevRest = rest;

    // 第i天结束时持有股票的最大利润 = max(前一天就持有股票, 前一天不持有股票且不处于冷冻期今天买入)
    hold = Math.max(prevHold, prevRest - prices[i]);

    // 第i天结束时卖出股票的最大利润 = 前一天持有股票今天卖出
    sold = prevHold + prices[i];

    // 第i天结束时不持有股票且没卖出的最大利润 = max(前一天卖出股票今天冷冻期, 前一天就不持有股票且没卖出)
    rest = Math.max(prevSold, prevRest);
  }

  // 最终的最大利润是最后一天不持有股票的两种状态的较大值
  // 因为持有股票的利润一定小于不持有股票的利润（最后一天卖出会更优）
  return Math.max(sold, rest);
}
// @lc code=end
