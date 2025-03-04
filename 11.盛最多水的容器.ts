/*
 * @lc app=leetcode.cn id=11 lang=typescript
 *
 * [11] 盛最多水的容器
 */

// @lc code=start
function maxArea(height: number[]): number {
  let max = -Infinity;
  let l = 0;
  let r = height.length - 1;

  while (l < r) {
    const width = r - l;
    let minHeight = -1;
    if (height[l] < height[r]) {
      minHeight = height[l];
      l++;
    } else {
      minHeight = height[r];
      r--;
    }

    max = Math.max(max, width * minHeight);
  }

  return max;
}
// @lc code=end
