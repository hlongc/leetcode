/*
 * @lc app=leetcode.cn id=375 lang=typescript
 *
 * [375] 猜数字大小 II
 */

// @lc code=start
function getMoneyAmount(n: number): number {
  // 创建一个二维数组dp，dp[i][j]表示从数字i到j的范围内确保猜对数字的最小花费
  const dp: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // 通过区间长度递增的方式来填充dp数组
  for (let len = 2; len <= n; len++) {
    // 区间长度
    for (let start = 1; start <= n - len + 1; start++) {
      // 区间起点
      const end = start + len - 1; // 区间终点

      // 初始化为一个足够大的值
      dp[start][end] = Number.MAX_SAFE_INTEGER;

      // 尝试每个可能的猜测点
      for (let guess = start; guess <= end; guess++) {
        // 当我们猜测guess时：
        // 1. 支付guess金额
        // 2. 最坏情况是猜错，所以我们需要考虑左边和右边子区间的最大值
        // 3. 如果guess是区间的边界，则其中一侧子区间为空，代价为0
        const leftCost = guess === start ? 0 : dp[start][guess - 1]; // 猜小了的代价
        const rightCost = guess === end ? 0 : dp[guess + 1][end]; // 猜大了的代价

        // 在当前猜测点下的总代价 = 猜测点的值 + max(左区间代价, 右区间代价)
        const currentCost = guess + Math.max(leftCost, rightCost);

        // 更新dp[start][end]，找到所有可能猜测点中的最小代价
        dp[start][end] = Math.min(dp[start][end], currentCost);
      }
    }
  }

  // 返回从1到n范围内猜数字的最小代价
  return dp[1][n];
}
// @lc code=end
