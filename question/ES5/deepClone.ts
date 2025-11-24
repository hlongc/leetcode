/**
 * 深拷贝函数 - TypeScript 完整版本
 * 支持所有常见 JavaScript 数据类型的深度克隆，并提供完整的类型推导
 */

// ============= 类型定义 =============

/**
 * 可克隆的数据类型联合类型
 */
type CloneableType =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint
  | Date
  | RegExp
  | Map<any, any>
  | Set<any>
  | Error
  | Array<any>
  | Record<string | symbol, any>
  | Function;

/**
 * 深拷贝函数的类型签名
 * 使用泛型 T 来保持输入输出类型一致
 */
type DeepClone = <T>(target: T, cache?: WeakMap<object, any>) => T;

// ============= 测试数据准备 =============
const symbolName = Symbol("testSymbol");

// 自定义类用于测试原型链保持
class CustomClass {
  customProp: string = "custom";
  constructor(public name: string) {}
  greet() {
    return `Hello, ${this.name}`;
  }
}

// 测试数据对象
interface TestObject {
  // 包装对象类型
  objNumber: Number;
  number: number;
  objString: String;
  string: string;
  objRegexp: RegExp;
  regexp: RegExp;

  // 日期和函数
  date: Date;
  function: () => void;

  // 复杂类型
  array: Array<{ a: number } | number>;
  map: Map<string, string | { nested: boolean }>;
  set: Set<any>;
  customInstance: CustomClass;

  // 特殊值
  nullValue: null;
  undefinedValue: undefined;
  bigintValue: bigint;

  // Symbol 作为键
  [key: symbol]: any;

  // 循环引用
  self?: TestObject;
}

const obj1: TestObject = {
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
  map: new Map<string, string | { nested: boolean }>([
    ["key1", "value1"],
    ["key2", { nested: true }],
  ]),
  set: new Set([1, 2, 3, { obj: "inSet" }]),
  customInstance: new CustomClass("测试实例"),

  // 特殊值
  nullValue: null,
  undefinedValue: undefined,
  bigintValue: 9007199254740991n,

  // Symbol 作为键
  [symbolName]: 111,
};

// 添加循环引用
obj1.self = obj1;

/**
 * 深拷贝函数 - TypeScript 版本
 * @template T - 泛型类型，保持输入输出类型一致
 * @param {T} target - 要克隆的目标对象
 * @param {WeakMap<object, any>} cache - 用于存储已克隆对象的缓存，解决循环引用问题
 * @returns {T} 克隆后的新对象，类型与输入相同
 *
 * @example
 * const original = { a: 1, b: { c: 2 } };
 * const cloned = deepClone(original);
 * // cloned 的类型会被推导为 { a: number; b: { c: number; } }
 */
const deepClone: DeepClone = <T>(
  target: T,
  cache: WeakMap<object, any> = new WeakMap()
): T => {
  // ========== 第一步：处理基本类型 ==========
  // 基本类型（null、undefined、number、string、boolean、symbol、bigint、function）直接返回
  // null 的 typeof 结果是 'object'，需要单独判断
  if (target === null || typeof target !== "object") {
    return target;
  }

  // ========== 第二步：处理循环引用 ==========
  // 如果对象已经被克隆过，直接返回缓存中的结果
  // 这是解决循环引用的关键：obj.a = obj 这种情况
  if (cache.has(target as object)) {
    return cache.get(target as object);
  }

  // ========== 第三步：获取构造函数，处理特殊对象类型 ==========
  const Constructor = (target as any).constructor;

  switch (Constructor) {
    // 包装对象类型：Number、String、Boolean
    // 使用 Object() + valueOf() 确保正确获取原始值并创建新的包装对象
    case Number:
    case String:
    case Boolean:
      // Object(value) 会创建对应的包装对象
      // valueOf() 获取包装对象的原始值
      return new Object(Constructor.prototype.valueOf.call(target)) as T;

    // 日期对象
    // 使用 getTime() 获取时间戳，避免直接 new Date(target) 可能的问题
    case Date:
      return new Date((target as unknown as Date).getTime()) as T;

    // 正则表达式
    // 需要复制 source（正则表达式文本）、flags（修饰符）和 lastIndex（上次匹配位置）
    case RegExp: {
      const regTarget = target as unknown as RegExp;
      const regClone = new RegExp(regTarget.source, regTarget.flags);
      regClone.lastIndex = regTarget.lastIndex;
      return regClone as T;
    }

    // Map 类型
    // Map 的键和值都可能是对象，需要深拷贝
    case Map: {
      const mapTarget = target as unknown as Map<any, any>;
      const mapClone = new Map();
      // 先设置缓存，防止 Map 内部的循环引用
      cache.set(target as object, mapClone);
      mapTarget.forEach((value, key) => {
        // Map 的键也可能是对象，所以键值都需要深拷贝
        mapClone.set(deepClone(key, cache), deepClone(value, cache));
      });
      return mapClone as T;
    }

    // Set 类型
    // Set 的值可能是对象，需要深拷贝
    case Set: {
      const setTarget = target as unknown as Set<any>;
      const setClone = new Set();
      // 先设置缓存，防止 Set 内部的循环引用
      cache.set(target as object, setClone);
      setTarget.forEach((value) => {
        setClone.add(deepClone(value, cache));
      });
      return setClone as T;
    }

    // Error 类型及其子类（TypeError, RangeError 等）
    case Error:
    case TypeError:
    case RangeError:
    case ReferenceError:
    case SyntaxError: {
      const errorTarget = target as unknown as Error;
      const errorClone = new (Constructor as ErrorConstructor)(
        errorTarget.message
      );
      errorClone.stack = errorTarget.stack;
      errorClone.name = errorTarget.name;
      return errorClone as T;
    }
  }

  // ========== 第四步：处理普通对象和数组 ==========
  // 数组：创建空数组
  // 对象：使用 Object.create() 保持原型链（重要：可以保持自定义类的原型）
  const result = (
    Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target))
  ) as T;

  // ⚠️ 重要：在递归之前先设置缓存
  // 这样在处理循环引用时，就能找到正在创建的对象
  cache.set(target as object, result);

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
    // 使用类型断言确保 TypeScript 理解索引操作
    (result as any)[key] = deepClone((target as any)[key], cache);
  });

  return result;
};

// ============= 类型推导测试 =============
// TypeScript 会自动推导出正确的类型
const simpleObj = { a: 1, b: "test" };
const clonedSimple = deepClone(simpleObj);
// clonedSimple 的类型被推导为: { a: number; b: string; }

const complexObj = {
  nested: { value: 42 },
  array: [1, 2, 3],
};
const clonedComplex = deepClone(complexObj);
// clonedComplex 的类型被推导为: { nested: { value: number }; array: number[]; }

// ============= 详细测试代码 =============
console.log("========== 开始测试深拷贝 (TypeScript 版本) ==========\n");

// 执行深拷贝
const obj2 = deepClone(obj1);

// 修改原对象，验证深拷贝是否成功
obj1.number = 999;
// 需要类型断言，因为 array[0] 可能是 number 或 { a: number }
(obj1.array[0] as { a: number }).a = 999;
obj1.map.set("key1", "modified");
obj1.set.add(999);

console.log("【基本类型测试】");
console.log("原对象修改后的值:", obj1.number); // 999
console.log("克隆对象的值:", obj2.number); // 1
console.log("BigInt 值:", obj2.bigintValue); // 9007199254740991n
console.log("");

console.log("【数组深拷贝测试】");
console.log("原对象数组:", (obj1.array[0] as { a: number }).a); // 999
console.log("克隆对象数组:", (obj2.array[0] as { a: number }).a); // 1
console.log("");

console.log("【循环引用测试】");
console.log("obj2.self === obj2:", obj2.self === obj2); // true
console.log("obj2.self === obj1:", obj2.self === obj1); // false
console.log("");

console.log("【Map 测试】");
console.log("原对象 Map:", obj1.map.get("key1")); // 'modified'
console.log("克隆对象 Map:", obj2.map.get("key1")); // 'value1'
console.log("Map 是否独立:", obj1.map !== obj2.map); // true
console.log("");

console.log("【Set 测试】");
console.log("原对象 Set 大小:", obj1.set.size); // 4
console.log("克隆对象 Set 大小:", obj2.set.size); // 3
console.log("Set 是否独立:", obj1.set !== obj2.set); // true
console.log("");

console.log("【Symbol 键测试】");
console.log("克隆对象的 Symbol 属性:", obj2[symbolName]); // 111
console.log("");

console.log("【日期测试】");
console.log(
  "日期是否独立:",
  obj2.date !== obj1.date && obj2.date.getTime() === obj1.date.getTime()
); // true
console.log("");

console.log("【正则测试】");
console.log(
  "正则是否独立:",
  obj2.regexp !== obj1.regexp && obj2.regexp.source === obj1.regexp.source
); // true
console.log("");

console.log("【自定义类实例测试】");
console.log("原实例方法调用:", obj1.customInstance.greet()); // "Hello, 测试实例"
console.log("克隆实例方法调用:", obj2.customInstance.greet()); // "Hello, 测试实例"
console.log("原型链是否保持:", obj2.customInstance instanceof CustomClass); // true
console.log("实例是否独立:", obj1.customInstance !== obj2.customInstance); // true
console.log("");

console.log("【特殊值测试】");
console.log("null 值:", obj2.nullValue === null); // true
console.log("undefined 值:", obj2.undefinedValue === undefined); // true
console.log("");

console.log("【类型推导测试】");
// 这些在编译时就会进行类型检查
const typedObj = { name: "test", age: 18 };
const clonedTyped = deepClone(typedObj);
console.log("类型推导结果:", clonedTyped); // { name: "test", age: 18 }
// TypeScript 知道 clonedTyped.name 是 string 类型
// TypeScript 知道 clonedTyped.age 是 number 类型
console.log("");

console.log("========== 测试完成 ==========");

// ============= 导出供其他模块使用 =============
export default deepClone;
export type { CloneableType, DeepClone };
