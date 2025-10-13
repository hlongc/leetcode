/*
 * @lc app=leetcode.cn id=380 lang=typescript
 *
 * [380] O(1) 时间插入、删除和获取随机元素
 *
 * https://leetcode.cn/problems/insert-delete-getrandom-o1/description/
 *
 * algorithms
 * Medium (52.73%)
 * Likes:    973
 * Dislikes: 0
 * Total Accepted:    247.5K
 * Total Submissions: 469.3K
 * Testcase Example:  '["RandomizedSet","insert","remove","insert","getRandom","remove","insert","getRandom"]\n' +
  '[[],[1],[2],[2],[],[1],[2],[]]'
 *
 * 实现RandomizedSet 类：
 * 
 * 
 * 
 * 
 * RandomizedSet() 初始化 RandomizedSet 对象
 * bool insert(int val) 当元素 val 不存在时，向集合中插入该项，并返回 true ；否则，返回 false 。
 * bool remove(int val) 当元素 val 存在时，从集合中移除该项，并返回 true ；否则，返回 false 。
 * int getRandom() 随机返回现有集合中的一项（测试用例保证调用此方法时集合中至少存在一个元素）。每个元素应该有 相同的概率 被返回。
 * 
 * 
 * 你必须实现类的所有函数，并满足每个函数的 平均 时间复杂度为 O(1) 。
 * 
 * 
 * 
 * 示例：
 * 
 * 
 * 输入
 * ["RandomizedSet", "insert", "remove", "insert", "getRandom", "remove",
 * "insert", "getRandom"]
 * [[], [1], [2], [2], [], [1], [2], []]
 * 输出
 * [null, true, false, true, 2, true, false, 2]
 * 
 * 解释
 * RandomizedSet randomizedSet = new RandomizedSet();
 * randomizedSet.insert(1); // 向集合中插入 1 。返回 true 表示 1 被成功地插入。
 * randomizedSet.remove(2); // 返回 false ，表示集合中不存在 2 。
 * randomizedSet.insert(2); // 向集合中插入 2 。返回 true 。集合现在包含 [1,2] 。
 * randomizedSet.getRandom(); // getRandom 应随机返回 1 或 2 。
 * randomizedSet.remove(1); // 从集合中移除 1 ，返回 true 。集合现在包含 [2] 。
 * randomizedSet.insert(2); // 2 已在集合中，所以返回 false 。
 * randomizedSet.getRandom(); // 由于 2 是集合中唯一的数字，getRandom 总是返回 2 。
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * -2^31 <= val <= 2^31 - 1
 * 最多调用 insert、remove 和 getRandom 函数 2 * 10^5 次
 * 在调用 getRandom 方法时，数据结构中 至少存在一个 元素。
 * 
 * 
 * 
 * 
 */

// @lc code=start
class RandomizedSet {
  // 使用数组存储所有元素，支持O(1)的随机访问
  private nums: number[] = [];

  // 使用哈希表存储元素值到数组索引的映射，支持O(1)的查找和删除
  private valToIndex: Map<number, number> = new Map();

  constructor() {
    // 初始化空的数据结构
  }

  /**
   * 插入元素
   * @param val 要插入的元素值
   * @returns 如果元素不存在且成功插入返回true，否则返回false
   * 时间复杂度: O(1)
   */
  insert(val: number): boolean {
    // 如果元素已存在，直接返回false
    if (this.valToIndex.has(val)) {
      return false;
    }

    // 将元素添加到数组末尾
    this.nums.push(val);

    // 记录元素在数组中的索引位置
    this.valToIndex.set(val, this.nums.length - 1);

    return true;
  }

  /**
   * 删除元素
   * @param val 要删除的元素值
   * @returns 如果元素存在且成功删除返回true，否则返回false
   * 时间复杂度: O(1)
   */
  remove(val: number): boolean {
    // 如果元素不存在，直接返回false
    if (!this.valToIndex.has(val)) {
      return false;
    }

    // 获取要删除元素在数组中的索引
    const indexToRemove = this.valToIndex.get(val)!;

    // 获取数组最后一个元素的值和索引
    const lastIndex = this.nums.length - 1;
    const lastVal = this.nums[lastIndex];

    // 将最后一个元素移动到要删除的位置
    // 这样可以避免数组中间删除导致的O(n)时间复杂度
    this.nums[indexToRemove] = lastVal;
    this.valToIndex.set(lastVal, indexToRemove);

    // 删除数组最后一个元素
    this.nums.pop();

    // 从哈希表中删除目标元素
    this.valToIndex.delete(val);

    return true;
  }

  /**
   * 获取随机元素
   * @returns 随机返回集合中的一个元素
   * 时间复杂度: O(1)
   */
  getRandom(): number {
    // 生成0到数组长度-1之间的随机索引
    const randomIndex = Math.floor(Math.random() * this.nums.length);

    // 返回随机索引位置的元素
    return this.nums[randomIndex];
  }
}

/**
 * Your RandomizedSet object will be instantiated and called as such:
 * var obj = new RandomizedSet()
 * var param_1 = obj.insert(val)
 * var param_2 = obj.remove(val)
 * var param_3 = obj.getRandom()
 */
// @lc code=end
