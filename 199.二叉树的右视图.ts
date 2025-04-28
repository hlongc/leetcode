/*
 * @lc app=leetcode.cn id=199 lang=typescript
 *
 * [199] 二叉树的右视图
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
 * 二叉树的右视图
 * 题目要求：返回从右侧能看到的节点值（即每一层最右边的节点）
 *
 * 解题思路：
 * 1. 使用DFS深度优先遍历整棵树
 * 2. 通过覆盖操作，确保每层最后访问的节点（也就是最右侧节点）的值被保留
 *
 * 时间复杂度：O(n)，其中n是二叉树的节点数，每个节点被访问一次
 * 空间复杂度：O(h)，其中h是树的高度，最坏情况下为O(n)
 *
 * @param root 二叉树的根节点
 * @return 从右侧能看到的节点值数组
 */
function rightSideView(root: TreeNode | null): number[] {
  // 结果数组，存储每一层最右侧节点的值
  const ret: number[] = [];
  // 边界情况处理：如果树为空，返回空数组
  if (!root) return ret;

  /**
   * 深度优先搜索函数
   * 采用前序遍历的变形（根-左-右）
   *
   * @param node 当前访问的节点
   * @param level 当前节点所在层级（从0开始）
   */
  const dfs = (node: TreeNode, level: number) => {
    // 将当前节点的值放入对应层级的位置
    // 由于是按照深度优先遍历，同一层的节点会相互覆盖
    // 最终每一层保留的是最后被访问到的节点值，也就是最右侧的节点
    ret[level] = node.val;

    // 先访问左子树
    if (node.left) dfs(node.left, level + 1);
    // 后访问右子树，右子树的值会覆盖同层左子树的值
    if (node.right) dfs(node.right, level + 1);
  };

  // 从根节点开始DFS遍历
  dfs(root, 0);

  // 返回结果数组，包含每一层最右侧的节点值
  return ret;
}
// @lc code=end
