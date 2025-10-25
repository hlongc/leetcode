/*
 * @lc app=leetcode.cn id=131 lang=typescript
 *
 * [131] 分割回文串
 *
 * https://leetcode.cn/problems/palindrome-partitioning/description/
 *
 * algorithms
 * Medium (75.37%)
 * Likes:    2114
 * Dislikes: 0
 * Total Accepted:    669.6K
 * Total Submissions: 888.1K
 * Testcase Example:  '"aab"'
 *
 * 给你一个字符串 s，请你将 s 分割成一些 子串，使每个子串都是 回文串 。返回 s 所有可能的分割方案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：s = "aab"
 * 输出：[["a","a","b"],["aa","b"]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：s = "a"
 * 输出：[["a"]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= s.length <= 16
 * s 仅由小写英文字母组成
 *
 *
 */

// @lc code=start
/**
 * 分割回文串 - 返回字符串 s 所有可能的回文分割方案
 *
 * 核心思路：回溯 + 动态规划预处理
 * 1. 使用动态规划预先计算所有子串是否为回文串，避免重复判断
 * 2. 使用回溯算法枚举所有可能的分割方案
 * 3. 对于每个位置，尝试所有可能的回文子串作为分割点
 *
 * 时间复杂度：O(n * 2^n)，n为字符串长度，最坏情况下有2^n种分割方式
 * 空间复杂度：O(n^2)，dp数组的空间 + 递归深度O(n)
 */
function partition(s: string): string[][] {
  // 存储所有有效的分割方案
  const result: string[][] = [];
  const len = s.length;

  // dp[i][j] 表示字符串s从索引i到j（包含j）是否为回文串
  // 使用动态规划预处理，避免在回溯过程中重复判断
  const dp: boolean[][] = new Array(len)
    .fill(0)
    .map(() => new Array(len).fill(true)); // 初始化为true，单个字符必定是回文

  // 动态规划填充dp数组
  // 递推公式：dp[i][j] = (s[i] === s[j]) && dp[i + 1][j - 1]
  // 子串是回文的条件：首尾字符相同 且 去掉首尾后的子串也是回文
  //
  // 注意：需要从后往前遍历i，因为计算dp[i][j]需要用到dp[i+1][j-1]
  for (let i = len - 1; i >= 0; i--) {
    for (let j = i + 1; j < len; j++) {
      // 只有当首尾字符相同，且中间部分也是回文时，整个子串才是回文
      dp[i][j] = s[i] === s[j] && dp[i + 1][j - 1];
    }
  }

  // 当前分割方案（临时数组）
  const path: string[] = [];

  /**
   * 回溯函数 - 从指定位置开始尝试分割
   * @param startIndex 当前处理的起始索引
   */
  function backtrack(startIndex: number): void {
    // 递归终止条件：已经处理到字符串末尾，找到一个有效的分割方案
    if (startIndex === len) {
      // 将当前方案加入结果集（需要复制一份，避免引用问题）
      result.push([...path]);
      return;
    }

    // 尝试从 startIndex 开始的每个可能的子串
    // j 是当前子串的结束位置（包含）
    for (let j = startIndex; j < len; j++) {
      // 判断当前子串 s[startIndex...j] 是否为回文串
      if (dp[startIndex][j]) {
        // 是回文串，做选择：将该回文子串加入当前方案
        path.push(s.substring(startIndex, j + 1));

        // 递归处理剩余部分（从 j+1 开始）
        backtrack(j + 1);

        // 撤销选择（回溯）：移除最后添加的子串，尝试其他可能
        path.pop();
      }
      // 如果不是回文串，跳过，继续尝试更长的子串
    }
  }

  // 从索引0开始回溯搜索
  backtrack(0);

  return result;
}
// @lc code=end
