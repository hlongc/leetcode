/**
 * 实现与原生JavaScript中Function.prototype.call功能一致的函数
 *
 * call方法使用一个指定的this值和单独给出的一个或多个参数来调用一个函数
 *
 * 特点：
 * 1. 改变函数执行时的this指向
 * 2. 立即执行函数
 * 3. 参数列表以逗号分隔的形式直接传入
 */
Function.prototype.myCall = function (thisArg) {
  // 检查调用myCall的是否为函数
  if (typeof this !== "function") {
    throw new TypeError(
      "Function.prototype.myCall - what is trying to be called is not callable"
    );
  }

  // 处理thisArg为null或undefined的情况，将其设置为全局对象
  const effectiveThisArg =
    thisArg === null || thisArg === undefined
      ? typeof window !== "undefined"
        ? window
        : global
      : Object(thisArg); // 确保thisArg是对象（原始值会被转换为对象）

  // 为thisArg对象添加一个临时属性来存储当前函数
  // 使用Symbol可以避免属性名冲突，但为了兼容ES5，这里使用一个不太可能冲突的属性名
  const fnKey = "__fn__" + Date.now() + Math.random().toString(36).slice(2);
  effectiveThisArg[fnKey] = this;

  // 获取myCall的参数（除了第一个thisArg参数外的其他参数）
  const args = [];
  for (let i = 1; i < arguments.length; i++) {
    args.push("arguments[" + i + "]");
  }

  // 调用函数并传入参数
  // 使用eval是为了能够以参数列表的形式传递参数
  // 在实际生产环境中应避免使用eval，这里是为了模拟原生call的功能
  let result;
  try {
    // 通过字符串拼接的方式构建函数调用表达式
    result = eval("effectiveThisArg[fnKey](" + args + ")");
  } finally {
    // 无论函数是否执行成功，都要删除临时属性
    delete effectiveThisArg[fnKey];
  }

  return result;
};

/**
 * 实现与原生JavaScript中Function.prototype.apply功能一致的函数
 *
 * apply方法使用一个指定的this值和一个包含多个参数的数组（或类数组对象）来调用一个函数
 *
 * 特点：
 * 1. 改变函数执行时的this指向
 * 2. 立即执行函数
 * 3. 参数以数组或类数组对象的形式传入
 */
Function.prototype.myApply = function (thisArg, argsArray) {
  // 检查调用myApply的是否为函数
  if (typeof this !== "function") {
    throw new TypeError(
      "Function.prototype.myApply - what is trying to be applied is not callable"
    );
  }

  // 处理thisArg为null或undefined的情况，将其设置为全局对象
  const effectiveThisArg =
    thisArg === null || thisArg === undefined
      ? typeof window !== "undefined"
        ? window
        : global
      : Object(thisArg); // 确保thisArg是对象（原始值会被转换为对象）

  // 为thisArg对象添加一个临时属性来存储当前函数
  const fnKey = "__fn__" + Date.now() + Math.random().toString(36).slice(2);
  effectiveThisArg[fnKey] = this;

  // 验证argsArray是否为null或undefined
  if (argsArray == null) {
    // 如果argsArray为null或undefined，则不传参数调用函数
    try {
      return effectiveThisArg[fnKey]();
    } finally {
      delete effectiveThisArg[fnKey];
    }
  }

  // 验证argsArray是否可迭代（数组或类数组对象）
  if (typeof argsArray !== "object" && typeof argsArray !== "function") {
    throw new TypeError(
      "Function.prototype.myApply - second argument must be an array or array-like object"
    );
  }

  // 获取参数数组的长度
  const argsLength = argsArray.length || 0;
  const args = [];

  // 构造参数列表
  for (let i = 0; i < argsLength; i++) {
    args.push("argsArray[" + i + "]");
  }

  // 调用函数并传入参数
  let result;
  try {
    // 通过字符串拼接的方式构建函数调用表达式
    result = eval("effectiveThisArg[fnKey](" + args + ")");
  } finally {
    // 无论函数是否执行成功，都要删除临时属性
    delete effectiveThisArg[fnKey];
  }

  return result;
};

// 测试示例
/*
// 测试myCall
function greet(greeting, punctuation) {
  console.log(greeting + ' ' + this.name + punctuation);
  return greeting + ' ' + this.name + punctuation;
}

const person = { name: 'John' };
greet.myCall(person, 'Hello', '!'); // 输出: "Hello John!"

// 测试myApply
function introduce(greeting, info) {
  console.log(greeting + ' ' + this.name + '. ' + info);
  return greeting + ' ' + this.name + '. ' + info;
}

introduce.myApply(person, ['Hi', 'I am 30 years old']); // 输出: "Hi John. I am 30 years old"

// 测试null/undefined的情况
function showThis() {
  console.log(this);
}

showThis.myCall(null); // 在浏览器中输出window，在Node.js中输出global
showThis.myApply(undefined); // 在浏览器中输出window，在Node.js中输出global

// 测试原始值转换为对象
function getType() {
  console.log(typeof this);
  console.log(this);
}

getType.myCall(123); // 输出: "object" 和 Number对象
getType.myApply('hello'); // 输出: "object" 和 String对象
*/

Function.prototype.call = function (oThis, ...args) {
  const context =
    oThis === null || oThis === undefined ? globalThis : Object(oThis);

  const fnKey = Symbol();

  context[fnKey] = this;
  let ret = undefined;
  try {
    ret = context[fnKey](...args);
  } finally {
    delete context[fnKey];
  }

  return ret;
};

Function.prototype.apply = function (oThis, args) {
  const context =
    oThis === null || oThis === undefined ? globalThis : Object(oThis);

  const fnKey = Symbol();

  context[fnKey] = this;
  let ret = undefined;
  try {
    ret = context[fnKey](...args);
  } finally {
    delete context[fnKey];
  }

  return ret;
};
