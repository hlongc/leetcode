/*
 * @lc app=leetcode.cn id=70 lang=typescript
 *
 * [70] 爬楼梯
 */

// @lc code=start
/**
 * 使用动态规划解决爬楼梯问题
 * 每次可以爬1或2个台阶，计算到达楼顶的不同方法数
 * @param n 楼梯的台阶总数
 * @returns 爬到楼顶的不同方法数
 */
function climbStairs(n: number): number {
  // 处理基础情况
  // n=1时，只有1种方法（爬1阶）
  // n=2时，有2种方法（爬1阶+1阶，或直接爬2阶）
  if (n <= 2) return n;

  // 使用滚动数组（空间优化）记录状态
  // prev: 表示爬到第i-2阶的方法数，初始为爬到第1阶的方法数
  let prev = 1;
  // cur: 表示爬到第i-1阶的方法数，初始为爬到第2阶的方法数
  let cur = 2;
  // 临时变量，用于交换状态
  let tmp = -1;

  // 从第3阶开始计算，直到第n阶
  for (let i = 3; i <= n; i++) {
    // 保存当前状态，用于后续更新prev
    tmp = cur;
    // 状态转移方程：爬到第i阶的方法数 = 爬到第i-1阶的方法数 + 爬到第i-2阶的方法数
    // 这是因为最后一步可以从第i-1阶爬1阶到达，或从第i-2阶爬2阶到达
    cur = prev + cur;
    // 更新prev为前一个状态，为下一轮计算做准备
    prev = tmp;
  }

  // 返回爬到第n阶的方法数
  return cur;
}
// @lc code=end
