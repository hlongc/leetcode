/*
 * @lc app=leetcode.cn id=724 lang=typescript
 *
 * [724] 寻找数组的中心下标
 *
 * https://leetcode.cn/problems/find-pivot-index/description/
 *
 * algorithms
 * Easy (54.75%)
 * Likes:    707
 * Dislikes: 0
 * Total Accepted:    454.3K
 * Total Submissions: 829.4K
 * Testcase Example:  '[1,7,3,6,5,6]'
 *
 * 给你一个整数数组 nums ，请计算数组的 中心下标 。
 *
 * 数组 中心下标 是数组的一个下标，其左侧所有元素相加的和等于右侧所有元素相加的和。
 *
 * 如果中心下标位于数组最左端，那么左侧数之和视为 0 ，因为在下标的左侧不存在元素。这一点对于中心下标位于数组最右端同样适用。
 *
 * 如果数组有多个中心下标，应该返回 最靠近左边 的那一个。如果数组不存在中心下标，返回 -1 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1, 7, 3, 6, 5, 6]
 * 输出：3
 * 解释：
 * 中心下标是 3 。
 * 左侧数之和 sum = nums[0] + nums[1] + nums[2] = 1 + 7 + 3 = 11 ，
 * 右侧数之和 sum = nums[4] + nums[5] = 5 + 6 = 11 ，二者相等。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [1, 2, 3]
 * 输出：-1
 * 解释：
 * 数组中不存在满足此条件的中心下标。
 *
 * 示例 3：
 *
 *
 * 输入：nums = [2, 1, -1]
 * 输出：0
 * 解释：
 * 中心下标是 0 。
 * 左侧数之和 sum = 0 ，（下标 0 左侧不存在元素），
 * 右侧数之和 sum = nums[1] + nums[2] = 1 + -1 = 0 。
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^4
 * -1000 <= nums[i] <= 1000
 *
 *
 *
 *
 * 注意：本题与主站 1991
 * 题相同：https://leetcode-cn.com/problems/find-the-middle-index-in-array/
 *
 */

// @lc code=start

/**
 * 解法一：前缀和（最优解）
 *
 * 核心思路：
 * 1. 先计算整个数组的总和 total
 * 2. 遍历数组，维护左侧元素之和 leftSum
 * 3. 对于每个位置 i：
 *    - 左侧和 = leftSum
 *    - 右侧和 = total - leftSum - nums[i]
 *    - 如果左侧和 === 右侧和，则 i 是中心下标
 * 4. 每次遍历后更新 leftSum
 *
 * 关键点：
 * - 中心下标处的元素不计入左右两侧
 * - leftSum == rightSum 等价于 leftSum == total - leftSum - nums[i]
 * - 化简后：2 * leftSum + nums[i] == total
 *
 * 时间复杂度：O(n) - 遍历两次数组（一次求和，一次查找）
 * 空间复杂度：O(1) - 只用了几个变量
 */
function pivotIndex(nums: number[]): number {
  // 1. 计算数组总和
  const total = nums.reduce((sum, num) => sum + num, 0);

  // 2. 初始化左侧和为 0
  let leftSum = 0;

  // 3. 遍历数组，寻找中心下标
  for (let i = 0; i < nums.length; i++) {
    // 计算右侧和：总和 - 左侧和 - 当前元素
    const rightSum = total - leftSum - nums[i];

    // 如果左侧和等于右侧和，找到中心下标
    if (leftSum === rightSum) {
      return i;
    }

    // 更新左侧和（将当前元素加入左侧）
    leftSum += nums[i];
  }

  // 4. 如果没有找到中心下标，返回 -1
  return -1;
}

/**
 * 解法二：前缀和优化写法（更简洁）
 *
 * 利用数学关系简化判断：
 * 如果 leftSum == rightSum，则：
 * leftSum == total - leftSum - nums[i]
 * 2 * leftSum == total - nums[i]
 * 2 * leftSum + nums[i] == total
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function pivotIndex_v2(nums: number[]): number {
  const total = nums.reduce((sum, num) => sum + num, 0);
  let leftSum = 0;

  for (let i = 0; i < nums.length; i++) {
    // 使用数学关系简化判断
    if (2 * leftSum + nums[i] === total) {
      return i;
    }
    leftSum += nums[i];
  }

  return -1;
}

/**
 * 解法三：双指针前缀和数组（更直观但空间复杂度高）
 *
 * 思路：
 * 1. 预先计算前缀和数组 prefixSum
 * 2. prefixSum[i] 表示 nums[0...i-1] 的和
 * 3. 对于位置 i：
 *    - 左侧和 = prefixSum[i]
 *    - 右侧和 = prefixSum[n] - prefixSum[i+1]
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n) - 需要额外的前缀和数组
 */
function pivotIndex_v3(nums: number[]): number {
  const n = nums.length;

  // 构建前缀和数组，prefixSum[i] 表示 nums[0...i-1] 的和
  const prefixSum: number[] = Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + nums[i];
  }

  // 遍历寻找中心下标
  for (let i = 0; i < n; i++) {
    const leftSum = prefixSum[i]; // [0, i) 的和
    const rightSum = prefixSum[n] - prefixSum[i + 1]; // (i, n) 的和

    if (leftSum === rightSum) {
      return i;
    }
  }

  return -1;
}

// @lc code=end

/* 
测试用例详解：

示例 1：nums = [1, 7, 3, 6, 5, 6]
索引：           0  1  2  3  4  5
total = 28

i=0: leftSum=0,  rightSum=28-0-1=27  ❌ 0≠27
     leftSum=1
i=1: leftSum=1,  rightSum=28-1-7=20  ❌ 1≠20
     leftSum=8
i=2: leftSum=8,  rightSum=28-8-3=17  ❌ 8≠17
     leftSum=11
i=3: leftSum=11, rightSum=28-11-6=11 ✅ 11==11 → 返回 3

验证：左侧 [1,7,3]=11，右侧 [5,6]=11

---

示例 2：nums = [1, 2, 3]
total = 6

i=0: leftSum=0, rightSum=6-0-1=5  ❌ 0≠5
i=1: leftSum=1, rightSum=6-1-2=3  ❌ 1≠3
i=2: leftSum=3, rightSum=6-3-3=0  ❌ 3≠0
返回 -1

---

示例 3：nums = [2, 1, -1]
total = 2

i=0: leftSum=0, rightSum=2-0-2=0 ✅ 0==0 → 返回 0

验证：左侧 []=0，右侧 [1,-1]=0

---

边界情况：

1. 单个元素：nums = [0]
   total = 0
   i=0: leftSum=0, rightSum=0-0-0=0 ✅ → 返回 0

2. 全部相同：nums = [1, 1, 1]
   total = 3
   i=0: 0 ≠ 2
   i=1: 1 == 1 ✅ → 返回 1

3. 负数情况：nums = [-1, -1, 0, 1, 1]
   total = 0
   i=2: leftSum=-2, rightSum=0-(-2)-0=2 ❌
   ...需要继续查找

关键点总结：
1. 中心下标的元素本身不参与左右两侧的计算
2. 边界情况自动处理（最左端 leftSum=0，最右端 rightSum=0）
3. 返回最左边的中心下标（从左往右遍历，第一个满足条件的就返回）
4. 前缀和方法只需要一次遍历，效率很高
*/
