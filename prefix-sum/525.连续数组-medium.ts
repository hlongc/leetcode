/*
 * @lc app=leetcode.cn id=525 lang=typescript
 *
 * [525] 连续数组
 *
 * https://leetcode.cn/problems/contiguous-array/description/
 *
 * algorithms
 * Medium (55.68%)
 * Likes:    815
 * Dislikes: 0
 * Total Accepted:    98.1K
 * Total Submissions: 176.1K
 * Testcase Example:  '[0,1]'
 *
 * 给定一个二进制数组 nums , 找到含有相同数量的 0 和 1 的最长连续子数组，并返回该子数组的长度。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [0,1]
 * 输出：2
 * 说明：[0, 1] 是具有相同数量 0 和 1 的最长连续子数组。
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0,1,0]
 * 输出：2
 * 说明：[0, 1] (或 [1, 0]) 是具有相同数量 0 和 1 的最长连续子数组。
 *
 * 示例 3：
 *
 *
 * 输入：nums = [0,1,1,1,1,1,0,0,0]
 * 输出：6
 * 解释：[1,1,1,0,0,0] 是具有相同数量 0 和 1 的最长连续子数组。
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * nums[i] 不是 0 就是 1
 *
 *
 */

// @lc code=start
/**
 * 解题思路：前缀和 + 哈希表
 *
 * 核心思想：
 * 1. 将0视为-1，这样"0和1数量相等"就转化为"子数组和为0"
 * 2. 使用前缀和：如果 prefixSum[j] === prefixSum[i]，
 *    说明 nums[i+1...j] 的和为0，即这段子数组中0和1数量相等
 * 3. 用哈希表记录每个前缀和第一次出现的位置
 *
 * 示例：nums = [0,1,0,1,1]
 * 转换后：    [-1,1,-1,1,1]
 * 前缀和：  0, -1,0,-1,0,1
 * 索引：   -1, 0, 1, 2, 3, 4
 *
 * - 索引1处前缀和为0，与初始前缀和0相同 → 子数组[0,1]长度为2
 * - 索引3处前缀和为0，与索引1处相同 → 子数组[1,0,1]长度为2
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function findMaxLength(nums: number[]): number {
  // 哈希表：key为前缀和，value为该前缀和第一次出现的索引
  // 初始化：前缀和0在索引-1处（表示空数组）
  const map = new Map<number, number>();
  map.set(0, -1);

  let maxLen = 0; // 最长子数组长度
  let prefixSum = 0; // 当前前缀和

  for (let i = 0; i < nums.length; i++) {
    // 将0视为-1，1保持为1
    // 这样"0和1数量相等"等价于"和为0"
    prefixSum += nums[i] === 0 ? -1 : 1;

    if (map.has(prefixSum)) {
      // 如果当前前缀和之前出现过
      // 说明从上次出现位置+1到当前位置的子数组和为0
      const prevIndex = map.get(prefixSum)!;
      const length = i - prevIndex;
      maxLen = Math.max(maxLen, length);
    } else {
      // 第一次遇到这个前缀和，记录其位置
      map.set(prefixSum, i);
    }
  }

  return maxLen;
}
// @lc code=end
