/*
 * @lc app=leetcode.cn id=611 lang=typescript
 *
 * [611] 有效三角形的个数
 *
 * https://leetcode.cn/problems/valid-triangle-number/description/
 *
 * algorithms
 * Medium (55.37%)
 * Likes:    686
 * Dislikes: 0
 * Total Accepted:    151.4K
 * Total Submissions: 273.3K
 * Testcase Example:  '[2,2,3,4]'
 *
 * 给定一个包含非负整数的数组 nums ，返回其中可以组成三角形三条边的三元组个数。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [2,2,3,4]
 * 输出: 3
 * 解释:有效的组合是:
 * 2,3,4 (使用第一个 2)
 * 2,3,4 (使用第二个 2)
 * 2,2,3
 *
 *
 * 示例 2:
 *
 *
 * 输入: nums = [4,2,3,4]
 * 输出: 4
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= nums.length <= 1000
 * 0 <= nums[i] <= 1000
 *
 *
 */

// @lc code=start
function triangleNumber(nums: number[]): number {
  // 排序是关键：若 a <= b <= c，判定是否能构成三角形只需检查 a + b > c
  nums.sort((a, b) => a - b);

  let count = 0;
  const n = nums.length;

  // 固定最大边 c 的下标 k，从右往左遍历
  for (let k = n - 1; k >= 2; k--) {
    // 使用双指针在 [0, k-1] 内寻找满足 a + b > c 的配对数
    let i = 0; // 指向最小边 a
    let j = k - 1; // 指向中间边 b

    while (i < j) {
      // 因为已排序：nums[i] <= nums[j] <= nums[k]
      if (nums[i] + nums[j] > nums[k]) {
        // 若当前 a + b > c，则对所有 a' ∈ [i, j-1] 也有 a' + b > c
        // 因为 a' >= nums[i]，因此可以一次性计入 j - i 个三元组
        count += j - i;
        j--; // 收缩 b，尝试更小的 b，寻找更多组合
      } else {
        // 否则需要增大 a
        i++;
      }
    }
  }

  return count;
}

// @lc code=end
