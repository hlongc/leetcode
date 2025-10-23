/*
 * @lc app=leetcode.cn id=1019 lang=typescript
 *
 * [1019] 链表中的下一个更大节点
 *
 * https://leetcode.cn/problems/next-greater-node-in-linked-list/description/
 *
 * algorithms
 * Medium (66.58%)
 * Likes:    367
 * Dislikes: 0
 * Total Accepted:    74.4K
 * Total Submissions: 111.6K
 * Testcase Example:  '[2,1,5]'
 *
 * 给定一个长度为 n 的链表 head
 *
 * 对于列表中的每个节点，查找下一个 更大节点 的值。也就是说，对于每个节点，找到它旁边的第一个节点的值，这个节点的值 严格大于 它的值。
 *
 * 返回一个整数数组 answer ，其中 answer[i] 是第 i 个节点( 从1开始 )的下一个更大的节点的值。如果第 i
 * 个节点没有下一个更大的节点，设置 answer[i] = 0 。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：head = [2,1,5]
 * 输出：[5,5,0]
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入：head = [2,7,4,3,5]
 * 输出：[7,0,5,5,0]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 链表中节点数为 n
 * 1 <= n <= 10^4
 * 1 <= Node.val <= 10^9
 *
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
 * 解题思路：单调递减栈
 *
 * 这是一个经典的"下一个更大元素"问题，使用单调栈可以在 O(n) 时间内解决。
 *
 * 核心思想：
 * 1. 维护一个单调递减栈，栈中存储节点的索引和值
 * 2. 遍历链表时，对于当前节点：
 *    - 如果它的值大于栈顶元素的值，说明找到了栈顶元素的"下一个更大节点"
 *    - 弹出栈顶，并将当前值填入对应位置的结果数组
 *    - 重复此过程，直到栈为空或栈顶值大于等于当前值
 *    - 将当前节点入栈
 * 3. 遍历结束后，栈中剩余的元素都没有"下一个更大节点"，结果为0
 *
 * 示例：[2, 7, 4, 3, 5]
 * - index=0, val=2: stack=[(0,2)], result=[0]
 * - index=1, val=7: 7>2，弹出(0,2)，result[0]=7; stack=[(1,7)], result=[7,0]
 * - index=2, val=4: stack=[(1,7),(2,4)], result=[7,0,0]
 * - index=3, val=3: stack=[(1,7),(2,4),(3,3)], result=[7,0,0,0]
 * - index=4, val=5: 5>3弹出(3,3)，result[3]=5; 5>4弹出(2,4)，result[2]=5
 *   stack=[(1,7),(4,5)], result=[7,0,5,5,0]
 *
 * 时间复杂度：O(n)，每个节点最多入栈和出栈各一次
 * 空间复杂度：O(n)，栈和结果数组的空间
 */
function nextLargerNodes(head: ListNode | null): number[] {
  // 边界条件：空链表
  if (!head) return [];

  // 结果数组，初始化为0（表示没有更大的节点）
  const result: number[] = [];

  // 单调递减栈：存储 [索引, 值] 元组
  // 栈中元素从栈底到栈顶的值是递减的
  const stack: Array<{ index: number; value: number }> = [];

  // 当前节点的索引
  let index = 0;

  // 遍历链表
  while (head) {
    const currentValue = head.val;

    // 初始化当前位置的结果为0（假设没有更大的节点）
    result[index] = 0;

    // 处理栈中所有小于当前值的元素
    // 这些元素找到了它们的"下一个更大节点"，就是当前节点
    while (stack.length > 0 && currentValue > stack[stack.length - 1].value) {
      const top = stack.pop()!;
      // 更新之前节点的结果：它的下一个更大节点就是当前值
      result[top.index] = currentValue;
    }

    // 将当前节点入栈，等待后续可能的更大节点
    stack.push({ index, value: currentValue });

    // 移动到下一个节点
    index++;
    head = head.next;
  }

  // 遍历结束后，栈中剩余的元素都没有找到更大的节点
  // 它们在result中已经被初始化为0了，不需要额外处理

  return result;
}
// @lc code=end
