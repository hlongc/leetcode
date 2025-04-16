/*
 * @lc app=leetcode.cn id=378 lang=typescript
 *
 * [378] 有序矩阵中第 K 小的元素
 */

/** 统计nums中存在多少个数 <= target */

// @lc code=start
/**
 * 计算矩阵中有多少个元素小于等于目标值
 * 利用矩阵行列有序的特性，从右上角开始统计
 * 时间复杂度：O(n)，其中n是矩阵的边长
 *
 * @param nums 有序矩阵
 * @param target 目标值
 * @returns 矩阵中小于等于target的元素个数
 */
const countTarget = (nums: number[][], target: number): number => {
  const n = nums.length;
  let row = 0; // 从第一行开始
  let col = n - 1; // 从最后一列开始
  let count = 0; // 计数器

  // 从右上角开始，向左下方遍历
  while (row < n && col >= 0) {
    if (target >= nums[row][col]) {
      // 如果当前元素 <= target，则这一行从[0,col]的元素都 <= target
      count += col + 1; // 将这一行的元素个数加入计数
      row++; // 继续下一行
    } else {
      // 如果当前元素 > target，需要向左移动，找更小的元素
      col--;
    }
  }

  return count;
};

/**
 * 查找矩阵中第k小的元素
 * 使用二分查找在值域范围内搜索
 * 时间复杂度：O(nlog(max-min))，其中max和min是矩阵中的最大值和最小值
 *  解题思路：
 * 1. 使用二分查找，但不是在矩阵的索引上二分，而是在矩阵的值域上二分
 * 2. 值域的范围是从矩阵左上角（最小值）到右下角（最大值）
 * 3. 对于每个猜测的值，计算矩阵中小于等于该值的元素个数
 * 4. 通过比较这个个数和k的关系，调整二分查找的范围
 *
 * @param matrix n x n的有序矩阵
 * @param k 要找第k小的元素
 * @returns 第k小的元素值
 */
function kthSmallest(matrix: number[][], k: number): number {
  const n = matrix.length;
  // 二分查找的范围是矩阵的值域：[左上角元素, 右下角元素]
  let low = matrix[0][0],
    high = matrix[n - 1][n - 1];

  // 在值域范围内进行二分查找
  while (low <= high) {
    const mid = low + ((high - low) >> 1); // 防止溢出的中间值计算
    // 计算矩阵中有多少个元素小于等于mid
    const count = countTarget(matrix, mid);

    if (count < k) {
      // 如果小于等于mid的元素个数小于k
      // 说明第k小的元素比mid大，在右半部分
      low = mid + 1;
    } else {
      // 如果小于等于mid的元素个数大于等于k
      // 说明第k小的元素小于等于mid，在左半部分
      high = mid - 1;
    }
  }

  // 最终low就是第k小的元素
  // 为什么是low而不是high？
  // 因为我们要找的是第k小的数，当count==k时，
  // 我们需要确保找到的是矩阵中真实存在的数
  return low;
}
// @lc code=end
