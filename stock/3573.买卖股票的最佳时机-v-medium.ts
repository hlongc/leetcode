/*
 * @lc app=leetcode.cn id=3573 lang=typescript
 *
 * [3573] 买卖股票的最佳时机 V
 *
 * https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-v/description/
 *
 * algorithms
 * Medium (49.33%)
 * Likes:    11
 * Dislikes: 0
 * Total Accepted:    2.6K
 * Total Submissions: 5.2K
 * Testcase Example:  '[1,7,9,8,2]\n2'
 *
 * 给你一个整数数组 prices，其中 prices[i] 是第 i 天股票的价格（美元），以及一个整数 k。
 *
 * 你最多可以进行 k 笔交易，每笔交易可以是以下任一类型：
 *
 *
 *
 * 普通交易：在第 i 天买入，然后在之后的第 j 天卖出，其中 i < j。你的利润是 prices[j] -
 * prices[i]。
 *
 *
 * 做空交易：在第 i 天卖出，然后在之后的第 j 天买回，其中 i < j。你的利润是 prices[i] - prices[j]。
 *
 *
 *
 * 注意：你必须在开始下一笔交易之前完成当前交易。此外，你不能在已经进行买入或卖出操作的同一天再次进行买入或卖出操作。
 *
 * 通过进行 最多 k 笔交易，返回你可以获得的最大总利润。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: prices = [1,7,9,8,2], k = 2
 *
 * 输出: 14
 *
 * 解释:
 * 我们可以通过 2 笔交易获得 14 美元的利润：
 *
 *
 * 一笔普通交易：第 0 天以 1 美元买入，第 2 天以 9 美元卖出。
 * 一笔做空交易：第 3 天以 8 美元卖出，第 4 天以 2 美元买回。
 *
 *
 *
 * 示例 2:
 *
 *
 * 输入: prices = [12,16,19,19,8,1,19,13,9], k = 3
 *
 * 输出: 36
 *
 * 解释:
 * 我们可以通过 3 笔交易获得 36 美元的利润：
 *
 *
 * 一笔普通交易：第 0 天以 12 美元买入，第 2 天以 19 美元卖出。
 * 一笔做空交易：第 3 天以 19 美元卖出，第 4 天以 8 美元买回。
 * 一笔普通交易：第 5 天以 1 美元买入，第 6 天以 19 美元卖出。
 *
 *
 *
 *
 *
 * 提示:
 *
 *
 * 2 <= prices.length <= 10^3
 * 1 <= prices[i] <= 10^9
 * 1 <= k <= prices.length / 2
 *
 *
 */

// @lc code=start
/**
 * 解法：O(n·k) 动态规划（允许做多/做空，禁止同日两次操作）
 *
 * 关键约束：
 * - 允许做多（买→卖）和做空（卖→买），每次开仓到平仓计为 1 笔交易；
 * - 同一天不能进行两次操作（例如：今天卖出后，不能在同一天再次买入开仓）。
 *
 * 状态设计（按“天”和“已完成交易数”分层）：
 * - flat[t]  ：第 d 天结束时，已完成 t 笔交易，空仓的最大收益；
 * - long[t]  ：第 d 天结束时，已完成 t 笔交易，持有多头仓位的最大收益；
 * - short[t] ：第 d 天结束时，已完成 t 笔交易，持有空头仓位的最大收益；
 *
 * 转移（从前一日 d-1 到今日 d，只允许“至多一次操作”）：
 * - 维持：flat/long/short 可各自沿用昨日状态；
 * - 开多：long[t]  = max(long[t],  flat_prev[t]  - price)
 * - 开空：short[t] = max(short[t], flat_prev[t]  + price)
 * - 平多：flat[t+1] = max(flat[t+1], long_prev[t]  + price)
 * - 平空：flat[t+1] = max(flat[t+1], short_prev[t] - price)
 *
 * 注：所有“开/平”操作仅依赖于“昨日”的状态，从而自然禁止了“同日平仓后再开仓”。
 * 答案为最后一天所有 flat[t] (0 ≤ t ≤ k) 的最大值。
 *
 * 初始化要点：
 * - 第 0 天前（虚拟“前一天”）默认空仓且未完成任何交易：flatPrev[0] = 0；
 * - 其它 t>0 的 flatPrev[t] 与所有持仓态均设为 -∞，表示不可能的起始状态；
 * - 这样“开仓”只能从合法的空仓态出发，且必须“先开后平”才会使 t 加 1。
 *
 * 手算小例（prices=[1,7,9,8,2], k=2）：
 * - d=0, p=1：可开多得到 long[0]=0-1=-1，或开空得到 short[0]=0+1=1；
 * - d=2, p=9：
 *   · 若此前持多：平多得 flat[1]=(-1)+9=8；
 *   · 若此前持空：继续持空或择机平空（此例更优策略是稍后做空）；
 * - d=3, p=8：从 flat[1]=8 开空得到 short[1]=8+8=16；
 * - d=4, p=2：从 short[1]=16 平空得 flat[2]=16-2=14；
 * 最终答案 max_t(flat[t]) = 14，与题解一致（先做多赚 8，再做空赚 6）。
 *
 * 时间复杂度：O(n·k)；空间复杂度：O(k)
 */
function maximumProfit(prices: number[], k: number): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;

  // dp 按“已完成交易数”压缩为一维
  const flatPrev: number[] = new Array(k + 1).fill(Number.NEGATIVE_INFINITY);
  const longPrev: number[] = new Array(k + 1).fill(Number.NEGATIVE_INFINITY);
  const shortPrev: number[] = new Array(k + 1).fill(Number.NEGATIVE_INFINITY);
  // 合法的初始状态：空仓且完成 0 笔交易
  flatPrev[0] = 0;

  for (let day = 0; day < n; day++) {
    const price = prices[day];

    const flatCur: number[] = new Array(k + 1).fill(Number.NEGATIVE_INFINITY);
    const longCur: number[] = new Array(k + 1).fill(Number.NEGATIVE_INFINITY);
    const shortCur: number[] = new Array(k + 1).fill(Number.NEGATIVE_INFINITY);

    for (let t = 0; t <= k; t++) {
      // 1) 维持昨日状态（今日不操作）
      flatCur[t] = Math.max(flatCur[t], flatPrev[t]);
      longCur[t] = Math.max(longCur[t], longPrev[t]);
      shortCur[t] = Math.max(shortCur[t], shortPrev[t]);

      // 2) 今日开仓（从“昨日空仓”开多/开空，不增加已完成交易数）
      if (flatPrev[t] !== Number.NEGATIVE_INFINITY) {
        longCur[t] = Math.max(longCur[t], flatPrev[t] - price); // 买入开多
        shortCur[t] = Math.max(shortCur[t], flatPrev[t] + price); // 卖出开空
      }

      // 3) 今日平仓（从“昨日持仓”平多/平空，已完成交易数 +1）
      if (t < k) {
        if (longPrev[t] !== Number.NEGATIVE_INFINITY) {
          flatCur[t + 1] = Math.max(flatCur[t + 1], longPrev[t] + price); // 卖出平多
        }
        if (shortPrev[t] !== Number.NEGATIVE_INFINITY) {
          flatCur[t + 1] = Math.max(flatCur[t + 1], shortPrev[t] - price); // 买回平空
        }
      }
    }

    // 滚动到下一天
    for (let t = 0; t <= k; t++) {
      flatPrev[t] = flatCur[t];
      longPrev[t] = longCur[t];
      shortPrev[t] = shortCur[t];
    }
  }

  // 结果：最后一天空仓的最大收益（最多 k 笔交易）
  let ans = 0;
  for (let t = 0; t <= k; t++) ans = Math.max(ans, flatPrev[t]);
  return ans;
}
// @lc code=end
