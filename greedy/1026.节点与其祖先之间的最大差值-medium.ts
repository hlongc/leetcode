/*
 * @lc app=leetcode.cn id=1026 lang=typescript
 *
 * [1026] 节点与其祖先之间的最大差值
 *
 * https://leetcode.cn/problems/maximum-difference-between-node-and-ancestor/description/
 *
 * algorithms
 * Medium (78.23%)
 * Likes:    288
 * Dislikes: 0
 * Total Accepted:    60.5K
 * Total Submissions: 77.4K
 * Testcase Example:  '[8,3,10,1,6,null,14,null,null,4,7,13]'
 *
 * 给定二叉树的根节点 root，找出存在于 不同 节点 A 和 B 之间的最大值 V，其中 V = |A.val - B.val|，且 A 是 B
 * 的祖先。
 *
 * （如果 A 的任何子节点之一为 B，或者 A 的任何子节点是 B 的祖先，那么我们认为 A 是 B 的祖先）
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：root = [8,3,10,1,6,null,14,null,null,4,7,13]
 * 输出：7
 * 解释：
 * 我们有大量的节点与其祖先的差值，其中一些如下：
 * |8 - 3| = 5
 * |3 - 7| = 4
 * |8 - 1| = 7
 * |10 - 13| = 3
 * 在所有可能的差值中，最大值 7 由 |8 - 1| = 7 得出。
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [1,null,2,null,0,3]
 * 输出：3
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中的节点数在 2 到 5000 之间。
 * 0
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
 * 计算二叉树中节点与其祖先之间的最大差值
 *
 * 思路一：自顶向下的深度优先搜索(DFS)
 * 1. 从根节点开始，记录从根到当前节点路径上的最大值和最小值
 * 2. 对于每个节点，计算其与路径上最大值和最小值的差，更新全局最大差值
 * 3. 递归地处理左右子树，将当前节点值加入路径考虑
 *
 * 时间复杂度: O(n)，其中n是树中节点的数量
 * 空间复杂度: O(h)，其中h是树的高度，用于递归调用栈
 *
 * @param root 二叉树的根节点
 * @returns 节点与其祖先之间的最大差值
 */
function maxAncestorDiff(root: TreeNode | null): number {
  // 处理边界情况
  if (!root) return 0;

  // 全局变量记录最大差值
  let maxDiff = 0;

  /**
   * 递归辅助函数 - 自顶向下遍历树并跟踪路径上的最大和最小值
   *
   * @param node 当前节点
   * @param maxSoFar 当前路径上的最大值
   * @param minSoFar 当前路径上的最小值
   */
  function dfs(
    node: TreeNode | null,
    maxSoFar: number,
    minSoFar: number
  ): void {
    if (!node) return;

    // 更新路径上的最大值和最小值
    const newMax = Math.max(maxSoFar, node.val);
    const newMin = Math.min(minSoFar, node.val);

    // 计算当前节点与路径上的最大值和最小值的差，更新全局最大差值
    // |当前节点 - 路径最大值| 或 |当前节点 - 路径最小值|
    const currentMaxDiff = Math.max(
      Math.abs(node.val - maxSoFar),
      Math.abs(node.val - minSoFar)
    );

    maxDiff = Math.max(maxDiff, currentMaxDiff);

    // 递归处理左右子树，将当前节点值加入路径考虑
    dfs(node.left, newMax, newMin);
    dfs(node.right, newMax, newMin);
  }

  // 从根节点开始搜索，初始时最大值和最小值都是根节点的值
  dfs(root, root.val, root.val);

  return maxDiff;
}

/**
 * 思路二：另一种实现方式 - 跟踪路径上的最大值和最小值
 * 这种方法避免了计算每个节点与其祖先的差值，而是直接跟踪路径上的最大值和最小值
 *
 * @param root 二叉树的根节点
 * @returns 节点与其祖先之间的最大差值
 */
function maxAncestorDiffAlternative(root: TreeNode | null): number {
  if (!root) return 0;

  /**
   * 递归求解最大差值
   *
   * @param node 当前节点
   * @param max 路径上的最大值
   * @param min 路径上的最小值
   * @returns 当前子树中的最大差值
   */
  function helper(node: TreeNode | null, max: number, min: number): number {
    // 到达叶子节点，返回最大值和最小值的差
    if (!node) return max - min;

    // 更新路径上的最大值和最小值
    max = Math.max(max, node.val);
    min = Math.min(min, node.val);

    // 递归计算左右子树的最大差值，并返回最大的那个
    const leftMaxDiff = helper(node.left, max, min);
    const rightMaxDiff = helper(node.right, max, min);

    return Math.max(leftMaxDiff, rightMaxDiff);
  }

  // 从根节点开始，初始时最大值和最小值都是根节点的值
  return helper(root, root.val, root.val);
}

// @lc code=end
