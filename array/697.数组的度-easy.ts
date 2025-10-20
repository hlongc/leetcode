/*
 * @lc app=leetcode.cn id=697 lang=typescript
 *
 * [697] 数组的度
 *
 * https://leetcode.cn/problems/degree-of-an-array/description/
 *
 * algorithms
 * Easy (59.25%)
 * Likes:    528
 * Dislikes: 0
 * Total Accepted:    113.8K
 * Total Submissions: 192.1K
 * Testcase Example:  '[1,2,2,3,1]'
 *
 * 给定一个非空且只包含非负数的整数数组 nums，数组的 度 的定义是指数组里任一元素出现频数的最大值。
 *
 * 你的任务是在 nums 中找到与 nums 拥有相同大小的度的最短连续子数组，返回其长度。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,2,3,1]
 * 输出：2
 * 解释：
 * 输入数组的度是 2 ，因为元素 1 和 2 的出现频数最大，均为 2 。
 * 连续子数组里面拥有相同度的有如下所示：
 * [1, 2, 2, 3, 1], [1, 2, 2, 3], [2, 2, 3, 1], [1, 2, 2], [2, 2, 3], [2, 2]
 * 最短连续子数组 [2, 2] 的长度为 2 ，所以返回 2 。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,2,3,1,4,2]
 * 输出：6
 * 解释：
 * 数组的度是 3 ，因为元素 2 重复出现 3 次。
 * 所以 [2,2,3,1,4,2] 是最短子数组，因此返回 6 。
 *
 *
 *
 *
 * 提示：
 *
 *
 * nums.length 在 1 到 50,000 范围内。
 * nums[i] 是一个在 0 到 49,999 范围内的整数。
 *
 *
 */

// @lc code=start
/**
 * 解法：哈希表 + 一次遍历
 *
 * 算法思路：
 * 1. 数组的"度"定义为：数组中任一元素出现频数的最大值
 * 2. 目标：找到与原数组拥有相同度的最短连续子数组
 * 3. 关键观察：
 *    - 拥有相同度的子数组必须包含所有出现频数最高的元素
 *    - 对于频数最高的元素，最短子数组就是从它第一次出现到最后一次出现的区间
 * 4. 实现步骤：
 *    - 使用哈希表记录每个元素的出现次数、首次出现位置、最后出现位置
 *    - 找出所有频数最高的元素
 *    - 计算这些元素的首尾位置之间的最短距离
 *
 * 示例演示 [1,2,2,3,1]：
 * 元素1: 出现2次，首次位置0，最后位置4，长度=4-0+1=5
 * 元素2: 出现2次，首次位置1，最后位置2，长度=2-1+1=2
 * 元素3: 出现1次
 * 度为2，最短长度为2
 *
 * 时间复杂度：O(n)，遍历数组两次（一次统计，一次查找）
 * 空间复杂度：O(n)，哈希表存储每个元素的信息
 */
function findShortestSubArray(nums: number[]): number {
  // 边界处理：单元素数组的度为1，长度也为1
  if (nums.length === 1) {
    return 1;
  }

  // 使用 Map 存储每个数字的统计信息
  // key: 数字本身
  // value: { count: 出现次数, first: 首次出现的索引, last: 最后出现的索引 }
  const map = new Map<number, { count: number; first: number; last: number }>();

  // 第一次遍历：统计每个数字的出现次数和位置信息
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    if (map.has(num)) {
      // 数字已存在：更新出现次数和最后出现位置
      const info = map.get(num)!;
      info.count++;
      info.last = i;
    } else {
      // 数字首次出现：初始化统计信息
      map.set(num, {
        count: 1, // 出现次数为1
        first: i, // 首次出现位置
        last: i, // 最后出现位置（初始与首次相同）
      });
    }
  }

  // 找出数组的度（最大出现频数）
  let degree = 0;
  for (const info of map.values()) {
    degree = Math.max(degree, info.count);
  }

  // 第二次遍历：在所有频数等于度的元素中，找到最短的子数组长度
  let minLength = nums.length; // 初始化为数组总长度

  for (const info of map.values()) {
    // 只考虑出现次数等于度的元素
    if (info.count === degree) {
      // 计算从首次出现到最后出现的子数组长度
      // 长度 = 最后位置 - 首次位置 + 1
      const length = info.last - info.first + 1;
      minLength = Math.min(minLength, length);
    }
  }

  return minLength;
}
// @lc code=end
