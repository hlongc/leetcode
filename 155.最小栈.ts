/*
 * @lc app=leetcode.cn id=155 lang=typescript
 *
 * [155] 最小栈
 */

// @lc code=start
/**
 * 最小栈实现
 *
 * 设计思路：使用两个栈
 * 1. 主栈(stack)：存储所有元素，支持常规的栈操作
 * 2. 最小值栈(minStack)：存储当前状态下的最小值
 *
 * 这种方式比原来使用链表和Map的方式更简单、更直观
 */
class MinStack {
  private stack: number[]; // 主栈，存储所有元素
  private minStack: number[]; // 最小值栈，栈顶始终是当前所有元素中的最小值

  constructor() {
    this.stack = [];
    this.minStack = [];
  }

  /**
   * 向栈中推入元素
   * @param val 要推入的值
   *
   * 同时更新最小值栈：
   * - 如果最小值栈为空，或新元素小于等于当前最小值，将新元素也推入最小值栈
   * - "小于等于"很关键，处理重复的最小值
   */
  push(val: number): void {
    this.stack.push(val);

    // 如果最小栈为空或当前值小于等于最小栈顶部的值，则将当前值推入最小栈
    // 注意：这里用"小于等于"而不是"小于"，确保在有重复最小值时也能正确处理
    if (
      this.minStack.length === 0 ||
      val <= this.minStack[this.minStack.length - 1]
    ) {
      this.minStack.push(val);
    }
  }

  /**
   * 从栈中弹出顶部元素
   *
   * 同时检查是否需要更新最小值栈：
   * - 如果弹出的元素等于当前最小值，最小值栈也要弹出
   */
  pop(): void {
    // 先获取要弹出的值
    const val = this.stack.pop();

    // 如果弹出的值等于当前最小值，最小值栈也要弹出顶部元素
    if (val === this.minStack[this.minStack.length - 1]) {
      this.minStack.pop();
    }
  }

  /**
   * 获取栈顶元素
   * @returns 栈顶的值
   */
  top(): number {
    return this.stack[this.stack.length - 1];
  }

  /**
   * 获取栈中的最小值
   * @returns 当前栈中的最小值
   *
   * 直接返回最小值栈的栈顶，时间复杂度O(1)
   */
  getMin(): number {
    return this.minStack[this.minStack.length - 1];
  }
}

/**
 * 解题思路说明：
 *
 * 1. 为什么使用两个栈？
 *    - 主栈负责常规的入栈出栈操作
 *    - 最小值栈同步保存每个状态下的最小值
 *
 * 2. 重复元素的处理：
 *    - 当有多个相同的最小值时，最小值栈也会存储多次
 *    - 这样确保在弹出操作后，总能获取到正确的当前最小值
 *
 * 3. 时间复杂度：
 *    - 所有操作均为O(1)时间复杂度
 *
 * 4. 空间复杂度：
 *    - O(n)，最坏情况下最小值栈与主栈大小相同
 */

/**
 * Your MinStack object will be instantiated and called as such:
 * var obj = new MinStack()
 * obj.push(val)
 * obj.pop()
 * var param_3 = obj.top()
 * var param_4 = obj.getMin()
 */
// @lc code=end
