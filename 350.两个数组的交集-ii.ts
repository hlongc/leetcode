/*
 * @lc app=leetcode.cn id=350 lang=typescript
 *
 * [350] 两个数组的交集 II
 */

// @lc code=start
function intersect(nums1: number[], nums2: number[]): number[] {
  const ret: number[] = [];
  const map: Record<number, number> = {};

  for (const num of nums1) {
    // 记录每个数字出现了几次
    map[num] = (map[num] ?? 0) + 1;
  }

  for (const num of nums2) {
    // 因为以数量小的为准，所以为0以后就不能再push了
    if (map[num]) {
      ret.push(num);
      map[num]--;
    }
  }

  return ret;
}
// @lc code=end
