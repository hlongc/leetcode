/**
 * LazyMan - 链式调用任务队列实现
 *
 * 该实现通过任务队列和链式调用，实现了一个可以按照特定顺序执行任务的工具。
 * 支持普通任务、延时任务和优先任务等功能。
 */

class LazyManClass {
  constructor(name) {
    this.name = name;
    this.taskQueue = [];
    this.isRunning = false;
    console.log(`Hi I am ${name}`);
    // 使用 queueMicrotask 确保所有同步的链式调用完成后再开始执行任务队列
    queueMicrotask(() => this.run());
  }

  /**
   * 将任务添加到队列
   * @param {Function} task - 返回 Promise 的任务函数
   * @param {boolean} front - 是否插入队列头部（优先执行）
   */
  enqueue(task, front = false) {
    if (front) {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }
    return this;
  }

  /**
   * 执行任务队列
   * 自动处理所有任务的执行，无需每个任务手动调用 runNext
   */
  async run() {
    // 防止重复执行
    if (this.isRunning) return;
    this.isRunning = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      try {
        await task();
      } catch (error) {
        console.error(`Task execution error:`, error);
      }
    }

    this.isRunning = false;
  }

  /**
   * 吃东西
   * @param {string} food - 食物名称
   */
  eat(food) {
    return this.enqueue(async () => {
      console.log(`I am eating ${food}`);
    });
  }

  /**
   * 睡眠（延迟执行）
   * @param {number} seconds - 睡眠秒数
   * @param {boolean} front - 是否优先执行
   */
  sleep(seconds, front = false) {
    return this.enqueue(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            console.log(`等待了${seconds}秒...`);
            resolve();
          }, seconds * 1000);
        }),
      front
    );
  }

  /**
   * 优先睡眠（插入队列头部）
   * @param {number} seconds - 睡眠秒数
   */
  sleepFirst(seconds) {
    return this.sleep(seconds, true);
  }
}

function LazyMan(name) {
  return new LazyManClass(name);
}

// 测试用例
LazyMan("Tony")
  .eat("lunch")
  .eat("dinner")
  .sleepFirst(5)
  .sleep(10)
  .eat("junk food");

// 执行顺序:
// Hi I am Tony
// 等待了5秒...
// I am eating lunch
// I am eating dinner
// 等待了10秒...
// I am eating junk food
