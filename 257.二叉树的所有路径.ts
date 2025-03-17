/*
 * @lc app=leetcode.cn id=257 lang=typescript
 *
 * [257] 二叉树的所有路径
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

function binaryTreePaths(root: TreeNode | null): string[] {
  const ret: string[] = [];
  if (!root) return ret;

  const dfs = (node: TreeNode, list: number[]) => {
    list = [...list, node.val];
    if (!node.left && !node.right) {
      ret.push(list.join("->"));
      return;
    }
    if (node.left) dfs(node.left, list);
    if (node.right) dfs(node.right, list);
  };

  dfs(root, []);
  return ret;
}
// @lc code=end
