/*
 * @lc app=leetcode.cn id=236 lang=typescript
 *
 * [236] 二叉树的最近公共祖先
 *
 * https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/description/
 *
 * algorithms
 * Medium (74.54%)
 * Likes:    3108
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 1.5M
 * Testcase Example:  '[3,5,1,6,2,0,8,null,null,7,4]\n5\n1'
 *
 * 给定一个二叉树, 找到该树中两个指定节点的最近公共祖先。
 *
 * 百度百科中最近公共祖先的定义为：“对于有根树 T 的两个节点 p、q，最近公共祖先表示为一个节点 x，满足 x 是 p、q 的祖先且 x
 * 的深度尽可能大（一个节点也可以是它自己的祖先）。”
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
 * 输出：3
 * 解释：节点 5 和节点 1 的最近公共祖先是节点 3 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
 * 输出：5
 * 解释：节点 5 和节点 4 的最近公共祖先是节点 5 。因为根据定义最近公共祖先节点可以为节点本身。
 *
 *
 * 示例 3：
 *
 *
 * 输入：root = [1,2], p = 1, q = 2
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数目在范围 [2, 10^5] 内。
 * -10^9
 * 所有 Node.val 互不相同 。
 * p != q
 * p 和 q 均存在于给定的二叉树中。
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
 * 二叉树的最近公共祖先（Lowest Common Ancestor, LCA）
 *
 * 核心思路：
 * 使用递归（后序遍历）的思想，从底向上查找
 *
 * 关键理解：
 * 1. 如果当前节点是p或q，直接返回当前节点
 * 2. 递归查找左右子树
 * 3. 根据左右子树的返回值判断：
 *    - 如果左右子树都找到了（一边找到p，一边找到q）→ 当前节点就是LCA
 *    - 如果只有左子树找到 → 返回左子树的结果
 *    - 如果只有右子树找到 → 返回右子树的结果
 *    - 如果都没找到 → 返回null
 *
 * 【情况分析图解】
 *
 * 情况1：p和q分别在左右子树
 *         3  ← LCA (左右子树各找到一个)
 *        / \
 *       5   1
 *      /     \
 *     p       q
 *
 * 情况2：p是q的祖先（或q是p的祖先）
 *         3
 *        /
 *       5  ← LCA (p本身)
 *      /
 *     p
 *      \
 *       q
 *
 * 情况3：p和q都在左子树
 *         3
 *        /
 *       5  ← LCA
 *      / \
 *     p   q
 *
 * 时间复杂度：O(n)，最坏情况需要遍历所有节点
 * 空间复杂度：O(h)，h是树的高度，递归栈的深度
 */
function lowestCommonAncestor(
  root: TreeNode | null,
  p: TreeNode | null,
  q: TreeNode | null
): TreeNode | null {
  // 递归终止条件
  // 1. 如果节点为空，返回null
  // 2. 如果当前节点是p或q，返回当前节点
  //    （这里很关键：即使另一个节点在当前节点的子树中，也应该返回当前节点）
  if (root === null || root === p || root === q) {
    return root;
  }

  // 递归查找左子树
  // left保存：左子树中是否找到p或q（或它们的LCA）
  const left = lowestCommonAncestor(root.left, p, q);

  // 递归查找右子树
  // right保存：右子树中是否找到p或q（或它们的LCA）
  const right = lowestCommonAncestor(root.right, p, q);

  // 情况1：左右子树都有返回值
  // 说明p和q分别在左右子树中，当前节点就是它们的LCA
  if (left !== null && right !== null) {
    return root;
  }

  // 情况2：只有左子树有返回值
  // 说明p和q都在左子树，或者只有一个在左子树
  // 返回左子树的查找结果
  if (left !== null) {
    return left;
  }

  // 情况3：只有右子树有返回值
  // 说明p和q都在右子树，或者只有一个在右子树
  // 返回右子树的查找结果
  if (right !== null) {
    return right;
  }

  // 情况4：左右子树都没有返回值
  // 说明p和q都不在当前子树中
  return null;
}

/**
 * 【详细执行过程图解】
 *
 * 示例树：
 *           3
 *          / \
 *         5   1
 *        / \ / \
 *       6  2 0  8
 *         / \
 *        7   4
 *
 * 查找 p=5, q=1 的LCA：
 *
 * 执行过程（后序遍历：左→右→根）：
 *
 * 1. 从根节点3开始
 *    - root=3, 不是p也不是q，继续递归
 *
 * 2. 查找左子树（节点5）
 *    - root=5, 发现是p！直接返回5
 *    - 不再继续递归5的子树（这是关键优化）
 *
 * 3. 查找右子树（节点1）
 *    - root=1, 发现是q！直接返回1
 *    - 不再继续递归1的子树
 *
 * 4. 回到节点3
 *    - left = 5 (左子树返回的结果)
 *    - right = 1 (右子树返回的结果)
 *    - left !== null && right !== null
 *    - 返回当前节点3 ← 这就是LCA！
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 查找 p=5, q=4 的LCA：
 *
 *           3
 *          / \
 *         5   1  ← q=4在5的子树中
 *        / \
 *       6  2
 *         / \
 *        7   4
 *
 * 执行过程：
 *
 * 1. 从根节点3开始
 *
 * 2. 查找左子树（节点5）
 *    - root=5, 发现是p！返回5
 *    - 注意：虽然4在5的子树中，但我们已经返回了
 *
 * 3. 查找右子树（节点1）
 *    - 递归查找节点1的子树
 *    - 没有找到p或q
 *    - 返回null
 *
 * 4. 回到节点3
 *    - left = 5
 *    - right = null
 *    - left !== null，返回left
 *    - 返回节点5 ← 这就是LCA！
 *
 * 为什么是5？因为题目说明："一个节点可以是它自己的祖先"
 */

/**
 * 【为什么这个算法是正确的？】
 *
 * 关键点1：后序遍历的特性
 * - 先处理子树，再处理当前节点
 * - 从底向上传递信息
 * - 保证了找到的是"最近"的公共祖先
 *
 * 关键点2：提前返回的优化
 * - 一旦找到p或q，立即返回，不再深入
 * - 这样可以避免不必要的递归
 * - 同时也正确处理了"p是q的祖先"的情况
 *
 * 关键点3：返回值的含义
 * 函数的返回值有两种可能：
 * a) 找到了p或q（其中一个）
 * b) 找到了p和q的LCA
 *
 * 通过left和right的组合，我们可以判断当前节点是否就是LCA
 *
 * 【三种核心情况】
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ left ≠ null && right ≠ null  →  当前节点是LCA           │
 * │ (p和q分别在左右子树)                                     │
 * └─────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ left ≠ null && right = null  →  返回left                │
 * │ (p和q都在左子树，或只有左边有)                           │
 * └─────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ left = null && right ≠ null  →  返回right               │
 * │ (p和q都在右子树，或只有右边有)                           │
 * └─────────────────────────────────────────────────────────┘
 */

/**
 * 【代码简化版本】
 * 上面的代码可以简化为：
 */
function lowestCommonAncestorSimplified(
  root: TreeNode | null,
  p: TreeNode | null,
  q: TreeNode | null
): TreeNode | null {
  if (!root || root === p || root === q) return root;

  const left = lowestCommonAncestorSimplified(root.left, p, q);
  const right = lowestCommonAncestorSimplified(root.right, p, q);

  // 如果左右都不为空，说明p和q分别在左右子树，当前节点是LCA
  if (left && right) return root;

  // 否则返回不为空的那一边（或者都为空返回null）
  return left || right;
}

/**
 * 【类似题目】
 *
 * 1. LeetCode 235: 二叉搜索树的最近公共祖先
 *    - 可以利用BST的性质优化
 *    - 如果p和q的值都小于root，LCA在左子树
 *    - 如果p和q的值都大于root，LCA在右子树
 *    - 否则root就是LCA
 *
 * 2. LeetCode 1644: 二叉树的最近公共祖先 II
 *    - p和q可能不在树中
 *    - 需要额外判断是否真的找到了p和q
 *
 * 3. LeetCode 1650: 二叉树的最近公共祖先 III
 *    - 节点有指向父节点的指针
 *    - 可以转化为链表相交问题
 *
 * 4. LeetCode 1676: 二叉树的最近公共祖先 IV
 *    - 找多个节点的LCA
 *    - 同样的思路，但需要判断是否找到所有节点
 */

/**
 * 【知识点总结】
 *
 * 1. 递归三要素：
 *    - 递归终止条件：节点为空 或 找到p/q
 *    - 递归过程：分别查找左右子树
 *    - 返回值：找到的节点或LCA
 *
 * 2. 后序遍历思想：
 *    - 从底向上传递信息
 *    - 先处理子问题，再处理当前问题
 *
 * 3. 提前返回优化：
 *    - 找到目标节点立即返回
 *    - 避免不必要的递归
 *
 * 4. 分类讨论：
 *    - 根据left和right的值判断不同情况
 *    - 每种情况返回对应的结果
 */
// @lc code=end
