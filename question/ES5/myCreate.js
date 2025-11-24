/**
 * 模拟实现 Object.create() 方法
 * Object.create() 的核心功能是创建一个新对象，使用现有对象作为新对象的原型
 *
 * @param {Object|null} prototype - 新创建对象的原型对象
 * @returns {Object} - 一个具有指定原型的新对象
 */
Object.create = function (prototype) {
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

  // ⚠️ 关键：处理 prototype 为 null 的特殊情况
  //
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ 问题：虽然上面设置了 F.prototype = null，                          │
  // │       但是 new F() 创建的对象原型并不是 null！                      │
  // └─────────────────────────────────────────────────────────────────────┘
  //
  // 【原因】JavaScript 规范规定，当使用 new 操作符时：
  //   ✅ 如果构造函数的 prototype 属性是一个对象，则将其作为新对象的原型
  //   ⚠️  如果 prototype 不是对象（如 null、undefined、基本类型），
  //      则使用 Object.prototype 作为新对象的原型（这是一个回退保护机制）
  //
  // 【执行流程对比】
  //   F.prototype = null;
  //   const obj = new F();
  //
  //   期望：obj.__proto__ → null
  //   实际：obj.__proto__ → Object.prototype  ❌（因为 new 的保护机制）
  //
  // 【验证示例】
  //   function F() {}
  //   F.prototype = null;              // 第 1 步：设置为 null
  //   const obj = new F();             // 第 2 步：new 操作符发现是 null，回退到 Object.prototype
  //   Object.getPrototypeOf(obj);      // 结果：Object.prototype（而不是 null！）
  //
  // 【解决方案】需要在对象创建后，手动强制将原型设置为 null
  if (prototype === null) {
    // 方法1（推荐）：使用 Object.setPrototypeOf（ES6，但现代环境广泛支持）
    Object.setPrototypeOf(newObj, null);

    // 方法2（兼容）：在不支持 Object.setPrototypeOf 的老环境中可以使用 __proto__
    // newObj.__proto__ = null;
    // 注意：__proto__ 已被废弃，不建议在生产环境使用
  }

  return newObj;
};

// ==================== 使用示例 ====================

// 示例1：使用普通对象作为原型
/*
const proto = {
  sayHello: function() {
    console.log('Hello!');
  }
};

const obj = Object.create(proto);
obj.sayHello(); // 输出: Hello!

// 验证原型链
console.log(Object.getPrototypeOf(obj) === proto); // true
*/

// 示例2：创建原型为 null 的对象（演示为什么需要额外处理）
/*
console.log('=== 演示为什么需要对 null 进行额外处理 ===\n');

// 错误的实现（不处理 null）
function wrongCreate(prototype) {
  function F() {}
  F.prototype = prototype;
  return new F();  // 问题：当 prototype 是 null 时，这里会回退到 Object.prototype
}

// 正确的实现（处理 null）
function correctCreate(prototype) {
  function F() {}
  F.prototype = prototype;
  const newObj = new F();
  if (prototype === null) {
    Object.setPrototypeOf(newObj, null);  // 手动设置为 null
  }
  return newObj;
}

// 测试对比
const wrongObj = wrongCreate(null);
const correctObj = correctCreate(null);
const nativeObj = Object.create(null);

console.log('错误实现创建的对象:');
console.log('  原型是 null?', Object.getPrototypeOf(wrongObj) === null);  // false ❌
console.log('  原型是 Object.prototype?', Object.getPrototypeOf(wrongObj) === Object.prototype);  // true
console.log('  有 toString 方法?', 'toString' in wrongObj);  // true（不应该有）

console.log('\n正确实现创建的对象:');
console.log('  原型是 null?', Object.getPrototypeOf(correctObj) === null);  // true ✅
console.log('  有 toString 方法?', 'toString' in correctObj);  // false（纯净对象）

console.log('\nObject.create(null) 创建的对象:');
console.log('  原型是 null?', Object.getPrototypeOf(nativeObj) === null);  // true ✅
console.log('  有 toString 方法?', 'toString' in nativeObj);  // false（纯净对象）

console.log('\n结论：我们的正确实现与 Object.create(null) 行为一致！');
*/

// 示例3：原型为 null 的实际应用场景
/*
// 场景1：创建纯净的字典对象（Map 的替代方案）
const dict = Object.create(null);
dict['toString'] = 'custom value';  // 不会与原型方法冲突
console.log(dict.toString);  // 'custom value'（而不是函数）

// 场景2：避免原型污染攻击
const safeObj = Object.create(null);
// 即使恶意代码尝试访问 __proto__，也不会影响其他对象
safeObj.constructor = 'hacked';  // 只影响当前对象
*/
