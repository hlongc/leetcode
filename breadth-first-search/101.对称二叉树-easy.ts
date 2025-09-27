/*
 * @lc app=leetcode.cn id=101 lang=typescript
 *
 * [101] 对称二叉树
 *
 * https://leetcode.cn/problems/symmetric-tree/description/
 *
 * algorithms
 * Easy (62.17%)
 * Likes:    2943
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 2.1M
 * Testcase Example:  '[1,2,2,3,4,4,3]'
 *
 * 给你一个二叉树的根节点 root ， 检查它是否轴对称。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [1,2,2,3,4,4,3]
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [1,2,2,null,3,null,3]
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数目在范围 [1, 1000] 内
 * -100 <= Node.val <= 100
 *
 *
 *
 *
 * 进阶：你可以运用递归和迭代两种方法解决这个问题吗？
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
 * 方法一：递归方式的广度优先搜索
 * 思路：比较左子树和右子树是否镜像对称
 * 递归比较：左子树的左节点与右子树的右节点，左子树的右节点与右子树的左节点
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(h)，其中 h 是树的高度，递归调用栈的深度
 */
function isSymmetricRecursive(
  left: TreeNode | null,
  right: TreeNode | null
): boolean {
  // 基础情况：两个节点都为空，对称
  if (left === null && right === null) {
    return true;
  }

  // 如果其中一个为空，另一个不为空，不对称
  if (left === null || right === null) {
    return false;
  }

  // 如果节点值不相等，不对称
  if (left.val !== right.val) {
    return false;
  }

  // 递归检查：左子树的左节点与右子树的右节点，左子树的右节点与右子树的左节点
  return (
    isSymmetricRecursive(left.left, right.right) &&
    isSymmetricRecursive(left.right, right.left)
  );
}

/**
 * 方法二：迭代方式的广度优先搜索
 * 思路：使用队列进行层序遍历，每次取出两个节点进行比较
 * 队列中按照对称的顺序存储节点：左子树的左节点、右子树的右节点、左子树的右节点、右子树的左节点
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(w)，其中 w 是树的最大宽度，队列中最多存储的节点数
 */
function isSymmetricIterative(root: TreeNode | null): boolean {
  if (root === null) {
    return true;
  }

  // 使用队列进行BFS
  const queue: (TreeNode | null)[] = [];

  // 初始化队列：放入左右子树
  queue.push(root.left);
  queue.push(root.right);

  while (queue.length > 0) {
    // 每次取出两个节点进行比较
    const left = queue.shift() as TreeNode | null;
    const right = queue.shift() as TreeNode | null;

    // 两个节点都为空，继续检查下一对
    if (left === null && right === null) {
      continue;
    }

    // 其中一个为空，不对称
    if (left === null || right === null) {
      return false;
    }

    // 节点值不相等，不对称
    if (left.val !== right.val) {
      return false;
    }

    // 此时 left 和 right 都不为 null，可以安全访问其属性
    // 按照对称的顺序将子节点加入队列
    // 左子树的左节点 与 右子树的右节点 配对
    queue.push(left.left);
    queue.push(right.right);

    // 左子树的右节点 与 右子树的左节点 配对
    queue.push(left.right);
    queue.push(right.left);
  }

  return true;
}

function isSymmetric(root: TreeNode | null): boolean {
  if (root === null) {
    return true;
  }

  // 可以选择使用递归或迭代方式
  // return isSymmetricRecursive(root.left, root.right);
  return isSymmetricIterative(root);
}

/**
 * 算法解析：
 *
 * 1. 递归方式 (DFS思想但用于对称检查)：
 *    - 将问题转化为比较两个子树是否互为镜像
 *    - 对于镜像对称，需要满足：
 *      a) 两个根节点值相同
 *      b) 左子树的左子树 与 右子树的右子树 对称
 *      c) 左子树的右子树 与 右子树的左子树 对称
 *
 * 2. 迭代方式 (真正的BFS)：
 *    - 使用队列进行层序遍历
 *    - 每次从队列中取出两个节点进行比较
 *    - 按照对称的顺序将子节点放入队列
 *    - 队列为空且没有发现不对称时，树是对称的
 *
 * 测试用例解析：
 *
 * 示例1: [1,2,2,3,4,4,3] -> true
 *       1
 *      / \
 *     2   2
 *    / \ / \
 *   3  4 4  3
 *
 * 示例2: [1,2,2,null,3,null,3] -> false
 *       1
 *      / \
 *     2   2
 *      \   \
 *       3   3
 *
 * 复杂度对比：
 * - 递归方式：空间复杂度O(h)，h为树高度，最坏情况O(n)
 * - 迭代方式：空间复杂度O(w)，w为树的最大宽度，最坏情况O(n)
 * - 两种方式时间复杂度都是O(n)
 */
// @lc code=end
