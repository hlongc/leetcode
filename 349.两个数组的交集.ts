/*
 * @lc app=leetcode.cn id=349 lang=typescript
 *
 * [349] 两个数组的交集
 */

// @lc code=start
function intersection(nums1: number[], nums2: number[]): number[] {
  const ret: number[] = [];
  const map: Record<number, boolean> = {};

  for (const num of nums1) {
    map[num] = true;
  }

  for (const num of nums2) {
    if (map[num]) {
      ret.push(num);
      // 重置，避免重复Push
      map[num] = false;
    }
  }

  return ret;
}
// @lc code=end
