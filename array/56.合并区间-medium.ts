/*
 * @lc app=leetcode.cn id=56 lang=typescript
 *
 * [56] 合并区间
 *
 * https://leetcode.cn/problems/merge-intervals/description/
 *
 * algorithms
 * Medium (52.21%)
 * Likes:    2650
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 2.5M
 * Testcase Example:  '[[1,3],[2,6],[8,10],[15,18]]'
 *
 * 以数组 intervals 表示若干个区间的集合，其中单个区间为 intervals[i] = [starti, endi]
 * 。请你合并所有重叠的区间，并返回 一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：intervals = [[1,3],[2,6],[8,10],[15,18]]
 * 输出：[[1,6],[8,10],[15,18]]
 * 解释：区间 [1,3] 和 [2,6] 重叠, 将它们合并为 [1,6].
 *
 *
 * 示例 2：
 *
 *
 * 输入：intervals = [[1,4],[4,5]]
 * 输出：[[1,5]]
 * 解释：区间 [1,4] 和 [4,5] 可被视为重叠区间。
 *
 * 示例 3：
 *
 *
 * 输入：intervals = [[4,7],[1,4]]
 * 输出：[[1,7]]
 * 解释：区间 [1,4] 和 [4,7] 可被视为重叠区间。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= intervals.length <= 10^4
 * intervals[i].length == 2
 * 0 <= starti <= endi <= 10^4
 *
 *
 */

// @lc code=start
function merge(intervals: number[][]): number[][] {
  // 边界情况：如果区间数组为空或只有一个区间，直接返回
  if (intervals.length <= 1) {
    return intervals;
  }

  // 第一步：按照区间的起始位置进行排序
  // 这样我们可以从左到右依次处理区间，确保重叠的区间是相邻的
  intervals.sort((a, b) => a[0] - b[0]);

  // 存储合并后结果的数组
  const result: number[][] = [];

  // 将第一个区间加入结果数组，作为当前正在处理的区间
  result.push(intervals[0]);

  // 从第二个区间开始遍历
  for (let i = 1; i < intervals.length; i++) {
    // 获取当前区间
    const currentInterval = intervals[i];

    // 获取结果数组中最后一个区间（即当前正在处理的区间）
    const lastMergedInterval = result[result.length - 1];

    // 判断当前区间是否与最后一个已合并的区间重叠
    // 重叠条件：当前区间的起始位置 <= 最后一个区间的结束位置
    // 例如：[1,3] 和 [2,6] 重叠，因为 2 <= 3
    // 例如：[1,4] 和 [4,5] 重叠，因为 4 <= 4
    if (currentInterval[0] <= lastMergedInterval[1]) {
      // 如果重叠，则合并这两个区间
      // 合并规则：起始位置取较小的，结束位置取较大的
      lastMergedInterval[1] = Math.max(
        lastMergedInterval[1],
        currentInterval[1]
      );
    } else {
      // 如果不重叠，则将当前区间加入结果数组
      // 这样它就成为新的"最后一个区间"，供后续区间比较
      result.push(currentInterval);
    }
  }

  return result;
}
// @lc code=end
