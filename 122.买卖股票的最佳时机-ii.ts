/*
 * @lc app=leetcode.cn id=122 lang=typescript
 *
 * [122] 买卖股票的最佳时机 II
 */

// @lc code=start
function maxProfit(prices: number[]): number {
  // 特殊情况处理：如果价格数组为空或只有一个元素，无法交易，返回0
  if (prices.length <= 1) {
    return 0;
  }

  // 贪心算法思路：只要后一天的价格高于前一天，就在前一天买入，后一天卖出
  // 这样可以获取所有的上涨收益
  let totalProfit = 0;

  // 遍历价格数组，从第二天开始
  for (let i = 1; i < prices.length; i++) {
    // 如果当天价格高于前一天
    if (prices[i] > prices[i - 1]) {
      // 累加这一天可以获得的利润（当天价格减去前一天价格）
      totalProfit += prices[i] - prices[i - 1];
    }
    // 如果当天价格低于或等于前一天，不进行交易
  }

  // 返回最终的总利润
  return totalProfit;
}
// @lc code=end
