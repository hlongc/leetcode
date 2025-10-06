/*
 * @lc app=leetcode.cn id=84 lang=typescript
 *
 * [84] 柱状图中最大的矩形
 *
 * https://leetcode.cn/problems/largest-rectangle-in-histogram/description/
 *
 * algorithms
 * Hard (48.20%)
 * Likes:    2997
 * Dislikes: 0
 * Total Accepted:    581.5K
 * Total Submissions: 1.2M
 * Testcase Example:  '[2,1,5,6,2,3]'
 *
 * 给定 n 个非负整数，用来表示柱状图中各个柱子的高度。每个柱子彼此相邻，且宽度为 1 。
 *
 * 求在该柱状图中，能够勾勒出来的矩形的最大面积。
 *
 *
 *
 * 示例 1:
 *
 *
 *
 *
 * 输入：heights = [2,1,5,6,2,3]
 * 输出：10
 * 解释：最大的矩形为图中红色区域，面积为 10
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入： heights = [2,4]
 * 输出： 4
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
function largestRectangleArea(heights: number[]): number {
  let maxArea = 0;
  const stack: number[] = []; // 存储柱子的索引，保持栈中索引对应的柱子高度单调递增

  // 遍历所有柱子，包括一个虚拟的0高度柱子（用于处理最后剩余的柱子）
  for (let i = 0; i <= heights.length; i++) {
    // 当前柱子的高度，如果是最后一个虚拟柱子则为0
    const currentHeight = i === heights.length ? 0 : heights[i];

    // 当栈不为空且当前柱子高度小于栈顶柱子高度时，需要计算以栈顶柱子为高的矩形面积
    while (
      stack.length > 0 &&
      heights[stack[stack.length - 1]] > currentHeight
    ) {
      // 弹出栈顶元素，计算以该柱子为高的最大矩形面积
      const height = heights[stack.pop()!];

      // 计算宽度：
      // 如果栈为空，说明当前柱子是栈中所有柱子中最矮的，宽度为i
      // 如果栈不为空，宽度为当前索引i减去新的栈顶索引再减1
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;

      // 更新最大面积
      maxArea = Math.max(maxArea, height * width);
    }

    // 将当前柱子索引压入栈中（保持单调递增栈的性质）
    stack.push(i);
  }

  return maxArea;
}
// @lc code=end
