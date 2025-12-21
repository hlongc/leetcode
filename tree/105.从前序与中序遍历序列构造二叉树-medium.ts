/*
 * @lc app=leetcode.cn id=105 lang=typescript
 *
 * [105] 从前序与中序遍历序列构造二叉树
 *
 * https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/description/
 *
 * algorithms
 * Medium (73.22%)
 * Likes:    2632
 * Dislikes: 0
 * Total Accepted:    960K
 * Total Submissions: 1.3M
 * Testcase Example:  '[3,9,20,15,7]\n[9,3,15,20,7]'
 *
 * 给定两个整数数组 preorder 和 inorder ，其中 preorder 是二叉树的先序遍历， inorder
 * 是同一棵树的中序遍历，请构造二叉树并返回其根节点。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
 * 输出: [3,9,20,null,null,15,7]
 *
 *
 * 示例 2:
 *
 *
 * 输入: preorder = [-1], inorder = [-1]
 * 输出: [-1]
 *
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= preorder.length <= 3000
 * inorder.length == preorder.length
 * -3000 <= preorder[i], inorder[i] <= 3000
 * preorder 和 inorder 均 无重复 元素
 * inorder 均出现在 preorder
 * preorder 保证 为二叉树的前序遍历序列
 * inorder 保证 为二叉树的中序遍历序列
 *
 *
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
 * 核心思路：
 * 1. 前序遍历：根 -> 左 -> 右  （第一个元素是根节点）
 * 2. 中序遍历：左 -> 根 -> 右  （根节点左边是左子树，右边是右子树）
 *
 * 算法步骤：
 * 1. 从前序遍历中取出第一个元素作为根节点
 * 2. 在中序遍历中找到这个根节点的位置
 * 3. 根据根节点位置，将中序遍历分为左右两部分
 * 4. 根据左子树的长度，将前序遍历也分为左右两部分
 * 5. 递归构造左子树和右子树
 *
 * 图解示例：
 * preorder = [3, 9, 20, 15, 7]
 * inorder  = [9, 3, 15, 20, 7]
 *
 * 第1步：根节点是 3 (preorder第一个)
 *       在inorder中找到3的位置是索引1
 *
 *       inorder: [9] | 3 | [15, 20, 7]
 *                左子树    右子树
 *
 *       左子树长度 = 1
 *
 *       preorder: 3 | [9] | [20, 15, 7]
 *                 根  左子树  右子树
 *
 * 第2步：递归构造左子树 (preorder=[9], inorder=[9])
 *       根节点是9，无左右子树
 *
 * 第3步：递归构造右子树 (preorder=[20,15,7], inorder=[15,20,7])
 *       根节点是20
 *       在inorder中找到20的位置
 *       继续递归...
 *
 * 最终构造的树：
 *       3
 *      / \
 *     9   20
 *        / \
 *       15  7
 *
 * 时间复杂度：O(n)，每个节点访问一次，使用哈希表优化查找
 * 空间复杂度：O(n)，哈希表存储索引 + 递归栈深度O(h)
 */
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  // 边界情况：空数组
  if (preorder.length === 0) return null;

  // 优化：使用哈希表存储中序遍历中每个值的索引
  // 这样可以在O(1)时间内找到根节点在中序遍历中的位置
  // 而不需要每次都遍历数组查找，时间复杂度从O(n²)优化到O(n)
  const inorderMap = new Map<number, number>();
  for (let i = 0; i < inorder.length; i++) {
    inorderMap.set(inorder[i], i);
  }

  /**
   * 递归构造二叉树
   * @param preStart 前序遍历的起始索引
   * @param preEnd 前序遍历的结束索引
   * @param inStart 中序遍历的起始索引
   * @param inEnd 中序遍历的结束索引
   * @returns 构造的子树根节点
   */
  function build(
    preStart: number,
    preEnd: number,
    inStart: number,
    inEnd: number
  ): TreeNode | null {
    // 递归终止条件：区间无效
    if (preStart > preEnd || inStart > inEnd) {
      return null;
    }

    // 步骤1：前序遍历的第一个元素就是当前子树的根节点
    const rootVal = preorder[preStart];
    const root = new TreeNode(rootVal);

    // 步骤2：在中序遍历中找到根节点的位置（使用哈希表O(1)查找）
    const rootIndexInInorder = inorderMap.get(rootVal)!;

    // 步骤3：计算左子树的节点数量
    // 左子树 = 中序遍历中根节点左边的所有元素
    const leftSubtreeSize = rootIndexInInorder - inStart;

    // 步骤4：递归构造左子树
    // 前序遍历：从 preStart+1 开始，长度为 leftSubtreeSize
    // 中序遍历：从 inStart 到 rootIndexInInorder-1
    root.left = build(
      preStart + 1, // 左子树在前序遍历中的起始位置
      preStart + leftSubtreeSize, // 左子树在前序遍历中的结束位置
      inStart, // 左子树在中序遍历中的起始位置
      rootIndexInInorder - 1 // 左子树在中序遍历中的结束位置
    );

    // 步骤5：递归构造右子树
    // 前序遍历：从 preStart+leftSubtreeSize+1 到 preEnd
    // 中序遍历：从 rootIndexInInorder+1 到 inEnd
    root.right = build(
      preStart + leftSubtreeSize + 1, // 右子树在前序遍历中的起始位置
      preEnd, // 右子树在前序遍历中的结束位置
      rootIndexInInorder + 1, // 右子树在中序遍历中的起始位置
      inEnd // 右子树在中序遍历中的结束位置
    );

    return root;
  }

  // 从整个数组开始构造
  return build(0, preorder.length - 1, 0, inorder.length - 1);
}

/**
 * 解法二：不使用哈希表的版本（更直观但效率较低）
 *
 * 时间复杂度：O(n²)，因为每次需要在中序数组中查找根节点位置
 * 空间复杂度：O(n)，递归栈深度
 */
function buildTreeNaive(
  preorder: number[],
  inorder: number[]
): TreeNode | null {
  // 边界情况
  if (preorder.length === 0) return null;

  // 根节点是前序遍历的第一个元素
  const rootVal = preorder[0];
  const root = new TreeNode(rootVal);

  // 在中序遍历中找到根节点的位置（O(n)查找）
  const rootIndexInInorder = inorder.indexOf(rootVal);

  // 分割数组并递归构造左右子树
  root.left = buildTreeNaive(
    preorder.slice(1, rootIndexInInorder + 1), // 左子树的前序遍历
    inorder.slice(0, rootIndexInInorder) // 左子树的中序遍历
  );

  root.right = buildTreeNaive(
    preorder.slice(rootIndexInInorder + 1), // 右子树的前序遍历
    inorder.slice(rootIndexInInorder + 1) // 右子树的中序遍历
  );

  return root;
}

/**
 * 知识点总结：
 *
 * 1. 遍历方式的特点：
 *    - 前序遍历(Pre-order)：根 -> 左 -> 右  【根在最前面】
 *    - 中序遍历(In-order)： 左 -> 根 -> 右  【根在中间】
 *    - 后序遍历(Post-order)：左 -> 右 -> 根 【根在最后面】
 *
 * 2. 为什么需要两个遍历序列？
 *    - 单独的前序遍历无法确定左右子树的边界
 *    - 单独的中序遍历无法确定根节点
 *    - 两者结合可以唯一确定一棵二叉树
 *
 * 3. 类似题目：
 *    - LeetCode 106: 从中序和后序遍历序列构造二叉树
 *      （后序遍历的最后一个元素是根节点）
 *    - LeetCode 889: 根据前序和后序遍历构造二叉树
 *      （需要满足特定条件才能唯一确定）
 *
 * 4. 优化技巧：
 *    - 使用哈希表缓存索引，避免重复查找
 *    - 使用索引而不是切片数组，避免额外空间开销
 *    - 提前处理边界情况，减少递归调用
 */

/**
 * 测试用例：
 *
 * 输入: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
 * 输出: [3,9,20,null,null,15,7]
 *
 * 构造过程：
 * 1. 根节点 = 3
 * 2. 中序中3的左边[9]是左子树，右边[15,20,7]是右子树
 * 3. 递归构造左子树：根=9
 * 4. 递归构造右子树：根=20，左子树=15，右子树=7
 */
// @lc code=end
