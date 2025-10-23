/*
 * @lc app=leetcode.cn id=987 lang=typescript
 *
 * [987] 二叉树的垂序遍历
 *
 * https://leetcode.cn/problems/vertical-order-traversal-of-a-binary-tree/description/
 *
 * algorithms
 * Hard (58.34%)
 * Likes:    334
 * Dislikes: 0
 * Total Accepted:    51.6K
 * Total Submissions: 88.5K
 * Testcase Example:  '[3,9,20,null,null,15,7]'
 *
 * 给你二叉树的根结点 root ，请你设计算法计算二叉树的 垂序遍历 序列。
 *
 * 对位于 (row, col) 的每个结点而言，其左右子结点分别位于 (row + 1, col - 1) 和 (row + 1, col + 1)
 * 。树的根结点位于 (0, 0) 。
 *
 * 二叉树的 垂序遍历
 * 从最左边的列开始直到最右边的列结束，按列索引每一列上的所有结点，形成一个按出现位置从上到下排序的有序列表。如果同行同列上有多个结点，则按结点的值从小到大进行排序。
 *
 * 返回二叉树的 垂序遍历 序列。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [3,9,20,null,null,15,7]
 * 输出：[[9],[3,15],[20],[7]]
 * 解释：
 * 列 -1 ：只有结点 9 在此列中。
 * 列  0 ：只有结点 3 和 15 在此列中，按从上到下顺序。
 * 列  1 ：只有结点 20 在此列中。
 * 列  2 ：只有结点 7 在此列中。
 *
 * 示例 2：
 *
 *
 * 输入：root = [1,2,3,4,5,6,7]
 * 输出：[[4],[2],[1,5,6],[3],[7]]
 * 解释：
 * 列 -2 ：只有结点 4 在此列中。
 * 列 -1 ：只有结点 2 在此列中。
 * 列  0 ：结点 1 、5 和 6 都在此列中。
 * ⁠         1 在上面，所以它出现在前面。
 * ⁠         5 和 6 位置都是 (2, 0) ，所以按值从小到大排序，5 在 6 的前面。
 * 列  1 ：只有结点 3 在此列中。
 * 列  2 ：只有结点 7 在此列中。
 *
 *
 * 示例 3：
 *
 *
 * 输入：root = [1,2,3,4,6,5,7]
 * 输出：[[4],[2],[1,5,6],[3],[7]]
 * 解释：
 * 这个示例实际上与示例 2 完全相同，只是结点 5 和 6 在树中的位置发生了交换。
 * 因为 5 和 6 的位置仍然相同，所以答案保持不变，仍然按值从小到大排序。
 *
 *
 *
 * 提示：
 *
 *
 * 树中结点数目总数在范围 [1, 1000] 内
 * 0 <= Node.val <= 1000
 *
 *
 */

// @lc code=start
/**
 * Definition for a binary tree node.
 * class TreeNode {
 *     val: number
 *     left: TreeNode | null
 *     right: TreeNode | null
 *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.left = (left===undefined ? null : left)
 *         this.right = (right===undefined ? null : right)
 *     }
 * }
 */

/**
 * 解法一：DFS + 排序（推荐）
 *
 * 核心思路：
 * 1. 使用 DFS 遍历树，记录每个节点的 (行row, 列col, 值val)
 * 2. 对所有节点按照以下规则排序：
 *    - 优先按列从小到大排序（从左到右）
 *    - 列相同则按行从小到大排序（从上到下）
 *    - 行列都相同则按值从小到大排序
 * 3. 将相同列的节点值收集到一起
 *
 * 坐标系统：
 * - 根节点位于 (0, 0)
 * - 左子节点：(row + 1, col - 1)
 * - 右子节点：(row + 1, col + 1)
 *
 * 时间复杂度：O(n log n)，n 是节点数，主要是排序的时间
 * 空间复杂度：O(n)，存储所有节点信息
 */
function verticalTraversal(root: TreeNode | null): number[][] {
  if (root === null) return [];

  // 存储每个节点的信息 [row, col, val]
  const nodes: [number, number, number][] = [];

  /**
   * DFS 遍历树，记录每个节点的坐标和值
   * @param node 当前节点
   * @param row 当前行号
   * @param col 当前列号
   */
  function dfs(node: TreeNode | null, row: number, col: number): void {
    if (node === null) return;

    // 记录当前节点的位置和值
    nodes.push([row, col, node.val]);

    // 遍历左子树：行+1，列-1
    dfs(node.left, row + 1, col - 1);

    // 遍历右子树：行+1，列+1
    dfs(node.right, row + 1, col + 1);
  }

  // 从根节点开始遍历
  dfs(root, 0, 0);

  // 排序：列 -> 行 -> 值
  nodes.sort((a, b) => {
    // 首先按列排序（从左到右）
    if (a[1] !== b[1]) return a[1] - b[1];
    // 列相同，按行排序（从上到下）
    if (a[0] !== b[0]) return a[0] - b[0];
    // 行列都相同，按值排序（从小到大）
    return a[2] - b[2];
  });

  // 收集结果：将相同列的节点值组合在一起
  const result: number[][] = [];
  let currentCol = nodes[0][1]; // 当前列号
  let currentGroup: number[] = []; // 当前列的节点值

  for (const [row, col, val] of nodes) {
    if (col === currentCol) {
      // 还是同一列，加入当前组
      currentGroup.push(val);
    } else {
      // 遇到新列，保存当前组，开始新组
      result.push(currentGroup);
      currentGroup = [val];
      currentCol = col;
    }
  }

  // 别忘了最后一组
  result.push(currentGroup);

  return result;
}

/**
 * 解法二：BFS + 排序
 *
 * 核心思路：与解法一类似，但使用 BFS 进行遍历
 *
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(n)
 */
function verticalTraversal2(root: TreeNode | null): number[][] {
  if (root === null) return [];

  const nodes: [number, number, number][] = [];

  // 队列存储 [节点, 行号, 列号]
  const queue: [TreeNode, number, number][] = [[root, 0, 0]];

  while (queue.length > 0) {
    const [node, row, col] = queue.shift()!;

    // 记录当前节点
    nodes.push([row, col, node.val]);

    // 左子节点入队
    if (node.left) {
      queue.push([node.left, row + 1, col - 1]);
    }

    // 右子节点入队
    if (node.right) {
      queue.push([node.right, row + 1, col + 1]);
    }
  }

  // 排序和收集结果（与解法一相同）
  nodes.sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[2] - b[2];
  });

  const result: number[][] = [];
  let currentCol = nodes[0][1];
  let currentGroup: number[] = [];

  for (const [row, col, val] of nodes) {
    if (col === currentCol) {
      currentGroup.push(val);
    } else {
      result.push(currentGroup);
      currentGroup = [val];
      currentCol = col;
    }
  }

  result.push(currentGroup);
  return result;
}

/**
 * 解法三：使用 Map 优化收集过程
 *
 * 核心思路：
 * 使用 Map 按列分组，避免最后的遍历收集步骤
 *
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(n)
 */
function verticalTraversal3(root: TreeNode | null): number[][] {
  if (root === null) return [];

  // Map<列号, [row, val][]>
  const colMap = new Map<number, [number, number][]>();
  let minCol = 0;
  let maxCol = 0;

  /**
   * DFS 遍历并按列分组
   */
  function dfs(node: TreeNode | null, row: number, col: number): void {
    if (node === null) return;

    // 记录列的范围
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);

    // 将节点信息加入对应的列
    if (!colMap.has(col)) {
      colMap.set(col, []);
    }
    colMap.get(col)!.push([row, node.val]);

    dfs(node.left, row + 1, col - 1);
    dfs(node.right, row + 1, col + 1);
  }

  dfs(root, 0, 0);

  // 按列顺序构建结果
  const result: number[][] = [];

  for (let col = minCol; col <= maxCol; col++) {
    if (colMap.has(col)) {
      const nodes = colMap.get(col)!;

      // 对当前列的节点排序：先按行，再按值
      nodes.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0]; // 按行排序
        return a[1] - b[1]; // 按值排序
      });

      // 提取值
      result.push(nodes.map(([row, val]) => val));
    }
  }

  return result;
}

/**
 * 图解示例：
 *
 * 示例 1：root = [3,9,20,null,null,15,7]
 *
 *        3 (0,0)
 *       / \
 *  (1,-1)9   20(1,1)
 *           / \
 *     (2,0)15  7(2,2)
 *
 * 坐标解析：
 * - 节点 3: row=0, col=0
 * - 节点 9: row=1, col=-1 (左子)
 * - 节点 20: row=1, col=1 (右子)
 * - 节点 15: row=2, col=0 (20的左子)
 * - 节点 7: row=2, col=2 (20的右子)
 *
 * 排序后：
 * col=-1: [9]
 * col=0:  [3, 15] (行0的3在前，行2的15在后)
 * col=1:  [20]
 * col=2:  [7]
 *
 * 输出：[[9],[3,15],[20],[7]]
 *
 * ---
 *
 * 示例 2：root = [1,2,3,4,5,6,7]
 *
 *          1 (0,0)
 *         / \
 *    (1,-1)2  3(1,1)
 *       / \  / \
 * (2,-2)4 5 6  7(2,2)
 *       (2,0)(2,0)
 *
 * 关键点：节点 5 和 6 都在 (2, 0) 位置
 * - 同行同列，按值排序：5 < 6
 *
 * 排序后：
 * col=-2: [4]
 * col=-1: [2]
 * col=0:  [1, 5, 6] (1在行0，5和6在行2，5<6所以5在前)
 * col=1:  [3]
 * col=2:  [7]
 *
 * 输出：[[4],[2],[1,5,6],[3],[7]]
 *
 * ---
 *
 * 排序规则总结：
 * 1. 优先级1：列号（从左到右）
 * 2. 优先级2：行号（从上到下）
 * 3. 优先级3：节点值（从小到大）
 *
 * 这三个优先级缺一不可！
 */
// @lc code=end
