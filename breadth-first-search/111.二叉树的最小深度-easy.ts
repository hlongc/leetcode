/*
 * @lc app=leetcode.cn id=111 lang=typescript
 *
 * [111] 二叉树的最小深度
 *
 * https://leetcode.cn/problems/minimum-depth-of-binary-tree/description/
 *
 * algorithms
 * Easy (55.86%)
 * Likes:    1275
 * Dislikes: 0
 * Total Accepted:    806.8K
 * Total Submissions: 1.4M
 * Testcase Example:  '[3,9,20,null,null,15,7]'
 *
 * 给定一个二叉树，找出其最小深度。
 *
 * 最小深度是从根节点到最近叶子节点的最短路径上的节点数量。
 *
 * 说明：叶子节点是指没有子节点的节点。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [3,9,20,null,null,15,7]
 * 输出：2
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [2,null,3,null,4,null,5,null,6]
 * 输出：5
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数的范围在 [0, 10^5] 内
 * -1000
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
 * 二叉树的最小深度 - 递归方式
 * 思路：最小深度是从根节点到最近叶子节点的最短路径上的节点数量
 *
 * 算法步骤：
 * 1. 如果节点为空，返回0
 * 2. 如果节点是叶子节点（左右子树都为空），返回1
 * 3. 如果只有左子树或只有右子树，返回非空子树的最小深度+1
 * 4. 如果左右子树都存在，返回两者最小深度的较小值+1
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(h)，其中 h 是树的高度（递归调用栈的深度）
 */
function minDepth1(root: TreeNode | null): number {
  // 边界情况：空节点返回0
  if (!root) return 0;

  // 叶子节点：左右子树都为空，深度为1
  if (!root.left && !root.right) return 1;

  // 只有左子树：返回左子树的最小深度+1
  if (!root.left) return minDepth(root.right) + 1;

  // 只有右子树：返回右子树的最小深度+1
  if (!root.right) return minDepth(root.left) + 1;

  // 左右子树都存在：返回两者最小深度的较小值+1
  return Math.min(minDepth(root.left), minDepth(root.right)) + 1;
}

/**
 * 方法二：迭代方式（BFS）- 更高效的实现
 * 思路：使用广度优先搜索，找到第一个叶子节点时返回深度
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(w)，其中 w 是树的最大宽度
 */
function minDepth(root: TreeNode | null): number {
  if (!root) return 0;

  const queue: TreeNode[] = [root];
  let depth = 1;

  while (queue.length > 0) {
    const levelSize = queue.length;

    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;

      // 如果找到叶子节点，直接返回当前深度
      if (!node.left && !node.right) {
        return depth;
      }

      // 将子节点加入队列
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    depth++;
  }

  return depth;
}
// @lc code=end
