/*
 * @lc app=leetcode.cn id=77 lang=typescript
 *
 * [77] 组合
 *
 * https://leetcode.cn/problems/combinations/description/
 *
 * algorithms
 * Medium (77.61%)
 * Likes:    1798
 * Dislikes: 0
 * Total Accepted:    939.7K
 * Total Submissions: 1.2M
 * Testcase Example:  '4\n2'
 *
 * 给定两个整数 n 和 k，返回范围 [1, n] 中所有可能的 k 个数的组合。
 *
 * 你可以按 任何顺序 返回答案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：n = 4, k = 2
 * 输出：
 * [
 * ⁠ [2,4],
 * ⁠ [3,4],
 * ⁠ [2,3],
 * ⁠ [1,2],
 * ⁠ [1,3],
 * ⁠ [1,4],
 * ]
 *
 * 示例 2：
 *
 *
 * 输入：n = 1, k = 1
 * 输出：[[1]]
 *
 *
 *
 * 提示：
 *
 *
 * 1
 * 1
 *
 *
 */

// @lc code=start
/**
 * 组合问题 - 经典回溯算法应用
 *
 * 问题描述：给定两个整数 n 和 k，返回范围 [1, n] 中所有可能的 k 个数的组合
 *
 * 解题思路：
 * 1. 使用回溯算法逐个选择数字构建组合
 * 2. 从 start 开始选择，确保组合中数字的递增顺序，避免重复
 * 3. 当选择了 k 个数字时，将当前组合加入结果集
 * 4. 关键优化：剪枝 - 当剩余数字不够构成完整组合时提前结束
 *
 * 核心要点：
 * - 组合与排列的区别：组合不考虑顺序，[1,2] 和 [2,1] 是同一个组合
 * - 使用 start 参数确保选择的数字递增，避免重复组合
 * - 剪枝优化可以大幅提升性能
 *
 * 时间复杂度：O(C(n,k) * k) - 组合数乘以复制每个组合的时间
 * 空间复杂度：O(k) - 递归栈深度和路径数组的空间
 */
function combine(n: number, k: number): number[][] {
  const result: number[][] = [];
  const path: number[] = [];

  /**
   * 回溯函数：从指定位置开始选择数字构建组合
   * @param start 当前可选择的起始数字
   */
  function backtrack(start: number): void {
    // 递归终止条件：已经选择了 k 个数字
    if (path.length === k) {
      // 找到一个完整组合，将其副本加入结果集
      result.push([...path]);
      return;
    }

    // 剪枝优化：如果剩余的数字不足以构成完整组合，直接返回
    // 当前还需要选择 (k - path.length) 个数字
    // 从 start 到 n 共有 (n - start + 1) 个数字可选
    // 如果可选数字少于需要数字，则无法构成完整组合
    const needCount = k - path.length; // 还需要的数字个数
    const remainCount = n - start + 1; // 剩余可选的数字个数
    if (remainCount < needCount) {
      return;
    }

    // 遍历从 start 开始的所有可能数字
    for (let i = start; i <= n; i++) {
      // 做选择：将当前数字加入路径
      path.push(i);

      // 递归：继续选择下一个数字（从 i+1 开始，保证组合的递增性）
      backtrack(i + 1);

      // 撤销选择：回溯，移除当前数字
      path.pop();
    }
  }

  // 从数字 1 开始回溯
  backtrack(1);

  return result;
}

/*
算法详解和示例：

问题：combine(4, 2) - 从 [1,2,3,4] 中选择 2 个数的组合

回溯过程：
1. start=1, path=[]
   - 选择1: path=[1]
     - start=2, path=[1]
       - 选择2: path=[1,2] ✓ (长度=2，加入结果)
       - 选择3: path=[1,3] ✓ (长度=2，加入结果)  
       - 选择4: path=[1,4] ✓ (长度=2，加入结果)
   - 选择2: path=[2]
     - start=3, path=[2]
       - 选择3: path=[2,3] ✓ (长度=2，加入结果)
       - 选择4: path=[2,4] ✓ (长度=2，加入结果)
   - 选择3: path=[3]
     - start=4, path=[3]
       - 选择4: path=[3,4] ✓ (长度=2，加入结果)
   - 选择4: path=[4]
     - start=5 > n=4，剪枝（剩余0个数字，需要1个数字）

结果: [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]

剪枝优化的作用：
- 当 path=[4] 时，需要再选择 1 个数字
- 但从位置 5 开始已经没有数字可选
- 提前判断 remainCount < needCount，直接返回
- 避免了无意义的递归调用

为什么使用 start 参数：
- 确保组合中数字的递增顺序
- 避免重复组合（如 [1,2] 和 [2,1]）
- start 参数让我们只考虑当前数字之后的数字
*/
// @lc code=end
