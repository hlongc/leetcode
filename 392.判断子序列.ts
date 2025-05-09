/*
 * @lc app=leetcode.cn id=392 lang=typescript
 *
 * [392] 判断子序列
 */

// @lc code=start
/**
 * 方法一：双指针法
 * 时间复杂度: O(n)，其中n是字符串t的长度
 * 空间复杂度: O(1)，只使用了常数额外空间
 */
function isSubsequence(s: string, t: string): boolean {
  // slow指针指向s，fast指针指向t
  let slow = 0,
    fast = 0;

  // 同时遍历两个字符串，直到任一字符串结束
  while (slow < s.length && fast < t.length) {
    // 如果当前字符匹配，s的指针向前移动
    if (t[fast++] === s[slow]) {
      slow++;
    }
  }

  // 如果s被完全匹配，则返回true；否则返回false
  return slow === s.length;
}

/**
 * 方法二：预处理 + 二分查找（适合s有多个且t不变的情况）
 * 时间复杂度：预处理O(m)，每次查询O(n log m)，其中m是t的长度，n是s的长度
 * 空间复杂度：O(m * 26)，存储了t中每个字符的下一个位置
 */
function isSubsequence2(s: string, t: string): boolean {
  const m = t.length;

  // 预处理：记录t中每个位置之后每个字符下一次出现的位置
  // dp[i][j]表示从位置i开始，字符j下一次出现的位置
  // j用ASCII码值减'a'的ASCII码值来索引(0-25)
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(26).fill(m));

  // 从后向前填充dp数组
  for (let i = m - 1; i >= 0; i--) {
    for (let j = 0; j < 26; j++) {
      // 默认继承后一个位置的信息
      dp[i][j] = dp[i + 1][j];
    }
    // 更新当前字符的下一个位置为当前位置
    const charIndex = t.charCodeAt(i) - "a".charCodeAt(0);
    dp[i][charIndex] = i;
  }

  // 查询s是否为t的子序列
  let index = 0; // t中的当前位置
  for (let i = 0; i < s.length; i++) {
    const charIndex = s.charCodeAt(i) - "a".charCodeAt(0);

    // 如果当前位置之后没有这个字符，则返回false
    if (dp[index][charIndex] === m) return false;

    // 移动到这个字符下一次出现的位置之后
    index = dp[index][charIndex] + 1;
  }

  return true;
}

// 默认使用方法一，如果需要多次查询同一个t的子序列，可以考虑使用方法二
// @lc code=end
