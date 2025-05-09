# JavaScript 获取对象属性键的不同方法比较

在 JavaScript 中，有多种方法可以获取对象的属性键。本文将详细比较`Reflect.ownKeys`、`Object.keys`和`for...in`循环这三种方法的异同，并从原型链、可枚举性、属性类型等多个维度进行分析。

## 1. 方法概览

### Object.keys(obj)

- 返回对象自身的**可枚举**属性键的数组
- 不包含 Symbol 类型的键
- 不包含不可枚举的属性
- 不包含原型链上的属性

### for...in 循环

- 遍历对象自身及其原型链上所有**可枚举**的属性键
- 不包含 Symbol 类型的键
- 会遍历原型链上的可枚举属性
- 顺序通常是按照创建属性的顺序，但不同浏览器可能有所不同

### Reflect.ownKeys(obj)

- 返回对象自身的**所有**属性键的数组，无论是否可枚举
- 包含 Symbol 类型的键
- 包含不可枚举的属性
- 不包含原型链上的属性
- 返回顺序有规范定义：先按数字升序，再按创建顺序的字符串键，最后是 Symbol 键

## 2. 详细比较

### 2.1 原型链处理

```javascript
const parent = { parentProp: "parent value" };
const child = Object.create(parent);
child.childProp = "child value";

// Object.keys - 只返回自身可枚举属性
console.log(Object.keys(child)); // ['childProp']

// for...in - 返回自身和原型链上的可枚举属性
for (const key in child) {
  console.log(key); // 'childProp', 'parentProp'
}

// Reflect.ownKeys - 只返回自身所有属性
console.log(Reflect.ownKeys(child)); // ['childProp']
```

### 2.2 可枚举性

```javascript
const obj = {};
Object.defineProperty(obj, "enumProp", {
  value: "enumerable property",
  enumerable: true,
});
Object.defineProperty(obj, "nonEnumProp", {
  value: "non-enumerable property",
  enumerable: false,
});

// Object.keys - 只返回可枚举属性
console.log(Object.keys(obj)); // ['enumProp']

// for...in - 只返回可枚举属性
for (const key in obj) {
  console.log(key); // 只输出 'enumProp'
}

// Reflect.ownKeys - 返回所有属性，无论是否可枚举
console.log(Reflect.ownKeys(obj)); // ['enumProp', 'nonEnumProp']
```

### 2.3 Symbol 类型键

```javascript
const symbolKey = Symbol("symbol key");
const obj = {
  stringKey: "string value",
  [symbolKey]: "symbol value",
};

// Object.keys - 不返回Symbol键
console.log(Object.keys(obj)); // ['stringKey']

// for...in - 不遍历Symbol键
for (const key in obj) {
  console.log(key); // 只输出 'stringKey'
}

// Reflect.ownKeys - 返回所有类型的键
console.log(Reflect.ownKeys(obj)); // ['stringKey', Symbol(symbol key)]
```

### 2.4 返回顺序

```javascript
const obj = {
  100: "number key",
  b: "string key b",
  a: "string key a",
};
Object.defineProperty(obj, "nonEnum", {
  value: "non-enumerable property",
  enumerable: false,
});
const sym1 = Symbol("first");
const sym2 = Symbol("second");
obj[sym1] = "symbol value 1";
obj[sym2] = "symbol value 2";

// Object.keys - 顺序是先数字（升序），然后是字符串（创建顺序）
console.log(Object.keys(obj)); // ['100', 'b', 'a']

// for...in - 顺序类似于Object.keys，但具体实现可能因浏览器而异
for (const key in obj) {
  console.log(key); // 通常是 '100', 'b', 'a'
}

// Reflect.ownKeys - 明确定义的顺序：先数字（升序），然后是字符串（创建顺序），最后是Symbol
console.log(Reflect.ownKeys(obj)); // ['100', 'b', 'a', 'nonEnum', Symbol(first), Symbol(second)]
```

## 3. 其他相关方法

除了上述三种主要方法外，还有一些相关的方法可以获取对象属性：

### Object.getOwnPropertyNames(obj)

- 返回对象自身的所有**字符串属性**键，无论是否可枚举
- 不包含 Symbol 类型的键
- 不包含原型链上的属性

### Object.getOwnPropertySymbols(obj)

- 返回对象自身的所有**Symbol 类型**的键
- 不包含字符串属性键
- 不包含原型链上的属性

```javascript
const obj = {};
const sym = Symbol("key");
Object.defineProperty(obj, "enumProp", {
  value: "enumerable",
  enumerable: true,
});
Object.defineProperty(obj, "nonEnumProp", {
  value: "non-enumerable",
  enumerable: false,
});
obj[sym] = "symbol value";

console.log(Object.getOwnPropertyNames(obj)); // ['enumProp', 'nonEnumProp']
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(key)]

// 等价于Reflect.ownKeys
console.log([
  ...Object.getOwnPropertyNames(obj),
  ...Object.getOwnPropertySymbols(obj),
]);
// ['enumProp', 'nonEnumProp', Symbol(key)]
```

## 4. 使用场景建议

1. **需要处理对象所有自身属性**（包括不可枚举和 Symbol）：使用`Reflect.ownKeys`

2. **只需要对象自身可枚举属性**：使用`Object.keys`

3. **需要遍历包括原型链上的可枚举属性**：使用`for...in`（通常配合`hasOwnProperty`检查）

4. **需要分别处理字符串属性和 Symbol 属性**：使用`Object.getOwnPropertyNames`和`Object.getOwnPropertySymbols`

5. **需要过滤继承属性**：使用`for...in`配合`Object.prototype.hasOwnProperty`
   ```javascript
   for (const key in obj) {
     if (Object.prototype.hasOwnProperty.call(obj, key)) {
       // 处理自身属性
     }
   }
   ```

## 5. 总结表格

| 方法                           | 自身属性 | 原型链属性 | 可枚举属性 | 不可枚举属性 | Symbol 键 | 字符串键 |
| ------------------------------ | -------- | ---------- | ---------- | ------------ | --------- | -------- |
| `Object.keys`                  | ✅       | ❌         | ✅         | ❌           | ❌        | ✅       |
| `for...in`                     | ✅       | ✅         | ✅         | ❌           | ❌        | ✅       |
| `Reflect.ownKeys`              | ✅       | ❌         | ✅         | ✅           | ✅        | ✅       |
| `Object.getOwnPropertyNames`   | ✅       | ❌         | ✅         | ✅           | ❌        | ✅       |
| `Object.getOwnPropertySymbols` | ✅       | ❌         | ✅         | ✅           | ✅        | ❌       |

## 6. 注意事项

1. `for...in`循环在性能上可能比其他方法慢，因为它需要遍历原型链
2. 在处理大型对象或性能关键代码时，应根据具体需求选择最合适的方法
3. ES6 之后的代码推荐使用`Reflect.ownKeys`来获取对象的所有自身属性
4. 操作对象时，应始终考虑属性的可枚举性和是否使用 Symbol 作为键
5. 遍历对象键时，务必考虑不同方法的返回顺序差异
