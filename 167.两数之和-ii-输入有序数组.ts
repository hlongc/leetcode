/*
 * @lc app=leetcode.cn id=167 lang=typescript
 *
 * [167] 两数之和 II - 输入有序数组
 *
 * 给你一个下标从 1 开始的整数数组 numbers ，该数组已按 非递减顺序排列。
 * 请你从数组中找出满足相加之和等于目标数 target 的两个数。
 * 如果设这两个数分别是 numbers[index1] 和 numbers[index2] ，则 1 <= index1 < index2 <= numbers.length。
 * 以长度为 2 的整数数组 [index1, index2] 的形式返回这两个整数的下标 index1 和 index2。
 * 你可以假设每个输入 只对应唯一的答案 ，而且你 不可以 重复使用相同的元素。
 */

// @lc code=start
function twoSum(numbers: number[], target: number): number[] {
  // 使用双指针技巧，一个指针从数组开始，一个从数组末尾
  let [left, right] = [0, numbers.length - 1];

  // 当左指针小于右指针时循环继续
  while (left < right) {
    // 计算当前两个指针指向的元素之和
    const sum = numbers[left] + numbers[right];

    if (sum > target) {
      // 当前和大于目标值，需要减小和
      // 由于数组已排序，右移右指针可以得到更小的和
      right--;
    } else if (sum < target) {
      // 当前和小于目标值，需要增大和
      // 由于数组已排序，左移左指针可以得到更大的和
      left++;
    } else {
      // 找到了目标和
      // 注意：题目要求返回的索引从1开始，所以这里+1
      return [left + 1, right + 1];
    }
  }

  // 如果没有找到满足条件的两个数（题目保证有解，所以不会执行到这里）
  return [-1, -1];
}
// @lc code=end
