/*
 * @lc app=leetcode.cn id=144 lang=typescript
 *
 * [144] 二叉树的前序遍历
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

// class TreeNode {
//   val: number;
//   left: TreeNode | null;
//   right: TreeNode | null;
//   constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
//     this.val = val === undefined ? 0 : val;
//     this.left = left === undefined ? null : left;
//     this.right = right === undefined ? null : right;
//   }
// }

function preorderTraversal1(root: TreeNode | null): number[] {
  const ret: number[] = [];

  const dfs = (node: TreeNode | null) => {
    if (!node) return;
    ret.push(node.val);
    dfs(node.left);
    dfs(node.right);
  };

  dfs(root);

  return ret;
}

function preorderTraversal(root: TreeNode | null): number[] {
  if (!root) return [];
  const ret: number[] = [];
  const stack: TreeNode[] = [root];

  while (stack.length) {
    const node = stack.shift()!;
    ret.push(node.val);
    if (node.right) stack.unshift(node.right);
    if (node.left) stack.unshift(node.left);
  }

  return ret;
}
// @lc code=end
