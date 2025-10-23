/*
 * @lc app=leetcode.cn id=1027 lang=typescript
 *
 * [1027] 最长等差数列
 *
 * https://leetcode.cn/problems/longest-arithmetic-subsequence/description/
 *
 * algorithms
 * Medium (50.92%)
 * Likes:    414
 * Dislikes: 0
 * Total Accepted:    61.3K
 * Total Submissions: 120.3K
 * Testcase Example:  '[3,6,9,12]'
 *
 * 给你一个整数数组 nums，返回 nums 中最长等差子序列的长度。
 *
 * 回想一下，nums 的子序列是一个列表 nums[i1], nums[i2], ..., nums[ik] ，且 0 <= i1 < i2 < ...
 * < ik <= nums.length - 1。并且如果 seq[i+1] - seq[i]( 0 <= i < seq.length - 1)
 * 的值都相同，那么序列 seq 是等差的。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,6,9,12]
 * 输出：4
 * 解释：
 * 整个数组是公差为 3 的等差数列。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [9,4,7,2,10]
 * 输出：3
 * 解释：
 * 最长的等差子序列是 [4,7,10]。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [20,1,15,3,10,5,8]
 * 输出：4
 * 解释：
 * 最长的等差子序列是 [20,15,10,5]。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 2 <= nums.length <= 1000
 * 0 <= nums[i] <= 500
 *
 *
 */

// @lc code=start
/**
 * 解题思路：动态规划 + 哈希表
 *
 * 问题分析：
 * - 子序列：元素可以不连续，但必须保持相对顺序
 * - 等差数列：相邻元素的差值相同
 * - 目标：找出最长的等差子序列
 *
 * 核心思想：
 * - dp[i] 是一个 Map，存储以 nums[i] 结尾的不同公差对应的最长等差序列长度
 * - dp[i].get(diff) 表示以 nums[i] 结尾、公差为 diff 的等差序列的最长长度
 *
 * 状态转移：
 * 对于每个位置 i，遍历之前所有位置 j (j < i)：
 * 1. 计算公差：diff = nums[i] - nums[j]
 * 2. 如果 dp[j] 中存在公差 diff 的序列：
 *    dp[i][diff] = dp[j][diff] + 1  （扩展已有序列）
 * 3. 否则：
 *    dp[i][diff] = 2  （nums[j] 和 nums[i] 组成新序列）
 *
 * 示例：[9,4,7,2,10]
 * - i=1(4): dp[1] = {-5: 2}  // [9,4]
 * - i=2(7): dp[2] = {-2: 2, 3: 2}  // [9,7], [4,7]
 * - i=3(2): dp[3] = {-7: 2, -2: 2, -5: 2}  // [9,2], [4,2], [7,2]
 * - i=4(10): dp[4] = {1: 2, 6: 2, 3: 3, 8: 2}  // [9,10], [4,10], [4,7,10]←最长, [2,10]
 *
 * 时间复杂度：O(n²)，双层循环遍历所有数对
 * 空间复杂度：O(n²)，最坏情况下每对数字都有不同的公差
 */
function longestArithSeqLength(nums: number[]): number {
  const n = nums.length;

  // 边界情况：数组长度小于2
  if (n < 2) return n;

  // dp[i] 存储以 nums[i] 结尾的不同公差对应的最长长度
  // key: 公差, value: 该公差下的最长等差序列长度
  const dp: Array<Map<number, number>> = [];

  // 初始化每个位置的 Map
  for (let i = 0; i < n; i++) {
    dp[i] = new Map();
  }

  // 记录全局最长等差序列长度
  let maxLength = 2; // 至少有两个元素可以组成等差序列

  // 从第二个元素开始遍历
  for (let i = 1; i < n; i++) {
    // 遍历 i 之前的所有元素
    for (let j = 0; j < i; j++) {
      // 计算公差
      const diff = nums[i] - nums[j];

      // 获取以 nums[j] 结尾、公差为 diff 的序列长度
      // 如果存在，说明可以扩展；否则，nums[j] 和 nums[i] 组成长度为 2 的新序列
      const prevLength = dp[j].get(diff) || 1;

      // 状态转移：当前长度 = 之前长度 + 1
      const currentLength = prevLength + 1;

      // 更新 dp[i] 中公差为 diff 的最长长度
      dp[i].set(diff, currentLength);

      // 更新全局最大值
      maxLength = Math.max(maxLength, currentLength);
    }
  }

  return maxLength;
}
// @lc code=end
