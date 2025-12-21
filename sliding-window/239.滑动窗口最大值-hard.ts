/*
 * @lc app=leetcode.cn id=239 lang=typescript
 *
 * [239] 滑动窗口最大值
 *
 * https://leetcode.cn/problems/sliding-window-maximum/description/
 *
 * algorithms
 * Hard (49.96%)
 * Likes:    3322
 * Dislikes: 0
 * Total Accepted:    1M
 * Total Submissions: 2M
 * Testcase Example:  '[1,3,-1,-3,5,3,6,7]\n3'
 *
 * 给你一个整数数组 nums，有一个大小为 k 的滑动窗口从数组的最左侧移动到数组的最右侧。你只可以看到在滑动窗口内的 k
 * 个数字。滑动窗口每次只向右移动一位。
 *
 * 返回 滑动窗口中的最大值 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,3,-1,-3,5,3,6,7], k = 3
 * 输出：[3,3,5,5,6,7]
 * 解释：
 * 滑动窗口的位置                最大值
 * ---------------               -----
 * [1  3  -1] -3  5  3  6  7       3
 * ⁠1 [3  -1  -3] 5  3  6  7       3
 * ⁠1  3 [-1  -3  5] 3  6  7       5
 * ⁠1  3  -1 [-3  5  3] 6  7       5
 * ⁠1  3  -1  -3 [5  3  6] 7       6
 * ⁠1  3  -1  -3  5 [3  6  7]      7
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1], k = 1
 * 输出：[1]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * -10^4 <= nums[i] <= 10^4
 * 1 <= k <= nums.length
 *
 *
 */

// @lc code=start
/**
 * 滑动窗口最大值
 *
 * 解题思路：单调递减双端队列 (Monotonic Decreasing Deque)
 * 1. 使用双端队列存储数组元素的索引（不是值）
 * 2. 维护队列的单调递减性质：
 *    - 队首始终是当前窗口的最大值索引
 *    - 从队首到队尾，对应的数值单调递减
 * 3. 窗口滑动过程：
 *    - 移除超出窗口范围的索引（从队首）
 *    - 添加新元素前，从队尾移除所有小于等于新元素的元素
 *    - 将新元素索引加入队尾
 *    - 队首元素就是当前窗口最大值
 *
 * 时间复杂度：O(n) - 每个元素最多进出队列一次
 * 空间复杂度：O(k) - 队列最多存储k个元素
 */
function maxSlidingWindow(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = []; // 存储数组索引的双端队列

  for (let i = 0; i < nums.length; i++) {
    // 1. 移除超出当前窗口左边界的元素
    // 如果队首元素的索引小于等于 i-k，说明已经不在当前窗口内
    while (deque.length > 0 && deque[0] <= i - k) {
      deque.shift(); // 从队首移除
    }

    // 2. 维护单调递减性质
    // 从队尾开始，移除所有值小于当前元素的索引
    // 因为这些元素永远不可能成为窗口最大值
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop(); // 从队尾移除
    }

    // 3. 将当前元素索引加入队尾
    deque.push(i);

    // 4. 当窗口大小达到k时，开始记录结果
    // 队首元素就是当前窗口的最大值索引
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}

debugger;
maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3);

/*
算法执行示例：nums = [1,3,-1,-3,5,3,6,7], k = 3

i=0: 处理元素1, deque=[0], 窗口未满
i=1: 处理元素3, nums[3]>nums[1], 移除索引0, deque=[1], 窗口未满  
i=2: 处理元素-1, nums[-1]<nums[3], deque=[1,2], 窗口满，最大值=nums[1]=3

i=3: 处理元素-3, deque=[1,2,3], 最大值=nums[1]=3
i=4: 处理元素5, nums[5]>nums[-1]和nums[-3], 清空队列, deque=[4], 最大值=nums[4]=5
i=5: 处理元素3, nums[3]<nums[5], deque=[4,5], 最大值=nums[4]=5
i=6: 处理元素6, nums[6]>nums[3], 移除索引5, deque=[4,6], 最大值=nums[6]=6
i=7: 处理元素7, 移除索引4(超出窗口), nums[7]>nums[6], deque=[7], 最大值=nums[7]=7

结果：[3,3,5,5,6,7]
*/
// @lc code=end
