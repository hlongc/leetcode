/*
 * @lc app=leetcode.cn id=234 lang=typescript
 *
 * [234] 回文链表
 *
 * https://leetcode.cn/problems/palindrome-linked-list/description/
 *
 * algorithms
 * Easy (57.71%)
 * Likes:    2167
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 2M
 * Testcase Example:  '[1,2,2,1]'
 *
 * 给你一个单链表的头节点 head ，请你判断该链表是否为回文链表。如果是，返回 true ；否则，返回 false 。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：head = [1,2,2,1]
 * 输出：true
 *
 *
 * 示例 2：
 *
 *
 * 输入：head = [1,2]
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * 链表中节点数目在范围[1, 10^5] 内
 * 0 <= Node.val <= 9
 *
 *
 *
 *
 * 进阶：你能否用 O(n) 时间复杂度和 O(1) 空间复杂度解决此题？
 *
 */

// @lc code=start
/**
 * Definition for singly-linked list.
 * class ListNode {
 *     val: number
 *     next: ListNode | null
 *     constructor(val?: number, next?: ListNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.next = (next===undefined ? null : next)
 *     }
 * }
 */

/**
 * 回文链表判断 - 快慢指针 + 反转链表法
 *
 * 核心思路：
 * 1. 使用快慢指针找到链表的中点
 * 2. 反转后半部分链表
 * 3. 比较前半部分和反转后的后半部分
 * 4. (可选) 恢复链表原始结构
 *
 * 为什么这样做？
 * - 回文的特点：正着读和反着读一样
 * - 对于链表：前半部分 === 后半部分的反转
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)，只使用常数级别的额外空间
 */
function isPalindrome(head: ListNode | null): boolean {
  // 边界情况：空链表或单节点链表都是回文
  if (!head || !head.next) {
    return true;
  }

  // 第一步：使用快慢指针找到链表的中点
  // slow 每次走一步，fast 每次走两步
  // 当 fast 到达末尾时，slow 正好在中点
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;

  // 找中点
  while (fast.next && fast.next.next) {
    slow = slow!.next;
    fast = fast.next.next;
  }

  // 此时 slow 指向中点（对于奇数长度）或中点前一个（对于偶数长度）
  // 例如：
  // [1,2,2,1]: slow 指向第一个 2
  // [1,2,3,2,1]: slow 指向 3

  // 第二步：反转后半部分链表
  // slow.next 就是后半部分的起点
  let secondHalf = reverseList(slow!.next);

  // 第三步：比较前半部分和反转后的后半部分
  let firstHalf: ListNode | null = head;
  let secondHalfCopy = secondHalf; // 保存用于后续恢复

  let result = true;
  while (result && secondHalf) {
    // 注意：只需要比较后半部分的长度
    // 因为后半部分可能比前半部分短（奇数长度时）
    if (firstHalf!.val !== secondHalf.val) {
      result = false;
    }
    firstHalf = firstHalf!.next;
    secondHalf = secondHalf.next;
  }

  // (可选) 第四步：恢复链表原始结构
  // 这是一个好习惯，避免修改输入数据
  slow!.next = reverseList(secondHalfCopy);

  return result;
}

/**
 * 辅助函数：反转链表
 *
 * 思路：使用三个指针 prev, curr, next
 * - prev: 前一个节点
 * - curr: 当前节点
 * - next: 下一个节点（临时保存，防止丢失）
 *
 * 例如：1 -> 2 -> 3 -> null
 * 反转后：null <- 1 <- 2 <- 3
 */
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr: ListNode | null = head;

  while (curr) {
    // 1. 保存下一个节点
    const next = curr.next;

    // 2. 反转当前节点的指针
    curr.next = prev;

    // 3. 移动 prev 和 curr
    prev = curr;
    curr = next;
  }

  // curr 为 null，prev 指向新的头节点
  return prev;
}

/**
 * 算法过程图解：
 *
 * 示例 1：[1, 2, 2, 1]
 *
 * 1. 找中点：
 *    1 -> 2 -> 2 -> 1
 *         ↑         ↑
 *       slow       fast
 *
 * 2. 反转后半部分（从第二个2开始）：
 *    前半部分：1 -> 2
 *    后半部分：2 -> 1  =>  1 -> 2
 *
 * 3. 比较：
 *    1 == 1 ✓
 *    2 == 2 ✓
 *    结果：true
 *
 * 示例 2：[1, 2, 3, 2, 1]
 *
 * 1. 找中点：
 *    1 -> 2 -> 3 -> 2 -> 1
 *              ↑           ↑
 *            slow         fast
 *
 * 2. 反转后半部分（从第二个2开始）：
 *    前半部分：1 -> 2 -> 3
 *    后半部分：2 -> 1  =>  1 -> 2
 *
 * 3. 比较（只比较后半部分的长度）：
 *    1 == 1 ✓
 *    2 == 2 ✓
 *    结果：true
 *
 * 示例 3：[1, 2] (非回文)
 *
 * 1. 找中点：
 *    1 -> 2
 *    ↑    ↑
 *  slow  fast
 *
 * 2. 反转后半部分：
 *    前半部分：1
 *    后半部分：2 (已反转)
 *
 * 3. 比较：
 *    1 != 2 ✗
 *    结果：false
 */

/**
 * 方法二：使用数组（备选方案，更简单但空间复杂度 O(n)）
 *
 * 思路：
 * 1. 遍历链表，将所有值存入数组
 * 2. 使用双指针判断数组是否为回文
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
/*
function isPalindrome(head: ListNode | null): boolean {
  const values: number[] = [];
  
  // 收集所有值
  let curr = head;
  while (curr) {
    values.push(curr.val);
    curr = curr.next;
  }
  
  // 双指针判断回文
  let left = 0;
  let right = values.length - 1;
  
  while (left < right) {
    if (values[left] !== values[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}
*/

/**
 * 复杂度对比：
 *
 * 方法一（快慢指针 + 反转）：
 * ✅ 时间：O(n)
 * ✅ 空间：O(1)
 * ❌ 稍微复杂一些
 *
 * 方法二（数组）：
 * ✅ 时间：O(n)
 * ❌ 空间：O(n)
 * ✅ 代码更简洁易懂
 *
 * 进阶要求使用 O(1) 空间，所以方法一是最优解
 */
// @lc code=end
