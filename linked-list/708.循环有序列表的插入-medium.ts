/*
 * @lc app=leetcode.cn id=708 lang=typescript
 *
 * [708] 循环有序列表的插入
 *
 * https://leetcode.cn/problems/insert-into-a-sorted-circular-linked-list/description/
 *
 * algorithms
 * Medium
 * Likes:
 * Dislikes:
 * Total Accepted:
 * Total Submissions:
 * Testcase Example:  '[3,4,1]\n2'
 *
 * 给定循环单调递增列表中的一个点，写一个函数向这个列表中插入一个新元素 insertVal ，使这个列表仍然是循环升序的。
 *
 * 给定的可以是这个列表中任意一个顶点的指针，并不一定是这个列表中最小元素的指针。
 *
 * 如果有多个满足条件的插入位置，可以选择任意一个位置插入新的值，插入后整个列表仍然保持有序。
 *
 * 如果列表为空（给定的节点是 null），需要创建一个循环有序列表并返回这个节点。否则，请返回原先给定的节点。
 *
 *
 * 示例 1：
 *
 * 输入：head = [3,4,1], insertVal = 2
 * 输出：[3,4,1,2]
 * 解释：在上图中，有一个包含三个元素的循环有序列表，你获得值为 3 的节点的指针，我们需要向表中插入元素 2。
 * 新插入的节点应该在 1 和 3 之间，插入之后，整个列表如上图所示，最后返回节点 3。
 *
 *
 * 示例 2：
 *
 * 输入：head = [], insertVal = 1
 * 输出：[1]
 * 解释：列表为空（给定的节点是 null），创建一个循环有序列表并返回这个节点。
 *
 *
 * 示例 3：
 *
 * 输入：head = [1], insertVal = 0
 * 输出：[1,0]
 *
 *
 * 提示：
 *
 * 0 <= Number of Nodes <= 5 * 10^4
 * -10^6 <= ListNode.val <= 10^6
 * -10^6 <= insertVal <= 10^6
 *
 */

// @lc code=start
/**
 * Definition for node.
 * class ListNode {
 *     val: number
 *     next: ListNode | null
 *     constructor(val?: number, next?: ListNode | null) {
 *         this.val = (val===undefined ? 0 : val);
 *         this.next = (next===undefined ? null : next);
 *     }
 * }
 */
/**
 * 解题思路：循环链表插入
 *
 * 核心思想：
 * 在循环有序链表中找到合适的插入位置
 *
 * 需要考虑的情况：
 * 1. 空链表：创建新节点，自己指向自己
 * 2. 插入值在两个节点之间：curr.val <= insertVal <= next.val
 * 3. 插入值在最大值和最小值之间（跨越边界）：curr.val > next.val 且 (insertVal >= curr.val 或 insertVal <= next.val)
 * 4. 所有节点值相同：遍历一圈后插入任意位置
 *
 * 算法流程：
 * 1. 处理空链表情况
 * 2. 遍历链表找插入位置：
 *    - 情况1：insertVal 在 curr 和 next 之间
 *    - 情况2：curr 是最大值，next 是最小值，insertVal 是新的最大或最小值
 *    - 情况3：遍历一圈回到起点（所有值相同）
 * 3. 插入新节点
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function insert(head: ListNode | null, insertVal: number): ListNode | null {
  // 情况1：空链表，创建新节点并自己指向自己
  if (!head) {
    const newNode = new ListNode(insertVal);
    newNode.next = newNode;
    return newNode;
  }

  // 情况2：只有一个节点
  if (head.next === head) {
    const newNode = new ListNode(insertVal, head);
    head.next = newNode;
    return head;
  }

  // 情况3：多个节点，遍历找插入位置
  let curr: ListNode = head;
  let next: ListNode = head.next!;

  // 标记是否找到插入位置
  let toInsert = false;

  do {
    // 情况A：insertVal 在 curr 和 next 之间（正常情况）
    // 例如：3 -> 4，插入 3.5
    if (curr.val <= insertVal && insertVal <= next.val) {
      toInsert = true;
    }
    // 情况B：curr 是最大值，next 是最小值（跨越边界点）
    // 且 insertVal 是新的最大值或新的最小值
    // 例如：4 -> 1，插入 5 或 0
    else if (curr.val > next.val) {
      // insertVal >= curr.val：新的最大值，例如 4 -> 1，插入 5
      // insertVal <= next.val：新的最小值，例如 4 -> 1，插入 0
      if (insertVal >= curr.val || insertVal <= next.val) {
        toInsert = true;
      }
    }

    // 找到插入位置，跳出循环
    if (toInsert) {
      break;
    }

    // 继续遍历
    curr = next;
    next = next.next!;
  } while (curr !== head); // 遍历一圈回到起点

  // 插入新节点
  // 如果遍历一圈都没找到合适位置（所有节点值相同），在当前位置插入
  const newNode = new ListNode(insertVal, next);
  curr.next = newNode;

  return head;
}

/**
 * 算法图解：
 *
 * 示例1：head = [3,4,1], insertVal = 2
 *
 * 初始状态（循环链表）：
 * 3 -> 4 -> 1 -> (回到3)
 * ↑
 * head
 *
 * 遍历过程：
 * curr=3, next=4: 3 <= 2 <= 4? 否
 * curr=4, next=1: 4 > 1 且 (2 >= 4 或 2 <= 1)? 否
 * curr=1, next=3: 1 <= 2 <= 3? 是！找到位置
 *
 * 插入后：
 * 3 -> 4 -> 1 -> 2 -> (回到3)
 *
 *
 * 示例2：head = [3,5,1], insertVal = 0
 *
 * 遍历过程：
 * curr=3, next=5: 3 <= 0 <= 5? 否
 * curr=5, next=1: 5 > 1 且 (0 >= 5 或 0 <= 1)? 是！(0 <= 1)
 *
 * 插入后：
 * 3 -> 5 -> 0 -> 1 -> (回到3)
 *
 *
 * 示例3：head = [3,3,3], insertVal = 3
 *
 * 遍历一圈都不满足条件，最后在任意位置插入
 *
 *
 * 关键点：
 * 1. 循环链表的特点：最后一个节点指向头节点
 * 2. 需要处理跨越最大最小值边界的情况
 * 3. 需要处理所有节点值相同的情况
 * 4. 使用 do-while 确保至少遍历一次
 */
// @lc code=end
