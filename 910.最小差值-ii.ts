/*
 * @lc app=leetcode.cn id=910 lang=typescript
 *
 * [910] 最小差值 II
 *
 * 给你一个整数数组 nums，和一个整数 k。
 * 可以选择将数组中的每个元素分别增加或减少 k。
 * 返回修改后的数组的最大值和最小值之间可能存在的最小差值。
 */

// @lc code=start
/**
 * 计算修改数组后可能的最小差值
 *
 * 思路：
 * 1. 排序数组
 * 2. 对于排序后的数组，最优策略是：让一部分小的数增大k，一部分大的数减小k
 * 3. 尝试所有可能的分割点，找出最小差值
 *
 * @param nums 整数数组
 * @param k 可以增加或减少的值
 * @returns 修改后的最小可能差值
 */
function smallestRangeII(nums: number[], k: number): number {
  // 特殊情况处理：如果数组长度为1，差值为0
  if (nums.length === 1) return 0;

  // 对数组进行排序
  nums.sort((a, b) => a - b);

  const n = nums.length;

  // 最初的差值（全部都加k或全部都减k的情况）
  let result = nums[n - 1] - nums[0];

  // 尝试所有可能的分割点
  // 我们考虑让前i个元素加k，后面的元素减k
  for (let i = 0; i < n - 1; i++) {
    // 如果前i个元素加k，后面的元素减k
    // 最大值可能是：max(nums[n-1] - k, nums[i] + k)
    // 最小值可能是：min(nums[0] + k, nums[i+1] - k)

    const maxVal = Math.max(nums[n - 1] - k, nums[i] + k);
    const minVal = Math.min(nums[0] + k, nums[i + 1] - k);

    // 更新最小差值
    result = Math.min(result, maxVal - minVal);
  }

  return result;
}

/**
 * 解题说明：
 *
 * 1. 首先，我们排序数组，这样便于分析元素的关系
 *
 * 2. 关键洞察：最优解一定是让一部分元素加k，一部分元素减k
 *    - 如果所有元素都加k或都减k，差值不变
 *    - 如果一部分加k，一部分减k，可能减小差值
 *
 * 3. 我们考虑一种情况：前i个元素加k，后面的元素减k
 *    - 当i=0时，相当于所有元素都减k
 *    - 当i=n-1时，相当于所有元素都加k
 *
 * 4. 对于每个分割点i：
 *    - nums[0...i]都加k
 *    - nums[i+1...n-1]都减k
 *    - 修改后的最大值：max(nums[n-1] - k, nums[i] + k)
 *    - 修改后的最小值：min(nums[0] + k, nums[i+1] - k)
 *
 * 5. 计算所有可能分割点得到的差值，取最小值
 *
 * 例如：nums = [1, 3, 6, 10], k = 2
 * 排序后：[1, 3, 6, 10]
 *
 * 初始差值：10 - 1 = 9
 *
 * i=0:
 *   前0个元素加k，后面减k
 *   最大值 = max(10-2, 1+2) = max(8, 3) = 8
 *   最小值 = min(1+2, 3-2) = min(3, 1) = 1
 *   差值 = 8 - 1 = 7
 *
 * i=1:
 *   前1个元素加k，后面减k
 *   最大值 = max(10-2, 3+2) = max(8, 5) = 8
 *   最小值 = min(1+2, 6-2) = min(3, 4) = 3
 *   差值 = 8 - 3 = 5
 *
 * i=2:
 *   前2个元素加k，后面减k
 *   最大值 = max(10-2, 6+2) = max(8, 8) = 8
 *   最小值 = min(1+2, 10-2) = min(3, 8) = 3
 *   差值 = 8 - 3 = 5
 *
 * 最小差值 = 5
 */

// @lc code=end
