/*
 * @lc app=leetcode.cn id=368 lang=typescript
 *
 * [368] 最大整除子集
 */

// @lc code=start
function largestDivisibleSubset(nums: number[]): number[] {
  // 如果数组为空，返回空数组
  if (nums.length === 0) return [];

  // 首先对数组进行排序，这样可以确保我们只需要检查 nums[j] % nums[i] === 0
  nums.sort((a, b) => a - b);

  const n = nums.length;

  // dp[i] 表示以 nums[i] 为最大元素的最大整除子集的大小
  const dp: number[] = Array(n).fill(1);

  // prev[i] 记录以 nums[i] 为最大元素的最大整除子集中，nums[i] 前一个元素的索引
  const prev: number[] = Array(n).fill(-1);

  // 记录最大子集的大小和对应的最后一个元素的索引
  let maxSize = 1;
  let maxIndex = 0;

  // 动态规划过程
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      // 如果 nums[i] 能被 nums[j] 整除，且加入 nums[j] 所在的子集能使结果更大
      if (nums[i] % nums[j] === 0 && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }

    // 更新最大子集信息
    if (dp[i] > maxSize) {
      maxSize = dp[i];
      maxIndex = i;
    }
  }

  // 根据 prev 数组回溯构建结果
  const result: number[] = [];
  while (maxIndex !== -1) {
    result.unshift(nums[maxIndex]);
    maxIndex = prev[maxIndex];
  }

  return result;
}
// @lc code=end
