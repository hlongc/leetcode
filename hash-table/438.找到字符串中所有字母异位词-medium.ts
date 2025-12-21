/*
 * @lc app=leetcode.cn id=438 lang=typescript
 *
 * [438] 找到字符串中所有字母异位词
 *
 * https://leetcode.cn/problems/find-all-anagrams-in-a-string/description/
 *
 * algorithms
 * Medium (54.54%)
 * Likes:    1810
 * Dislikes: 0
 * Total Accepted:    866.8K
 * Total Submissions: 1.6M
 * Testcase Example:  '"cbaebabacd"\n"abc"'
 *
 * 给定两个字符串 s 和 p，找到 s 中所有 p 的 异位词 的子串，返回这些子串的起始索引。不考虑答案输出的顺序。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: s = "cbaebabacd", p = "abc"
 * 输出: [0,6]
 * 解释:
 * 起始索引等于 0 的子串是 "cba", 它是 "abc" 的异位词。
 * 起始索引等于 6 的子串是 "bac", 它是 "abc" 的异位词。
 *
 *
 * 示例 2:
 *
 *
 * 输入: s = "abab", p = "ab"
 * 输出: [0,1,2]
 * 解释:
 * 起始索引等于 0 的子串是 "ab", 它是 "ab" 的异位词。
 * 起始索引等于 1 的子串是 "ba", 它是 "ab" 的异位词。
 * 起始索引等于 2 的子串是 "ab", 它是 "ab" 的异位词。
 *
 *
 *
 *
 * 提示:
 *
 *
 * 1 <= s.length, p.length <= 3 * 10^4
 * s 和 p 仅包含小写字母
 *
 *
 */

// @lc code=start
/**
 * 找到字符串中所有字母异位词
 *
 * 解题思路：滑动窗口 + 字符频次比较
 * 1. 创建目标字符串p的字符频次数组
 * 2. 使用滑动窗口遍历字符串s，窗口大小等于p的长度
 * 3. 维护当前窗口的字符频次数组
 * 4. 当两个频次数组相等时，说明找到了一个异位词
 * 5. 窗口右移时，移除左边字符，添加右边字符
 *
 * 时间复杂度：O(|s| + |p|)，每个字符最多被访问两次
 * 空间复杂度：O(1)，只使用固定大小的字符频次数组（26个小写字母）
 */
function findAnagrams(s: string, p: string): number[] {
  const result: number[] = [];

  // 边界条件：如果s比p短，不可能包含p的异位词
  if (s.length < p.length) {
    return result;
  }

  // 创建字符频次数组，索引0-25对应字符a-z
  const pCount = new Array(26).fill(0); // 目标字符串p的频次
  const windowCount = new Array(26).fill(0); // 当前滑动窗口的频次

  // 统计目标字符串p的字符频次
  for (let i = 0; i < p.length; i++) {
    pCount[p.charCodeAt(i) - 97]++; // 97是'a'的ASCII码
  }

  // 初始化滑动窗口：处理前p.length个字符
  for (let i = 0; i < p.length; i++) {
    windowCount[s.charCodeAt(i) - 97]++;
  }

  // 比较初始窗口是否为异位词
  if (arraysEqual(pCount, windowCount)) {
    result.push(0);
  }

  // 滑动窗口：从位置p.length开始
  for (let i = p.length; i < s.length; i++) {
    // 窗口右移：
    // 1. 添加新字符（窗口右边界）
    windowCount[s.charCodeAt(i) - 97]++;

    // 2. 移除旧字符（窗口左边界）
    const leftIndex = i - p.length; // 要移除的字符索引
    windowCount[s.charCodeAt(leftIndex) - 97]--;

    // 3. 检查当前窗口是否为异位词
    if (arraysEqual(pCount, windowCount)) {
      result.push(leftIndex + 1); // leftIndex + 1是当前窗口的起始位置
    }
  }

  return result;
}

/**
 * 比较两个数组是否相等
 * @param arr1 第一个数组
 * @param arr2 第二个数组
 * @returns 是否相等
 */
function arraysEqual(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}
// @lc code=end
