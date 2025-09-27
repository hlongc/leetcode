/*
 * @lc app=leetcode.cn id=199 lang=typescript
 *
 * [199] 二叉树的右视图
 *
 * https://leetcode.cn/problems/binary-tree-right-side-view/description/
 *
 * algorithms
 * Medium (70.37%)
 * Likes:    1241
 * Dislikes: 0
 * Total Accepted:    693.1K
 * Total Submissions: 961.5K
 * Testcase Example:  '[1,2,3,null,5,null,4]'
 *
 * 给定一个二叉树的 根节点 root，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [1,2,3,null,5,null,4]
 *
 * 输出：[1,3,4]
 *
 * 解释：
 *
 *
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [1,2,3,4,null,null,null,5]
 *
 * 输出：[1,3,4,5]
 *
 * 解释：
 *
 *
 *
 *
 * 示例 3：
 *
 *
 * 输入：root = [1,null,3]
 *
 * 输出：[1,3]
 *
 *
 * 示例 4：
 *
 *
 * 输入：root = []
 *
 * 输出：[]
 *
 *
 *
 *
 * 提示:
 *
 *
 * 二叉树的节点个数的范围是 [0,100]
 * -100 <= Node.val <= 100
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
 * 二叉树的右视图 - DFS递归方式
 * 思路：从右侧开始DFS，每层只记录第一个访问到的节点值
 *
 * 算法步骤：
 * 1. 使用DFS遍历，优先访问右子树
 * 2. 对于每一层，只记录第一个访问到的节点值
 * 3. 由于优先访问右子树，第一个访问到的就是右视图的节点
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(h)，其中 h 是树的高度（递归调用栈的深度）
 */
function rightSideView(root: TreeNode | null): number[] {
  const result: number[] = [];
  if (!root) return result;

  /**
   * DFS递归函数：优先访问右子树，记录每层第一个访问到的节点
   * @param node 当前节点
   * @param level 当前层级
   */
  const dfs = (node: TreeNode, level: number) => {
    // 如果当前层还没有记录节点值，记录当前节点值
    if (result[level] === undefined) {
      result[level] = node.val;
    }

    // 优先访问右子树，确保右视图的正确性
    if (node.right) dfs(node.right, level + 1);
    if (node.left) dfs(node.left, level + 1);
  };

  dfs(root, 0);
  return result;
}

/**
 * 方法二：BFS迭代方式（层序遍历）
 * 思路：使用队列进行层序遍历，每层记录最后一个节点值
 *
 * 算法步骤：
 * 1. 使用队列进行层序遍历
 * 2. 对于每一层，记录最后一个节点值
 * 3. 最后一个节点就是该层右视图的节点
 *
 * 时间复杂度：O(n)，其中 n 是树中节点的总数
 * 空间复杂度：O(w)，其中 w 是树的最大宽度
 */
function rightSideViewBFS(root: TreeNode | null): number[] {
  const result: number[] = [];
  if (!root) return result;

  const queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length; // 当前层的节点数量

    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;

      // 如果是当前层的最后一个节点，记录其值
      if (i === levelSize - 1) {
        result.push(node.val);
      }

      // 将子节点加入队列
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return result;
}

/**
 * 方法三：优化的BFS实现（更简洁）
 * 思路：在每层遍历时，直接记录队列中最后一个节点
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(w)
 */
function rightSideViewOptimized(root: TreeNode | null): number[] {
  const result: number[] = [];
  if (!root) return result;

  const queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;

    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;

      // 将子节点加入队列
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    // 记录当前层最后一个节点（右视图节点）
    // 注意：此时队列中已经包含了下一层的所有节点
    // 我们需要的是当前层最后一个被处理的节点
    const lastNode = queue[queue.length - 1];
    if (lastNode) {
      result.push(lastNode.val);
    }
  }

  return result;
}

/**
 * 方法四：使用Map存储的DFS实现（另一种思路）
 * 思路：使用Map存储每层的节点值，最后按层级顺序输出
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(h)
 */
function rightSideViewMap(root: TreeNode | null): number[] {
  const levelMap = new Map<number, number>();
  if (!root) return [];

  /**
   * DFS递归函数：使用Map存储每层的节点值
   * @param node 当前节点
   * @param level 当前层级
   */
  const dfs = (node: TreeNode, level: number) => {
    // 如果当前层还没有记录，记录当前节点值
    if (!levelMap.has(level)) {
      levelMap.set(level, node.val);
    }

    // 优先访问右子树
    if (node.right) dfs(node.right, level + 1);
    if (node.left) dfs(node.left, level + 1);
  };

  dfs(root, 0);

  // 按层级顺序输出结果
  const result: number[] = [];
  for (let i = 0; i < levelMap.size; i++) {
    result.push(levelMap.get(i)!);
  }

  return result;
}
// @lc code=end
