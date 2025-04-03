/*
 * @lc app=leetcode.cn id=230 lang=typescript
 *
 * [230] 二叉搜索树中第 K 小的元素
 *
 * 给定一个二叉搜索树的根节点 root，和一个整数 k，请你设计一个算法查找其中第 k 个最小元素（从 1 开始计数）。
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

function kthSmallest1(root: TreeNode | null, k: number): number {
  // 用于存储第k小的元素值
  let ret = -1;

  // 中序遍历函数
  // 二叉搜索树的中序遍历会按升序访问所有节点
  const dfs = (node: TreeNode | null) => {
    // 如果节点存在且还没找到第k小的元素
    if (node && k > 0) {
      // 先遍历左子树（BST中左子树的所有值都小于根节点）
      dfs(node.left);

      // 访问当前节点，将k减1
      // 此时已经访问了k个最小的元素
      if (--k === 0) {
        // 如果k减为0，说明当前节点就是第k小的元素
        ret = node.val;
      }

      // 如果还没找到第k小的元素，继续遍历右子树
      // （只有当k>0时才需要继续遍历）
      dfs(node.right);
    }
  };

  // 开始中序遍历
  dfs(root);

  // 返回第k小的元素
  return ret;
}

function kthSmallest(root: TreeNode | null, k: number): number {
  // 如果根节点为空，直接返回默认值
  if (!root) return -1;

  // 创建一个栈，用于迭代实现中序遍历
  const stack: TreeNode[] = [];
  // 当前遍历的节点
  let current: TreeNode | null = root;

  // 计数器，记录当前是第几小的元素
  let count = 0;

  // 当当前节点不为空或栈不为空时继续遍历
  while (current || stack.length > 0) {
    // 将所有左子节点压入栈中（找到最小元素的路径）
    while (current) {
      stack.push(current);
      current = current.left;
    }

    // 弹出栈顶元素（当前子树中最小的节点）
    current = stack.pop()!;

    // 计数加1
    count++;

    // 如果已经找到第k小的元素，直接返回
    if (count === k) {
      return current.val;
    }

    // 考虑该节点的右子树
    current = current.right;
  }

  // 如果没有找到第k小的元素（k大于树中节点总数）
  return -1;
}
// @lc code=end
