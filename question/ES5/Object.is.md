# Object.is() 详解

## 什么是 Object.is()？

`Object.is()` 是 ES6 新增的方法，用于判断两个值是否为**同一个值**。它比 `===` 更加严格和准确。

### 基本语法

```javascript
Object.is(value1, value2);
// 返回 true 或 false
```

---

## Object.is() vs === vs ==

### 对比表

| 比较方式          | 类型转换  | NaN === NaN | +0 === -0  | 使用场景           |
| ----------------- | --------- | ----------- | ---------- | ------------------ |
| **`==`**          | ✅ 会转换 | `false`     | `true`     | 不推荐（隐式转换） |
| **`===`**         | ❌ 不转换 | `false`     | `true`     | 日常使用（推荐）   |
| **`Object.is()`** | ❌ 不转换 | ✅ `true`   | ❌ `false` | 特殊场景（最严格） |

### 核心区别

**`Object.is()` 与 `===` 的两个关键区别**：

1. **NaN 的比较**

   ```javascript
   NaN === NaN; // false ❌
   Object.is(NaN, NaN); // true  ✅
   ```

2. **+0 和 -0 的比较**
   ```javascript
   +0 === -0; // true  ❌
   Object.is(+0, -0); // false ✅
   Object.is(+0, 0); // true
   Object.is(-0, 0); // false
   ```

---

## 详细示例

### 1. 基本类型比较

```javascript
// 数字
Object.is(1, 1); // true
Object.is(1, "1"); // false（不进行类型转换）
Object.is(42, 42); // true

// 字符串
Object.is("foo", "foo"); // true
Object.is("foo", "bar"); // false

// 布尔值
Object.is(true, true); // true
Object.is(true, false); // false

// null 和 undefined
Object.is(null, null); // true
Object.is(undefined, undefined); // true
Object.is(null, undefined); // false
```

### 2. 特殊情况：NaN

```javascript
// === 无法正确判断 NaN
NaN === NaN; // false
NaN === Number.NaN; // false

// Object.is() 可以正确判断
Object.is(NaN, NaN); // true ✅
Object.is(NaN, Number.NaN); // true ✅
Object.is(NaN, 0 / 0); // true ✅

// 实际应用
function isReallyNaN(value) {
  return Object.is(value, NaN);
}

isReallyNaN(NaN); // true
isReallyNaN(undefined); // false
isReallyNaN("not a number"); // false

// 对比其他判断 NaN 的方法
Number.isNaN(NaN); // true
isNaN(NaN); // true
isNaN("not a number"); // true（会先转换）❌
Number.isNaN("not a number"); // false（不转换）✅
```

### 3. 特殊情况：+0 和 -0

```javascript
// === 无法区分正零和负零
+0 === -0; // true
0 === -0; // true

// Object.is() 可以区分
Object.is(+0, -0); // false ✅
Object.is(+0, 0); // true
Object.is(-0, 0); // false

// 实际应用：检测负零
function isNegativeZero(value) {
  return Object.is(value, -0);
}

isNegativeZero(-0); // true
isNegativeZero(0); // false
isNegativeZero(+0); // false

// 为什么会有 -0？
console.log(-0); // 0（显示为 0）
console.log(1 / -0); // -Infinity
console.log(1 / +0); // Infinity

// 数学运算中的 -0
-1 * 0; // -0
Math.min(-0, 0); // -0
-0 < 0; // false
-0 > 0; // false
-0 === 0; // true
```

### 4. 引用类型比较

```javascript
// 对象引用
const obj1 = { a: 1 };
const obj2 = { a: 1 };
const obj3 = obj1;

Object.is(obj1, obj2); // false（不同引用）
Object.is(obj1, obj3); // true（相同引用）
obj1 === obj3; // true（与 === 结果相同）

// 数组
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];
const arr3 = arr1;

Object.is(arr1, arr2); // false
Object.is(arr1, arr3); // true

// 函数
function fn() {}
Object.is(fn, fn); // true
Object.is(fn, function () {}); // false
```

---

## 完整对比示例

```javascript
// 测试函数
function compareAll(a, b) {
  console.log(`
    值: ${a} vs ${b}
    ==:         ${a == b}
    ===:        ${a === b}
    Object.is:  ${Object.is(a, b)}
  `);
}

// 测试用例
console.log("===== 1. 正常情况 =====");
compareAll(1, 1);
// ==: true, ===: true, Object.is: true

console.log("===== 2. 类型不同 =====");
compareAll(1, "1");
// ==: true, ===: false, Object.is: false

console.log("===== 3. NaN =====");
compareAll(NaN, NaN);
// ==: false, ===: false, Object.is: true ✅

console.log("===== 4. +0 和 -0 =====");
compareAll(+0, -0);
// ==: true, ===: true, Object.is: false ✅

console.log("===== 5. null 和 undefined =====");
compareAll(null, undefined);
// ==: true, ===: false, Object.is: false
```

---

## Object.is() 的实现原理（Polyfill）

```javascript
// ES5 实现 Object.is()
if (!Object.is) {
  Object.is = function (x, y) {
    // 1. 处理 NaN
    // NaN 是唯一一个不等于自身的值
    if (x !== x) {
      return y !== y; // 都是 NaN 返回 true
    }

    // 2. 处理 +0 和 -0
    // 1/+0 = Infinity, 1/-0 = -Infinity
    if (x === 0 && y === 0) {
      return 1 / x === 1 / y;
    }

    // 3. 其他情况使用 ===
    return x === y;
  };
}

// 测试 Polyfill
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(+0, -0)); // false
console.log(Object.is(1, 1)); // true
```

### 实现原理详解

```javascript
// 1. NaN 的判断原理
function isNaNValue(x) {
  // NaN 是唯一不等于自身的值
  return x !== x;
}

console.log(isNaNValue(NaN)); // true
console.log(isNaNValue(123)); // false

// 2. +0 和 -0 的判断原理
function isPositiveZero(x) {
  return x === 0 && 1 / x === Infinity;
}

function isNegativeZero(x) {
  return x === 0 && 1 / x === -Infinity;
}

console.log(isPositiveZero(+0)); // true
console.log(isPositiveZero(-0)); // false
console.log(isNegativeZero(-0)); // true
console.log(isNegativeZero(+0)); // false

// 3. 为什么 1/+0 和 1/-0 不同？
console.log(1 / +0); // Infinity
console.log(1 / -0); // -Infinity
console.log(Infinity === -Infinity); // false
```

---

## 实际应用场景

### 1. 检测 NaN

```javascript
// 传统方法（不可靠）
function checkNaN1(value) {
  return value !== value; // 只对 NaN 返回 true
}

// 使用 Object.is()（推荐）
function checkNaN2(value) {
  return Object.is(value, NaN);
}

// ES6 最佳实践
function checkNaN3(value) {
  return Number.isNaN(value); // 推荐
}

// 测试
const testValues = [NaN, 0, "NaN", undefined, null];
testValues.forEach((val) => {
  console.log(`${val}: ${checkNaN2(val)}`);
});
```

### 2. React/Vue 等框架的状态比较

```javascript
// React 的 Object.is 应用
// React 使用 Object.is 来判断 state 是否改变

// React 源码中的使用（简化版）
function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) {
    return true; // 完全相同
  }

  // 如果不是对象或为 null，已经不相等
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // 比较每个属性
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key]) // ✅ 使用 Object.is
    ) {
      return false;
    }
  }

  return true;
}

// 使用示例
const state1 = { count: 0, name: "John" };
const state2 = { count: 0, name: "John" };
const state3 = state1;

console.log(shallowEqual(state1, state2)); // true（浅比较相等）
console.log(shallowEqual(state1, state3)); // true（引用相同）
```

### 3. 数组去重（处理 NaN）

```javascript
// 传统方法无法正确处理 NaN
function uniqueWithSet(arr) {
  return [...new Set(arr)];
}

const arr1 = [1, 2, NaN, 3, NaN, 4];
console.log(uniqueWithSet(arr1)); // [1, 2, NaN, 3, 4]（Set 可以处理 NaN）

// 使用 Object.is 实现更精确的去重
function uniqueWithObjectIs(arr) {
  return arr.filter((item, index, self) => {
    return self.findIndex((t) => Object.is(t, item)) === index;
  });
}

const arr2 = [1, 2, NaN, 3, NaN, 4, +0, -0];
console.log(uniqueWithObjectIs(arr2));
// [1, 2, NaN, 3, 4, 0, -0]（能区分 +0 和 -0）
```

### 4. Map/Set 的键值比较

```javascript
// Map 和 Set 内部使用类似 Object.is 的算法（SameValueZero）
// 区别：SameValueZero 认为 +0 和 -0 相等

const set = new Set();
set.add(NaN);
set.add(NaN);
console.log(set.size); // 1（NaN 被认为相等）

set.add(+0);
set.add(-0);
console.log(set.size); // 2（+0 和 -0 被认为相等）❗

// 使用 Object.is 实现严格的 Set
class StrictSet {
  constructor() {
    this.items = [];
  }

  add(value) {
    if (!this.has(value)) {
      this.items.push(value);
    }
    return this;
  }

  has(value) {
    return this.items.some((item) => Object.is(item, value));
  }

  get size() {
    return this.items.length;
  }
}

const strictSet = new StrictSet();
strictSet.add(+0);
strictSet.add(-0);
console.log(strictSet.size); // 2（+0 和 -0 被区分）✅
```

### 5. 深度比较工具

```javascript
// 深度比较函数
function deepEqual(a, b) {
  // 1. 使用 Object.is 进行基本比较
  if (Object.is(a, b)) {
    return true;
  }

  // 2. 如果类型不同
  if (typeof a !== typeof b) {
    return false;
  }

  // 3. 处理 null
  if (a === null || b === null) {
    return false;
  }

  // 4. 处理数组
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // 5. 处理对象
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => {
      return (
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual(a[key], b[key])
      );
    });
  }

  return false;
}

// 测试
const obj1 = {
  a: 1,
  b: NaN,
  c: { d: +0 },
  e: [1, 2, 3],
};

const obj2 = {
  a: 1,
  b: NaN,
  c: { d: -0 },
  e: [1, 2, 3],
};

console.log(deepEqual(obj1, obj2)); // false（因为 +0 !== -0）
```

---

## 三种相等性算法

JavaScript 中有三种相等性判断算法：

### 1. 抽象相等比较（`==`）

```javascript
// 会进行类型转换
1 == "1"; // true
true == 1; // true
null == undefined; // true
[] == false; // true
```

### 2. 严格相等比较（`===`）

```javascript
// 不进行类型转换
1 === "1"; // false
NaN === NaN; // false
+0 === -0; // true
```

### 3. 同值相等（`Object.is()`）

```javascript
// 最严格的相等
Object.is(1, "1"); // false
Object.is(NaN, NaN); // true ✅
Object.is(+0, -0); // false ✅
```

### 4. 同值零（SameValueZero）

Map 和 Set 内部使用的算法，与 `Object.is()` 类似，但认为 `+0` 和 `-0` 相等。

```javascript
const map = new Map();
map.set(+0, "plus zero");
map.set(-0, "minus zero");
console.log(map.size); // 1（+0 和 -0 被认为相等）

const set = new Set([+0, -0]);
console.log(set.size); // 1
```

---

## 性能对比

```javascript
// 性能测试
function performanceTest() {
  const iterations = 10000000;

  // 测试 ===
  console.time("===");
  for (let i = 0; i < iterations; i++) {
    1 === 1;
  }
  console.timeEnd("===");

  // 测试 Object.is()
  console.time("Object.is");
  for (let i = 0; i < iterations; i++) {
    Object.is(1, 1);
  }
  console.timeEnd("Object.is");
}

performanceTest();

// 结果：
// ===:        约 5-10ms
// Object.is:  约 10-20ms
// 结论：=== 略快，但差异可以忽略
```

---

## 使用建议

### ✅ 推荐使用 `Object.is()` 的场景

```javascript
// 1. 需要检测 NaN
if (Object.is(value, NaN)) {
  console.log("这是 NaN");
}

// 2. 需要区分 +0 和 -0
if (Object.is(value, -0)) {
  console.log("这是负零");
}

// 3. 实现深度比较
function deepCompare(a, b) {
  if (Object.is(a, b)) return true;
  // ... 其他逻辑
}

// 4. 框架/库的状态比较
if (!Object.is(prevState, nextState)) {
  update();
}
```

### ⚠️ 不需要使用 `Object.is()` 的场景

```javascript
// 1. 日常的相等判断（用 === 即可）
if (a === b) {
  // ✅ 推荐
  // ...
}

// 2. 不关心 NaN 和 ±0 的场景
const index = arr.indexOf(item); // 内部使用 ===，足够了

// 3. 性能敏感的场景（=== 略快）
for (let i = 0; i < 1000000; i++) {
  if (arr[i] === target) {
    // ✅ 推荐用 ===
    // ...
  }
}
```

---

## 总结表格

| 特性            | `==`      | `===`       | `Object.is()` |
| --------------- | --------- | ----------- | ------------- |
| **类型转换**    | ✅ 会     | ❌ 不会     | ❌ 不会       |
| **性能**        | 最慢      | 最快        | 较快          |
| **NaN === NaN** | `false`   | `false`     | ✅ `true`     |
| **+0 === -0**   | `true`    | `true`      | ✅ `false`    |
| **推荐度**      | ❌ 不推荐 | ✅ 日常使用 | ✅ 特殊场景   |

### 选择指南

```javascript
// 决策树
if (需要区分 +0 和 -0 || 需要正确判断 NaN) {
  使用 Object.is();
} else if (可能有类型转换) {
  避免使用 ==，检查类型后使用 ===;
} else {
  使用 === (默认选择);
}
```

### 记忆口诀

- **`==`**：宽松相等，会转换（不推荐）
- **`===`**：严格相等，日常用（推荐）
- **`Object.is()`**：同值相等，特殊场景（NaN、±0）

### 关键要点

✅ `Object.is()` 是最严格的相等判断  
✅ 正确处理 `NaN` 和 `±0` 的比较  
✅ ES6 新增，现代浏览器都支持  
✅ 常用于框架内部的状态比较  
✅ 引用类型比较与 `===` 相同

掌握 `Object.is()` 能让你在处理边缘情况时更加准确和自信！
