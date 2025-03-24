/*
 * @lc app=leetcode.cn id=112 lang=typescript
 *
 * [112] 路径总和
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

function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  if (!root) return false;
  let ret = false;

  const dfs = (node: TreeNode, target: number) => {
    if (ret) return;
    if (!node.left && !node.right) {
      if (node.val === target) {
        ret = true;
      }
    } else {
      if (node.left) dfs(node.left, target - node.val);
      if (node.right) dfs(node.right, target - node.val);
    }
  };

  dfs(root, targetSum);

  return ret;
}
// @lc code=end
