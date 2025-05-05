/*
 * @lc app=leetcode.cn id=19 lang=typescript
 *
 * [19] 删除链表的倒数第 N 个结点
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

function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  // 创建一个虚拟头节点，简化边界情况处理（比如删除第一个节点）
  const dummy = new ListNode(0, head);

  // 初始化快慢指针，都指向虚拟头节点
  let fast: ListNode | null = dummy;
  let slow: ListNode | null = dummy;

  // 快指针先前进n+1步
  // 这样当快指针到达链表末尾时，慢指针恰好指向倒数第n+1个节点
  for (let i = 0; i <= n; i++) {
    // 如果n大于链表长度，这种情况在题目中不会出现
    if (fast === null) return head;
    fast = fast.next;
  }

  // 快慢指针同时前进，直到快指针到达链表末尾
  while (fast !== null) {
    fast = fast.next;
    slow = slow!.next;
  }

  // 此时慢指针指向倒数第n+1个节点
  // 删除倒数第n个节点（即慢指针的下一个节点）
  slow!.next = slow!.next!.next;

  // 返回新的链表头（跳过虚拟头节点）
  return dummy.next;
}
// @lc code=end
