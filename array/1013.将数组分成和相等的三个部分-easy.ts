/*
 * @lc app=leetcode.cn id=1013 lang=typescript
 *
 * [1013] 将数组分成和相等的三个部分
 *
 * https://leetcode.cn/problems/partition-array-into-three-parts-with-equal-sum/description/
 *
 * algorithms
 * Easy (38.48%)
 * Likes:    217
 * Dislikes: 0
 * Total Accepted:    69K
 * Total Submissions: 179.2K
 * Testcase Example:  '[0,2,1,-6,6,-7,9,1,2,0,1]'
 *
 * 给你一个整数数组 arr，只有可以将其划分为三个和相等的 非空 部分时才返回 true，否则返回 false。
 *
 * 形式上，如果可以找出索引 i + 1 < j 且满足 (arr[0] + arr[1] + ... + arr[i] == arr[i + 1] +
 * arr[i + 2] + ... + arr[j - 1] == arr[j] + arr[j + 1] + ... + arr[arr.length
 * - 1]) 就可以将数组三等分。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：arr = [0,2,1,-6,6,-7,9,1,2,0,1]
 * 输出：true
 * 解释：0 + 2 + 1 = -6 + 6 - 7 + 9 + 1 = 2 + 0 + 1
 *
 *
 * 示例 2：
 *
 *
 * 输入：arr = [0,2,1,-6,6,7,9,-1,2,0,1]
 * 输出：false
 *
 *
 * 示例 3：
 *
 *
 * 输入：arr = [3,3,6,5,-2,2,5,1,-9,4]
 * 输出：true
 * 解释：3 + 3 = 6 = 5 - 2 + 2 + 5 + 1 - 9 + 4
 *
 *
 *
 *
 * 提示：
 *
 *
 * 3
 * -10^4
 *
 *
 */

// @lc code=start
/**
 * 解题思路：单次遍历计数法
 * 1. 首先计算数组总和，如果总和不能被3整除，直接返回false
 * 2. 计算目标和 = 总和 / 3
 * 3. 从左到右遍历数组，累加当前和：
 *    - 每当累加和等于目标和时，计数器+1，并重置累加和为0
 *    - 如果能找到至少2个这样的部分，剩余的部分和必然也等于目标和
 * 4. 注意：为了确保三个部分都非空，最后一个元素不参与计数
 *    （因为如果前面已经找到2个部分，最后剩余的自动成为第3部分）
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function canThreePartsEqualSum(arr: number[]): boolean {
  const n = arr.length;

  // 计算数组总和
  const totalSum = arr.reduce((memo, cur) => memo + cur, 0);

  // 如果总和不能被3整除，无法分成三等份
  if (totalSum % 3 !== 0) return false;

  // 每部分的目标和
  const targetSum = totalSum / 3;

  let currentSum = 0; // 当前累加和
  let count = 0; // 找到的部分数量

  // 遍历数组，注意最后一个元素不参与计数
  // 因为我们只需要找到前两个部分，第三部分自动确定
  for (let i = 0; i < n - 1; i++) {
    currentSum += arr[i];

    // 如果当前累加和等于目标和，说明找到了一个部分
    if (currentSum === targetSum) {
      count++; // 部分计数+1
      currentSum = 0; // 重置累加和，开始累加下一部分

      // 如果已经找到了两个部分，说明可以分成三部分
      // 因为剩余元素的和必然等于 totalSum - 2*targetSum = targetSum
      if (count === 2) {
        return true;
      }
    }
  }

  // 如果遍历完成后没找到两个部分，返回false
  return false;
}
// @lc code=end
