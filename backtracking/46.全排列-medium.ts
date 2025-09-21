/*
 * @lc app=leetcode.cn id=46 lang=typescript
 *
 * [46] 全排列
 *
 * https://leetcode.cn/problems/permutations/description/
 *
 * algorithms
 * Medium (80.31%)
 * Likes:    3177
 * Dislikes: 0
 * Total Accepted:    1.5M
 * Total Submissions: 1.8M
 * Testcase Example:  '[1,2,3]'
 *
 * 给定一个不含重复数字的数组 nums ，返回其 所有可能的全排列 。你可以 按任意顺序 返回答案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3]
 * 输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0,1]
 * 输出：[[0,1],[1,0]]
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1]
 * 输出：[[1]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 6
 * -10 <= nums[i] <= 10
 * nums 中的所有整数 互不相同
 *
 *
 */

// @lc code=start
/**
 * 全排列 - 生成数组的所有可能排列
 * 使用回溯算法，通过深度优先搜索生成所有可能的排列
 *
 * 时间复杂度: O(n! * n) - 有n!个排列，每个排列需要O(n)时间复制
 * 空间复杂度: O(n) - 递归调用栈的深度为n，used数组空间为n
 *
 * @param nums 不含重复数字的数组
 * @returns 所有可能的全排列
 */
function permute(nums: number[]): number[][] {
  const result: number[][] = [];

  // 标记数组，记录哪些数字已经被使用
  // used[i] = true 表示 nums[i] 已经在当前路径中
  const used: boolean[] = new Array(nums.length).fill(false);

  /**
   * 回溯函数生成排列
   *
   * @param currentPath 当前路径（当前正在构建的排列）
   */
  const backtrack = (currentPath: number[]): void => {
    // 基准情况：当前路径长度等于原数组长度，找到一个完整排列
    if (currentPath.length === nums.length) {
      // 将当前路径的副本添加到结果中
      // 使用slice()创建副本，避免引用问题
      result.push([...currentPath]);
      return;
    }

    // 遍历所有数字，寻找下一个可以使用的数字
    for (let i = 0; i < nums.length; i++) {
      // 如果当前数字还没有被使用
      if (!used[i]) {
        // 标记当前数字为已使用
        used[i] = true;

        // 将当前数字添加到路径中
        currentPath.push(nums[i]);

        // 递归搜索：继续构建排列
        backtrack(currentPath);

        // 回溯：恢复状态，尝试其他可能性
        // 1. 从路径中移除最后添加的数字
        currentPath.pop();
        // 2. 标记当前数字为未使用
        used[i] = false;
      }
    }
  };

  // 从空路径开始构建所有排列
  backtrack([]);

  return result;
}
// @lc code=end
