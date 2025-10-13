/*
 * @lc app=leetcode.cn id=381 lang=typescript
 *
 * [381] O(1) 时间插入、删除和获取随机元素 - 允许重复
 *
 * https://leetcode.cn/problems/insert-delete-getrandom-o1-duplicates-allowed/description/
 *
 * algorithms
 * Hard (41.58%)
 * Likes:    291
 * Dislikes: 0
 * Total Accepted:    32K
 * Total Submissions: 76.9K
 * Testcase Example:  '["RandomizedCollection","insert","insert","insert","getRandom","remove","getRandom"]\n' +
  '[[],[1],[1],[2],[],[1],[]]'
 *
 * RandomizedCollection 是一种包含数字集合(可能是重复的)的数据结构。它应该支持插入和删除特定元素，以及删除随机元素。
 * 
 * 实现 RandomizedCollection 类:
 * 
 * 
 * RandomizedCollection()初始化空的 RandomizedCollection 对象。
 * bool insert(int val) 将一个 val 项插入到集合中，即使该项已经存在。如果该项不存在，则返回 true ，否则返回 false
 * 。
 * bool remove(int val) 如果存在，从集合中移除一个 val 项。如果该项存在，则返回 true ，否则返回 false 。注意，如果
 * val 在集合中出现多次，我们只删除其中一个。
 * int getRandom() 从当前的多个元素集合中返回一个随机元素。每个元素被返回的概率与集合中包含的相同值的数量 线性相关 。
 * 
 * 
 * 您必须实现类的函数，使每个函数的 平均 时间复杂度为 O(1) 。
 * 
 * 注意：生成测试用例时，只有在 RandomizedCollection 中 至少有一项 时，才会调用 getRandom 。
 * 
 * 
 * 
 * 示例 1:
 * 
 * 
 * 输入
 * ["RandomizedCollection", "insert", "insert", "insert", "getRandom",
 * "remove", "getRandom"]
 * [[], [1], [1], [2], [], [1], []]
 * 输出
 * [null, true, false, true, 2, true, 1]
 * 
 * 解释
 * RandomizedCollection collection = new RandomizedCollection();// 初始化一个空的集合。
 * collection.insert(1);   // 返回 true，因为集合不包含 1。
 * ⁠                       // 将 1 插入到集合中。
 * collection.insert(1);   // 返回 false，因为集合包含 1。
 * // 将另一个 1 插入到集合中。集合现在包含 [1,1]。
 * collection.insert(2);   // 返回 true，因为集合不包含 2。
 * // 将 2 插入到集合中。集合现在包含 [1,1,2]。
 * collection.getRandom(); // getRandom 应当:
 * // 有 2/3 的概率返回 1,
 * // 1/3 的概率返回 2。
 * collection.remove(1);   // 返回 true，因为集合包含 1。
 * // 从集合中移除 1。集合现在包含 [1,2]。
 * collection.getRandom(); // getRandom 应该返回 1 或 2，两者的可能性相同。
 * 
 * 
 * 
 * 提示:
 * 
 * 
 * -2^31 <= val <= 2^31 - 1
 * insert, remove 和 getRandom 最多 总共 被调用 2 * 10^5 次
 * 当调用 getRandom 时，数据结构中 至少有一个 元素
 * 
 * 
 */

// @lc code=start
class RandomizedCollection {
  // 使用数组存储所有元素，支持O(1)的随机访问
  private nums: number[] = [];

  // 使用哈希表存储每个元素值对应的所有索引位置
  // key: 元素值, value: Set<number> 包含该元素在数组中的所有索引
  private valToIndices: Map<number, Set<number>> = new Map();

  constructor() {
    // 初始化空的数据结构
  }

  /**
   * 插入元素（允许重复）
   * @param val 要插入的元素值
   * @returns 如果元素不存在返回true，如果元素已存在返回false
   * 时间复杂度: O(1)
   */
  insert(val: number): boolean {
    // 检查元素是否已存在
    const isNewElement = !this.valToIndices.has(val);

    // 将元素添加到数组末尾
    this.nums.push(val);
    const newIndex = this.nums.length - 1;

    // 更新哈希表：将新索引添加到该元素的索引集合中
    if (isNewElement) {
      // 如果元素不存在，创建新的索引集合
      this.valToIndices.set(val, new Set([newIndex]));
    } else {
      // 如果元素已存在，将新索引添加到现有集合中
      this.valToIndices.get(val)!.add(newIndex);
    }

    return isNewElement;
  }

  /**
   * 删除元素（只删除一个实例）
   * @param val 要删除的元素值
   * @returns 如果元素存在且成功删除返回true，否则返回false
   * 时间复杂度: O(1)
   */
  remove(val: number): boolean {
    // 如果元素不存在，直接返回false
    if (!this.valToIndices.has(val) || this.valToIndices.get(val)!.size === 0) {
      return false;
    }

    // 获取该元素的一个索引（任意一个都可以）
    const indices = this.valToIndices.get(val)!;
    const indexToRemove = indices.values().next().value as number; // 获取集合中的第一个索引

    // 获取数组最后一个元素的值和索引
    const lastIndex = this.nums.length - 1;
    const lastVal = this.nums[lastIndex];

    // 先从目标元素的索引集合中删除该索引（避免后续交换时出现重复）
    indices.delete(indexToRemove);

    // 如果删除的不是最后一个元素，需要交换
    if (indexToRemove !== lastIndex) {
      // 将最后一个元素移动到要删除的位置
      this.nums[indexToRemove] = lastVal;

      // 更新最后一个元素的索引映射
      const lastValIndices = this.valToIndices.get(lastVal)!;
      lastValIndices.delete(lastIndex); // 删除旧的索引
      lastValIndices.add(indexToRemove); // 添加新的索引
    }

    // 删除数组最后一个元素
    this.nums.pop();

    // 如果该元素的所有实例都被删除了，删除整个键值对
    if (indices.size === 0) {
      this.valToIndices.delete(val);
    }

    return true;
  }

  /**
   * 获取随机元素
   * @returns 随机返回集合中的一个元素
   * 时间复杂度: O(1)
   * 注意：每个元素被选中的概率与其在集合中的出现次数成正比
   */
  getRandom(): number {
    // 生成0到数组长度-1之间的随机索引
    const randomIndex = Math.floor(Math.random() * this.nums.length);

    // 返回随机索引位置的元素
    return this.nums[randomIndex];
  }
}

/**
 * Your RandomizedCollection object will be instantiated and called as such:
 * var obj = new RandomizedCollection()
 * var param_1 = obj.insert(val)
 * var param_2 = obj.remove(val)
 * var param_3 = obj.getRandom()
 */
// @lc code=end
