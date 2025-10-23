/*
 * @lc app=leetcode.cn id=958 lang=typescript
 *
 * [958] 二叉树的完全性检验
 *
 * https://leetcode.cn/problems/check-completeness-of-a-binary-tree/description/
 *
 * algorithms
 * Medium (55.93%)
 * Likes:    323
 * Dislikes: 0
 * Total Accepted:    71.1K
 * Total Submissions: 127K
 * Testcase Example:  '[1,2,3,4,5,6]'
 *
 * 给你一棵二叉树的根节点 root ，请你判断这棵树是否是一棵 完全二叉树 。
 *
 * 在一棵 完全二叉树 中，除了最后一层外，所有层都被完全填满，并且最后一层中的所有节点都尽可能靠左。最后一层（第 h 层）中可以包含 1 到 2^h
 * 个节点。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：root = [1,2,3,4,5,6]
 * 输出：true
 * 解释：最后一层前的每一层都是满的（即，节点值为 {1} 和 {2,3} 的两层），且最后一层中的所有节点（{4,5,6}）尽可能靠左。
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入：root = [1,2,3,4,5,null,7]
 * 输出：false
 * 解释：值为 7 的节点不满足条件「节点尽可能靠左」。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数目在范围 [1, 100] 内
 * 1 <= Node.val <= 1000
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
 * 解法一：层序遍历（BFS）- 推荐
 *
 * 核心思路：
 * 完全二叉树的特点：在层序遍历中，一旦遇到空节点，后面不应该再有非空节点
 *
 * 步骤：
 * 1. 使用队列进行层序遍历
 * 2. 将所有节点（包括 null）都加入队列
 * 3. 一旦遇到 null 节点，检查后续是否还有非 null 节点
 * 4. 如果有，说明不是完全二叉树
 *
 * 时间复杂度：O(n)，需要遍历所有节点
 * 空间复杂度：O(n)，队列最多存储一层的节点，最后一层最多有 n/2 个节点
 */
function isCompleteTree(root: TreeNode | null): boolean {
  if (root === null) return true;

  // 使用队列进行层序遍历
  const queue: (TreeNode | null)[] = [root];
  // 标记是否已经遇到了空节点
  let foundNull = false;

  while (queue.length > 0) {
    const node = queue.shift()!;

    // 如果当前节点为空
    if (node === null) {
      foundNull = true; // 标记已遇到空节点
    } else {
      // 如果当前节点不为空，但之前已经遇到过空节点
      // 说明不是完全二叉树（空节点后面还有非空节点）
      if (foundNull) {
        return false;
      }

      // 将左右子节点都加入队列（包括 null）
      queue.push(node.left);
      queue.push(node.right);
    }
  }

  return true;
}

/**
 * 解法二：编号法
 *
 * 核心思路：
 * 给二叉树的节点编号（类似于堆的编号方式）：
 * - 根节点编号为 1
 * - 左子节点编号为 parent * 2
 * - 右子节点编号为 parent * 2 + 1
 *
 * 完全二叉树的特点：
 * 如果有 n 个节点，最大编号应该等于 n
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function isCompleteTree2(root: TreeNode | null): boolean {
  if (root === null) return true;

  // 队列存储 [节点, 编号]
  const queue: [TreeNode, number][] = [[root, 1]];
  let nodeCount = 0; // 节点总数
  let maxIndex = 0; // 最大编号

  while (queue.length > 0) {
    const [node, index] = queue.shift()!;
    nodeCount++;
    maxIndex = Math.max(maxIndex, index);

    // 左子节点编号为 index * 2
    if (node.left) {
      queue.push([node.left, index * 2]);
    }

    // 右子节点编号为 index * 2 + 1
    if (node.right) {
      queue.push([node.right, index * 2 + 1]);
    }
  }

  // 完全二叉树的最大编号应该等于节点总数
  return maxIndex === nodeCount;
}

/**
 * 解法三：BFS + 两阶段检查
 *
 * 核心思路：
 * 将遍历分为两个阶段：
 * 1. 第一阶段：所有节点都有两个子节点
 * 2. 第二阶段：可能有节点只有左子节点或没有子节点
 * 3. 一旦进入第二阶段，就不能再回到第一阶段
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function isCompleteTree3(root: TreeNode | null): boolean {
  if (root === null) return true;

  const queue: TreeNode[] = [root];
  // 标记是否已经遇到"不完整"的节点（没有两个子节点的节点）
  let reachedIncomplete = false;

  while (queue.length > 0) {
    const node = queue.shift()!;

    // 检查左子节点
    if (node.left) {
      // 如果之前已经遇到"不完整"的节点，现在又遇到有子节点的节点
      // 说明不是完全二叉树
      if (reachedIncomplete) {
        return false;
      }
      queue.push(node.left);
    } else {
      // 左子节点为空，标记为"不完整"
      reachedIncomplete = true;
    }

    // 检查右子节点
    if (node.right) {
      // 如果之前已经遇到"不完整"的节点，现在又遇到有子节点的节点
      // 说明不是完全二叉树
      if (reachedIncomplete) {
        return false;
      }
      queue.push(node.right);
    } else {
      // 右子节点为空，标记为"不完整"
      reachedIncomplete = true;
    }
  }

  return true;
}

/**
 * 图解示例：
 *
 * 示例 1：完全二叉树
 *        1
 *      /   \
 *     2     3
 *    / \   /
 *   4   5 6
 *
 * 层序遍历（包含 null）：[1, 2, 3, 4, 5, 6, null, null, null, null, null, null, null]
 *                                               ↑ 第一个null后面都是null ✅
 *
 * 编号法：
 *        1(1)
 *      /      \
 *    2(2)     3(3)
 *    / \      /
 *  4(4) 5(5) 6(6)
 *
 * 节点数 = 6，最大编号 = 6，相等 ✅
 *
 * ---
 *
 * 示例 2：不是完全二叉树
 *        1
 *      /   \
 *     2     3
 *    / \     \
 *   4   5     7
 *
 * 层序遍历（包含 null）：[1, 2, 3, 4, 5, null, 7, null, null, null, null]
 *                                          ↑null后面还有7 ❌
 *
 * 编号法：
 *        1(1)
 *      /      \
 *    2(2)     3(3)
 *    / \        \
 *  4(4) 5(5)    7(7)
 *
 * 节点数 = 6，最大编号 = 7，不相等 ❌（节点6缺失）
 *
 * ---
 *
 * 示例 3：其他不完全的情况
 *        1
 *      /   \
 *     2     3
 *      \
 *       5
 *
 * 节点2只有右子节点，没有左子节点 ❌
 * 完全二叉树要求节点尽可能靠左
 */
// @lc code=end
