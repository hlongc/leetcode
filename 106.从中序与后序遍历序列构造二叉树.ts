/*
 * @lc app=leetcode.cn id=106 lang=typescript
 *
 * [106] 从中序与后序遍历序列构造二叉树
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
 * 从中序与后序遍历序列构造二叉树
 *
 * 解题思路：递归分治
 * 1. 后序遍历的最后一个元素是当前子树的根节点
 * 2. 在中序遍历中找到根节点的位置，将数组分为左右子树
 * 3. 递归构建左子树和右子树
 *
 * 中序遍历形式：[左子树, 根节点, 右子树]
 * 后序遍历形式：[左子树, 右子树, 根节点]
 *
 * @param inorder 中序遍历序列
 * @param postorder 后序遍历序列
 * @return 构造的二叉树根节点
 */
function buildTree(inorder: number[], postorder: number[]): TreeNode | null {
  // 创建哈希表来快速查找中序遍历中节点的位置
  const map = new Map<number, number>();

  // 将中序遍历的值和索引存入哈希表
  for (let i = 0; i < inorder.length; i++) {
    map.set(inorder[i], i);
  }

  /**
   * 递归构建二叉树
   * @param iStart 中序遍历的起始索引
   * @param iEnd 中序遍历的结束索引
   * @param pStart 后序遍历的起始索引
   * @param pEnd 后序遍历的结束索引
   * @returns 构建的树节点
   */
  const build = (
    iStart: number, // 中序遍历的起始索引
    iEnd: number, // 中序遍历的结束索引
    pStart: number, // 后序遍历的起始索引
    pEnd: number // 后序遍历的结束索引
  ): TreeNode | null => {
    // 如果索引无效，返回null（空子树）
    if (iStart > iEnd || pStart > pEnd) return null;

    // 1. 从后序遍历的末尾找到根节点
    const rootValue = postorder[pEnd];

    // 2. 创建根节点
    const root = new TreeNode(rootValue);

    // 3. 在中序遍历中找到根节点的位置，用于分割左右子树
    const rootIndex = map.get(rootValue)!;

    // 4. 计算左子树的节点数量
    const leftTreeNum = rootIndex - iStart;

    // 5. 构建左子树
    // 左子树在中序遍历中的范围：[iStart, rootIndex-1]
    // 左子树在后序遍历中的范围：[pStart, pStart+leftTreeNum-1]
    root.left = build(
      iStart, // 左子树在中序中的起始位置
      rootIndex - 1, // 左子树在中序中的结束位置
      pStart, // 左子树在后序中的起始位置
      pStart + leftTreeNum - 1 // 左子树在后序中的结束位置
    );

    // 6. 构建右子树
    // 右子树在中序遍历中的范围：[rootIndex+1, iEnd]
    // 右子树在后序遍历中的范围：[pStart+leftTreeNum, pEnd-1]
    // 注意：pEnd-1是因为pEnd位置是根节点
    root.right = build(
      rootIndex + 1, // 右子树在中序中的起始位置
      iEnd, // 右子树在中序中的结束位置
      pStart + leftTreeNum, // 右子树在后序中的起始位置
      pEnd - 1 // 右子树在后序中的结束位置，排除根节点
    );

    return root;
  };

  // 从完整的序列范围开始构建
  return build(0, inorder.length - 1, 0, postorder.length - 1);
}
// @lc code=end
