/*
 * @lc app=leetcode.cn id=872 lang=typescript
 *
 * [872] 叶子相似的树
 *
 * https://leetcode.cn/problems/leaf-similar-trees/description/
 *
 * algorithms
 * Easy (65.45%)
 * Likes:    251
 * Dislikes: 0
 * Total Accepted:    101.3K
 * Total Submissions: 154.7K
 * Testcase Example:  '[3,5,1,6,2,9,8,null,null,7,4]\n' +
  '[3,5,1,6,7,4,2,null,null,null,null,null,null,9,8]'
 *
 * 请考虑一棵二叉树上所有的叶子，这些叶子的值按从左到右的顺序排列形成一个 叶值序列 。
 * 
 * 
 * 
 * 举个例子，如上图所示，给定一棵叶值序列为 (6, 7, 4, 9, 8) 的树。
 * 
 * 如果有两棵二叉树的叶值序列是相同，那么我们就认为它们是 叶相似 的。
 * 
 * 如果给定的两个根结点分别为 root1 和 root2 的树是叶相似的，则返回 true；否则返回 false 。
 * 
 * 
 * 
 * 示例 1：
 * 
 * 
 * 
 * 
 * 输入：root1 = [3,5,1,6,2,9,8,null,null,7,4], root2 =
 * [3,5,1,6,7,4,2,null,null,null,null,null,null,9,8]
 * 输出：true
 * 
 * 
 * 示例 2：
 * 
 * 
 * 
 * 
 * 输入：root1 = [1,2,3], root2 = [1,3,2]
 * 输出：false
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 给定的两棵树结点数在 [1, 200] 范围内
 * 给定的两棵树上的值在 [0, 200] 范围内
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
 * 判断两棵二叉树是否叶相似（叶子节点值序列相同）
 *
 * 思路：
 * 1. 分别获取两棵树的叶子节点值序列
 * 2. 比较两个序列是否相同
 *
 * @param root1 第一棵二叉树的根节点
 * @param root2 第二棵二叉树的根节点
 * @returns 两棵树是否叶相似
 */
function leafSimilar(root1: TreeNode | null, root2: TreeNode | null): boolean {
  // 获取第一棵树的叶子节点值序列
  const leaves1: number[] = [];
  getLeafValues(root1, leaves1);

  // 获取第二棵树的叶子节点值序列
  const leaves2: number[] = [];
  getLeafValues(root2, leaves2);

  // 比较两个叶子节点值序列是否相同
  // 首先检查长度是否相等
  if (leaves1.length !== leaves2.length) {
    return false;
  }

  // 逐一比较每个叶子节点的值
  for (let i = 0; i < leaves1.length; i++) {
    if (leaves1[i] !== leaves2[i]) {
      return false;
    }
  }

  return true;
}

/**
 * 递归获取二叉树的叶子节点值序列
 *
 * 使用深度优先搜索（DFS）遍历二叉树，按照从左到右的顺序
 * 收集所有叶子节点的值（叶子节点是指没有子节点的节点）
 *
 * @param node 当前节点
 * @param leaves 存储叶子节点值的数组（结果会被添加到这个数组中）
 */
function getLeafValues(node: TreeNode | null, leaves: number[]): void {
  // 如果节点为空，直接返回
  if (node === null) {
    return;
  }

  // 判断是否为叶子节点（没有左右子节点）
  if (node.left === null && node.right === null) {
    // 是叶子节点，将其值添加到结果数组
    leaves.push(node.val);
    return;
  }

  // 继续递归遍历左子树
  getLeafValues(node.left, leaves);

  // 继续递归遍历右子树
  getLeafValues(node.right, leaves);
}
// @lc code=end
