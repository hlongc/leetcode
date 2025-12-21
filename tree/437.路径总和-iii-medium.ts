/*
 * @lc app=leetcode.cn id=437 lang=typescript
 *
 * [437] 路径总和 III
 *
 * https://leetcode.cn/problems/path-sum-iii/description/
 *
 * algorithms
 * Medium (48.26%)
 * Likes:    2185
 * Dislikes: 0
 * Total Accepted:    535.6K
 * Total Submissions: 1.1M
 * Testcase Example:  '[10,5,-3,3,2,null,11,3,-2,null,1]\n8'
 *
 * 给定一个二叉树的根节点 root ，和一个整数 targetSum ，求该二叉树里节点值之和等于 targetSum 的 路径 的数目。
 *
 * 路径 不需要从根节点开始，也不需要在叶子节点结束，但是路径方向必须是向下的（只能从父节点到子节点）。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：root = [10,5,-3,3,2,null,11,3,-2,null,1], targetSum = 8
 * 输出：3
 * 解释：和等于 8 的路径有 3 条，如图所示。
 *
 *
 * 示例 2：
 *
 *
 * 输入：root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22
 * 输出：3
 *
 *
 *
 *
 * 提示:
 *
 *
 * 二叉树的节点个数的范围是 [0,1000]
 * -10^9
 * -1000
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
 * 路径总和 III - 前缀和 + 哈希表优化解法（推荐）
 *
 * 核心思路：
 * 1. 路径可以从任意节点开始，到任意节点结束，但必须向下
 * 2. 使用前缀和的思想：prefixSum[i] - prefixSum[j] = targetSum
 *    即：如果当前路径和 - 之前某个路径和 = targetSum，则中间这段路径符合要求
 * 3. 使用哈希表记录从根节点到当前节点路径上，各个前缀和出现的次数
 *
 * 前缀和原理：
 * 假设从根节点到当前节点的路径和为 currSum
 * 如果存在之前的某个节点，其路径和为 currSum - targetSum
 * 那么从那个节点到当前节点的路径和就是 targetSum
 *
 * 图解示例：
 *        10
 *       /  \
 *      5   -3
 *     / \    \
 *    3   2   11
 *   / \   \
 *  3  -2   1
 *
 * targetSum = 8
 *
 * 以路径 10 -> 5 -> 3 为例：
 * - 访问10: currSum=10, map={0:1, 10:1}
 * - 访问5:  currSum=15, map={0:1, 10:1, 15:1}
 * - 访问3:  currSum=18, map={0:1, 10:1, 15:1, 18:1}
 *   查找 18-8=10 是否在map中？是的，次数为1，说明找到1条路径(5->3)
 *
 * 时间复杂度：O(n)，每个节点访问一次
 * 空间复杂度：O(n)，哈希表和递归栈的空间
 */
function pathSum(root: TreeNode | null, targetSum: number): number {
  // 哈希表：key是前缀和，value是该前缀和出现的次数
  const prefixSumCount = new Map<number, number>();

  // 初始化：前缀和为0的情况出现1次（表示从根节点开始的路径）
  // 这个很重要！处理从根节点开始就满足条件的路径
  prefixSumCount.set(0, 1);

  /**
   * DFS遍历二叉树，统计路径数量
   * @param node 当前节点
   * @param currSum 从根节点到当前节点的路径和（前缀和）
   * @returns 以当前节点为终点的满足条件的路径数量
   */
  function dfs(node: TreeNode | null, currSum: number): number {
    // 递归终止条件
    if (!node) return 0;

    // 更新当前路径和
    currSum += node.val;

    // 查找是否存在前缀和 = currSum - targetSum
    // 如果存在，说明从那个前缀和的位置到当前节点的路径和 = targetSum
    const targetPrefixSum = currSum - targetSum;
    let pathCount = prefixSumCount.get(targetPrefixSum) || 0;

    // 将当前路径和加入哈希表（或更新次数）
    prefixSumCount.set(currSum, (prefixSumCount.get(currSum) || 0) + 1);

    // 递归遍历左右子树
    pathCount += dfs(node.left, currSum);
    pathCount += dfs(node.right, currSum);

    // ⭐⭐⭐ 回溯：移除当前节点的路径和（因为要返回上一层了）
    // 这一步很关键！确保不会影响其他分支的计算
    //
    // 【为什么需要回溯？】
    // 因为哈希表中应该只保存"从根节点到当前节点路径上"的前缀和
    // 遍历完一个分支后，要回到父节点继续遍历其他分支
    // 如果不移除，左子树的前缀和会错误地影响右子树的计算
    //
    // 【详细图解 - 为什么必须回溯】
    //
    // 假设有这样的树：
    //         10
    //        /  \
    //       5   -5
    //      /     \
    //     3       2
    //
    // targetSum = 8
    //
    // ❌ 如果不回溯（错误做法）：
    //
    // 1. 访问10: currSum=10, map={0:1, 10:1}
    //
    // 2. 访问5:  currSum=15, map={0:1, 10:1, 15:1}
    //
    // 3. 访问3:  currSum=18, map={0:1, 10:1, 15:1, 18:1}
    //    - 查找18-8=10，找到了！计数+1
    //    - 但这里如果不回溯，返回到节点5后，map仍然是{0:1, 10:1, 15:1, 18:1}
    //
    // 4. 返回到节点5，然后返回到节点10
    //    - 如果没有回溯，map还是{0:1, 10:1, 15:1, 18:1}
    //
    // 5. 访问-5: currSum=5, map={0:1, 10:1, 15:1, 18:1, 5:1}
    //
    // 6. 访问2:  currSum=7, map={0:1, 10:1, 15:1, 18:1, 5:1, 7:1}
    //    - 查找7-8=-1，没找到，正确
    //
    // ⚠️ 问题在于：map中的15和18来自左子树，但右子树访问时还能看到它们
    // 这违反了"路径必须是连续的从上到下"的要求！
    //
    // ✅ 如果正确回溯：
    //
    // 1. 访问10: currSum=10, map={0:1, 10:1}
    //
    // 2. 访问5:  currSum=15, map={0:1, 10:1, 15:1}
    //
    // 3. 访问3:  currSum=18, map={0:1, 10:1, 15:1, 18:1}
    //    - 查找18-8=10，找到了！计数+1
    //    - 回溯：map变为{0:1, 10:1, 15:1, 18:0} → 移除18
    //
    // 4. 返回到节点5
    //    - 回溯：map变为{0:1, 10:1, 15:0} → 移除15
    //
    // 5. 返回到节点10，访问-5: currSum=5
    //    - map现在是{0:1, 10:1, 5:1}  ← 左子树的15和18已经被清除了！
    //
    // 6. 访问2: currSum=7, map={0:1, 10:1, 5:1, 7:1}
    //    - 这样就保证了map中只有当前路径上的前缀和
    //
    // 【更直观的理解】
    //
    // 把DFS想象成爬山：
    // - 爬到山顶时，记录下这条路径上的所有海拔信息（前缀和）
    // - 下山回到分叉口时，必须"忘记"刚才那条路的海拔信息
    // - 否则走另一条路时，会误以为两条路是连通的
    //
    // 【树的结构特点】
    //
    // 树的左右子树是两个独立的分支：
    //       父
    //      /  \
    //    左子树 右子树
    //     ↑     ↑
    //   独立的  独立的
    //
    // 路径的定义：从上到下的连续节点
    // ✅ 有效路径：父→左子树中的某条路径
    // ✅ 有效路径：父→右子树中的某条路径
    // ❌ 无效路径：左子树→父→右子树（不能从左跳到右）
    //
    // 因此，遍历完左子树后，必须清除左子树的痕迹，
    // 才能确保右子树的计算不受影响
    //
    prefixSumCount.set(currSum, prefixSumCount.get(currSum)! - 1);

    return pathCount;
  }

  return dfs(root, 0);
}

/**
 * 解法二：暴力双重递归（朴素解法）
 *
 * 思路：
 * 1. 对每个节点，都尝试从该节点开始向下查找路径
 * 2. 外层递归：遍历每个节点
 * 3. 内层递归：从当前节点开始，向下查找所有可能的路径
 *
 * 时间复杂度：O(n²)，最坏情况下是链表结构
 * 空间复杂度：O(n)，递归栈深度
 */
function pathSumBruteForce(root: TreeNode | null, targetSum: number): number {
  if (!root) return 0;

  // 三部分的路径数量：
  // 1. 从当前节点开始的路径
  // 2. 在左子树中的路径（不包括当前节点）
  // 3. 在右子树中的路径（不包括当前节点）
  return (
    countPathsFromNode(root, targetSum) +
    pathSumBruteForce(root.left, targetSum) +
    pathSumBruteForce(root.right, targetSum)
  );
}

/**
 * 辅助函数：统计从指定节点开始向下的路径数量
 * @param node 起始节点
 * @param remainingSum 剩余需要凑齐的和
 * @returns 从该节点开始的满足条件的路径数量
 */
function countPathsFromNode(
  node: TreeNode | null,
  remainingSum: number
): number {
  if (!node) return 0;

  // 当前节点是否能凑成目标和
  let count = node.val === remainingSum ? 1 : 0;

  // 继续向左右子树查找（更新剩余和）
  count += countPathsFromNode(node.left, remainingSum - node.val);
  count += countPathsFromNode(node.right, remainingSum - node.val);

  return count;
}

/**
 * 详细图解 - 前缀和解法的执行过程：
 *
 * 树结构：
 *        10
 *       /  \
 *      5   -3
 *     / \    \
 *    3   2   11
 *   / \   \
 *  3  -2   1
 *
 * targetSum = 8
 *
 * DFS遍历过程（前序遍历）：
 *
 * 节点10: currSum=10
 *   查找 10-8=2 在map中? 无
 *   map = {0:1, 10:1}
 *   路径数 = 0
 *
 * 节点5: currSum=15
 *   查找 15-8=7 在map中? 无
 *   map = {0:1, 10:1, 15:1}
 *   路径数 = 0
 *
 * 节点3: currSum=18
 *   查找 18-8=10 在map中? 有，次数=1
 *   路径数 = 1  (路径: 5->3)
 *   map = {0:1, 10:1, 15:1, 18:1}
 *
 * 节点3(左): currSum=21
 *   查找 21-8=13 在map中? 无
 *   map = {0:1, 10:1, 15:1, 18:1, 21:1}
 *   路径数 = 0
 *   回溯后 map = {0:1, 10:1, 15:1, 18:1}
 *
 * 节点-2(右): currSum=16
 *   查找 16-8=8 在map中? 无
 *   路径数 = 0
 *   回溯后 map = {0:1, 10:1, 15:1, 18:1}
 *
 * ...继续遍历其他节点...
 *
 * 最终找到3条路径：
 * 1. 5 -> 3 (和=8)
 * 2. 5 -> 2 -> 1 (和=8)
 * 3. -3 -> 11 (和=8)
 */

/**
 * 知识点总结：
 *
 * 1. 前缀和技巧：
 *    - 适用于连续子数组/路径和问题
 *    - 核心公式：sum(i, j) = prefixSum[j] - prefixSum[i-1]
 *    - 转化为：prefixSum[j] - targetSum 是否存在于之前的前缀和中
 *
 * 2. 哈希表的作用：
 *    - 快速查找某个前缀和是否出现过（O(1)时间）
 *    - 记录每个前缀和出现的次数（处理重复的情况）
 *
 * 3. 回溯的重要性：
 *    - DFS遍历完一个分支后，要移除该分支的影响
 *    - 确保左右子树的计算相互独立
 *    - 画图理解：走过左子树后，要回到父节点，再走右子树
 *
 * 4. 初始化 prefixSumCount.set(0, 1) 的意义：
 *    - 处理从根节点开始就满足条件的路径
 *    - 例如：根节点值就是targetSum的情况
 *
 * 5. 类似题目：
 *    - LeetCode 560: 和为K的子数组（一维数组版本）
 *    - LeetCode 112: 路径总和（简单版本，只判断是否存在）
 *    - LeetCode 113: 路径总和 II（返回所有路径）
 *
 * 6. 时间复杂度对比：
 *    - 暴力解法：O(n²)，每个节点都要向下遍历
 *    - 前缀和优化：O(n)，每个节点只访问一次
 */

/**
 * 测试用例分析：
 *
 * 示例1：
 * 输入：root = [10,5,-3,3,2,null,11,3,-2,null,1], targetSum = 8
 * 输出：3
 *
 * 三条路径：
 * 1. 5 -> 3
 * 2. 5 -> 2 -> 1
 * 3. -3 -> 11
 *
 * 示例2：
 * 输入：root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22
 * 输出：3
 *
 * 三条路径：
 * 1. 5 -> 4 -> 11 -> 2
 * 2. 5 -> 8 -> 4 -> 5
 * 3. 4 -> 11 -> 7
 */
// @lc code=end
