/*
 * @lc app=leetcode.cn id=1022 lang=typescript
 *
 * [1022] 从根到叶的二进制数之和
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

function sumRootToLeaf(root: TreeNode | null, sum = 0): number {
  if (!root) return 0;
  sum = 2 * sum + root.val;
  if (!root.left && !root.right) {
    return sum;
  }
  return sumRootToLeaf(root.left, sum) + sumRootToLeaf(root.right, sum);
}
// @lc code=end
