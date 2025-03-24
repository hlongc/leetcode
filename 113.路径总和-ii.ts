/*
 * @lc app=leetcode.cn id=113 lang=typescript
 *
 * [113] 路径总和 II
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

function pathSum(root: TreeNode | null, targetSum: number): number[][] {
  const ret: number[][] = [];
  if (!root) return ret;

  const dfs = (node: TreeNode, target: number, path: number[]) => {
    path = [...path, node.val];
    if (!node.left && !node.right) {
      if (node.val === target) {
        ret.push(path);
      }
    } else {
      if (node.left) dfs(node.left, target - node.val, path);
      if (node.right) dfs(node.right, target - node.val, path);
    }
  };

  dfs(root, targetSum, []);

  return ret;
}
// @lc code=end
