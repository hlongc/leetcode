/*
 * @lc app=leetcode.cn id=628 lang=typescript
 *
 * [628] 三个数的最大乘积
 *
 * https://leetcode.cn/problems/maximum-product-of-three-numbers/description/
 *
 * algorithms
 * Easy (51.82%)
 * Likes:    504
 * Dislikes: 0
 * Total Accepted:    149.3K
 * Total Submissions: 288.2K
 * Testcase Example:  '[1,2,3]'
 *
 * 给你一个整型数组 nums ，在数组中找出由三个数组成的最大乘积，并输出这个乘积。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3]
 * 输出：6
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3,4]
 * 输出：24
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [-1,-2,-3]
 * 输出：-6
 *
 *
 *
 *
 * 提示：
 *
 *
 * 3
 * -1000
 *
 *
 */

// @lc code=start
function maximumProduct(nums: number[]): number {
  // 目标：选择三个数，使乘积最大。
  // 关键观察：最大乘积只可能来自两种组合：
  // 1) 三个最大的正数/绝对值最大的数：max1 * max2 * max3
  // 2) 两个最小（可能为负数绝对值大）与一个最大：min1 * min2 * max1
  // 因此一次遍历维护前三大的数与两最小的数即可。

  // 使用 -Infinity 和 +Infinity 进行初始化，确保第一次比较能被替换
  let max1 = -Infinity,
    max2 = -Infinity,
    max3 = -Infinity; // 三个最大
  let min1 = Infinity,
    min2 = Infinity; // 两个最小

  for (const x of nums) {
    // 维护最大三元组
    if (x >= max1) {
      max3 = max2;
      max2 = max1;
      max1 = x;
    } else if (x >= max2) {
      max3 = max2;
      max2 = x;
    } else if (x > max3) {
      max3 = x;
    }

    // 维护最小二元组
    if (x <= min1) {
      min2 = min1;
      min1 = x;
    } else if (x < min2) {
      min2 = x;
    }
  }

  const candidate1 = max1 * max2 * max3; // 三大相乘
  const candidate2 = min1 * min2 * max1; // 两小一大

  return Math.max(candidate1, candidate2);
}
// @lc code=end
