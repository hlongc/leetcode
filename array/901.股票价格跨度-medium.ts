/*
 * @lc app=leetcode.cn id=901 lang=typescript
 *
 * [901] 股票价格跨度
 *
 * https://leetcode.cn/problems/online-stock-span/description/
 *
 * algorithms
 * Medium (64.27%)
 * Likes:    507
 * Dislikes: 0
 * Total Accepted:    107.3K
 * Total Submissions: 167K
 * Testcase Example:  '["StockSpanner","next","next","next","next","next","next","next"]\n' +
  '[[],[100],[80],[60],[70],[60],[75],[85]]'
 *
 * 设计一个算法收集某些股票的每日报价，并返回该股票当日价格的 跨度 。
 * 
 * 当日股票价格的 跨度 被定义为股票价格小于或等于今天价格的最大连续日数（从今天开始往回数，包括今天）。
 * 
 * 
 * 
 * 例如，如果未来 7 天股票的价格是 [100,80,60,70,60,75,85]，那么股票跨度将是 [1,1,1,2,1,4,6] 。
 * 
 * 
 * 
 * 实现 StockSpanner 类：
 * 
 * 
 * StockSpanner() 初始化类对象。
 * int next(int price) 给出今天的股价 price ，返回该股票当日价格的 跨度 。
 * 
 * 
 * 
 * 
 * 示例：
 * 
 * 
 * 输入：
 * ["StockSpanner", "next", "next", "next", "next", "next", "next", "next"]
 * [[], [100], [80], [60], [70], [60], [75], [85]]
 * 输出：
 * [null, 1, 1, 1, 2, 1, 4, 6]
 * 
 * 解释：
 * StockSpanner stockSpanner = new StockSpanner();
 * stockSpanner.next(100); // 返回 1
 * stockSpanner.next(80);  // 返回 1
 * stockSpanner.next(60);  // 返回 1
 * stockSpanner.next(70);  // 返回 2
 * stockSpanner.next(60);  // 返回 1
 * stockSpanner.next(75);  // 返回 4 ，因为截至今天的最后 4 个股价 (包括今天的股价 75) 都小于或等于今天的股价。
 * stockSpanner.next(85);  // 返回 6
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 1 <= price <= 10^5
 * 最多调用 next 方法 10^4 次
 * 
 * 
 */

// @lc code=start
/**
 * 股票价格跨度 - 使用单调递减栈优化
 *
 * 核心思想：
 * 1. 使用单调递减栈存储 [价格, 跨度] 对
 * 2. 当新价格到来时，弹出所有小于等于当前价格的历史价格
 * 3. 累加被弹出价格的跨度，得到当前价格的跨度
 *
 * 时间复杂度：O(1) 均摊 - 每个元素最多入栈出栈一次
 * 空间复杂度：O(n) - 最坏情况下栈中存储所有价格
 */
class StockSpanner {
  // 单调递减栈：存储 [价格, 跨度] 对
  // 栈底到栈顶价格严格递减，跨度表示该价格能覆盖的连续天数
  private stack: [number, number][] = [];

  constructor() {}

  /**
   * 计算当前价格的跨度
   * @param price 当前股票价格
   * @returns 跨度（连续小于等于当前价格的天数）
   */
  next(price: number): number {
    // 当前价格的跨度至少为1（包含今天）
    let span = 1;

    // 维护单调递减栈：弹出所有小于等于当前价格的历史价格
    // 原理：如果历史价格 <= 当前价格，那么这些历史价格对后续计算没有意义
    // 因为任何未来价格如果 >= 当前价格，也一定 >= 这些被弹出的历史价格
    while (
      this.stack.length > 0 &&
      this.stack[this.stack.length - 1][0] <= price
    ) {
      // 累加被弹出价格的跨度
      // 这些被弹出的价格都 <= 当前价格，所以它们的跨度可以累加到当前跨度中
      span += this.stack.pop()![1];
    }

    // 将当前价格和其跨度入栈
    this.stack.push([price, span]);

    return span;
  }
}

/**
 * 执行示例：
 * 输入: [100, 80, 60, 70, 60, 75, 85]
 *
 * next(100): span=1, stack=[[100,1]]
 * next(80):  span=1, stack=[[100,1], [80,1]]
 * next(60):  span=1, stack=[[100,1], [80,1], [60,1]]
 * next(70):  span=2, stack=[[100,1], [80,1], [70,2]]  // 弹出[60,1]，span=1+1=2
 * next(60):  span=1, stack=[[100,1], [80,1], [70,2], [60,1]]
 * next(75):  span=4, stack=[[100,1], [80,1], [75,4]]  // 弹出[60,1]和[70,2]，span=1+1+2=4
 * next(85):  span=6, stack=[[85,6]]  // 弹出所有，span=1+1+4=6
 *
 * 输出: [1, 1, 1, 2, 1, 4, 6]
 */

/**
 * Your StockSpanner object will be instantiated and called as such:
 * var obj = new StockSpanner()
 * var param_1 = obj.next(price)
 */
// @lc code=end
