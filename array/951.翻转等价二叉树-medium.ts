/*
 * @lc app=leetcode.cn id=951 lang=typescript
 *
 * [951] 翻转等价二叉树
 *
 * https://leetcode.cn/problems/flip-equivalent-binary-trees/description/
 *
 * algorithms
 * Medium (66.91%)
 * Likes:    187
 * Dislikes: 0
 * Total Accepted:    26.5K
 * Total Submissions: 39.7K
 * Testcase Example:  '[1,2,3,4,5,6,null,null,null,7,8]\n[1,3,2,null,6,4,5,null,null,null,null,8,7]'
 *
 * 我们可以为二叉树 T 定义一个 翻转操作 ，如下所示：选择任意节点，然后交换它的左子树和右子树。
 *
 * 只要经过一定次数的翻转操作后，能使 X 等于 Y，我们就称二叉树 X 翻转 等价 于二叉树 Y。
 *
 * 这些树由根节点 root1 和 root2 给出。如果两个二叉树是否是翻转 等价 的树，则返回 true ，否则返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：root1 = [1,2,3,4,5,6,null,null,null,7,8], root2 =
 * [1,3,2,null,6,4,5,null,null,null,null,8,7]
 * 输出：true
 * 解释：我们翻转值为 1，3 以及 5 的三个节点。
 *
 *
 * 示例 2:
 *
 *
 * 输入: root1 = [], root2 = []
 * 输出: true
 *
 *
 * 示例 3:
 *
 *
 * 输入: root1 = [], root2 = [1]
 * 输出: false
 *
 *
 *
 *
 * 提示：
 *
 *
 * 每棵树节点数在 [0, 100] 范围内
 * 每棵树中的每个值都是唯一的、在 [0, 99] 范围内的整数
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
 * 解法一：递归（DFS）
 *
 * 核心思路：
 * 1. 两棵树翻转等价的条件：
 *    - 根节点值相同
 *    - 子树有两种匹配方式：
 *      a) 不翻转：root1.left 对应 root2.left，root1.right 对应 root2.right
 *      b) 翻转：root1.left 对应 root2.right，root1.right 对应 root2.left
 * 2. 只要满足其中一种方式，就是翻转等价
 *
 * 时间复杂度：O(min(n1, n2))，n1、n2 是两棵树的节点数
 * 空间复杂度：O(min(h1, h2))，递归栈空间，h1、h2 是两棵树的高度
 */
function flipEquiv(root1: TreeNode | null, root2: TreeNode | null): boolean {
  // 基础情况1：两棵树都为空，认为是等价的
  if (root1 === null && root2 === null) {
    return true;
  }

  // 基础情况2：一棵树为空，另一棵不为空，不等价
  if (root1 === null || root2 === null) {
    return false;
  }

  // 基础情况3：根节点值不同，不等价
  if (root1.val !== root2.val) {
    return false;
  }

  // 递归检查两种情况：
  // 情况1（不翻转）：左对左 && 右对右
  const noFlip =
    flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right);

  // 情况2（翻转）：左对右 && 右对左
  const flip =
    flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left);

  // 只要满足其中一种情况即可
  return noFlip || flip;
}

/**
 * 解法二：递归（优化版，提前剪枝）
 *
 * 优化点：通过比较子节点的值，提前决定是否需要翻转
 *
 * 时间复杂度：O(min(n1, n2))
 * 空间复杂度：O(min(h1, h2))
 */
function flipEquiv2(root1: TreeNode | null, root2: TreeNode | null): boolean {
  // 基础情况
  if (root1 === null && root2 === null) return true;
  if (root1 === null || root2 === null) return false;
  if (root1.val !== root2.val) return false;

  // 辅助函数：获取节点的值，null 返回 -1
  const getVal = (node: TreeNode | null) => (node ? node.val : -1);

  // 获取四个子节点的值
  const l1 = getVal(root1.left);
  const r1 = getVal(root1.right);
  const l2 = getVal(root2.left);
  const r2 = getVal(root2.right);

  // 根据子节点的值决定是否翻转
  // 如果 root1 的左子节点值 == root2 的左子节点值，说明不需要翻转
  if (l1 === l2 && r1 === r2) {
    return (
      flipEquiv2(root1.left, root2.left) && flipEquiv2(root1.right, root2.right)
    );
  }
  // 如果 root1 的左子节点值 == root2 的右子节点值，说明需要翻转
  else if (l1 === r2 && r1 === l2) {
    return (
      flipEquiv2(root1.left, root2.right) && flipEquiv2(root1.right, root2.left)
    );
  }
  // 子节点值不匹配，不等价
  else {
    return false;
  }
}

/**
 * 解法三：规范化（Canonical Form）
 *
 * 思路：
 * 1. 将两棵树都转换成规范形式（统一的结构）
 * 2. 比较规范化后的两棵树是否相同
 * 3. 规范化规则：让每个节点的左子节点值 <= 右子节点值
 *
 * 时间复杂度：O(n1 + n2)
 * 空间复杂度：O(h1 + h2)
 */
function flipEquiv3(root1: TreeNode | null, root2: TreeNode | null): boolean {
  /**
   * 规范化树：确保每个节点的左子节点值 <= 右子节点值
   */
  function canonicalize(node: TreeNode | null): TreeNode | null {
    if (node === null) return null;

    // 递归规范化左右子树
    const left = canonicalize(node.left);
    const right = canonicalize(node.right);

    // 如果需要，交换左右子树
    // 比较规则：优先比较值，null 视为无穷大
    const leftVal = left ? left.val : Infinity;
    const rightVal = right ? right.val : Infinity;

    if (leftVal > rightVal) {
      node.left = right;
      node.right = left;
    } else {
      node.left = left;
      node.right = right;
    }

    return node;
  }

  /**
   * 检查两棵树是否完全相同
   */
  function isSameTree(t1: TreeNode | null, t2: TreeNode | null): boolean {
    if (t1 === null && t2 === null) return true;
    if (t1 === null || t2 === null) return false;
    if (t1.val !== t2.val) return false;

    return isSameTree(t1.left, t2.left) && isSameTree(t1.right, t2.right);
  }

  // 规范化两棵树后比较
  const canon1 = canonicalize(root1);
  const canon2 = canonicalize(root2);

  return isSameTree(canon1, canon2);
}

/**
 * 图解示例：
 *
 * 示例 1：
 *     树1:        1              树2:        1
 *               /   \                      /   \
 *              2     3                    3     2
 *             / \   /                    / \   / \
 *            4   5 6                    6   4  5
 *               / \                            / \
 *              7   8                          8   7
 *
 * 翻转过程：
 * 1. 翻转节点1的左右子树：2 和 3 交换
 *     1
 *    / \
 *   3   2
 *  /   / \
 * 6   4   5
 *        / \
 *       7   8
 *
 * 2. 翻转节点3：无需翻转（因为树2的3只有左子树）
 *
 * 3. 翻转节点5的左右子树：7 和 8 交换
 *     1
 *    / \
 *   3   2
 *  /   / \
 * 6   4   5
 *        / \
 *       8   7
 *
 * 最终树1和树2等价 ✅
 *
 * 示例 2：不等价的情况
 *  树1:  1         树2:  1
 *       /               /
 *      2               3
 *
 * root1.val = root2.val = 1 ✓
 * 但 root1.left.val = 2, root2.left.val = 3, 不相等 ✗
 * 无论如何翻转都不能让 2 变成 3
 */
// @lc code=end
