/*
 * @lc app=leetcode.cn id=139 lang=typescript
 *
 * [139] 单词拆分
 */

// @lc code=start
function wordBreak(s: string, wordDict: string[]): boolean {
  // 获取字符串长度
  const n = s.length;

  // 将单词字典转换为集合，便于快速查找
  const wordSet = new Set(wordDict);

  // 创建dp数组，dp[i]表示字符串s的前i个字符是否可以被拆分成wordDict中的单词
  // dp[0]表示空字符串，默认为true（空字符串可以被拆分）
  const dp: boolean[] = new Array(n + 1).fill(false);
  dp[0] = true;

  // 遍历字符串的每个位置
  for (let i = 1; i <= n; i++) {
    // 遍历所有可能的拆分点j
    for (let j = 0; j < i; j++) {
      // 如果前j个字符可以被拆分，并且从j到i的子串在字典中存在
      // 则前i个字符可以被拆分
      if (dp[j] && wordSet.has(s.slice(j, i))) {
        dp[i] = true;
        break; // 找到一种拆分方式即可，无需继续尝试
      }
    }
  }

  // 返回整个字符串是否可以被拆分
  return dp[n];
}
// @lc code=end
