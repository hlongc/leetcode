/*
 * @lc app=leetcode.cn id=819 lang=typescript
 *
 * [819] 最常见的单词
 *
 * 题目描述：
 * 给定一个段落 (paragraph) 和一个禁用单词列表 (banned)。
 * 返回出现次数最多，同时不在禁用列表中的单词。
 * 题目保证至少有一个词不在禁用列表中，而且答案唯一。
 *
 * 禁用列表中的单词用小写字母表示，不含标点符号。
 * 段落中的单词不区分大小写，标点符号需要被忽略，包括"!?',;."等。
 */

// @lc code=start
/**
 * 查找段落中出现次数最多且不在禁用列表中的单词
 *
 * @param paragraph 段落文本
 * @param banned 禁用单词列表
 * @returns 出现次数最多且不在禁用列表中的单词
 */
function mostCommonWord(paragraph: string, banned: string[]): string {
  // 1. 预处理段落文本：
  // - 将所有字母转为小写（不区分大小写）
  // - 将所有非字母字符替换为空格（忽略标点符号）
  const normalizedStr = paragraph.toLowerCase().replace(/[^a-z]/g, " ");

  // 2. 分割文本为单词数组
  // - 使用空格分割
  // - 过滤掉空字符串（可能由连续空格产生）
  const words = normalizedStr.split(" ").filter((word) => word.length > 0);

  // 3. 将禁用单词列表转换为Set，便于快速查找
  const bannedSet = new Set(banned);

  // 4. 统计每个单词的出现次数
  const wordCount = new Map<string, number>();

  for (const word of words) {
    // 如果单词不在禁用列表中，则计数
    if (!bannedSet.has(word)) {
      // 如果单词已存在于计数Map中，则次数+1，否则初始化为1
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  }

  // 5. 找出出现次数最多的单词
  let maxCount = 0;
  let mostCommon = "";

  // 遍历词频Map，找出最大值
  for (const [word, count] of wordCount) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = word;
    }
  }

  return mostCommon;
}

/**
 * 解题思路：
 *
 * 1. 文本预处理：
 *    - 将段落转为小写（因为题目要求不区分大小写）
 *    - 将所有非字母字符替换为空格（这样可以忽略所有标点符号）
 *
 * 2. 分词：
 *    - 使用空格分割文本为单词数组
 *    - 过滤掉空字符串，避免连续标点产生的空单词
 *
 * 3. 高效查找禁用词：
 *    - 使用Set数据结构存储禁用词列表，查找时间复杂度为O(1)
 *
 * 4. 词频统计：
 *    - 使用Map记录每个非禁用词的出现次数
 *
 * 5. 查找最大值：
 *    - 遍历Map找出出现次数最多的单词
 *
 * 时间复杂度：O(n+m)，其中n是段落长度，m是禁用词数量
 * 空间复杂度：O(n+m)，需要存储分词结果和禁用词集合
 */
// @lc code=end
