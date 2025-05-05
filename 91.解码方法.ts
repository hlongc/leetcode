/*
 * @lc app=leetcode.cn id=91 lang=typescript
 *
 * [91] 解码方法
 */

// @lc code=start
/**
 * 使用动态规划解决解码方法问题
 * 对于给定的字符串s，计算解码方法的总数
 *
 * 规则：
 * 1. 'A' -> 1, 'B' -> 2, ... 'Z' -> 26
 * 2. 每个数字可以单独解码，也可以与前一个数字组合解码（如果在1-26范围内）
 *
 * @param s 由数字组成的字符串
 * @returns 解码方法的总数
 */
function numDecodings1(s: string): number {
  // 处理边界情况：空字符串或以0开头的字符串（无法解码）
  if (s.length === 0 || s[0] === "0") {
    return 0;
  }

  const n = s.length;

  // 创建dp数组，dp[i]表示s的前i个字符的解码方法数
  // dp[0] = 1 表示空字符串有1种解码方法（基例）
  const dp: number[] = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1; // 第一个字符如果不是'0'，有1种解码方法

  // 从第二个字符开始，填充dp数组
  for (let i = 2; i <= n; i++) {
    // 当前字符（注意索引从0开始，所以是s[i-1]）
    const curr = s[i - 1];
    // 前一个字符
    const prev = s[i - 2];

    // 情况1：当前字符可以单独解码（不为'0'）
    if (curr !== "0") {
      dp[i] += dp[i - 1];
    }

    // 情况2：当前字符与前一个字符组合可以解码（在10-26范围内）
    // 注意处理前导零的情况
    const twoDigit = parseInt(prev + curr, 10);
    if (twoDigit >= 10 && twoDigit <= 26) {
      dp[i] += dp[i - 2];
    }
  }

  // 返回整个字符串的解码方法数
  return dp[n];
}

/**
 * 解法二：优化空间的动态规划
 * 由于dp[i]只依赖dp[i-1]和dp[i-2]，可以使用两个变量代替数组
 *
 * @param s 由数字组成的字符串
 * @returns 解码方法的总数
 */
function numDecodings(s: string): number {
  // 处理边界情况
  if (s.length === 0 || s[0] === "0") {
    return 0;
  }

  const n = s.length;

  // 使用两个变量代替dp数组
  // prev表示dp[i-2]，curr表示dp[i-1]
  let prev = 1; // 相当于dp[0]
  let curr = 1; // 相当于dp[1]

  // 从第二个字符开始处理
  for (let i = 2; i <= n; i++) {
    // 暂存当前结果
    let temp = 0;

    // 情况1：当前字符可以单独解码
    if (s[i - 1] !== "0") {
      temp += curr;
    }

    // 情况2：当前字符与前一个字符组合解码
    const twoDigit = parseInt(s.substring(i - 2, i), 10);
    if (twoDigit >= 10 && twoDigit <= 26) {
      temp += prev;
    }

    // 更新状态变量
    prev = curr;
    curr = temp;
  }

  // 返回结果
  return curr;
}
// @lc code=end
