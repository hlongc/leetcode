/*
 * @lc app=leetcode.cn id=941 lang=typescript
 *
 * [941] 有效的山脉数组
 *
 * https://leetcode.cn/problems/valid-mountain-array/description/
 *
 * algorithms
 * Easy (40.16%)
 * Likes:    251
 * Dislikes: 0
 * Total Accepted:    103K
 * Total Submissions: 256.4K
 * Testcase Example:  '[2,1]'
 *
 * 给定一个整数数组 arr，如果它是有效的山脉数组就返回 true，否则返回 false。
 *
 * 让我们回顾一下，如果 arr 满足下述条件，那么它是一个山脉数组：
 *
 *
 * arr.length >= 3
 * 在 0 < i < arr.length - 1 条件下，存在 i 使得：
 *
 * arr[0] < arr[1] < ... arr[i-1] < arr[i]
 * arr[i] > arr[i+1] > ... > arr[arr.length - 1]
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：arr = [2,1]
 * 输出：false
 *
 *
 * 示例 2：
 *
 *
 * 输入：arr = [3,5,5]
 * 输出：false
 *
 *
 * 示例 3：
 *
 *
 * 输入：arr = [0,3,2,1]
 * 输出：true
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= arr.length <= 10^4
 * 0 <= arr[i] <= 10^4
 *
 *
 */

// @lc code=start
/**
 * 解法一：单次遍历（双指针思想）
 *
 * 思路：
 * 1. 山脉数组必须先严格上升，再严格下降
 * 2. 峰值不能在两端（必须有上升和下降阶段）
 * 3. 从左边开始，一直上升找到峰值
 * 4. 从峰值开始，一直下降到末尾
 * 5. 检查是否满足所有条件
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function validMountainArray1(arr: number[]): boolean {
  const n = arr.length;

  // 1. 长度必须至少为 3
  if (n < 3) return false;

  // 2. 从左边开始找峰值：一直上升
  let i = 0;
  while (i < n - 1 && arr[i] < arr[i + 1]) {
    i++;
  }

  // 3. 检查峰值是否在两端
  // 如果 i === 0，说明从第一个元素就开始下降了，没有上升阶段
  // 如果 i === n - 1，说明一直上升到最后，没有下降阶段
  if (i === 0 || i === n - 1) {
    return false;
  }

  // 4. 从峰值开始向右：必须一直下降
  while (i < n - 1 && arr[i] > arr[i + 1]) {
    i++;
  }

  // 5. 检查是否遍历到了数组末尾
  // 如果 i === n - 1，说明成功从头到尾完成了 "上升-下降" 的过程
  // 如果 i < n - 1，说明中间有相等的元素或者又开始上升了
  return i === n - 1;
}

/**
 * 解法二：左右双指针
 *
 * 思路：
 * 1. 左指针从左边上山，找到左边的峰值
 * 2. 右指针从右边上山，找到右边的峰值
 * 3. 如果两个峰值是同一个点，且不在两端，则是有效山脉
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function validMountainArray(arr: number[]): boolean {
  const n = arr.length;

  // 长度检查
  if (n < 3) return false;

  // 左指针：从左边上山
  let left = 0;
  while (left < n - 1 && arr[left] < arr[left + 1]) {
    left++;
  }

  // 右指针：从右边上山
  let right = n - 1;
  while (right > 0 && arr[right] < arr[right - 1]) {
    right--;
  }

  // 检查：
  // 1. left 和 right 必须相等（在同一个峰值相遇）
  // 2. 峰值不能在两端（left > 0 且 left < n - 1）
  return left === right && left > 0 && left < n - 1;
}

/**
 * 测试用例分析：
 *
 * [2,1]          -> false  (长度 < 3)
 * [3,5,5]        -> false  (有相等元素，不是严格递增/递减)
 * [0,3,2,1]      -> true   (先升后降，峰值在索引1)
 * [0,1,2,3,4,5]  -> false  (只有上升，没有下降)
 * [5,4,3,2,1,0]  -> false  (只有下降，没有上升)
 * [0,2,1,3]      -> false  (先升后降再升，不是山脉)
 * [0,1,2,1,2]    -> false  (有多个峰值)
 */
// @lc code=end
