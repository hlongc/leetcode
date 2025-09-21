/*
 * @lc app=leetcode.cn id=39 lang=typescript
 *
 * [39] 组合总和
 *
 * https://leetcode.cn/problems/combination-sum/description/
 *
 * algorithms
 * Medium (73.75%)
 * Likes:    3085
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 1.7M
 * Testcase Example:  '[2,3,6,7]\n7'
 *
 * 给你一个 无重复元素 的整数数组 candidates 和一个目标整数 target ，找出 candidates 中可以使数字和为目标数 target
 * 的 所有 不同组合 ，并以列表形式返回。你可以按 任意顺序 返回这些组合。
 *
 * candidates 中的 同一个 数字可以 无限制重复被选取 。如果至少一个数字的被选数量不同，则两种组合是不同的。
 *
 * 对于给定的输入，保证和为 target 的不同组合数少于 150 个。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：candidates = [2,3,6,7], target = 7
 * 输出：[[2,2,3],[7]]
 * 解释：
 * 2 和 3 可以形成一组候选，2 + 2 + 3 = 7 。注意 2 可以使用多次。
 * 7 也是一个候选， 7 = 7 。
 * 仅有这两种组合。
 *
 * 示例 2：
 *
 *
 * 输入: candidates = [2,3,5], target = 8
 * 输出: [[2,2,2,2],[2,3,3],[3,5]]
 *
 * 示例 3：
 *
 *
 * 输入: candidates = [2], target = 1
 * 输出: []
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= candidates.length <= 30
 * 2 <= candidates[i] <= 40
 * candidates 的所有元素 互不相同
 * 1 <= target <= 40
 *
 *
 */

// @lc code=start
/**
 * 组合总和 - 找出所有可以使数字和为目标数的不同组合
 * 使用回溯算法，通过深度优先搜索生成所有可能的组合
 *
 * 时间复杂度: O(2^target) - 最坏情况下需要遍历所有可能的组合
 * 空间复杂度: O(target) - 递归调用栈的深度最多为target（当所有元素都是1时）
 *
 * @param candidates 候选数字数组（无重复元素）
 * @param target 目标数字
 * @returns 所有使数字和为目标数的不同组合
 */
function combinationSum(candidates: number[], target: number): number[][] {
  const result: number[][] = [];

  // 排序数组以便进行剪枝优化
  // 排序后，如果当前数字已经大于目标值，后续更大的数字也必然大于目标值
  candidates.sort((a, b) => a - b);

  /**
   * 深度优先搜索生成组合
   *
   * @param startIndex 当前搜索的起始索引（避免重复组合）
   * @param currentPath 当前路径（当前组合）
   * @param currentSum 当前路径的数字和
   */
  const backtrack = (
    startIndex: number,
    currentPath: number[],
    currentSum: number
  ): void => {
    // 遍历从startIndex开始的所有候选数字
    for (let i = startIndex; i < candidates.length; i++) {
      const currentNum = candidates[i];
      const newSum = currentSum + currentNum;

      // 剪枝：如果当前数字加上已有和超过目标值，直接返回
      // 由于数组已排序，后续数字只会更大，无需继续搜索
      if (newSum > target) {
        return;
      }

      // 找到目标组合：当前和等于目标值
      if (newSum === target) {
        // 将当前路径的副本添加到结果中
        // 使用slice()创建副本，避免引用问题
        result.push([...currentPath, currentNum]);
        return; // 找到目标后可以直接返回，因为后续数字只会更大
      }

      // 当前和小于目标值，继续搜索
      // 添加当前数字到路径中
      currentPath.push(currentNum);

      // 递归搜索：从当前索引开始（允许重复使用同一个数字）
      // 注意：这里传递的是i而不是i+1，因为可以重复使用同一个数字
      backtrack(i, currentPath, newSum);

      // 回溯：移除最后添加的数字，尝试其他可能性
      currentPath.pop();
    }
  };

  // 从索引0开始搜索，初始路径为空，初始和为0
  backtrack(0, [], 0);

  return result;
}
// @lc code=end
