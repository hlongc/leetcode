/*
 * @lc app=leetcode.cn id=72 lang=typescript
 *
 * [72] 编辑距离
 */

// @lc code=start
/**
 * 使用动态规划计算两个单词之间的编辑距离
 * 编辑距离是指将一个单词转换成另一个单词所需的最少操作数
 * 操作包括：插入一个字符、删除一个字符、替换一个字符
 * @param word1 第一个单词
 * @param word2 第二个单词
 * @returns 最小编辑距离
 */
function minDistance1(word1: string, word2: string): number {
  // 获取两个单词的长度
  const m = word1.length;
  const n = word2.length;

  // 创建二维dp数组，dp[i][j]表示word1的前i个字符转换成word2的前j个字符所需的最少操作数
  // 初始化为0
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // 初始化边界条件
  // 当word2为空字符串时，将word1转换为word2需要删除word1的所有字符
  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
  }

  // 当word1为空字符串时，将word1转换为word2需要插入word2的所有字符
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
  }

  // 填充dp数组
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // 如果当前字符相同，不需要任何操作，编辑距离等于之前的字符的编辑距离
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // 如果当前字符不同，取三种操作中的最小值：
        // 1. 替换操作：dp[i-1][j-1] + 1
        // 2. 删除操作：dp[i-1][j] + 1
        // 3. 插入操作：dp[i][j-1] + 1
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // 替换
          dp[i - 1][j] + 1, // 删除
          dp[i][j - 1] + 1 // 插入
        );
      }
    }
  }

  // 返回将word1转换为word2所需的最少操作数
  return dp[m][n];
}

/**
 * 编辑距离的空间优化版本
 * 由于每次计算只需要前一行的结果，可以使用一维数组优化空间
 * @param word1 第一个单词
 * @param word2 第二个单词
 * @returns 最小编辑距离
 */
function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;

  // 优化处理特殊情况
  if (m === 0) return n;
  if (n === 0) return m;

  // 创建一维dp数组，初始为将word1的前i个字符转换为空字符串的操作数
  let dp: number[] = Array(n + 1).fill(0);

  // 初始化第一行
  for (let j = 0; j <= n; j++) {
    dp[j] = j;
  }

  // 临时变量，用于保存左上角的值（即dp[i-1][j-1]）
  let prev: number;

  // 逐行填充dp数组
  for (let i = 1; i <= m; i++) {
    // 保存左上角的初始值
    prev = dp[0];
    // 第一列的初始值，相当于dp[i][0] = i
    dp[0] = i;

    for (let j = 1; j <= n; j++) {
      // 保存当前dp[j]的值，下一轮循环中它将成为左上角的值
      const temp = dp[j];

      if (word1[i - 1] === word2[j - 1]) {
        // 当前字符相同，不需要操作
        dp[j] = prev;
      } else {
        // 当前字符不同，取三种操作的最小值
        dp[j] = Math.min(
          prev + 1, // 替换
          dp[j] + 1, // 删除
          dp[j - 1] + 1 // 插入
        );
      }

      // 更新左上角的值
      prev = temp;
    }
  }

  // 返回最小编辑距离
  return dp[n];
}
// @lc code=end
