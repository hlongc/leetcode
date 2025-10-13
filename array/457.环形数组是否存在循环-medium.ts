/*
 * @lc app=leetcode.cn id=457 lang=typescript
 *
 * [457] 环形数组是否存在循环
 *
 * https://leetcode.cn/problems/circular-array-loop/description/
 *
 * algorithms
 * Medium (43.83%)
 * Likes:    220
 * Dislikes: 0
 * Total Accepted:    41.1K
 * Total Submissions: 93.7K
 * Testcase Example:  '[2,-1,1,2,2]'
 *
 * 存在一个不含 0 的 环形 数组 nums ，每个 nums[i] 都表示位于下标 i 的角色应该向前或向后移动的下标个数：
 *
 *
 * 如果 nums[i] 是正数，向前（下标递增方向）移动 |nums[i]| 步
 * 如果 nums[i] 是负数，向后（下标递减方向）移动 |nums[i]| 步
 *
 *
 * 因为数组是 环形 的，所以可以假设从最后一个元素向前移动一步会到达第一个元素，而第一个元素向后移动一步会到达最后一个元素。
 *
 * 数组中的 循环 由长度为 k 的下标序列 seq 标识：
 *
 *
 * 遵循上述移动规则将导致一组重复下标序列 seq[0] -> seq[1] -> ... -> seq[k - 1] -> seq[0] ->
 * ...
 * 所有 nums[seq[j]] 应当不是 全正 就是 全负
 * k > 1
 *
 *
 * 如果 nums 中存在循环，返回 true ；否则，返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [2,-1,1,2,2]
 * 输出：true
 * 解释：图片展示了节点间如何连接。白色节点向前跳跃，而红色节点向后跳跃。
 * 我们可以看到存在循环，按下标 0 -> 2 -> 3 -> 0 --> ...，并且其中的所有节点都是白色（以相同方向跳跃）。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [-1,-2,-3,-4,-5,6]
 * 输出：false
 * 解释：图片展示了节点间如何连接。白色节点向前跳跃，而红色节点向后跳跃。
 * 唯一的循环长度为 1，所以返回 false。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [1,-1,5,1,4]
 * 输出：true
 * 解释：图片展示了节点间如何连接。白色节点向前跳跃，而红色节点向后跳跃。
 * 我们可以看到存在循环，按下标 0 --> 1 --> 0 --> ...，当它的大小大于 1 时，它有一个向前跳的节点和一个向后跳的节点，所以
 * 它不是一个循环。
 * 我们可以看到存在循环，按下标 3 --> 4 --> 3 --> ...，并且其中的所有节点都是白色（以相同方向跳跃）。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 5000
 * -1000 <= nums[i] <= 1000
 * nums[i] != 0
 *
 *
 *
 *
 * 进阶：你能设计一个时间复杂度为 O(n) 且额外空间复杂度为 O(1) 的算法吗？
 *
 */

// @lc code=start
function circularArrayLoop(nums: number[]): boolean {
  const n = nums.length;

  // 遍历数组中的每个位置作为起始点
  for (let i = 0; i < n; i++) {
    // 如果当前位置的值为0，说明已经访问过，跳过
    if (nums[i] === 0) continue;

    // 使用快慢指针检测循环
    let slow = i; // 慢指针
    let fast = i; // 快指针

    // 判断当前方向（正数向前，负数向后）
    const direction = nums[i] > 0;

    // 使用do-while循环确保至少执行一次
    do {
      // 移动慢指针一步
      slow = getNextIndex(slow, nums[slow], n);

      // 移动快指针两步
      fast = getNextIndex(fast, nums[fast], n);
      fast = getNextIndex(fast, nums[fast], n);

      // 检查是否遇到0（已访问过的位置）或者方向改变
      if (nums[slow] === 0 || nums[fast] === 0) break;
      if (nums[slow] > 0 !== direction || nums[fast] > 0 !== direction) break;
    } while (slow !== fast);

    // 如果快慢指针相遇，说明存在循环
    if (slow === fast) {
      // 检查循环长度是否大于1
      let cycleLength = 0;
      let current = slow;
      const cycleDirection = nums[slow] > 0;

      do {
        // 检查方向是否一致
        if (nums[current] > 0 !== cycleDirection) break;

        current = getNextIndex(current, nums[current], n);
        cycleLength++;

        // 如果循环长度大于数组长度，说明存在循环
        if (cycleLength > n) return true;
      } while (current !== slow);

      // 如果循环长度大于1，返回true
      if (cycleLength > 1) return true;
    }

    // 标记已访问的位置为0，避免重复检查
    let current = i;
    while (nums[current] !== 0) {
      const next = getNextIndex(current, nums[current], n);
      nums[current] = 0;
      current = next;
    }
  }

  return false;
}

/**
 * 计算下一个索引位置
 * @param current 当前位置
 * @param step 移动步数（正数向前，负数向后）
 * @param n 数组长度
 * @returns 下一个索引位置
 */
function getNextIndex(current: number, step: number, n: number): number {
  // 计算下一个位置：当前位置 + 步数
  // 使用模运算处理环形数组的边界
  return (((current + step) % n) + n) % n;
}
// @lc code=end
