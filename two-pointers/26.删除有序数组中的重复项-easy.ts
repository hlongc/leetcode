/*
 * @lc app=leetcode.cn id=26 lang=typescript
 *
 * [26] 删除有序数组中的重复项
 *
 * https://leetcode.cn/problems/remove-duplicates-from-sorted-array/description/
 *
 * algorithms
 * Easy (57.92%)
 * Likes:    3838
 * Dislikes: 0
 * Total Accepted:    2.3M
 * Total Submissions: 3.9M
 * Testcase Example:  '[1,1,2]'
 *
 * 给你一个 非严格递增排列 的数组 nums ，请你 原地 删除重复出现的元素，使每个元素 只出现一次 ，返回删除后数组的新长度。元素的 相对顺序
 * 应该保持 一致 。然后返回 nums 中唯一元素的个数。
 *
 * 考虑 nums 的唯一元素的数量为 k ，你需要做以下事情确保你的题解可以被通过：
 *
 *
 * 更改数组 nums ，使 nums 的前 k 个元素包含唯一元素，并按照它们最初在 nums 中出现的顺序排列。nums 的其余元素与 nums
 * 的大小不重要。
 * 返回 k 。
 *
 *
 * 判题标准:
 *
 * 系统会用下面的代码来测试你的题解:
 *
 *
 * int[] nums = [...]; // 输入数组
 * int[] expectedNums = [...]; // 长度正确的期望答案
 *
 * int k = removeDuplicates(nums); // 调用
 *
 * assert k == expectedNums.length;
 * for (int i = 0; i < k; i++) {
 * ⁠   assert nums[i] == expectedNums[i];
 * }
 *
 * 如果所有断言都通过，那么您的题解将被 通过。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,1,2]
 * 输出：2, nums = [1,2,_]
 * 解释：函数应该返回新的长度 2 ，并且原数组 nums 的前两个元素被修改为 1, 2 。不需要考虑数组中超出新长度后面的元素。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0,0,1,1,1,2,2,3,3,4]
 * 输出：5, nums = [0,1,2,3,4]
 * 解释：函数应该返回新的长度 5 ， 并且原数组 nums 的前五个元素被修改为 0, 1, 2, 3, 4
 * 。不需要考虑数组中超出新长度后面的元素。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 3 * 10^4
 * -10^4 <= nums[i] <= 10^4
 * nums 已按 非严格递增 排列
 *
 *
 */

// @lc code=start
/**
 * 原地删除有序数组中的重复项
 * @param nums 非严格递增排列的数组
 * @returns 删除重复项后数组的新长度
 */
function removeDuplicates(nums: number[]): number {
  // 边界情况：空数组
  if (nums.length === 0) return 0;

  // 慢指针：指向当前不重复元素的最后位置
  let slow = 0;

  // 快指针：遍历整个数组，寻找不重复的元素
  for (let fast = 1; fast < nums.length; fast++) {
    // 如果快指针指向的元素与慢指针指向的元素不同
    // 说明找到了一个新的不重复元素
    if (nums[fast] !== nums[slow]) {
      // 慢指针前移一位，并将新元素放到这个位置
      slow++;
      nums[slow] = nums[fast];
    }
    // 如果相同，则快指针继续前移，寻找下一个不重复元素
  }

  // 返回不重复元素的个数（索引+1）
  return slow + 1;
}
// @lc code=end
