/*
 * @lc app=leetcode.cn id=78 lang=typescript
 *
 * [78] 子集
 *
 * https://leetcode.cn/problems/subsets/description/
 *
 * algorithms
 * Medium (82.35%)
 * Likes:    2546
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 1.3M
 * Testcase Example:  '[1,2,3]'
 *
 * 给你一个整数数组 nums ，数组中的元素 互不相同 。返回该数组所有可能的子集（幂集）。
 *
 * 解集 不能 包含重复的子集。你可以按 任意顺序 返回解集。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3]
 * 输出：[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0]
 * 输出：[[],[0]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10
 * -10 <= nums[i] <= 10
 * nums 中的所有元素 互不相同
 *
 *
 */

// @lc code=start
function subsets(nums: number[]): number[][] {
  const result: number[][] = []; // 存储所有子集的结果数组
  const n = nums.length; // 数组长度

  /**
   * 深度优先搜索函数（回溯算法）
   * @param start 当前开始位置，避免重复选择
   * @param path 当前已选择的元素路径
   */
  const dfs = (start: number, path: number[]) => {
    // 将当前路径的副本加入结果集
    // 注意：必须使用 slice() 创建副本，否则所有结果都会指向同一个数组
    result.push(path.slice());

    // 从start位置开始遍历剩余元素
    for (let i = start; i < n; i++) {
      // 选择当前元素
      path.push(nums[i]);

      // 递归处理下一个位置（i+1），避免重复选择
      dfs(i + 1, path);

      // 回溯，撤销选择，为下一次选择做准备
      path.pop();
    }
  };

  // 从第0个位置开始搜索，初始路径为空数组
  dfs(0, []);

  return result;
}
// @lc code=end
