/**
 * JavaScript异步执行机制和事件循环演示
 *
 * 执行机制：
 * 1. 同步代码按顺序执行
 * 2. 异步任务分为宏任务(macro-task)和微任务(micro-task)
 * 3. 常见宏任务：setTimeout, setInterval, setImmediate, I/O, UI渲染等
 * 4. 常见微任务：Promise.then/.catch/.finally, process.nextTick, MutationObserver等
 * 5. 执行顺序：同步代码 -> 微任务队列 -> 宏任务队列
 * 6. 每个宏任务之后都会清空微任务队列
 */

// 定义第一个异步函数
async function async1() {
  console.log("async1 start"); // 2. 这是同步代码，立即执行
  await async2(); // 3. 调用async2()，并等待其完成
  // await之后的代码相当于放入微任务队列
  console.log("async1 end"); // 6. 这行被放入微任务队列，等待执行
}

// 定义第二个异步函数
async function async2() {
  console.log("async2"); // 4. async2内部的同步代码，立即执行
  // async函数隐式返回Promise
}

// 脚本开始执行，这是同步代码
console.log("script start"); // 1. 首先执行的同步代码

// 设置一个延时为0的定时器，其回调函数会被添加到宏任务队列
setTimeout(function () {
  console.log("setTimeout"); // 9. 作为宏任务，最后执行
}, 0);

// 调用async1函数
async1(); // 开始执行async1函数内部代码

// 创建并执行一个Promise
new Promise(function (resolve) {
  // Promise构造函数内部的代码是同步执行的
  console.log("promise1"); // 5. 这是同步代码，立即执行
  resolve(); // 将Promise状态设为fulfilled
}).then(function () {
  // then中的回调会被放入微任务队列
  console.log("promise2"); // 7. 这行作为微任务，稍后执行
});

// 最后一行同步代码
console.log("script end"); // 8. 同步代码，立即执行

/**
 * 完整的执行顺序分析：
 *
 * 第一阶段：执行同步代码
 * 1. 输出 "script start"
 * 2. 遇到setTimeout，将回调放入宏任务队列
 * 3. 调用async1()
 *    - 输出 "async1 start"
 *    - 调用async2()
 *    - 输出 "async2"
 *    - await导致async1()后续代码被放入微任务队列
 * 4. 执行Promise构造函数
 *    - 输出 "promise1"
 *    - 调用resolve()，将then的回调放入微任务队列
 * 5. 输出 "script end"
 *
 * 第二阶段：执行所有微任务
 * 1. 执行async1中await后的代码
 *    - 输出 "async1 end"
 * 2. 执行Promise.then的回调
 *    - 输出 "promise2"
 *
 * 第三阶段：执行宏任务
 * 1. 执行setTimeout的回调
 *    - 输出 "setTimeout"
 */

// 最终输出顺序：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
