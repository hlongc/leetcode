/**
 * 深拷贝函数 - 完整优化版本
 * 支持所有常见 JavaScript 数据类型的深度克隆
 */

// ============= 测试数据准备 =============
const symbolName = Symbol("testSymbol");
const obj1 = {
  // 包装对象类型
  objNumber: new Number(1),
  number: 1,
  objString: new String("ss"),
  string: "string",
  objRegexp: new RegExp("\\w"),
  regexp: /w+/g,

  // 日期和函数
  date: new Date(),
  function: function () {
    console.log("test");
  },

  // 复杂类型
  array: [{ a: 1 }, 2],
  map: new Map([
    ["key1", "value1"],
    ["key2", { nested: true }],
  ]),
  set: new Set([1, 2, 3, { obj: "inSet" }]),

  // Symbol 作为键
  [symbolName]: 111,
};

// 添加循环引用
obj1.self = obj1;

/**
 * 深拷贝函数
 * @param {*} target - 要克隆的目标对象
 * @param {WeakMap} cache - 用于存储已克隆对象的缓存，解决循环引用问题
 * @returns {*} 克隆后的新对象
 */
function deepClone(target, cache = new WeakMap()) {
  // ========== 第一步：处理基本类型 ==========
  // 基本类型（null、undefined、number、string、boolean、symbol、bigint、function）直接返回
  // null 的 typeof 结果是 'object'，需要单独判断
  if (target === null || typeof target !== "object") {
    return target;
  }

  // ========== 第二步：处理循环引用 ==========
  // 如果对象已经被克隆过，直接返回缓存中的结果
  // 这是解决循环引用的关键：obj.a = obj 这种情况
  if (cache.has(target)) {
    return cache.get(target);
  }

  // ========== 第三步：获取构造函数，处理特殊对象类型 ==========
  const Constructor = target.constructor;

  switch (Constructor) {
    // 包装对象类型：Number、String、Boolean
    // 使用 Object() + valueOf() 确保正确获取原始值并创建新的包装对象
    case Number:
    case String:
    case Boolean:
      // Object(value) 会创建对应的包装对象
      // valueOf() 获取包装对象的原始值
      return new Object(Constructor.prototype.valueOf.call(target));

    // 日期对象
    // 使用 getTime() 获取时间戳，避免直接 new Date(target) 可能的问题
    case Date:
      return new Date(target.getTime());

    // 正则表达式
    // 需要复制 source（正则表达式文本）、flags（修饰符）和 lastIndex（上次匹配位置）
    case RegExp:
      const regClone = new RegExp(target.source, target.flags);
      regClone.lastIndex = target.lastIndex;
      return regClone;

    // Map 类型
    // Map 的键和值都可能是对象，需要深拷贝
    case Map:
      const mapClone = new Map();
      // 先设置缓存，防止 Map 内部的循环引用
      cache.set(target, mapClone);
      target.forEach((value, key) => {
        // Map 的键也可能是对象，所以键值都需要深拷贝
        mapClone.set(deepClone(key, cache), deepClone(value, cache));
      });
      return mapClone;

    // Set 类型
    // Set 的值可能是对象，需要深拷贝
    case Set:
      const setClone = new Set();
      // 先设置缓存，防止 Set 内部的循环引用
      cache.set(target, setClone);
      target.forEach((value) => {
        setClone.add(deepClone(value, cache));
      });
      return setClone;

    // Error 类型及其子类（TypeError, RangeError 等）
    case Error:
    case TypeError:
    case RangeError:
    case ReferenceError:
    case SyntaxError:
      const errorClone = new Constructor(target.message);
      errorClone.stack = target.stack;
      errorClone.name = target.name;
      return errorClone;
  }

  // ========== 第四步：处理普通对象和数组 ==========
  // 数组：创建空数组
  // 对象：使用 Object.create() 保持原型链
  const result = Array.isArray(target)
    ? []
    : Object.create(Object.getPrototypeOf(target));

  // ⚠️ 重要：在递归之前先设置缓存
  // 这样在处理循环引用时，就能找到正在创建的对象
  cache.set(target, result);

  // ========== 第五步：遍历并拷贝所有属性 ==========
  // Reflect.ownKeys() 可以获取：
  // 1. 字符串键（包括不可枚举的）
  // 2. Symbol 键
  // 相比 Object.keys() 更全面
  Reflect.ownKeys(target).forEach((key) => {
    // 处理稀疏数组：[1, 2, , 4] 中的空位不应该被复制
    // 稀疏数组的空位用 'in' 操作符判断
    if (Array.isArray(target) && !(key in target)) {
      return;
    }

    // 递归深拷贝每个属性值
    result[key] = deepClone(target[key], cache);
  });

  return result;
}

// ============= 测试代码 =============
console.log("========== 开始测试深拷贝 ==========\n");

// 执行深拷贝
const obj2 = deepClone(obj1);

// 修改原对象，验证深拷贝是否成功
obj1.number = 999;
obj1.array[0].a = 999;
obj1.map.set("key1", "modified");
obj1.set.add(999);

console.log("原对象修改后的值:", obj1.number); // 999
console.log("克隆对象的值:", obj2.number); // 1
console.log("");

console.log("原对象数组:", obj1.array[0].a); // 999
console.log("克隆对象数组:", obj2.array[0].a); // 1
console.log("");

console.log("循环引用测试:");
console.log("obj2.self === obj2:", obj2.self === obj2); // true
console.log("obj2.self === obj1:", obj2.self === obj1); // false
console.log("");

console.log("Map 测试:");
console.log("原对象 Map:", obj1.map.get("key1")); // 'modified'
console.log("克隆对象 Map:", obj2.map.get("key1")); // 'value1'
console.log("");

console.log("Set 测试:");
console.log("原对象 Set 大小:", obj1.set.size); // 4
console.log("克隆对象 Set 大小:", obj2.set.size); // 3
console.log("");

console.log("Symbol 键测试:");
console.log("克隆对象的 Symbol 属性:", obj2[symbolName]); // 111
console.log("");

console.log("日期测试:");
console.log(
  "日期是否独立:",
  obj2.date !== obj1.date && obj2.date.getTime() === obj1.date.getTime()
);
console.log("");

console.log("正则测试:");
console.log(
  "正则是否独立:",
  obj2.regexp !== obj1.regexp && obj2.regexp.source === obj1.regexp.source
);
console.log("");

console.log("========== 测试完成 ==========");
