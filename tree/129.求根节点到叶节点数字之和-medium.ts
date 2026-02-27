/*
 * @lc app=leetcode.cn id=129 lang=typescript
 *
 * [129] 求根节点到叶节点数字之和
 *
 * https://leetcode.cn/problems/sum-root-to-leaf-numbers/description/
 *
 * algorithms
 * Medium (71.86%)
 * Likes:    837
 * Dislikes: 0
 * Total Accepted:    368.9K
 * Total Submissions: 513.3K
 * Testcase Example:  '[1,2,3]'
 *
 * 给你一个二叉树的根节点 root ，树中每个节点都存放有一个 0 到 9 之间的数字。
 *
 *
 * 每条从根节点到叶节点的路径都代表一个数字：
 *
 *
 * 例如，从根节点到叶节点的路径 1 -> 2 -> 3 表示数字 123 。
 *
 *
 * 计算从根节点到叶节点生成的 所有数字之和 。
 *
 * 叶节点 是指没有子节点的节点。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [1,2,3]
 * 输出：25
 * 解释：
 * 从根到叶子节点路径 1->2 代表数字 12
 * 从根到叶子节点路径 1->3 代表数字 13
 * 因此，数字总和 = 12 + 13 = 25
 *
 * 示例 2：
 *
 *
 * 输入：root = [4,9,0,5,1]
 * 输出：1026
 * 解释：
 * 从根到叶子节点路径 4->9->5 代表数字 495
 * 从根到叶子节点路径 4->9->1 代表数字 491
 * 从根到叶子节点路径 4->0 代表数字 40
 * 因此，数字总和 = 495 + 491 + 40 = 1026
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点的数目在范围 [1, 1000] 内
 * 0
 * 树的深度不超过 10
 *
 *
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
 * 解题思路：DFS（深度优先搜索）+ 路径累加
 *
 * 核心思想：
 * 从根节点到叶节点的路径形成一个数字，遍历所有路径并累加
 *
 * 数字构建规则：
 * 路径 1→2→3 表示数字 123
 * 计算方式：1 * 10 + 2 = 12，12 * 10 + 3 = 123
 *
 * 算法流程：
 * 1. 从根节点开始，携带当前路径形成的数字
 * 2. 每到一个节点，更新数字：currentNum = currentNum * 10 + node.val
 * 3. 到达叶节点时，将该数字加入总和
 * 4. 递归遍历左右子树
 *
 * 叶节点判断：
 * 左右子节点都为空
 *
 * 时间复杂度：O(n)，每个节点访问一次
 * 空间复杂度：O(h)，h为树的高度（递归栈）
 */
function sumNumbers(root: TreeNode | null): number {
  /**
   * DFS辅助函数
   * @param node 当前节点
   * @param currentNum 从根到当前节点形成的数字
   * @returns 从当前节点到所有叶节点的数字之和
   */
  function dfs(node: TreeNode | null, currentNum: number): number {
    // 空节点返回0
    if (!node) {
      return 0;
    }

    // 更新当前路径形成的数字
    // 例如：之前是12，当前节点是3，则变为 12 * 10 + 3 = 123
    currentNum = currentNum * 10 + node.val;

    // 判断是否为叶节点
    if (!node.left && !node.right) {
      // 到达叶节点，返回该路径形成的数字
      return currentNum;
    }

    // 递归计算左右子树的数字之和
    const leftSum = dfs(node.left, currentNum); // 左子树的数字之和
    const rightSum = dfs(node.right, currentNum); // 右子树的数字之和

    // 返回左右子树数字之和
    return leftSum + rightSum;
  }

  // 从根节点开始，初始数字为0
  return dfs(root, 0);
}

/**
 * 算法图解：
 *
 * 示例1：root = [1,2,3]
 *
 *     1
 *    / \
 *   2   3
 *
 * 执行过程：
 *
 * 1. dfs(节点1, 0)
 *    currentNum = 0 * 10 + 1 = 1
 *    不是叶节点，继续递归
 *
 * 2. dfs(节点2, 1)
 *    currentNum = 1 * 10 + 2 = 12
 *    是叶节点，返回 12
 *
 * 3. dfs(节点3, 1)
 *    currentNum = 1 * 10 + 3 = 13
 *    是叶节点，返回 13
 *
 * 4. 节点1的结果 = 12 + 13 = 25
 *
 *
 * 示例2：root = [4,9,0,5,1]
 *
 *       4
 *      / \
 *     9   0
 *    / \
 *   5   1
 *
 * 执行过程：
 *
 * 1. dfs(节点4, 0)
 *    currentNum = 4
 *
 * 2. 左子树：dfs(节点9, 4)
 *    currentNum = 4 * 10 + 9 = 49
 *
 *    2.1 左子树：dfs(节点5, 49)
 *        currentNum = 49 * 10 + 5 = 495
 *        是叶节点，返回 495
 *
 *    2.2 右子树：dfs(节点1, 49)
 *        currentNum = 49 * 10 + 1 = 491
 *        是叶节点，返回 491
 *
 *    节点9的结果 = 495 + 491 = 986
 *
 * 3. 右子树：dfs(节点0, 4)
 *    currentNum = 4 * 10 + 0 = 40
 *    是叶节点，返回 40
 *
 * 4. 节点4的结果 = 986 + 40 = 1026
 *
 *
 * 数字构建过程详解：
 *
 * 路径 4→9→5：
 * - 到节点4：0 * 10 + 4 = 4
 * - 到节点9：4 * 10 + 9 = 49
 * - 到节点5：49 * 10 + 5 = 495 ✓
 *
 * 路径 4→9→1：
 * - 到节点4：4
 * - 到节点9：49
 * - 到节点1：49 * 10 + 1 = 491 ✓
 *
 * 路径 4→0：
 * - 到节点4：4
 * - 到节点0：4 * 10 + 0 = 40 ✓
 *
 * 总和：495 + 491 + 40 = 1026
 *
 *
 * 关键点：
 * 1. 使用 currentNum * 10 + node.val 构建数字
 * 2. 只在叶节点处累加数字
 * 3. 递归遍历所有路径
 * 4. 返回左右子树的和
 *
 *
 * 边界情况：
 *
 * 1. 单节点树：
 *    root = [5]
 *    结果：5
 *
 * 2. 包含0的路径：
 *    root = [1,0]
 *    路径：1→0 = 10
 *    结果：10
 *
 * 3. 只有左子树或右子树：
 *    root = [1,2,null]
 *    路径：1→2 = 12
 *    结果：12
 */
// @lc code=end
