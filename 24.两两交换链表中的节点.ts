/*
 * @lc app=leetcode.cn id=24 lang=typescript
 *
 * [24] 两两交换链表中的节点
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

function swapPairs(head: ListNode | null): ListNode | null {
  // 创建虚拟头节点，简化边界情况处理
  const dummy = new ListNode(0);
  dummy.next = head;

  // prev指针用于记录每对节点的前一个节点
  let prev = dummy;

  // 循环条件：确保当前位置后至少有两个节点可供交换
  while (prev.next !== null && prev.next.next !== null) {
    // 保存需要交换的两个节点
    const first = prev.next; // 第一个节点
    const second = prev.next.next; // 第二个节点

    // 执行交换操作（三步完成节点交换）
    // 步骤1：第一个节点指向第二个节点的下一个节点
    first.next = second.next;

    // 步骤2：第二个节点指向第一个节点，完成反转
    second.next = first;

    // 步骤3：前一个节点指向第二个节点（交换后的新首节点）
    prev.next = second;

    // 更新prev指针，移动到下一对节点的前一个位置
    prev = first;
  }

  // 返回虚拟头节点的下一个节点，即结果链表的真正头节点
  return dummy.next;
}

/**
 * 解法说明：
 * 1. 节点交换是就地进行的，不创建新节点，只改变指针指向
 * 2. 使用虚拟头节点简化对链表头部的处理
 * 3. 交换是通过三步链接操作完成的（画图理解最佳）
 *
 * 例如链表：1->2->3->4 交换过程：
 * dummy->1->2->3->4
 * 交换1和2：dummy->2->1->3->4
 * 交换3和4：dummy->2->1->4->3
 *
 * 时间复杂度：O(n)，其中n是链表长度，需要遍历一次链表
 * 空间复杂度：O(1)，只使用了常数级额外空间
 */
// @lc code=end
