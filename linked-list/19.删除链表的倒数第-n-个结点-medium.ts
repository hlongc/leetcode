/*
 * @lc app=leetcode.cn id=19 lang=typescript
 *
 * [19] 删除链表的倒数第 N 个结点
 *
 * https://leetcode.cn/problems/remove-nth-node-from-end-of-list/description/
 *
 * algorithms
 * Medium (52.40%)
 * Likes:    3220
 * Dislikes: 0
 * Total Accepted:    2M
 * Total Submissions: 3.7M
 * Testcase Example:  '[1,2,3,4,5]\n2'
 *
 * 给你一个链表，删除链表的倒数第 n 个结点，并且返回链表的头结点。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：head = [1,2,3,4,5], n = 2
 * 输出：[1,2,3,5]
 *
 *
 * 示例 2：
 *
 *
 * 输入：head = [1], n = 1
 * 输出：[]
 *
 *
 * 示例 3：
 *
 *
 * 输入：head = [1,2], n = 1
 * 输出：[1]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 链表中结点的数目为 sz
 * 1 <= sz <= 30
 * 0 <= Node.val <= 100
 * 1 <= n <= sz
 *
 *
 *
 *
 * 进阶：你能尝试使用一趟扫描实现吗？
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
 * 删除链表的倒数第 N 个节点 - 双指针法（一次遍历）
 *
 * 核心思路：
 * 使用两个指针 fast 和 slow，让它们之间保持 n 个节点的距离
 * 1. fast 指针先走 n 步
 * 2. 然后 fast 和 slow 同时移动
 * 3. 当 fast 到达末尾时，slow 正好在待删除节点的前一个位置
 * 4. 删除 slow.next 节点即可
 *
 * 关键技巧：
 * - 使用哑节点（dummy node）简化边界情况的处理
 * - 特别是删除头节点的情况
 *
 * 时间复杂度：O(L)，L 是链表长度，只需要一次遍历
 * 空间复杂度：O(1)，只使用常数级别的额外空间
 */
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  // 创建哑节点，指向头节点
  // 哑节点的作用：简化删除头节点的边界情况
  // 例如：当链表只有一个节点，且 n = 1 时，需要删除头节点
  const dummy = new ListNode(0, head);

  // 初始化快慢指针，都从哑节点开始
  let fast: ListNode | null = dummy;
  let slow: ListNode | null = dummy;

  // 第一步：让 fast 指针先走 n+1 步
  // 为什么是 n+1？因为我们需要让 slow 停在待删除节点的前一个位置
  // 这样才能执行 slow.next = slow.next.next 来删除节点
  for (let i = 0; i <= n; i++) {
    fast = fast!.next;
  }

  // 第二步：fast 和 slow 同时移动
  // 当 fast 到达末尾（null）时，slow 正好在待删除节点的前一个位置
  while (fast !== null) {
    fast = fast.next;
    slow = slow!.next;
  }

  // 第三步：删除倒数第 n 个节点
  // slow.next 就是要删除的节点
  slow!.next = slow!.next!.next;

  // 返回新的头节点
  // 因为可能删除了原来的头节点，所以返回 dummy.next
  return dummy.next;
}

/**
 * 算法过程图解：
 *
 * 示例 1：head = [1,2,3,4,5], n = 2
 * 目标：删除倒数第2个节点（节点4）
 *
 * 1. 初始状态（创建哑节点）：
 *    dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
 *    ↑
 *  fast/slow
 *
 * 2. fast 先走 n+1 = 3 步：
 *    dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
 *    ↑                 ↑
 *   slow             fast
 *
 * 3. fast 和 slow 同时移动，直到 fast 为 null：
 *    移动1次：
 *    dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
 *             ↑                 ↑
 *           slow              fast
 *
 *    移动2次：
 *    dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
 *                  ↑                 ↑
 *                slow              fast
 *
 *    移动3次：
 *    dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> null
 *                       ↑                 ↑
 *                     slow              fast (null)
 *
 * 4. 删除 slow.next（节点4）：
 *    slow.next = slow.next.next
 *
 *    dummy -> 1 -> 2 -> 3 -> 5 -> null
 *                       ↑
 *                     slow
 *
 * 5. 返回 dummy.next，即节点1：
 *    结果：[1,2,3,5] ✓
 *
 *
 * 示例 2：head = [1], n = 1
 * 目标：删除唯一的节点
 *
 * 1. 初始状态：
 *    dummy -> 1 -> null
 *    ↑
 *  fast/slow
 *
 * 2. fast 先走 2 步：
 *    dummy -> 1 -> null
 *    ↑             ↑
 *   slow         fast (null)
 *
 * 3. fast 已经是 null，不需要移动
 *
 * 4. 删除 slow.next（节点1）：
 *    dummy -> null
 *    ↑
 *   slow
 *
 * 5. 返回 dummy.next：
 *    结果：[] (空链表) ✓
 */

/**
 * 为什么需要哑节点？
 *
 * 场景1：删除头节点
 * - 不使用哑节点：需要特殊处理，返回 head.next
 * - 使用哑节点：统一处理，返回 dummy.next
 *
 * 场景2：链表只有一个节点
 * - 不使用哑节点：需要特殊判断
 * - 使用哑节点：逻辑统一，无需特殊处理
 *
 * 哑节点是链表问题中的常用技巧，可以大大简化代码！
 */

/**
 * 方法二：两次遍历（备选方案）
 *
 * 思路：
 * 1. 第一次遍历：计算链表长度 L
 * 2. 第二次遍历：走到第 L-n 个节点（倒数第 n 个节点的前一个）
 * 3. 删除目标节点
 *
 * 时间复杂度：O(L)
 * 空间复杂度：O(1)
 *
 * 缺点：需要两次遍历，不如双指针优雅
 */
/*
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  
  // 第一次遍历：计算长度
  let length = 0;
  let curr = head;
  while (curr) {
    length++;
    curr = curr.next;
  }
  
  // 第二次遍历：找到倒数第 n+1 个节点
  curr = dummy;
  for (let i = 0; i < length - n; i++) {
    curr = curr!.next;
  }
  
  // 删除倒数第 n 个节点
  curr!.next = curr!.next!.next;
  
  return dummy.next;
}
*/

/**
 * 重要细节总结：
 *
 * 1. 为什么 fast 要走 n+1 步？
 *    - 因为我们需要 slow 停在待删除节点的前一个位置
 *    - 这样才能执行删除操作：slow.next = slow.next.next
 *
 * 2. 为什么使用哑节点？
 *    - 统一处理删除头节点的情况
 *    - 简化边界条件判断
 *
 * 3. 时间复杂度为什么是 O(L)？
 *    - fast 指针走了 L 步（n+1 步初始化 + L-n-1 步移动）
 *    - slow 指针走了 L-n-1 步
 *    - 总共一次遍历
 *
 * 4. 这个算法的优势：
 *    ✅ 只需要一次遍历（满足进阶要求）
 *    ✅ 空间复杂度 O(1)
 *    ✅ 代码简洁
 *    ✅ 边界情况处理优雅
 */
// @lc code=end
