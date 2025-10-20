/*
 * @lc app=leetcode.cn id=121 lang=typescript
 *
 * [121] 买卖股票的最佳时机
 *
 * https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/description/
 *
 * algorithms
 * Easy (59.20%)
 * Likes:    3918
 * Dislikes: 0
 * Total Accepted:    1.9M
 * Total Submissions: 3.3M
 * Testcase Example:  '[7,1,5,3,6,4]'
 *
 * 给定一个数组 prices ，它的第 i 个元素 prices[i] 表示一支给定股票第 i 天的价格。
 *
 * 你只能选择 某一天 买入这只股票，并选择在 未来的某一个不同的日子 卖出该股票。设计一个算法来计算你所能获取的最大利润。
 *
 * 返回你可以从这笔交易中获取的最大利润。如果你不能获取任何利润，返回 0 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：[7,1,5,3,6,4]
 * 输出：5
 * 解释：在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6-1 = 5 。
 * ⁠    注意利润不能是 7-1 = 6, 因为卖出价格需要大于买入价格；同时，你不能在买入前卖出股票。
 *
 *
 * 示例 2：
 *
 *
 * 输入：prices = [7,6,4,3,1]
 * 输出：0
 * 解释：在这种情况下, 没有交易完成, 所以最大利润为 0。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1
 * 0
 *
 *
 */

// @lc code=start
/**
 * 解法：一次遍历 + 贪心算法
 *
 * 核心思想：
 * - 要获得最大利润，需要在最低点买入，在最低点之后的最高点卖出
 * - 遍历过程中，维护两个关键信息：
 *   1. 到目前为止遇到的最低价格（minPrice）
 *   2. 到目前为止能获得的最大利润（maxProfit）
 *
 * 算法流程：
 * 1. 遍历每一天的价格
 * 2. 如果当前价格比历史最低价还低，更新最低价
 * 3. 否则，计算今天卖出能获得的利润，并更新最大利润
 * 4. 关键：只在遇到更低价格时更新买入点，保证买入在卖出之前
 *
 * 示例演示 [7,1,5,3,6,4]：
 * Day 0: price=7, minPrice=7, maxProfit=0
 * Day 1: price=1, minPrice=1, maxProfit=0 (发现更低价格，更新买入点)
 * Day 2: price=5, minPrice=1, maxProfit=4 (当前利润5-1=4)
 * Day 3: price=3, minPrice=1, maxProfit=4 (当前利润3-1=2，不更新)
 * Day 4: price=6, minPrice=1, maxProfit=5 (当前利润6-1=5)
 * Day 5: price=4, minPrice=1, maxProfit=5 (当前利润4-1=3，不更新)
 * 最终结果：5
 *
 * 时间复杂度：O(n)，只需遍历数组一次
 * 空间复杂度：O(1)，只使用常数个额外变量
 */
function maxProfit(prices: number[]): number {
  // 边界处理：少于2天无法完成交易
  if (prices.length <= 1) {
    return 0;
  }

  // minPrice: 记录到目前为止遇到的最低价格（买入价格）
  // 初始化为第一天的价格
  let minPrice = prices[0];

  // maxProfit: 记录到目前为止能获得的最大利润
  // 初始化为0（不交易的情况）
  let maxProfit = 0;

  // 从第二天开始遍历价格数组
  for (let i = 1; i < prices.length; i++) {
    const currentPrice = prices[i];

    // 如果当前价格比历史最低价还低，更新最低价
    // 这意味着在当前价格买入会更划算
    if (currentPrice < minPrice) {
      minPrice = currentPrice;
    } else {
      // 如果当前价格不是最低价，计算今天卖出的利润
      // 利润 = 当前价格 - 历史最低价
      const currentProfit = currentPrice - minPrice;

      // 更新最大利润
      // 如果今天卖出的利润更高，就更新最大利润
      maxProfit = Math.max(maxProfit, currentProfit);
    }
  }

  // 返回最大利润
  // 如果没有任何盈利机会，maxProfit 会保持为 0
  return maxProfit;
}
// @lc code=end
