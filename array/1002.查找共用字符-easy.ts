/*
 * @lc app=leetcode.cn id=1002 lang=typescript
 *
 * [1002] 查找共用字符
 *
 * https://leetcode.cn/problems/find-common-characters/description/
 *
 * algorithms
 * Easy (70.47%)
 * Likes:    397
 * Dislikes: 0
 * Total Accepted:    106.9K
 * Total Submissions: 151.6K
 * Testcase Example:  '["bella","label","roller"]'
 *
 * 给你一个字符串数组 words ，请你找出所有在 words 的每个字符串中都出现的共用字符（包括重复字符），并以数组形式返回。你可以按 任意顺序
 * 返回答案。
 *
 *
 * 示例 1：
 *
 *
 * 输入：words = ["bella","label","roller"]
 * 输出：["e","l","l"]
 *
 *
 * 示例 2：
 *
 *
 * 输入：words = ["cool","lock","cook"]
 * 输出：["c","o"]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= words.length <= 100
 * 1 <= words[i].length <= 100
 * words[i] 由小写英文字母组成
 *
 *
 */

// @lc code=start
/**
 * 解法一：频率统计 + 取最小值（推荐）
 *
 * 核心思路：
 * 1. 统计第一个字符串中每个字符的出现次数
 * 2. 遍历其余字符串，对每个字符，取当前频率和该字符串中频率的最小值
 * 3. 最终得到的频率就是所有字符串中的共同字符及其最小出现次数
 * 4. 根据频率构建结果数组
 *
 * 示例："bella", "label", "roller"
 * - 初始化 bella: {b:1, e:1, l:2, a:1}
 * - 与 label 比较: {e:1, l:2, a:1} (b不在label中，频率变0)
 * - 与 roller 比较: {e:1, l:2} (a不在roller中，频率变0)
 * - 结果: ["e", "l", "l"]
 *
 * 时间复杂度：O(n * m)，n 是字符串数量，m 是字符串平均长度
 * 空间复杂度：O(1)，只有26个小写字母
 */
function commonChars(words: string[]): string[] {
  // 使用数组存储字符频率，索引0-25对应a-z
  const minFreq: number[] = new Array(26).fill(0);

  // 统计第一个字符串的字符频率
  for (const char of words[0]) {
    const index = char.charCodeAt(0) - "a".charCodeAt(0);
    minFreq[index]++;
  }

  // 遍历其余字符串，更新最小频率
  for (let i = 1; i < words.length; i++) {
    const currentFreq: number[] = new Array(26).fill(0);

    // 统计当前字符串的字符频率
    for (const char of words[i]) {
      const index = char.charCodeAt(0) - "a".charCodeAt(0);
      currentFreq[index]++;
    }

    // 更新最小频率
    for (let j = 0; j < 26; j++) {
      minFreq[j] = Math.min(minFreq[j], currentFreq[j]);
    }
  }

  // 构建结果数组
  const result: string[] = [];
  for (let i = 0; i < 26; i++) {
    if (minFreq[i] > 0) {
      const char = String.fromCharCode("a".charCodeAt(0) + i);
      // 将字符添加 minFreq[i] 次
      for (let j = 0; j < minFreq[i]; j++) {
        result.push(char);
      }
    }
  }

  return result;
}

/**
 * 解法二：使用 Map（更直观）
 *
 * 核心思路同解法一，但使用 Map 代替数组
 *
 * 时间复杂度：O(n * m)
 * 空间复杂度：O(1)，最多26个字符
 */
function commonChars2(words: string[]): string[] {
  /**
   * 辅助函数：统计字符串中每个字符的出现次数
   */
  function getCharFreq(word: string): Map<string, number> {
    const freq = new Map<string, number>();
    for (const char of word) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    return freq;
  }

  // 统计第一个字符串的字符频率作为初始值
  let commonFreq = getCharFreq(words[0]);

  // 遍历其余字符串，更新共同字符的最小频率
  for (let i = 1; i < words.length; i++) {
    const currentFreq = getCharFreq(words[i]);
    const newCommonFreq = new Map<string, number>();

    // 只保留同时存在于两个 Map 中的字符，并取最小频率
    for (const [char, count] of commonFreq) {
      if (currentFreq.has(char)) {
        newCommonFreq.set(char, Math.min(count, currentFreq.get(char)!));
      }
    }

    commonFreq = newCommonFreq;
  }

  // 构建结果数组
  const result: string[] = [];
  for (const [char, count] of commonFreq) {
    for (let i = 0; i < count; i++) {
      result.push(char);
    }
  }

  return result;
}

/**
 * 解法三：函数式编程风格
 *
 * 核心思路：使用 reduce 和 filter 等高阶函数
 *
 * 时间复杂度：O(n * m)
 * 空间复杂度：O(1)
 */
function commonChars3(words: string[]): string[] {
  // 将字符串转换为字符频率 Map
  const getFreq = (word: string): Map<string, number> => {
    const freq = new Map<string, number>();
    for (const char of word) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    return freq;
  };

  // 使用 reduce 计算所有字符串的共同字符最小频率
  const commonFreq = words.slice(1).reduce((acc, word) => {
    const currentFreq = getFreq(word);
    const result = new Map<string, number>();

    for (const [char, count] of acc) {
      if (currentFreq.has(char)) {
        result.set(char, Math.min(count, currentFreq.get(char)!));
      }
    }

    return result;
  }, getFreq(words[0]));

  // 展开频率 Map 为结果数组
  return Array.from(commonFreq.entries()).flatMap(([char, count]) =>
    Array(count).fill(char)
  );
}

/**
 * 图解示例：
 *
 * 示例 1：words = ["bella","label","roller"]
 *
 * 步骤1：统计第一个字符串 "bella"
 * { b:1, e:1, l:2, a:1 }
 *
 * 步骤2：与 "label" 比较
 * label: { l:2, a:1, b:1, e:1 }
 * 共同字符取最小:
 * - b: min(1, 1) = 1
 * - e: min(1, 1) = 1
 * - l: min(2, 2) = 2
 * - a: min(1, 1) = 1
 * 结果: { b:1, e:1, l:2, a:1 }
 *
 * 步骤3：与 "roller" 比较
 * roller: { r:2, o:1, l:2, e:1 }
 * 共同字符取最小:
 * - b: 不在 roller 中，移除
 * - e: min(1, 1) = 1 ✓
 * - l: min(2, 2) = 2 ✓
 * - a: 不在 roller 中，移除
 * 结果: { e:1, l:2 }
 *
 * 步骤4：构建结果数组
 * e 出现 1 次: ["e"]
 * l 出现 2 次: ["e", "l", "l"]
 *
 * 最终输出：["e", "l", "l"]
 *
 * ---
 *
 * 示例 2：words = ["cool","lock","cook"]
 *
 * 步骤1：统计 "cool"
 * { c:1, o:2, l:1 }
 *
 * 步骤2：与 "lock" 比较
 * lock: { l:1, o:1, c:1, k:1 }
 * 共同字符:
 * - c: min(1, 1) = 1
 * - o: min(2, 1) = 1
 * - l: min(1, 1) = 1
 * 结果: { c:1, o:1, l:1 }
 *
 * 步骤3：与 "cook" 比较
 * cook: { c:1, o:2, k:1 }
 * 共同字符:
 * - c: min(1, 1) = 1 ✓
 * - o: min(1, 2) = 1 ✓
 * - l: 不在 cook 中，移除
 * 结果: { c:1, o:1 }
 *
 * 最终输出：["c", "o"]
 *
 * ---
 *
 * 关键点：
 * 1. 需要统计每个字符在每个字符串中的出现次数
 * 2. 共同字符的数量 = 该字符在所有字符串中出现次数的最小值
 * 3. 如果某个字符在任何一个字符串中不存在，其最小频率为 0，不应出现在结果中
 */
// @lc code=end
