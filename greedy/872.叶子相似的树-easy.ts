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
 * 获取二叉树中所有叶子节点的值，按从左到右的顺序排列
 * 使用广度优先搜索（BFS）遍历二叉树
 *
 * @param node 二叉树的根节点
 * @returns 叶子节点值的数组，按从左到右的顺序
 */
function getValues(node: TreeNode | null): number[] {
  const result: number[] = []; // 存储叶子节点值的数组

  // 如果节点为空，直接返回空数组
  if (!node) return result;

  // 使用队列进行广度优先搜索
  const queue: TreeNode[] = [node];

  // 当队列不为空时，继续处理
  while (queue.length) {
    // 从队列头部取出一个节点进行处理
    const node = queue.shift()!;

    // 检查当前节点是否为叶子节点（没有左右子节点）
    if (!node.left && !node.right) {
      result.push(node.val); // 如果是叶子节点，将其值加入结果数组
    }

    // 如果左子节点存在，将其加入队列头部（保证从左到右的顺序）
    if (node.left) {
      queue.unshift(node.left);
    }

    // 如果右子节点存在，将其加入队列头部
    if (node.right) {
      queue.unshift(node.right);
    }
  }

  return result; // 返回所有叶子节点的值
}

/**
 * 判断两棵二叉树的叶子节点序列是否相同
 * 如果两棵树的叶子节点值按从左到右的顺序完全相同，则返回true
 *
 * @param root1 第一棵二叉树的根节点
 * @param root2 第二棵二叉树的根节点
 * @returns 如果两棵树的叶子节点序列相同返回true，否则返回false
 */
function leafSimilar(root1: TreeNode | null, root2: TreeNode | null): boolean {
  // 分别获取两棵树的叶子节点值序列
  const val1 = getValues(root1);
  const val2 = getValues(root2);

  // 如果两棵树的叶子节点数量不同，直接返回false
  if (val1.length !== val2.length) return false;

  // 逐个比较两棵树的叶子节点值
  for (let i = 0; i < val1.length; i++) {
    if (val1[i] !== val2[i]) {
      return false; // 发现不同的值，返回false
    }
  }

  // 所有叶子节点值都相同，返回true
  return true;
}
// @lc code=end
