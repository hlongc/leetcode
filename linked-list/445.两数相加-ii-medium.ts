/*
 * @lc app=leetcode.cn id=445 lang=typescript
 *
 * [445] 两数相加 II
 *
 * https://leetcode.cn/problems/add-two-numbers-ii/description/
 *
 * algorithms
 * Medium (61.86%)
 * Likes:    792
 * Dislikes: 0
 * Total Accepted:    185.2K
 * Total Submissions: 299.4K
 * Testcase Example:  '[7,2,4,3]\n[5,6,4]'
 *
 * 给你两个 非空 链表来代表两个非负整数。数字最高位位于链表开始位置。它们的每个节点只存储一位数字。将这两数相加会返回一个新的链表。
 *
 * 你可以假设除了数字 0 之外，这两个数字都不会以零开头。
 *
 *
 *
 * 示例1：
 *
 *
 *
 *
 * 输入：l1 = [7,2,4,3], l2 = [5,6,4]
 * 输出：[7,8,0,7]
 *
 *
 * 示例2：
 *
 *
 * 输入：l1 = [2,4,3], l2 = [5,6,4]
 * 输出：[8,0,7]
 *
 *
 * 示例3：
 *
 *
 * 输入：l1 = [0], l2 = [0]
 * 输出：[0]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 链表的长度范围为 [1, 100]
 * 0 <= node.val <= 9
 * 输入数据保证链表代表的数字无前导 0
 *
 *
 *
 *
 * 进阶：如果输入链表不能翻转该如何解决？
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
 * 解题思路：栈 + 头插法
 *
 * 核心思想：
 * 1. 链表高位在前，但加法需要从低位开始计算
 * 2. 使用栈将链表节点逆序，实现从低位到高位的计算
 * 3. 使用头插法构建结果链表，保证高位在前
 *
 * 算法流程：
 * 1. 将两个链表的所有节点值分别压入两个栈
 * 2. 从栈顶开始弹出（相当于从低位开始），逐位相加
 * 3. 处理进位，用头插法构建结果链表
 *
 * 示例：
 * l1 = [7,2,4,3]  →  栈1: [7,2,4,3]  (栈顶是3)
 * l2 = [5,6,4]    →  栈2: [5,6,4]    (栈顶是4)
 *
 * 计算过程：
 * 3+4=7, carry=0  →  [7]
 * 4+6=10, carry=1 →  [0,7]
 * 2+5+1=8, carry=0 → [8,0,7]
 * 7+0=7, carry=0  →  [7,8,0,7]
 *
 * 时间复杂度：O(max(m,n))，m和n是两个链表的长度
 * 空间复杂度：O(m+n)，需要两个栈存储节点值
 */
function addTwoNumbers(
  l1: ListNode | null,
  l2: ListNode | null
): ListNode | null {
  // 步骤1：将两个链表的值分别压入栈
  const stack1: number[] = [];
  const stack2: number[] = [];

  let curr1 = l1;
  while (curr1) {
    stack1.push(curr1.val);
    curr1 = curr1.next;
  }

  let curr2 = l2;
  while (curr2) {
    stack2.push(curr2.val);
    curr2 = curr2.next;
  }

  // 步骤2：从栈顶开始弹出，逐位相加
  let carry = 0; // 进位
  let result: ListNode | null = null; // 结果链表

  // 当两个栈都不为空，或还有进位时，继续计算
  while (stack1.length > 0 || stack2.length > 0 || carry > 0) {
    // 获取当前位的值（栈为空时取0）
    const val1 = stack1.length > 0 ? stack1.pop()! : 0;
    const val2 = stack2.length > 0 ? stack2.pop()! : 0;

    // 计算当前位的和
    const sum = val1 + val2 + carry;
    carry = Math.floor(sum / 10); // 计算进位
    const digit = sum % 10; // 当前位的数字

    // 步骤3：使用头插法构建结果链表（保证高位在前）
    const newNode = new ListNode(digit);
    newNode.next = result; // 新节点指向当前结果链表的头
    result = newNode; // 更新结果链表的头为新节点
  }

  return result;
}
// @lc code=end
