/*
 * @lc app=leetcode.cn id=543 lang=typescript
 *
 * [543] 二叉树的直径
 *
 * https://leetcode.cn/problems/diameter-of-binary-tree/description/
 *
 * algorithms
 * Easy (63.64%)
 * Likes:    1832
 * Dislikes: 0
 * Total Accepted:    716.2K
 * Total Submissions: 1.1M
 * Testcase Example:  '[1,2,3,4,5]'
 *
 * 给你一棵二叉树的根节点，返回该树的 直径 。
 *
 * 二叉树的 直径 是指树中任意两个节点之间最长路径的 长度 。这条路径可能经过也可能不经过根节点 root 。
 *
 * 两节点之间路径的 长度 由它们之间边数表示。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [1,2,3,4,5]
 * 输出：3
 * 解释：3 ，取路径 [4,2,1,3] 或 [5,2,1,3] 的长度。
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [1,2]
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数目在范围 [1, 10^4] 内
 * -100 <= Node.val <= 100
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
 * 思路：
 * 1. 二叉树的直径 = 任意两个节点之间最长路径的边数
 * 2. 对于任意一个节点，经过该节点的最长路径 = 左子树深度 + 右子树深度
 * 3. 树的直径 = 所有节点的（左子树深度 + 右子树深度）的最大值
 * 4. 使用 DFS 后序遍历，计算每个节点的深度，同时更新最大直径
 *
 * 时间复杂度：O(n) - 需要遍历所有节点
 * 空间复杂度：O(h) - 递归栈的深度，h 为树的高度
 */
function diameterOfBinaryTree(root: TreeNode | null): number {
  // 用于记录最大直径
  let maxDiameter = 0;

  /**
   * DFS 计算节点的深度
   * @param node 当前节点
   * @returns 当前节点为根的子树的最大深度
   */
  function getDepth(node: TreeNode | null): number {
    // 空节点深度为 0
    if (node === null) {
      return 0;
    }

    // 递归计算左子树深度
    const leftDepth = getDepth(node.left);
    // 递归计算右子树深度
    const rightDepth = getDepth(node.right);

    // 更新最大直径
    // 经过当前节点的最长路径 = 左子树深度 + 右子树深度
    maxDiameter = Math.max(maxDiameter, leftDepth + rightDepth);

    // 返回当前节点的深度（左右子树中较深的那个 + 1）
    return Math.max(leftDepth, rightDepth) + 1;
  }

  // 从根节点开始 DFS
  getDepth(root);

  // 返回最大直径
  return maxDiameter;
}
// @lc code=end
