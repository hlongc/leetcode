/*
 * @lc app=leetcode.cn id=18 lang=typescript
 *
 * [18] 四数之和
 *
 * https://leetcode.cn/problems/4sum/description/
 *
 * algorithms
 * Medium (36.76%)
 * Likes:    2099
 * Dislikes: 0
 * Total Accepted:    734.6K
 * Total Submissions: 2M
 * Testcase Example:  '[1,0,-1,0,-2,2]\n0'
 *
 * 给你一个由 n 个整数组成的数组 nums ，和一个目标值 target 。请你找出并返回满足下述全部条件且不重复的四元组 [nums[a],
 * nums[b], nums[c], nums[d]] （若两个四元组元素一一对应，则认为两个四元组重复）：
 *
 *
 * 0 <= a, b, c, d < n
 * a、b、c 和 d 互不相同
 * nums[a] + nums[b] + nums[c] + nums[d] == target
 *
 *
 * 你可以按 任意顺序 返回答案 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,0,-1,0,-2,2], target = 0
 * 输出：[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [2,2,2,2,2], target = 8
 * 输出：[[2,2,2,2]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 200
 * -10^9 <= nums[i] <= 10^9
 * -10^9 <= target <= 10^9
 *
 *
 */

// @lc code=start
/**
 * 🎯 四数之和 - 双层循环 + 双指针解法
 *
 * 💡 核心思想：
 * 1. 基于三数之和的思想进行扩展
 * 2. 外层两个循环固定前两个数 nums[i] 和 nums[j]
 * 3. 内层使用双指针寻找后两个数，使四数之和等于 target
 * 4. 通过排序和跳过重复元素来避免重复的四元组
 *
 * 🔄 算法流程：
 * 1. 排序数组
 * 2. 第一层循环：固定第一个数 nums[i]
 * 3. 第二层循环：固定第二个数 nums[j] (j > i)
 * 4. 双指针：在剩余数组中寻找两个数，使四数之和为 target
 * 5. 去重：跳过重复的 i、j、left、right
 *
 * ⏰ 时间复杂度：O(n³)
 * 💾 空间复杂度：O(1) (不计算结果数组)
 */
function fourSum(nums: number[], target: number): number[][] {
  const result: number[][] = [];
  const len = nums.length;

  // 🚫 边界检查：数组长度小于4无法形成四元组
  if (len < 4) return result;

  // 📊 排序数组，为双指针算法做准备
  nums.sort((a, b) => a - b);

  // 🔍 第一层循环：固定第一个数
  for (let i = 0; i < len - 3; i++) {
    // 🔄 跳过重复的第一个数
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    // ⚡ 剪枝优化1：如果最小的四个数之和都大于target，后面不可能有解
    if (nums[i] + nums[i + 1] + nums[i + 2] + nums[i + 3] > target) break;

    // ⚡ 剪枝优化2：如果当前数与最大的三个数之和都小于target，跳过当前数
    if (nums[i] + nums[len - 3] + nums[len - 2] + nums[len - 1] < target)
      continue;

    // 🔍 第二层循环：固定第二个数
    for (let j = i + 1; j < len - 2; j++) {
      // 🔄 跳过重复的第二个数
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;

      // ⚡ 剪枝优化3：如果当前两个数与最小的两个数之和都大于target
      if (nums[i] + nums[j] + nums[j + 1] + nums[j + 2] > target) break;

      // ⚡ 剪枝优化4：如果当前两个数与最大的两个数之和都小于target
      if (nums[i] + nums[j] + nums[len - 2] + nums[len - 1] < target) continue;

      // 🎯 设置双指针
      let left = j + 1; // 左指针：从 j+1 开始
      let right = len - 1; // 右指针：从数组末尾开始

      // 🔍 双指针搜索
      while (left < right) {
        // 🧮 计算当前四数之和
        const sum = nums[i] + nums[j] + nums[left] + nums[right];

        if (sum < target) {
          // 📈 和小于target，需要增大，移动左指针
          left++;
        } else if (sum > target) {
          // 📉 和大于target，需要减小，移动右指针
          right--;
        } else {
          // 🎊 找到目标四元组！
          result.push([nums[i], nums[j], nums[left], nums[right]]);

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
  }

  return result;
}

/**
 * 🧮 算法详细解释：
 *
 * 1️⃣ 四数之和 vs 三数之和：
 *    - 三数之和：1层循环 + 双指针 = O(n²)
 *    - 四数之和：2层循环 + 双指针 = O(n³)
 *    - 扩展思路：固定更多的数，减少双指针需要处理的维度
 *
 * 2️⃣ 去重复策略（四个层次）：
 *    - 第一个数：if (i > 0 && nums[i] === nums[i-1]) continue
 *    - 第二个数：if (j > i+1 && nums[j] === nums[j-1]) continue
 *    - 第三个数：while (left < right && nums[left] === nums[left+1]) left++
 *    - 第四个数：while (left < right && nums[right] === nums[right-1]) right--
 *
 * 3️⃣ 剪枝优化（提高效率）：
 *    - 优化1：最小四数和 > target → 提前结束
 *    - 优化2：当前数+最大三数和 < target → 跳过当前数
 *    - 优化3：当前两数+最小两数和 > target → 提前结束内层
 *    - 优化4：当前两数+最大两数和 < target → 跳过当前第二个数
 *
 * 4️⃣ 双指针移动策略：
 *    - sum < target：左指针右移（增大sum）
 *    - sum > target：右指针左移（减小sum）
 *    - sum = target：记录结果，双指针同时移动
 */

/**
 * 📝 执行示例：nums = [1,0,-1,0,-2,2], target = 0
 *
 * 预处理：
 * - 排序后：[-2,-1,0,0,1,2]
 * - 长度：6
 *
 * 第1轮：i=0, nums[i]=-2
 *   第1轮：j=1, nums[j]=-1
 *   - left=2(0), right=5(2)
 *   - sum = -2+(-1)+0+2 = -1 < 0 → left++
 *   - left=3(0), right=5(2)
 *   - sum = -2+(-1)+0+2 = -1 < 0 → left++
 *   - left=4(1), right=5(2)
 *   - sum = -2+(-1)+1+2 = 0 ✓ 找到 [-2,-1,1,2]
 *   - left=5, right=4，结束
 *
 *   第2轮：j=2, nums[j]=0
 *   - left=3(0), right=5(2)
 *   - sum = -2+0+0+2 = 0 ✓ 找到 [-2,0,0,2]
 *   - left=4, right=4，结束
 *
 * 第2轮：i=1, nums[i]=-1
 *   第1轮：j=2, nums[j]=0
 *   - left=3(0), right=5(2)
 *   - sum = -1+0+0+2 = 1 > 0 → right--
 *   - left=3(0), right=4(1)
 *   - sum = -1+0+0+1 = 0 ✓ 找到 [-1,0,0,1]
 *   - left=4, right=3，结束
 *
 * 结果：[[-2,-1,1,2], [-2,0,0,2], [-1,0,0,1]]
 */
// @lc code=end
