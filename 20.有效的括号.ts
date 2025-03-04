/*
 * @lc app=leetcode.cn id=20 lang=typescript
 *
 * [20] 有效的括号
 */

// @lc code=start
function isValid(s: string): boolean {
  const map = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  const list: string[] = [];

  for (const char of s) {
    if (!map[char]) {
      // 放入左括号
      list.push(char);
    } else {
      // 取出来判断是否成对
      const leftBracket = list.pop();
      if (leftBracket !== map[char]) {
        return false;
      }
    }
  }

  return list.length === 0;
}
// @lc code=end
