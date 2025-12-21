/*
 * @lc app=leetcode.cn id=49 lang=typescript
 *
 * [49] 字母异位词分组
 *
 * https://leetcode.cn/problems/group-anagrams/description/
 *
 * algorithms
 * Medium (69.85%)
 * Likes:    2487
 * Dislikes: 0
 * Total Accepted:    1.4M
 * Total Submissions: 1.9M
 * Testcase Example:  '["eat","tea","tan","ate","nat","bat"]'
 *
 * 给你一个字符串数组，请你将 字母异位词 组合在一起。可以按任意顺序返回结果列表。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
 *
 * 输出: [["bat"],["nat","tan"],["ate","eat","tea"]]
 *
 * 解释：
 *
 *
 * 在 strs 中没有字符串可以通过重新排列来形成 "bat"。
 * 字符串 "nat" 和 "tan" 是字母异位词，因为它们可以重新排列以形成彼此。
 * 字符串 "ate" ，"eat" 和 "tea" 是字母异位词，因为它们可以重新排列以形成彼此。
 *
 *
 *
 * 示例 2:
 *
 *
 * 输入: strs = [""]
 *
 * 输出: [[""]]
 *
 *
 * 示例 3:
 *
 *
 * 输入: strs = ["a"]
 *
 * 输出: [["a"]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= strs.length <= 10^4
 * 0 <= strs[i].length <= 100
 * strs[i] 仅包含小写字母
 *
 *
 */

// @lc code=start
/**
 * 字母异位词分组
 *
 * 解题思路：
 * 1. 使用哈希表（Map）来存储分组结果
 * 2. 对于每个字符串，将其字符排序后作为key
 * 3. 相同的key表示这些字符串是字母异位词
 * 4. 将原字符串加入对应key的数组中
 * 5. 最后返回所有分组的结果
 *
 * 时间复杂度：O(N × K log K)，N是字符串数组长度，K是字符串的最大长度
 * 空间复杂度：O(N × K)，用于存储哈希表
 */
function groupAnagrams(strs: string[]): string[][] {
  // 创建哈希表，key为排序后的字符串，value为字母异位词数组
  const map = new Map<string, string[]>();

  // 遍历每个字符串
  for (const str of strs) {
    // 将字符串排序作为key，字母异位词排序后应该相同
    // 例如：'eat' -> 'aet', 'tea' -> 'aet', 'ate' -> 'aet'
    const sortedStr = str.split("").sort().join("");

    // 如果map中已有该key，将当前字符串加入对应数组
    // 否则创建新的数组
    if (map.has(sortedStr)) {
      map.get(sortedStr)!.push(str);
    } else {
      map.set(sortedStr, [str]);
    }
  }

  // 返回所有分组的结果
  // Array.from() 将Map的values()转换为数组
  return Array.from(map.values());
}
// @lc code=end
