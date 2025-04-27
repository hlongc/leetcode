/*
 * @lc app=leetcode.cn id=101 lang=typescript
 *
 * [101] 对称二叉树
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

function isSymmetric1(root: TreeNode | null): boolean {
  if (!root) return true;

  const check = (left: TreeNode | null, right: TreeNode | null): boolean => {
    if (!left && !right) return true;
    if (left && right) {
      return (
        left.val === right.val &&
        check(left.left, right.right) &&
        check(left.right, right.left)
      );
    }

    return false;
  };

  return check(root.left, root.right);
}

function isSymmetric(root: TreeNode | null): boolean {
  if (!root) return true;

  const stack = [root.left, root.right];
  while (stack.length) {
    const right = stack.pop();
    const left = stack.pop();

    if (left === null && right === null) {
    } else if (left && right && left.val === right.val) {
      stack.push(left.left);
      stack.push(right.right);

      stack.push(left.right);
      stack.push(right.left);
    } else {
      return false;
    }
  }

  return true;
}
// @lc code=end
