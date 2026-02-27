/*
 * @lc app=leetcode.cn id=142 lang=typescript
 *
 * [142] 环形链表 II
 *
 * https://leetcode.cn/problems/linked-list-cycle-ii/description/
 *
 * algorithms
 * Medium (62.42%)
 * Likes:    2938
 * Dislikes: 0
 * Total Accepted:    1.4M
 * Total Submissions: 2.2M
 * Testcase Example:  '[3,2,0,-4]\n1'
 *
 * 给定一个链表的头节点  head ，返回链表开始入环的第一个节点。 如果链表无环，则返回 null。
 *
 * 如果链表中有某个节点，可以通过连续跟踪 next 指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数 pos
 * 来表示链表尾连接到链表中的位置（索引从 0 开始）。如果 pos 是 -1，则在该链表中没有环。注意：pos
 * 不作为参数进行传递，仅仅是为了标识链表的实际情况。
 *
 * 不允许修改 链表。
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：head = [3,2,0,-4], pos = 1
 * 输出：返回索引为 1 的链表节点
 * 解释：链表中有一个环，其尾部连接到第二个节点。
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入：head = [1,2], pos = 0
 * 输出：返回索引为 0 的链表节点
 * 解释：链表中有一个环，其尾部连接到第一个节点。
 *
 *
 * 示例 3：
 *
 *
 *
 *
 * 输入：head = [1], pos = -1
 * 输出：返回 null
 * 解释：链表中没有环。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 链表中节点的数目范围在范围 [0, 10^4] 内
 * -10^5 <= Node.val <= 10^5
 * pos 的值为 -1 或者链表中的一个有效索引
 *
 *
 *
 *
 * 进阶：你是否可以使用 O(1) 空间解决此题？
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
 * 解题思路：Floyd判圈算法（快慢指针）
 *
 * 核心思想：
 * 1. 阶段1：使用快慢指针判断是否有环
 *    - 慢指针每次走1步，快指针每次走2步
 *    - 如果有环，快慢指针一定会相遇
 *
 * 2. 阶段2：找到环的入口节点
 *    - 设：头节点到环入口距离为 a
 *         环入口到相遇点距离为 b
 *         相遇点到环入口距离为 c
 *    - 相遇时：慢指针走了 a+b，快指针走了 a+b+n(b+c)
 *    - 因为快指针速度是慢指针2倍：2(a+b) = a+b+n(b+c)
 *    - 化简得：a = (n-1)(b+c) + c
 *    - 结论：从头节点和相遇点同时出发，每次走1步，会在环入口相遇
 *
 * 图示：
 *     head
 *      ↓
 *   1→2→3→4
 *       ↑  ↓
 *       6←5
 *
 * a=2(到节点3), b=1(到节点4), c=2(回到节点3)
 * 相遇点在节点4，从head和节点4同时走，都会在节点3(环入口)相遇
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function detectCycle(head: ListNode | null): ListNode | null {
  // 边界情况：空链表或单节点
  if (!head || !head.next) return null;

  // 阶段1：快慢指针判断是否有环
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;

  // 快指针每次走2步，慢指针每次走1步
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;

    // 快慢指针相遇，说明有环
    if (slow === fast) {
      // 阶段2：找环的入口
      // 一个指针从头开始，一个从相遇点开始
      // 两个指针每次都走1步，相遇点就是环的入口
      let ptr1: ListNode | null = head;
      let ptr2: ListNode | null = slow;

      while (ptr1 !== ptr2) {
        ptr1 = ptr1!.next;
        ptr2 = ptr2!.next;
      }

      // 返回环的入口节点
      return ptr1;
    }
  }

  // 快指针到达链表末尾，说明无环
  return null;
}
// @lc code=end
