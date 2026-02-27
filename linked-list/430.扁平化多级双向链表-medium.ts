/*
 * @lc app=leetcode.cn id=430 lang=typescript
 *
 * [430] 扁平化多级双向链表
 *
 * https://leetcode.cn/problems/flatten-a-multilevel-doubly-linked-list/description/
 *
 * algorithms
 * Medium (59.92%)
 * Likes:    453
 * Dislikes: 0
 * Total Accepted:    73.8K
 * Total Submissions: 123.2K
 * Testcase Example:  '[1,2,3,4,5,6,null,null,null,7,8,9,10,null,null,11,12]'
 *
 * 你会得到一个双链表，其中包含的节点有一个下一个指针、一个前一个指针和一个额外的 子指针
 * 。这个子指针可能指向一个单独的双向链表，也包含这些特殊的节点。这些子列表可以有一个或多个自己的子列表，以此类推，以生成如下面的示例所示的 多层数据结构
 * 。
 *
 * 给定链表的头节点 head ，将链表 扁平化 ，以便所有节点都出现在单层双链表中。让 curr
 * 是一个带有子列表的节点。子列表中的节点应该出现在扁平化列表中的 curr 之后 和 curr.next 之前 。
 *
 * 返回 扁平列表的 head 。列表中的节点必须将其 所有 子指针设置为 null 。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 *
 * 输入：head = [1,2,3,4,5,6,null,null,null,7,8,9,10,null,null,11,12]
 * 输出：[1,2,3,7,8,11,12,9,10,4,5,6]
 * 解释：输入的多级列表如上图所示。
 * 扁平化后的链表如下图：
 *
 *
 *
 * 示例 2：
 *
 *
 *
 *
 * 输入：head = [1,2,null,3]
 * 输出：[1,3,2]
 * 解释：输入的多级列表如上图所示。
 * 扁平化后的链表如下图：
 *
 *
 *
 * 示例 3：
 *
 *
 * 输入：head = []
 * 输出：[]
 * 说明：输入中可能存在空列表。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 节点数目不超过 1000
 * 1 <= Node.val <= 10^5
 *
 *
 *
 *
 * 如何表示测试用例中的多级链表？
 *
 * 以 示例 1 为例：
 *
 *
 * ⁠1---2---3---4---5---6--NULL
 * ⁠        |
 * ⁠        7---8---9---10--NULL
 * ⁠            |
 * ⁠            11--12--NULL
 *
 * 序列化其中的每一级之后：
 *
 *
 * [1,2,3,4,5,6,null]
 * [7,8,9,10,null]
 * [11,12,null]
 *
 *
 * 为了将每一级都序列化到一起，我们需要每一级中添加值为 null 的元素，以表示没有节点连接到上一级的上级节点。
 *
 *
 * [1,2,3,4,5,6,null]
 * [null,null,7,8,9,10,null]
 * [null,11,12,null]
 *
 *
 * 合并所有序列化结果，并去除末尾的 null 。
 *
 *
 * [1,2,3,4,5,6,null,null,null,7,8,9,10,null,null,11,12]
 *
 *
 *
 *
 *
 */

// @lc code=start
/**
 * Definition for _Node.
 * class _Node {
 *     val: number
 *     prev: _Node | null
 *     next: _Node | null
 *     child: _Node | null
 *
 *     constructor(val?: number, prev? : _Node, next? : _Node, child? : _Node) {
 *         this.val = (val===undefined ? 0 : val);
 *         this.prev = (prev===undefined ? null : prev);
 *         this.next = (next===undefined ? null : next);
 *         this.child = (child===undefined ? null : child);
 *     }
 * }
 */

/**
 * 解题思路：迭代法（深度优先）
 *
 * 核心思想：
 * 遍历链表，遇到有 child 的节点时：
 * 1. 将 child 子链表插入到当前节点和 next 节点之间
 * 2. 递归处理子链表（子链表也可能有 child）
 * 3. 将 child 指针置为 null
 *
 * 算法流程：
 * 1. 从头节点开始遍历
 * 2. 如果当前节点有 child：
 *    a. 保存 next 节点
 *    b. 将 child 链表插入当前节点后
 *    c. 找到 child 链表的尾节点
 *    d. 将尾节点连接到原来的 next
 *    e. 清空 child 指针
 * 3. 继续遍历下一个节点
 *
 * 示例：
 * 1---2---3---4
 *         |
 *         7---8
 *
 * 处理节点3时：
 * 1. 保存 next=4
 * 2. 3.next = 7, 7.prev = 3
 * 3. 找到8（child链表尾）
 * 4. 8.next = 4, 4.prev = 8
 * 5. 3.child = null
 * 结果：1---2---3---7---8---4
 *
 * 时间复杂度：O(n)，每个节点访问一次
 * 空间复杂度：O(1)，只使用常数空间
 */
function flatten(head: _Node | null): _Node | null {
  if (!head) return null;

  // 从头节点开始遍历
  let curr: _Node | null = head;

  while (curr) {
    // 如果当前节点有子链表
    if (curr.child) {
      // 步骤1：保存原来的 next 节点
      const nextNode = curr.next;

      // 步骤2：将 child 链表连接到当前节点后
      const childNode: _Node = curr.child;
      curr.next = childNode;
      childNode.prev = curr;

      // 步骤3：找到 child 链表的尾节点
      let tail = childNode;
      while (tail.next) {
        tail = tail.next;
      }

      // 步骤4：将 child 链表的尾节点连接到原来的 next
      if (nextNode) {
        tail.next = nextNode;
        nextNode.prev = tail;
      }

      // 步骤5：清空 child 指针（题目要求）
      curr.child = null;
    }

    // 继续处理下一个节点
    curr = curr.next;
  }

  return head;
}

/**
 * 方法二：递归法（备选方案）
 *
 * 思路：
 * 1. 递归处理当前层的每个节点
 * 2. 如果节点有 child，递归扁平化 child
 * 3. 将扁平化后的 child 插入当前节点和 next 之间
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(d)，d 是链表的深度（递归栈）
 */
/*
function flatten(head: _Node | null): _Node | null {
  if (!head) return null;
  
  // 辅助函数：扁平化并返回尾节点
  const flattenAndGetTail = (node: _Node | null): _Node | null => {
    if (!node) return null;
    
    let curr: _Node | null = node;
    let tail: _Node | null = node;
    
    while (curr) {
      const next = curr.next;
      
      // 如果有 child，递归处理
      if (curr.child) {
        const childTail = flattenAndGetTail(curr.child);
        
        // 插入 child 链表
        curr.next = curr.child;
        curr.child.prev = curr;
        
        // 连接 child 尾部和原 next
        if (next) {
          childTail!.next = next;
          next.prev = childTail;
        }
        
        // 清空 child
        curr.child = null;
        
        // 更新 tail
        tail = childTail!;
      } else {
        tail = curr;
      }
      
      curr = next;
    }
    
    return tail;
  };
  
  flattenAndGetTail(head);
  return head;
}
*/

/**
 * 算法图解：
 *
 * 原始结构：
 * 1---2---3---4---5---6
 *         |
 *         7---8---9---10
 *             |
 *             11--12
 *
 * 处理过程：
 *
 * 1. 遍历到节点3，发现有 child (7)
 *    1---2---3---7---8---9---10---4---5---6
 *                    |
 *                    11--12
 *
 * 2. 继续遍历到节点8，发现有 child (11)
 *    1---2---3---7---8---11--12---9---10---4---5---6
 *
 * 3. 继续遍历，没有更多 child
 *
 * 最终结果：
 * 1---2---3---7---8---11--12---9---10---4---5---6
 *
 * 关键点：
 * 1. 双向链表需要同时维护 prev 和 next
 * 2. 插入 child 时要保存原 next，避免丢失
 * 3. 必须找到 child 链表的尾节点才能连接原 next
 * 4. 处理完后要清空 child 指针
 */
// @lc code=end
