/*
 * @lc app=leetcode.cn id=513 lang=typescript
 *
 * [513] 找树左下角的值
 *
 * https://leetcode.cn/problems/find-bottom-left-tree-value/description/
 *
 * algorithms
 * Medium (73.72%)
 * Likes:    628
 * Dislikes: 0
 * Total Accepted:    306.2K
 * Total Submissions: 415.1K
 * Testcase Example:  '[2,1,3]'
 *
 * 给定一个二叉树的 根节点 root，请找出该二叉树的 最底层 最左边 节点的值。
 *
 * 假设二叉树中至少有一个节点。
 *
 *
 *
 * 示例 1:
 *
 *
 *
 *
 * 输入: root = [2,1,3]
 * 输出: 1
 *
 *
 * 示例 2:
 *
 * ⁠
 *
 *
 * 输入: [1,2,3,4,null,5,6,null,null,7]
 * 输出: 7
 *
 *
 *
 *
 * 提示:
 *
 *
 * 二叉树的节点个数的范围是 [1,10^4]
 * -2^31
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

// 方法1：DFS优化版本 - 只记录最深层的最左值
// 时间复杂度：O(n)，空间复杂度：O(h) h为树的高度
function findBottomLeftValue(root: TreeNode | null): number {
  if (!root) return 0; // 处理空节点情况

  let maxDepth = -1; // 记录最大深度
  let result = root.val; // 记录最深层最左节点的值

  const dfs = (node: TreeNode, depth: number): void => {
    // 如果当前深度大于最大深度，更新结果
    if (depth > maxDepth) {
      maxDepth = depth;
      result = node.val;
    }

    // 先遍历左子树，再遍历右子树
    // 这样确保同层最左边的节点先被访问
    if (node.left) dfs(node.left, depth + 1);
    if (node.right) dfs(node.right, depth + 1);
  };

  dfs(root, 0);
  return result;
}

// 方法2：BFS层序遍历 - 最直观的解法
// 时间复杂度：O(n)，空间复杂度：O(w) w为树的最大宽度
// 优势：思路清晰，容易理解，适合面试
function findBottomLeftValueBFS(root: TreeNode | null): number {
  if (!root) return 0;

  const queue: TreeNode[] = [root];
  let result = root.val;

  while (queue.length > 0) {
    const levelSize = queue.length;

    // 遍历当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;

      // 记录每层的第一个节点（最左边的节点）
      if (i === 0) {
        result = node.val;
      }

      // 将子节点加入队列（下一层）
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return result;
}

// 方法3：BFS优化版本 - 只记录最后一层
// 时间复杂度：O(n)，空间复杂度：O(w)
// 优势：不需要记录每层，只关注最后一层
function findBottomLeftValueBFSOptimized(root: TreeNode | null): number {
  if (!root) return 0;

  const queue: TreeNode[] = [root];
  let result = root.val;

  while (queue.length > 0) {
    const levelSize = queue.length;
    result = queue[0].val; // 记录当前层最左边的节点

    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return result;
}

// 方法4：迭代式DFS - 使用栈
// 时间复杂度：O(n)，空间复杂度：O(h)
// 优势：避免递归栈溢出，适合深度很大的树
function findBottomLeftValueIterative(root: TreeNode | null): number {
  if (!root) return 0;

  let maxDepth = -1;
  let result = root.val;

  // 栈中存储 [节点, 深度]
  const stack: [TreeNode, number][] = [[root, 0]];

  while (stack.length > 0) {
    const [node, depth] = stack.pop()!;

    // 更新最深层最左值
    if (depth > maxDepth) {
      maxDepth = depth;
      result = node.val;
    }

    // 注意：栈是后进先出，所以先压入右子树，再压入左子树
    // 这样左子树会先被处理，确保同层最左边的节点先被访问
    if (node.right) stack.push([node.right, depth + 1]);
    if (node.left) stack.push([node.left, depth + 1]);
  }

  return result;
}

// 方法5：Morris遍历 - 空间复杂度O(1)
// 时间复杂度：O(n)，空间复杂度：O(1)
// 优势：不需要额外空间，适合内存受限的场景
function findBottomLeftValueMorris(root: TreeNode | null): number {
  if (!root) return 0;

  let maxDepth = -1;
  let result = root.val;
  let current: TreeNode | null = root;
  let depth = 0;

  while (current) {
    if (!current.left) {
      // 没有左子树，直接访问当前节点
      if (depth > maxDepth) {
        maxDepth = depth;
        result = current.val;
      }
      current = current.right;
      depth++;
    } else {
      // 找到左子树的最右节点
      let predecessor: TreeNode = current.left!;
      let predDepth = depth + 1;

      while (predecessor.right && predecessor.right !== current) {
        predecessor = predecessor.right;
        predDepth++;
      }

      if (!predecessor.right) {
        // 建立线索
        predecessor.right = current;
        current = current.left;
        depth++;
      } else {
        // 断开线索
        predecessor.right = null;

        // 访问当前节点
        if (depth > maxDepth) {
          maxDepth = depth;
          result = current.val;
        }

        current = current.right;
        depth++;
      }
    }
  }

  return result;
}

// 方法6：DFS右优先遍历 - 更简洁的写法
// 时间复杂度：O(n)，空间复杂度：O(h)
// 优势：代码简洁，逻辑清晰
function findBottomLeftValueRightFirst(root: TreeNode | null): number {
  if (!root) return 0;

  let maxDepth = -1;
  let result = root.val;

  const dfs = (node: TreeNode, depth: number): void => {
    // 更新最深层最左值
    if (depth > maxDepth) {
      maxDepth = depth;
      result = node.val;
    }

    // 右子树优先遍历，这样左子树会在同层先被访问
    if (node.right) dfs(node.right, depth + 1);
    if (node.left) dfs(node.left, depth + 1);
  };

  dfs(root, 0);
  return result;
}

/*
性能对比总结：

1. DFS优化版本 (findBottomLeftValue) - 推荐
   - 时间复杂度：O(n)
   - 空间复杂度：O(h) - 递归栈空间
   - 优势：代码简洁，逻辑清晰
   - 适用：一般情况下的首选

2. BFS层序遍历 (findBottomLeftValueBFS)
   - 时间复杂度：O(n)
   - 空间复杂度：O(w) - 队列空间，w为树的最大宽度
   - 优势：思路最直观，适合面试
   - 适用：需要理解层序遍历的场景

3. BFS优化版本 (findBottomLeftValueBFSOptimized)
   - 时间复杂度：O(n)
   - 空间复杂度：O(w)
   - 优势：不需要记录每层，只关注最后一层
   - 适用：BFS思路但希望优化的场景

4. 迭代式DFS (findBottomLeftValueIterative)
   - 时间复杂度：O(n)
   - 空间复杂度：O(h) - 显式栈空间
   - 优势：避免递归栈溢出
   - 适用：树深度很大的场景

5. Morris遍历 (findBottomLeftValueMorris)
   - 时间复杂度：O(n)
   - 空间复杂度：O(1)
   - 优势：不需要额外空间
   - 适用：内存受限的场景

6. DFS右优先遍历 (findBottomLeftValueRightFirst)
   - 时间复杂度：O(n)
   - 空间复杂度：O(h)
   - 优势：代码最简洁
   - 适用：追求代码简洁的场景

实际选择建议：
- 对于LeetCode等竞赛：推荐使用DFS优化版本，代码简洁高效
- 对于面试场景：推荐使用BFS层序遍历，思路最直观
- 对于生产环境：推荐使用迭代式DFS，避免栈溢出
- 对于内存受限：推荐使用Morris遍历，空间复杂度O(1)

注意：原代码的问题：
1. 使用了不必要的数组存储每层的最左值
2. 没有处理空节点的情况
3. 空间复杂度可以进一步优化

优化后的方案都解决了这些问题，并提供了多种选择。
*/

// @lc code=end
