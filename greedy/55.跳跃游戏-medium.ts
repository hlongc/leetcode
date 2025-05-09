/*
 * @lc app=leetcode.cn id=55 lang=typescript
 *
 * [55] 跳跃游戏
 *
 * https://leetcode.cn/problems/jump-game/description/
 *
 * algorithms
 * Medium (43.75%)
 * Likes:    3051
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 2.9M
 * Testcase Example:  '[2,3,1,1,4]'
 *
 * 给你一个非负整数数组 nums ，你最初位于数组的 第一个下标 。数组中的每个元素代表你在该位置可以跳跃的最大长度。
 *
 * 判断你是否能够到达最后一个下标，如果可以，返回 true ；否则，返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [2,3,1,1,4]
 * 输出：true
 * 解释：可以先跳 1 步，从下标 0 到达下标 1, 然后再从下标 1 跳 3 步到达最后一个下标。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [3,2,1,0,4]
 * 输出：false
 * 解释：无论怎样，总会到达下标为 3 的位置。但该下标的最大跳跃长度是 0 ， 所以永远不可能到达最后一个下标。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^4
 * 0 <= nums[i] <= 10^5
 *
 *
 */

// @lc code=start
/**
 * 判断是否能够从数组起始位置跳跃到最后一个位置
 * 使用贪心算法，记录当前能到达的最远位置
 *
 * @param nums 非负整数数组，每个元素表示在该位置可以跳跃的最大长度
 * @returns 是否能到达最后一个下标
 */
function canJump(nums: number[]): boolean {
  // 数组长度
  const n = nums.length;

  // 特殊情况：如果数组只有一个元素，已经在终点，直接返回true
  if (n === 1) return true;

  // 初始化当前能到达的最远位置
  // 从位置0开始，初始最远可到达位置是nums[0]
  let maxReach = nums[0];

  // 遍历数组（只需要遍历到倒数第二个元素）
  // 如果当前位置可达且还没到达终点，继续尝试更新最远可达位置
  for (let i = 0; i < n - 1; i++) {
    // 如果当前位置i不可达（maxReach小于i），直接返回false
    if (maxReach < i) {
      return false;
    }

    // 更新最远可达位置
    // 从位置i出发，最远可以跳到 i + nums[i]
    // 取之前记录的最远位置和当前位置可达的最远位置的较大值
    maxReach = Math.max(maxReach, i + nums[i]);

    // 如果最远可达位置已经超过或等于最后一个位置，可以提前返回true
    if (maxReach >= n - 1) {
      return true;
    }
  }

  // 遍历结束后，判断最远可达位置是否可以到达或超过最后一个位置
  return maxReach >= n - 1;
}
/**
 * 解题思路：贪心算法
 *
 * 1. 核心思想：
 *    - 记录当前能到达的最远位置maxReach
 *    - 如果能到达当前位置i，就尝试更新maxReach为max(maxReach, i + nums[i])
 *    - 如果某个位置i不可达（maxReach < i），则不可能到达终点
 *    - 如果maxReach大于等于终点位置，则可以到达终点
 *
 * 2. 步骤详解：
 *    - 初始位置是0，初始maxReach = nums[0]
 *    - 从左到右遍历数组，对于每个位置i：
 *      a. 检查i是否可达（maxReach >= i）
 *      b. 如果可达，更新maxReach = max(maxReach, i + nums[i])
 *      c. 如果maxReach已经可以到达终点，提前返回true
 *      d. 如果遇到不可达的位置，返回false
 *
 * 3. 贪心策略：
 *    - 在每个位置尽可能地向远处跳
 *    - 只关心能跳到的最远距离，而不关心具体怎么跳
 *
 * 4. 优化：
 *    - 当maxReach >= n-1时提前返回true
 *    - 只需要遍历到倒数第二个位置
 *
 * 5. 时间复杂度：O(n)，其中n是数组长度，只需要遍历一次数组
 *    空间复杂度：O(1)，只使用了常数额外空间
 */
// @lc code=end
