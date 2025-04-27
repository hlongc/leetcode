/*
 * @lc app=leetcode.cn id=268 lang=typescript
 *
 * [268] 丢失的数字
 */

// @lc code=start
/**
 * 查找 0 到 n 范围内缺失的数字
 * @param nums 包含 0 到 n 中 n 个数的数组，其中恰好有一个数字缺失
 * @return 缺失的数字
 */
function missingNumber1(nums: number[]): number {
  // 获取数组长度，表示数字应该在 0 到 n 的范围内
  const n = nums.length;

  // 计算 0 到 n 的理论总和：(1+n)*n/2
  // 这里使用了等差数列求和公式
  let sum = ((1 + n) * n) / 2;

  // 从理论总和中减去数组中的每个数字
  // 剩下的差值就是缺失的数字
  for (const num of nums) {
    sum -= num;
  }

  // 返回缺失的数字
  return sum;
}

/**
 * 位运算解法
 * @param nums 包含 0 到 n 中 n 个数的数组，其中恰好有一个数字缺失
 * @return 缺失的数字
 */
function missingNumber(nums: number[]): number {
  // 位运算解法：利用异或运算的特性来找出缺失的数字
  // 异或运算的特性：
  // 1. a ^ a = 0（任何数与自身异或等于0）
  // 2. a ^ 0 = a（任何数与0异或等于其本身）
  // 3. 异或运算满足交换律和结合律

  // 初始化为数组长度n，因为我们要考虑0到n的所有数字
  // 初始化 missing = nums.length 的原因是
  // 我们要考虑的完整数字范围是 0 到 n，一共有 n+1 个数字
  // 在循环中，我们会对 0 到 n-1 这 n 个索引进行异或操作
  // 但是我们的完整数字范围应该是 0 到 n
  // 所以需要先把 n 包含进来，即初始化 missing = n
  let missing = nums.length;

  // 遍历数组中的每个元素和索引
  for (let i = 0; i < nums.length; i++) {
    // 对当前索引i、数组元素nums[i]和missing进行异或操作
    // 如果数组包含0到n-1的所有数字，则nums[i]和i会两两抵消
    // 最终missing只会与缺失的那个数字进行一次异或，从而得到结果
    missing ^= nums[i] ^ i;
  }

  // 返回缺失的数字
  // 如果数组是[0,1,3]，n=3
  // missing初始为3
  // i=0: missing = 3 ^ 0 ^ 0 = 3
  // i=1: missing = 3 ^ 1 ^ 1 = 3
  // i=2: missing = 3 ^ 3 ^ 2 = 2
  // 返回2，即缺失的数字
  return missing;
}
// @lc code=end
