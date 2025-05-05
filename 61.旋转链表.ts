/*
 * @lc app=leetcode.cn id=61 lang=typescript
 *
 * [61] 旋转链表
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

function rotateRight(head: ListNode | null, k: number): ListNode | null {
  // 处理特殊情况
  if (head === null || head.next === null || k === 0) {
    return head; // 如果链表为空、只有一个节点或不需要旋转，直接返回
  }

  // 第一步：计算链表长度，并找到尾节点
  let length = 1; // 链表长度至少为1
  let tail = head; // 尾节点初始为头节点

  // 遍历到链表尾部
  while (tail.next !== null) {
    tail = tail.next;
    length++;
  }

  // 第二步：计算实际需要旋转的次数
  // 如果k是链表长度的倍数，旋转后链表不变
  k = k % length;
  if (k === 0) {
    return head; // 不需要旋转，直接返回
  }

  // 第三步：找到新的尾节点位置（倒数第k+1个节点）
  let newTail = head;
  for (let i = 0; i < length - k - 1; i++) {
    newTail = newTail.next!;
  }

  // 第四步：执行旋转操作
  // 保存新的头节点（当前尾节点的下一个节点）
  const newHead = newTail.next;

  // 断开链接，形成新的尾节点
  newTail.next = null;

  // 将原尾节点连接到原头节点，形成环
  tail.next = head;

  // 返回新的头节点
  return newHead;
}

/**
 * 解法说明：
 * 1. 旋转链表k次相当于将链表的后k个节点移到链表前面
 * 2. 为了处理k可能大于链表长度的情况，需要对k取模
 * 3. 找到旋转点后，只需要调整三个指针：
 *    - 新的尾节点（指向null）
 *    - 原来的尾节点（指向原来的头节点）
 *    - 新的头节点（作为返回值）
 *
 * 时间复杂度：O(n)，其中n是链表长度，最多遍历链表两次
 * 空间复杂度：O(1)，只使用了常数级额外空间
 */
// @lc code=end
