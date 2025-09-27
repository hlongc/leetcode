/*
 * @lc app=leetcode.cn id=207 lang=typescript
 *
 * [207] 课程表
 *
 * https://leetcode.cn/problems/course-schedule/description/
 *
 * algorithms
 * Medium (55.24%)
 * Likes:    2141
 * Dislikes: 0
 * Total Accepted:    548.8K
 * Total Submissions: 992.4K
 * Testcase Example:  '2\n[[1,0]]'
 *
 * 你这个学期必须选修 numCourses 门课程，记为 0 到 numCourses - 1 。
 *
 * 在选修某些课程之前需要一些先修课程。 先修课程按数组 prerequisites 给出，其中 prerequisites[i] = [ai, bi]
 * ，表示如果要学习课程 ai 则 必须 先学习课程  bi 。
 *
 *
 * 例如，先修课程对 [0, 1] 表示：想要学习课程 0 ，你需要先完成课程 1 。
 *
 *
 * 请你判断是否可能完成所有课程的学习？如果可以，返回 true ；否则，返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：numCourses = 2, prerequisites = [[1,0]]
 * 输出：true
 * 解释：总共有 2 门课程。学习课程 1 之前，你需要完成课程 0 。这是可能的。
 *
 * 示例 2：
 *
 *
 * 输入：numCourses = 2, prerequisites = [[1,0],[0,1]]
 * 输出：false
 * 解释：总共有 2 门课程。学习课程 1 之前，你需要先完成​课程 0 ；并且学习课程 0 之前，你还应先完成课程 1 。这是不可能的。
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= numCourses <= 2000
 * 0 <= prerequisites.length <= 5000
 * prerequisites[i].length == 2
 * 0 <= ai, bi < numCourses
 * prerequisites[i] 中的所有课程对 互不相同
 *
 *
 */

// @lc code=start
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  // 构建邻接表和入度数组
  // graph[i] = [j, k, ...] 表示课程i指向课程j,k,... (指出去的箭头)
  // inDegree[i] = n 表示有n个课程指向课程i (指进来的箭头数量)
  const graph: number[][] = Array(numCourses)
    .fill(null)
    .map(() => []);
  const inDegree: number[] = Array(numCourses).fill(0);

  // 根据先修课程关系构建图
  // prerequisites[i] = [course, prerequisite] 表示course依赖prerequisite
  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course); // prerequisite -> course (添加指出去的箭头)
    inDegree[course]++; // course的入度+1 (增加指进来的箭头)
  }

  // 拓扑排序：从入度为0的课程开始，逐步完成课程
  const queue: number[] = [];

  // 将所有入度为0的课程加入队列（这些课程没有先修要求）
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  let completedCourses = 0; // 记录已完成的课程数量

  // BFS进行拓扑排序
  while (queue.length > 0) {
    const currentCourse = queue.shift()!; // 取出当前课程
    completedCourses++; // 完成课程数+1

    // 遍历当前课程的所有后续课程
    for (const nextCourse of graph[currentCourse]) {
      inDegree[nextCourse]--; // 后续课程的入度-1

      // 如果后续课程的入度变为0，说明其先修课程都已完成
      if (inDegree[nextCourse] === 0) {
        queue.push(nextCourse); // 加入队列等待处理
      }
    }
  }

  // 环检测：如果完成的课程数等于总课程数，说明没有环
  // 否则说明存在环，无法完成所有课程
  return completedCourses === numCourses;
}
// 方法2：DFS深度优先搜索 - 环检测
// 时间复杂度：O(V + E)，空间复杂度：O(V + E)
// 优势：不需要维护入度数组，代码更简洁
function canFinishDFS(numCourses: number, prerequisites: number[][]): boolean {
  // 构建邻接表
  const graph: number[][] = Array(numCourses)
    .fill(null)
    .map(() => []);

  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course);
  }

  // 状态：0-未访问，1-正在访问，2-已访问
  const state: number[] = Array(numCourses).fill(0);

  // DFS检测环
  function hasCycle(course: number): boolean {
    if (state[course] === 1) return true; // 发现环
    if (state[course] === 2) return false; // 已访问过，无环

    state[course] = 1; // 标记为正在访问

    // 访问所有后续课程
    for (const nextCourse of graph[course]) {
      if (hasCycle(nextCourse)) return true;
    }

    state[course] = 2; // 标记为已访问
    return false;
  }

  // 检查所有课程
  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0 && hasCycle(i)) {
      return false;
    }
  }

  return true;
}

// 方法3：优化的BFS - 使用Set提高查找效率
// 时间复杂度：O(V + E)，空间复杂度：O(V + E)
// 优势：在某些情况下比数组操作更快
function canFinishOptimizedBFS(
  numCourses: number,
  prerequisites: number[][]
): boolean {
  const graph: number[][] = Array(numCourses)
    .fill(null)
    .map(() => []);
  const inDegree: number[] = Array(numCourses).fill(0);

  // 构建图
  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course);
    inDegree[course]++;
  }

  // 使用Set存储入度为0的课程，查找和删除更高效
  const zeroInDegreeCourses = new Set<number>();
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      zeroInDegreeCourses.add(i);
    }
  }

  let completedCourses = 0;

  while (zeroInDegreeCourses.size > 0) {
    // 从Set中取出一个课程
    const currentCourse = zeroInDegreeCourses.values().next().value as number;
    zeroInDegreeCourses.delete(currentCourse);
    completedCourses++;

    // 处理后续课程
    for (const nextCourse of graph[currentCourse]) {
      inDegree[nextCourse]--;
      if (inDegree[nextCourse] === 0) {
        zeroInDegreeCourses.add(nextCourse);
      }
    }
  }

  return completedCourses === numCourses;
}

// 方法4：迭代式DFS - 避免递归栈溢出
// 时间复杂度：O(V + E)，空间复杂度：O(V + E)
// 优势：对于深度很大的图，避免栈溢出
function canFinishIterativeDFS(
  numCourses: number,
  prerequisites: number[][]
): boolean {
  const graph: number[][] = Array(numCourses)
    .fill(null)
    .map(() => []);

  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course);
  }

  const state: number[] = Array(numCourses).fill(0); // 0-未访问，1-正在访问，2-已访问

  for (let i = 0; i < numCourses; i++) {
    if (state[i] !== 0) continue;

    const stack: number[] = [i];

    while (stack.length > 0) {
      const course = stack[stack.length - 1];

      if (state[course] === 1) {
        // 正在访问的节点再次被访问，发现环
        return false;
      }

      if (state[course] === 2) {
        // 已访问过，弹出栈
        stack.pop();
        continue;
      }

      // 标记为正在访问
      state[course] = 1;

      // 将所有未访问的后续课程加入栈
      let hasUnvisitedNeighbor = false;
      for (const nextCourse of graph[course]) {
        if (state[nextCourse] === 0) {
          stack.push(nextCourse);
          hasUnvisitedNeighbor = true;
        } else if (state[nextCourse] === 1) {
          // 发现环
          return false;
        }
      }

      // 如果没有未访问的邻居，标记为已访问
      if (!hasUnvisitedNeighbor) {
        state[course] = 2;
        stack.pop();
      }
    }
  }

  return true;
}

// 方法5：三色标记法 - 更直观的环检测
// 时间复杂度：O(V + E)，空间复杂度：O(V + E)
// 优势：状态更清晰，易于理解和调试
function canFinishThreeColor(
  numCourses: number,
  prerequisites: number[][]
): boolean {
  const graph: number[][] = Array(numCourses)
    .fill(null)
    .map(() => []);

  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course);
  }

  // 三色标记：0-白色(未访问)，1-灰色(正在访问)，2-黑色(已访问)
  const color: number[] = Array(numCourses).fill(0);

  function dfs(course: number): boolean {
    if (color[course] === 1) return false; // 发现环
    if (color[course] === 2) return true; // 已访问过

    color[course] = 1; // 标记为正在访问

    for (const nextCourse of graph[course]) {
      if (!dfs(nextCourse)) return false;
    }

    color[course] = 2; // 标记为已访问
    return true;
  }

  for (let i = 0; i < numCourses; i++) {
    if (color[i] === 0 && !dfs(i)) {
      return false;
    }
  }

  return true;
}

/*
性能对比总结：

1. 原始BFS拓扑排序 (canFinish)
   - 时间复杂度：O(V + E)
   - 空间复杂度：O(V + E)
   - 优势：经典算法，稳定可靠
   - 适用：一般情况下的首选

2. DFS环检测 (canFinishDFS)
   - 时间复杂度：O(V + E)
   - 空间复杂度：O(V + E)
   - 优势：代码简洁，不需要维护入度数组
   - 适用：代码简洁性要求高的场景

3. 优化BFS (canFinishOptimizedBFS)
   - 时间复杂度：O(V + E)
   - 空间复杂度：O(V + E)
   - 优势：使用Set提高查找效率
   - 适用：课程数量很大时的优化

4. 迭代式DFS (canFinishIterativeDFS)
   - 时间复杂度：O(V + E)
   - 空间复杂度：O(V + E)
   - 优势：避免递归栈溢出
   - 适用：图深度很大的场景

5. 三色标记法 (canFinishThreeColor)
   - 时间复杂度：O(V + E)
   - 空间复杂度：O(V + E)
   - 优势：状态清晰，易于调试
   - 适用：需要详细状态跟踪的场景

实际选择建议：
- 对于LeetCode等竞赛：推荐使用DFS环检测，代码最简洁
- 对于生产环境：推荐使用原始BFS拓扑排序，最稳定
- 对于大数据量：推荐使用优化BFS或迭代式DFS
- 对于调试需求：推荐使用三色标记法

注意：所有方法的时间复杂度都是理论最优的O(V + E)，实际性能差异主要取决于：
1. 图的稀疏程度
2. 编程语言的实现细节
3. 硬件缓存特性
4. 具体的数据分布
*/

// @lc code=end
