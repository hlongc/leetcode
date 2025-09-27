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
  const n = nums.length;
  if (n <= 1) return 0; // 只有一个元素或空数组，不需要跳跃

  let jumps = 0; // 跳跃次数
  let currentEnd = 0; // 当前跳跃能到达的最远位置
  let farthest = 0; // 所有位置能到达的最远位置

  // 遍历数组，但不包括最后一个位置
  // 因为到达最后一个位置就不需要再跳了
  for (let i = 0; i < n - 1; i++) {
    // 更新能到达的最远位置
    farthest = Math.max(farthest, i + nums[i]);

    // 如果到达了当前跳跃的边界
    if (i === currentEnd) {
      jumps++; // 需要再跳一次
      currentEnd = farthest; // 更新下一次跳跃的边界
    }
  }

  return jumps;
}

/*
🎯 核心思想：贪心算法
- 每次跳跃都选择能到达最远位置的点
- 维护当前跳跃的边界和全局最远位置
- 当到达边界时，必须进行一次跳跃

📊 详细例子：nums = [2,3,1,1,4]

可视化：
索引:  0  1  2  3  4
数组: [2, 3, 1, 1, 4]
跳跃: 0→1→4 (2次跳跃)

执行过程：
初始：jumps=0, currentEnd=0, farthest=0

i=0: nums[0]=2
- farthest = max(0, 0+2) = 2
- i == currentEnd (0)，需要跳跃
- jumps = 1, currentEnd = 2
- 状态：jumps=1, currentEnd=2, farthest=2

i=1: nums[1]=3  
- farthest = max(2, 1+3) = 4
- i != currentEnd (1 != 2)，继续
- 状态：jumps=1, currentEnd=2, farthest=4

i=2: nums[2]=1
- farthest = max(4, 2+1) = 4  
- i == currentEnd (2)，需要跳跃
- jumps = 2, currentEnd = 4
- 状态：jumps=2, currentEnd=4, farthest=4

i=3: nums[3]=1
- farthest = max(4, 3+1) = 4
- i != currentEnd (3 != 4)，继续
- 状态：jumps=2, currentEnd=4, farthest=4

循环结束，返回jumps=2

🔑 关键理解：

1. 为什么贪心策略正确？
   - 假设最优解在第i步跳到了位置j
   - 如果我们在第i步跳到更远的位置k（k>j）
   - 那么从k出发肯定比从j出发更好
   - 所以每次选择能到达最远的位置是最优的

2. currentEnd的作用？
   - 表示当前跳跃能覆盖的范围边界
   - 当i到达currentEnd时，必须进行一次跳跃
   - 因为不跳就无法继续前进

3. farthest的作用？
   - 记录从当前位置能到达的最远位置
   - 用于更新下一次跳跃的边界

📈 另一个例子：nums = [2,3,0,1,4]

索引:  0  1  2  3  4
数组: [2, 3, 0, 1, 4]
跳跃: 0→1→4 (2次跳跃)

i=0: farthest=2, i==currentEnd(0) → jumps=1, currentEnd=2
i=1: farthest=4, i!=currentEnd(1) → 继续
i=2: farthest=4, i==currentEnd(2) → jumps=2, currentEnd=4
i=3: farthest=4, i!=currentEnd(3) → 继续

时间复杂度：O(n) - 每个位置访问一次
空间复杂度：O(1) - 只用了几个变量
*/
// @lc code=end
