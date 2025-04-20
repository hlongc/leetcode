/*
 * @lc app=leetcode.cn id=187 lang=typescript
 *
 * [187] 重复的DNA序列
 */

// @lc code=start
/**
 * 查找所有在DNA字符串中出现超过一次的10字符长度的子串
 *
 * 使用哈希集合的简单解法：
 * 1. 遍历字符串，获取每个长度为10的子串
 * 2. 使用一个集合记录已经见过的子串
 * 3. 使用另一个集合记录已经找到的重复子串
 *
 * @param s DNA序列字符串
 * @returns 所有重复出现的10字符长度子串数组
 */
function findRepeatedDnaSequences(s: string): string[] {
  // 如果字符串长度小于10，不可能有重复的10字符长度子串
  if (s.length < 10) {
    return [];
  }

  // 存储已经见过的子串
  const seen = new Set<string>();
  // 存储重复的子串
  const repeated = new Set<string>();

  // 遍历所有可能的长度为10的子串
  for (let i = 0; i <= s.length - 10; i++) {
    // 提取当前的10个字符子串
    const substring = s.substring(i, i + 10);

    // 如果这个子串之前见过，说明它是重复的，加入到repeated集合
    if (seen.has(substring)) {
      repeated.add(substring);
    } else {
      // 否则，标记为已见过
      seen.add(substring);
    }
  }

  // 将repeated集合转换为数组返回
  return Array.from(repeated);
}
// @lc code=end

/**
 * 算法分析：
 *
 * 示例：s = "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"
 *
 * 1. 初始时，seen = {}, repeated = {}
 *
 * 2. i = 0, substring = "AAAAACCCCC"
 *    seen未包含此子串，将它添加到seen: seen = {"AAAAACCCCC"}
 *
 * 3. i = 1, substring = "AAAACCCCCA"
 *    seen未包含此子串，将它添加到seen: seen = {"AAAAACCCCC", "AAAACCCCCA"}
 *
 * 4. 继续这个过程...
 *
 * 5. 当i = 10, substring = "AAAAACCCCC"
 *    seen已经包含此子串，将它添加到repeated: repeated = {"AAAAACCCCC"}
 *
 * 6. 最终，对于示例输入，repeated = {"AAAAACCCCC", "CCCCCAAAAA"}
 *    所以返回 ["AAAAACCCCC", "CCCCCAAAAA"]
 *
 * 时间复杂度：O(n)，其中n是字符串长度，每个子串的处理时间为O(1)
 * 空间复杂度：O(n)，用于存储哈希集合
 *
 * 这种方法的优点是：
 * 1. 代码简单清晰，易于理解
 * 2. 直接使用字符串作为键，无需额外的编码/解码操作
 * 3. 依然保持O(n)的时间复杂度
 */
