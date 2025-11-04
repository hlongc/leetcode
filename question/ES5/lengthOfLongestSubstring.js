/**
 * 给定一个字符串 s ，请你找出其中不含有重复字符的 最长子串 的长度。


示例 1:

输入: s = "abcabcbb"
输出: 3
解释: 因为无重复字符的最长子串是 "abc"，所以其长度为 3。

示例 2:

输入: s = "bbbbb"
输出: 1
解释: 因为无重复字符的最长子串是 "b"，所以其长度为 1。

示例 3:

输入: s = "pwwkew"
输出: 3
解释: 因为无重复字符的最长子串是 "wke"，所以其长度为 3。
     请注意，你的答案必须是 子串 的长度，"pwke" 是一个子序列，不是子串。

示例 4:

输入: s = ""
输出: 0
 */

// ============ 解法1: 滑动窗口 + Map（推荐，最优解）============
/**
 * 时间复杂度: O(n) - 每个字符最多被访问两次（left 和 right 各一次）
 * 空间复杂度: O(min(m, n)) - m 是字符集大小，n 是字符串长度
 *
 * 核心思路：
 * 1. 使用滑动窗口 [left, right] 维护一个不含重复字符的子串
 * 2. 使用 Map 记录每个字符最后出现的位置
 * 3. 当遇到重复字符时，移动左指针到重复字符的下一位
 */
function lengthOfLongestSubstring(s) {
  // Map 存储: key=字符, value=该字符最后出现的索引位置
  const map = new Map();

  let maxLength = 0; // 记录最长子串的长度
  let left = 0; // 滑动窗口的左边界

  // right 是滑动窗口的右边界，不断向右扩展
  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // 如果当前字符在窗口内已经出现过
    // map.get(char) >= left 确保重复字符在当前窗口内
    if (map.has(char) && map.get(char) >= left) {
      // 将左边界移动到重复字符的下一位
      // 例如: "abca" 当 right=3 时，遇到重复的 'a'
      // left 从 0 移动到 map.get('a') + 1 = 1
      left = map.get(char) + 1;
    }

    // 更新当前字符的位置（无论是否重复都要更新）
    map.set(char, right);

    // 更新最大长度
    // 当前窗口长度 = right - left + 1
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// ============ 解法2: 滑动窗口 + Set ============
/**
 * 时间复杂度: O(2n) = O(n) - 最坏情况下每个字符被访问两次
 * 空间复杂度: O(min(m, n))
 *
 * 核心思路：
 * 使用 Set 记录窗口内的字符，当遇到重复字符时，从左边逐个删除直到无重复
 */
function lengthOfLongestSubstring2(s) {
  const set = new Set(); // 记录当前窗口内的字符
  let maxLength = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // 如果遇到重复字符，不断收缩左边界
    // 直到窗口内不再包含该字符
    while (set.has(char)) {
      set.delete(s[left]); // 删除左边界的字符
      left++; // 左边界右移
    }

    // 将当前字符加入窗口
    set.add(char);

    // 更新最大长度
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// ============ 解法3: 暴力解法（不推荐，仅供理解）============
/**
 * 时间复杂度: O(n³) - 双层循环 + 检查重复
 * 空间复杂度: O(min(m, n))
 */
function lengthOfLongestSubstring3(s) {
  let maxLength = 0;

  // 枚举所有可能的起始位置
  for (let i = 0; i < s.length; i++) {
    // 枚举所有可能的结束位置
    for (let j = i; j < s.length; j++) {
      // 检查 s[i...j] 是否有重复字符
      if (allUnique(s, i, j)) {
        maxLength = Math.max(maxLength, j - i + 1);
      }
    }
  }

  return maxLength;
}

// 辅助函数: 检查字符串 s[start...end] 是否所有字符都唯一
function allUnique(s, start, end) {
  const set = new Set();
  for (let i = start; i <= end; i++) {
    if (set.has(s[i])) {
      return false;
    }
    set.add(s[i]);
  }
  return true;
}

// ============ 测试用例 ============
console.log("=== 测试解法1（Map）===");
console.log(lengthOfLongestSubstring("abcabcbb")); // 3 ("abc")
console.log(lengthOfLongestSubstring("bbbbb")); // 1 ("b")
console.log(lengthOfLongestSubstring("pwwkew")); // 3 ("wke")
console.log(lengthOfLongestSubstring("")); // 0
console.log(lengthOfLongestSubstring("au")); // 2 ("au")
console.log(lengthOfLongestSubstring("dvdf")); // 3 ("vdf")

console.log("\n=== 测试解法2（Set）===");
console.log(lengthOfLongestSubstring2("abcabcbb")); // 3
console.log(lengthOfLongestSubstring2("bbbbb")); // 1
console.log(lengthOfLongestSubstring2("pwwkew")); // 3

console.log("\n=== 测试解法3（暴力）===");
console.log(lengthOfLongestSubstring3("abcabcbb")); // 3
console.log(lengthOfLongestSubstring3("bbbbb")); // 1

// ============ 图解示例 ============
/**
 * 以 "abcabcbb" 为例，解法1的执行过程：
 *
 * 初始: left=0, maxLength=0, map={}
 *
 * right=0, char='a': map={'a':0}, window="a", maxLength=1
 * right=1, char='b': map={'a':0,'b':1}, window="ab", maxLength=2
 * right=2, char='c': map={'a':0,'b':1,'c':2}, window="abc", maxLength=3
 *
 * right=3, char='a': 遇到重复！
 *   - map.get('a')=0 >= left(0)，所以 left=0+1=1
 *   - map={'a':3,'b':1,'c':2}, window="bca", maxLength=3
 *
 * right=4, char='b': 遇到重复！
 *   - map.get('b')=1 >= left(1)，所以 left=1+1=2
 *   - map={'a':3,'b':4,'c':2}, window="cab", maxLength=3
 *
 * right=5, char='c': 遇到重复！
 *   - map.get('c')=2 >= left(2)，所以 left=2+1=3
 *   - map={'a':3,'b':4,'c':5}, window="abc", maxLength=3
 *
 * right=6, char='b': 遇到重复！
 *   - map.get('b')=4 >= left(3)，所以 left=4+1=5
 *   - map={'a':3,'b':6,'c':5}, window="cb", maxLength=3
 *
 * right=7, char='b': 遇到重复！
 *   - map.get('b')=6 >= left(5)，所以 left=6+1=7
 *   - map={'a':3,'b':7,'c':5}, window="b", maxLength=3
 *
 * 最终返回: 3
 */

// ============ 关键点总结 ============
/**
 * 1. 滑动窗口的本质：
 *    - 维护一个动态的区间 [left, right]
 *    - right 不断右移扩大窗口
 *    - 当条件不满足时，left 右移缩小窗口
 *
 * 2. Map vs Set 的选择：
 *    - Map: 记录字符位置，可以直接跳跃 left（更优）
 *    - Set: 只记录存在性，需要逐步移动 left
 *
 * 3. 易错点：
 *    - map.get(char) >= left 这个条件很关键
 *      确保重复字符在当前窗口内，而不是之前的窗口
 *    - 例如 "abba"，当处理最后一个 'a' 时
 *      第一个 'a' 已经不在窗口内了
 *
 * 4. 类似题目：
 *    - 76. 最小覆盖子串
 *    - 438. 找到字符串中所有字母异位词
 *    - 567. 字符串的排列
 */
