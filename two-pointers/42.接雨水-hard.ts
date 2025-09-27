/*
 * @lc app=leetcode.cn id=42 lang=typescript
 *
 * [42] 接雨水
 *
 * https://leetcode.cn/problems/trapping-rain-water/description/
 *
 * algorithms
 * Hard (65.16%)
 * Likes:    5889
 * Dislikes: 0
 * Total Accepted:    1.5M
 * Total Submissions: 2.3M
 * Testcase Example:  '[0,1,0,2,1,0,1,3,2,1,2,1]'
 *
 * 给定 n 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：height = [0,1,0,2,1,0,1,3,2,1,2,1]
 * 输出：6
 * 解释：上面是由数组 [0,1,0,2,1,0,1,3,2,1,2,1] 表示的高度图，在这种情况下，可以接 6 个单位的雨水（蓝色部分表示雨水）。
 *
 *
 * 示例 2：
 *
 *
 * 输入：height = [4,2,0,3,2,5]
 * 输出：9
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == height.length
 * 1 <= n <= 2 * 10^4
 * 0 <= height[i] <= 10^5
 *
 *
 */

// @lc code=start
function trap(height: number[]): number {
  if (height.length <= 2) return 0; // 少于3个柱子无法接水

  let left = 0; // 左指针
  let right = height.length - 1; // 右指针
  let leftMax = 0; // 左边遇到的最大高度
  let rightMax = 0; // 右边遇到的最大高度
  let water = 0; // 总接水量

  // 双指针从两端向中间移动
  while (left < right) {
    // 更新左右两边的最大高度
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);

    // 关键思想：当前位置能接的水量 = min(左边最大高度, 右边最大高度) - 当前高度
    // 我们总是移动高度较小的一边的指针
    if (leftMax < rightMax) {
      // 左边最大高度较小，当前位置的水量由左边决定
      water += leftMax - height[left];
      left++;
    } else {
      // 右边最大高度较小，当前位置的水量由右边决定
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
}

/*
🎯 核心思想：双指针法
- 从两端向中间移动，维护左右两边的最大高度
- 当前位置能接的水量 = min(左边最大高度, 右边最大高度) - 当前高度
- 总是移动高度较小的一边的指针

📊 详细例子：height = [0,1,0,2,1,0,1,3,2,1,2,1]

可视化：
    3|           ■
    2|     ■     ■ ■   ■
    1|   ■ ■ ■ ■ ■ ■ ■ ■ ■
    0| ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
      ------------------------
      0 1 2 3 4 5 6 7 8 9 0 1
      0 1 0 2 1 0 1 3 2 1 2 1

执行过程：
初始：left=0, right=11, leftMax=0, rightMax=0, water=0

第1步：left=0, right=11
- height[0]=0, height[11]=1
- leftMax=max(0,0)=0, rightMax=max(0,1)=1
- leftMax < rightMax，处理left位置
- water += 0-0 = 0, left=1

第2步：left=1, right=11  
- height[1]=1, height[11]=1
- leftMax=max(0,1)=1, rightMax=max(1,1)=1
- leftMax == rightMax，处理right位置
- water += 1-1 = 0, right=10

第3步：left=1, right=10
- height[1]=1, height[10]=2
- leftMax=max(1,1)=1, rightMax=max(1,2)=2
- leftMax < rightMax，处理left位置
- water += 1-1 = 0, left=2

第4步：left=2, right=10
- height[2]=0, height[10]=2
- leftMax=max(1,0)=1, rightMax=max(2,2)=2
- leftMax < rightMax，处理left位置
- water += 1-0 = 1, left=3

第5步：left=3, right=10
- height[3]=2, height[10]=2
- leftMax=max(1,2)=2, rightMax=max(2,2)=2
- leftMax == rightMax，处理right位置
- water += 2-2 = 1, right=9

...继续直到left >= right

最终water = 6

🔑 关键理解：
1. 为什么总是移动高度较小的一边？
   - 因为当前位置的水量由较小的一边决定
   - 如果左边最大高度是3，右边最大高度是5
   - 那么当前位置最多只能接3个单位的水（受左边限制）

2. 为什么这个算法正确？
   - 我们总是能确定当前位置的水量
   - 因为我们已经知道了"限制"这一边的最大高度
   - 而另一边的高度只会更大，不会影响当前计算

时间复杂度：O(n) - 每个位置最多访问一次
空间复杂度：O(1) - 只用了几个变量
*/
// @lc code=end
