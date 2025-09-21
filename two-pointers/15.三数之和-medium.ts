/*
 * @lc app=leetcode.cn id=15 lang=typescript
 *
 * [15] 三数之和
 *
 * https://leetcode.cn/problems/3sum/description/
 *
 * algorithms
 * Medium (39.29%)
 * Likes:    7665
 * Dislikes: 0
 * Total Accepted:    2.5M
 * Total Submissions: 6.4M
 * Testcase Example:  '[-1,0,1,2,-1,-4]'
 *
 * 给你一个整数数组 nums ，判断是否存在三元组 [nums[i], nums[j], nums[k]] 满足 i != j、i != k 且 j !=
 * k ，同时还满足 nums[i] + nums[j] + nums[k] == 0 。请你返回所有和为 0 且不重复的三元组。
 *
 * 注意：答案中不可以包含重复的三元组。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [-1,0,1,2,-1,-4]
 * 输出：[[-1,-1,2],[-1,0,1]]
 * 解释：
 * nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0 。
 * nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0 。
 * nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0 。
 * 不同的三元组是 [-1,0,1] 和 [-1,-1,2] 。
 * 注意，输出的顺序和三元组的顺序并不重要。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0,1,1]
 * 输出：[]
 * 解释：唯一可能的三元组和不为 0 。
 *
 *
 * 示例 3：
 *
 *
 * 输入：nums = [0,0,0]
 * 输出：[[0,0,0]]
 * 解释：唯一可能的三元组和为 0 。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 3 <= nums.length <= 3000
 * -10^5 <= nums[i] <= 10^5
 *
 *
 */

// @lc code=start
/**
 * 🎯 三数之和 - 双指针解法
 *
 * 💡 核心思想：
 * 1. 排序数组，固定第一个数，用双指针寻找另外两个数
 * 2. 对于每个固定的 nums[i]，寻找 nums[left] + nums[right] = -nums[i]
 * 3. 利用排序特性，通过移动指针缩小搜索范围
 * 4. 跳过重复元素，避免重复的三元组
 *
 * ⏰ 时间复杂度：O(n²)
 * 💾 空间复杂度：O(1) (不计算结果数组)
 */
function threeSum(nums: number[]): number[][] {
  const result: number[][] = [];
  const len = nums.length;

  // 🚫 边界检查：数组长度小于3无法形成三元组
  if (len < 3) return result;

  // 📊 排序数组，为双指针算法做准备
  nums.sort((a, b) => a - b);

  // 🔍 遍历数组，固定第一个数
  for (let i = 0; i < len - 2; i++) {
    // ⚡ 优化：如果当前数大于0，后面都是正数，不可能和为0
    if (nums[i] > 0) break;

    // 🔄 跳过重复的第一个数，避免重复的三元组
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    // 🎯 设置双指针
    let left = i + 1; // 左指针：从 i+1 开始
    let right = len - 1; // 右指针：从数组末尾开始

    // 🔍 双指针搜索
    while (left < right) {
      // 🧮 计算当前三数之和
      const sum = nums[i] + nums[left] + nums[right];

      if (sum < 0) {
        // 📈 和小于0，需要增大，移动左指针
        left++;
      } else if (sum > 0) {
        // 📉 和大于0，需要减小，移动右指针
        right--;
      } else {
        // 🎊 找到目标三元组！
        result.push([nums[i], nums[left], nums[right]]);

        // 🔄 跳过重复的左指针值
        while (left < right && nums[left] === nums[left + 1]) {
          left++;
        }

        // 🔄 跳过重复的右指针值
        while (left < right && nums[right] === nums[right - 1]) {
          right--;
        }

        // ➡️ 移动双指针继续搜索
        left++;
        right--;
      }
    }
  }

  return result;
}

/**
 * 🧮 算法详细解释：
 *
 * 1️⃣ 排序的作用：
 *    - 使数组有序，可以使用双指针技巧
 *    - 便于跳过重复元素
 *    - 可以进行剪枝优化（当nums[i] > 0时提前退出）
 *
 * 2️⃣ 双指针移动策略：
 *    - sum < 0：左指针右移（增大sum）
 *    - sum > 0：右指针左移（减小sum）
 *    - sum = 0：记录结果，双指针同时移动
 *
 * 3️⃣ 去重复策略：
 *    - 外层循环：跳过相同的 nums[i]
 *    - 内层循环：找到答案后跳过相同的 nums[left] 和 nums[right]
 *
 * 4️⃣ 优化技巧：
 *    - 当 nums[i] > 0 时提前退出（后续都是正数）
 *    - 边界检查避免无效计算
 */

/**
 * 📝 执行示例：nums = [-1,0,1,2,-1,-4]
 *
 * 预处理：
 * - 排序后：[-4,-1,-1,0,1,2]
 * - 长度：6
 *
 * 第1轮：i=0, nums[i]=-4
 * - left=1(-1), right=5(2)
 * - sum = -4+(-1)+2 = -3 < 0 → left++
 * - left=2(-1), right=5(2)
 * - sum = -4+(-1)+2 = -3 < 0 → left++
 * - left=3(0), right=5(2)
 * - sum = -4+0+2 = -2 < 0 → left++
 * - left=4(1), right=5(2)
 * - sum = -4+1+2 = -1 < 0 → left++
 * - left=5 >= right=5，结束
 *
 * 第2轮：i=1, nums[i]=-1
 * - left=2(-1), right=5(2)
 * - sum = -1+(-1)+2 = 0 ✓ 找到 [-1,-1,2]
 * - 跳过重复，left=3, right=4
 * - left=3(0), right=4(1)
 * - sum = -1+0+1 = 0 ✓ 找到 [-1,0,1]
 * - left=4, right=3，结束
 *
 * 第3轮：i=2, nums[i]=-1
 * - 跳过重复：nums[2] === nums[1]，continue
 *
 * 结果：[[-1,-1,2], [-1,0,1]]
 */
// @lc code=end
