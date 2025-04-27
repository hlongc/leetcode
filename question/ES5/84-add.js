// 请实现一个 add 函数，满足以下功能
// add(1); 			// 1
// add(1)(2);  	// 3
// add(1)(2)(3)；// 6
// add(1)(2, 3); // 6
// add(1, 2)(3); // 6
// add(1, 2, 3); // 6

/**
 * 实现一个支持多种调用方式的add函数
 * 核心思路:
 * 1. 利用闭包保存累加的结果
 * 2. 利用函数的toString/valueOf方法隐式转换
 * 3. 实现函数柯里化，支持连续调用
 *
 * @returns {Function} 一个包含累加结果的函数
 */
function add() {
  // 将当前传入的所有参数转换为数组并求和
  // arguments是类数组对象，需要使用Array.prototype.slice转为真正的数组
  const args = Array.prototype.slice.call(arguments);

  // 计算当前传入参数的总和
  const sum = args.reduce((total, current) => total + current, 0);

  // 定义一个内部函数，用于处理链式调用
  function innerAdd() {
    // 将后续调用的参数也转换为数组
    const innerArgs = Array.prototype.slice.call(arguments);

    // 将当前参数与之前的参数求和
    const innerSum = innerArgs.reduce((total, current) => total + current, 0);

    // 返回一个新的函数，累加当前结果
    // 这就实现了链式调用 add(1)(2)(3)
    return add(sum + innerSum);
  }

  // 关键点：当函数需要被当作值使用时（如打印或计算），会自动调用toString或valueOf方法
  // 这里重写函数的valueOf和toString方法，使其返回累加的结果
  innerAdd.valueOf = function () {
    return sum;
  };

  innerAdd.toString = function () {
    return sum.toString();
  };

  return innerAdd;
}

// 测试用例
console.log(add(1)); // 1
console.log(add(1)(2)); // 3
console.log(add(1)(2)(3)); // 6
console.log(add(1)(2, 3)); // 6
console.log(add(1, 2)(3)); // 6
console.log(add(1, 2, 3)); // 6

// 验证隐式转换功能
console.log(add(1) + 10); // 11
console.log(add(1, 2) + 10); // 13
console.log(add(1)(2) + 10); // 13
