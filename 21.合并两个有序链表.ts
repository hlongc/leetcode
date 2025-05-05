/*
 * @lc app=leetcode.cn id=21 lang=typescript
 *
 * [21] 合并两个有序链表
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

function mergeTwoLists(
  list1: ListNode | null,
  list2: ListNode | null
): ListNode | null {
  // 处理边界情况：如果有一个链表为空，直接返回另一个链表
  if (!list1) return list2;
  if (!list2) return list1;

  // 创建虚拟头节点，简化边界情况处理
  const dummyHead = new ListNode(-1);
  // current指针用于构建结果链表
  let current = dummyHead;

  // 同时遍历两个链表，直到至少一个链表遍历完
  while (list1 && list2) {
    // 比较两个链表当前节点的值，选择较小的节点接入结果链表
    if (list1.val <= list2.val) {
      // 直接使用list1的节点，无需创建新节点
      current.next = list1;
      // list1指针前进
      list1 = list1.next;
    } else {
      // 直接使用list2的节点，无需创建新节点
      current.next = list2;
      // list2指针前进
      list2 = list2.next;
    }
    // current指针前进
    current = current.next;
  }

  // 将未遍历完的链表直接接到结果链表末尾
  // 注意：这里至少有一个链表已经为null
  current.next = list1 || list2;

  // 返回虚拟头节点的下一个节点，即结果链表的真正头节点
  return dummyHead.next;
}
// @lc code=end
