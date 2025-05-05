/*
 * @lc app=leetcode.cn id=5 lang=typescript
 *
 * [5] 最长回文子串
 */

// @lc code=start
/**
 * 最长回文子串解法一：直接构建回文串
 * 此方法通过中心扩展法寻找回文串，在过程中直接构建回文字符串
 * @param s 输入字符串
 * @returns 最长的回文子串
 */
function longestPalindrome1(s: string): string {
  const len = s.length;
  let max = -1; // 记录最长回文子串的长度
  let maxStr = ""; // 记录最长回文子串

  // 遍历字符串的每个字符作为回文中心点
  for (let i = 0; i < len; i++) {
    let str = s[i]; // 初始回文串为当前字符
    let left = i - 1; // 左边界初始位置

    // 处理连续相同字符的情况（如"aaa"中的连续'a'）
    // 这样可以同时处理奇数和偶数长度的回文串
    while (s[i + 1] === s[i]) {
      str += s[i + 1]; // 将相同字符加入回文串
      i++; // 向右移动指针
    }

    let right = i + 1; // 右边界初始位置
    let tmpLen = str.length; // 当前回文串的长度

    // 从中心向两边扩展，检查是否可以形成更长的回文
    while (s[left] === s[right] && s[left] !== undefined) {
      str = s[left] + str + s[right]; // 在回文串两端添加匹配的字符
      tmpLen = str.length;
      left--; // 左指针左移
      right++; // 右指针右移
    }

    // 更新最长回文子串
    if (tmpLen > max) {
      max = tmpLen;
      maxStr = str;
    }
  }

  return maxStr;
}

/**
 * 最长回文子串解法二：记录起始位置和长度
 * 此方法使用中心扩展法，但优化了空间复杂度，只记录回文串的起始位置和长度
 * @param s 输入字符串
 * @returns 最长的回文子串
 */
function longestPalindrome(s: string): string {
  const len = s.length;
  let maxLen = -1; // 记录最长回文子串的长度
  let startPosi = -1; // 记录最长回文子串的起始位置

  // 遍历字符串的每个字符作为回文中心点
  for (let i = 0; i < len; i++) {
    let tmpLen = 1; // 初始回文长度为1（当前字符）
    let left = i - 1; // 左边界初始位置

    // 处理连续相同字符的情况
    while (s[i + 1] === s[i]) {
      tmpLen++; // 增加回文长度
      i++; // 向右移动指针
    }

    let right = i + 1; // 右边界初始位置

    // 从中心向两边扩展
    while (s[left] === s[right] && s[left] !== undefined) {
      left--; // 左指针左移
      right++; // 右指针右移
      tmpLen += 2; // 每次匹配成功，回文长度增加2
    }

    // 更新最长回文子串的信息
    if (tmpLen > maxLen) {
      startPosi = left + 1; // 起始位置为left+1（因为循环结束时left已经多减了1）
      maxLen = tmpLen;
    }
  }

  // 使用slice截取最长回文子串并返回
  return s.slice(startPosi, startPosi + maxLen);
}

/**
 * 最长回文子串解法三：动态规划
 * 使用二维数组dp[i][j]表示子串s[i...j]是否为回文串
 * @param s 输入字符串
 * @returns 最长的回文子串
 */
function longestPalindrome2(s: string): string {
  // 处理边界情况
  const n = s.length;
  if (n < 2) return s; // 长度为0或1的字符串本身就是回文串

  // 初始化变量，记录最长回文子串的起始位置和长度
  let maxLen = 1; // 最长回文子串长度，初始为1（单个字符）
  let begin = 0; // 最长回文子串的起始位置

  // 创建动态规划表：dp[i][j]表示s[i...j]是否是回文串
  // dp[i][j] = true 表示子串s[i...j]是回文串
  // dp[i][j] = false 表示子串s[i...j]不是回文串
  const dp: boolean[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(false));

  // 初始化：单个字符都是回文串
  for (let i = 0; i < n; i++) {
    dp[i][i] = true;
  }

  // 填充dp表
  // 从长度为2的子串开始，逐步扩展到整个字符串
  for (let L = 2; L <= n; L++) {
    // 枚举左边界i
    for (let i = 0; i < n; i++) {
      // 根据左边界i和子串长度L计算右边界j
      let j = i + L - 1;

      // 如果右边界越界，结束当前循环
      if (j >= n) break;

      // 判断子串s[i...j]是否为回文串
      if (s[i] !== s[j]) {
        // 如果两端字符不同，不可能是回文串
        dp[i][j] = false;
      } else {
        // 如果两端字符相同，还需要判断内部子串s[i+1...j-1]
        if (j - i < 3) {
          // 特殊情况：长度为2或3的子串，如果两端字符相同，则一定是回文串
          // 例如："aa"或"aba"
          dp[i][j] = true;
        } else {
          // 状态转移：内部子串s[i+1...j-1]是回文串，整体才是回文串
          dp[i][j] = dp[i + 1][j - 1];
        }
      }

      // 更新最长回文子串的信息
      if (dp[i][j] && j - i + 1 > maxLen) {
        maxLen = j - i + 1;
        begin = i;
      }
    }
  }

  // 返回最长回文子串
  return s.substring(begin, begin + maxLen);
}
// @lc code=end
