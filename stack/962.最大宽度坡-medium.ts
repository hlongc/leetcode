/*
 * @lc app=leetcode.cn id=962 lang=typescript
 *
 * [962] 最大宽度坡
 *
 * https://leetcode.cn/problems/maximum-width-ramp/description/
 *
 * algorithms
 * Medium (51.87%)
 * Likes:    327
 * Dislikes: 0
 * Total Accepted:    37.8K
 * Total Submissions: 72.7K
 * Testcase Example:  '[6,0,8,2,1,5]'
 *
 * 给定一个整数数组 A，坡是元组 (i, j)，其中  i < j 且 A[i] <= A[j]。这样的坡的宽度为 j - i。
 *
 * 找出 A 中的坡的最大宽度，如果不存在，返回 0 。
 *
 *
 *
 * 示例 1：
 *
 * 输入：[6,0,8,2,1,5]
 * 输出：4
 * 解释：
 * 最大宽度的坡为 (i, j) = (1, 5): A[1] = 0 且 A[5] = 5.
 *
 *
 * 示例 2：
 *
 * 输入：[9,8,1,0,1,9,4,0,4,1]
 * 输出：7
 * 解释：
 * 最大宽度的坡为 (i, j) = (2, 9): A[2] = 1 且 A[9] = 1.
 *
 *
 *
 *
 * 提示：
 *
 *
 * 2 <= A.length <= 50000
 * 0 <= A[i] <= 50000
 *
 *
 *
 *
 */

// @lc code=start
/**
 * 解法一：单调栈（推荐）
 *
 * 核心思路：
 * 1. 构建一个单调递减栈，存储可能作为坡左端点的索引
 * 2. 从右往左遍历数组，对于每个位置，尝试与栈中的元素匹配
 * 3. 如果当前值 >= 栈顶索引对应的值，说明可以形成坡，弹出栈顶并更新最大宽度
 *
 * 为什么用单调递减栈？
 * - 栈中保存的是潜在的坡的左端点
 * - 如果 nums[i] >= nums[stack.top]，那么 i 不可能是更优的左端点
 *   （因为 stack.top 的索引更小，能形成更大的宽度）
 * - 所以只保留递减的元素
 *
 * 时间复杂度：O(n)，每个元素最多入栈出栈一次
 * 空间复杂度：O(n)，栈的空间
 */
function maxWidthRamp(nums: number[]): number {
  const n = nums.length;
  const stack: number[] = []; // 单调递减栈，存储索引

  // 第一步：构建单调递减栈
  // 从左到右遍历，保存所有可能作为坡左端点的索引
  for (let i = 0; i < n; i++) {
    // 如果栈为空，或者当前值小于栈顶索引对应的值，入栈
    if (stack.length === 0 || nums[i] < nums[stack[stack.length - 1]]) {
      stack.push(i);
    }
    // 如果当前值 >= 栈顶值，不入栈（因为栈顶索引更小，更优）
  }

  let maxWidth = 0;

  // 第二步：从右往左遍历，寻找最大宽度坡
  // 为什么从右往左？因为我们想要最大的 j，所以从右边开始
  for (let j = n - 1; j >= 0; j--) {
    // 尝试与栈中的元素匹配
    // 如果 nums[j] >= nums[stack.top]，说明可以形成坡
    while (stack.length > 0 && nums[j] >= nums[stack[stack.length - 1]]) {
      const i = stack.pop()!;
      maxWidth = Math.max(maxWidth, j - i);
    }

    // 优化：如果栈已空，说明所有可能的左端点都已经匹配过了
    if (stack.length === 0) break;
  }

  return maxWidth;
}

/**
 * 解法二：右侧最大值 + 双指针
 *
 * 核心思路：
 * 1. 预处理一个数组 rightMax，rightMax[i] 表示从 i 到末尾的最大值
 * 2. 使用双指针 i 和 j，i 是左指针，j 是右指针
 * 3. 如果 nums[i] <= rightMax[j]，说明从 j 到末尾至少有一个值 >= nums[i]
 *    扩展 j，尝试找更远的坡
 * 4. 否则，移动 i
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function maxWidthRamp2(nums: number[]): number {
  const n = nums.length;

  // 构建右侧最大值数组
  const rightMax: number[] = new Array(n);
  rightMax[n - 1] = nums[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    rightMax[i] = Math.max(nums[i], rightMax[i + 1]);
  }

  let maxWidth = 0;
  let i = 0; // 左指针
  let j = 0; // 右指针

  // 双指针遍历
  while (j < n) {
    // 如果 nums[i] <= rightMax[j]，说明可以形成坡
    if (nums[i] <= rightMax[j]) {
      maxWidth = Math.max(maxWidth, j - i);
      j++; // 扩展右指针，寻找更远的坡
    } else {
      // 否则，当前左端点不能与 j 及之后的位置形成坡
      i++; // 移动左指针
    }
  }

  return maxWidth;
}

/**
 * 解法三：排序 + 贪心
 *
 * 核心思路：
 * 1. 创建索引数组，按值从小到大排序（值相同时按索引从小到大）
 * 2. 遍历排序后的索引，维护遇到的最小索引
 * 3. 对于每个索引，计算与最小索引的距离，更新最大宽度
 *
 * 为什么有效？
 * - 按值排序后，后面的元素值一定 >= 前面的元素值
 * - 对于当前索引 j，如果前面有索引 i < j，那么一定有 nums[i] <= nums[j]
 * - 维护最小索引，可以保证最大的宽度
 *
 * 时间复杂度：O(n log n)，排序的时间
 * 空间复杂度：O(n)，存储索引数组
 */
function maxWidthRamp3(nums: number[]): number {
  const n = nums.length;

  // 创建索引数组并排序
  const indices = Array.from({ length: n }, (_, i) => i);

  // 按值排序，值相同时按索引排序
  indices.sort((i, j) => {
    if (nums[i] !== nums[j]) {
      return nums[i] - nums[j]; // 按值从小到大
    }
    return i - j; // 值相同时，索引从小到大
  });

  let maxWidth = 0;
  let minIndex = n; // 维护遇到的最小索引

  // 遍历排序后的索引
  for (const i of indices) {
    // 计算当前索引与最小索引的距离
    maxWidth = Math.max(maxWidth, i - minIndex);
    // 更新最小索引
    minIndex = Math.min(minIndex, i);
  }

  return maxWidth;
}

/**
 * 图解示例：
 *
 * 示例 1：nums = [6, 0, 8, 2, 1, 5]
 *          索引:   0  1  2  3  4  5
 *
 * 单调栈解法：
 * 1. 构建单调递减栈：
 *    i=0: stack=[0] (nums[0]=6)
 *    i=1: stack=[0,1] (nums[1]=0 < 6)
 *    i=2: 8 >= 0，不入栈
 *    i=3: 2 >= 0，不入栈
 *    i=4: 1 >= 0，不入栈
 *    i=5: 5 >= 0，不入栈
 *    最终 stack=[0, 1]
 *
 * 2. 从右往左遍历：
 *    j=5: nums[5]=5 >= nums[1]=0，弹出1，宽度=5-1=4 ✅
 *         nums[5]=5 < nums[0]=6，停止
 *    最大宽度 = 4
 *
 * ---
 *
 * 示例 2：nums = [9, 8, 1, 0, 1, 9, 4, 0, 4, 1]
 *          索引:   0  1  2  3  4  5  6  7  8  9
 *
 * 单调栈解法：
 * 1. 构建单调递减栈：
 *    stack = [0, 1, 2, 3] (对应值: 9, 8, 1, 0)
 *
 * 2. 从右往左遍历：
 *    j=9: nums[9]=1 >= nums[3]=0，弹出3，宽度=9-3=6
 *         nums[9]=1 >= nums[2]=1，弹出2，宽度=9-2=7 ✅
 *         nums[9]=1 < nums[1]=8，停止
 *    最大宽度 = 7
 *
 * ---
 *
 * 为什么单调栈有效？
 *
 * 考虑数组：[5, 3, 7, 2, 8]
 *            0  1  2  3  4
 *
 * 单调递减栈：[0, 1, 3] (对应值: 5, 3, 2)
 * - 索引2（值7）不在栈中，因为它 > 栈顶值3
 * - 如果有 j 能与索引2形成坡，那么 j 一定也能与索引1形成更大的坡
 *   （因为 nums[1]=3 < nums[2]=7，且索引1更小）
 *
 * 从右往左：
 * j=4: nums[4]=8 >= nums[3]=2，弹出3，宽度=4-3=1
 *      nums[4]=8 >= nums[1]=3，弹出1，宽度=4-1=3
 *      nums[4]=8 >= nums[0]=5，弹出0，宽度=4-0=4 ✅
 */
// @lc code=end
