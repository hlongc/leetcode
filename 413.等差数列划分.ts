/*
 * @lc app=leetcode.cn id=413 lang=typescript
 *
 * [413] 等差数列划分
 */

// @lc code=start
/**
 * 计算数组中等差数列子数组的数量
 *
 * @param nums 输入数组
 * @returns 等差数列子数组的数量
 */
function numberOfArithmeticSlices1(nums: number[]): number {
  const n = nums.length;

  // 如果数组长度小于3，不可能形成等差数列，返回0
  if (n < 3) return 0;

  // 方法一：动态规划
  // dp[i]表示以nums[i]结尾的等差数列子数组数量
  const dp: number[] = new Array(n).fill(0);

  let total = 0; // 总的等差数列子数组数量

  // 从索引2开始（因为等差数列至少需要3个元素）
  for (let i = 2; i < n; i++) {
    // 检查当前三个元素是否构成等差数列
    if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) {
      // 如果构成等差数列，则dp[i] = dp[i-1] + 1
      // 这里的+1表示新增了一个以nums[i]结尾的新等差数列
      dp[i] = dp[i - 1] + 1;

      // 累加到总数中
      total += dp[i];
    }
    // 如果不构成等差数列，dp[i]保持为0（默认值）
  }

  return total;
}

/**
 * 方法二：常数空间复杂度的优化解法
 *
 * @param nums 输入数组
 * @returns 等差数列子数组的数量
 */
function numberOfArithmeticSlices(nums: number[]): number {
  const n = nums.length;

  if (n < 3) return 0;

  let count = 0; // 当前连续等差序列能形成的等差数列数
  let total = 0; // 总的等差数列数量

  for (let i = 2; i < n; i++) {
    if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) {
      // 当前元素能够延续等差序列
      count++;
      // 累加新增的等差数列数量
      total += count;
    } else {
      // 等差序列中断，重置计数
      count = 0;
    }
  }

  return total;
}

/**
 * 方法三：计算连续等差序列长度并应用公式
 *
 * @param nums 输入数组
 * @returns 等差数列子数组的数量
 */
function numberOfArithmeticSlices3(nums: number[]): number {
  const n = nums.length;

  if (n < 3) return 0;

  let total = 0;
  let start = 0;

  for (let i = 2; i < n; i++) {
    // 检查当前三个元素是否不构成等差数列或已到达数组末尾
    if (nums[i] - nums[i - 1] !== nums[i - 1] - nums[i - 2] || i === n - 1) {
      // 如果不构成等差数列，计算前面连续等差序列的长度
      // 如果当前索引是数组末尾且仍构成等差数列，需要包含当前元素
      const end =
        nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2] ? i : i - 1;
      const len = end - start + 1;

      // 长度至少为3才构成等差数列
      if (len >= 3) {
        // 计算长度为len的连续序列能形成的所有等差子数组数量
        // 公式：(n-2)*(n-1)/2，其中n是连续等差序列的长度
        total += ((len - 2) * (len - 1)) / 2;
      }

      // 更新新等差序列的起始位置
      start = i - 1;
    }
  }

  // 处理整个数组都是等差数列的情况
  if (start === 0) {
    const len = n;
    if (len >= 3) {
      total += ((len - 2) * (len - 1)) / 2;
    }
  }

  return total;
}

// 默认使用方法二：最优解，空间复杂度O(1)
// @lc code=end
