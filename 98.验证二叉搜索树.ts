/*
 * @lc app=leetcode.cn id=98 lang=typescript
 *
 * [98] 验证二叉搜索树
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

/**
 * 验证二叉搜索树
 *
 * 题目要求：验证一棵树是否为二叉搜索树(BST)
 * BST定义：
 * 1. 节点的左子树只包含小于当前节点的值
 * 2. 节点的右子树只包含大于当前节点的值
 * 3. 所有左右子树自身必须也是BST
 *
 * 问题：原代码只检查了直接子节点，没有考虑整个子树的约束
 * 修复方法：使用上下界递归验证
 *
 * 时间复杂度：O(n)，其中n是树的节点数
 * 空间复杂度：O(h)，其中h是树的高度，最坏情况为O(n)
 *
 * @param root 二叉树的根节点
 * @return 是否为有效的二叉搜索树
 */
function isValidBST(root: TreeNode | null): boolean {
  // 辅助函数：验证以node为根的子树是否为BST
  // min和max参数用于限定子树中所有节点的值范围
  const validate = (
    node: TreeNode | null,
    min = -Infinity,
    max = Infinity
  ): boolean => {
    // 空节点视为有效BST
    if (!node) return true;

    // 递归验证左右子树
    // 左子树中所有节点值必须小于当前节点值，所以设置上界为当前节点值
    // 右子树中所有节点值必须大于当前节点值，所以设置下界为当前节点值
    return (
      min < node.val &&
      node.val < max &&
      validate(node.left, min, node.val) &&
      validate(node.right, node.val, max)
    );
  };

  // 从根节点开始验证，初始无上下界限制
  return validate(root);
}
// @lc code=end
