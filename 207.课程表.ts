/*
 * @lc app=leetcode.cn id=207 lang=typescript
 *
 * [207] 课程表
 */

// @lc code=start
/**
 * 判断是否可以完成所有课程
 * 题目要求：给定课程总数和先修关系，判断是否可能完成所有课程的学习
 *
 * 解题思路：拓扑排序
 * 1. 这本质上是在有向图中检测是否存在环的问题
 * 2. 使用拓扑排序判断：如果能够形成有效的拓扑排序序列，就说明不存在环，可以完成所有课程
 * 3. 采用基于入度的拓扑排序算法（BFS）
 *
 * 时间复杂度：O(V+E)，其中V为课程数量，E为先修关系数量
 * 空间复杂度：O(V+E)，用于存储图结构和入度数组
 *
 * @param numCourses 课程总数
 * @param prerequisites 先修关系，prerequisites[i] = [a, b] 表示学习课程a前必须完成课程b
 * @return 是否可能完成所有课程
 */
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  // 构建邻接表表示图，并计算每个节点的入度
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const inDegree: number[] = new Array(numCourses).fill(0);

  // 构建图和计算入度
  for (const [course, prereq] of prerequisites) {
    // 添加边：prereq -> course（完成prereq才能学course）
    graph[prereq].push(course);
    // 课程course的入度加1
    inDegree[course]++;
  }

  // 创建队列，将所有入度为0的节点（没有先修课程的课程）加入队列
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  // 已访问的节点数量
  let visited = 0;

  // BFS进行拓扑排序
  while (queue.length) {
    // 出队一个入度为0的节点（当前可以学习的课程）
    const curr = queue.shift()!;
    // 访问节点数加1
    visited++;

    // 将所有相邻节点的入度减1
    for (const next of graph[curr]) {
      inDegree[next]--;
      // 如果入度变为0，加入队列
      if (inDegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  // 如果访问的节点数等于课程总数，说明所有课程都可以学习
  // 否则说明图中存在环，无法完成所有课程
  return visited === numCourses;
}
// @lc code=end
