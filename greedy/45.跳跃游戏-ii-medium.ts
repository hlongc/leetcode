/*
 * @lc app=leetcode.cn id=45 lang=typescript
 *
 * [45] 跳跃游戏 II
 *
 * https://leetcode.cn/problems/jump-game-ii/description/
 *
 * algorithms
 * Medium (44.86%)
 * Likes:    2821
 * Dislikes: 0
 * Total Accepted:    978.5K
 * Total Submissions: 2.2M
 * Testcase Example:  '[2,3,1,1,4]'
 *
 * 给定一个长度为 n 的 0 索引整数数组 nums。初始位置为 nums[0]。
 *
 * 每个元素 nums[i] 表示从索引 i 向后跳转的最大长度。换句话说，如果你在 nums[i] 处，你可以跳转到任意 nums[i + j]
 * 处:
 *
 *
 * 0 <= j <= nums[i]
 * i + j < n
 *
 *
 * 返回到达 nums[n - 1] 的最小跳跃次数。生成的测试用例可以到达 nums[n - 1]。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [2,3,1,1,4]
 * 输出: 2
 * 解释: 跳到最后一个位置的最小跳跃数是 2。
 * 从下标为 0 跳到下标为 1 的位置，跳 1 步，然后跳 3 步到达数组的最后一个位置。
 *
 *
 * 示例 2:
 *
 *
 * 输入: nums = [2,3,0,1,4]
 * 输出: 2
 *
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= nums.length <= 10^4
 * 0 <= nums[i] <= 1000
 * 题目保证可以到达 nums[n-1]
 *
 *
 */

// @lc code=start
function jump(nums: number[]): number {
  // 如果数组长度为1，已经在终点，不需要跳跃
  if (nums.length === 1) return 0;

  // 记录跳跃次数
  let jumps = 0;
  // 上一次跳跃能到达的右边界
  let end = 0;
  // 当前跳跃能到达的最远位置
  let curFarthest = 0;

  // 遍历数组，注意我们只需要遍历到倒数第二个元素
  // 因为一旦我们能到达最后一个元素前的位置，就一定能跳到最后
  for (let i = 0; i < nums.length - 1; i++) {
    // 更新当前能到达的最远位置
    curFarthest = Math.max(curFarthest, i + nums[i]);

    // 如果已经到达当前跳跃能到达的边界，需要进行下一次跳跃
    if (i === end) {
      // 更新跳跃次数
      jumps++;
      // 更新当前能到达的最远边界为下一步能到达的最远位置
      end = curFarthest;
    }
  }

  return jumps;
}
// @lc code=end
