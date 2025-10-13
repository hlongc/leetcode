/*
 * @lc app=leetcode.cn id=560 lang=typescript
 *
 * [560] 和为 K 的子数组
 *
 * https://leetcode.cn/problems/subarray-sum-equals-k/description/
 *
 * algorithms
 * Medium (45.50%)
 * Likes:    2898
 * Dislikes: 0
 * Total Accepted:    866.6K
 * Total Submissions: 1.9M
 * Testcase Example:  '[1,1,1]\n2'
 *
 * 给你一个整数数组 nums 和一个整数 k ，请你统计并返回 该数组中和为 k 的子数组的个数 。
 *
 * 子数组是数组中元素的连续非空序列。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,1,1], k = 2
 * 输出：2
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3], k = 3
 * 输出：2
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 2 * 10^4
 * -1000 <= nums[i] <= 1000
 * -10^7 <= k <= 10^7
 *
 *
 */

// @lc code=start
function subarraySum(nums: number[], k: number): number {
  // 使用哈希表存储前缀和及其出现次数
  const prefixSumCount = new Map<number, number>();

  // 初始化：前缀和为0出现1次（空子数组的情况）
  prefixSumCount.set(0, 1);

  // 记录当前前缀和
  let currentPrefixSum = 0;
  // 记录和为k的子数组个数
  let count = 0;

  // 遍历数组中的每个元素
  for (const num of nums) {
    // 更新当前前缀和
    currentPrefixSum += num;

    // 计算目标前缀和：如果存在前缀和为 (currentPrefixSum - k)，
    // 那么从那个位置到当前位置的子数组和就是k
    const targetPrefixSum = currentPrefixSum - k;

    // 如果目标前缀和存在，说明找到了和为k的子数组
    if (prefixSumCount.has(targetPrefixSum)) {
      count += prefixSumCount.get(targetPrefixSum)!;
    }

    // 将当前前缀和加入哈希表，如果已存在则增加计数
    prefixSumCount.set(
      currentPrefixSum,
      (prefixSumCount.get(currentPrefixSum) || 0) + 1
    );
  }

  return count;
}
// @lc code=end
