/*
 * @lc app=leetcode.cn id=210 lang=typescript
 *
 * [210] 课程表 II
 */

// @lc code=start
/**
 * 返回完成所有课程的学习顺序
 * 题目要求：给定课程总数和先修关系，返回一个可行的学习顺序，若不可能完成所有课程则返回空数组
 *
 * 解题思路：拓扑排序
 * 1. 课程表II是课程表I的扩展，不仅需要判断是否可以完成所有课程，还需要返回一个可行的学习顺序
 * 2. 使用基于入度的拓扑排序算法(BFS)，按顺序记录出队的节点，即为一种可行的学习顺序
 *
 * 时间复杂度：O(V+E)，其中V为课程数量，E为先修关系数量
 * 空间复杂度：O(V+E)，用于存储图结构和入度数组
 *
 * @param numCourses 课程总数
 * @param prerequisites 先修关系，prerequisites[i] = [a, b] 表示学习课程a前必须完成课程b
 * @return 一个可行的学习顺序数组，若不可能完成所有课程则返回空数组
 */
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  // 构建邻接表表示课程依赖关系：dependence[i]表示学完课程i后可以学习的课程列表
  const dependence: number[][] = Array.from({ length: numCourses }, () => []);
  // 记录每个课程的入度（先修课程数量）
  const inDegree: number[] = Array(numCourses).fill(0);

  // 构建图和计算入度
  for (const [course, pre] of prerequisites) {
    // 添加边：pre -> course（完成pre才能学course）
    dependence[pre].push(course);
    // 课程course的入度加1
    inDegree[course]++;
  }

  // 创建队列，将所有入度为0的课程（没有先修要求的课程）加入队列
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  // 结果数组，记录课程的学习顺序
  const ret: number[] = [];

  // BFS进行拓扑排序
  while (queue.length) {
    // 出队一个入度为0的课程（当前可以学习的课程）
    const curr = queue.shift()!;
    // 将当前课程加入结果数组（学习该课程）
    ret.push(curr);

    // 遍历当前课程完成后可以解锁的后续课程
    for (const item of dependence[curr]) {
      // 将后续课程的入度减1（表示完成了一门先修课）
      inDegree[item]--;

      // 如果入度变为0，表示该课程的所有先修课程都已完成，可以学习
      if (inDegree[item] === 0) {
        queue.push(item);
      }
    }
  }

  // 检查是否有环
  // 如果存在入度不为0的课程，说明存在环，无法完成所有课程
  return inDegree.some((item) => item > 0) ? [] : ret;
}

// @lc code=end
