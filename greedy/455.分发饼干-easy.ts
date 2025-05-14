/*
 * @lc app=leetcode.cn id=455 lang=typescript
 *
 * [455] 分发饼干
 *
 * https://leetcode.cn/problems/assign-cookies/description/
 *
 * algorithms
 * Easy (56.00%)
 * Likes:    928
 * Dislikes: 0
 * Total Accepted:    491.3K
 * Total Submissions: 877.7K
 * Testcase Example:  '[1,2,3]\n[1,1]'
 *
 * 假设你是一位很棒的家长，想要给你的孩子们一些小饼干。但是，每个孩子最多只能给一块饼干。
 *
 * 对每个孩子 i，都有一个胃口值 g[i]，这是能让孩子们满足胃口的饼干的最小尺寸；并且每块饼干 j，都有一个尺寸 s[j] 。如果 s[j] >=
 * g[i]，我们可以将这个饼干 j 分配给孩子 i ，这个孩子会得到满足。你的目标是满足尽可能多的孩子，并输出这个最大数值。
 *
 *
 * 示例 1:
 *
 *
 * 输入: g = [1,2,3], s = [1,1]
 * 输出: 1
 * 解释:
 * 你有三个孩子和两块小饼干，3 个孩子的胃口值分别是：1,2,3。
 * 虽然你有两块小饼干，由于他们的尺寸都是 1，你只能让胃口值是 1 的孩子满足。
 * 所以你应该输出 1。
 *
 *
 * 示例 2:
 *
 *
 * 输入: g = [1,2], s = [1,2,3]
 * 输出: 2
 * 解释:
 * 你有两个孩子和三块小饼干，2 个孩子的胃口值分别是 1,2。
 * 你拥有的饼干数量和尺寸都足以让所有孩子满足。
 * 所以你应该输出 2。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= g.length <= 3 * 10^4
 * 0 <= s.length <= 3 * 10^4
 * 1 <= g[i], s[j] <= 2^31 - 1
 *
 *
 *
 *
 * 注意：本题与 2410. 运动员和训练师的最大匹配数 题相同。
 *
 */

// @lc code=start
/**
 * 分发饼干问题 - 贪心算法
 * @param g 孩子们的胃口值数组
 * @param s 饼干尺寸数组
 * @returns 能够满足的最大孩子数量
 *
 * 思路：贪心策略 - 优先用尽可能小的饼干满足胃口小的孩子
 * 1. 将孩子胃口和饼干尺寸数组排序
 * 2. 使用双指针遍历两个排序后的数组
 * 3. 当前饼干能满足当前孩子时，两个指针都移动
 * 4. 当前饼干不能满足当前孩子时，只移动饼干指针尝试下一块更大的饼干
 */
function findContentChildren(g: number[], s: number[]): number {
  // 参数验证
  if (!g || !s || g.length === 0 || s.length === 0) {
    return 0;
  }

  // 对孩子胃口值和饼干尺寸进行升序排序
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);

  let childIndex = 0; // 当前要满足的孩子索引
  let cookieIndex = 0; // 当前尝试分配的饼干索引
  let satisfiedCount = 0; // 已满足的孩子数量

  // 遍历所有孩子和饼干
  while (childIndex < g.length && cookieIndex < s.length) {
    // 当前饼干能满足当前孩子的胃口
    if (s[cookieIndex] >= g[childIndex]) {
      satisfiedCount++; // 满足的孩子数量加1
      childIndex++; // 移动到下一个孩子
    }

    // 无论饼干是否满足当前孩子，都尝试下一块饼干
    // 因为当前饼干如果不能满足当前孩子，那么也无法满足后面胃口更大的孩子
    cookieIndex++;
  }

  return satisfiedCount;
}
// @lc code=end
