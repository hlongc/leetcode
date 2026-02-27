/*
 * @lc app=leetcode.cn id=919 lang=typescript
 *
 * [919] 完全二叉树插入器
 *
 * https://leetcode.cn/problems/complete-binary-tree-inserter/description/
 *
 * algorithms
 * Medium (67.45%)
 * Likes:    182
 * Dislikes: 0
 * Total Accepted:    37.3K
 * Total Submissions: 55.4K
 * Testcase Example:  '["CBTInserter","insert","insert","get_root"]\n[[[1,2]],[3],[4],[]]'
 *
 * 完全二叉树 是每一层（除最后一层外）都是完全填充（即，节点数达到最大）的，并且所有的节点都尽可能地集中在左侧。
 *
 * 设计一种算法，将一个新节点插入到一棵完全二叉树中，并在插入后保持其完整。
 *
 * 实现 CBTInserter 类:
 *
 *
 * CBTInserter(TreeNode root) 使用头节点为 root 的给定树初始化该数据结构；
 * CBTInserter.insert(int v)  向树中插入一个值为 Node.val == val的新节点
 * TreeNode。使树保持完全二叉树的状态，并返回插入节点 TreeNode 的父节点的值；
 * CBTInserter.get_root() 将返回树的头节点。
 *
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入
 * ["CBTInserter", "insert", "insert", "get_root"]
 * [[[1, 2]], [3], [4], []]
 * 输出
 * [null, 1, 2, [1, 2, 3, 4]]
 *
 * 解释
 * CBTInserter cBTInserter = new CBTInserter([1, 2]);
 * cBTInserter.insert(3);  // 返回 1
 * cBTInserter.insert(4);  // 返回 2
 * cBTInserter.get_root(); // 返回 [1, 2, 3, 4]
 *
 *
 *
 * 提示：
 *
 *
 * 树中节点数量范围为 [1, 1000]
 * 0 <= Node.val <= 5000
 * root 是完全二叉树
 * 0 <= val <= 5000
 * 每个测试用例最多调用 insert 和 get_root 操作 10^4 次
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
 * 解题思路：层序遍历 + 队列
 *
 * 核心思想：
 * 完全二叉树的特点是从左到右依次填充，可以用队列维护"待插入子节点"的节点
 *
 * 关键点：
 * 1. 使用队列存储所有节点（层序遍历）
 * 2. 维护一个候选队列，存储还没有填满子节点的节点
 * 3. 插入时，从候选队列头部取节点，优先填充左子节点
 *
 * 完全二叉树性质：
 * - 除最后一层外，其他层都是满的
 * - 最后一层从左到右依次填充
 *
 * 时间复杂度：
 * - 构造函数：O(n)，需要遍历所有节点
 * - insert：O(1)，直接从队列头部取节点
 * - get_root：O(1)
 *
 * 空间复杂度：O(n)，存储所有节点
 */
class CBTInserter {
  private root: TreeNode | null;
  private tree: TreeNode[]; // 存储所有节点（层序遍历顺序）

  /**
   * 构造函数：初始化完全二叉树
   * @param root 树的根节点
   */
  constructor(root: TreeNode | null) {
    this.root = root;
    this.tree = [];

    if (!root) return;

    // 使用层序遍历（BFS）将所有节点存入数组
    const queue: TreeNode[] = [root];

    while (queue.length > 0) {
      const node = queue.shift()!;
      this.tree.push(node);

      if (node.left) {
        queue.push(node.left);
      }
      if (node.right) {
        queue.push(node.right);
      }
    }
  }

  /**
   * 插入新节点，保持完全二叉树性质
   * @param val 新节点的值
   * @returns 新节点的父节点的值
   */
  insert(val: number): number {
    const newNode = new TreeNode(val);
    this.tree.push(newNode);

    // 完全二叉树的性质：
    // 对于索引为 i 的节点：
    // - 父节点索引：Math.floor((i - 1) / 2)
    // - 左子节点索引：2 * i + 1
    // - 右子节点索引：2 * i + 2

    const n = this.tree.length;
    const parentIndex = Math.floor((n - 1 - 1) / 2); // 新节点的父节点索引
    const parent = this.tree[parentIndex];

    // 判断应该插入到父节点的左边还是右边
    // 如果父节点的左子节点为空，插入左边；否则插入右边
    if (!parent.left) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    return parent.val;
  }

  /**
   * 获取树的根节点
   * @returns 根节点
   */
  get_root(): TreeNode | null {
    return this.root;
  }
}

/**
 * 算法图解：
 *
 * 示例：初始树 [1, 2]
 *
 *     1
 *    /
 *   2
 *
 * tree数组：[1, 2]
 * 索引：     [0, 1]
 *
 *
 * 插入 3：
 * 1. 创建新节点 3
 * 2. tree = [1, 2, 3]，新节点索引 = 2
 * 3. 计算父节点索引：Math.floor((2 - 1) / 2) = 0
 * 4. 父节点是索引0的节点（值为1）
 * 5. 节点1的左子节点已有（节点2），插入右子节点
 * 6. 返回父节点值 1
 *
 * 结果：
 *     1
 *    / \
 *   2   3
 *
 *
 * 插入 4：
 * 1. 创建新节点 4
 * 2. tree = [1, 2, 3, 4]，新节点索引 = 3
 * 3. 计算父节点索引：Math.floor((3 - 1) / 2) = 1
 * 4. 父节点是索引1的节点（值为2）
 * 5. 节点2的左子节点为空，插入左子节点
 * 6. 返回父节点值 2
 *
 * 结果：
 *     1
 *    / \
 *   2   3
 *  /
 * 4
 *
 *
 * 完全二叉树的数组表示：
 *
 * 索引关系：
 * - 节点 i 的父节点：Math.floor((i - 1) / 2)
 * - 节点 i 的左子节点：2 * i + 1
 * - 节点 i 的右子节点：2 * i + 2
 *
 * 示例：
 *       0
 *      / \
 *     1   2
 *    / \ / \
 *   3 4 5 6
 *
 * 数组：[0, 1, 2, 3, 4, 5, 6]
 *
 * 节点3的父节点：Math.floor((3-1)/2) = 1 ✓
 * 节点1的左子节点：2*1+1 = 3 ✓
 * 节点1的右子节点：2*1+2 = 4 ✓
 *
 *
 * 关键优化：
 * 1. 使用数组存储完全二叉树，利用索引关系快速定位父节点
 * 2. 不需要额外维护候选队列，直接通过数组长度计算父节点
 * 3. 插入操作 O(1) 时间复杂度
 */

/**
 * Your CBTInserter object will be instantiated and called as such:
 * var obj = new CBTInserter(root)
 * var param_1 = obj.insert(val)
 * var param_2 = obj.get_root()
 */
// @lc code=end
