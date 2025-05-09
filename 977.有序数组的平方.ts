/*
 * @lc app=leetcode.cn id=977 lang=typescript
 *
 * [977] 有序数组的平方
 *
 * 题目描述：
 * 给你一个按 非递减顺序 排序的整数数组 nums，返回 每个数字的平方 组成的新数组，要求也按 非递减顺序 排序。
 *
 * 要求：请你设计时间复杂度为 O(n) 的算法解决本问题。
 */

// @lc code=start
/**
 * 计算有序数组的平方，并保持结果有序
 * 时间复杂度：O(n)，其中n是数组长度
 * 空间复杂度：O(n)，用于存储结果数组
 *
 * @param nums 非递减顺序排序的整数数组
 * @returns 每个数字平方后按非递减顺序排序的数组
 */
function sortedSquares(nums: number[]): number[] {
  const n = nums.length;

  // 创建结果数组
  const result = new Array(n);

  // 使用双指针法：
  // left指向数组开始位置，right指向数组结束位置
  let left = 0;
  let right = n - 1;

  // 从后往前填充结果数组（从大到小）
  // i表示当前填充结果数组的位置
  for (let i = n - 1; i >= 0; i--) {
    // 比较左右指针指向的数的平方大小
    const leftSquare = nums[left] * nums[left];
    const rightSquare = nums[right] * nums[right];

    if (leftSquare > rightSquare) {
      // 如果左指针指向的数的平方更大，填入结果数组
      result[i] = leftSquare;
      // 左指针向右移动
      left++;
    } else {
      // 如果右指针指向的数的平方更大或相等，填入结果数组
      result[i] = rightSquare;
      // 右指针向左移动
      right--;
    }
  }

  return result;
}
// @lc code=end

/**
 * 解题思路：
 *
 * 1. 关键洞察：
 *    - 输入数组是有序的（非递减）
 *    - 但数组中可能包含负数，平方后的顺序会改变
 *    - 平方后，最大值只可能在数组的两端（最左或最右）
 *
 * 2. 双指针方法：
 *    - 使用两个指针，left从数组开始，right从数组结束
 *    - 比较两个指针指向的数的平方大小
 *    - 选择较大的平方值放入结果数组的末尾
 *    - 然后移动对应的指针（left向右或right向左）
 *    - 继续比较并填充结果数组，直到填满整个数组
 *
 * 3. 为什么是O(n)：
 *    - 每次比较只需O(1)时间
 *    - 每次操作后left或right会移动一次
 *    - 总共只需n次操作就能填满结果数组
 *    - 因此总时间复杂度为O(n)
 *
 * 4. 实现细节：
 *    - 从结果数组的末尾开始填充，确保结果有序
 *    - 不需要额外的排序操作，保证O(n)时间复杂度
 *
 * 5. 与常规方法的比较：
 *    - 常规方法1：先平方所有元素，再排序 - O(n log n)
 *    - 常规方法2：分别处理负数和非负数，再合并 - 复杂且容易出错
 *    - 双指针方法：直接利用数组原有的有序性，简洁且高效 - O(n)
 */
