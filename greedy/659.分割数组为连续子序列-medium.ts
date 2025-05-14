/*
 * @lc app=leetcode.cn id=659 lang=typescript
 *
 * [659] 分割数组为连续子序列
 *
 * https://leetcode.cn/problems/split-array-into-consecutive-subsequences/description/
 *
 * algorithms
 * Medium (55.56%)
 * Likes:    482
 * Dislikes: 0
 * Total Accepted:    41.1K
 * Total Submissions: 73.9K
 * Testcase Example:  '[1,2,3,3,4,5]'
 *
 * 给你一个按 非递减顺序 排列的整数数组 nums 。
 *
 * 请你判断是否能在将 nums 分割成 一个或多个子序列 的同时满足下述 两个 条件：
 *
 *
 *
 *
 * 每个子序列都是一个 连续递增序列（即，每个整数 恰好 比前一个整数大 1 ）。
 * 所有子序列的长度 至少 为 3 。
 *
 *
 * 如果可以分割 nums 并满足上述条件，则返回 true ；否则，返回 false 。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3,3,4,5]
 * 输出：true
 * 解释：nums 可以分割成以下子序列：
 * [1,2,3,3,4,5] --> 1, 2, 3
 * [1,2,3,3,4,5] --> 3, 4, 5
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3,3,4,4,5,5]
 * 输出：true
 * 解释：nums 可以分割成以下子序列：
 * [1,2,3,3,4,4,5,5] --> 1, 2, 3, 4, 5
 * [1,2,3,3,4,4,5,5] --> 3, 4, 5
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1,2,3,4,4,5]
 * 输出：false
 * 解释：无法将 nums 分割成长度至少为 3 的连续递增子序列。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^4
 * -1000 <= nums[i] <= 1000
 * nums 按非递减顺序排列
 *
 *
 */

// @lc code=start
/**
 * 判断数组是否可以分割成若干个长度至少为3的连续递增子序列
 *
 * 贪心算法思路：
 * 1. 对于当前数字x，我们有两种选择：
 *    - 将x加入到现有的某个子序列的末尾
 *    - 以x开始一个新的子序列(如果后面有x+1和x+2)
 *
 * 2. 贪心策略：优先将数字加入到现有子序列，而不是开始新的子序列
 *    - 这是因为开始新子序列需要额外的后续数字(至少2个)
 *    - 而加入现有子序列只需要当前数字匹配
 *
 * 实现方法：
 * 1. 使用frequency哈希表统计每个数字的出现次数
 * 2. 使用tails哈希表记录以某个数字结尾的子序列数量
 * 3. 对数组中每个数字x：
 *    - 如果没有剩余的x，跳过
 *    - 如果有以x-1结尾的子序列，将x加入其中
 *    - 否则，检查是否可以开始新的子序列(需要有x+1和x+2)
 *    - 如果都不满足，返回false
 *
 * @param nums 非递减顺序排列的整数数组
 * @returns 是否可以分割成满足条件的子序列
 */
function isPossible(nums: number[]): boolean {
  // 边界情况：数组长度小于3，无法构成符合条件的子序列
  if (nums.length < 3) {
    return false;
  }

  // 统计每个数字的出现次数
  const frequency: Map<number, number> = new Map();
  for (const num of nums) {
    frequency.set(num, (frequency.get(num) || 0) + 1);
  }

  // 记录以某个数字结尾的子序列数量
  const tails: Map<number, number> = new Map();

  // 遍历数组中的每个数字
  for (const num of nums) {
    // 如果当前数字已经用完，跳过
    if (frequency.get(num) === 0) {
      continue;
    }

    // 尝试将当前数字加入到现有子序列的末尾
    if ((tails.get(num - 1) || 0) > 0) {
      // 减少可用的当前数字
      frequency.set(num, frequency.get(num)! - 1);

      // 减少以num-1结尾的子序列数量
      tails.set(num - 1, tails.get(num - 1)! - 1);

      // 增加以num结尾的子序列数量
      tails.set(num, (tails.get(num) || 0) + 1);
    }
    // 尝试使用当前数字开始一个新的子序列(需要有num+1和num+2)
    else if (
      (frequency.get(num + 1) || 0) > 0 &&
      (frequency.get(num + 2) || 0) > 0
    ) {
      // 减少可用的当前数字和后续两个数字
      frequency.set(num, frequency.get(num)! - 1);
      frequency.set(num + 1, frequency.get(num + 1)! - 1);
      frequency.set(num + 2, frequency.get(num + 2)! - 1);

      // 增加以num+2结尾的子序列数量
      tails.set(num + 2, (tails.get(num + 2) || 0) + 1);
    }
    // 无法处理当前数字，返回false
    else {
      return false;
    }
  }

  // 如果所有数字都能处理完，返回true
  return true;
}
// @lc code=end
