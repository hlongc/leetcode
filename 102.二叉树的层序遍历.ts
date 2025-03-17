/*
 * @lc app=leetcode.cn id=102 lang=typescript
 *
 * [102] 二叉树的层序遍历
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

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];

  let level = 0;
  const stack = [[root]];

  while (stack[level].length) {
    const parent = stack[level];
    stack[++level] = [];

    parent.forEach((node, index) => {
      parent[index] = node.val as any;
      if (node.left) stack[level].push(node.left);
      if (node.right) stack[level].push(node.right);
    });
  }

  stack.pop();

  return stack as any as number[][];
}
// @lc code=end
