/*
 * @lc app=leetcode.cn id=337 lang=typescript
 *
 * [337] 打家劫舍 III
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

function rob(root: TreeNode | null): number {
  // 返回值第一位表示偷当前节点的最大值，第二位表示不偷当前节点的最大值
  const dfs = (node: TreeNode | null): [number, number] => {
    if (node === null) {
      return [0, 0];
    }
    const l = dfs(node.left);
    const r = dfs(node.right);
    // 当前节点偷，那就不偷子节点
    const val1 = node.val + l[1] + r[1];
    // 当前节点不偷，那就取子节点偷与不偷的最大值
    const val2 = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);
    return [val1, val2];
  };

  return Math.max(...dfs(root));
}
// @lc code=end
