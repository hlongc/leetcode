/*
 * @lc app=leetcode.cn id=108 lang=typescript
 *
 * [108] 将有序数组转换为二叉搜索树
 *
 * https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/description/
 *
 * algorithms
 * Easy (80.72%)
 * Likes:    1737
 * Dislikes: 0
 * Total Accepted:    764.4K
 * Total Submissions: 947K
 * Testcase Example:  '[-10,-3,0,5,9]'
 *
 * 给你一个整数数组 nums ，其中元素已经按 升序 排列，请你将其转换为一棵 平衡 二叉搜索树。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [-10,-3,0,5,9]
 * 输出：[0,-3,9,-10,null,5]
 * 解释：[0,-10,5,null,-3,null,9] 也将被视为正确答案：
 *
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,3]
 * 输出：[3,1]
 * 解释：[1,null,3] 和 [3,1] 都是高度平衡二叉搜索树。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^4
 * -10^4 <= nums[i] <= 10^4
 * nums 按 严格递增 顺序排列
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
 * 思路（递归方式）：
 * 1. 核心思想：选择数组中间元素作为根节点，左半部分构建左子树，右半部分构建右子树
 * 2. 递归终止条件：left > right 时返回 null
 * 3. 递归过程：
 *    - 找到中间元素创建根节点
 *    - 递归构建左子树（左半部分数组）
 *    - 递归构建右子树（右半部分数组）
 *
 * 时间复杂度：O(n) - 需要处理数组中的每个元素
 * 空间复杂度：O(log n) - 递归栈的深度，平衡树的高度为 log n
 */
function sortedArrayToBST(nums: number[]): TreeNode | null {
  /**
   * 递归构建 BST
   * @param left 数组左边界（包含）
   * @param right 数组右边界（包含）
   * @returns 构建好的子树根节点
   */
  function buildBST(left: number, right: number): TreeNode | null {
    // 递归终止条件：区间为空
    if (left > right) {
      return null;
    }

    // 选择中间元素作为根节点（保证平衡）
    const mid = Math.floor((left + right) / 2);
    const root = new TreeNode(nums[mid]);

    // 递归构建左子树（左半部分数组）
    root.left = buildBST(left, mid - 1);

    // 递归构建右子树（右半部分数组）
    root.right = buildBST(mid + 1, right);

    return root;
  }

  // 从整个数组开始构建
  return buildBST(0, nums.length - 1);
}
// @lc code=end
