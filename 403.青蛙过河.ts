/*
 * @lc app=leetcode.cn id=403 lang=typescript
 *
 * [403] 青蛙过河
 */

// @lc code=start
/**
 * 判断青蛙能否过河
 *
 * @param stones 石头位置数组
 * @returns 能否到达最后一个石头
 */
function canCross(stones: number[]): boolean {
  const n = stones.length;

  // 特殊情况处理：第一步必须是1，否则无法开始跳跃
  if (stones[1] !== 1) return false;

  // 如果任意相邻石头距离超过了前面所有可能的跳跃距离之和，则无法到达终点
  // 因为青蛙的跳跃距离最多只能+1
  for (let i = 3; i < n; i++) {
    if (stones[i] > stones[i - 1] * 2) {
      return false;
    }
  }

  // 使用哈希表存储每个石头的位置到索引的映射，方便快速查找
  const stoneMap = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    stoneMap.set(stones[i], i);
  }

  // 使用记忆化存储，key为"位置_跳跃距离"，value为是否可达
  const memo = new Map<string, boolean>();

  /**
   * 递归函数：判断从当前位置出发，使用上一次的跳跃距离，能否到达终点
   *
   * @param index 当前石头的索引
   * @param k 上一次的跳跃距离
   * @returns 能否到达终点
   */
  function dp(index: number, k: number): boolean {
    // 基础情况：已经到达最后一个石头
    if (index === n - 1) {
      return true;
    }

    // 检查记忆化缓存
    const key = `${index}_${k}`;
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    // 尝试三种可能的跳跃距离：k-1, k, k+1
    for (let nextK of [k - 1, k, k + 1]) {
      // 跳跃距离必须大于0
      if (nextK <= 0) continue;

      // 计算下一个位置
      const nextPosition = stones[index] + nextK;

      // 检查下一个位置是否有石头
      if (stoneMap.has(nextPosition)) {
        const nextIndex = stoneMap.get(nextPosition)!;
        // 递归判断从下一个位置能否到达终点
        if (dp(nextIndex, nextK)) {
          memo.set(key, true);
          return true;
        }
      }
    }

    // 所有可能的跳跃都无法到达终点
    memo.set(key, false);
    return false;
  }

  // 从第二个石头开始，初始跳跃距离为1
  return dp(1, 1);
}

/**
 * 备选解法：自底向上的动态规划
 */
function canCross2(stones: number[]): boolean {
  const n = stones.length;

  // 特殊情况：第一步必须是1
  if (stones[1] !== 1) return false;

  // dp[i][j] 表示能否通过跳跃j个单位到达第i个石头
  const dp: Map<number, boolean>[] = Array(n)
    .fill(0)
    .map(() => new Map());

  // 初始化：第一个石头可以跳跃0个单位到达
  dp[0].set(0, true);

  // 遍历每个石头
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      // 计算从位置j到位置i的跳跃距离
      const jump = stones[i] - stones[j];

      // 检查在位置j时，是否可以跳跃jump-1，jump或jump+1个单位
      for (const k of [jump - 1, jump, jump + 1]) {
        if (dp[j].has(k) && dp[j].get(k)) {
          dp[i].set(jump, true);
          break;
        }
      }
    }
  }

  // 检查最后一个石头是否可达（是否存在至少一个有效的跳跃距离）
  return dp[n - 1].size > 0;
}
// @lc code=end
