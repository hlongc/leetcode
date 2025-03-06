/*
 * @lc app=leetcode.cn id=94 lang=typescript
 *
 * [94] 二叉树的中序遍历
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

function inorderTraversal1(root: TreeNode | null): number[] {
  const ret: number[] = [];

  const dfs = (node: TreeNode | null) => {
    if (!node) return;
    dfs(node.left);
    ret.push(node.val);
    dfs(node.right);
  };

  dfs(root);

  return ret;
}

function inorderTraversal(root: TreeNode | null): number[] {
  if (!root) return [];

  const ret: number[] = [];
  const stack: TreeNode[] = [];

  while (stack.length || root) {
    // 把全部左节点进栈
    while (root) {
      stack.push(root);
      root = root.left;
    }
    // 出栈中间节点
    root = stack.pop()!;
    ret.push(root.val);
    // 进栈右节点
    root = root.right;
  }

  return ret;
}
// @lc code=end
