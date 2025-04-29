/*
 * @lc app=leetcode.cn id=105 lang=typescript
 *
 * [105] 从前序与中序遍历序列构造二叉树
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
 * 从前序与中序遍历序列构造二叉树
 *
 * 解题思路：递归分治
 * 1. 前序遍历的第一个元素是当前子树的根节点
 * 2. 在中序遍历中找到根节点的位置，将数组分为左右子树
 * 3. 递归构建左子树和右子树
 *
 * 前序遍历：[根节点, [左子树的前序遍历], [右子树的前序遍历]]
 * 中序遍历：[[左子树的中序遍历], 根节点, [右子树的中序遍历]]
 *
 * 时间复杂度：O(n)，其中n是树的节点数
 * 空间复杂度：O(n)，用于存储哈希映射和递归栈
 *
 * @param preorder 前序遍历序列
 * @param inorder 中序遍历序列
 * @return 构造的二叉树根节点
 */
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  // 创建哈希表，用于快速查找元素在中序遍历中的位置
  // 这样可以将查找时间从O(n)降低到O(1)
  const map = new Map<number, number>();

  // 遍历中序序列，将每个元素的值及其索引存入哈希表
  for (let i = 0; i < inorder.length; i++) {
    map.set(inorder[i], i);
  }

  /**
   * 递归构建二叉树的辅助函数
   * @param pStart 当前子树在前序遍历中的起始索引
   * @param pEnd 当前子树在前序遍历中的结束索引
   * @param iStart 当前子树在中序遍历中的起始索引
   * @param iEnd 当前子树在中序遍历中的结束索引
   * @returns 当前子树的根节点
   */
  const build = (
    pStart: number, // 前序遍历的起始位置
    pEnd: number, // 前序遍历的结束位置
    iStart: number, // 中序遍历的起始位置
    iEnd: number // 中序遍历的结束位置
  ): TreeNode | null => {
    // 基本情况：如果前序遍历的起始位置大于结束位置，表示当前子树为空
    if (pStart > pEnd) return null;

    // 前序遍历的第一个元素就是当前子树的根节点
    const rootValue = preorder[pStart];
    // 创建根节点
    const rootNode = new TreeNode(rootValue);

    // 在中序遍历中找到根节点的位置
    const rootIndex = map.get(rootValue)!;

    // 计算左子树的节点数量，用于在前序遍历中确定左子树的范围
    const leftTreeNum = rootIndex - iStart;

    // 递归构建左子树
    // 左子树在前序遍历中：从根节点后一个位置(pStart+1)开始，长度为leftTreeNum
    // 左子树在中序遍历中：从iStart开始，到根节点前一个位置(rootIndex-1)结束
    rootNode.left = build(
      pStart + 1, // 左子树在前序中的起始位置
      pStart + leftTreeNum, // 左子树在前序中的结束位置
      iStart, // 左子树在中序中的起始位置
      rootIndex - 1 // 左子树在中序中的结束位置
    );

    // 递归构建右子树
    // 右子树在前序遍历中：从左子树结束后的下一个位置开始，到pEnd结束
    // 右子树在中序遍历中：从根节点后一个位置开始，到iEnd结束
    rootNode.right = build(
      pStart + leftTreeNum + 1, // 右子树在前序中的起始位置
      pEnd, // 右子树在前序中的结束位置
      rootIndex + 1, // 右子树在中序中的起始位置
      iEnd // 右子树在中序中的结束位置
    );

    // 返回构建好的当前子树的根节点
    return rootNode;
  };

  // 开始递归构建，传入整个序列的索引范围
  return build(0, preorder.length - 1, 0, inorder.length - 1);
}
// @lc code=end
