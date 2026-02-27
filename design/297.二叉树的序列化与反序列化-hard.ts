/*
 * @lc app=leetcode.cn id=297 lang=typescript
 *
 * [297] 二叉树的序列化与反序列化
 *
 * https://leetcode.cn/problems/serialize-and-deserialize-binary-tree/description/
 *
 * algorithms
 * Hard (59.98%)
 * Likes:    1309
 * Dislikes: 0
 * Total Accepted:    274.1K
 * Total Submissions: 457K
 * Testcase Example:  '[1,2,3,null,null,4,5]'
 *
 *
 * 序列化是将一个数据结构或者对象转换为连续的比特位的操作，进而可以将转换后的数据存储在一个文件或者内存中，同时也可以通过网络传输到另一个计算机环境，采取相反方式重构得到原数据。
 *
 * 请设计一个算法来实现二叉树的序列化与反序列化。这里不限定你的序列 /
 * 反序列化算法执行逻辑，你只需要保证一个二叉树可以被序列化为一个字符串并且将这个字符串反序列化为原始的树结构。
 *
 * 提示: 输入输出格式与 LeetCode 目前使用的方式一致，详情请参阅 LeetCode
 * 序列化二叉树的格式。你并非必须采取这种方式，你也可以采用其他的方法解决这个问题。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：root = [1,2,3,null,null,4,5]
 * 输出：[1,2,3,null,null,4,5]
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = []
 * 输出：[]
 *
 *
 * 示例 3：
 *
 *
 * 输入：root = [1]
 * 输出：[1]
 *
 *
 * 示例 4：
 *
 *
 * 输入：root = [1,2]
 * 输出：[1,2]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 树中结点数在范围 [0, 10^4] 内
 * -1000 <= Node.val <= 1000
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
 * 解题思路：前序遍历 + 递归
 *
 * 核心思想：
 * 使用前序遍历（根→左→右）序列化和反序列化二叉树
 *
 * 序列化：
 * - 前序遍历树，将节点值转为字符串
 * - 空节点用特殊标记（如"null"）表示
 * - 用分隔符（如","）连接各节点
 *
 * 反序列化：
 * - 按分隔符拆分字符串
 * - 按前序遍历顺序重建树
 * - 遇到"null"标记返回null
 *
 * 为什么用前序遍历？
 * 前序遍历先访问根节点，便于重建时确定根节点位置
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */

/*
 * Encodes a tree to a single string.
 *
 * 序列化：将二叉树转换为字符串
 *
 * 算法流程：
 * 1. 使用前序遍历（根→左→右）
 * 2. 遇到空节点记录"null"
 * 3. 用逗号分隔各节点值
 *
 * 示例：
 *     1
 *    / \
 *   2   3
 *      / \
 *     4   5
 *
 * 前序遍历：1, 2, null, null, 3, 4, null, null, 5, null, null
 * 序列化结果："1,2,null,null,3,4,null,null,5,null,null"
 */
function serialize(root: TreeNode | null): string {
  // 空树返回空字符串
  if (!root) {
    return "null";
  }

  const result: string[] = [];

  /**
   * 前序遍历辅助函数
   * @param node 当前节点
   */
  function preorder(node: TreeNode | null): void {
    // 空节点记录"null"
    if (!node) {
      result.push("null");
      return;
    }

    // 前序遍历：根→左→右
    result.push(String(node.val)); // 访问根节点
    preorder(node.left); // 遍历左子树
    preorder(node.right); // 遍历右子树
  }

  preorder(root);

  // 用逗号连接所有节点值
  return result.join(",");
}

/*
 * Decodes your encoded data to tree.
 *
 * 反序列化：将字符串转换回二叉树
 *
 * 算法流程：
 * 1. 按逗号拆分字符串
 * 2. 按前序遍历顺序重建树
 * 3. 遇到"null"返回null
 * 4. 递归构建左右子树
 *
 * 关键：使用索引指针追踪当前处理的节点
 */
function deserialize(data: string): TreeNode | null {
  // 空字符串返回null
  if (!data || data === "null") {
    return null;
  }

  // 按逗号拆分字符串
  const values = data.split(",");
  let index = 0; // 当前处理的节点索引

  /**
   * 前序遍历重建树
   * @returns 重建的节点
   */
  function buildTree(): TreeNode | null {
    // 越界检查
    if (index >= values.length) {
      return null;
    }

    // 获取当前节点值
    const val = values[index++];

    // 遇到"null"标记，返回null
    if (val === "null") {
      return null;
    }

    // 创建当前节点
    const node = new TreeNode(Number(val));

    // 前序遍历：先构建左子树，再构建右子树
    node.left = buildTree(); // 递归构建左子树
    node.right = buildTree(); // 递归构建右子树

    return node;
  }

  return buildTree();
}

/**
 * 算法图解：
 *
 * 示例：
 *     1
 *    / \
 *   2   3
 *      / \
 *     4   5
 *
 * 序列化过程（前序遍历）：
 *
 * 1. 访问节点1 → "1"
 * 2. 访问节点2 → "1,2"
 * 3. 节点2的左子树为空 → "1,2,null"
 * 4. 节点2的右子树为空 → "1,2,null,null"
 * 5. 访问节点3 → "1,2,null,null,3"
 * 6. 访问节点4 → "1,2,null,null,3,4"
 * 7. 节点4的左子树为空 → "1,2,null,null,3,4,null"
 * 8. 节点4的右子树为空 → "1,2,null,null,3,4,null,null"
 * 9. 访问节点5 → "1,2,null,null,3,4,null,null,5"
 * 10. 节点5的左子树为空 → "1,2,null,null,3,4,null,null,5,null"
 * 11. 节点5的右子树为空 → "1,2,null,null,3,4,null,null,5,null,null"
 *
 * 最终结果："1,2,null,null,3,4,null,null,5,null,null"
 *
 *
 * 反序列化过程：
 *
 * 数组：["1","2","null","null","3","4","null","null","5","null","null"]
 * 索引：  0   1     2      3     4   5     6      7     8     9      10
 *
 * 1. index=0, val="1" → 创建节点1
 * 2. 构建左子树：
 *    - index=1, val="2" → 创建节点2
 *    - 构建节点2的左子树：index=2, val="null" → null
 *    - 构建节点2的右子树：index=3, val="null" → null
 * 3. 构建右子树：
 *    - index=4, val="3" → 创建节点3
 *    - 构建节点3的左子树：
 *      - index=5, val="4" → 创建节点4
 *      - index=6, val="null" → null
 *      - index=7, val="null" → null
 *    - 构建节点3的右子树：
 *      - index=8, val="5" → 创建节点5
 *      - index=9, val="null" → null
 *      - index=10, val="null" → null
 *
 * 重建完成！
 *
 *
 * 关键点：
 * 1. 序列化和反序列化使用相同的遍历顺序（前序）
 * 2. 必须记录空节点，否则无法确定树的结构
 * 3. 使用索引指针追踪当前处理位置
 * 4. 递归构建左右子树
 *
 *
 * 为什么必须记录空节点？
 *
 * 如果不记录空节点：
 * 树1:  1        树2:    1
 *      /                  \
 *     2                    2
 *
 * 都会序列化为 "1,2"，无法区分！
 *
 * 记录空节点后：
 * 树1: "1,2,null,null,null"
 * 树2: "1,null,2,null,null"
 * 可以正确区分！
 */

/**
 * Your functions will be called as such:
 * deserialize(serialize(root));
 */
// @lc code=end
