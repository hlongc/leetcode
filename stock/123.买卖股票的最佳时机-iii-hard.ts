/*
 * @lc app=leetcode.cn id=123 lang=typescript
 *
 * [123] 买卖股票的最佳时机 III
 *
 * https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-iii/description/
 *
 * algorithms
 * Hard (62.42%)
 * Likes:    1879
 * Dislikes: 0
 * Total Accepted:    438.7K
 * Total Submissions: 702.1K
 * Testcase Example:  '[3,3,5,0,0,3,1,4]'
 *
 * 给定一个数组，它的第 i 个元素是一支给定的股票在第 i 天的价格。
 *
 * 设计一个算法来计算你所能获取的最大利润。你最多可以完成 两笔 交易。
 *
 * 注意：你不能同时参与多笔交易（你必须在再次购买前出售掉之前的股票）。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入：prices = [3,3,5,0,0,3,1,4]
 * 输出：6
 * 解释：在第 4 天（股票价格 = 0）的时候买入，在第 6 天（股票价格 = 3）的时候卖出，这笔交易所能获得利润 = 3-0 = 3 。
 * 随后，在第 7 天（股票价格 = 1）的时候买入，在第 8 天 （股票价格 = 4）的时候卖出，这笔交易所能获得利润 = 4-1 = 3 。
 *
 * 示例 2：
 *
 *
 * 输入：prices = [1,2,3,4,5]
 * 输出：4
 * 解释：在第 1 天（股票价格 = 1）的时候买入，在第 5 天 （股票价格 = 5）的时候卖出, 这笔交易所能获得利润 = 5-1 = 4
 * 。
 * 注意你不能在第 1 天和第 2 天接连购买股票，之后再将它们卖出。
 * 因为这样属于同时参与了多笔交易，你必须在再次购买前出售掉之前的股票。
 *
 *
 * 示例 3：
 *
 *
 * 输入：prices = [7,6,4,3,1]
 * 输出：0
 * 解释：在这个情况下, 没有交易完成, 所以最大利润为 0。
 *
 * 示例 4：
 *
 *
 * 输入：prices = [1]
 * 输出：0
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
 * 解法：动态规划（状态机）
 *
 * 核心思想：
 * 由于最多只能完成两笔交易，我们需要维护四个状态：
 * 1. buy1: 第一次买入后的最大利润（现金流，为负数）
 * 2. sell1: 第一次卖出后的最大利润
 * 3. buy2: 第二次买入后的最大利润（用第一次交易的利润买入）
 * 4. sell2: 第二次卖出后的最大利润（最终答案）
 *
 * 状态转移方程：
 * - buy1 = max(buy1, -prices[i])
 *   第一次买入 = max(之前就买了, 今天买入)
 *
 * - sell1 = max(sell1, buy1 + prices[i])
 *   第一次卖出 = max(之前就卖了, 今天卖出)
 *
 * - buy2 = max(buy2, sell1 - prices[i])
 *   第二次买入 = max(之前就买了, 用第一次交易的利润今天买入)
 *
 * - sell2 = max(sell2, buy2 + prices[i])
 *   第二次卖出 = max(之前就卖了, 今天卖出)
 *
 * 初始状态：
 * - buy1 = -Infinity (还未买入)
 * - sell1 = 0 (没有交易)
 * - buy2 = -Infinity (还未买入第二次)
 * - sell2 = 0 (没有第二次交易)
 *
 * 示例演示 [3,3,5,0,0,3,1,4]：
 * i=0 (price=3): buy1=-3, sell1=0, buy2=-3, sell2=0
 * i=1 (price=3): buy1=-3, sell1=0, buy2=-3, sell2=0
 * i=2 (price=5): buy1=-3, sell1=2, buy2=-1, sell2=2
 * i=3 (price=0): buy1=0,  sell1=2, buy2=2,  sell2=2
 * i=4 (price=0): buy1=0,  sell1=2, buy2=2,  sell2=2
 * i=5 (price=3): buy1=0,  sell1=3, buy2=2,  sell2=5
 * i=6 (price=1): buy1=0,  sell1=3, buy2=2,  sell2=5
 * i=7 (price=4): buy1=0,  sell1=4, buy2=2,  sell2=6
 * 最终结果：sell2 = 6
 *
 * 时间复杂度：O(n)，遍历数组一次
 * 空间复杂度：O(1)，只使用四个变量记录状态
 */
function maxProfit(prices: number[]): number {
  // 边界处理：少于2天无法完成交易
  if (prices.length < 2) {
    return 0;
  }

  // 初始化四个状态
  // buy1: 第一次买入后的最大利润（初始为负无穷，表示还未买入）
  let buy1 = -Infinity;
  // sell1: 第一次卖出后的最大利润（初始为0，表示没有交易）
  let sell1 = 0;
  // buy2: 第二次买入后的最大利润（初始为负无穷，表示还未买入）
  let buy2 = -Infinity;
  // sell2: 第二次卖出后的最大利润（初始为0，表示没有第二次交易）
  let sell2 = 0;

  // 遍历每一天的价格
  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];

    // 更新第一次买入的状态
    // 两种选择：1) 之前就买入了 2) 今天买入（花费price，利润为-price）
    buy1 = Math.max(buy1, -price);

    // 更新第一次卖出的状态
    // 两种选择：1) 之前就卖出了 2) 今天卖出（获得price，总利润为buy1+price）
    sell1 = Math.max(sell1, buy1 + price);

    // 更新第二次买入的状态
    // 两种选择：1) 之前就买入了 2) 今天买入（用第一次交易的利润sell1买入）
    buy2 = Math.max(buy2, sell1 - price);

    // 更新第二次卖出的状态
    // 两种选择：1) 之前就卖出了 2) 今天卖出（获得price，总利润为buy2+price）
    sell2 = Math.max(sell2, buy2 + price);
  }

  // 返回第二次卖出后的最大利润
  // 注意：如果只做一次交易更优，sell2会等于sell1（因为buy2会等于sell1-price，sell2=buy2+price=sell1）
  // 如果不做交易，sell2为0
  return sell2;
}
// @lc code=end
