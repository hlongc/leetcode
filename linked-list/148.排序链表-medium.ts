/*
 * @lc app=leetcode.cn id=148 lang=typescript
 *
 * [148] 排序链表
 *
 * https://leetcode.cn/problems/sort-list/description/
 *
 * algorithms
 * Medium (67.66%)
 * Likes:    2661
 * Dislikes: 0
 * Total Accepted:    819.2K
 * Total Submissions: 1.2M
 * Testcase Example:  '[4,2,1,3]'
 *
 * 给你链表的头结点 head ，请将其按 升序 排列并返回 排序后的链表 。
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：head = [4,2,1,3]
 * 输出：[1,2,3,4]
 *
 *
 * 示例 2：
 *
 *
 * 输入：head = [-1,5,3,4,0]
 * 输出：[-1,0,3,4,5]
 *
 *
 * 示例 3：
 *
 *
 * 输入：head = []
 * 输出：[]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 链表中节点的数目在范围 [0, 5 * 10^4] 内
 * -10^5 <= Node.val <= 10^5
 *
 *
 *
 *
 * 进阶：你可以在 O(n log n) 时间复杂度和常数级空间复杂度下，对链表进行排序吗？
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
 * 排序链表 - 归并排序（自顶向下）
 *
 * 核心思路：
 * 归并排序是最适合链表的排序算法，因为：
 * 1. 链表不支持随机访问，快速排序等算法效率低
 * 2. 归并排序只需要顺序访问，非常适合链表
 * 3. 时间复杂度 O(n log n)，空间复杂度 O(log n)（递归栈）
 *
 * 算法步骤：
 * 1. 分割（Divide）：使用快慢指针找到链表中点，将链表分成两半
 * 2. 递归排序（Conquer）：递归地对左右两部分进行排序
 * 3. 合并（Merge）：合并两个已排序的链表
 *
 * 时间复杂度：O(n log n)
 * - 分割：log n 层
 * - 每层合并：O(n)
 * 空间复杂度：O(log n)，递归调用栈的深度
 */
function sortList(head: ListNode | null): ListNode | null {
  // 基本情况：空链表或只有一个节点，已经有序
  if (!head || !head.next) {
    return head;
  }

  // 第一步：找到链表的中点，并分割成两个链表
  // 使用快慢指针找中点
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;
  let prev: ListNode | null = null; // 记录 slow 的前一个节点

  // 快指针每次走两步，慢指针每次走一步
  // 当快指针到达末尾时，慢指针在中点
  while (fast && fast.next) {
    prev = slow;
    slow = slow!.next;
    fast = fast.next.next;
  }

  // 断开链表，分成两部分
  // prev.next 指向中点，将其设为 null 来分割链表
  prev!.next = null;

  // 现在我们有两个链表：
  // left: head -> ... -> prev -> null
  // right: slow -> ... -> null

  // 第二步：递归排序左右两部分
  const left = sortList(head); // 排序左半部分
  const right = sortList(slow); // 排序右半部分

  // 第三步：合并两个有序链表
  return merge(left, right);
}

/**
 * 合并两个有序链表
 *
 * 思路：
 * - 使用哑节点简化边界处理
 * - 比较两个链表的当前节点，选择较小的加入结果链表
 * - 重复直到其中一个链表为空
 * - 将剩余的非空链表接到结果链表末尾
 *
 * 时间复杂度：O(n)，n 是两个链表的总长度
 * 空间复杂度：O(1)
 */
function merge(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  // 创建哑节点，简化边界处理
  const dummy = new ListNode(0);
  let curr = dummy;

  // 比较两个链表的节点，将较小的节点加入结果链表
  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }

  // 将剩余的非空链表接到结果链表末尾
  // 因为两个链表都已排序，剩余部分一定大于当前结果链表
  curr.next = l1 || l2;

  return dummy.next;
}

/**
 * 算法过程图解：
 *
 * 示例：[4, 2, 1, 3]
 *
 * 第一层分割：
 *     [4, 2, 1, 3]
 *         ↓
 *    [4, 2]  [1, 3]
 *
 * 第二层分割：
 *    [4, 2]  [1, 3]
 *      ↓        ↓
 *   [4] [2]  [1] [3]
 *
 * 开始合并（自底向上）：
 *
 * 第一层合并：
 *   merge([4], [2]) => [2, 4]
 *   merge([1], [3]) => [1, 3]
 *
 * 第二层合并：
 *   merge([2, 4], [1, 3])
 *
 *   步骤：
 *   1. 比较 2 和 1: 选 1 => [1]
 *   2. 比较 2 和 3: 选 2 => [1, 2]
 *   3. 比较 4 和 3: 选 3 => [1, 2, 3]
 *   4. l2 为空，接上 l1: => [1, 2, 3, 4]
 *
 * 最终结果：[1, 2, 3, 4] ✓
 */

/**
 * 详细执行流程（以 [4, 2, 1, 3] 为例）：
 *
 * sortList([4, 2, 1, 3])
 * ├─ 找中点: slow = 1, prev = 2
 * ├─ 分割: [4, 2] 和 [1, 3]
 * ├─ sortList([4, 2])
 * │  ├─ 找中点: slow = 2, prev = 4
 * │  ├─ 分割: [4] 和 [2]
 * │  ├─ sortList([4]) => [4] (base case)
 * │  ├─ sortList([2]) => [2] (base case)
 * │  └─ merge([4], [2]) => [2, 4]
 * ├─ sortList([1, 3])
 * │  ├─ 找中点: slow = 3, prev = 1
 * │  ├─ 分割: [1] 和 [3]
 * │  ├─ sortList([1]) => [1] (base case)
 * │  ├─ sortList([3]) => [3] (base case)
 * │  └─ merge([1], [3]) => [1, 3]
 * └─ merge([2, 4], [1, 3]) => [1, 2, 3, 4]
 */

/**
 * 为什么归并排序最适合链表？
 *
 * 1. 数组 vs 链表排序算法对比：
 *
 * | 算法 | 数组时间 | 链表时间 | 链表适用性 |
 * |------|---------|---------|-----------|
 * | 快速排序 | O(n log n) | O(n²) | ❌ 需要随机访问 |
 * | 堆排序 | O(n log n) | O(n²) | ❌ 需要随机访问 |
 * | 归并排序 | O(n log n) | O(n log n) | ✅ 只需顺序访问 |
 *
 * 2. 归并排序的优势：
 *    - 稳定排序
 *    - 时间复杂度稳定在 O(n log n)
 *    - 只需要顺序访问，不需要随机访问
 *    - 合并操作天然适合链表
 *
 * 3. 归并排序的链表实现优势：
 *    - 不需要额外数组（数组实现需要 O(n) 空间）
 *    - 原地修改指针即可
 *    - 合并操作只是改变指针指向
 */

/**
 * 方法二：归并排序（自底向上）- 空间优化版
 *
 * 思路：
 * - 不使用递归，避免递归栈空间
 * - 从最小的子链表（长度1）开始合并
 * - 逐步增加子链表长度（1 -> 2 -> 4 -> 8 ...）
 * - 直到子链表长度 >= 链表总长度
 *
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(1) ✅ 满足进阶要求！
 *
 * 缺点：代码较复杂，不如递归版本直观
 */
/*
function sortList(head: ListNode | null): ListNode | null {
  if (!head || !head.next) return head;
  
  // 计算链表长度
  let length = 0;
  let curr = head;
  while (curr) {
    length++;
    curr = curr.next;
  }
  
  const dummy = new ListNode(0, head);
  
  // 从子链表长度为1开始，每次翻倍
  for (let size = 1; size < length; size *= 2) {
    let prev = dummy;
    let curr = dummy.next;
    
    while (curr) {
      // 获取第一个子链表
      const left = curr;
      const right = split(left, size);
      curr = split(right, size);
      
      // 合并并连接
      prev.next = merge(left, right);
      while (prev.next) {
        prev = prev.next;
      }
    }
  }
  
  return dummy.next;
}

// 分割链表，返回第 n 个节点之后的部分
function split(head: ListNode | null, n: number): ListNode | null {
  for (let i = 1; head && i < n; i++) {
    head = head.next;
  }
  if (!head) return null;
  const next = head.next;
  head.next = null;
  return next;
}
*/

/**
 * 复杂度总结：
 *
 * 方法一（递归归并排序）：
 * ✅ 时间：O(n log n)
 * ❌ 空间：O(log n) - 递归栈
 * ✅ 代码简洁易懂
 *
 * 方法二（迭代归并排序）：
 * ✅ 时间：O(n log n)
 * ✅ 空间：O(1) - 满足进阶要求
 * ❌ 代码较复杂
 *
 * 推荐方法一，因为：
 * - 代码更清晰
 * - O(log n) 的栈空间通常可以接受
 * - 面试中更容易快速实现
 */
// @lc code=end
