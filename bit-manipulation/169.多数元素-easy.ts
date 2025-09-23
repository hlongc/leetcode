/*
 * @lc app=leetcode.cn id=169 lang=typescript
 *
 * [169] 多数元素
 *
 * https://leetcode.cn/problems/majority-element/description/
 *
 * algorithms
 * Easy (66.75%)
 * Likes:    2467
 * Dislikes: 0
 * Total Accepted:    1.2M
 * Total Submissions: 1.8M
 * Testcase Example:  '[3,2,3]'
 *
 * 给定一个大小为 n 的数组 nums ，返回其中的多数元素。多数元素是指在数组中出现次数 大于 ⌊ n/2 ⌋ 的元素。
 *
 * 你可以假设数组是非空的，并且给定的数组总是存在多数元素。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,2,3]
 * 输出：3
 *
 * 示例 2：
 *
 *
 * 输入：nums = [2,2,1,1,1,2,2]
 * 输出：2
 *
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1 <= n <= 5 * 10^4
 * -10^9 <= nums[i] <= 10^9
 *
 *
 *
 *
 * 进阶：尝试设计时间复杂度为 O(n)、空间复杂度为 O(1) 的算法解决此问题。
 *
 */

// @lc code=start
function majorityElement(nums: number[]): number {
  /**
   * 多数元素 - 摩尔投票算法（Boyer-Moore Voting Algorithm）
   *
   * 🎯 核心思想：
   * 把数组想象成一场投票，多数元素的票数 > n/2
   * 用"抵消"的思想：不同的元素互相抵消，最后剩下的就是多数元素
   *
   * 🗳️ 投票过程：
   * 1. 维护一个候选人(candidate)和票数(count)
   * 2. 遇到相同元素：票数+1（支持票）
   * 3. 遇到不同元素：票数-1（反对票）
   * 4. 票数为0时：更换候选人
   *
   * 💡 为什么有效？
   * - 多数元素出现次数 > n/2，即使被其他元素抵消，最终也会胜出
   * - 非多数元素无法在抵消过程中获得最终胜利
   *
   * 时间复杂度：O(n) - 只需遍历一次数组
   * 空间复杂度：O(1) - 只用两个变量
   */

  let candidate = nums[0]; // 优化：直接用第一个元素初始化，避免undefined检查
  let count = 1; // 优化：初始票数为1

  // 从第二个元素开始遍历（优化：减少一次判断）
  for (let i = 1; i < nums.length; i++) {
    const num = nums[i];

    if (count === 0) {
      // 当前候选人票数为0，选择新候选人
      candidate = num;
      count = 1;
    } else if (candidate === num) {
      // 遇到相同元素，票数+1
      count++;
    } else {
      // 遇到不同元素，票数-1（抵消）
      count--;
    }
  }

  return candidate;
}

/**
 * 解法二：位运算法
 * 核心思想：多数元素在每个位上出现的次数也是多数
 * 统计每一位上1的个数，超过n/2的位设为1
 */
function majorityElementBitwise(nums: number[]): number {
  let result = 0;
  const n = nums.length;

  // 检查32位整数的每一位
  for (let i = 0; i < 32; i++) {
    let bitCount = 0;

    // 统计第i位上1的个数
    for (const num of nums) {
      if ((num >> i) & 1) {
        bitCount++;
      }
    }

    // 如果第i位上1的个数超过一半，则结果的第i位为1
    if (bitCount > n / 2) {
      result |= 1 << i;
    }
  }

  return result;
}

/**
 * 解法三：分治法
 * 核心思想：分而治之，多数元素要么在左半部分，要么在右半部分
 * 如果左右两部分的多数元素不同，则统计它们在整个区间的出现次数
 */
function majorityElementDivideConquer(nums: number[]): number {
  function helper(left: number, right: number): number {
    // 基础情况：只有一个元素
    if (left === right) {
      return nums[left];
    }

    const mid = Math.floor((left + right) / 2);
    const leftMajority = helper(left, mid);
    const rightMajority = helper(mid + 1, right);

    // 如果左右两部分的多数元素相同，直接返回
    if (leftMajority === rightMajority) {
      return leftMajority;
    }

    // 否则统计两个候选元素在当前区间的出现次数
    let leftCount = 0;
    let rightCount = 0;

    for (let i = left; i <= right; i++) {
      if (nums[i] === leftMajority) leftCount++;
      if (nums[i] === rightMajority) rightCount++;
    }

    return leftCount > rightCount ? leftMajority : rightMajority;
  }

  return helper(0, nums.length - 1);
}

/**
 * 解法四：排序法（最简单但不是最优）
 * 核心思想：排序后，多数元素必定占据中间位置
 */
function majorityElementSort(nums: number[]): number {
  nums.sort((a, b) => a - b);
  return nums[Math.floor(nums.length / 2)];
}

/**
 * 🎓 摩尔投票算法 - 详细执行示例
 *
 * 💭 类比：想象成一场选举投票
 * - candidate：当前领先的候选人
 * - count：候选人的净票数（支持票 - 反对票）
 *
 * 📊 执行示例：nums = [2,2,1,1,1,2,2]
 *
 * 初始状态：candidate = 2, count = 1
 *
 * 🗳️ 处理 nums[1] = 2：
 *   candidate === num (2) → count++ → count = 2
 *   状态：candidate = 2, count = 2 ✅ 候选人2获得支持
 *
 * 🗳️ 处理 nums[2] = 1：
 *   candidate !== num (1) → count-- → count = 1
 *   状态：candidate = 2, count = 1 ⚖️ 候选人2被反对，但仍领先
 *
 * 🗳️ 处理 nums[3] = 1：
 *   candidate !== num (1) → count-- → count = 0
 *   状态：candidate = 2, count = 0 ⚠️ 候选人2票数清零
 *
 * 🗳️ 处理 nums[4] = 1：
 *   count === 0 → 更换候选人 → candidate = 1, count = 1
 *   状态：candidate = 1, count = 1 🔄 新候选人1上台
 *
 * 🗳️ 处理 nums[5] = 2：
 *   candidate !== num (2) → count-- → count = 0
 *   状态：candidate = 1, count = 0 ⚠️ 候选人1票数清零
 *
 * 🗳️ 处理 nums[6] = 2：
 *   count === 0 → 更换候选人 → candidate = 2, count = 1
 *   状态：candidate = 2, count = 1 🔄 候选人2重新上台
 *
 * 🎯 最终结果：candidate = 2
 *
 * 验证：数组中2出现4次，1出现3次，2确实是多数元素！
 *
 * 🔍 为什么算法正确？
 * 1. 多数元素出现次数 > n/2，其他所有元素加起来 < n/2
 * 2. 即使多数元素在中途被"击败"，但由于数量优势，最终必定会重新获胜
 * 3. 非多数元素无法在整个过程中保持领先地位
 *
 * 🚀 算法优势：
 * - 只需一次遍历，时间复杂度O(n)
 * - 只用两个变量，空间复杂度O(1)
 * - 不需要额外的数据结构（哈希表、排序等）
 */

/**
 * 📈 各解法性能对比：
 *
 * | 解法     | 时间复杂度 | 空间复杂度 | 特点                    |
 * |----------|------------|------------|-------------------------|
 * | 摩尔投票 | O(n)       | O(1)       | 最优解，一次遍历        |
 * | 位运算   | O(32n)     | O(1)       | 巧妙但常数因子大        |
 * | 分治法   | O(nlogn)   | O(logn)    | 递归思想，栈空间开销    |
 * | 排序法   | O(nlogn)   | O(1)       | 最简单，但时间复杂度高  |
 * | 哈希表   | O(n)       | O(n)       | 直观但需要额外空间      |
 *
 * 推荐：摩尔投票算法是最优解！
 */

// @lc code=end
