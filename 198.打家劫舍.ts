/*
 * @lc app=leetcode.cn id=198 lang=typescript
 *
 * [198] 打家劫舍
 */

// @lc code=start
function rob(nums: number[]): number {
  // 特殊情况处理：如果只有一个房子，则只能偷这一个
  if (nums.length === 1) return nums[0];

  // 特殊情况处理：如果有两个房子，由于不能偷相邻的，所以只能选择其中金额较大的一个
  if (nums.length === 2) return Math.max(...nums);

  // prev表示dp[i-2]，即前i-2个房子能偷到的最大金额
  // 初始化为第一个房子的金额
  let prev = nums[0];

  // current表示dp[i-1]，即前i-1个房子能偷到的最大金额
  // 初始化为前两个房子中能偷到的最大金额
  let current = Math.max(nums[0], nums[1]);

  // 从第三个房子开始遍历
  for (let i = 2; i < nums.length; i++) {
    // 需要临时保存current的值，因为在更新prev之前需要用到
    const tmp = current;

    // 对于当前房子，有两种选择：
    // 1. 偷当前房子，那么前一个房子不能偷，即nums[i] + prev
    // 2. 不偷当前房子，那么最大金额就是之前计算的current
    // 取两者的较大值作为当前的最大金额
    current = Math.max(nums[i] + prev, current);

    // 更新prev为前一步的current值，为下一次迭代做准备
    prev = tmp;
  }

  // 最终结果是考虑完所有房子后能偷到的最大金额
  return current;
}
// @lc code=end
