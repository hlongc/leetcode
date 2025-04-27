/**
 * LazyMan - 链式调用任务队列实现
 *
 * 该实现通过任务队列和链式调用，实现了一个可以按照特定顺序执行任务的工具。
 * 支持普通任务、延时任务和优先任务等功能。
 */

// 使用不同名称避免与工厂函数命名冲突
class LazyManClass {
  /**
   * 构造函数
   * @param {string} name - 懒人的名字
   */
  constructor(name) {
    this.name = name;
    this.taskQueue = []; // 任务队列，存储所有待执行的任务

    // 打印初始信息
    console.log(`Hi I am ${name}`);

    // 使用微任务确保所有任务都已添加到队列后再开始执行
    // 这让链式调用中的所有任务（包括sleepFirst）都能正确排序
    queueMicrotask(() => {
      this.runNext();
    });
  }

  /**
   * 执行队列中的下一个任务
   * @private
   */
  runNext() {
    if (this.taskQueue.length > 0) {
      // 取出队列中的第一个任务并执行
      const task = this.taskQueue.shift();
      task();
    }
  }

  /**
   * 添加普通任务到队列
   * @private
   * @param {Function} task - 要添加的任务函数
   * @returns {LazyManClass} - 返回this以支持链式调用
   */
  addTask(task) {
    this.taskQueue.push(task);
    return this;
  }

  /**
   * 添加优先执行的任务（插入到队列最前面）
   * @private
   * @param {Function} task - 要添加的优先任务函数
   * @returns {LazyManClass} - 返回this以支持链式调用
   */
  addFirstTask(task) {
    this.taskQueue.unshift(task);
    return this;
  }

  /**
   * 睡眠指定时间后再执行下一个任务
   * @param {number} duration - 睡眠时间(秒)
   * @returns {LazyManClass} - 返回this以支持链式调用
   */
  sleep(duration) {
    return this.addTask(() => {
      setTimeout(() => {
        console.log(`等待了${duration}秒`);
        this.runNext(); // 睡眠结束后执行下一个任务
      }, duration * 1000);
    });
  }

  /**
   * 优先睡眠指定时间再执行任务队列
   * @param {number} duration - 睡眠时间(秒)
   * @returns {LazyManClass} - 返回this以支持链式调用
   */
  sleepFirst(duration) {
    return this.addFirstTask(() => {
      setTimeout(() => {
        console.log(`等待了${duration}秒`);
        this.runNext(); // 睡眠结束后执行下一个任务
      }, duration * 1000);
    });
  }

  /**
   * 吃东西的任务
   * @param {string} food - 食物名称
   * @returns {LazyManClass} - 返回this以支持链式调用
   */
  eat(food) {
    return this.addTask(() => {
      console.log(`I am eating ${food}`);
      this.runNext(); // 立即执行下一个任务
    });
  }
}

/**
 * 工厂函数，创建并返回LazyManClass实例
 * 这里使用工厂模式避免直接使用new关键字，使API更简洁
 * 注意：函数名与类名不同，避免命名冲突导致的递归调用问题
 *
 * @param {string} name - 懒人的名字
 * @returns {LazyManClass} - LazyManClass实例
 */
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
