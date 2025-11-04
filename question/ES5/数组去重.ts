/**
 * 数组去重 - O(n) 实现
 * 支持各种类型：number, string, boolean, null, undefined, NaN, object, array, function, Symbol, BigInt
 */

/**
 * ============================================
 * 方案1：简单版（只适用于基本类型）
 * ============================================
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function uniqueSimple<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

// 测试
console.log("=== 方案1：简单版 ===");
console.log(uniqueSimple([1, 2, 2, 3, 3, 3, 4])); // [1, 2, 3, 4]
console.log(uniqueSimple(["a", "b", "a", "c"])); // ['a', 'b', 'c']
console.log(uniqueSimple([NaN, NaN, 1, 1])); // [NaN, 1] ✅ Set可以正确处理NaN

// ❌ 无法处理对象和数组
console.log(uniqueSimple([{ a: 1 }, { a: 1 }])); // [{ a: 1 }, { a: 1 }] 无法去重

/**
 * ============================================
 * 方案2：使用 Map（支持基本类型 + 序列化对象）
 * ============================================
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function uniqueWithMap<T>(arr: T[]): T[] {
  const map = new Map<any, T>();

  for (const item of arr) {
    // 为不同类型生成唯一的 key
    let key: any;

    if (item === null) {
      key = "null";
    } else if (item === undefined) {
      key = "undefined";
    } else if (typeof item === "object") {
      // 对象和数组：序列化为 JSON
      try {
        key = JSON.stringify(item);
      } catch (e) {
        // 如果无法序列化（如循环引用），使用引用本身
        key = item;
      }
    } else if (typeof item === "function") {
      // 函数：使用函数的字符串表示
      key = item.toString();
    } else if (typeof item === "symbol") {
      // Symbol：使用 Symbol 本身
      key = item;
    } else {
      // 基本类型：直接使用值
      key = item;
    }

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

// 测试
console.log("\n=== 方案2：使用 Map ===");
console.log(uniqueWithMap([1, 2, 2, 3, NaN, NaN])); // [1, 2, 3, NaN]
console.log(uniqueWithMap([{ a: 1 }, { a: 1 }, { a: 2 }])); // [{ a: 1 }, { a: 2 }] ✅
console.log(
  uniqueWithMap([
    [1, 2],
    [1, 2],
    [3, 4],
  ])
); // [[1, 2], [3, 4]] ✅

/**
 * ============================================
 * 方案3：完整版（支持所有类型 + 深度比较）
 * ============================================
 * 时间复杂度：O(n) 平均情况，最坏 O(n²) 当大量对象需要深度比较时
 * 空间复杂度：O(n)
 */
class ArrayDeduplicator {
  /**
   * 主函数：数组去重
   */
  static unique<T>(arr: T[]): T[] {
    const result: T[] = [];
    const primitiveSet = new Set<any>(); // 存储基本类型
    const objectCache: any[] = []; // 存储对象类型

    for (const item of arr) {
      const type = this.getType(item);

      if (this.isPrimitive(type)) {
        // 基本类型：使用 Set
        if (!primitiveSet.has(item)) {
          primitiveSet.add(item);
          result.push(item);
        }
      } else {
        // 引用类型：深度比较
        if (!this.existsInArray(item, objectCache)) {
          objectCache.push(item);
          result.push(item);
        }
      }
    }

    return result;
  }

  /**
   * 获取精确的类型
   */
  private static getType(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Number.isNaN(value)) return "nan";

    const type = typeof value;
    if (type !== "object") return type;

    // 区分数组和对象
    return Array.isArray(value) ? "array" : "object";
  }

  /**
   * 判断是否为基本类型
   */
  private static isPrimitive(type: string): boolean {
    return [
      "string",
      "number",
      "boolean",
      "null",
      "undefined",
      "nan",
      "symbol",
      "bigint",
    ].includes(type);
  }

  /**
   * 检查元素是否已存在于数组中（深度比较）
   */
  private static existsInArray(item: any, arr: any[]): boolean {
    return arr.some((existing) => this.deepEqual(item, existing));
  }

  /**
   * 深度比较两个值是否相等
   */
  private static deepEqual(a: any, b: any): boolean {
    // 1. 严格相等（处理基本类型和引用相同的情况）
    if (a === b) return true;

    // 2. NaN 特殊处理
    if (Number.isNaN(a) && Number.isNaN(b)) return true;

    // 3. null 和 undefined
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;

    // 4. 类型不同
    const typeA = this.getType(a);
    const typeB = this.getType(b);
    if (typeA !== typeB) return false;

    // 5. 基本类型已经在第1步处理，这里处理引用类型

    // 6. Date 对象
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // 7. RegExp 对象
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    // 8. 函数
    if (typeof a === "function" && typeof b === "function") {
      return a.toString() === b.toString();
    }

    // 9. 数组
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    // 10. 普通对象
    if (typeA === "object" && typeB === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every((key) => this.deepEqual(a[key], b[key]));
    }

    return false;
  }
}

// 测试
console.log("\n=== 方案3：完整版 ===");

// 基本类型
console.log(
  "基本类型:",
  ArrayDeduplicator.unique([1, 1, 2, 2, "a", "a", true, true])
);
// [1, 2, 'a', true]

// NaN
console.log("NaN:", ArrayDeduplicator.unique([NaN, NaN, 1, 1]));
// [NaN, 1]

// null 和 undefined
console.log(
  "null/undefined:",
  ArrayDeduplicator.unique([null, null, undefined, undefined, 1])
);
// [null, undefined, 1]

// 对象
console.log(
  "对象:",
  ArrayDeduplicator.unique([{ a: 1 }, { a: 1 }, { a: 2 }, { b: 1 }])
);
// [{ a: 1 }, { a: 2 }, { b: 1 }]

// 嵌套对象
console.log(
  "嵌套对象:",
  ArrayDeduplicator.unique([{ a: { b: 1 } }, { a: { b: 1 } }, { a: { b: 2 } }])
);
// [{ a: { b: 1 } }, { a: { b: 2 } }]

// 数组
console.log(
  "数组:",
  ArrayDeduplicator.unique([
    [1, 2],
    [1, 2],
    [2, 3],
    [1, 2, 3],
  ])
);
// [[1, 2], [2, 3], [1, 2, 3]]

// 嵌套数组
console.log(
  "嵌套数组:",
  ArrayDeduplicator.unique([
    [1, [2, 3]],
    [1, [2, 3]],
    [1, [2, 4]],
  ])
);
// [[1, [2, 3]], [1, [2, 4]]]

// 混合类型
console.log(
  "混合类型:",
  ArrayDeduplicator.unique([
    1,
    "1",
    1,
    true,
    "true",
    null,
    null,
    undefined,
    undefined,
    NaN,
    NaN,
    { a: 1 },
    { a: 1 },
    [1, 2],
    [1, 2],
  ])
);
// [1, '1', true, 'true', null, undefined, NaN, { a: 1 }, [1, 2]]

// Date 对象
console.log(
  "Date:",
  ArrayDeduplicator.unique([
    new Date("2024-01-01"),
    new Date("2024-01-01"),
    new Date("2024-01-02"),
  ])
);
// [Date(2024-01-01), Date(2024-01-02)]

// Symbol
const sym1 = Symbol("test");
const sym2 = Symbol("test");
console.log("Symbol:", ArrayDeduplicator.unique([sym1, sym1, sym2, sym2]));
// [Symbol(test), Symbol(test)] - 两个不同的Symbol

/**
 * ============================================
 * 方案4：性能优化版（针对大数据量）
 * ============================================
 */
class FastDeduplicator {
  /**
   * 使用分层策略：
   * 1. 基本类型用 Set（O(1)）
   * 2. 对象用序列化字符串作为 key（O(1)）
   * 3. 无法序列化的对象才进行深度比较（罕见）
   */
  static unique<T>(arr: T[]): T[] {
    const result: T[] = [];
    const primitiveSet = new Set<any>();
    const serializableMap = new Map<string, T>();
    const unserializableArray: any[] = [];

    for (const item of arr) {
      const type = typeof item;

      // 1. 基本类型 + null + undefined
      if (
        item === null ||
        item === undefined ||
        type === "string" ||
        type === "number" ||
        type === "boolean" ||
        type === "symbol" ||
        type === "bigint"
      ) {
        if (!primitiveSet.has(item)) {
          primitiveSet.add(item);
          result.push(item);
        }
      }
      // 2. 对象类型
      else if (type === "object" || type === "function") {
        try {
          // 尝试序列化
          const key = JSON.stringify(item);
          if (!serializableMap.has(key)) {
            serializableMap.set(key, item);
            result.push(item);
          }
        } catch (e) {
          // 无法序列化（循环引用、函数等）
          const exists = unserializableArray.some((existing) =>
            this.shallowEqual(item, existing)
          );
          if (!exists) {
            unserializableArray.push(item);
            result.push(item);
          }
        }
      }
    }

    return result;
  }

  /**
   * 浅比较（用于无法序列化的对象）
   */
  private static shallowEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object") return false;
    if (a === null || b === null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => a[key] === b[key]);
  }
}

// 性能测试
console.log("\n=== 方案4：性能优化版 ===");
console.log(
  "混合类型:",
  FastDeduplicator.unique([
    1,
    1,
    "a",
    "a",
    { a: 1 },
    { a: 1 },
    [1, 2],
    [1, 2],
    null,
    null,
  ])
);

/**
 * ============================================
 * 方案5：针对特定场景的优化
 * ============================================
 */

/**
 * 场景1：只有基本类型（最快）
 */
function uniquePrimitives<T extends string | number | boolean>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * 场景2：数组中的对象有唯一标识符（如 id）
 */
function uniqueById<T extends { id: string | number }>(arr: T[]): T[] {
  const map = new Map<string | number, T>();
  for (const item of arr) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

// 测试
console.log("\n=== 场景优化 ===");
console.log("基本类型:", uniquePrimitives([1, 2, 2, 3, 3, 4]));

const users = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
  { id: 1, name: "John Doe" }, // 重复id
  { id: 3, name: "Bob" },
];
console.log("按ID去重:", uniqueById(users));
// [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }, { id: 3, name: 'Bob' }]

/**
 * ============================================
 * 性能对比测试
 * ============================================
 */
function performanceTest() {
  const testData = [
    ...Array(1000).fill(1),
    ...Array(1000).fill("a"),
    ...Array(1000).fill({ a: 1 }),
    ...Array(1000).fill([1, 2]),
  ];

  console.log("\n=== 性能测试（4000个元素）===");

  console.time("方案1-Set");
  uniqueSimple(testData);
  console.timeEnd("方案1-Set");

  console.time("方案2-Map");
  uniqueWithMap(testData);
  console.timeEnd("方案2-Map");

  console.time("方案3-完整版");
  ArrayDeduplicator.unique(testData);
  console.timeEnd("方案3-完整版");

  console.time("方案4-优化版");
  FastDeduplicator.unique(testData);
  console.timeEnd("方案4-优化版");
}

performanceTest();

/**
 * ============================================
 * 边界情况测试
 * ============================================
 */
console.log("\n=== 边界情况 ===");

// 空数组
console.log("空数组:", ArrayDeduplicator.unique([]));
// []

// 单元素
console.log("单元素:", ArrayDeduplicator.unique([1]));
// [1]

// 全部相同
console.log("全部相同:", ArrayDeduplicator.unique([1, 1, 1, 1]));
// [1]

// +0 和 -0
console.log("+0 和 -0:", ArrayDeduplicator.unique([0, -0, +0]));
// [0] - Set认为+0和-0相等

// Infinity
console.log(
  "Infinity:",
  ArrayDeduplicator.unique([Infinity, Infinity, -Infinity, -Infinity])
);
// [Infinity, -Infinity]

// 循环引用
const circular: any = { a: 1 };
circular.self = circular;
console.log("循环引用:", FastDeduplicator.unique([circular, circular]));
// [{ a: 1, self: [Circular] }]

/**
 * ============================================
 * 实用工具函数
 * ============================================
 */

/**
 * 支持自定义比较函数
 */
function uniqueBy<T>(arr: T[], compareFn: (a: T, b: T) => boolean): T[] {
  const result: T[] = [];

  for (const item of arr) {
    const exists = result.some((existing) => compareFn(item, existing));
    if (!exists) {
      result.push(item);
    }
  }

  return result;
}

// 使用示例
console.log("\n=== 自定义比较 ===");

// 按对象的某个属性去重
const products = [
  { id: 1, name: "Apple", price: 10 },
  { id: 2, name: "Banana", price: 5 },
  { id: 1, name: "Apple Pro", price: 15 }, // id重复
];

console.log(
  "按name去重:",
  uniqueBy(products, (a, b) => a.name === b.name)
);
// [{ id: 1, name: 'Apple', price: 10 }, { id: 2, name: 'Banana', price: 5 }]

// 忽略大小写去重
console.log(
  "忽略大小写:",
  uniqueBy(
    ["Apple", "APPLE", "Banana", "banana"],
    (a, b) => a.toLowerCase() === b.toLowerCase()
  )
);
// ['Apple', 'Banana']

/**
 * ============================================
 * 总结与建议
 * ============================================
 *
 * 1. 只有基本类型？
 *    → 使用 [...new Set(arr)]
 *
 * 2. 包含对象，但对象有唯一ID？
 *    → 使用 Map + ID 作为 key
 *
 * 3. 包含各种类型，需要深度比较？
 *    → 使用 ArrayDeduplicator.unique()
 *
 * 4. 需要自定义比较逻辑？
 *    → 使用 uniqueBy()
 *
 * 5. 性能要求极高？
 *    → 使用 FastDeduplicator.unique()
 *
 * 时间复杂度：
 * - 基本类型：O(n)
 * - 含对象（可序列化）：O(n)
 * - 含对象（需深度比较）：O(n²) 最坏情况
 *
 * 空间复杂度：都是 O(n)
 */

// 导出
export {
  uniqueSimple,
  uniqueWithMap,
  ArrayDeduplicator,
  FastDeduplicator,
  uniqueById,
  uniqueBy,
};
