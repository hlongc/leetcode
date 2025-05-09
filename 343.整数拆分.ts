/*
 * @lc app=leetcode.cn id=343 lang=typescript
 *
 * [343] 整数拆分
 */

// @lc code=start
/**
 * 将正整数n拆分为至少两个正整数的和，并使这些整数的乘积最大化
 * @param n 需要拆分的正整数（2 <= n <= 58）
 * @return 可获得的最大乘积
 */
function integerBreak(n: number): number {
  // 特殊情况处理
  if (n === 2) return 1; // 2 = 1 + 1，乘积为 1
  if (n === 3) return 2; // 3 = 1 + 2，乘积为 2（注意3 = 1 + 1 + 1的乘积为1，不是最大值）

  // 创建dp数组，dp[i]表示将正整数i拆分后可获得的最大乘积
  const dp: number[] = Array(n + 1).fill(0);

  // 基础情况初始化
  dp[1] = 1; // 1不能再拆分
  dp[2] = 1; // 2只能拆分为1+1，乘积为1
  dp[3] = 2; // 3可以拆分为1+2，乘积为2

  // 自底向上计算每个数的最大乘积
  for (let i = 4; i <= n; i++) {
    // 尝试拆分i，j表示第一个拆分出的数
    for (let j = 1; j <= Math.floor(i / 2); j++) {
      // 两种情况：
      // 1. 将i拆分为j和i-j，并计算乘积j*(i-j)
      // 2. 将i拆分为j和dp[i-j]（表示i-j继续拆分的最大乘积）
      // 我们需要取两者的较大值，与当前dp[i]比较并更新
      dp[i] = Math.max(dp[i], Math.max(j * (i - j), j * dp[i - j]));
    }
  }

  return dp[n];
}
// @lc code=end
