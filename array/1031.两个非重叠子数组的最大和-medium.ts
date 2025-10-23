/*
 * @lc app=leetcode.cn id=1031 lang=typescript
 *
 * [1031] 两个非重叠子数组的最大和
 *
 * https://leetcode.cn/problems/maximum-sum-of-two-non-overlapping-subarrays/description/
 *
 * algorithms
 * Medium (66.85%)
 * Likes:    313
 * Dislikes: 0
 * Total Accepted:    33.2K
 * Total Submissions: 49.6K
 * Testcase Example:  '[0,6,5,2,2,5,1,9,4]\n1\n2'
 *
 * 给你一个整数数组 nums 和两个整数 firstLen 和 secondLen，请你找出并返回两个无重叠 子数组 中元素的最大和，长度分别为
 * firstLen 和 secondLen 。
 *
 * 长度为 firstLen 的子数组可以出现在长为 secondLen 的子数组之前或之后，但二者必须是无重叠。
 *
 * 子数组是数组的一个 连续 部分。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [0,6,5,2,2,5,1,9,4], firstLen = 1, secondLen = 2
 * 输出：20
 * 解释：子数组的一种选择中，[9] 长度为 1，[6,5] 长度为 2。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [3,8,1,3,2,1,8,9,0], firstLen = 3, secondLen = 2
 * 输出：29
 * 解释：子数组的一种选择中，[3,8,1] 长度为 3，[8,9] 长度为 2。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [2,1,5,6,0,9,5,0,3,8], firstLen = 4, secondLen = 3
 * 输出：31
 * 解释：子数组的一种选择中，[5,6,0,9] 长度为 4，[0,3,8] 长度为 3。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= firstLen, secondLen <= 1000
 * 2 <= firstLen + secondLen <= 1000
 * firstLen + secondLen <= nums.length <= 1000
 * 0 <= nums[i] <= 1000
 *
 *
 */

// @lc code=start
/**
 * 解题思路：滑动窗口 + 前缀和 + 动态规划
 *
 * 问题分析：
 * - 找两个不重叠的连续子数组，长度分别为 firstLen 和 secondLen
 * - 两个子数组的相对位置有两种情况：
 *   1. firstLen 在前，secondLen 在后
 *   2. secondLen 在前，firstLen 在后
 *
 * 核心思想：
 * 使用滑动窗口遍历所有可能的位置，同时维护：
 * - 当前窗口的和
 * - 在当前位置之前，另一个窗口的最大和
 *
 * 算法步骤：
 * 1. 计算前缀和数组，方便快速计算子数组和
 * 2. 分两种情况讨论：
 *    情况1：firstLen 在前，secondLen 在后
 *      - 遍历 secondLen 的所有位置
 *      - 维护在此之前 firstLen 的最大和
 *    情况2：secondLen 在前，firstLen 在后
 *      - 遍历 firstLen 的所有位置
 *      - 维护在此之前 secondLen 的最大和
 * 3. 返回两种情况的最大值
 *
 * 示例：[0,6,5,2,2,5,1,9,4], firstLen=1, secondLen=2
 * 前缀和：[0,0,6,11,13,15,20,21,30,34]
 *
 * 情况1：firstLen在前
 *   - secondLen窗口 [6,5]=11, 之前firstLen最大 [0]=0  → 11
 *   - secondLen窗口 [5,2]=7,  之前firstLen最大 [6]=6  → 13
 *   - secondLen窗口 [2,2]=4,  之前firstLen最大 [6]=6  → 10
 *   - secondLen窗口 [2,5]=7,  之前firstLen最大 [6]=6  → 13
 *   - secondLen窗口 [5,1]=6,  之前firstLen最大 [6]=6  → 12
 *   - secondLen窗口 [1,9]=10, 之前firstLen最大 [6]=6  → 16
 *   - secondLen窗口 [9,4]=13, 之前firstLen最大 [6]=6  → 19
 *
 * 情况2：secondLen在前
 *   - firstLen窗口 [5]=5,  之前secondLen最大 [0,6]=6  → 11
 *   - firstLen窗口 [2]=2,  之前secondLen最大 [6,5]=11 → 13
 *   - ...
 *   - firstLen窗口 [9]=9,  之前secondLen最大 [6,5]=11 → 20 ← 最大！
 *
 * 时间复杂度：O(n)，遍历数组两次
 * 空间复杂度：O(n)，前缀和数组
 */
function maxSumTwoNoOverlap(
  nums: number[],
  firstLen: number,
  secondLen: number
): number {
  const n = nums.length;

  // 构建前缀和数组，prefixSum[i] = nums[0] + ... + nums[i-1]
  // 这样 prefixSum[j] - prefixSum[i] 就是 nums[i..j-1] 的和
  const prefixSum: number[] = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + nums[i];
  }

  /**
   * 辅助函数：计算 L 长度的子数组在前，M 长度的子数组在后的最大和
   * @param L 前面子数组的长度
   * @param M 后面子数组的长度
   */
  const helper = (L: number, M: number): number => {
    let maxL = 0; // 在当前位置之前，长度为 L 的子数组的最大和
    let result = 0; // 全局最大和

    // 从位置 L+M 开始遍历（确保前面有足够空间放两个子数组）
    for (let i = L + M; i <= n; i++) {
      // 计算以 i 结尾的长度为 L 的子数组和：nums[i-L-M..i-M-1]
      const currentL = prefixSum[i - M] - prefixSum[i - M - L];

      // 更新长度为 L 的子数组的最大和
      maxL = Math.max(maxL, currentL);

      // 计算以 i 结尾的长度为 M 的子数组和：nums[i-M..i-1]
      const currentM = prefixSum[i] - prefixSum[i - M];

      // 更新结果：之前 L 的最大和 + 当前 M 的和
      result = Math.max(result, maxL + currentM);
    }

    return result;
  };

  // 两种情况：
  // 1. firstLen 在前，secondLen 在后
  // 2. secondLen 在前，firstLen 在后
  return Math.max(helper(firstLen, secondLen), helper(secondLen, firstLen));
}
// @lc code=end
