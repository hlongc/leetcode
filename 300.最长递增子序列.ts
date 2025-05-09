/*
 * @lc app=leetcode.cn id=300 lang=typescript
 *
 * [300] 最长递增子序列
 */

// @lc code=start
/**
 * 最长递增子序列 (LIS) - 动态规划解法
 *
 * 算法思路：
 * 1. 使用动态规划求解最长递增子序列问题
 * 2. 定义状态：dp[i]表示以nums[i]结尾的最长递增子序列的长度
 * 3. 对于每个位置i，考察之前的所有位置j，如果nums[j] < nums[i]，则可以将nums[i]接在以nums[j]结尾的子序列后面
 *
 * 时间复杂度：O(n²)，其中n是数组长度
 * 空间复杂度：O(n)，需要dp数组存储中间状态
 *
 * @param nums 输入数组
 * @returns 最长递增子序列的长度
 */
function lengthOfLIS1(nums: number[]): number {
  // 创建dp数组，初始值为1（每个元素自身就是长度为1的递增子序列）
  // dp[i]代表以nums[i]结尾的最长递增子序列长度
  const dp = new Array(nums.length).fill(1);

  // 遍历数组中的每个元素
  for (let i = 0; i < nums.length; i++) {
    // 对于每个位置i，查看之前的所有位置j
    for (let j = 0; j < i; j++) {
      // 如果找到一个较小的元素nums[j]，则可以将nums[i]接在其后形成更长的递增子序列
      if (nums[j] < nums[i]) {
        // 更新dp[i]：取当前值与"dp[j] + 1"中的较大值
        // dp[j] + 1表示在以nums[j]结尾的最长递增子序列后面接上nums[i]
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  // 返回dp数组中的最大值，即为整个数组的最长递增子序列长度
  return Math.max(...dp);
}

/**
 * 参考链接： https://leetcode.cn/problems/longest-increasing-subsequence/solutions/1033432/dong-tai-gui-hua-he-er-fen-cha-zhao-lian-x7dh/
 * 最长递增子序列 (LIS) - 基于蜘蛛纸牌算法实 现
 *
 * 算法思路：
 * 1. 把数组中的数字想象成扑克牌
 * 2. 按照以下规则将扑克牌分堆：
 *    - 只能把点数小的牌压到点数大的牌上
 *    - 如果当前牌不能放到任何堆上，则新建一个堆
 *    - 如果有多个堆可以放，则放到最左边的堆上
 *
 * 为什么这样能得到最长递增子序列的长度？
 * 1. 每个堆的堆顶是递增的，因为小牌总是优先放在左边的堆上
 * 2. 堆的数量就是最长递增子序列的长度，因为：
 *    - 每个堆的牌从底到顶是递减的
 *    - 从每个堆中分别取一张牌，可以形成一个递增序列
 *    - 而且这个序列的长度就是堆的数量
 *
 * 时间复杂度：O(nlogn)，其中n是数组长度
 * 空间复杂度：O(n)，需要存储每个堆的堆顶元素
 *
 * @param nums 输入数组
 * @returns 最长递增子序列的长度
 */
function lengthOfLIS(nums: number[]) {
  // top数组记录每个堆的堆顶元素
  const top: number[] = [];
  // piles记录当前的堆数（也就是最终的LIS长度）
  let piles = 0;

  // 遍历每张牌
  for (let i = 0; i < nums.length; i++) {
    // 当前要处理的牌
    let poker = nums[i];

    // 二分查找：找到当前牌应该放在哪个堆上
    // left是最左边可能的堆，right是最右边可能的堆（即新建堆的位置）
    let left = 0,
      right = top.length;

    // 二分查找的搜索区间是左闭右开 [left, right)
    while (left < right) {
      let mid = left + ((right - left) >> 1);
      // 如果当前堆顶的牌大于要放入的牌
      if (top[mid] > poker) {
        // 则目标堆可能在左侧，包括mid
        right = mid;
      } else if (top[mid] < poker) {
        // 如果当前堆顶的牌小于要放入的牌
        // 则目标堆一定在右侧，不包括mid
        left = mid + 1;
      } else {
        // 如果相等，我们选择最左边的堆（这样可以保证相同数字的正确处理）
        // 当前这个堆可能也是寻找的结果，所以取mid，而不是mid - 1
        right = mid;
      }
    }

    // 如果left等于piles，说明需要新建一个堆
    // 因为现有的所有堆都不满足条件
    if (left == top.length) {
      top.push(poker); // 直接使用 push 添加新堆
    } else {
      // 将当前牌放到找到的堆顶
      // 如果是新建的堆，left就是piles-1
      // 如果是已有的堆，left就是找到的目标堆的索引
      top[left] = poker;
    }
  }

  // 最终的堆数就是最长递增子序列的长度
  return top.length;
}

// @lc code=end
