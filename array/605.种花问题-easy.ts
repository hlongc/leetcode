/*
 * @lc app=leetcode.cn id=605 lang=typescript
 *
 * [605] 种花问题
 *
 * https://leetcode.cn/problems/can-place-flowers/description/
 *
 * algorithms
 * Easy (32.21%)
 * Likes:    779
 * Dislikes: 0
 * Total Accepted:    269.5K
 * Total Submissions: 836.9K
 * Testcase Example:  '[1,0,0,0,1]\n1'
 *
 * 假设有一个很长的花坛，一部分地块种植了花，另一部分却没有。可是，花不能种植在相邻的地块上，它们会争夺水源，两者都会死去。
 *
 * 给你一个整数数组 flowerbed 表示花坛，由若干 0 和 1 组成，其中 0 表示没种植花，1 表示种植了花。另有一个数 n
 * ，能否在不打破种植规则的情况下种入 n 朵花？能则返回 true ，不能则返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：flowerbed = [1,0,0,0,1], n = 1
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：flowerbed = [1,0,0,0,1], n = 2
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= flowerbed.length <= 2 * 10^4
 * flowerbed[i] 为 0 或 1
 * flowerbed 中不存在相邻的两朵花
 * 0 <= n <= flowerbed.length
 *
 */

// @lc code=start
function canPlaceFlowers(flowerbed: number[], n: number): boolean {
  // 贪心：尽可能在最左边可种的位置种花，这不会影响后续能种的最大数量
  // 规则：当前位置为0，且左右相邻(若存在)也为0，才允许种花
  // 边界位置只需要检查存在的一侧

  // 可提前剪枝：需要种的数量为0，直接返回true
  if (n <= 0) return true;

  let canPlant = 0; // 已成功种下的花的数量
  const len = flowerbed.length;

  for (let i = 0; i < len; i++) {
    // 仅当当前位置为空地时才有可能种花
    if (flowerbed[i] === 0) {
      const emptyLeft = i === 0 || flowerbed[i - 1] === 0; // 左侧为空或越界视为空
      const emptyRight = i === len - 1 || flowerbed[i + 1] === 0; // 右侧为空或越界视为空

      if (emptyLeft && emptyRight) {
        // 在当前位置种花，并计数
        flowerbed[i] = 1;
        canPlant++;
        if (canPlant >= n) return true; // 及早返回，避免不必要遍历
      }
    }
  }

  return canPlant >= n;
}
// @lc code=end
