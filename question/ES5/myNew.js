/**
 * 模拟实现JavaScript的new操作符
 * new操作符的核心步骤：
 * 1. 创建一个新的空对象
 * 2. 将这个对象的原型指向构造函数的prototype
 * 3. 执行构造函数，并将this绑定到新创建的对象上
 * 4. 如果构造函数返回了一个对象或函数，则返回该结果；否则返回创建的新对象
 *
 * @param {Function} Constructor - 构造函数
 * @param {...any} args - 传递给构造函数的参数
 * @returns {Object} - 构造函数返回的对象或新创建的实例对象
 */
function myNew(Constructor, ...args) {
  // 1. 创建一个新的空对象
  const obj = {};

  // 2. 将新对象的原型指向构造函数的prototype
  // 这一步建立了实例与构造函数原型之间的继承关系
  Object.setPrototypeOf(obj, Constructor.prototype);
  // 也可以使用: obj.__proto__ = Constructor.prototype;

  // 3. 执行构造函数，并将this绑定到新创建的对象
  // call方法可以改变函数执行时的this指向，这里将this指向新创建的对象
  // 同时传入构造函数的参数
  const ret = Constructor.call(obj, ...args);

  // 4. 判断构造函数的返回值
  // 如果构造函数返回了一个对象或函数，则返回该结果
  // 否则返回在第一步创建的新对象
  if (ret !== null && (typeof ret === "object" || typeof ret === "function")) {
    return ret;
  }

  // 如果没有返回对象或函数，则返回新创建的实例对象
  return obj;
}

// 使用示例
/*
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const person = myNew(Person, '张三', 25);
console.log(person); // Person {name: '张三', age: 25}
*/
