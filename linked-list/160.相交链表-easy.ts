/*
 * @lc app=leetcode.cn id=160 lang=typescript
 *
 * [160] 相交链表
 *
 * https://leetcode.cn/problems/intersection-of-two-linked-lists/description/
 *
 * algorithms
 * Easy (67.93%)
 * Likes:    2821
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 1.9M
 * Testcase Example:  '8\n[4,1,8,4,5]\n[5,6,1,8,4,5]\n2\n3'
 *
 * 给你两个单链表的头节点 headA 和 headB ，请你找出并返回两个单链表相交的起始节点。如果两个链表不存在相交节点，返回 null 。
 *
 * 图示两个链表在节点 c1 开始相交：
 *
 *
 *
 * 题目数据 保证 整个链式结构中不存在环。
 *
 * 注意，函数返回结果后，链表必须 保持其原始结构 。
 *
 * 自定义评测：
 *
 * 评测系统 的输入如下（你设计的程序 不适用 此输入）：
 *
 *
 * intersectVal - 相交的起始节点的值。如果不存在相交节点，这一值为 0
 * listA - 第一个链表
 * listB - 第二个链表
 * skipA - 在 listA 中（从头节点开始）跳到交叉节点的节点数
 * skipB - 在 listB 中（从头节点开始）跳到交叉节点的节点数
 *
 *
 * 评测系统将根据这些输入创建链式数据结构，并将两个头节点 headA 和 headB 传递给你的程序。如果程序能够正确返回相交节点，那么你的解决方案将被
 * 视作正确答案 。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2,
 * skipB = 3
 * 输出：Intersected at '8'
 * 解释：相交节点的值为 8 （注意，如果两个链表相交则不能为 0）。
 * 从各自的表头开始算起，链表 A 为 [4,1,8,4,5]，链表 B 为 [5,6,1,8,4,5]。
 * 在 A 中，相交节点前有 2 个节点；在 B 中，相交节点前有 3 个节点。
 * — 请注意相交节点的值不为 1，因为在链表 A 和链表 B 之中值为 1 的节点 (A 中第二个节点和 B 中第三个节点)
 * 是不同的节点。换句话说，它们在内存中指向两个不同的位置，而链表 A 和链表 B 中值为 8 的节点 (A 中第三个节点，B 中第四个节点)
 * 在内存中指向相同的位置。
 *
 *
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入：intersectVal = 2, listA = [1,9,1,2,4], listB = [3,2,4], skipA = 3, skipB
 * = 1
 * 输出：Intersected at '2'
 * 解释：相交节点的值为 2 （注意，如果两个链表相交则不能为 0）。
 * 从各自的表头开始算起，链表 A 为 [1,9,1,2,4]，链表 B 为 [3,2,4]。
 * 在 A 中，相交节点前有 3 个节点；在 B 中，相交节点前有 1 个节点。
 *
 *
 * 示例 3：
 *
 *
 *
 *
 * 输入：intersectVal = 0, listA = [2,6,4], listB = [1,5], skipA = 3, skipB = 2
 * 输出：No intersection
 * 解释：从各自的表头开始算起，链表 A 为 [2,6,4]，链表 B 为 [1,5]。
 * 由于这两个链表不相交，所以 intersectVal 必须为 0，而 skipA 和 skipB 可以是任意值。
 * 这两个链表不相交，因此返回 null 。
 *
 *
 *
 *
 * 提示：
 *
 *
 * listA 中节点数目为 m
 * listB 中节点数目为 n
 * 1 <= m, n <= 3 * 10^4
 * 1 <= Node.val <= 10^5
 * 0 <= skipA <= m
 * 0 <= skipB <= n
 * 如果 listA 和 listB 没有交点，intersectVal 为 0
 * 如果 listA 和 listB 有交点，intersectVal == listA[skipA] == listB[skipB]
 *
 *
 *
 *
 * 进阶：你能否设计一个时间复杂度 O(m + n) 、仅用 O(1) 内存的解决方案？
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
 * 相交链表 - 双指针解法（浪漫相遇法）
 *
 * 核心思想：
 * 如果两个链表相交，那么从相交点到链表末尾的部分是完全相同的。
 * 关键是如何消除两个链表在相交点之前的长度差。
 *
 * 巧妙之处：
 * - 让指针 pA 遍历完链表 A 后，继续遍历链表 B
 * - 让指针 pB 遍历完链表 B 后，继续遍历链表 A
 * - 这样两个指针走过的总长度相同：lenA + lenB
 * - 如果相交，它们会在相交点相遇
 * - 如果不相交，它们最终都会指向 null
 *
 * 形象比喻：
 * 你走过我走过的路，我走过你走过的路，如果我们有缘，必将相遇。
 *
 * 时间复杂度：O(m + n)，m 和 n 分别是两个链表的长度
 * 空间复杂度：O(1)，只使用两个指针
 */
function getIntersectionNode(
  headA: ListNode | null,
  headB: ListNode | null
): ListNode | null {
  // 边界情况：如果任一链表为空，不可能相交
  if (headA === null || headB === null) {
    return null;
  }

  // 两个指针分别从两个链表的头节点开始
  let pA: ListNode | null = headA;
  let pB: ListNode | null = headB;

  // 当两个指针相遇时停止（相交点或都为 null）
  // 为什么用 != 而不是 !==？
  // 因为我们要比较的是节点引用，而不是节点值
  while (pA !== pB) {
    // pA 走一步：
    // - 如果 pA 不为 null，移动到下一个节点
    // - 如果 pA 为 null（已到达链表 A 末尾），切换到链表 B 的头节点
    pA = pA === null ? headB : pA.next;

    // pB 走一步：
    // - 如果 pB 不为 null，移动到下一个节点
    // - 如果 pB 为 null（已到达链表 B 末尾），切换到链表 A 的头节点
    pB = pB === null ? headA : pB.next;
  }

  // 循环结束时，pA 和 pB 相等，有两种情况：
  // 1. 找到了相交节点（pA === pB === 相交节点）
  // 2. 没有相交（pA === pB === null）
  return pA;
}

/**
 * 算法过程图解：
 *
 * 示例 1：listA = [4,1,8,4,5], listB = [5,6,1,8,4,5]
 *
 * 链表 A: 4 -> 1 -> 8 -> 4 -> 5
 *                    ↑
 * 链表 B: 5 -> 6 -> 1 -> 8 -> 4 -> 5
 *
 * 相交节点是值为 8 的节点
 *
 * 第一轮遍历：
 * pA: 4 -> 1 -> 8 -> 4 -> 5 -> null -> 5(B的头)
 * pB: 5 -> 6 -> 1 -> 8 -> 4 -> 5 -> null -> 4(A的头)
 *
 * 第二轮遍历：
 * pA: 5 -> 6 -> 1 -> 8  ← 在这里相遇！
 * pB: 4 -> 1 -> 8       ← 在这里相遇！
 *
 * 为什么会相遇？
 * - pA 走的路径长度：lenA + (lenB - common)
 * - pB 走的路径长度：lenB + (lenA - common)
 * - 两者相等，所以同时到达相交点
 *
 * 示例 2（不相交）：listA = [2,6,4], listB = [1,5]
 *
 * pA: 2 -> 6 -> 4 -> null -> 1 -> 5 -> null
 * pB: 1 -> 5 -> null -> 2 -> 6 -> 4 -> null
 *
 * 两者最终都指向 null，循环结束，返回 null
 */

/**
 * 方法二：哈希集合法（备选方案）
 *
 * 思路：
 * 1. 遍历链表 A，将所有节点存入哈希集合
 * 2. 遍历链表 B，检查每个节点是否在哈希集合中
 * 3. 第一个在集合中的节点就是相交节点
 *
 * 时间复杂度：O(m + n)
 * 空间复杂度：O(m)，需要存储链表 A 的所有节点
 */
/*
function getIntersectionNode(
  headA: ListNode | null,
  headB: ListNode | null
): ListNode | null {
  if (headA === null || headB === null) {
    return null;
  }

  const visited = new Set<ListNode>();
  
  // 遍历链表 A，存储所有节点
  let curr = headA;
  while (curr !== null) {
    visited.add(curr);
    curr = curr.next;
  }
  
  // 遍历链表 B，查找第一个在集合中的节点
  curr = headB;
  while (curr !== null) {
    if (visited.has(curr)) {
      return curr;
    }
    curr = curr.next;
  }
  
  return null;
}
*/

/**
 * 方法三：双指针对齐法（备选方案）
 *
 * 思路：
 * 1. 先计算两个链表的长度差 diff
 * 2. 让较长的链表先走 diff 步
 * 3. 然后两个指针同时移动，第一个相同的节点就是相交节点
 *
 * 时间复杂度：O(m + n)
 * 空间复杂度：O(1)
 */
/*
function getIntersectionNode(
  headA: ListNode | null,
  headB: ListNode | null
): ListNode | null {
  if (headA === null || headB === null) {
    return null;
  }

  // 计算两个链表的长度
  let lenA = 0, lenB = 0;
  let curr = headA;
  while (curr !== null) {
    lenA++;
    curr = curr.next;
  }
  
  curr = headB;
  while (curr !== null) {
    lenB++;
    curr = curr.next;
  }
  
  // 让较长的链表先走 diff 步
  let pA = headA, pB = headB;
  if (lenA > lenB) {
    for (let i = 0; i < lenA - lenB; i++) {
      pA = pA!.next;
    }
  } else {
    for (let i = 0; i < lenB - lenA; i++) {
      pB = pB!.next;
    }
  }
  
  // 同时移动，找到相交点
  while (pA !== pB) {
    pA = pA!.next;
    pB = pB!.next;
  }
  
  return pA;
}
*/
// @lc code=end
