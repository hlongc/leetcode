# JavaScript 新特性总结 (ES2021-ES2024)

> 本文档总结了 ES2021 至 ES2024 的主要新特性，包含详细示例帮助理解和学习。

---

## 目录

- [ES2024 (ES15)](#es2024-es15)
- [ES2023 (ES14)](#es2023-es14)
- [ES2022 (ES13)](#es2022-es13)
- [ES2021 (ES12)](#es2021-es12)

---

## ES2024 (ES15)

### 1. Promise.withResolvers()

更方便地创建 Promise，无需在构造函数中定义 resolve 和 reject。

```javascript
// 旧写法
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

// 新写法 - 更简洁
const { promise, resolve, reject } = Promise.withResolvers();

// 实际应用场景：封装异步操作
function createDeferred() {
  const { promise, resolve, reject } = Promise.withResolvers();
  return { promise, resolve, reject };
}

// 使用示例
const deferred = createDeferred();
setTimeout(() => deferred.resolve("完成！"), 1000);
deferred.promise.then(console.log); // 1秒后输出: 完成！
```

### 2. Object.groupBy() / Map.groupBy()

根据回调函数的返回值对数组元素进行分组。

```javascript
const products = [
  { name: "苹果", type: "水果", price: 5 },
  { name: "香蕉", type: "水果", price: 3 },
  { name: "胡萝卜", type: "蔬菜", price: 2 },
  { name: "西兰花", type: "蔬菜", price: 4 },
  { name: "牛奶", type: "饮品", price: 6 },
];

// 按类型分组
const groupedByType = Object.groupBy(products, (product) => product.type);
console.log(groupedByType);
// {
//   水果: [{ name: '苹果', ... }, { name: '香蕉', ... }],
//   蔬菜: [{ name: '胡萝卜', ... }, { name: '西兰花', ... }],
//   饮品: [{ name: '牛奶', ... }]
// }

// 按价格区间分组
const groupedByPrice = Object.groupBy(products, (product) => {
  return product.price >= 5 ? "高价" : "低价";
});
console.log(groupedByPrice);
// {
//   低价: [{ name: '香蕉', ... }, { name: '胡萝卜', ... }, { name: '西兰花', ... }],
//   高价: [{ name: '苹果', ... }, { name: '牛奶', ... }]
// }

// Map.groupBy - 返回 Map 对象（适用于非字符串键）
const users = [
  { name: "张三", role: { id: 1, name: "admin" } },
  { name: "李四", role: { id: 1, name: "admin" } },
  { name: "王五", role: { id: 2, name: "user" } },
];

const adminRole = { id: 1, name: "admin" };
const userRole = { id: 2, name: "user" };

const groupedByRole = Map.groupBy(users, (user) => {
  return user.role.id === 1 ? adminRole : userRole;
});
// 使用对象作为键
console.log(groupedByRole.get(adminRole)); // [{ name: '张三', ... }, { name: '李四', ... }]
```

### 3. 正则表达式 v 标志

增强的 Unicode 支持，提供更强大的字符类操作。

```javascript
// v 标志支持集合操作

// 匹配希腊字母（使用 Unicode 属性）
const greekLetters = /[\p{Script=Greek}]/v;
console.log(greekLetters.test("α")); // true
console.log(greekLetters.test("a")); // false

// 集合差集：匹配所有字母但排除元音
const consonants = /[\p{Letter}--[aeiouAEIOU]]/v;
console.log(consonants.test("b")); // true
console.log(consonants.test("a")); // false

// 集合交集：匹配既是 ASCII 又是数字的字符
const asciiDigits = /[\p{ASCII}&&\p{Number}]/v;
console.log(asciiDigits.test("5")); // true
console.log(asciiDigits.test("五")); // false
```

---

## ES2023 (ES14)

### 1. 数组不可变方法

这些方法返回新数组，不修改原数组，非常适合函数式编程和 React 状态管理。

```javascript
const original = [3, 1, 4, 1, 5, 9, 2, 6];

// toSorted() - 排序（不修改原数组）
const sorted = original.toSorted((a, b) => a - b);
console.log(sorted); // [1, 1, 2, 3, 4, 5, 6, 9]
console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6] - 原数组不变！

// toReversed() - 反转（不修改原数组）
const reversed = original.toReversed();
console.log(reversed); // [6, 2, 9, 5, 1, 4, 1, 3]
console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6] - 原数组不变！

// toSpliced() - 拼接（不修改原数组）
const spliced = original.toSpliced(2, 2, 100, 200);
// 从索引2开始，删除2个元素，插入100和200
console.log(spliced); // [3, 1, 100, 200, 5, 9, 2, 6]
console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6] - 原数组不变！

// with() - 修改指定索引（不修改原数组）
const modified = original.with(0, 999);
console.log(modified); // [999, 1, 4, 1, 5, 9, 2, 6]
console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6] - 原数组不变！

// 链式调用
const result = original
  .toSorted((a, b) => a - b)
  .toReversed()
  .with(0, 0);
console.log(result); // [0, 6, 5, 4, 3, 2, 1, 1]
```

### 2. findLast() / findLastIndex()

从数组末尾开始查找元素。

```javascript
const numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];

// 查找最后一个大于3的元素
const lastGreaterThan3 = numbers.findLast((n) => n > 3);
console.log(lastGreaterThan3); // 4

// 查找最后一个大于3的元素的索引
const lastIndex = numbers.findLastIndex((n) => n > 3);
console.log(lastIndex); // 5

// 实际应用：查找最后一条错误日志
const logs = [
  { level: "info", message: "启动成功" },
  { level: "error", message: "连接失败" },
  { level: "info", message: "重试中" },
  { level: "error", message: "超时错误" },
  { level: "info", message: "恢复正常" },
];

const lastError = logs.findLast((log) => log.level === "error");
console.log(lastError); // { level: 'error', message: '超时错误' }
```

### 3. Hashbang 语法

允许在脚本文件开头使用 `#!` 指定解释器。

```javascript
#!/usr/bin/env node

// 现在可以直接运行: ./script.js
console.log("Hello from Node.js!");
```

---

## ES2022 (ES13)

### 1. 顶层 await

在模块顶层直接使用 await，无需包装在 async 函数中。

```javascript
// config.js - ES 模块
const response = await fetch("/api/config");
const config = await response.json();

export default config;

// main.js
import config from "./config.js";
console.log(config); // 配置已加载完成

// 动态导入示例
const module = await import("./dynamic-module.js");

// 条件加载
const lang = navigator.language;
const strings = await import(`./i18n/${lang}.js`);
```

### 2. 类的私有字段和方法

使用 `#` 前缀定义真正的私有成员。

```javascript
class BankAccount {
  // 私有字段
  #balance = 0;
  #transactionHistory = [];

  // 私有方法
  #recordTransaction(type, amount) {
    this.#transactionHistory.push({
      type,
      amount,
      date: new Date(),
      balance: this.#balance,
    });
  }

  constructor(initialBalance) {
    this.#balance = initialBalance;
    this.#recordTransaction("初始存款", initialBalance);
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("存款金额必须大于0");
    this.#balance += amount;
    this.#recordTransaction("存款", amount);
    return this.#balance;
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error("余额不足");
    this.#balance -= amount;
    this.#recordTransaction("取款", amount);
    return this.#balance;
  }

  getBalance() {
    return this.#balance;
  }

  getHistory() {
    // 返回副本，保护原始数据
    return [...this.#transactionHistory];
  }
}

const account = new BankAccount(1000);
account.deposit(500);
account.withdraw(200);
console.log(account.getBalance()); // 1300

// 无法直接访问私有字段
// console.log(account.#balance); // SyntaxError!
```

### 3. 静态初始化块

在类中执行复杂的静态初始化逻辑。

```javascript
class Database {
  static connection;
  static #privateConfig;

  // 静态初始化块
  static {
    console.log("初始化数据库配置...");

    // 可以执行复杂的初始化逻辑
    try {
      this.#privateConfig = {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || "test",
      };

      this.connection = this.#createConnection();
    } catch (error) {
      console.error("数据库初始化失败:", error);
      this.connection = null;
    }
  }

  static #createConnection() {
    return {
      config: this.#privateConfig,
      status: "connected",
    };
  }

  static getConfig() {
    return { ...this.#privateConfig };
  }
}

console.log(Database.connection); // { config: {...}, status: 'connected' }
```

### 4. Error.cause

为错误添加原因，便于错误链追踪。

```javascript
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error("HTTP 请求失败", {
        cause: { status: response.status, statusText: response.statusText },
      });
    }
    return await response.json();
  } catch (error) {
    throw new Error(`获取用户 ${userId} 数据失败`, { cause: error });
  }
}

async function displayUser(userId) {
  try {
    const user = await fetchUserData(userId);
    console.log(user);
  } catch (error) {
    console.error("错误:", error.message);
    console.error("原因:", error.cause);

    // 递归打印错误链
    let currentError = error;
    while (currentError.cause) {
      console.error(
        "  <- 由于:",
        currentError.cause.message || currentError.cause
      );
      currentError = currentError.cause;
    }
  }
}
```

### 5. Array.prototype.at()

支持负索引访问数组元素。

```javascript
const fruits = ["苹果", "香蕉", "橙子", "葡萄", "西瓜"];

// 正索引
console.log(fruits.at(0)); // '苹果'
console.log(fruits.at(2)); // '橙子'

// 负索引 - 从末尾开始
console.log(fruits.at(-1)); // '西瓜' (最后一个)
console.log(fruits.at(-2)); // '葡萄' (倒数第二个)

// 对比旧写法
console.log(fruits[fruits.length - 1]); // '西瓜' - 旧写法
console.log(fruits.at(-1)); // '西瓜' - 新写法更简洁

// 字符串也支持
const str = "Hello";
console.log(str.at(-1)); // 'o'
```

### 6. Object.hasOwn()

替代 `hasOwnProperty`，更安全的属性检查。

```javascript
const user = {
  name: "张三",
  age: 25,
};

// 旧写法
console.log(user.hasOwnProperty("name")); // true

// 新写法 - 更安全
console.log(Object.hasOwn(user, "name")); // true
console.log(Object.hasOwn(user, "toString")); // false (继承的属性)

// 为什么更安全？
// 1. 对象可能没有 hasOwnProperty 方法
const obj = Object.create(null); // 没有原型的对象
obj.key = "value";
// obj.hasOwnProperty('key'); // TypeError!
console.log(Object.hasOwn(obj, "key")); // true - 正常工作

// 2. hasOwnProperty 可能被覆盖
const dangerous = {
  hasOwnProperty: () => false, // 被覆盖了！
  secret: "机密数据",
};
console.log(dangerous.hasOwnProperty("secret")); // false - 错误结果！
console.log(Object.hasOwn(dangerous, "secret")); // true - 正确结果
```

---

## ES2021 (ES12)

### 1. 逻辑赋值运算符

结合逻辑运算符和赋值运算符。

```javascript
// ||= (或赋值) - 仅在 falsy 时赋值
let a = null;
a ||= "默认值";
console.log(a); // '默认值'

let b = "已有值";
b ||= "默认值";
console.log(b); // '已有值'

// &&= (与赋值) - 仅在 truthy 时赋值
let user = { name: "张三", loggedIn: true };
user.loggedIn &&= false; // 如果已登录，则设为 false
console.log(user.loggedIn); // false

// ??= (空值合并赋值) - 仅在 null/undefined 时赋值
let config = { timeout: 0, retries: null };
config.timeout ??= 5000; // 0 是有效值，不会被覆盖
config.retries ??= 3; // null 会被覆盖
console.log(config); // { timeout: 0, retries: 3 }

// 实际应用：初始化对象属性
function initUser(user) {
  user.name ??= "匿名用户";
  user.settings ??= {};
  user.settings.theme ??= "light";
  user.settings.language ??= "zh-CN";
  return user;
}

console.log(initUser({}));
// { name: '匿名用户', settings: { theme: 'light', language: 'zh-CN' } }
```

### 2. 数字分隔符

使用下划线提高大数字的可读性。

```javascript
// 大数字更易读
const billion = 1_000_000_000;
const price = 19_999_00; // 19999.00 元（以分为单位）

// 二进制
const binary = 0b1010_0001_1000_0101;

// 十六进制
const hex = 0xff_ec_de_5e;

// BigInt
const bigNumber = 9_007_199_254_740_991n;

// 小数
const pi = 3.141_592_653_589_793;

console.log(billion); // 1000000000
console.log(binary); // 41349
console.log(hex); // 4293713502
```

### 3. String.prototype.replaceAll()

替换字符串中所有匹配项。

```javascript
const text = "苹果很好吃，苹果很健康，我喜欢苹果";

// 旧写法 - 使用正则
const oldWay = text.replace(/苹果/g, "香蕉");

// 新写法 - 更直观
const newWay = text.replaceAll("苹果", "香蕉");

console.log(newWay); // '香蕉很好吃，香蕉很健康，我喜欢香蕉'

// 实际应用：模板替换
function template(str, data) {
  let result = str;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

const greeting = template("你好，{{name}}！欢迎来到{{city}}，{{name}}。", {
  name: "张三",
  city: "北京",
});
console.log(greeting); // '你好，张三！欢迎来到北京，张三。'
```

### 4. Promise.any()

返回第一个成功的 Promise，全部失败才会 reject。

```javascript
// 从多个镜像源获取资源，使用最快响应的那个
const mirrors = [
  "https://mirror1.example.com/data",
  "https://mirror2.example.com/data",
  "https://mirror3.example.com/data",
];

async function fetchFromFastestMirror() {
  try {
    const response = await Promise.any(mirrors.map((url) => fetch(url)));
    return await response.json();
  } catch (error) {
    // AggregateError - 所有 Promise 都失败
    console.error("所有镜像都不可用:", error.errors);
    throw error;
  }
}

// 对比其他 Promise 方法
const promises = [
  Promise.reject("错误1"),
  Promise.resolve("成功"),
  Promise.reject("错误2"),
];

// Promise.any - 返回第一个成功的
Promise.any(promises).then(console.log); // '成功'

// Promise.race - 返回第一个完成的（无论成功失败）
Promise.race(promises).catch(console.log); // '错误1'

// Promise.all - 全部成功才成功
Promise.all(promises).catch(console.log); // '错误1'

// Promise.allSettled - 等待全部完成，返回所有结果
Promise.allSettled(promises).then(console.log);
// [
//   { status: 'rejected', reason: '错误1' },
//   { status: 'fulfilled', value: '成功' },
//   { status: 'rejected', reason: '错误2' }
// ]
```

### 5. WeakRef 和 FinalizationRegistry

弱引用和垃圾回收监听（高级特性）。

```javascript
// WeakRef - 创建对象的弱引用
// 不会阻止垃圾回收

class Cache {
  #cache = new Map();

  set(key, value) {
    // 存储弱引用，允许值被垃圾回收
    this.#cache.set(key, new WeakRef(value));
  }

  get(key) {
    const ref = this.#cache.get(key);
    if (ref) {
      const value = ref.deref(); // 获取引用的对象
      if (value !== undefined) {
        return value;
      }
      // 对象已被回收，清理缓存
      this.#cache.delete(key);
    }
    return undefined;
  }
}

// FinalizationRegistry - 对象被回收时执行回调
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`对象 "${heldValue}" 已被垃圾回收`);
});

function createTrackedObject(name) {
  const obj = { name };
  registry.register(obj, name); // 注册对象
  return obj;
}

let obj = createTrackedObject("测试对象");
obj = null; // 解除引用，对象可能被回收
// 稍后可能输出: '对象 "测试对象" 已被垃圾回收'
```

---

## 总结对比表

| 特性                               | 版本   | 用途              |
| ---------------------------------- | ------ | ----------------- |
| Promise.withResolvers()            | ES2024 | 简化 Promise 创建 |
| Object.groupBy()                   | ES2024 | 数组分组          |
| toSorted/toReversed/toSpliced/with | ES2023 | 不可变数组操作    |
| findLast/findLastIndex             | ES2023 | 从后查找          |
| 顶层 await                         | ES2022 | 模块顶层异步      |
| 私有字段 #                         | ES2022 | 真正的私有成员    |
| at()                               | ES2022 | 负索引访问        |
| Object.hasOwn()                    | ES2022 | 安全属性检查      |
| ??= &&= \|\|=                      | ES2021 | 逻辑赋值          |
| replaceAll()                       | ES2021 | 全部替换          |
| Promise.any()                      | ES2021 | 任一成功          |

---

## 浏览器兼容性

大部分现代浏览器（Chrome 90+, Firefox 90+, Safari 15+, Edge 90+）都支持这些特性。

对于生产环境，建议：

1. 使用 Babel 转译
2. 检查 [Can I Use](https://caniuse.com/) 确认兼容性
3. 使用 polyfill 提供向后兼容
