/*
 * @lc app=leetcode.cn id=98 lang=typescript
 *
 * [98] 验证二叉搜索树
 *
 * https://leetcode.cn/problems/validate-binary-search-tree/description/
 *
 * algorithms
 * Medium (40.25%)
 * Likes:    2684
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 3.2M
 * Testcase Example:  '[2,1,3]'
 *
 * 给你一个二叉树的根节点 root ，判断其是否是一个有效的二叉搜索树。
 *
 * 有效 二叉搜索树定义如下：
 *
 *
 * 节点的左子树只包含 严格小于 当前节点的数。
 * 节点的右子树只包含 严格大于 当前节点的数。
 * 所有左子树和右子树自身必须也是二叉搜索树。
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [2,1,3]
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [5,1,4,null,null,3,6]
 * 输出：false
 * 解释：根节点的值是 5 ，但是右子节点的值是 4 。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数目范围在[1, 10^4] 内
 * -2^31 <= Node.val <= 2^31 - 1
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
 * 思路：利用 BST 的性质 - 中序遍历结果必然是严格递增序列
 *
 * 方法1（推荐）：中序遍历 + 前驱节点比较
 * - BST 的中序遍历是递增序列：左 -> 根 -> 右
 * - 在遍历过程中，记录前一个节点的值
 * - 如果当前节点值 <= 前一个节点值，则不是 BST
 *
 * 时间复杂度：O(n) - 需要遍历所有节点
 * 空间复杂度：O(h) - 递归栈深度，h 为树的高度
 */
function isValidBST(root: TreeNode | null): boolean {
  // 记录前一个访问的节点的值，初始化为负无穷
  let prevValue: number | null = null;

  /**
   * 中序遍历验证
   * @param node 当前节点
   * @returns 以当前节点为根的子树是否是有效的 BST
   */
  function inorderValidate(node: TreeNode | null): boolean {
    // 空节点是有效的 BST
    if (node === null) {
      return true;
    }

    // 1. 先验证左子树
    if (!inorderValidate(node.left)) {
      return false;
    }

    // 2. 验证当前节点
    // BST 的中序遍历必须是严格递增的
    // 当前节点值必须大于前一个节点值
    if (prevValue !== null && node.val <= prevValue) {
      return false;
    }

    // 更新前驱节点值
    prevValue = node.val;

    // 3. 验证右子树
    return inorderValidate(node.right);
  }

  return inorderValidate(root);
}

/**
 * 方法2（备选）：区间限制法
 * - 每个节点都有一个合法的取值区间 (min, max)
 * - 左子树的所有节点必须 < 当前节点值
 * - 右子树的所有节点必须 > 当前节点值
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(h)
 */
/*
function isValidBST(root: TreeNode | null): boolean {
  function validate(
    node: TreeNode | null,
    min: number | null,
    max: number | null
  ): boolean {
    // 空节点是有效的
    if (node === null) {
      return true;
    }

    // 当前节点值必须在 (min, max) 区间内
    if (min !== null && node.val <= min) {
      return false;
    }
    if (max !== null && node.val >= max) {
      return false;
    }

    // 左子树：所有节点 < node.val，所以 max = node.val
    // 右子树：所有节点 > node.val，所以 min = node.val
    return (
      validate(node.left, min, node.val) &&
      validate(node.right, node.val, max)
    );
  }

  return validate(root, null, null);
}
*/
// @lc code=end
