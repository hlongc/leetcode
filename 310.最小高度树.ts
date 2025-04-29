/*
 * @lc app=leetcode.cn id=310 lang=typescript
 *
 * [310] 最小高度树
 */

// @lc code=start
/**
 * 寻找最小高度树的根节点
 * 题目要求：在一个无向树中找到以某个节点为根的树，使其高度最小
 *
 * 解题思路：从外向内"剥洋葱"
 * 1. 观察：最小高度树的根节点一定在图的"中心"位置，可能有1个或2个
 * 2. 方法：从叶子节点(度为1的节点)开始，逐层删除，最后剩下的节点就是答案
 *
 * 图解流程：
 * - 找出所有叶子节点(度为1的节点)
 * - 删除这些叶子节点及其边
 * - 删除后，会产生新的叶子节点
 * - 重复上述过程，直到剩下1个或2个节点
 *
 * 时间复杂度：O(n)，其中n是节点数量
 * 空间复杂度：O(n)，用于存储图结构
 *
 * @param n 节点数量
 * @param edges 边的列表，每条边表示为[a, b]
 * @return 所有可能的最小高度树的根节点列表
 */
function findMinHeightTrees(n: number, edges: number[][]): number[] {
  // 特殊情况处理：如果只有一个节点
  if (n === 1) return [0];

  // 构建邻接表表示图
  const graph: number[][] = Array.from({ length: n }, () => []);

  // 记录每个节点的度（连接的边数）
  const degrees: number[] = new Array(n).fill(0);

  // 构建图并计算每个节点的度
  for (const [a, b] of edges) {
    // 无向图，添加双向边
    graph[a].push(b);
    graph[b].push(a);
    // 更新节点的度
    degrees[a]++;
    degrees[b]++;
  }

  // 初始化叶子节点队列（度为1的节点）
  const leaves: number[] = [];
  for (let i = 0; i < n; i++) {
    if (degrees[i] === 1) {
      leaves.push(i);
    }
  }

  // 剩余节点数量
  let remainingNodes = n;

  // 从外向内"剥洋葱"，直到剩下1个或2个节点
  while (remainingNodes > 2) {
    // 获取当前层的叶子节点数量
    const leavesCount = leaves.length;
    // 移除当前层的所有叶子节点
    remainingNodes -= leavesCount;

    // 处理当前层的所有叶子节点
    for (let i = 0; i < leavesCount; i++) {
      const leaf = leaves.shift()!; // 取出一个叶子节点

      // 遍历叶子节点的邻居
      for (const neighbor of graph[leaf]) {
        // 减少邻居节点的度
        degrees[neighbor]--;
        // 如果邻居变成了新的叶子节点，加入队列
        if (degrees[neighbor] === 1) {
          leaves.push(neighbor);
        }
      }
    }
  }

  // 剩下的节点就是最小高度树的根节点
  return leaves;
}
// @lc code=end
