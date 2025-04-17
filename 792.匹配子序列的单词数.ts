/*
 * @lc app=leetcode.cn id=792 lang=typescript
 *
 * [792] 匹配子序列的单词数
 */

// @lc code=start
/**
 * 计算是 s 子序列的单词数量
 *
 * 思路：
 * 1. 预处理字符串s，记录每个字符出现的位置
 * 2. 对于每个单词，检查它是否是s的子序列
 * 3. 使用二分查找优化查找过程
 *
 * @param s 主字符串
 * @param words 待检查的单词数组
 * @returns 是s子序列的单词数量
 */
function numMatchingSubseq(s: string, words: string[]): number {
  // 缓存s中每个字符的索引
  const cache = new Map<string, number[]>();

  // 预处理s，记录每个字符出现的所有位置
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (!cache.has(char)) {
      cache.set(char, []);
    }
    cache.get(char)!.push(i);
  }

  let count = 0;

  // 检查每个单词
  for (const word of words) {
    let isSubseq = true;
    // 当前s中匹配到的位置，初始为-1
    let idx = -1;

    // 检查word的每个字符
    for (const char of word) {
      // 如果字符不在s中，则word不可能是s的子序列
      if (!cache.has(char)) {
        isSubseq = false;
        break;
      }

      // 获取字符在s中的所有位置
      const positions = cache.get(char)!;

      // 二分查找大于idx的第一个位置
      let left = 0;
      let right = positions.length - 1;
      let pos = -1;

      while (left <= right) {
        const mid = left + ((right - left) >> 1);
        if (positions[mid] > idx) {
          // 找到一个大于idx的位置，但可能不是第一个
          pos = positions[mid];
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      }

      // 如果没找到大于idx的位置，说明无法匹配
      if (pos === -1) {
        isSubseq = false;
        break;
      }

      // 更新idx为找到的位置
      idx = pos;
    }

    // 如果word是s的子序列，计数加1
    if (isSubseq) {
      count++;
    }
  }

  return count;
}
// @lc code=end
