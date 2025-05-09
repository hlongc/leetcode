/*
 * @lc app=leetcode.cn id=452 lang=typescript
 *
 * [452] 用最少数量的箭引爆气球
 *
 * https://leetcode.cn/problems/minimum-number-of-arrows-to-burst-balloons/description/
 *
 * algorithms
 * Medium (52.74%)
 * Likes:    1088
 * Dislikes: 0
 * Total Accepted:    358.3K
 * Total Submissions: 678.4K
 * Testcase Example:  '[[10,16],[2,8],[1,6],[7,12]]'
 *
 * 有一些球形气球贴在一堵用 XY 平面表示的墙面上。墙面上的气球记录在整数数组 points ，其中points[i] = [xstart, xend]
 * 表示水平直径在 xstart 和 xend之间的气球。你不知道气球的确切 y 坐标。
 *
 * 一支弓箭可以沿着 x 轴从不同点 完全垂直 地射出。在坐标 x 处射出一支箭，若有一个气球的直径的开始和结束坐标为 xstart，xend， 且满足
 * xstart ≤ x ≤ xend，则该气球会被 引爆 。可以射出的弓箭的数量 没有限制 。 弓箭一旦被射出之后，可以无限地前进。
 *
 * 给你一个数组 points ，返回引爆所有气球所必须射出的 最小 弓箭数 。
 *
 *
 * 示例 1：
 *
 *
 * 输入：points = [[10,16],[2,8],[1,6],[7,12]]
 * 输出：2
 * 解释：气球可以用2支箭来爆破:
 * -在x = 6处射出箭，击破气球[2,8]和[1,6]。
 * -在x = 11处发射箭，击破气球[10,16]和[7,12]。
 *
 * 示例 2：
 *
 *
 * 输入：points = [[1,2],[3,4],[5,6],[7,8]]
 * 输出：4
 * 解释：每个气球需要射出一支箭，总共需要4支箭。
 *
 * 示例 3：
 *
 *
 * 输入：points = [[1,2],[2,3],[3,4],[4,5]]
 * 输出：2
 * 解释：气球可以用2支箭来爆破:
 * - 在x = 2处发射箭，击破气球[1,2]和[2,3]。
 * - 在x = 4处射出箭，击破气球[3,4]和[4,5]。
 *
 *
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= points.length <= 10^5
 * points[i].length == 2
 * -2^31 <= xstart < xend <= 2^31 - 1
 *
 *
 */

// @lc code=start
function findMinArrowShots(points: number[][]): number {
  // 处理边界情况：如果没有气球，不需要射箭
  if (points.length === 0) return 0;

  // 按气球的右边界（结束位置）升序排序
  // 这是贪心策略的关键：优先考虑右边界小的气球
  points.sort((a, b) => a[1] - b[1]);

  // 至少需要一支箭
  let arrowCount = 1;
  // 记录当前箭的位置（射在第一个气球的右边界）
  let arrowPos = points[0][1];

  // 遍历所有气球
  for (let i = 1; i < points.length; i++) {
    // 当前气球的左边界
    const start = points[i][0];

    // 如果当前气球的左边界大于箭的位置
    // 说明当前箭无法引爆这个气球，需要增加一支箭
    if (start > arrowPos) {
      arrowCount++;
      // 新箭的位置设在当前气球的右边界
      arrowPos = points[i][1];
    }
    // 如果当前气球的左边界小于等于箭的位置
    // 说明当前箭可以引爆这个气球，不需要增加箭的数量
    // 箭的位置也不需要更新（保持在重叠区间的最小右边界）
  }

  return arrowCount;
}
// @lc code=end
