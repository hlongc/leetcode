/*
 * @lc app=leetcode.cn id=416 lang=typescript
 *
 * [416] 分割等和子集
 */

// @lc code=start
/**
 * 判断是否可以将数组分割成两个和相等的子集
 *
 * @param nums 输入的正整数数组
 * @returns 是否能够分割成两个和相等的子集
 */
function canPartition(nums: number[]): boolean {
  // 计算数组总和
  let total = 0;
  for (const num of nums) {
    total += num;
  }

  // 如果总和为奇数，无法分成两个和相等的子集
  if (total % 2 !== 0) return false;

  // 目标和为总和的一半
  const target = total / 2;

  // 如果数组中有元素大于目标和，无法分割
  const max = Math.max(...nums);
  if (max > target) return false;

  // 如果有元素等于目标和，可以直接分割
  if (max === target) return true;

  // 动态规划解法
  // dp[i]表示是否可以选择数组中的一些元素使得它们的和为i
  const dp = new Array(target + 1).fill(false);
  dp[0] = true; // 和为0总是可能的（不选任何元素）

  // 对于数组中的每个元素
  for (const num of nums) {
    // 从目标和向下遍历到当前数值，避免重复使用同一个元素
    for (let i = target; i >= num; i--) {
      // 当前和i可以通过选择num和之前能够达到的和i-num来实现
      dp[i] = dp[i] || dp[i - num];
    }

    // 如果已经找到一种方法可以得到目标和，提前返回
    if (dp[target]) return true;
  }

  return dp[target];
}

/**
 * 解法二：记忆化搜索（自顶向下的动态规划）
 */
function canPartition2(nums: number[]): boolean {
  // 计算数组总和
  let total = 0;
  for (const num of nums) {
    total += num;
  }

  // 如果总和为奇数，无法分成两个和相等的子集
  if (total % 2 !== 0) return false;

  // 目标和为总和的一半
  const target = total / 2;

  // 如果数组中有元素大于目标和，无法分割
  const max = Math.max(...nums);
  if (max > target) return false;

  // 如果有元素等于目标和，可以直接分割
  if (max === target) return true;

  // 记忆化数组，memo[i][j]表示使用前i个元素能否组成和为j
  const memo: Map<string, boolean> = new Map();

  /**
   * 递归函数：判断是否可以从前index个元素中选择一些元素使得它们的和为remainSum
   *
   * @param index 当前考虑的元素索引
   * @param remainSum 剩余需要的和
   * @returns 是否可能实现
   */
  function dfs(index: number, remainSum: number): boolean {
    // 基本情况：已经找到一种组合
    if (remainSum === 0) return true;

    // 基本情况：remainSum小于0或者已经考虑完所有元素
    if (remainSum < 0 || index === nums.length) return false;

    // 检查记忆化数组
    const key = `${index}_${remainSum}`;
    if (memo.has(key)) return memo.get(key)!;

    // 递归调用：选择当前元素或不选择当前元素
    const result =
      dfs(index + 1, remainSum - nums[index]) || dfs(index + 1, remainSum);

    // 保存结果到记忆化数组
    memo.set(key, result);
    return result;
  }

  return dfs(0, target);
}

/**
 * 解法三：优化的动态规划（使用位运算）
 */
function canPartition3(nums: number[]): boolean {
  // 计算数组总和
  let total = 0;
  for (const num of nums) {
    total += num;
  }

  // 如果总和为奇数，无法分成两个和相等的子集
  if (total % 2 !== 0) return false;

  const target = total / 2;

  // 使用位运算表示可能的和
  // dp中的第i位为1表示可以得到和为i
  let dp = 1; // 初始时只有和为0是可能的（第0位为1）

  for (const num of nums) {
    // 对于当前数字num，我们可以得到所有dp已有的和再加上num
    dp = dp | (dp << num);

    // 检查是否可以得到目标和
    if ((dp & (1 << target)) !== 0) return true;
  }

  return false;
}

// 默认使用第一种解法
// @lc code=end
