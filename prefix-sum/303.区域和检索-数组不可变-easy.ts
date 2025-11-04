/*
 * @lc app=leetcode.cn id=303 lang=typescript
 *
 * [303] 区域和检索 - 数组不可变
 *
 * https://leetcode.cn/problems/range-sum-query-immutable/description/
 *
 * algorithms
 * Easy (79.54%)
 * Likes:    710
 * Dislikes: 0
 * Total Accepted:    324.8K
 * Total Submissions: 408.2K
 * Testcase Example:  '["NumArray","sumRange","sumRange","sumRange"]\n' +
  '[[[-2,0,3,-5,2,-1]],[0,2],[2,5],[0,5]]'
 *
 * 给定一个整数数组  nums，处理以下类型的多个查询:
 * 
 * 
 * 计算索引 left 和 right （包含 left 和 right）之间的 nums 元素的 和 ，其中 left <= right
 * 
 * 
 * 实现 NumArray 类：
 * 
 * 
 * NumArray(int[] nums) 使用数组 nums 初始化对象
 * int sumRange(int i, int j) 返回数组 nums 中索引 left 和 right 之间的元素的 总和 ，包含 left 和
 * right 两点（也就是 nums[left] + nums[left + 1] + ... + nums[right] )
 * 
 * 
 * 
 * 
 * 示例 1：
 * 
 * 
 * 输入：
 * ["NumArray", "sumRange", "sumRange", "sumRange"]
 * [[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]]
 * 输出：
 * [null, 1, -1, -3]
 * 
 * 解释：
 * NumArray numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
 * numArray.sumRange(0, 2); // return 1 ((-2) + 0 + 3)
 * numArray.sumRange(2, 5); // return -1 (3 + (-5) + 2 + (-1)) 
 * numArray.sumRange(0, 5); // return -3 ((-2) + 0 + 3 + (-5) + 2 + (-1))
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 1 <= nums.length <= 10^4
 * -10^5 <= nums[i] <= 10^5
 * 0 <= i <= j < nums.length
 * 最多调用 10^4 次 sumRange 方法
 * 
 * 
 */

// @lc code=start

/**
 * 区域和检索 - 数组不可变
 *
 * 核心思路：前缀和（Prefix Sum）
 *
 * 问题分析：
 * - 需要多次查询数组中某个区间的和
 * - 暴力法：每次查询都遍历区间，时间复杂度 O(n)
 * - 前缀和：预处理后，每次查询 O(1)
 *
 * 前缀和核心原理：
 * prefixSum[i] 表示 nums[0...i-1] 的和
 *
 * 为什么 prefixSum 数组长度是 n+1？
 * - prefixSum[0] = 0（表示前 0 个元素的和）
 * - prefixSum[1] = nums[0]
 * - prefixSum[2] = nums[0] + nums[1]
 * - ...
 * - prefixSum[n] = nums[0] + ... + nums[n-1]
 *
 * 这样设计的好处：
 * - 避免特殊处理 left = 0 的情况
 * - 公式统一：sum[left, right] = prefixSum[right+1] - prefixSum[left]
 *
 * 示例：nums = [-2, 0, 3, -5, 2, -1]
 *
 * prefixSum 数组：
 * index:  0   1   2   3    4   5    6
 * value:  0  -2  -2   1   -4  -2   -3
 *         ↑   ↑   ↑   ↑    ↑   ↑    ↑
 *        前0  前1  前2  前3  前4  前5  前6个元素的和
 *
 * 查询 sumRange(0, 2)：
 * = nums[0] + nums[1] + nums[2]
 * = prefixSum[3] - prefixSum[0]
 * = 1 - 0 = 1 ✓
 *
 * 查询 sumRange(2, 5)：
 * = nums[2] + nums[3] + nums[4] + nums[5]
 * = prefixSum[6] - prefixSum[2]
 * = -3 - (-2) = -1 ✓
 *
 * 时间复杂度：
 *   - 构造函数：O(n)
 *   - sumRange：O(1)
 * 空间复杂度：O(n)，存储前缀和数组
 */
class NumArray {
  // 前缀和数组
  // prefixSum[i] 表示 nums[0...i-1] 的和
  private prefixSum: number[];

  /**
   * 构造函数：预处理前缀和数组
   * @param nums 原始数组
   */
  constructor(nums: number[]) {
    const n = nums.length;

    // 初始化前缀和数组，长度为 n+1
    // prefixSum[0] = 0 表示前 0 个元素的和
    this.prefixSum = new Array(n + 1);
    this.prefixSum[0] = 0;

    // 构建前缀和数组
    // prefixSum[i] = prefixSum[i-1] + nums[i-1]
    for (let i = 1; i <= n; i++) {
      this.prefixSum[i] = this.prefixSum[i - 1] + nums[i - 1];
    }
  }

  /**
   * 查询区间和 [left, right]
   * @param left 左边界（包含）
   * @param right 右边界（包含）
   * @returns 区间和
   *
   * 核心公式：sum[left, right] = prefixSum[right+1] - prefixSum[left]
   *
   * 原理：
   * - prefixSum[right+1] 是前 right+1 个元素的和，即 nums[0...right]
   * - prefixSum[left] 是前 left 个元素的和，即 nums[0...left-1]
   * - 相减得到 nums[left...right] 的和
   *
   * 图解：
   *        left              right
   *         ↓                 ↓
   * nums: [x, x, x, a, b, c, d, x, x]
   *        └─────┘  └────────┘
   *     prefixSum[left]  要求的区间
   *        └──────────────────┘
   *           prefixSum[right+1]
   *
   * 区间和 = prefixSum[right+1] - prefixSum[left]
   */
  sumRange(left: number, right: number): number {
    return this.prefixSum[right + 1] - this.prefixSum[left];
  }
}

/**
 * Your NumArray object will be instantiated and called as such:
 * var obj = new NumArray(nums)
 * var param_1 = obj.sumRange(left,right)
 */
// @lc code=end
