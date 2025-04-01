/*
 * @lc app=leetcode.cn id=4 lang=typescript
 *
 * [4] 寻找两个正序数组的中位数
 *
 * 给定两个大小分别为 m 和 n 的正序（从小到大）数组 nums1 和 nums2。
 * 请你找出并返回这两个正序数组的 中位数 。
 * 要求算法的时间复杂度为 O(log (m+n))
 */

// @lc code=start
function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  // 获取两个数组的长度
  const len1 = nums1.length,
    len2 = nums2.length;

  // 确保 nums1 是较短的数组，这样可以减少二分查找的次数
  // 如果 nums1 较长，则交换两个数组
  if (len1 > len2) return findMedianSortedArrays(nums2, nums1);

  // 计算两个数组的总长度
  let len = len1 + len2;

  // 二分查找的上下界
  let start = 0, // nums1 分割线的最左可能位置
    end = len1; // nums1 分割线的最右可能位置

  // 两个数组的分割位置
  let partLen1 = 0, // nums1 数组的分割位置
    partLen2 = 0; // nums2 数组的分割位置

  // 二分查找，寻找合适的分割位置
  // 使用 <= 而不是 < 是为了处理单个元素的情况
  // 当 start = end 时，我们仍需检查这个位置是否是答案
  while (start <= end) {
    // 计算 nums1 的分割位置（使用位运算 >> 1 相当于除以2，提高效率）
    partLen1 = (start + end) >> 1;

    // 计算 nums2 的分割位置
    // 这里的 +1 非常关键，用于处理总长度为奇数的情况：
    // - 如果总长度为奇数，我们希望左半部分多一个元素（中位数在左半部分）
    // - (len + 1) >> 1 在奇数长度时会向上取整，确保左半部分包含中位数
    // - 例如：长度为5时，(5+1)/2=3，左半部分有3个元素，右半部分有2个元素
    partLen2 = ((len + 1) >> 1) - partLen1;

    // 获取分割线左右的四个元素
    // L1: nums1 分割线左边的元素
    // 这里的 -1 是因为 partLen1 表示分割线位置（右半部分的第一个元素）
    // 左半部分的最后一个元素应该是 partLen1-1
    // 当 partLen1=0 时，表示分割线在最左边，没有左半部分元素，用 -Infinity 表示
    let L1 = partLen1 === 0 ? -Infinity : nums1[partLen1 - 1];

    // L2: nums2 分割线左边的元素，同理
    let L2 = partLen2 === 0 ? -Infinity : nums2[partLen2 - 1];

    // R1: nums1 分割线右边的元素
    // 当 partLen1=len1 时，分割线在最右边，右半部分没有元素，用 Infinity 表示
    let R1 = partLen1 === len1 ? Infinity : nums1[partLen1];

    // R2: nums2 分割线右边的元素，同理
    let R2 = partLen2 === len2 ? Infinity : nums2[partLen2];

    // 如果 L1 > R2，说明 nums1 的分割线需要左移
    // 这里的 -1 表示将搜索空间缩小到 [start, partLen1-1]
    if (L1 > R2) {
      end = partLen1 - 1;
    }
    // 如果 L2 > R1，说明 nums1 的分割线需要右移
    // 这里的 +1 表示将搜索空间缩小到 [partLen1+1, end]
    else if (L2 > R1) {
      start = partLen1 + 1;
    }
    // 找到了合适的分割位置，满足：L1 <= R2 且 L2 <= R1
    else {
      // 根据总长度的奇偶性返回中位数
      // 这里的判断与前面的 (len + 1) >> 1 计算紧密相关：
      // - 长度为偶数：中位数是左半部分最大值和右半部分最小值的平均值
      // - 长度为奇数：由于设计让左半部分多一个元素，中位数就是左半部分的最大值
      return len % 2 === 0
        ? (Math.max(L1, L2) + Math.min(R1, R2)) / 2 // 长度为偶数，取中间两个数的平均值
        : Math.max(L1, L2); // 长度为奇数，取左半部分的最大值
    }
  }

  // 理论上不会执行到这里，除非输入有问题
  return 0;
}
// @lc code=end
