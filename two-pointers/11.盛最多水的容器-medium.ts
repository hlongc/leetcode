/*
 * @lc app=leetcode.cn id=11 lang=typescript
 *
 * [11] 盛最多水的容器
 *
 * https://leetcode.cn/problems/container-with-most-water/description/
 *
 * algorithms
 * Medium (61.19%)
 * Likes:    5630
 * Dislikes: 0
 * Total Accepted:    1.9M
 * Total Submissions: 3M
 * Testcase Example:  '[1,8,6,2,5,4,8,3,7]'
 *
 * 给定一个长度为 n 的整数数组 height 。有 n 条垂线，第 i 条线的两个端点是 (i, 0) 和 (i, height[i]) 。
 *
 * 找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。
 *
 * 返回容器可以储存的最大水量。
 *
 * 说明：你不能倾斜容器。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：[1,8,6,2,5,4,8,3,7]
 * 输出：49
 * 解释：图中垂直线代表输入数组 [1,8,6,2,5,4,8,3,7]。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 49。
 *
 * 示例 2：
 *
 *
 * 输入：height = [1,1]
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == height.length
 * 2 <= n <= 10^5
 * 0 <= height[i] <= 10^4
 *
 *
 */

// @lc code=start
/**
 * 计算容器可以储存的最大水量
 * @param height 高度数组，表示每个位置的垂线高度
 * @returns 可以储存的最大水量
 */
function maxArea(height: number[]): number {
  // 初始化最大面积为0（因为面积不可能为负数）
  let maxWater = 0;

  // 使用双指针，初始化在数组两端
  let left = 0;
  let right = height.length - 1;

  // 当左指针小于右指针时继续循环
  while (left < right) {
    // 计算当前宽度
    const width = right - left;
    // 计算当前高度（取两边较短的一边）
    const minHeight = Math.min(height[left], height[right]);
    // 更新最大面积
    const area = width * minHeight;
    maxWater = Math.max(maxWater, area);

    // 移动较短的那一侧的指针
    // 因为面积由短板决定，移动短板才有可能获得更大的面积
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}
// @lc code=end
