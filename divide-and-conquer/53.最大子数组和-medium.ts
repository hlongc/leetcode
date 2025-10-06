/*
 * @lc app=leetcode.cn id=53 lang=typescript
 *
 * [53] 最大子数组和
 *
 * https://leetcode.cn/problems/maximum-subarray/description/
 *
 * algorithms
 * Medium (56.36%)
 * Likes:    7152
 * Dislikes: 0
 * Total Accepted:    2.3M
 * Total Submissions: 4.1M
 * Testcase Example:  '[-2,1,-3,4,-1,2,1,-5,4]'
 *
 * 给你一个整数数组 nums ，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。
 *
 * 子数组 是数组中的一个连续部分。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [-2,1,-3,4,-1,2,1,-5,4]
 * 输出：6
 * 解释：连续子数组 [4,-1,2,1] 的和最大，为 6 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1]
 * 输出：1
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [5,4,-1,7,8]
 * 输出：23
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * -10^4 <= nums[i] <= 10^4
 *
 *
 *
 *
 * 进阶：如果你已经实现复杂度为 O(n) 的解法，尝试使用更为精妙的 分治法 求解。
 *
 */

// @lc code=start

/**
 * 解法1：暴力解法 - 枚举所有子数组
 * 时间复杂度：O(n³)
 * 空间复杂度：O(1)
 * 思路：枚举所有可能的子数组，计算每个子数组的和，取最大值
 */
function maxSubArrayBruteForce(nums: number[]): number {
  const n = nums.length;
  let maxSum = nums[0]; // 初始化最大和为第一个元素

  // 枚举所有可能的子数组起始位置
  for (let i = 0; i < n; i++) {
    // 枚举所有可能的子数组结束位置
    for (let j = i; j < n; j++) {
      let currentSum = 0;
      // 计算从i到j的子数组和
      for (let k = i; k <= j; k++) {
        currentSum += nums[k];
      }
      // 更新最大和
      maxSum = Math.max(maxSum, currentSum);
    }
  }

  return maxSum;
}

/**
 * 解法2：优化的暴力解法 - 前缀和优化
 * 时间复杂度：O(n²)
 * 空间复杂度：O(1)
 * 思路：使用前缀和避免重复计算子数组和
 */
function maxSubArrayOptimizedBrute(nums: number[]): number {
  const n = nums.length;
  let maxSum = nums[0];

  // 枚举所有子数组
  for (let i = 0; i < n; i++) {
    let currentSum = 0;
    // 从位置i开始，逐步扩展子数组
    for (let j = i; j < n; j++) {
      currentSum += nums[j]; // 累加当前元素
      maxSum = Math.max(maxSum, currentSum); // 更新最大和
    }
  }

  return maxSum;
}

/**
 * 解法3：动态规划 - Kadane算法（最优解）
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 * 思路：dp[i]表示以第i个元素结尾的最大子数组和
 * 状态转移：dp[i] = max(nums[i], dp[i-1] + nums[i])
 * 核心思想：如果前面的子数组和为负数，不如重新开始
 */
function maxSubArrayDP(nums: number[]): number {
  const n = nums.length;
  let maxSum = nums[0]; // 全局最大和
  let currentSum = nums[0]; // 当前子数组和

  for (let i = 1; i < n; i++) {
    // 如果前面的子数组和为负数，重新开始
    // 否则继续累加当前元素
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    // 更新全局最大和
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

/**
 * 解法4：分治法
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(log n) - 递归栈空间
 * 思路：将数组分成左右两部分，最大子数组要么在左半部分，要么在右半部分，要么跨越中点
 */
function maxSubArrayDivideConquer(nums: number[]): number {
  return divideAndConquer(nums, 0, nums.length - 1);
}

function divideAndConquer(nums: number[], left: number, right: number): number {
  // 递归终止条件：只有一个元素
  if (left === right) {
    return nums[left];
  }

  // 分治：找到中点
  const mid = Math.floor((left + right) / 2);

  // 递归求解左半部分的最大子数组和
  const leftMax = divideAndConquer(nums, left, mid);
  // 递归求解右半部分的最大子数组和
  const rightMax = divideAndConquer(nums, mid + 1, right);
  // 求解跨越中点的最大子数组和
  const crossMax = maxCrossingSum(nums, left, mid, right);

  // 返回三者中的最大值
  return Math.max(leftMax, rightMax, crossMax);
}

function maxCrossingSum(
  nums: number[],
  left: number,
  mid: number,
  right: number
): number {
  // 从中点向左扩展，找到最大和
  let leftSum = Number.MIN_SAFE_INTEGER;
  let sum = 0;
  for (let i = mid; i >= left; i--) {
    sum += nums[i];
    leftSum = Math.max(leftSum, sum);
  }

  // 从中点向右扩展，找到最大和
  let rightSum = Number.MIN_SAFE_INTEGER;
  sum = 0;
  for (let i = mid + 1; i <= right; i++) {
    sum += nums[i];
    rightSum = Math.max(rightSum, sum);
  }

  // 返回跨越中点的最大子数组和
  return leftSum + rightSum;
}

/**
 * 解法5：前缀和 + 最小前缀和
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 * 思路：子数组和 = 前缀和[j] - 前缀和[i-1]
 * 要最大化子数组和，就要最小化前缀和[i-1]
 */
function maxSubArrayPrefixSum(nums: number[]): number {
  const n = nums.length;
  let maxSum = nums[0];
  let prefixSum = 0; // 当前前缀和
  let minPrefixSum = 0; // 最小前缀和

  for (let i = 0; i < n; i++) {
    prefixSum += nums[i];
    // 当前子数组和 = 当前前缀和 - 最小前缀和
    maxSum = Math.max(maxSum, prefixSum - minPrefixSum);
    // 更新最小前缀和
    minPrefixSum = Math.min(minPrefixSum, prefixSum);
  }

  return maxSum;
}

/**
 * 解法6：贪心算法
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 * 思路：如果当前子数组和为负数，立即放弃，重新开始
 */
function maxSubArrayGreedy(nums: number[]): number {
  const n = nums.length;
  let maxSum = nums[0];
  let currentSum = nums[0];

  for (let i = 1; i < n; i++) {
    // 如果当前子数组和为负数，重新开始
    if (currentSum < 0) {
      currentSum = nums[i];
    } else {
      // 否则继续累加
      currentSum += nums[i];
    }
    // 更新最大和
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

// 主函数 - 使用最优解法（动态规划）
function maxSubArray(nums: number[]): number {
  return maxSubArrayDP(nums);
}

// 测试函数（注释掉以避免TypeScript错误）
/*
function testAllSolutions() {
    const testCases = [
        [-2, 1, -3, 4, -1, 2, 1, -5, 4], // 期望输出: 6
        [1], // 期望输出: 1
        [5, 4, -1, 7, 8], // 期望输出: 23
        [-1], // 期望输出: -1
        [-2, -1], // 期望输出: -1
    ];
    
    console.log("测试所有解法：");
    testCases.forEach((testCase, index) => {
        console.log(`\n测试用例 ${index + 1}: [${testCase.join(', ')}]`);
        console.log(`暴力解法: ${maxSubArrayBruteForce(testCase)}`);
        console.log(`优化暴力: ${maxSubArrayOptimizedBrute(testCase)}`);
        console.log(`动态规划: ${maxSubArrayDP(testCase)}`);
        console.log(`分治法: ${maxSubArrayDivideConquer(testCase)}`);
        console.log(`前缀和: ${maxSubArrayPrefixSum(testCase)}`);
        console.log(`贪心法: ${maxSubArrayGreedy(testCase)}`);
    });
}
*/

// @lc code=end
