/*
 * @lc app=leetcode.cn id=232 lang=typescript
 *
 * [232] 用栈实现队列
 */

// @lc code=start
class MyQueue {
  // 使用两个栈来实现队列
  private stackIn: number[]; // 用于入队操作的栈
  private stackOut: number[]; // 用于出队操作的栈

  constructor() {
    this.stackIn = [];
    this.stackOut = [];
  }

  /**
   * 将元素添加到队列尾部
   * @param x 要添加的元素
   */
  push(x: number): void {
    // 直接将元素压入入队栈
    this.stackIn.push(x);
  }

  /**
   * 移除并返回队列头部的元素
   * @returns 队列头部的元素
   */
  pop(): number {
    // 如果出队栈为空，则将入队栈的所有元素倒入出队栈
    if (this.stackOut.length === 0) {
      this.transferElements();
    }

    // 从出队栈弹出元素（即队列的头部元素）
    return this.stackOut.pop()!;
  }

  /**
   * 返回队列头部的元素但不移除
   * @returns 队列头部的元素
   */
  peek(): number {
    // 如果出队栈为空，则将入队栈的所有元素倒入出队栈
    if (this.stackOut.length === 0) {
      this.transferElements();
    }

    // 返回出队栈的栈顶元素（即队列的头部元素）
    return this.stackOut[this.stackOut.length - 1];
  }

  /**
   * 检查队列是否为空
   * @returns 队列为空返回true，否则返回false
   */
  empty(): boolean {
    // 只有当两个栈都为空时，队列才为空
    return this.stackIn.length === 0 && this.stackOut.length === 0;
  }

  /**
   * 辅助方法：将入队栈的所有元素转移到出队栈
   * 由于栈的特性，这个过程会将元素的顺序反转，正好符合队列的需求
   * @private 私有方法，仅在类内部使用
   */
  private transferElements(): void {
    // 将入队栈的所有元素依次弹出并压入出队栈
    while (this.stackIn.length > 0) {
      this.stackOut.push(this.stackIn.pop()!);
    }
  }
}

/**
 * Your MyQueue object will be instantiated and called as such:
 * var obj = new MyQueue()
 * obj.push(x)
 * var param_2 = obj.pop()
 * var param_3 = obj.peek()
 * var param_4 = obj.empty()
 */
// @lc code=end
