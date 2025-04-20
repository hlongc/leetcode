/*
 * @lc app=leetcode.cn id=136 lang=typescript
 *
 * [136] 只出现一次的数字
 */

// @lc code=start
/**
 * 找出数组中只出现一次的数字
 *
 * 思路：使用异或运算的性质
 * 1. 任何数和0异或都是它本身：a ^ 0 = a
 * 2. 任何数和自身异或都是0：a ^ a = 0
 * 3. 异或运算满足交换律和结合律：a ^ b ^ a = (a ^ a) ^ b = 0 ^ b = b
 *
 * 时间复杂度：O(n)，其中n是数组长度
 * 空间复杂度：O(1)，只使用了一个变量
 *
 * @param nums 包含所有数字的数组，其中只有一个数字出现一次，其余都出现两次
 * @returns 只出现一次的数字
 */
function singleNumber(nums: number[]): number {
  // 初始化结果为第一个数字
  let r = nums[0];

  // 从第二个数字开始，依次与结果进行异或运算
  for (let i = 1; i < nums.length; i++) {
    r ^= nums[i];
  }

  // 最终结果就是只出现一次的数字
  return r;
}
// @lc code=end
