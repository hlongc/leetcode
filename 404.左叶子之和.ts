/*
 * @lc app=leetcode.cn id=404 lang=typescript
 *
 * [404] 左叶子之和
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

function sumOfLeftLeaves(root: TreeNode | null): number {
  let sum = 0;
  if (!root) return sum;

  const dfs = (node: TreeNode, isLeft = false) => {
    if (!node.left && !node.right) {
      if (isLeft) sum += node.val;
    } else {
      if (node.left) dfs(node.left, true);
      if (node.right) dfs(node.right, false);
    }
  };

  dfs(root);

  return sum;
}

// @lc code=end
