/*
 * @lc app=leetcode.cn id=318 lang=typescript
 *
 * [318] 最大单词长度乘积
 *
 * https://leetcode.cn/problems/maximum-product-of-word-lengths/description/
 *
 * algorithms
 * Medium (71.79%)
 * Likes:    545
 * Dislikes: 0
 * Total Accepted:    101.6K
 * Total Submissions: 141.6K
 * Testcase Example:  '["abcw","baz","foo","bar","xtfn","abcdef"]'
 *
 * 给你一个字符串数组 words ，找出并返回 length(words[i]) * length(words[j])
 * 的最大值，并且这两个单词不含有公共字母。如果不存在这样的两个单词，返回 0 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：words = ["abcw","baz","foo","bar","xtfn","abcdef"]
 * 输出：16
 * 解释：这两个单词为 "abcw", "xtfn"。
 *
 * 示例 2：
 *
 *
 * 输入：words = ["a","ab","abc","d","cd","bcd","abcd"]
 * 输出：4
 * 解释：这两个单词为 "ab", "cd"。
 *
 * 示例 3：
 *
 *
 * 输入：words = ["a","aa","aaa","aaaa"]
 * 输出：0
 * 解释：不存在这样的两个单词。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 2 <= words.length <= 1000
 * 1 <= words[i].length <= 1000
 * words[i] 仅包含小写字母
 *
 *
 */

// @lc code=start
/**
 * 解题思路：
 * 1. 核心问题：判断两个单词是否有公共字母
 * 2. 优化方案：使用位运算将每个单词的字母集合压缩成一个整数
 *    - 因为只有26个小写字母，可以用一个32位整数的低26位表示
 *    - 第i位为1表示该单词包含第i个字母（a对应第0位，b对应第1位...）
 * 3. 判断两个单词是否有公共字母：两个整数按位与(&)结果为0则无公共字母
 * 4. 时间复杂度：O(n² + L)，n是单词数量，L是所有单词的总长度
 */
function maxProduct(words: string[]): number {
  const n = words.length;
  // 存储每个单词的位掩码（字母集合的二进制表示）
  const masks: number[] = new Array(n).fill(0);

  // 步骤1：为每个单词生成位掩码
  // 例如："abc" -> 0b111 (第0,1,2位为1)
  //      "def" -> 0b111000 (第3,4,5位为1)
  for (let i = 0; i < n; i++) {
    const word = words[i];
    for (const char of word) {
      // 将字符转换为0-25的数字，然后左移对应位数
      // 'a'.charCodeAt(0) = 97, 'a' - 'a' = 0
      const bit = char.charCodeAt(0) - "a".charCodeAt(0);
      // 使用或运算(|)将对应位设置为1
      masks[i] |= 1 << bit;
    }
  }

  let maxLen = 0;

  // 步骤2：遍历所有单词对，找出无公共字母且长度乘积最大的
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // 按位与(&)结果为0说明两个单词没有公共字母
      // 例如：0b111 & 0b111000 = 0b000000 = 0
      if ((masks[i] & masks[j]) === 0) {
        const product = words[i].length * words[j].length;
        maxLen = Math.max(maxLen, product);
      }
    }
  }

  return maxLen;
}
// @lc code=end
