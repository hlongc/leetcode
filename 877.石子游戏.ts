/*
 * @lc app=leetcode.cn id=877 lang=typescript
 *
 * [877] 石子游戏
 */

// @lc code=start
/**
 * 石子游戏
 * 题目要求：两人轮流从行的开始或结束处取走一堆石子，获得石子总数更多的人获胜
 * 假设两人都采用最优策略
 *
 * 解法一：数学证明法（最优解）
 *
 * 思路：可以证明先手必胜
 * 1. 石子总数为奇数，所以不会平局
 * 2. 将石子分为偶数索引和奇数索引两组
 * 3. 先手可以选择总和更大的那一组
 * 4. 无论后手如何选择，先手都能继续选择同一组的石子
 *
 * 时间复杂度：O(1)
 * 空间复杂度：O(1)
 *
 * @param piles 石子数组
 * @return 先手是否能赢
 */
function stoneGame(piles: number[]): boolean {
  // 数学证明：先手必胜
  return true;
}

/**
 * 解法二：动态规划法（通用解，适用于更复杂的变种问题）
 *
 * 思路：使用二维DP
 * 1. dp[i][j]表示从piles[i]到piles[j]之间，当前玩家与对手得分差的最大值
 * 2. 状态转移方程：
 *    dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])
 * 3. 当dp[0][n-1] > 0时，先手胜利
 *
 * 时间复杂度：O(n²)
 * 空间复杂度：O(n²)
 *
 * @param piles 石子数组
 * @return 先手是否能赢
 */
function stoneGameDP(piles: number[]): boolean {
  const n = piles.length;

  // 创建DP数组，dp[i][j]表示从piles[i]到piles[j]，当前玩家与对手得分差的最大值
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  // 初始化：对角线上的值为石子的值（只有一堆石子时，先手肯定获取该堆）
  for (let i = 0; i < n; i++) {
    dp[i][i] = piles[i];
  }

  // 从小区间推导到大区间
  for (let len = 2; len <= n; len++) {
    // 区间长度
    for (let i = 0; i <= n - len; i++) {
      // 区间起点
      let j = i + len - 1; // 区间终点

      // 选择拿走左端还是右端石子，取最大差值
      // 当前玩家拿走piles[i]后，面对区间[i+1,j]，角色互换，之前的最大差值变为负值
      // 当前玩家拿走piles[j]后，面对区间[i,j-1]，角色互换，之前的最大差值变为负值
      dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
    }
  }

  // dp[0][n-1]表示面对整个数组，先手玩家与后手玩家的最大分数差
  // 如果大于0，则先手胜利
  return dp[0][n - 1] > 0;
}

/**
 * 解法三：贪心算法（不通用，仅作参考）
 *
 * 思路：总是选择两端中较大的一个
 * 存在反例，不一定正确。只在特定条件下成立。
 *
 * @param piles 石子数组
 * @return 先手是否能赢
 */
function stoneGameGreedy(piles: number[]): boolean {
  let alice = 0;
  let bob = 0;

  let left = 0;
  let right = piles.length - 1;
  let isAlice = true;

  while (left <= right) {
    // 选择两端较大的一个
    let picked = 0;
    if (piles[left] > piles[right]) {
      picked = piles[left++]; // 取左端并左移
    } else {
      picked = piles[right--]; // 取右端并右移
    }

    // 根据当前玩家分配得分
    if (isAlice) {
      alice += picked;
    } else {
      bob += picked;
    }

    // 切换玩家
    isAlice = !isAlice;
  }

  return alice > bob;
}
// @lc code=end
