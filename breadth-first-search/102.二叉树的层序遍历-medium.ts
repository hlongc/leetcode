/*
 * @lc app=leetcode.cn id=102 lang=typescript
 *
 * [102] 二叉树的层序遍历
 *
 * https://leetcode.cn/problems/binary-tree-level-order-traversal/description/
 *
 * algorithms
 * Medium (69.50%)
 * Likes:    2124
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 1.9M
 * Testcase Example:  '[3,9,20,null,null,15,7]'
 *
 * 给你二叉树的根节点 root ，返回其节点值的 层序遍历 。 （即逐层地，从左到右访问所有节点）。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [3,9,20,null,null,15,7]
 * 输出：[[3],[9,20],[15,7]]
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
 * 二叉树的层序遍历 - 迭代方式（BFS）
 * 思路：使用队列进行广度优先搜索，逐层处理节点
 *
 * 算法步骤：
 * 1. 将根节点加入队列
 * 2. 当队列不为空时：
 *    - 记录当前层的节点数量
 *    - 遍历当前层的所有节点，将节点值加入结果数组
 *    - 将当前层节点的子节点加入队列
 * 3. 重复步骤2直到队列为空
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(w)，其中 w 是树的最大宽度（队列中最多存储的节点数）
 */
function levelOrder(root: TreeNode | null): number[][] {
  // 边界情况：空树直接返回空数组
  if (!root) return [];

  const result: number[][] = []; // 存储最终结果
  const queue: TreeNode[] = [root]; // 队列，用于BFS遍历

  // 当队列不为空时继续处理
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

    // 将当前层的结果加入最终结果
    result.push(currentLevel);
  }

  return result;
}
// @lc code=end
