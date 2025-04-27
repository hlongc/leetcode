/**
 * 模拟实现 Object.create() 方法
 * Object.create() 的核心功能是创建一个新对象，使用现有对象作为新对象的原型
 *
 * @param {Object|null} prototype - 新创建对象的原型对象
 * @returns {Object} - 一个具有指定原型的新对象
 */
function myCreate(prototype) {
  // 参数校验：prototype 必须是对象或 null
  if (
    !(
      typeof prototype === "object" ||
      typeof prototype === "function" ||
      prototype === null
    )
  ) {
    throw new TypeError("Object prototype may only be an Object or null");
  }

  // 创建一个临时构造函数
  function F() {}

  // 将传入的 prototype 设置为临时构造函数的原型
  F.prototype = prototype;

  // 使用临时构造函数创建新对象
  // 这样新对象的原型就指向了传入的 prototype
  const newObj = new F();

  // 如果 prototype 为 null，需要额外处理
  // 因为通过构造函数创建的对象总是有一个默认原型
  if (prototype === null) {
    // 在 ES5 中可以使用 Object.setPrototypeOf
    Object.setPrototypeOf(newObj, null);
    // 在不支持 Object.setPrototypeOf 的环境中可以使用:
    // newObj.__proto__ = null;
  }

  return newObj;
}

// 使用示例
/*
const proto = {
  sayHello: function() {
    console.log('Hello!');
  }
};

const obj = myCreate(proto);
obj.sayHello(); // 输出: Hello!

// 验证原型链
console.log(Object.getPrototypeOf(obj) === proto); // true
*/
