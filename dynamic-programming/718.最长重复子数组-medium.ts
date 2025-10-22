/*
 * @lc app=leetcode.cn id=718 lang=typescript
 *
 * [718] 最长重复子数组
 *
 * https://leetcode.cn/problems/maximum-length-of-repeated-subarray/description/
 *
 * algorithms
 * Medium (56.92%)
 * Likes:    1202
 * Dislikes: 0
 * Total Accepted:    326.6K
 * Total Submissions: 573.6K
 * Testcase Example:  '[1,2,3,2,1]\n[3,2,1,4,7]'
 *
 * 给两个整数数组 nums1 和 nums2 ，返回 两个数组中 公共的 、长度最长的子数组的长度 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums1 = [1,2,3,2,1], nums2 = [3,2,1,4,7]
 * 输出：3
 * 解释：长度最长的公共子数组是 [3,2,1] 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums1 = [0,0,0,0,0], nums2 = [0,0,0,0,0]
 * 输出：5
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums1.length, nums2.length <= 1000
 * 0 <= nums1[i], nums2[i] <= 100
 *
 *
 */

// @lc code=start

/**
 * 解法一：动态规划（标准解法）
 *
 * 思路：
 * 1. 定义 dp[i][j] 表示以 nums1[i-1] 和 nums2[j-1] 结尾的最长公共子数组长度
 * 2. 状态转移方程：
 *    - 如果 nums1[i-1] === nums2[j-1]，则 dp[i][j] = dp[i-1][j-1] + 1
 *    - 否则 dp[i][j] = 0（子数组必须连续，不相等就断开）
 * 3. 最终答案是 dp 数组中的最大值
 *
 * 时间复杂度：O(m * n)，m 和 n 分别是两个数组的长度
 * 空间复杂度：O(m * n)
 */
function findLength1(nums1: number[], nums2: number[]): number {
  const m = nums1.length;
  const n = nums2.length;

  // 创建 dp 数组，多一行一列用于边界处理（初始值都是 0）
  // dp[i][j] 表示以 nums1[i-1] 和 nums2[j-1] 结尾的最长公共子数组长度
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  let maxLen = 0; // 记录最长的公共子数组长度

  // 遍历两个数组
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // 如果当前元素相等
      if (nums1[i - 1] === nums2[j - 1]) {
        // 当前长度 = 前一个位置的长度 + 1
        dp[i][j] = dp[i - 1][j - 1] + 1;
        // 更新最大长度
        maxLen = Math.max(maxLen, dp[i][j]);
      }
      // 如果不相等，dp[i][j] 保持为 0（子数组断开）
    }
  }

  return maxLen;
}

/**
 * 解法二：动态规划（空间优化版）
 *
 * 观察到 dp[i][j] 只依赖于 dp[i-1][j-1]，可以用一维数组优化空间
 * 注意：需要从后向前遍历，避免覆盖还未使用的值
 *
 * 时间复杂度：O(m * n)
 * 空间复杂度：O(n)
 */
function findLength(nums1: number[], nums2: number[]): number {
  const m = nums1.length;
  const n = nums2.length;

  // 确保 nums2 是较短的数组，如果不是则交换
  if (m < n) {
    return findLength(nums2, nums1); // 递归交换
  }

  // 只使用一维数组，长度为较短的数组
  const dp: number[] = Array(n + 1).fill(0);
  let maxLen = 0;

  for (let i = 1; i <= m; i++) {
    // 从后向前遍历，避免覆盖未使用的值
    for (let j = n; j >= 1; j--) {
      if (nums1[i - 1] === nums2[j - 1]) {
        dp[j] = dp[j - 1] + 1;
        maxLen = Math.max(maxLen, dp[j]);
      } else {
        dp[j] = 0; // 重要：不相等时要重置为 0
      }
    }
  }

  return maxLen;
}

// @lc code=end

/* 
测试用例：
console.log(findLength([1,2,3,2,1], [3,2,1,4,7])); // 3 ([3,2,1])
console.log(findLength([0,0,0,0,0], [0,0,0,0,0])); // 5 ([0,0,0,0,0])
console.log(findLength([1,2,3,4,5], [5,4,3,2,1])); // 1

示例图解（示例1）：
nums1 = [1, 2, 3, 2, 1]
nums2 = [3, 2, 1, 4, 7]

DP 表格（dp[i][j] 表示以 nums1[i-1] 和 nums2[j-1] 结尾的最长公共子数组）：
      '' 3  2  1  4  7
  ''   0  0  0  0  0  0
  1    0  0  0  1  0  0
  2    0  0  1  0  0  0
  3    0  1  0  0  0  0
  2    0  0  2  0  0  0
  1    0  0  0  3  0  0
           ↑
    最大值是 3，对应 [3,2,1]

关键点：
1. 子数组必须连续，所以不相等时 dp[i][j] = 0
2. 相等时 dp[i][j] = dp[i-1][j-1] + 1（继承左上角的值）
3. 最终答案是整个 dp 表中的最大值
*/
