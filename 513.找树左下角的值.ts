/*
 * @lc app=leetcode.cn id=513 lang=typescript
 *
 * [513] 找树左下角的值
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

function findBottomLeftValue(root: TreeNode | null): number {
  if (!root) return 0;

  let ret = root.val;
  let maxLevel = Number.MIN_SAFE_INTEGER;

  const dfs = (node: TreeNode, level: number) => {
    if (!node.left && !node.right) {
      if (level > maxLevel) {
        ret = node.val;
        maxLevel = level;
      }
    } else {
      if (node.left) dfs(node.left, level + 1);
      if (node.right) dfs(node.right, level + 1);
    }
  };

  dfs(root, 1);

  return ret;
}
// @lc code=end
