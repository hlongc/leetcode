/*
 * @lc app=leetcode.cn id=814 lang=typescript
 *
 * [814] 二叉树剪枝
 *
 * https://leetcode.cn/problems/binary-tree-pruning/description/
 *
 * algorithms
 * Medium (71.80%)
 * Likes:    401
 * Dislikes: 0
 * Total Accepted:    73.6K
 * Total Submissions: 102.5K
 * Testcase Example:  '[1,null,0,0,1]'
 *
 * 给你二叉树的根结点 root ，此外树的每个结点的值要么是 0 ，要么是 1 。
 *
 * 返回移除了所有不包含 1 的子树的原二叉树。
 *
 * 节点 node 的子树为 node 本身加上所有 node 的后代。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [1,null,0,0,1]
 * 输出：[1,null,0,null,1]
 * 解释：
 * 只有红色节点满足条件“所有不包含 1 的子树”。 右图为返回的答案。
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [1,0,1,0,0,0,1]
 * 输出：[1,null,1,null,1]
 *
 *
 * 示例 3：
 *
 *
 * 输入：root = [1,1,0,1,1,0,1,0]
 * 输出：[1,1,0,1,1,null,1]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点的数目在范围 [1, 200] 内
 * Node.val 为 0 或 1
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
 * 解题思路：后序遍历（DFS）
 *
 * 核心思想：
 * 从叶子节点开始，自底向上判断是否需要剪枝
 *
 * 剪枝条件：
 * 一个节点需要被剪枝，当且仅当：
 * 1. 节点值为 0
 * 2. 左子树为空（或已被剪枝）
 * 3. 右子树为空（或已被剪枝）
 *
 * 算法流程：
 * 1. 递归处理左子树，得到剪枝后的左子树
 * 2. 递归处理右子树，得到剪枝后的右子树
 * 3. 判断当前节点是否需要剪枝
 * 4. 返回剪枝后的节点（或null）
 *
 * 为什么用后序遍历？
 * 因为需要先知道子树的情况，才能决定当前节点是否剪枝
 *
 * 时间复杂度：O(n)，每个节点访问一次
 * 空间复杂度：O(h)，h为树的高度（递归栈）
 */
function pruneTree(root: TreeNode | null): TreeNode | null {
  // 边界条件：空节点直接返回
  if (!root) {
    return null;
  }

  // 后序遍历：先处理左右子树
  // 递归剪枝左子树
  root.left = pruneTree(root.left);

  // 递归剪枝右子树
  root.right = pruneTree(root.right);

  // 判断当前节点是否需要剪枝
  // 条件：节点值为0 且 左右子树都为空
  if (root.val === 0 && !root.left && !root.right) {
    return null; // 剪掉当前节点
  }

  // 否则保留当前节点
  return root;
}

/**
 * 算法图解：
 *
 * 示例1：root = [1,null,0,0,1]
 *
 * 原始树：
 *     1
 *      \
 *       0
 *      / \
 *     0   1
 *
 * 执行过程（后序遍历）：
 *
 * 1. 处理节点0（左叶子）：
 *    - 值为0，左右子树都为空
 *    - 剪掉，返回null
 *
 * 2. 处理节点1（右叶子）：
 *    - 值为1
 *    - 保留，返回节点1
 *
 * 3. 处理节点0（根的右子节点）：
 *    - 左子树已被剪掉（null）
 *    - 右子树保留（节点1）
 *    - 值为0，但右子树不为空
 *    - 保留，返回节点0
 *
 * 4. 处理根节点1：
 *    - 左子树为空
 *    - 右子树保留（节点0）
 *    - 值为1
 *    - 保留
 *
 * 结果：
 *     1
 *      \
 *       0
 *        \
 *         1
 *
 *
 * 示例2：root = [1,0,1,0,0,0,1]
 *
 * 原始树：
 *       1
 *      / \
 *     0   1
 *    / \ / \
 *   0  0 0  1
 *
 * 执行过程：
 *
 * 1. 叶子节点处理：
 *    - 左子树的0,0都被剪掉
 *    - 右子树的0被剪掉，1保留
 *
 * 2. 节点0（根的左子节点）：
 *    - 值为0，左右子树都被剪掉
 *    - 剪掉
 *
 * 3. 节点1（根的右子节点）：
 *    - 值为1，右子树有节点1
 *    - 保留
 *
 * 4. 根节点1：
 *    - 左子树被剪掉
 *    - 右子树保留
 *    - 保留
 *
 * 结果：
 *     1
 *      \
 *       1
 *        \
 *         1
 *
 *
 * 关键点：
 * 1. 使用后序遍历（左→右→根）
 * 2. 先处理子树，再判断当前节点
 * 3. 剪枝条件：值为0 且 无子树
 * 4. 直接修改树结构，返回剪枝后的根节点
 *
 *
 * 为什么不能用前序遍历？
 *
 * 如果用前序遍历：
 *     0
 *    / \
 *   0   1
 *
 * 先判断根节点0：
 * - 值为0，但有子树
 * - 不能剪枝
 *
 * 但实际上左子树0应该被剪掉，
 * 只有先处理子树，才能正确判断！
 */
// @lc code=end
