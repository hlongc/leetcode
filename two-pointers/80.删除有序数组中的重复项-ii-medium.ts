/*
 * @lc app=leetcode.cn id=80 lang=typescript
 *
 * [80] 删除有序数组中的重复项 II
 *
 * https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/description/
 *
 * algorithms
 * Medium (63.47%)
 * Likes:    1308
 * Dislikes: 0
 * Total Accepted:    640.2K
 * Total Submissions: 1M
 * Testcase Example:  '[1,1,1,2,2,3]'
 *
 * 给你一个有序数组 nums ，请你 原地 删除重复出现的元素，使得出现次数超过两次的元素只出现两次 ，返回删除后数组的新长度。
 *
 * 不要使用额外的数组空间，你必须在 原地 修改输入数组 并在使用 O(1) 额外空间的条件下完成。
 *
 *
 *
 * 说明：
 *
 * 为什么返回数值是整数，但输出的答案是数组呢？
 *
 * 请注意，输入数组是以「引用」方式传递的，这意味着在函数里修改输入数组对于调用者是可见的。
 *
 * 你可以想象内部操作如下:
 *
 *
 * // nums 是以“引用”方式传递的。也就是说，不对实参做任何拷贝
 * int len = removeDuplicates(nums);
 *
 * // 在函数里修改输入数组对于调用者是可见的。
 * // 根据你的函数返回的长度, 它会打印出数组中 该长度范围内 的所有元素。
 * for (int i = 0; i < len; i++) {
 * print(nums[i]);
 * }
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,1,1,2,2,3]
 * 输出：5, nums = [1,1,2,2,3]
 * 解释：函数应返回新长度 length = 5, 并且原数组的前五个元素被修改为 1, 1, 2, 2, 3。 不需要考虑数组中超出新长度后面的元素。
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0,0,1,1,1,1,2,3,3]
 * 输出：7, nums = [0,0,1,1,2,3,3]
 * 解释：函数应返回新长度 length = 7, 并且原数组的前七个元素被修改为 0, 0, 1, 1, 2, 3,
 * 3。不需要考虑数组中超出新长度后面的元素。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 3 * 10^4
 * -10^4 <= nums[i] <= 10^4
 * nums 已按升序排列
 *
 *
 */

// @lc code=start
function removeDuplicates(nums: number[]): number {
  // 如果数组长度小于等于2，直接返回原长度
  if (nums.length <= 2) {
    return nums.length;
  }

  // 使用双指针技术
  // slow 指针指向下一个要填充的位置
  // fast 指针用于遍历数组
  let slow = 2;

  // 从第三个元素开始遍历（索引2）
  for (let fast = 2; fast < nums.length; fast++) {
    // 关键判断：当前元素是否与 slow-2 位置的元素不同
    // 这样可以确保每个元素最多出现两次
    // 因为数组是有序的，如果 nums[fast] === nums[slow-2]，
    // 说明 nums[fast] 已经出现了至少3次，应该被跳过
    if (nums[fast] !== nums[slow - 2]) {
      // 将当前元素复制到 slow 位置
      nums[slow] = nums[fast];
      // slow 指针向前移动
      slow++;
    }
    // 如果 nums[fast] === nums[slow-2]，说明当前元素已经出现超过2次
    // 跳过这个元素，不移动 slow 指针
  }

  // 返回新数组的长度
  return slow;
}
// @lc code=end
