/*
 * @lc app=leetcode.cn id=222 lang=typescript
 *
 * [222] 完全二叉树的节点个数
 *
 * 给你一棵 完全二叉树 的根节点 root ，求出该树的节点个数。
 * 完全二叉树的定义：在完全二叉树中，除了最底层节点可能没填满外，其余每层节点数都达到最大值，
 * 并且最下面一层的节点都集中在该层最左边的若干位置。
 *
 * 要求：时间复杂度小于 O(n)
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

function countNodes(root: TreeNode | null): number {
  // 空树的节点数为0
  if (!root) return 0;

  // 计算左子树和右子树的高度
  let lh = 0,
    rh = 0;
  let lNode: TreeNode | null = root;
  let rNode: TreeNode | null = root;

  // 计算左子树的高度（一直向左遍历）
  while (lNode) {
    lh++;
    lNode = lNode.left;
  }

  // 计算右子树的高度（一直向右遍历）
  while (rNode) {
    rh++;
    rNode = rNode.right;
  }

  // 如果左右的深度一样，说明是个完美二叉树
  // 完美二叉树的节点个数公式：2^h - 1，其中h是树的高度
  if (lh === rh) {
    return 2 ** lh - 1; // 2^h - 1，可以写成 Math.pow(2, lh) - 1
  }

  // 如果不是完美二叉树，那就递归计算左右子树的节点数，再加上根节点自身(1)
  // 这里利用了完全二叉树的性质进行优化
  // 时间复杂度：O(log^2 n)，因为最多递归log n次，每次递归需要O(log n)计算高度
  return 1 + countNodes(root.left) + countNodes(root.right);
}
// @lc code=end
