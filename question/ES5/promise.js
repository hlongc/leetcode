/**
 * Promise 状态常量
 * Promise 有且只有三种状态，状态一旦改变就不可逆
 */
const PENDING = "PENDING"; // 等待态（初始状态）
const FULFILLED = "FULFILLED"; // 成功态
const REJECTED = "REJECTED"; // 失败态

/**
 * nextTick - 统一的异步执行函数（生产级实现）
 *
 * 按优先级选择最佳的异步执行方式：
 * 1. queueMicrotask - ES2019 标准微任务 API（最佳选择）
 * 2. MutationObserver - 浏览器环境的微任务（兼容性好）
 * 3. setImmediate - Node.js 环境的宏任务（仅 Node.js）
 * 4. setTimeout - 最终降级方案（所有环境都支持）
 *
 * 微任务 vs 宏任务：
 * - 微任务在当前事件循环结束后立即执行（优先级高）
 * - 宏任务在下一个事件循环执行（优先级低）
 * - Promise 规范要求使用微任务
 */
const nextTick = (() => {
  // 优先级1: queueMicrotask (ES2019+)
  // 最佳选择，标准的微任务 API
  // 兼容性: Node.js 11+, Chrome 71+, Firefox 69+, Safari 12.1+
  if (typeof queueMicrotask === "function") {
    return queueMicrotask;
  }

  // 优先级2: MutationObserver（浏览器环境）
  // 通过 DOM 变化触发微任务
  // 兼容性: IE11+, 所有现代浏览器
  if (
    typeof MutationObserver !== "undefined" &&
    typeof document !== "undefined"
  ) {
    const callbacks = [];
    let pending = false;

    const observer = new MutationObserver(() => {
      pending = false;
      const copies = callbacks.slice();
      callbacks.length = 0;
      copies.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          // 避免一个回调的错误影响其他回调
          setTimeout(() => {
            throw error;
          }, 0);
        }
      });
    });

    const textNode = document.createTextNode("0");
    observer.observe(textNode, { characterData: true });
    let counter = 0;

    return (callback) => {
      callbacks.push(callback);
      if (!pending) {
        pending = true;
        textNode.data = String(++counter % 2);
      }
    };
  }

  // 优先级3: setImmediate (Node.js)
  // 宏任务，但比 setTimeout 更高效
  // 只在 Node.js 和 IE10+ 中可用
  if (typeof setImmediate === "function") {
    return setImmediate;
  }

  // 优先级4: setTimeout（最终降级方案）
  // 宏任务，兼容性最好
  // 所有环境都支持
  return (callback) => setTimeout(callback, 0);
})();

/**
 * Promise 解析过程（Promise Resolution Procedure）
 * 这是 Promise A+ 规范的核心部分，用于处理 then 方法返回值
 *
 * @param {Promise} promise2 - then 方法返回的新 Promise
 * @param {*} x - then 方法中 onFulfilled 或 onRejected 的返回值
 * @param {Function} resolve - promise2 的 resolve 方法
 * @param {Function} reject - promise2 的 reject 方法
 *
 * 规范要求：
 * 1. 如果 promise2 和 x 指向同一对象，抛出 TypeError（防止循环引用）
 * 2. 如果 x 是 Promise 实例，采用其状态
 * 3. 如果 x 是对象或函数，尝试获取其 then 方法
 * 4. 如果 x 是普通值，直接 resolve
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 2.3.1 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
  // 这是为了避免循环引用导致的死循环
  if (promise2 === x) {
    return reject(
      new TypeError("Chaining cycle detected for promise #<Promise>")
    );
  }

  // 2.3.3 如果 x 为对象或函数
  if ((typeof x === "object" && x !== null) || typeof x === "function") {
    // 2.3.3.3 如果 then 是函数，将 x 作为函数的作用域 this 调用之
    // called 用于确保 resolve 或 reject 只能调用一次（Promise 状态只能改变一次）
    let called = false;

    try {
      // 2.3.3.1 把 x.then 赋值给 then
      // 这里需要先存储 then，因为获取属性可能会抛出异常
      const then = x.then;

      // 2.3.3.3 如果 then 是函数，说明 x 是 thenable 对象（类 Promise 对象）
      if (typeof then === "function") {
        // 使用 call 调用 then 方法，传入成功和失败的回调
        then.call(
          x,
          // 2.3.3.3.1 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
          (y) => {
            if (called) return;
            called = true;
            // 递归解析，因为 y 可能仍然是 Promise 或 thenable 对象
            resolvePromise(promise2, y, resolve, reject);
          },
          // 2.3.3.3.2 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        // 2.3.3.4 如果 then 不是函数，以 x 为参数执行 promise
        resolve(x);
      }
    } catch (e) {
      // 2.3.3.2 如果取 x.then 的值时抛出错误 e，则以 e 为据因拒绝 promise
      // 2.3.3.3.4 如果调用 then 方法抛出了异常 e
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    // 2.3.4 如果 x 不为对象或者函数，以 x 为参数执行 promise
    resolve(x);
  }
}

/**
 * Promise 类
 * 符合 Promise/A+ 规范的 Promise 实现
 */
class Promise {
  /**
   * 构造函数
   * @param {Function} executor - 执行器函数，接收 resolve 和 reject 两个参数
   *
   * executor 函数会立即执行，用于初始化 Promise 的状态
   */
  constructor(executor) {
    // Promise 的当前状态
    this.status = PENDING;

    // Promise 成功的值
    this.value = undefined;

    // Promise 失败的原因
    this.reason = undefined;

    // 成功态回调函数队列（用于处理异步情况）
    this.onResolveCallbacks = [];

    // 失败态回调函数队列（用于处理异步情况）
    this.onRejectCallbacks = [];

    /**
     * resolve 函数 - 将 Promise 状态从 pending 变为 fulfilled
     * @param {*} value - 成功的值
     */
    const resolve = (value) => {
      // 如果 resolve 的值是一个 Promise，需要等待这个 Promise 执行完
      // 这确保了 Promise 的状态只能由最终的值决定
      if (value instanceof Promise) {
        // 递归解析，直到 value 不是 Promise
        return value.then(resolve, reject);
      }

      // Promise 状态只能从 pending 改变一次
      if (this.status === PENDING) {
        this.value = value;
        this.status = FULFILLED;
        // 依次执行所有成功的回调函数
        this.onResolveCallbacks.forEach((fn) => fn());
      }
    };

    /**
     * reject 函数 - 将 Promise 状态从 pending 变为 rejected
     * @param {*} reason - 失败的原因
     */
    const reject = (reason) => {
      // Promise 状态只能从 pending 改变一次
      if (this.status === PENDING) {
        this.reason = reason;
        this.status = REJECTED;
        // 依次执行所有失败的回调函数
        this.onRejectCallbacks.forEach((fn) => fn());
      }
    };

    // 立即执行执行器函数
    // 如果执行器函数抛出异常，Promise 应该被 reject
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  /**
   * Promise.deferred() - 延迟对象（主要用于 Promise A+ 测试）
   * @returns {Object} 返回包含 promise、resolve、reject 的对象
   *
   * 这个方法创建一个"延迟"对象，可以在外部控制 Promise 的状态
   * 在某些测试框架中会用到
   */
  static deferred() {
    const dfd = {};

    dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });

    return dfd;
  }

  /**
   * Promise.withResolvers() - ES2024 新增方法
   * @returns {Object} 返回包含 promise、resolve、reject 的对象
   *
   * 功能与 deferred 相同，但这是标准方法名
   * 使用场景：需要在 Promise 外部控制其状态时
   *
   * 示例：
   *   const { promise, resolve, reject } = Promise.withResolvers();
   *   setTimeout(() => resolve('success'), 1000);
   *   await promise; // 'success'
   */
  static withResolvers() {
    let resolve, reject;

    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  }

  /**
   * Promise.resolve() - 返回一个以给定值解析后的 Promise 对象
   * @param {*} value - 要解析的值
   * @returns {Promise} 返回一个 fulfilled 状态的 Promise
   *
   * 如果 value 是 Promise，则直接返回该 Promise
   * 如果 value 是 thenable 对象，则返回跟随该对象状态的 Promise
   * 否则返回以该值为成功值的 fulfilled Promise
   */
  static resolve(value) {
    // 如果传入的已经是 Promise 实例，直接返回
    if (value instanceof Promise) {
      return value;
    }

    return new Promise((resolve) => {
      resolve(value);
    });
  }

  /**
   * Promise.reject() - 返回一个以给定原因拒绝的 Promise 对象
   * @param {*} reason - 拒绝的原因
   * @returns {Promise} 返回一个 rejected 状态的 Promise
   *
   * 注意：即使 reason 是 Promise，也会被作为拒绝原因，不会解析
   */
  static reject(reason) {
    return new Promise((_, reject) => {
      reject(reason);
    });
  }

  /**
   * Promise.race() - 竞速方法
   * @param {Iterable} promises - Promise 可迭代对象
   * @returns {Promise} 返回一个 Promise
   *
   * 返回一个 Promise，一旦迭代器中的某个 Promise 解决或拒绝，
   * 返回的 Promise 就会解决或拒绝
   *
   * 使用场景：
   * - 请求超时控制
   * - 多个请求竞速，取最快的
   */
  static race(promises) {
    return new Promise((resolve, reject) => {
      // 遍历所有 Promise
      for (const promise of promises) {
        // 将每个元素转换为 Promise（处理非 Promise 值）
        // 第一个 resolve 或 reject 的 Promise 决定结果
        Promise.resolve(promise).then(resolve, reject);
      }
    });
  }

  /**
   * Promise.all() - 并行执行，全部成功才成功
   * @param {Iterable} promises - Promise 可迭代对象
   * @returns {Promise} 返回一个 Promise
   *
   * 当所有 Promise 都成功时，返回所有结果组成的数组
   * 只要有一个 Promise 失败，立即返回第一个失败的原因
   *
   * 特性：
   * - 保持结果顺序（与完成顺序无关）
   * - 快速失败（fail-fast）
   * - 处理稀疏数组
   *
   * 使用场景：
   * - 多个请求都需要成功才能继续
   * - 并行加载多个资源
   */
  static all(promises) {
    const results = [];
    let count = 0;

    // 处理稀疏数组：只计算实际存在的元素
    for (let i = 0; i < promises.length; i++) {
      if (i in promises) {
        count++;
      }
    }

    return new Promise((resolve, reject) => {
      // 边界情况：空数组立即 resolve
      if (count === 0) {
        return resolve(results);
      }

      for (let index = 0; index < promises.length; index++) {
        // 只处理数组中实际存在的元素（处理稀疏数组）
        if (index in promises) {
          const promise = promises[index];

          // 将每个元素转换为 Promise
          Promise.resolve(promise).then(
            (value) => {
              // 保存结果到对应的索引位置，保持顺序
              results[index] = value;
              // 所有 Promise 都成功时，resolve 结果数组
              if (--count === 0) {
                resolve(results);
              }
            },
            // 任何一个失败，立即 reject
            reject
          );
        }
      }
    });
  }

  /**
   * Promise.allSettled() - 并行执行，等待所有完成（无论成功失败）
   * @param {Iterable} promises - Promise 可迭代对象
   * @returns {Promise} 返回一个 Promise，解析为结果对象数组
   *
   * 等待所有 Promise 完成（fulfilled 或 rejected），返回每个 Promise 的结果
   *
   * 结果格式：
   * - 成功：{ status: 'fulfilled', value: 结果值 }
   * - 失败：{ status: 'rejected', reason: 失败原因 }
   *
   * 使用场景：
   * - 需要知道所有操作的结果，无论成功失败
   * - 批量操作，即使部分失败也要继续
   */
  static allSettled(promises) {
    const results = [];
    let count = promises.length;

    return new Promise((resolve) => {
      // 边界情况：空数组立即 resolve
      if (count === 0) {
        return resolve(results);
      }

      for (let index = 0; index < promises.length; index++) {
        // 处理稀疏数组
        if (index in promises) {
          const promise = promises[index];

          Promise.resolve(promise).then(
            (value) => {
              // 成功时，记录成功状态和值
              results[index] = { status: "fulfilled", value };
              if (--count === 0) {
                resolve(results);
              }
            },
            (reason) => {
              // 失败时，记录失败状态和原因
              results[index] = { status: "rejected", reason };
              if (--count === 0) {
                resolve(results);
              }
            }
          );
        } else {
          // 稀疏数组的空位，用 undefined 填充
          results[index] = { status: "fulfilled", value: undefined };
          if (--count === 0) {
            resolve(results);
          }
        }
      }
    });
  }

  /**
   * Promise.any() - 并行执行，任意一个成功就成功
   * @param {Iterable} promises - Promise 可迭代对象
   * @returns {Promise} 返回一个 Promise
   *
   * 只要有一个 Promise 成功，就返回第一个成功的值
   * 只有当所有 Promise 都失败时，才返回 AggregateError
   *
   * 与 race 的区别：
   * - race: 第一个完成（无论成功失败）
   * - any: 第一个成功，忽略失败，全失败才失败
   *
   * 使用场景：
   * - 多个数据源，任意一个返回即可
   * - 多个服务器请求，使用最快成功的那个
   * - 容错处理，有备用方案
   */
  static any(promises) {
    return new Promise((resolve, reject) => {
      const errors = [];
      let rejectedCount = 0;
      let promiseCount = 0;

      // 计算实际的 Promise 数量（处理稀疏数组）
      for (let i = 0; i < promises.length; i++) {
        if (i in promises) {
          promiseCount++;
        }
      }

      // 边界情况：空数组立即 reject
      if (promiseCount === 0) {
        return reject(new AggregateError([], "All promises were rejected"));
      }

      for (let index = 0; index < promises.length; index++) {
        if (index in promises) {
          const promise = promises[index];

          Promise.resolve(promise).then(
            // 任意一个成功，立即 resolve
            resolve,
            (reason) => {
              // 收集失败原因
              errors[index] = reason;
              rejectedCount++;

              // 所有都失败时，reject 一个 AggregateError
              if (rejectedCount === promiseCount) {
                reject(
                  new AggregateError(errors, "All promises were rejected")
                );
              }
            }
          );
        }
      }
    });
  }

  /**
   * Promise.try() - 将同步或异步函数转换为 Promise
   * @param {Function} func - 要执行的函数
   * @returns {Promise} 返回一个 Promise
   *
   * 功能：
   * - 如果函数返回值，Promise 以该值 resolve
   * - 如果函数抛出异常，Promise 以该异常 reject
   * - 如果函数返回 Promise，则跟随该 Promise 的状态
   *
   * 使用场景：
   * - 统一处理同步和异步函数
   * - 将可能抛出异常的同步代码转换为 Promise
   * - 简化错误处理
   *
   * 示例：
   *   Promise.try(() => JSON.parse(str))
   *     .then(data => console.log(data))
   *     .catch(err => console.error('解析失败', err));
   */
  static try(func) {
    return new Promise((resolve) => {
      // 立即执行函数，resolve 其返回值
      // 如果函数抛出异常，Promise 构造函数会自动捕获并 reject
      resolve(func());
    });
  }

  /**
   * then() - Promise 的核心方法，用于注册回调函数
   * @param {Function} onFulfilled - 成功时的回调函数
   * @param {Function} onRejected - 失败时的回调函数
   * @returns {Promise} 返回一个新的 Promise，支持链式调用
   *
   * Promise A+ 规范要求：
   * 1. then 方法必须返回一个新的 Promise
   * 2. 回调函数必须异步执行（使用 setTimeout 模拟微任务）
   * 3. 如果回调不是函数，需要值穿透
   * 4. 回调的返回值需要通过 resolvePromise 处理
   *
   * 值穿透示例：
   *   Promise.resolve(1).then().then(v => console.log(v)); // 1
   */
  then(onFulfilled, onRejected) {
    // 值穿透：如果不是函数，提供默认函数
    // onFulfilled 默认：直接返回值
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    // onRejected 默认：直接抛出错误，继续向下传递
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (r) => {
            throw r;
          };

    // 创建新的 Promise 实现链式调用
    const promise2 = new Promise((resolve, reject) => {
      // 情况1：当前 Promise 已经是成功状态
      if (this.status === FULFILLED) {
        // ============ 为什么要异步执行？============
        //
        // 1. Promise A+ 规范 2.2.4 要求：
        //    onFulfilled 和 onRejected 必须异步执行
        //    "onFulfilled or onRejected must not be called until
        //     the execution context stack contains only platform code"
        //
        // 2. 原因：保证执行顺序的一致性
        //    无论 Promise 是立即 resolve 还是异步 resolve
        //    then 的回调都应该在当前同步代码执行完后才执行
        //
        // 3. nextTick 的实现：
        //    ✅ 优先使用 queueMicrotask（微任务，ES2019）
        //    ✅ 降级到 MutationObserver（微任务，浏览器）
        //    ✅ 降级到 setImmediate（宏任务，Node.js）
        //    ✅ 最终降级到 setTimeout（宏任务，所有环境）
        //
        // 4. 微任务 vs 宏任务：
        //    - 微任务：在当前事件循环结束后立即执行（优先级高）
        //    - 宏任务：在下一个事件循环执行（优先级低）
        //    - ES6 规范要求 Promise 使用微任务
        //
        nextTick(() => {
          try {
            // 执行成功回调，获取返回值
            const x = onFulfilled(this.value);
            // 使用 resolvePromise 处理返回值
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            // 如果回调执行出错，reject 新 Promise
            reject(e);
          }
        });
      }

      // 情况2：当前 Promise 已经是失败状态
      if (this.status === REJECTED) {
        nextTick(() => {
          try {
            // 执行失败回调，获取返回值
            const x = onRejected(this.reason);
            // 失败回调的返回值也需要通过 resolvePromise 处理
            // 这样可以实现错误恢复：catch 后返回值可以让链条继续
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      // 情况3：当前 Promise 还在等待状态（异步场景）
      if (this.status === PENDING) {
        // 将回调函数加入队列，等待状态改变时执行
        this.onResolveCallbacks.push(() => {
          nextTick(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });

        this.onRejectCallbacks.push(() => {
          nextTick(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });

    return promise2;
  }

  /**
   * catch() - 用于指定发生错误时的回调函数
   * @param {Function} onRejected - 失败时的回调函数
   * @returns {Promise} 返回一个新的 Promise
   *
   * 实际上是 .then(null, onRejected) 的语法糖
   * 用于捕获 Promise 链中的错误
   *
   * 示例：
   *   promise
   *     .then(data => processData(data))
   *     .catch(err => console.error(err));
   */
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  /**
   * finally() - 无论成功失败都会执行的回调
   * @param {Function} onFinally - 最终执行的回调函数
   * @returns {Promise} 返回一个新的 Promise
   *
   * 特点：
   * 1. 无论 Promise 成功或失败都会执行
   * 2. 不接收任何参数
   * 3. 返回原来的值或原因（不改变链条的值）
   *
   * 使用场景：清理资源、隐藏加载动画等
   */
  finally(onFinally) {
    return this.then(
      // 成功时：执行 onFinally，然后返回原值
      (value) => Promise.resolve(onFinally()).then(() => value),
      // 失败时：执行 onFinally，然后抛出原因
      (reason) =>
        Promise.resolve(onFinally()).then(() => {
          throw reason;
        })
    );
  }
}

// ==================== 导出模块 ====================
module.exports = Promise;

// ==================== 测试用例 ====================

console.log("========== Promise 测试用例 ==========\n");

// 测试1：基本使用
console.log("【测试1】基本 Promise 使用");
new Promise((resolve) => {
  setTimeout(() => resolve("成功"), 100);
})
  .then((res) => {
    console.log("✓ 基本测试通过:", res);
  })
  .catch((err) => console.log("✗ 失败:", err));

// 测试2：Promise.all
console.log("\n【测试2】Promise.all - 全部成功");
Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
  .then((results) => {
    console.log("✓ Promise.all 结果:", results); // [1, 2, 3]
  })
  .catch((err) => console.log("✗ 失败:", err));

// 测试3：Promise.allSettled
console.log("\n【测试3】Promise.allSettled - 混合成功失败");
Promise.allSettled([
  Promise.resolve(1),
  Promise.reject("错误"),
  Promise.resolve(3),
]).then((results) => {
  console.log("✓ Promise.allSettled 结果:");
  results.forEach((result, index) => {
    console.log(`  [${index}]`, result);
  });
});

// 测试4：Promise.any
console.log("\n【测试4】Promise.any - 任意一个成功");
Promise.any([
  Promise.reject("错误1"),
  Promise.resolve("成功"),
  Promise.reject("错误2"),
])
  .then((result) => {
    console.log("✓ Promise.any 结果:", result); // "成功"
  })
  .catch((err) => {
    console.log("✗ Promise.any 失败:", err.errors);
  });

// 测试5：Promise.any - 全部失败
console.log("\n【测试5】Promise.any - 全部失败");
Promise.any([
  Promise.reject("错误1"),
  Promise.reject("错误2"),
  Promise.reject("错误3"),
])
  .then((result) => {
    console.log("成功:", result);
  })
  .catch((err) => {
    console.log("✓ Promise.any 全部失败，捕获 AggregateError");
    console.log("  错误信息:", err.message);
    console.log("  错误数组:", err.errors);
  });

// 测试6：Promise.race
console.log("\n【测试6】Promise.race - 竞速");
Promise.race([
  new Promise((resolve) => setTimeout(() => resolve("慢"), 200)),
  new Promise((resolve) => setTimeout(() => resolve("快"), 100)),
]).then((result) => {
  console.log("✓ Promise.race 结果:", result); // "快"
});

// 测试7：Promise.try
console.log("\n【测试7】Promise.try - 同步函数转 Promise");
Promise.try(() => {
  return 42;
}).then((result) => {
  console.log("✓ Promise.try 同步返回:", result); // 42
});

// 测试8：Promise.try - 捕获同步异常
console.log("\n【测试8】Promise.try - 捕获同步异常");
Promise.try(() => {
  throw new Error("同步错误");
})
  .then((result) => {
    console.log("成功:", result);
  })
  .catch((err) => {
    console.log("✓ Promise.try 捕获异常:", err.message);
  });

// 测试9：Promise.withResolvers
console.log("\n【测试9】Promise.withResolvers - 外部控制");
const { promise, resolve, reject } = Promise.withResolvers();
setTimeout(() => resolve("外部 resolve"), 100);
promise.then((result) => {
  console.log("✓ Promise.withResolvers 结果:", result);
});

// 测试10：链式调用
console.log("\n【测试10】链式调用测试");
Promise.resolve(1)
  .then((v) => v + 1)
  .then((v) => v * 2)
  .then((v) => {
    console.log("✓ 链式调用结果:", v); // 4
  });

// 测试11：值穿透
console.log("\n【测试11】值穿透测试");
Promise.resolve(100)
  .then() // 没有传回调
  .then() // 没有传回调
  .then((v) => {
    console.log("✓ 值穿透结果:", v); // 100
  });

// 测试12：错误恢复
console.log("\n【测试12】错误恢复测试");
Promise.reject("错误")
  .catch((err) => {
    console.log("  捕获错误:", err);
    return "恢复后的值";
  })
  .then((result) => {
    console.log("✓ 错误恢复后继续:", result);
  });

// 测试13：finally 测试
console.log("\n【测试13】finally 测试");
Promise.resolve("成功")
  .finally(() => {
    console.log("  finally 执行（无论成功失败）");
  })
  .then((result) => {
    console.log("✓ finally 不改变值:", result); // "成功"
  });

// 测试14：循环引用检测
console.log("\n【测试14】循环引用检测");
const p = new Promise((resolve) => resolve());
const p2 = p.then(() => p2); // 返回自身
p2.catch((err) => {
  console.log("✓ 捕获循环引用错误:", err.message);
});

// 测试15：稀疏数组处理
console.log("\n【测试15】稀疏数组处理");
const sparseArray = [Promise.resolve(1), , , Promise.resolve(4)];
Promise.allSettled(sparseArray).then((results) => {
  console.log("✓ 稀疏数组处理结果:");
  console.log("  数组长度:", results.length);
  results.forEach((result, index) => {
    console.log(`  [${index}]`, result);
  });
});

console.log("\n========== 所有测试已启动（异步执行中）==========");
