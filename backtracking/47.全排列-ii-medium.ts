/*
 * @lc app=leetcode.cn id=47 lang=typescript
 *
 * [47] 全排列 II
 *
 * https://leetcode.cn/problems/permutations-ii/description/
 *
 * algorithms
 * Medium (66.66%)
 * Likes:    1738
 * Dislikes: 0
 * Total Accepted:    689K
 * Total Submissions: 1M
 * Testcase Example:  '[1,1,2]'
 *
 * 给定一个可包含重复数字的序列 nums ，按任意顺序 返回所有不重复的全排列。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,1,2]
 * 输出：
 * [[1,1,2],
 * ⁠[1,2,1],
 * ⁠[2,1,1]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1,2,3]
 * 输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 8
 * -10 <= nums[i] <= 10
 *
 *
 */

// @lc code=start
/**
 * 全排列 II - 处理包含重复数字的序列
 *
 * 解题思路：
 * 1. 使用回溯算法生成所有排列
 * 2. 关键点：需要去重，避免生成重复的排列
 * 3. 去重策略：
 *    - 先对数组排序，让相同元素相邻
 *    - 在同一层递归中，相同的元素只使用第一个，跳过后续相同元素
 *    - 使用 used 数组标记元素是否已被使用
 *
 * 时间复杂度：O(n! * n) - 生成 n! 个排列，每个排列需要 O(n) 时间复制
 * 空间复杂度：O(n) - 递归栈深度和 used 数组
 */
function permuteUnique(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const used: boolean[] = new Array(nums.length).fill(false);

  // 1. 先排序，让相同元素相邻，便于去重
  nums.sort((a, b) => a - b);

  /**
   * 回溯函数
   * @param path 当前正在构建的排列路径
   */
  function backtrack(path: number[]): void {
    // 2. 递归终止条件：排列长度等于原数组长度
    if (path.length === nums.length) {
      // 找到一个完整排列，将其副本加入结果集
      result.push([...path]);
      return;
    }

    // 3. 遍历所有可能的下一个元素
    for (let i = 0; i < nums.length; i++) {
      // 4. 剪枝条件：
      // - 如果当前元素已被使用，跳过
      if (used[i]) continue;

      // - 去重关键逻辑：如果当前元素与前一个元素相同，
      //   且前一个元素在当前递归层还未被使用，则跳过
      //   这确保了相同元素在同一层只会被使用一次
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }

      // 5. 做选择：将当前元素加入路径
      path.push(nums[i]);
      used[i] = true;

      // 6. 递归：继续构建下一位
      backtrack(path);

      // 7. 撤销选择：回溯，移除当前元素
      path.pop();
      used[i] = false;
    }
  }

  // 开始回溯
  backtrack(path);
  return result;
}

/*
示例解析：
输入: [1,1,2]

排序后: [1,1,2]

回溯过程：
1. 选择第一个1 → [1]
   - 选择第二个1 → [1,1]
     - 选择2 → [1,1,2] ✓
   - 选择2 → [1,2]
     - 选择第二个1 → [1,2,1] ✓

2. 跳过第二个1（因为第一个1还未使用，去重）

3. 选择2 → [2]
   - 选择第一个1 → [2,1]
     - 选择第二个1 → [2,1,1] ✓
   - 跳过第二个1（去重）

结果: [[1,1,2], [1,2,1], [2,1,1]]

去重原理：
- 排序后相同元素相邻
- 在同一递归层中，相同元素按顺序使用
- used[i-1] == false 表示前一个相同元素在当前层还未被选择
- 这种情况下跳过当前元素，避免重复
*/
// @lc code=end
