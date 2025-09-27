/*
 * @lc app=leetcode.cn id=107 lang=typescript
 *
 * [107] 二叉树的层序遍历 II
 *
 * https://leetcode.cn/problems/binary-tree-level-order-traversal-ii/description/
 *
 * algorithms
 * Medium (75.22%)
 * Likes:    835
 * Dislikes: 0
 * Total Accepted:    389.5K
 * Total Submissions: 517.5K
 * Testcase Example:  '[3,9,20,null,null,15,7]'
 *
 * 给你二叉树的根节点 root ，返回其节点值 自底向上的层序遍历 。 （即按从叶子节点所在层到根节点所在的层，逐层从左向右遍历）
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [3,9,20,null,null,15,7]
 * 输出：[[15,7],[9,20],[3]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [1]
 * 输出：[[1]]
 *
 *
 * 示例 3：
 *
 *
 * 输入：root = []
 * 输出：[]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数目在范围 [0, 2000] 内
 * -1000 <= Node.val <= 1000
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
 * 二叉树的层序遍历 II - 自底向上的层序遍历
 * 思路：先进行正常的层序遍历，然后反转结果数组
 *
 * 算法步骤：
 * 1. 使用BFS进行正常的层序遍历
 * 2. 将每层的结果按从上到下的顺序存储
 * 3. 最后反转结果数组，得到自底向上的遍历结果
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(w)，其中 w 是树的最大宽度
 */
function levelOrderBottom(root: TreeNode | null): number[][] {
  // 边界情况：空树直接返回空数组
  if (!root) return [];

  const result: number[][] = [];
  const queue: TreeNode[] = [root];

  // BFS层序遍历
  while (queue.length > 0) {
    const levelSize = queue.length; // 当前层的节点数量
    const currentLevel: number[] = []; // 当前层的节点值数组

    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!; // 取出队列头部的节点
      currentLevel.push(node.val); // 将节点值加入当前层数组

      // 将子节点加入队列（下一层）
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    // 将当前层的结果加入结果数组
    result.push(currentLevel);
  }

  // 反转结果数组，实现自底向上的遍历
  return result.reverse();
}

/**
 * 方法二：使用 unshift 直接构建自底向上的结果（更优雅的写法）
 * 思路：在每层处理完后，将结果插入到数组开头，避免最后的反转操作
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(w)，其中 w 是树的最大宽度
 */
function levelOrderBottomOptimized(root: TreeNode | null): number[][] {
  if (!root) return [];

  const result: number[][] = [];
  const queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: number[] = [];

    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      currentLevel.push(node.val);

      // 将子节点加入队列
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    // 将当前层结果插入到数组开头，实现自底向上的效果
    result.unshift(currentLevel);
  }

  return result;
}

/**
 * 方法三：使用递归 + DFS 的实现（另一种思路）
 * 思路：使用深度优先搜索，记录每层的节点，最后反转结果
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(h)，其中 h 是树的高度（递归调用栈的深度）
 */
function levelOrderBottomDFS(root: TreeNode | null): number[][] {
  if (!root) return [];

  const result: number[][] = [];

  // DFS递归函数
  const dfs = (node: TreeNode, level: number) => {
    // 如果当前层还没有数组，创建一个
    if (!result[level]) {
      result[level] = [];
    }

    // 将当前节点值加入对应层
    result[level].push(node.val);

    // 递归处理子节点
    if (node.left) dfs(node.left, level + 1);
    if (node.right) dfs(node.right, level + 1);
  };

  // 从根节点开始DFS
  dfs(root, 0);

  // 反转结果数组
  return result.reverse();
}
// @lc code=end
