/*
 * @lc app=leetcode.cn id=146 lang=typescript
 *
 * [146] LRU 缓存
 *
 * https://leetcode.cn/problems/lru-cache/description/
 *
 * algorithms
 * Medium (55.03%)
 * Likes:    3641
 * Dislikes: 0
 * Total Accepted:    974.4K
 * Total Submissions: 1.8M
 * Testcase Example:  '["LRUCache","put","put","get","put","get","put","get","get","get"]\n' +
  '[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]'
 *
 * 请你设计并实现一个满足  LRU (最近最少使用) 缓存 约束的数据结构。
 * 
 * 实现 LRUCache 类：
 * 
 * 
 * 
 * 
 * LRUCache(int capacity) 以 正整数 作为容量 capacity 初始化 LRU 缓存
 * int get(int key) 如果关键字 key 存在于缓存中，则返回关键字的值，否则返回 -1 。
 * void put(int key, int value) 如果关键字 key 已经存在，则变更其数据值 value ；如果不存在，则向缓存中插入该组
 * key-value 。如果插入操作导致关键字数量超过 capacity ，则应该 逐出 最久未使用的关键字。
 * 
 * 
 * 函数 get 和 put 必须以 O(1) 的平均时间复杂度运行。
 * 
 * 
 * 
 * 
 * 
 * 示例：
 * 
 * 
 * 输入
 * ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
 * [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
 * 输出
 * [null, null, null, 1, null, -1, null, -1, 3, 4]
 * 
 * 解释
 * LRUCache lRUCache = new LRUCache(2);
 * lRUCache.put(1, 1); // 缓存是 {1=1}
 * lRUCache.put(2, 2); // 缓存是 {1=1, 2=2}
 * lRUCache.get(1);    // 返回 1
 * lRUCache.put(3, 3); // 该操作会使得关键字 2 作废，缓存是 {1=1, 3=3}
 * lRUCache.get(2);    // 返回 -1 (未找到)
 * lRUCache.put(4, 4); // 该操作会使得关键字 1 作废，缓存是 {4=4, 3=3}
 * lRUCache.get(1);    // 返回 -1 (未找到)
 * lRUCache.get(3);    // 返回 3
 * lRUCache.get(4);    // 返回 4
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 1 <= capacity <= 3000
 * 0 <= key <= 10000
 * 0 <= value <= 10^5
 * 最多调用 2 * 10^5 次 get 和 put
 * 
 * 
 */

// @lc code=start
/**
 * LRU（Least Recently Used）缓存实现
 *
 * 设计思路：
 * 1. 使用双向链表存储键值对，并跟踪访问顺序
 * 2. 使用Map存储键到链表节点的映射，实现O(1)时间的访问
 * 3. 最近使用的项放在链表头部，最久未使用的项在链表尾部
 * 4. 当缓存满时，删除链表尾部的节点（最久未使用的）
 *
 * 时间复杂度：get和put操作均为O(1)
 * 空间复杂度：O(capacity)，用于存储缓存内容
 */

// 定义双向链表节点
class DLinkedNode {
  key: number;
  value: number;
  prev: DLinkedNode | null;
  next: DLinkedNode | null;

  constructor(key: number = 0, value: number = 0) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  private capacity: number; // 缓存容量
  private cache: Map<number, DLinkedNode>; // 哈希表：键 -> 节点
  private size: number; // 当前缓存大小
  private head: DLinkedNode; // 虚拟头节点
  private tail: DLinkedNode; // 虚拟尾节点

  /**
   * 初始化LRU缓存
   * @param capacity 缓存容量
   */
  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<number, DLinkedNode>();
    this.size = 0;

    // 使用虚拟头尾节点简化边界条件处理
    this.head = new DLinkedNode(); // 虚拟头节点
    this.tail = new DLinkedNode(); // 虚拟尾节点

    // 初始化链表：head <-> tail
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 从缓存中获取值
   * @param key 要查找的键
   * @return 键对应的值，如果键不存在则返回-1
   */
  get(key: number): number {
    // 1. 检查键是否存在
    const node = this.cache.get(key);
    if (!node) {
      return -1; // 键不存在，返回-1
    }

    // 2. 键存在，将节点移到链表头部（表示最近使用）
    this.moveToHead(node);

    // 3. 返回节点的值
    return node.value;
  }

  /**
   * 向缓存中插入或更新键值对
   * @param key 键
   * @param value 值
   */
  put(key: number, value: number): void {
    // 1. 检查键是否已存在
    const node = this.cache.get(key);

    if (!node) {
      // 2A. 键不存在，创建新节点
      const newNode = new DLinkedNode(key, value);

      // 将新节点添加到哈希表
      this.cache.set(key, newNode);

      // 将新节点添加到链表头部
      this.addToHead(newNode);

      // 增加缓存大小
      this.size++;

      // 如果缓存超出容量，删除最久未使用的节点（链表尾部）
      if (this.size > this.capacity) {
        // 删除链表尾部节点
        const removed = this.removeTail();
        // 从哈希表中删除对应的键
        this.cache.delete(removed.key);
        // 减少缓存大小
        this.size--;
      }
    } else {
      // 2B. 键已存在，更新值并移到链表头部
      node.value = value;
      this.moveToHead(node);
    }
  }

  /**
   * 将节点添加到链表头部
   * @param node 要添加的节点
   */
  private addToHead(node: DLinkedNode): void {
    // 链接顺序：head <-> node <-> head.next
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  /**
   * 从链表中删除节点
   * @param node 要删除的节点
   */
  private removeNode(node: DLinkedNode): void {
    // 链接顺序：node.prev <-> node.next
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  /**
   * 将节点移动到链表头部（表示最近使用）
   * @param node 要移动的节点
   */
  private moveToHead(node: DLinkedNode): void {
    // 1. 从当前位置删除节点
    this.removeNode(node);
    // 2. 将节点添加到链表头部
    this.addToHead(node);
  }

  /**
   * 删除并返回链表尾部节点（最久未使用的节点）
   * @returns 被删除的尾部节点
   */
  private removeTail(): DLinkedNode {
    // 获取真实的尾部节点（虚拟尾节点的前一个）
    const node = this.tail.prev!;
    // 从链表中删除该节点
    this.removeNode(node);
    // 返回被删除的节点
    return node;
  }
}

/**
 * Your LRUCache object will be instantiated and called as such:
 * var obj = new LRUCache(capacity)
 * var param_1 = obj.get(key)
 * obj.put(key,value)
 */
// @lc code=end
