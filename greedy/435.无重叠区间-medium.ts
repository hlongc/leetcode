/*
 * @lc app=leetcode.cn id=435 lang=typescript
 *
 * [435] 无重叠区间
 *
 * https://leetcode.cn/problems/non-overlapping-intervals/description/
 *
 * algorithms
 * Medium (52.76%)
 * Likes:    1215
 * Dislikes: 0
 * Total Accepted:    324.7K
 * Total Submissions: 614.8K
 * Testcase Example:  '[[1,2],[2,3],[3,4],[1,3]]'
 *
 * 给定一个区间的集合 intervals ，其中 intervals[i] = [starti, endi] 。返回
 * 需要移除区间的最小数量，使剩余区间互不重叠 。
 *
 * 注意 只在一点上接触的区间是 不重叠的。例如 [1, 2] 和 [2, 3] 是不重叠的。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: intervals = [[1,2],[2,3],[3,4],[1,3]]
 * 输出: 1
 * 解释: 移除 [1,3] 后，剩下的区间没有重叠。
 *
 *
 * 示例 2:
 *
 *
 * 输入: intervals = [ [1,2], [1,2], [1,2] ]
 * 输出: 2
 * 解释: 你需要移除两个 [1,2] 来使剩下的区间没有重叠。
 *
 *
 * 示例 3:
 *
 *
 * 输入: intervals = [ [1,2], [2,3] ]
 * 输出: 0
 * 解释: 你不需要移除任何区间，因为它们已经是无重叠的了。
 *
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= intervals.length <= 10^5
 * intervals[i].length == 2
 * -5 * 10^4 <= starti < endi <= 5 * 10^4
 *
 *
 */

// @lc code=start
function eraseOverlapIntervals(intervals: number[][]): number {
  // 如果区间集合为空，则不需要移除任何区间
  if (intervals.length === 0) return 0;

  // 按区间的结束位置（右端点）升序排序
  // 选择结束位置早的区间，可以为后面的区间留下更多空间
  intervals.sort((a, b) => a[1] - b[1]);

  // 记录需要移除的区间数量
  let count = 0;
  // 记录当前选择的区间的结束位置
  let end = intervals[0][1];

  // 从第二个区间开始遍历
  for (let i = 1; i < intervals.length; i++) {
    // 如果当前区间的开始位置小于上一个被选中区间的结束位置，说明有重叠
    if (intervals[i][0] < end) {
      // 移除当前区间，计数加1
      count++;
    } else {
      // 无重叠，可以选择当前区间，更新结束位置
      end = intervals[i][1];
    }
  }

  return count;
}
// @lc code=end
