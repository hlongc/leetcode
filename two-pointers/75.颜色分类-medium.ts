/*
 * @lc app=leetcode.cn id=75 lang=typescript
 *
 * [75] 颜色分类
 *
 * https://leetcode.cn/problems/sort-colors/description/
 *
 * algorithms
 * Medium (63.16%)
 * Likes:    1988
 * Dislikes: 0
 * Total Accepted:    855.7K
 * Total Submissions: 1.4M
 * Testcase Example:  '[2,0,2,1,1,0]'
 *
 * 给定一个包含红色、白色和蓝色、共 n 个元素的数组 nums ，原地 对它们进行排序，使得相同颜色的元素相邻，并按照红色、白色、蓝色顺序排列。
 *
 * 我们使用整数 0、 1 和 2 分别表示红色、白色和蓝色。
 *
 *
 *
 *
 * 必须在不使用库内置的 sort 函数的情况下解决这个问题。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [2,0,2,1,1,0]
 * 输出：[0,0,1,1,2,2]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [2,0,1]
 * 输出：[0,1,2]
 *
 *
 *
 *
 * 提示：
 *
 *
 * n == nums.length
 * 1 <= n <= 300
 * nums[i] 为 0、1 或 2
 *
 *
 *
 *
 * 进阶：
 *
 *
 * 你能想出一个仅使用常数空间的一趟扫描算法吗？
 *
 *
 */

// @lc code=start
/**
 * 荷兰国旗问题 - 三指针解法
 *
 * 解题思路：
 * 使用三个指针将数组分为三个区域：
 * - left: 指向下一个0应该放置的位置（0区域的右边界+1）
 * - right: 指向下一个2应该放置的位置（2区域的左边界-1）
 * - current: 当前遍历的指针
 *
 * 算法步骤：
 * 1. 初始化：left=0, right=n-1, current=0
 * 2. 当current <= right时循环：
 *    - 如果nums[current] == 0：与nums[left]交换，left++，current++
 *    - 如果nums[current] == 1：current++（1放在中间区域）
 *    - 如果nums[current] == 2：与nums[right]交换，right--（注意current不变）
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 *
 * 示例说明：
 * 输入：nums = [2,0,2,1,1,0]
 *
 * 初始状态：left=0, right=5, current=0
 * [2,0,2,1,1,0] current=0, nums[0]=2
 * [0,0,2,1,1,2] current=0, nums[0]=0, left=1
 * [0,0,2,1,1,2] current=1, nums[1]=0, left=2
 * [0,0,2,1,1,2] current=2, nums[2]=2
 * [0,0,1,1,2,2] current=2, nums[2]=1, right=4
 * [0,0,1,1,2,2] current=3, nums[3]=1
 * [0,0,1,1,2,2] current=4, nums[4]=2, right=3
 *
 * 最终结果：[0,0,1,1,2,2]
 */
function sortColors(nums: number[]): void {
  const n = nums.length;

  // 三个指针定义三个区域
  let left = 0; // 0区域的右边界+1（下一个0应该放的位置）
  let right = n - 1; // 2区域的左边界-1（下一个2应该放的位置）
  let current = 0; // 当前遍历的指针

  // 当current指针没有超过right指针时继续
  while (current <= right) {
    if (nums[current] === 0) {
      // 当前元素是0，需要放到0区域
      // 交换current和left位置的元素
      [nums[current], nums[left]] = [nums[left], nums[current]];
      left++; // 0区域向右扩展
      current++; // 继续处理下一个元素
    } else if (nums[current] === 1) {
      // 当前元素是1，放在中间区域，不需要移动
      current++; // 继续处理下一个元素
    } else {
      // 当前元素是2，需要放到2区域
      // 交换current和right位置的元素
      [nums[current], nums[right]] = [nums[right], nums[current]];
      right--; // 2区域向左扩展
      // 注意：current不变，因为从right位置交换来的元素还没有检查
    }
  }
}
// @lc code=end
