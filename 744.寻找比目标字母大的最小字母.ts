/*
 * @lc app=leetcode.cn id=744 lang=typescript
 *
 * [744] 寻找比目标字母大的最小字母
 */

// @lc code=start
function nextGreatestLetter(letters: string[], target: string): string {
  let ret = letters[0];
  let left = 0,
    right = letters.length - 1;

  while (left <= right) {
    const mid = left + ((right - left) >> 1);
    if (letters[mid] > target) {
      right = mid - 1;
      ret = letters[mid];
    } else {
      left = mid + 1;
    }
  }

  return ret;
}
// @lc code=end
