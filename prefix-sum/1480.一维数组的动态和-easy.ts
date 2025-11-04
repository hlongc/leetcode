/*
 * @lc app=leetcode.cn id=1480 lang=typescript
 *
 * [1480] 一维数组的动态和
 *
 * https://leetcode.cn/problems/running-sum-of-1d-array/description/
 *
 * algorithms
 * Easy (76.40%)
 * Likes:    529
 * Dislikes: 0
 * Total Accepted:    370.4K
 * Total Submissions: 485K
 * Testcase Example:  '[1,2,3,4]'
 *
 * 给你一个数组 nums 。数组「动态和」的计算公式为：runningSum[i] = sum(nums[0]…nums[i]) 。
 *
 * 请返回 nums 的动态和。
 *
 *
 *
 * 示例 1：
 *
 * 输入：nums = [1,2,3,4]
 * 输出：[1,3,6,10]
 * 解释：动态和计算过程为 [1, 1+2, 1+2+3, 1+2+3+4] 。
 *
 * 示例 2：
 *
 * 输入：nums = [1,1,1,1,1]
 * 输出：[1,2,3,4,5]
 * 解释：动态和计算过程为 [1, 1+1, 1+1+1, 1+1+1+1, 1+1+1+1+1] 。
 *
 * 示例 3：
 *
 * 输入：nums = [3,1,2,10,1]
 * 输出：[3,4,6,16,17]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 1000
 * -10^6 <= nums[i] <= 10^6
 *
 *
 */

// @lc code=start

/**
 * 一维数组的动态和（前缀和）
 *
 * 核心思路：构建前缀和数组
 *
 * 问题：计算 runningSum[i] = sum(nums[0]...nums[i])
 *
 * 示例：nums = [1, 2, 3, 4]
 * 输出：[1, 3, 6, 10]
 *       ↑  ↑  ↑   ↑
 *       1  1+2  1+2+3  1+2+3+4
 *
 * 方案对比：
 *
 * 方案1：修改原数组（空间优化，但不推荐）
 * - 优点：O(1) 额外空间
 * - 缺点：破坏了原数组，违反函数式编程原则
 *
 * 方案2：创建新数组（推荐）✅
 * - 优点：不修改原数组，代码更安全
 * - 缺点：O(n) 额外空间（但通常可以接受）
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n) - 返回的新数组
 */
function runningSum(nums: number[]): number[] {
  const n = nums.length;

  // 创建新数组存储结果，不修改原数组
  const result = new Array(n);

  // 第一个元素直接复制
  result[0] = nums[0];

  // 从第二个元素开始，依次计算前缀和
  // result[i] = result[i-1] + nums[i]
  for (let i = 1; i < n; i++) {
    result[i] = result[i - 1] + nums[i];
  }

  return result;
}

/*
 * 方案对比代码示例：
 *
 * ❌ 方案1：修改原数组（不推荐）
 * function runningSum(nums: number[]): number[] {
 *   for (let i = 1; i < nums.length; i++) {
 *     nums[i] += nums[i - 1];  // 直接修改原数组
 *   }
 *   return nums;
 * }
 *
 * 问题：
 * const arr = [1, 2, 3, 4];
 * runningSum(arr);  // arr 被改变了！
 * console.log(arr); // [1, 3, 6, 10] - 原数组被破坏
 *
 * ✅ 方案2：创建新数组（推荐）
 * function runningSum(nums: number[]): number[] {
 *   const result = new Array(nums.length);
 *   result[0] = nums[0];
 *   for (let i = 1; i < nums.length; i++) {
 *     result[i] = result[i - 1] + nums[i];
 *   }
 *   return result;
 * }
 *
 * 优势：
 * const arr = [1, 2, 3, 4];
 * const sum = runningSum(arr);
 * console.log(arr); // [1, 2, 3, 4] - 原数组保持不变 ✓
 * console.log(sum); // [1, 3, 6, 10]
 */

// @lc code=end
