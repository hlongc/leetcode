/*
 * @lc app=leetcode.cn id=206 lang=typescript
 *
 * [206] 反转链表
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

function reverseList(head: ListNode | null): ListNode | null {
  // 方法一：迭代解法

  // 处理边界情况：如果链表为空或只有一个节点，无需反转，直接返回
  if (head === null || head.next === null) return head;

  // 初始化两个指针
  // curr：当前正在处理的节点，初始为头节点
  let curr: ListNode | null = head;
  // prev：当前节点的前一个节点，初始为null（因为头节点反转后将成为尾节点，指向null）
  let prev: ListNode | null = null;

  // 遍历整个链表，直到当前节点为null
  while (curr !== null) {
    // 保存当前节点的下一个节点，防止链接断开后丢失
    const tmp: ListNode | null = curr.next;

    // 反转指针：将当前节点的next指向前一个节点
    // 例如：原链表 1->2->3 变为 null<-1 2->3
    curr.next = prev;

    // 更新指针位置，为下一次迭代做准备
    // prev指针前进一步，指向当前节点
    prev = curr;
    // curr指针前进一步，指向下一个待处理的节点
    curr = tmp;
  }

  // 遍历结束后，prev指向新的头节点（原链表的最后一个节点）
  // 例如：原链表 1->2->3 反转后变为 3->2->1->null，prev指向3
  return prev;
}
// @lc code=end
