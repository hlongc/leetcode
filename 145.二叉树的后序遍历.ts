/*
 * @lc app=leetcode.cn id=145 lang=typescript
 *
 * [145] 二叉树的后序遍历
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

function postorderTraversal(root: TreeNode | null): number[] {
  const ret: number[] = [];
  if (!root) return ret;

  let cur: TreeNode | null = root;
  // 记录上一次访问并处理过的节点
  let lastVisited: TreeNode | null = null;

  const stack: TreeNode[] = [];
  while (stack.length || cur) {
    while (cur) {
      stack.push(cur);
      cur = cur.left;
    }
    // 查看栈顶元素
    cur = stack[stack.length - 1]!;
    // 如果当前元素不存在右节点或者右节点已经访问过了，那就直接处理当前节点
    if (!cur.right || cur.right === lastVisited) {
      ret.push(cur.val);
      stack.pop();
      lastVisited = cur;
      // 重置当前节点，好让后续继续操作栈顶元素
      cur = null;
    } else {
      // 存在右节点那就遍历右节点
      cur = cur.right;
    }
  }

  return ret;
}
// @lc code=end
