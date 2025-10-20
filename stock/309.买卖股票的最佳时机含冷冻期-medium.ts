/*
 * @lc app=leetcode.cn id=309 lang=typescript
 *
 * [309] 买卖股票的最佳时机含冷冻期
 *
 * https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-cooldown/description/
 *
 * algorithms
 * Medium (65.36%)
 * Likes:    1879
 * Dislikes: 0
 * Total Accepted:    399.7K
 * Total Submissions: 611.5K
 * Testcase Example:  '[1,2,3,0,2]'
 *
 * 给定一个整数数组prices，其中第  prices[i] 表示第 i 天的股票价格 。​
 *
 * 设计一个算法计算出最大利润。在满足以下约束条件下，你可以尽可能地完成更多的交易（多次买卖一支股票）:
 *
 *
 * 卖出股票后，你无法在第二天买入股票 (即冷冻期为 1 天)。
 *
 *
 * 注意：你不能同时参与多笔交易（你必须在再次购买前出售掉之前的股票）。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: prices = [1,2,3,0,2]
 * 输出: 3
 * 解释: 对应的交易状态为: [买入, 卖出, 冷冻期, 买入, 卖出]
 *
 * 示例 2:
 *
 *
 * 输入: prices = [1]
 * 输出: 0
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= prices.length <= 5000
 * 0 <= prices[i] <= 1000
 *
 *
 */

// @lc code=start
/**
 * 解法：动态规划（三状态机模型）
 *
 * 题目要点：
 * - 可以进行无限次买卖，但必须先卖出之前的股票才能再次买入；
 * - 卖出股票后的第二天为"冷冻期"，不能在冷冻期买入股票；
 * - 即：今天卖出 → 明天冷冻期（不能买） → 后天可以买入。
 *
 * 状态设计（按"天"维护三种互斥状态）：
 * - hold[i]  : 第 i 天结束时持有股票的最大收益；
 * - sold[i]  : 第 i 天结束时刚刚卖出股票（今天卖）的最大收益；
 * - cooldown[i]: 第 i 天结束时处于冷冻期或空仓（不持有且今天未卖出）的最大收益。
 *
 * 状态转移方程：
 * 1. hold[i] = max(
 *      hold[i-1],         // 昨天已持有，今天继续持有
 *      cooldown[i-1] - prices[i] // 昨天冷冻期/空仓，今天买入（只能从 cooldown 买入）
 *    )
 *
 * 2. sold[i] = hold[i-1] + prices[i]
 *    // 今天卖出，必须是昨天持有，今天卖出获得收益
 *
 * 3. cooldown[i] = max(
 *      cooldown[i-1],     // 昨天冷冻期，今天继续冷冻期/空仓
 *      sold[i-1]          // 昨天卖出，今天进入冷冻期
 *    )
 *
 * 初始化：
 * - hold[0] = -prices[0]      // 第 0 天买入，收益为负
 * - sold[0] = 0               // 第 0 天不可能卖出（因为没有前一天持有）
 * - cooldown[0] = 0           // 第 0 天不操作，收益为 0
 *
 * 手算示例（prices = [1,2,3,0,2]）：
 *
 * 初始：hold[0]=-1, sold[0]=0, cooldown[0]=0
 *
 * i=1, price=2:
 *   hold[1]    = max(-1, 0-2)           = -1  (继续持有)
 *   sold[1]    = -1 + 2                 = 1   (卖出获利1)
 *   cooldown[1]= max(0, 0)              = 0
 *
 * i=2, price=3:
 *   hold[2]    = max(-1, 0-3)           = -1  (继续持有)
 *   sold[2]    = -1 + 3                 = 2   (卖出获利2)
 *   cooldown[2]= max(0, 1)              = 1   (昨天卖出，今天冷冻期)
 *
 * i=3, price=0:
 *   hold[3]    = max(-1, 1-0)           = 1   (从冷冻期买入)
 *   sold[3]    = -1 + 0                 = -1  (不优)
 *   cooldown[3]= max(1, 2)              = 2   (前天卖出后进入冷冻期)
 *
 * i=4, price=2:
 *   hold[4]    = max(1, 2-2)            = 1   (继续持有)
 *   sold[4]    = 1 + 2                  = 3   (卖出获利3)
 *   cooldown[4]= max(2, -1)             = 2
 *
 * 最终答案 = max(sold[4], cooldown[4]) = max(3, 2) = 3
 * 交易路径：第0天买入(1) → 第2天卖出(3) → 第3天冷冻期 → 第3天买入(0) → 第4天卖出(2)
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)（可优化为三个变量滚动）
 */
function maxProfit(prices: number[]): number {
  const n = prices.length;
  if (n <= 1) return 0;

  // 初始化三个状态
  let hold = -prices[0]; // 第 0 天买入
  let sold = 0; // 第 0 天无法卖出
  let cooldown = 0; // 第 0 天不操作

  // 从第 1 天开始遍历
  for (let i = 1; i < n; i++) {
    const price = prices[i];

    // 注意：这里需要用临时变量保存旧值，因为状态之间有依赖
    const prevHold = hold;
    const prevSold = sold;
    const prevCooldown = cooldown;

    // 更新三个状态
    hold = Math.max(prevHold, prevCooldown - price); // 继续持有 或 从冷冻期买入
    sold = prevHold + price; // 今天卖出
    cooldown = Math.max(prevCooldown, prevSold); // 继续冷冻期 或 昨天卖出后进入冷冻期
  }

  // 最后一天结束时，最优解一定是不持有股票（sold 或 cooldown）
  return Math.max(sold, cooldown);
}
// @lc code=end
