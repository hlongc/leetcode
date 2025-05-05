/*
 * @lc app=leetcode.cn id=2 lang=typescript
 *
 * [2] 两数相加
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

function addTwoNumbers(
  l1: ListNode | null,
  l2: ListNode | null
): ListNode | null {
  if (!l1 && !l2) return null;
  if (l1 && l2) {
    const dummyHead = new ListNode();
    let current = dummyHead;
    let carry = 0;

    while (l1 || l2 || carry) {
      const val = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
      carry = Math.floor(val / 10);
      const node = new ListNode(val % 10);
      current.next = node;
      current = node;
      // @ts-ignore
      l1 = l1?.next;
      // @ts-ignore
      l2 = l2?.next;
    }

    return dummyHead.next;
  }
  return l1 || l2;
}
// @lc code=end
