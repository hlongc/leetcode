/*
 * @lc app=leetcode.cn id=42 lang=typescript
 *
 * [42] 接雨水
 */

// @lc code=start
function trap1(height: number[]): number {
  let ret = 0;
  const len = height.length;
  const leftMax: number[] = [height[0]];
  const rightMax: number[] = Array(len);
  rightMax[len - 1] = height[len - 1];
  /**
   * 木桶能装多少水，取决于短板有多长
   * 所以计算每块木桶左侧的最大值和右侧的最大值，取其中较小作为高度进行计算
   */
  for (let i = 1; i < len; i++) {
    leftMax[i] = Math.max(leftMax[i - 1], height[i]);
  }

  for (let i = len - 2; i >= 0; i--) {
    rightMax[i] = Math.max(rightMax[i + 1], height[i]);
  }

  for (let i = 0; i < len; i++) {
    ret += Math.min(leftMax[i], rightMax[i]) - height[i];
  }

  return ret;
}

function trap(height: number[]): number {
  let ret = 0;
  let left = 0,
    right = height.length - 1;
  let leftMax = 0,
    rightMax = 0;
  // 双指针实时计算左侧和右侧的最大值和最小值，再取这两个值的最小值进行计算，并移动指针
  while (left <= right) {
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);

    if (leftMax < rightMax) {
      ret += leftMax - height[left];
      left++;
    } else {
      ret += rightMax - height[right];
      right--;
    }
  }

  return ret;
}
// @lc code=end
