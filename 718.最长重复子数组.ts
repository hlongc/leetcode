/*
 * @lc app=leetcode.cn id=718 lang=typescript
 *
 * [718] 最长重复子数组
 */

/**
 * 寻找两个数组中的最长重复子数组
 * 动态规划解法
 *
 * dp[i][j] 表示以 nums1[i-1] 和 nums2[j-1] 结尾的最长公共子数组的长度
 *
 * 状态转移方程：
 * - 当 nums1[i-1] === nums2[j-1] 时，dp[i][j] = dp[i-1][j-1] + 1
 * - 否则 dp[i][j] = 0（因为我们要找的是连续的子数组）
 *
 * 时间复杂度：O(M*N)，其中 M 和 N 分别是两个数组的长度
 * 空间复杂度：O(M*N)，需要二维dp数组
 *
 * @param nums1 第一个数组
 * @param nums2 第二个数组
 * @returns 最长重复子数组的长度
 */
function findLength1(nums1: number[], nums2: number[]): number {
  // 获取两个数组的长度
  const len1 = nums1.length;
  const len2 = nums2.length;

  // 创建dp数组，初始化为0
  // dp数组大小为 (len1+1) * (len2+1)，是为了便于处理边界情况
  const dp = new Array(len1 + 1).fill(0).map(() => new Array(len2 + 1).fill(0));

  // 记录最长重复子数组的长度
  let ret = 0;

  // 遍历两个数组
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      // 当前两个位置的数字相等时
      if (nums1[i - 1] === nums2[j - 1]) {
        // 当前位置的最长重复长度等于前一个位置的长度加1
        dp[i][j] = dp[i - 1][j - 1] + 1;
      }
      // 注意：当数字不相等时，dp[i][j]保持为0，因为我们要找的是连续的子数组

      // 更新最大长度
      ret = Math.max(ret, dp[i][j]);
    }
  }

  return ret;
}

/**
 * 使用一维dp数组的优化解法
 *
 * 思路：
 * 1. 二维dp可以优化为一维dp，因为每个状态只依赖于上一行的对角线元素
 * 2. 为了防止更新当前值时覆盖掉还需要使用的上一行的值，我们需要从后往前遍历
 *
 * dp[j] 表示以 nums1[i-1] 和 nums2[j-1] 结尾的最长公共子数组的长度
 * dp[0] 作为边界条件，实际使用的是 dp[1] 到 dp[len2]
 *
 * 优化后：
 * - 空间复杂度从 O(M*N) 降低到 O(N)
 * - 时间复杂度仍然是 O(M*N)
 *
 * @param nums1 第一个数组
 * @param nums2 第二个数组
 * @returns 最长重复子数组的长度
 */
function findLength(nums1: number[], nums2: number[]): number {
  // 获取两个数组的长度
  const len1 = nums1.length;
  const len2 = nums2.length;

  // 创建一维dp数组，长度为len2+1
  // dp[0]作为边界条件，实际使用dp[1]到dp[len2]
  // dp[j]表示以nums2[j-1]结尾的最长重复子数组长度
  const dp = new Array(len2 + 1).fill(0);

  // 记录最长重复子数组的长度
  let maxLength = 0;

  // 遍历nums1的每个元素
  for (let i = 1; i <= len1; i++) {
    // 从后往前遍历nums2
    // 这样可以避免覆盖掉还需要使用的上一行的值
    for (let j = len2; j >= 1; j--) {
      // 当两个位置的数字相等时
      // nums1[i-1]和nums2[j-1]是实际要比较的元素
      if (nums1[i - 1] === nums2[j - 1]) {
        // dp[j]更新为其左上角的值(dp[j-1])加1
        dp[j] = dp[j - 1] + 1;
      } else {
        // 不相等时重置为0，因为我们要找的是连续的子数组
        dp[j] = 0;
      }
      // 更新最大长度
      maxLength = Math.max(maxLength, dp[j]);
    }
  }

  return maxLength;
}
// @lc code=end
