/*
 * @lc app=leetcode.cn id=110 lang=typescript
 *
 * [110] 平衡二叉树
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

function getHeight(node: TreeNode | null): number {
  if (!node) return 0;
  return Math.max(getHeight(node.left), getHeight(node.right)) + 1;
}

/**
 * 平衡二叉树：左右节点的高度差距不超过1
 * @param root
 * @returns
 */
function isBalanced(root: TreeNode | null): boolean {
  if (!root) return true;
  return (
    isBalanced(root.left) &&
    isBalanced(root.right) &&
    Math.abs(getHeight(root.left) - getHeight(root.right)) <= 1
  );
}
// @lc code=end
