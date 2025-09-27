/*
 * @lc app=leetcode.cn id=41 lang=typescript
 *
 * [41] 缺失的第一个正数
 *
 * https://leetcode.cn/problems/first-missing-positive/description/
 *
 * algorithms
 * Hard (46.91%)
 * Likes:    2422
 * Dislikes: 0
 * Total Accepted:    622.7K
 * Total Submissions: 1.3M
 * Testcase Example:  '[1,2,0]'
 *
 * 给你一个未排序的整数数组 nums ，请你找出其中没有出现的最小的正整数。
 * 请你实现时间复杂度为 O(n) 并且只使用常数级别额外空间的解决方案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,0]
 * 输出：3
 * 解释：范围 [1,2] 中的数字都在数组中。
 *
 * 示例 2：
 *
 *
 * 输入：nums = [3,4,-1,1]
 * 输出：2
 * 解释：1 在数组中，但 2 没有。
 *
 * 示例 3：
 *
 *
 * 输入：nums = [7,8,9,11,12]
 * 输出：1
 * 解释：最小的正数 1 没有出现。
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * -2^31 <= nums[i] <= 2^31 - 1
 *
 *
 */

// @lc code=start
function firstMissingPositive(nums: number[]): number {
  const n = nums.length;

  // 核心思想：利用数组索引作为哈希表
  // 理想情况下，数组[1,2,3,4]应该放在索引[0,1,2,3]位置
  // 即：数字i应该放在索引i-1的位置

  // 第一步：清理无效数字
  // 将所有 <= 0 或 > n 的数字替换为 n+1
  // 因为答案最大只能是 n+1（当1到n都存在时）
  for (let i = 0; i < n; i++) {
    if (nums[i] <= 0 || nums[i] > n) {
      nums[i] = n + 1;
    }
  }

  // 第二步：标记存在的数字
  // 遍历数组，对于每个数字num，将nums[num-1]标记为负数
  // 负数表示"这个位置对应的数字存在"
  for (let i = 0; i < n; i++) {
    const num = Math.abs(nums[i]); // 取绝对值，因为可能已经被标记为负数
    if (num <= n) {
      // 确保num在有效范围内
      nums[num - 1] = -Math.abs(nums[num - 1]); // 标记为负数
    }
  }

  // 第三步：查找第一个未标记的位置
  // 如果nums[i] > 0，说明数字i+1不存在
  for (let i = 0; i < n; i++) {
    if (nums[i] > 0) {
      return i + 1;
    }
  }

  // 如果所有位置都被标记了，说明1到n都存在，返回n+1
  return n + 1;
}

// 更直观的理解方式：
// 假设数组长度为4，我们关心的是数字1,2,3,4
// 理想情况：[1,2,3,4] -> 索引[0,1,2,3]
// 如果数组是[3,4,-1,1]：
// 1. 清理后：[3,4,5,1] (将-1替换为5)
// 2. 标记过程：
//    - 遇到3：将nums[2]标记为负数 -> [3,4,-5,1]
//    - 遇到4：将nums[3]标记为负数 -> [3,4,-5,-1]
//    - 遇到5：超出范围，跳过
//    - 遇到1：将nums[0]标记为负数 -> [-3,4,-5,-1]
// 3. 查找：nums[1] = 4 > 0，所以缺失的数字是2

// 另一种更容易理解的思路（但需要额外空间）：
// function firstMissingPositive(nums: number[]): number {
//     const n = nums.length;
//     const seen = new Set(nums);
//
//     for (let i = 1; i <= n + 1; i++) {
//         if (!seen.has(i)) {
//             return i;
//         }
//     }
//     return n + 1;
// }
// 但题目要求O(1)空间，所以用数组本身作为哈希表
// @lc code=end
