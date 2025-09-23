/*
 * @lc app=leetcode.cn id=268 lang=typescript
 *
 * [268] 丢失的数字
 *
 * https://leetcode.cn/problems/missing-number/description/
 *
 * algorithms
 * Easy (67.84%)
 * Likes:    887
 * Dislikes: 0
 * Total Accepted:    401.5K
 * Total Submissions: 590.4K
 * Testcase Example:  '[3,0,1]'
 *
 * 给定一个包含 [0, n] 中 n 个数的数组 nums ，找出 [0, n] 这个范围内没有出现在数组中的那个数。
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,0,1]
 *
 * 输出：2
 *
 * 解释：n = 3，因为有 3 个数字，所以所有的数字都在范围 [0,3] 内。2 是丢失的数字，因为它没有出现在 nums 中。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0,1]
 *
 * 输出：2
 *
 * 解释：n = 2，因为有 2 个数字，所以所有的数字都在范围 [0,2] 内。2 是丢失的数字，因为它没有出现在 nums 中。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [9,6,4,2,3,5,7,0,1]
 *
 * 输出：8
 *
 * 解释：n = 9，因为有 9 个数字，所以所有的数字都在范围 [0,9] 内。8 是丢失的数字，因为它没有出现在 nums 中。
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1 <= n <= 10^4
 * 0 <= nums[i] <= n
 * nums 中的所有数字都 独一无二
 *
 *
 *
 *
 * 进阶：你能否实现线性时间复杂度、仅使用额外常数空间的算法解决此问题?
 *
 */

// @lc code=start
/**
 * 丢失的数字
 *
 * 题目分析：
 * - 给定包含 [0, n] 中 n 个数的数组
 * - 数组长度为 n，意味着缺少一个数字
 * - 找出 [0, n] 范围内没有出现的那个数字
 *
 * 解法思路：
 * 1. 数学解法：利用等差数列求和公式
 * 2. 异或解法：利用异或运算的性质
 * 3. 排序解法：排序后检查缺失位置
 */
function missingNumber(nums: number[]): number {
  // 解法1：数学解法（推荐）
  // 利用等差数列求和公式：0+1+2+...+n = n*(n+1)/2
  /* const n = nums.length;

  // 计算完整序列的理论总和
  const expectedSum = (n * (n + 1)) / 2;

  // 计算实际数组的总和
  const actualSum = nums.reduce((sum, num) => sum + num, 0);

  // 两者之差就是缺失的数字
  return expectedSum - actualSum; */

  // 解法2：异或解法（位运算解法）
  // 利用异或运算性质：a ^ a = 0, a ^ 0 = a
  // 将数组中所有数字与0到n的所有数字进行异或
  // 相同的数字会被抵消，剩下的就是缺失的数字

  let result = nums.length; // 从n开始

  for (let i = 0; i < nums.length; i++) {
    result ^= i ^ nums[i]; // 同时异或索引i和数组值nums[i]
  }

  return result;

  // 解法3：排序解法（时间复杂度较高）
  /*
  nums.sort((a, b) => a - b);
  
  // 检查每个位置是否对应正确的数字
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i) {
      return i; // 找到第一个不匹配的位置
    }
  }
  
  // 如果所有位置都匹配，说明缺失的是最后一个数字
  return nums.length;
  */
}

/**
 * 各种解法的复杂度分析：
 *
 * 解法1 - 数学解法：
 * 时间复杂度：O(n) - 需要遍历数组求和
 * 空间复杂度：O(1) - 只使用常数额外空间
 * 优点：思路清晰，计算简单
 * 缺点：大数情况下可能存在溢出风险
 *
 * 解法2 - 异或解法：
 * 时间复杂度：O(n) - 遍历数组一次
 * 空间复杂度：O(1) - 只使用常数额外空间
 * 优点：不会溢出，纯位运算
 * 缺点：理解起来稍微复杂一些
 *
 * 解法3 - 排序解法：
 * 时间复杂度：O(n log n) - 排序的时间复杂度
 * 空间复杂度：O(1) 或 O(n) - 取决于排序算法
 * 优点：思路直观
 * 缺点：时间复杂度较高
 *
 * 示例验证：
 * nums = [3,0,1]
 * 解法1：expectedSum = 3*4/2 = 6, actualSum = 4, 结果 = 6-4 = 2 ✓
 * 解法2：3 ^ 0 ^ 3 ^ 1 ^ 0 ^ 2 ^ 1 = 2 ✓
 */
// @lc code=end
