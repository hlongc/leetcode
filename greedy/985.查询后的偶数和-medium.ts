/*
 * @lc app=leetcode.cn id=985 lang=typescript
 *
 * [985] 查询后的偶数和
 *
 * https://leetcode.cn/problems/sum-of-even-numbers-after-queries/description/
 *
 * algorithms
 * Medium (61.88%)
 * Likes:    93
 * Dislikes: 0
 * Total Accepted:    22.2K
 * Total Submissions: 35.9K
 * Testcase Example:  '[1,2,3,4]\n[[1,0],[-3,1],[-4,0],[2,3]]'
 *
 * 给出一个整数数组 A 和一个查询数组 queries。
 *
 * 对于第 i 次查询，有 val = queries[i][0], index = queries[i][1]，我们会把 val 加到 A[index]
 * 上。然后，第 i 次查询的答案是 A 中偶数值的和。
 *
 * （此处给定的 index = queries[i][1] 是从 0 开始的索引，每次查询都会永久修改数组 A。）
 *
 * 返回所有查询的答案。你的答案应当以数组 answer 给出，answer[i] 为第 i 次查询的答案。
 *
 *
 *
 * 示例：
 *
 * 输入：A = [1,2,3,4], queries = [[1,0],[-3,1],[-4,0],[2,3]]
 * 输出：[8,6,2,4]
 * 解释：
 * 开始时，数组为 [1,2,3,4]。
 * 将 1 加到 A[0] 上之后，数组为 [2,2,3,4]，偶数值之和为 2 + 2 + 4 = 8。
 * 将 -3 加到 A[1] 上之后，数组为 [2,-1,3,4]，偶数值之和为 2 + 4 = 6。
 * 将 -4 加到 A[0] 上之后，数组为 [-2,-1,3,4]，偶数值之和为 -2 + 4 = 2。
 * 将 2 加到 A[3] 上之后，数组为 [-2,-1,3,6]，偶数值之和为 -2 + 6 = 4。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= A.length <= 10000
 * -10000 <= A[i] <= 10000
 * 1 <= queries.length <= 10000
 * -10000 <= queries[i][0] <= 10000
 * 0 <= queries[i][1] < A.length
 *
 *
 */

// @lc code=start
/**
 * 计算查询后的偶数和
 *
 * 思路：维护一个当前偶数和，并根据每次查询对其进行增量更新
 *
 * 优化点：
 * 1. 不需要每次查询后都重新计算整个数组的偶数和
 * 2. 只需要根据被修改元素的变化来更新偶数和
 * 3. 考虑四种情况：
 *    - 原来是偶数，修改后是偶数：偶数和增加val
 *    - 原来是偶数，修改后是奇数：偶数和减去原值
 *    - 原来是奇数，修改后是偶数：偶数和增加修改后的值
 *    - 原来是奇数，修改后是奇数：偶数和不变
 *
 * @param nums 初始整数数组
 * @param queries 查询数组，每个查询包含[val, index]
 * @returns 每次查询后数组中偶数值的和
 */
function sumEvenAfterQueries(nums: number[], queries: number[][]): number[] {
  // 用于存储每次查询后的结果
  const results: number[] = [];

  // 计算初始数组中所有偶数的和
  let evenSum = nums.reduce((sum, num) => {
    return sum + (num % 2 === 0 ? num : 0);
  }, 0);

  // 处理每个查询
  for (const [val, index] of queries) {
    const oldValue = nums[index]; // 查询前的值
    const newValue = oldValue + val; // 查询后的值

    // 更新数组中对应位置的值
    nums[index] = newValue;

    // 根据新旧值的奇偶性更新偶数和
    if (oldValue % 2 === 0) {
      // 原值为偶数
      if (newValue % 2 === 0) {
        // 新值也是偶数，增加的部分就是val
        evenSum += val;
      } else {
        // 新值是奇数，移除原来的偶数值
        evenSum -= oldValue;
      }
    } else {
      // 原值为奇数
      if (newValue % 2 === 0) {
        // 新值是偶数，添加新值到偶数和
        evenSum += newValue;
      }
      // 如果新值也是奇数，偶数和不变
    }

    // 将当前的偶数和添加到结果数组
    results.push(evenSum);
  }

  return results;
}
// @lc code=end
