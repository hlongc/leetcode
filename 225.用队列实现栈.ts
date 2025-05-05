/*
 * @lc app=leetcode.cn id=225 lang=typescript
 *
 * [225] 用队列实现栈
 */

// @lc code=start
class MyStack {
  private queue: number[];
  constructor() {
    this.queue = [];
  }

  push(x: number): void {
    this.queue.push(x);
  }

  pop(): number {
    let size = this.queue.length;
    for (let i = 0; i < size - 1; i++) {
      this.queue.push(this.queue.shift()!);
    }

    return this.queue.shift()!;
  }

  top(): number {
    const el = this.pop();
    this.push(el);
    return el;
  }

  empty(): boolean {
    return this.queue.length === 0;
  }
}

/**
 * Your MyStack object will be instantiated and called as such:
 * var obj = new MyStack()
 * obj.push(x)
 * var param_2 = obj.pop()
 * var param_3 = obj.top()
 * var param_4 = obj.empty()
 */
// @lc code=end
