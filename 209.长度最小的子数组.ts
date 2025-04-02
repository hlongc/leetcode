/*
 * @lc app=leetcode.cn id=209 lang=typescript
 *
 * [209] 长度最小的子数组
 *
 * 给定一个含有 n 个正整数的数组和一个正整数 target。
 * 找出该数组中满足其和 ≥ target 的长度最小的 连续子数组，并返回其长度。
 * 如果不存在符合条件的子数组，返回 0。
 */

// @lc code=start
function minSubArrayLen1(target: number, nums: number[]): number {
  const n = nums.length;

  // 特殊情况处理
  if (n === 0) return 0;

  // 构建前缀和数组，sums[i] 表示 nums[0] 到 nums[i-1] 的和
  // sums[0] = 0 表示空数组的和
  const sums: number[] = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    sums[i] = sums[i - 1] + nums[i - 1];
  }

  // 初始化最小长度为无穷大
  let minLen = Infinity;

  // 对于每个起始位置，使用二分查找找到满足条件的最小结束位置
  for (let i = 0; i < n; i++) {
    // 需要找到 sums[j] 满足 sums[j] - sums[i] >= target
    // 即 sums[j] >= target + sums[i]
    const targetSum = target + sums[i];

    // 二分查找第一个大于等于 targetSum 的位置
    let left = i;
    let right = n;

    while (left <= right) {
      const mid = left + Math.floor((right - left) / 2);
      if (sums[mid] >= targetSum) {
        // 找到了一个满足条件的位置，尝试缩小右边界继续查找
        right = mid - 1;
      } else {
        // 不满足条件，增大左边界
        left = mid + 1;
      }
    }

    // 如果 left <= n，表示找到了满足条件的子数组
    if (left <= n) {
      // 更新最小长度，left 指向的是满足条件的第一个位置
      minLen = Math.min(minLen, left - i);
    }
  }

  // 如果没有找到满足条件的子数组，返回 0
  return minLen === Infinity ? 0 : minLen;
}

function minSubArrayLen(target: number, nums: number[]): number {
  const n = nums.length;

  // 特殊情况处理
  if (n === 0) return 0;

  // 初始化窗口的左右边界
  let left = 0;
  let right = 0;

  // 当前窗口内元素之和
  let sum = 0;

  // 最小子数组长度，初始为正无穷
  let minLen = Infinity;

  // 滑动窗口过程
  while (right < n) {
    // 扩大窗口，将右边界的元素纳入窗口
    sum += nums[right];

    // 当窗口内元素和大于等于目标值时，尝试收缩左边界
    while (sum >= target) {
      // 更新最小长度
      minLen = Math.min(minLen, right - left + 1);

      // 缩小窗口，将左边界的元素移出窗口
      sum -= nums[left];
      left++;
    }

    // 继续扩大右边界
    right++;
  }

  // 如果没有找到满足条件的子数组，返回0
  return minLen === Infinity ? 0 : minLen;
}
// @lc code=end
