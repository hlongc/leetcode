/*
 * @lc app=leetcode.cn id=287 lang=typescript
 *
 * [287] 寻找重复数
 */

// @lc code=start
/**
 * 
  二分查找除了对索引二分，还有值域二分
数组元素是 1 - n 中的某一个，出现的位置不确定，但值域是确定的。

对索引二分，一般用于有序数组中找元素，因为索引的大小可以反映值的大小，因此对索引二分即可。
对值域二分。重复数落在 [1, n] ，可以对 [1, n] 这个值域二分查找。
mid = (1 + n) / 2，重复数要么落在[1, mid]，要么落在[mid + 1, n]。

遍历原数组，统计 <= mid 的元素个数，记为 k。

如果k > mid，说明有超过 mid 个数落在[1, mid]，但该区间只有 mid 个“坑”，说明重复的数落在[1, mid]。

相反，如果k <= mid，则说明重复数落在[mid + 1, n]。

对重复数所在的区间继续二分，直到区间闭合，重复数就找到了。
 */
function findDuplicate1(nums: number[]): number {
  // left和right表示值域的范围，不是数组的索引
  let left = 1,
    right = nums.length - 1;

  while (left < right) {
    // 计算值域的中点
    const mid = left + ((right - left) >> 1);
    // 统计小于等于mid的数字个数
    let count = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] <= mid) {
        count++;
      }
    }

    // 如果count大于mid，说明重复数字在左半区间[left, mid]
    if (count > mid) {
      right = mid;
    } else {
      // 否则在右半区间[mid+1, right]
      left = mid + 1;
    }
  }

  return left;
}

/**
 * 方法二：快慢指针（Floyd判圈算法）
 *
 * 算法思路：
 * 1. 将数组看作一个隐式的链表，数组的值表示下一个节点的索引
 * 2. 由于有重复数字，这个隐式链表中必然存在环
 * 3. 使用快慢指针找到环的入口，该入口就是重复的数字
 *
 * 具体步骤：
 * 1. 快指针每次走两步，慢指针每次走一步，直到它们相遇
 * 2. 相遇后，将快指针重置到起点，然后快慢指针每次都走一步
 * 3. 它们再次相遇的点就是环的入口，即重复的数字
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 *
 * 举例：nums = [1,3,4,2,2]
 * - 形成的隐式链表：0->1->3->2->4->2->4->2...
 * - 环的入口为2，即为重复的数字
 * 思路参考链接：https://leetcode.cn/problems/linked-list-cycle-ii/solutions/262536/141ti-de-kuo-zhan-ru-guo-lian-biao-you-huan-ru-he-/
 * @param nums 输入数组
 * @returns 重复的数字
 */
function findDuplicate(nums: number[]): number {
  // 初始化快慢指针都在起点
  let slow = 0,
    fast = 0;

  // 第一阶段：找到快慢指针的相遇点
  while (true) {
    // 慢指针走一步
    slow = nums[slow];
    // 快指针走两步
    fast = nums[nums[fast]];
    if (slow === fast) {
      // 相遇后进入第二阶段
      // 将快指针重置到起点
      fast = 0;
      // 第二阶段：两个指针同速前进，相遇点即为环的入口
      while (true) {
        if (slow === fast) {
          return slow; // 返回环的入口，即重复的数字
        }
        // 两个指针都每次走一步
        slow = nums[slow];
        fast = nums[fast];
      }
    }
  }
}
// @lc code=end
