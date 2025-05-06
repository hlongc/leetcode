/*
 * @lc app=leetcode.cn id=121 lang=typescript
 *
 * [121] 买卖股票的最佳时机
 */

// @lc code=start
/**
 * 买卖股票的最佳时机 - 单次交易获取最大利润
 * 时间复杂度: O(n)，其中n是股票价格数组的长度
 * 空间复杂度: O(1)，只使用了常数级别的额外空间
 *
 * @param prices 股票每天的价格数组
 * @returns 最大利润（如果不能获取利润则返回0）
 */
function maxProfit(prices: number[]): number {
  // 边界检查
  if (prices.length <= 1) return 0;

  // 记录到目前为止的最大利润
  let maxProfit = 0;
  // 记录到目前为止的最低买入价格
  let minPrice = prices[0];

  // 一次遍历，同时更新最低买入价和最大利润
  for (let i = 1; i < prices.length; i++) {
    // 当前价格减去历史最低价，得到潜在利润
    const currentProfit = prices[i] - minPrice;
    // 更新最大利润
    maxProfit = Math.max(maxProfit, currentProfit);
    // 更新历史最低价
    minPrice = Math.min(minPrice, prices[i]);
  }

  return maxProfit;
}
// @lc code=end
