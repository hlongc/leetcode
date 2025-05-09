/*
 * @lc app=leetcode.cn id=152 lang=typescript
 *
 * [152] 乘积最大子数组
 */

// @lc code=start
function maxProduct(nums: number[]): number {
  // 如果数组为空，直接返回0
  if (nums.length === 0) return 0;

  // 初始化结果为数组第一个元素
  let result = nums[0];

  // maxValue记录当前位置的最大乘积
  // minValue记录当前位置的最小乘积（用于处理负数情况）
  let maxValue = nums[0];
  let minValue = nums[0];

  // 从第二个元素开始遍历
  for (let i = 1; i < nums.length; i++) {
    // 需要先保存maxValue的值，因为在计算minValue时会用到
    const tmp = maxValue;

    // 当前位置的最大乘积可能来自以下三种情况：
    // 1. 当前数字本身（重新开始子数组）
    // 2. 当前数字与之前最大乘积的乘积（之前乘积为正数）
    // 3. 当前数字与之前最小乘积的乘积（当前数字和之前乘积都为负数时）
    maxValue = Math.max(nums[i], maxValue * nums[i], minValue * nums[i]);

    // 同理，当前位置的最小乘积也来自于三种情况
    // 注意：这里使用的是更新前的maxValue值(tmp)
    minValue = Math.min(nums[i], tmp * nums[i], minValue * nums[i]);

    // 更新全局最大值
    result = Math.max(result, maxValue);
  }

  return result;
}
// @lc code=end
