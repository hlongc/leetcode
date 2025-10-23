/*
 * @lc app=leetcode.cn id=991 lang=typescript
 *
 * [991] 坏了的计算器
 *
 * https://leetcode.cn/problems/broken-calculator/description/
 *
 * algorithms
 * Medium (54.05%)
 * Likes:    208
 * Dislikes: 0
 * Total Accepted:    16.6K
 * Total Submissions: 30.7K
 * Testcase Example:  '2\n3'
 *
 * 在显示着数字 startValue 的坏计算器上，我们可以执行以下两种操作：
 *
 *
 * 双倍（Double）：将显示屏上的数字乘 2；
 * 递减（Decrement）：将显示屏上的数字减 1 。
 *
 *
 * 给定两个整数 startValue 和 target 。返回显示数字 target 所需的最小操作数。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：startValue = 2, target = 3
 * 输出：2
 * 解释：先进行双倍运算，然后再进行递减运算 {2 -> 4 -> 3}.
 *
 *
 * 示例 2：
 *
 *
 * 输入：startValue = 5, target = 8
 * 输出：2
 * 解释：先递减，再双倍 {5 -> 4 -> 8}.
 *
 *
 * 示例 3：
 *
 *
 * 输入：startValue = 3, target = 10
 * 输出：3
 * 解释：先双倍，然后递减，再双倍 {3 -> 6 -> 5 -> 10}.
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= startValue, target <= 10^9
 *
 *
 */

// @lc code=start
/**
 * 解法一：逆向思维 + 贪心（推荐）
 *
 * 核心思路：
 * 从 target 逆向推导到 startValue，而不是正向推导
 *
 * 正向操作：
 * - 双倍（×2）
 * - 递减（-1）
 *
 * 逆向操作（反过来）：
 * - 除以2（÷2）- 对应正向的 ×2
 * - 加1（+1）- 对应正向的 -1
 *
 * 为什么逆向更好？
 * - 正向时，我们不知道什么时候该 ×2，什么时候该 -1
 * - 逆向时，贪心策略很明确：
 *   1. 如果 target > startValue 且 target 是偶数 → 除以2（最优）
 *   2. 如果 target > startValue 且 target 是奇数 → 加1（变偶数）
 *   3. 如果 target <= startValue → 只能一直加1（对应正向的减1）
 *
 * 时间复杂度：O(log(target))，每次除以2，target 减半
 * 空间复杂度：O(1)
 */
function brokenCalc(startValue: number, target: number): number {
  let steps = 0;

  // 从 target 逆向推导到 startValue
  while (target > startValue) {
    if (target % 2 === 0) {
      // target 是偶数，除以2（对应正向的 ×2）
      target = target / 2;
    } else {
      // target 是奇数，先加1变成偶数（对应正向的 -1）
      target = target + 1;
    }
    steps++;
  }

  // 如果 target < startValue，只能不断加1（对应正向的减1）
  // target == startValue 时，不需要额外操作
  steps += startValue - target;

  return steps;
}

/**
 * 解法二：逆向思维（展开版，便于理解）
 *
 * 核心思路同解法一，但代码逻辑更清晰
 *
 * 时间复杂度：O(log(target))
 * 空间复杂度：O(1)
 */
function brokenCalc2(startValue: number, target: number): number {
  let steps = 0;

  // 如果 target <= startValue，只能一直递减
  if (target <= startValue) {
    return startValue - target;
  }

  // target > startValue，逆向推导
  while (target > startValue) {
    if (target % 2 === 0) {
      // 偶数：除以2
      target = target / 2;
      steps++;
    } else {
      // 奇数：加1变成偶数
      target = target + 1;
      steps++;
    }
  }

  // 剩余的差距需要递减操作
  steps += startValue - target;

  return steps;
}

/**
 * 解法三：数学优化（一次性处理奇数）
 *
 * 核心思路：
 * 连续的奇数可以优化处理
 * - 如果 target 是奇数，加1后变成偶数，然后除以2
 * - 这相当于 (target + 1) / 2
 *
 * 时间复杂度：O(log(target))
 * 空间复杂度：O(1)
 */
function brokenCalc3(startValue: number, target: number): number {
  let steps = 0;

  while (target > startValue) {
    steps++;
    if (target % 2 === 1) {
      // 奇数：加1（一步）
      target++;
    } else {
      // 偶数：除以2（一步）
      target /= 2;
    }
  }

  // 加上剩余的递减操作
  return steps + (startValue - target);
}

/**
 * 图解示例：
 *
 * 示例 1：startValue = 2, target = 3
 *
 * 正向思考（不好判断）：
 * 2 -> ? -> 3
 * - 选项1: 2 -> 1 -> 0 -> ... (×) 错误方向
 * - 选项2: 2 -> 4 -> 3 (✓) 正确，但需要尝试
 *
 * 逆向思考（贪心清晰）：
 * 3 -> 2
 * 3 是奇数 -> 加1 -> 4 (1步)
 * 4 是偶数 -> 除以2 -> 2 (1步)
 * 到达 startValue，总共 2 步 ✅
 *
 * ---
 *
 * 示例 2：startValue = 5, target = 8
 *
 * 逆向思考：
 * 8 -> 5
 * 8 是偶数 -> 除以2 -> 4 (1步)
 * 4 < 5，需要递减操作（对应正向的加1）
 * 5 - 4 = 1 步
 * 总共：1 + 1 = 2 步
 *
 * 验证正向：5 -> 4（递减）-> 8（双倍）✅
 *
 * ---
 *
 * 示例 3：startValue = 3, target = 10
 *
 * 逆向思考：
 * 10 -> 3
 * 10 是偶数 -> 除以2 -> 5 (1步)
 * 5 是奇数 -> 加1 -> 6 (1步)
 * 6 是偶数 -> 除以2 -> 3 (1步)
 * 到达 startValue，总共 3 步 ✅
 *
 * 验证正向：3 -> 6（双倍）-> 5（递减）-> 10（双倍）✅
 *
 * ---
 *
 * 示例 4：startValue = 5, target = 3
 *
 * target < startValue，只能递减
 * 5 -> 4 -> 3
 * 5 - 3 = 2 步
 *
 * ---
 *
 * 为什么逆向贪心是最优的？
 *
 * 关键洞察：
 * 1. 如果 target 是偶数，除以2总是最优的
 *    - 因为正向需要 ×2 才能达到偶数
 *    - 除以2 可以快速缩小差距
 *
 * 2. 如果 target 是奇数，必须先 +1
 *    - 因为奇数不能除以2
 *    - +1 变成偶数后，就能除以2了
 *
 * 3. 如果 target <= startValue，只能用递减（正向）
 *    - 因为双倍会让数字变大，离 target 更远
 *
 * 正向例子（为什么正向难？）：
 * startValue = 3, target = 10
 *
 * 方案1: 3 -> 6 -> 5 -> 10 (3步) ✅ 最优
 * 方案2: 3 -> 2 -> 4 -> 8 -> 16 -> ... (×) 绕远了
 * 方案3: 3 -> 6 -> 12 -> 11 -> 10 (4步) (×) 不是最优
 *
 * 正向时，很难判断什么时候该 ×2，什么时候该 -1
 * 但逆向时，贪心策略很明确：能除就除，不能除就加1
 */
// @lc code=end
