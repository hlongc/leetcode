/*
 * @lc app=leetcode.cn id=210 lang=typescript
 *
 * [210] 课程表 II
 *
 * https://leetcode.cn/problems/course-schedule-ii/description/
 *
 * algorithms
 * Medium (58.89%)
 * Likes:    1027
 * Dislikes: 0
 * Total Accepted:    275.2K
 * Total Submissions: 466.9K
 * Testcase Example:  '2\n[[1,0]]'
 *
 * 现在你总共有 numCourses 门课需要选，记为 0 到 numCourses - 1。给你一个数组 prerequisites ，其中
 * prerequisites[i] = [ai, bi] ，表示在选修课程 ai 前 必须 先选修 bi 。
 *
 *
 * 例如，想要学习课程 0 ，你需要先完成课程 1 ，我们用一个匹配来表示：[0,1] 。
 *
 *
 * 返回你为了学完所有课程所安排的学习顺序。可能会有多个正确的顺序，你只要返回 任意一种 就可以了。如果不可能完成所有课程，返回 一个空数组 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：numCourses = 2, prerequisites = [[1,0]]
 * 输出：[0,1]
 * 解释：总共有 2 门课程。要学习课程 1，你需要先完成课程 0。因此，正确的课程顺序为 [0,1] 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
 * 输出：[0,2,1,3]
 * 解释：总共有 4 门课程。要学习课程 3，你应该先完成课程 1 和课程 2。并且课程 1 和课程 2 都应该排在课程 0 之后。
 * 因此，一个正确的课程顺序是 [0,1,2,3] 。另一个正确的排序是 [0,2,1,3] 。
 *
 * 示例 3：
 *
 *
 * 输入：numCourses = 1, prerequisites = []
 * 输出：[0]
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= numCourses <= 2000
 * 0 <= prerequisites.length <= numCourses * (numCourses - 1)
 * prerequisites[i].length == 2
 * 0 <= ai, bi < numCourses
 * ai != bi
 * 所有[ai, bi] 互不相同
 *
 *
 */

// @lc code=start
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  // 存储拓扑排序的结果序列
  const result: number[] = [];
  // 记录已完成的课程数量，用于检测是否存在环
  let completeCount = 0;

  // 构建邻接表：graph[i] 存储课程i的所有后续课程
  // 例如：graph[0] = [1, 2] 表示课程0完成后可以学习课程1和2
  const graph: number[][] = Array(numCourses)
    .fill(null)
    .map(() => []);

  // 入度数组：inDegree[i] 表示有多少个课程必须先于课程i完成
  // 例如：inDegree[1] = 2 表示有2个课程必须先于课程1完成
  const inDegree: number[] = Array(numCourses).fill(0);

  // 根据先修课程关系构建图
  // prerequisites[i] = [course, pre] 表示course依赖pre
  for (const [course, pre] of prerequisites) {
    graph[pre].push(course); // pre -> course (添加有向边)
    inDegree[course]++; // course的入度+1
  }

  // 队列用于BFS拓扑排序
  const queue: number[] = [];

  // 将所有入度为0的课程加入队列
  // 这些课程没有先修要求，可以立即开始学习
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  // BFS进行拓扑排序
  while (queue.length) {
    // 取出当前可以学习的课程
    const cur = queue.shift()!;
    // 将课程加入结果序列
    result.push(cur);
    // 完成课程数+1
    completeCount++;

    // 遍历当前课程的所有后续课程
    for (const course of graph[cur]) {
      // 后续课程的入度-1（因为其先修课程cur已完成）
      inDegree[course]--;

      // 如果后续课程的入度变为0，说明其所有先修课程都已完成
      if (inDegree[course] === 0) {
        queue.push(course); // 可以开始学习该课程
      }
    }
  }

  // 环检测：如果完成的课程数等于总课程数，说明没有环，返回结果
  // 否则说明存在环，无法完成所有课程，返回空数组
  return completeCount === numCourses ? result : [];
}

// @lc code=end
