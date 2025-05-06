/*
 * @lc app=leetcode.cn id=120 lang=typescript
 *
 * [120] 三角形最小路径和
 */

// @lc code=start
/**
 * 解法一：二维动态规划
 * 时间复杂度: O(n²)，其中n是三角形的高度
 * 空间复杂度: O(n²)，用于存储dp数组
 */
function minimumTotal1(triangle: number[][]): number {
  // 获取三角形的高度
  const h = triangle.length;
  // 创建二维dp数组，dp[i][j]表示从点(i,j)到底边的最小路径和
  const dp: number[][] = Array(h);
  for (let i = 0; i < h; i++) {
    dp[i] = Array(triangle[i].length).fill(0);
  }

  // 自底向上进行动态规划
  for (let i = h - 1; i >= 0; i--) {
    for (let j = 0; j < triangle[i].length; j++) {
      if (i === h - 1) {
        // 底层的dp值就是三角形对应位置的值
        dp[i][j] = triangle[i][j];
      } else {
        // 状态转移方程：当前位置的最小路径和 = 下一层相邻两个位置的最小路径和的较小值 + 当前位置的值
        dp[i][j] = Math.min(dp[i + 1][j], dp[i + 1][j + 1]) + triangle[i][j];
      }
    }
  }

  // 返回顶点到底边的最小路径和
  return dp[0][0];
}

/**
 * 解法二：一维动态规划（空间优化）
 * 时间复杂度: O(n²)，其中n是三角形的高度
 * 空间复杂度: O(n)，只使用一维数组存储状态
 */
function minimumTotal(triangle: number[][]): number {
  // 获取三角形的高度
  const h = triangle.length;
  // 创建一维dp数组，初始大小为三角形底边长度
  // dp[j]表示从底层到当前层第j个位置的最小路径和
  const dp: number[] = Array(triangle[h - 1].length).fill(0);

  // 自底向上进行动态规划
  for (let i = h - 1; i >= 0; i--) {
    for (let j = 0; j < triangle[i].length; j++) {
      if (i === h - 1) {
        // 初始化底层值
        dp[j] = triangle[i][j];
      } else {
        // 状态转移：dp[j]会被覆盖，表示从底层到当前(i,j)的最小路径和
        // 注意：必须从左到右遍历，因为dp[j+1]需要上一轮的值
        dp[j] = Math.min(dp[j], dp[j + 1]) + triangle[i][j];
      }
    }
  }

  // dp[0]最终保存从底层到顶点的最小路径和
  return dp[0];
}
// @lc code=end
