/*
 * @lc app=leetcode.cn id=217 lang=typescript
 *
 * [217] 存在重复元素
 *
 * https://leetcode.cn/problems/contains-duplicate/description/
 *
 * algorithms
 * Easy (55.84%)
 * Likes:    1146
 * Dislikes: 0
 * Total Accepted:    923.2K
 * Total Submissions: 1.7M
 * Testcase Example:  '[1,2,3,1]'
 *
 * 给你一个整数数组 nums 。如果任一值在数组中出现 至少两次 ，返回 true ；如果数组中每个元素互不相同，返回 false 。
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3,1]
 *
 * 输出：true
 *
 * 解释：
 *
 * 元素 1 在下标 0 和 3 出现。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3,4]
 *
 * 输出：false
 *
 * 解释：
 *
 * 所有元素都不同。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1,1,1,3,3,4,3,2,4,2]
 *
 * 输出：true
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * -10^9 <= nums[i] <= 10^9
 *
 *
 */

// @lc code=start
function containsDuplicate(nums: number[]): boolean {
  // 方法1：使用Set数据结构
  // 时间复杂度：O(n)，空间复杂度：O(n)
  const seen = new Set<number>();

  for (const num of nums) {
    // 如果当前数字已经在Set中存在，说明有重复
    if (seen.has(num)) {
      return true;
    }
    // 将当前数字添加到Set中
    seen.add(num);
  }

  // 遍历完所有元素都没有发现重复，返回false
  return false;
}

// 方法2：使用排序（备选方案）
// 时间复杂度：O(n log n)，空间复杂度：O(1)
function containsDuplicateSort(nums: number[]): boolean {
  // 先对数组进行排序
  nums.sort((a, b) => a - b);

  // 检查相邻元素是否相等
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1]) {
      return true;
    }
  }

  return false;
}
// @lc code=end
