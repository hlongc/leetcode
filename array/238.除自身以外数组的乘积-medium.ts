/*
 * @lc app=leetcode.cn id=238 lang=typescript
 *
 * [238] 除自身以外数组的乘积
 *
 * https://leetcode.cn/problems/product-of-array-except-self/description/
 *
 * algorithms
 * Medium (77.88%)
 * Likes:    2124
 * Dislikes: 0
 * Total Accepted:    809.9K
 * Total Submissions: 1M
 * Testcase Example:  '[1,2,3,4]'
 *
 * 给你一个整数数组 nums，返回 数组 answer ，其中 answer[i] 等于 nums 中除 nums[i] 之外其余各元素的乘积 。
 *
 * 题目数据 保证 数组 nums之中任意元素的全部前缀元素和后缀的乘积都在  32 位 整数范围内。
 *
 * 请 不要使用除法，且在 O(n) 时间复杂度内完成此题。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [1,2,3,4]
 * 输出: [24,12,8,6]
 *
 *
 * 示例 2:
 *
 *
 * 输入: nums = [-1,1,0,-3,3]
 * 输出: [0,0,9,0,0]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 2 <= nums.length <= 10^5
 * -30 <= nums[i] <= 30
 * 输入 保证 数组 answer[i] 在  32 位 整数范围内
 *
 *
 *
 *
 * 进阶：你可以在 O(1) 的额外空间复杂度内完成这个题目吗？（ 出于对空间复杂度分析的目的，输出数组 不被视为 额外空间。）
 *
 */

// @lc code=start
function productExceptSelf(nums: number[]): number[] {
  const len = nums.length;
  const result: number[] = new Array(len);

  // 第一步：计算左乘积并存储在结果数组中
  // result[i] 表示 nums[0] 到 nums[i-1] 的乘积
  result[0] = 1; // 第一个元素左边没有元素，所以左乘积为1
  for (let i = 1; i < len; i++) {
    result[i] = result[i - 1] * nums[i - 1];
  }

  // 第二步：计算右乘积并直接与左乘积相乘
  // 使用一个变量 rightProduct 来存储右乘积，避免使用额外数组
  let rightProduct = 1; // 最后一个元素右边没有元素，所以右乘积为1

  // 从右到左遍历，同时计算右乘积并更新结果
  for (let i = len - 1; i >= 0; i--) {
    // 当前结果 = 左乘积 * 右乘积
    result[i] = result[i] * rightProduct;

    // 更新右乘积：为下一个元素准备
    // 下一个元素的右乘积 = 当前右乘积 * 当前元素
    rightProduct *= nums[i];
  }

  return result;
}
// @lc code=end
