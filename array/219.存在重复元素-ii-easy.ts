/*
 * @lc app=leetcode.cn id=219 lang=typescript
 *
 * [219] 存在重复元素 II
 *
 * https://leetcode.cn/problems/contains-duplicate-ii/description/
 *
 * algorithms
 * Easy (50.21%)
 * Likes:    819
 * Dislikes: 0
 * Total Accepted:    419.1K
 * Total Submissions: 834.4K
 * Testcase Example:  '[1,2,3,1]\n3'
 *
 * 给你一个整数数组 nums 和一个整数 k ，判断数组中是否存在两个 不同的索引 i 和 j ，满足 nums[i] == nums[j] 且
 * abs(i - j) <= k 。如果存在，返回 true ；否则，返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3,1], k = 3
 * 输出：true
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,0,1,1], k = 1
 * 输出：true
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1,2,3,1,2,3], k = 2
 * 输出：false
 *
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * -10^9 <= nums[i] <= 10^9
 * 0 <= k <= 10^5
 *
 *
 */

// @lc code=start
function containsNearbyDuplicate(nums: number[], k: number): boolean {
  // 使用哈希表存储元素及其最近出现的索引
  const numIndexMap = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    // 如果当前元素之前出现过
    if (numIndexMap.has(num)) {
      const lastIndex = numIndexMap.get(num)!;
      // 检查索引差是否小于等于k
      if (i - lastIndex <= k) {
        return true;
      }
    }

    // 更新当前元素的索引（总是更新为最新的索引）
    numIndexMap.set(num, i);
  }

  return false;
}
// @lc code=end
