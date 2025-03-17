/*
 * @lc app=leetcode.cn id=222 lang=typescript
 *
 * [222] 完全二叉树的节点个数
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

function countNodes(root: TreeNode | null): number {
  if (!root) return 0;
  let lh,
    rh = 0;
  let lNode: TreeNode | null = root;
  let rNode: TreeNode | null = root;

  while (lNode) {
    lh++;
    lNode = lNode.left;
  }

  while (rNode) {
    rh++;
    rNode = rNode.right;
  }
  // 如果左右的深度一样，说明是个完美二叉树，完美二叉树节点个数就是2^h-1
  if (lh === rh) {
    return 2 ** (lh - 1);
  }
  // 如果不是完美二叉树那就递归计算
  return 1 + countNodes(root.left) + countNodes(root.right);
}
// @lc code=end
