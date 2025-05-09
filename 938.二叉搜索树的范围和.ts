/*
 * @lc app=leetcode.cn id=938 lang=typescript
 *
 * [938] 二叉搜索树的范围和
 *
 * 题目描述：
 * 给定二叉搜索树的根结点 root，返回值位于范围 [low, high] 之间的所有结点的值的和。
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
 * 方法一：递归实现 - 利用二叉搜索树的性质优化
 * 时间复杂度：O(n)，其中n是树中节点的数量
 * 空间复杂度：O(h)，其中h是树的高度，最坏情况下为O(n)
 *
 * @param root 二叉搜索树的根节点
 * @param low 范围的下界
 * @param high 范围的上界
 * @returns 范围内所有节点值的和
 */
function rangeSumBST(root: TreeNode | null, low: number, high: number): number {
  // 基础情况：如果节点为空，返回0
  if (!root) return 0;

  // 利用二叉搜索树的性质进行优化：
  // 如果当前节点值小于下界，那么它的左子树中所有节点值都小于下界，无需遍历
  if (root.val < low) {
    // 只需要遍历右子树
    return rangeSumBST(root.right, low, high);
  }

  // 如果当前节点值大于上界，那么它的右子树中所有节点值都大于上界，无需遍历
  if (root.val > high) {
    // 只需要遍历左子树
    return rangeSumBST(root.left, low, high);
  }

  // 当前节点值在范围内，将其加入总和
  // 同时递归计算左右子树中在范围内的节点值之和
  return (
    root.val + // 当前节点值
    rangeSumBST(root.left, low, high) + // 左子树中在范围内的节点值之和
    rangeSumBST(root.right, low, high) // 右子树中在范围内的节点值之和
  );
}

/**
 * 方法二：迭代实现 - 使用队列进行广度优先搜索(BFS)
 * 时间复杂度：O(n)，其中n是树中节点的数量
 * 空间复杂度：O(n)，队列中最多存储n个节点
 *
 * @param root 二叉搜索树的根节点
 * @param low 范围的下界
 * @param high 范围的上界
 * @returns 范围内所有节点值的和
 */
function rangeSumBST1(
  root: TreeNode | null,
  low: number,
  high: number
): number {
  // 如果树为空，直接返回0
  if (!root) return 0;

  // 初始化总和
  let sum = 0;

  // 使用数组作为队列，初始包含根节点
  const queue: (TreeNode | null)[] = [root];

  // 当队列不为空时继续遍历
  while (queue.length) {
    // 取出队列头部的节点（使用shift从数组头部移除元素）
    const node = queue.shift()!;

    // 跳过空节点
    if (!node) continue;

    // 利用二叉搜索树性质进行优化：
    // 如果当前节点值小于下界，只需要检查右子树
    if (node.val < low) {
      queue.unshift(node.right); // 将右子节点加入队列头部
    }
    // 如果当前节点值大于上界，只需要检查左子树
    else if (node.val > high) {
      queue.unshift(node.left); // 将左子节点加入队列头部
    }
    // 如果当前节点值在范围内
    else {
      // 将节点值加入总和
      sum += node.val;
      // 将左右子节点都加入队列头部
      queue.unshift(node.left);
      queue.unshift(node.right);
    }
  }

  return sum;
}
// @lc code=end

/**
 * 解题思路：
 *
 * 本题利用了二叉搜索树(BST)的特性来优化搜索过程。二叉搜索树具有以下性质：
 * 1. 左子树中所有节点的值都小于根节点的值
 * 2. 右子树中所有节点的值都大于根节点的值
 * 3. 左右子树也分别是二叉搜索树
 *
 * 基于这个性质，我们可以进行以下优化：
 * - 如果当前节点值小于范围下界(low)，那么其左子树中所有节点的值也都小于下界，无需遍历
 * - 如果当前节点值大于范围上界(high)，那么其右子树中所有节点的值也都大于上界，无需遍历
 *
 * 方法一（递归）：
 * - 利用递归深度优先搜索(DFS)遍历树
 * - 根据节点值与范围的关系，选择性地只遍历必要的子树
 * - 对于在范围内的节点，将其值加入总和
 *
 * 方法二（迭代）：
 * - 使用队列进行广度优先搜索(BFS)
 * - 同样利用BST性质优化搜索路径
 * - 注意：虽然使用了queue变量名，但实际使用的是数组的shift/unshift操作，
 *   在真实场景中，应考虑使用专门的队列数据结构以获得更好的性能
 *
 * 两种方法的时间复杂度都是O(n)，但在实际应用中，由于优化可能不会访问所有节点，
 * 实际时间可能会小于O(n)。
 */
