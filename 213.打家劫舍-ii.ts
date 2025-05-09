/*
 * @lc app=leetcode.cn id=213 lang=typescript
 *
 * [213] 打家劫舍 II
 */

// @lc code=start
/**
 * 辅助函数：计算线性排列房屋的最大偷窃金额
 * 与打家劫舍 I 的解法相同
 * @param nums 房屋金额数组
 * @return 能偷到的最大金额
 */
function steal(nums: number[]): number {
  // 特殊情况处理：如果只有一个房子，则只能偷这一个
  if (nums.length === 1) return nums[0];
  // 特殊情况处理：如果有两个房子，由于不能偷相邻的，所以只能选择其中金额较大的一个
  if (nums.length === 2) return Math.max(...nums);

  // prev表示dp[i-2]，即前i-2个房子能偷到的最大金额
  let prev = nums[0];
  // current表示dp[i-1]，即前i-1个房子能偷到的最大金额
  let current = Math.max(nums[0], nums[1]);

  // 从第三个房子开始遍历
  for (let i = 2; i < nums.length; i++) {
    // 需要临时保存current的值，因为在更新prev之前需要用到
    const tmp = current;
    // 状态转移：决定偷或不偷当前房子
    current = Math.max(current, prev + nums[i]);
    // 更新prev为前一步的current值
    prev = tmp;
  }

  // 返回最终的最大金额
  return current;
}

/**
 * 主函数：计算环形排列房屋的最大偷窃金额
 * @param nums 房屋金额数组
 * @return 能偷到的最大金额
 */
function rob(nums: number[]): number {
  // 特殊情况处理：如果只有一个房子，则只能偷这一个
  if (nums.length === 1) return nums[0];

  // 环形排列的关键处理：
  // 由于第一个房子和最后一个房子相邻（形成环），不能同时偷
  // 我们可以将问题分解为两种情况：
  // 1. 不偷第一个房子，即考虑从第二个到最后一个房子 (nums.slice(1))
  // 2. 不偷最后一个房子，即考虑从第一个到倒数第二个房子 (nums.slice(0, -1))
  // 取这两种情况的最大值即为答案
  return Math.max(steal(nums.slice(0, -1)), steal(nums.slice(1)));
}
// @lc code=end
