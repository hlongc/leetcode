/*
 * @lc app=leetcode.cn id=624 lang=typescript
 *
 * [624] 数组列表中的最大距离
 *
 * https://leetcode.cn/problems/maximum-distance-in-arrays/description/
 *
 * algorithms
 * Medium (45.00%)
 * Likes:    174
 * Dislikes: 0
 * Total Accepted:    40.9K
 * Total Submissions: 90.9K
 * Testcase Example:  '[[1,2,3],[4,5],[1,2,3]]'
 *
 * 给定 m 个数组，每个数组都已经按照升序排好序了。
 *
 * 现在你需要从两个不同的数组中选择两个整数（每个数组选一个）并且计算它们的距离。两个整数 a 和 b 之间的距离定义为它们差的绝对值 |a-b| 。
 *
 * 返回最大距离。
 *
 * 示例 1：
 *
 *
 * 输入：[[1,2,3],[4,5],[1,2,3]]
 * 输出：4
 * 解释：
 * 一种得到答案 4 的方法是从第一个数组或者第三个数组中选择 1，同时从第二个数组中选择 5 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：arrays = [[1],[1]]
 * 输出：0
 *
 *
 *
 *
 * 提示：
 *
 *
 * m == arrays.length
 * 2 <= m <= 10^5
 * 1 <= arrays[i].length <= 500
 * -10^4 <= arrays[i][j] <= 10^4
 * arrays[i] 以 升序 排序。
 * 所有数组中最多有 10^5 个整数。
 *
 *
 *
 *
 */

// @lc code=start
function maxDistance(arrays: number[][]): number {
  // 题意：从两个不同的已升序数组中各取一个数，最大化 |a - b|
  // 关键观察：每个数组已排序，取每个数组的最小值与最大值即可代表其端点
  // 最优的跨数组差值只可能发生在“某数组最大值 - 另一数组最小值”或反过来
  // 因此线性扫描维护“之前所有数组的全局最小值/最大值”，并用当前数组两端尝试刷新答案

  // 初始化：用第一个数组的两端作为起始的全局最小/最大
  let globalMin = arrays[0][0];
  let globalMax = arrays[0][arrays[0].length - 1];
  let best = 0;

  // 从第二个数组开始，尝试与之前的全局边界组合
  for (let i = 1; i < arrays.length; i++) {
    const curr = arrays[i];
    const currMin = curr[0];
    const currMax = curr[curr.length - 1];

    // 选择不同数组：
    // 情况1：当前数组最大值 - 之前的全局最小值
    // 情况2：之前的全局最大值 - 当前数组最小值
    // 由于各自升序，直接用端点即可得到跨数组的最大差值候选
    best = Math.max(best, currMax - globalMin, globalMax - currMin);

    // 更新全局边界，供后面的数组使用
    globalMin = Math.min(globalMin, currMin);
    globalMax = Math.max(globalMax, currMax);
  }

  return best;
}
// @lc code=end
