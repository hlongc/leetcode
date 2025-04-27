# call 和 apply 的区别、性能比较及实现原理

## 一、call 和 apply 的区别

`call` 和 `apply` 是 JavaScript 中用于改变函数执行上下文（即 `this` 指向）的两个方法，它们都定义在 `Function.prototype` 上，但在参数传递方式上有明显区别：

### 语法对比

```javascript
// call 语法
function.call(thisArg, arg1, arg2, ...);

// apply 语法
function.apply(thisArg, [argsArray]);
```

### 主要区别

1. **参数传递方式**：

   - `call`：参数逐个传递，第一个参数后的所有参数会被当作被调用函数的参数。
   - `apply`：除第一个参数外，只接受一个数组（或类数组对象）作为后续参数。

2. **适用场景**：
   - 当已知参数个数且较少时，`call` 可能更直观。
   - 当参数存在于数组中或参数数量不确定时，`apply` 更方便。

### 实际使用示例

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, ${this.name}${punctuation}`);
}

const person = { name: "张三" };

// call 方式
greet.call(person, "你好", "!"); // 输出：你好, 张三!

// apply 方式
greet.apply(person, ["你好", "!"]); // 输出：你好, 张三!
```

### 功能等价转换

`call` 和 `apply` 可以相互转换：

```javascript
// apply 转 call
function usingApply(fn, thisArg, args) {
  return fn.apply(thisArg, args);
}

// 等价的 call 实现
function usingCall(fn, thisArg, args) {
  return fn.call(thisArg, ...args);
}
```

## 二、性能比较

在现代 JavaScript 引擎中，`call` 和 `apply` 的性能差异主要体现在参数处理上。

### 性能差异原因

1. **参数处理开销**：

   - `apply` 需要进行数组解构，这在早期的 JavaScript 引擎中会带来额外开销。
   - `call` 直接传递参数，避免了数组解构的步骤。

2. **参数数量影响**：
   - 参数较少时，`call` 通常会更快。
   - 参数很多时，差异可能不明显。

### 性能测试结果

以下是在不同场景下的典型性能比较结果：

#### 少量参数场景（3 个参数以内）

```javascript
// 测试函数
function test(a, b, c) {
  return a + b + c;
}

// call 通常比 apply 快 5-15%
// 具体数值取决于浏览器引擎和运行环境
```

#### 大量参数场景（10 个以上参数）

```javascript
// 大量参数时
// ES6 之前：apply 略优于 call
// ES6 之后：call 配合扩展运算符与 apply 差异不大
```

### 现代 JavaScript 的变化

ES6 引入的扩展运算符（`...`）改变了这一局面：

```javascript
function test() {
  // 一些操作
}

const args = [1, 2, 3];

// 现代写法
test.call(null, ...args); // 性能接近甚至优于 apply
test.apply(null, args);
```

### 性能建议

1. **针对少量固定参数**：优先使用 `call`
2. **针对已有数组参数**：
   - ES6 环境：`fn.call(obj, ...args)` 或 `fn.apply(obj, args)` 都可以
   - ES5 环境：`fn.apply(obj, args)` 更简洁
3. **高性能场景**：如果在性能关键代码中，考虑直接使用函数并显式设置上下文而不是依赖 `call/apply`

## 三、手动实现 call 和 apply

我们可以通过理解 `call` 和 `apply` 的工作原理来实现自己的版本：

### 实现 myCall

ES6 实现更简洁：

```javascript
Function.prototype.myCall = function (context, ...args) {
  // 处理 null 或 undefined 情况
  context = context || window;

  // 将原始类型转换为对象
  context = Object(context);

  // 生成唯一属性名，避免属性冲突
  const fnSymbol = Symbol("fn");

  // 将调用函数设为对象的方法
  context[fnSymbol] = this;

  // 执行函数
  const result = context[fnSymbol](...args);

  // 删除添加的方法
  delete context[fnSymbol];

  // 返回结果
  return result;
};
```

### 实现 myApply

```javascript
Function.prototype.myApply = function (context, argsArray) {
  // 处理 null 或 undefined 情况
  context = context || window;

  // 将原始类型转换为对象
  context = Object(context);

  // 将调用函数设为对象的方法
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;

  // 执行并获取结果
  let result;

  // 处理参数不存在的情况
  if (!argsArray) {
    result = context[fnSymbol]();
  } else {
    // 确保 argsArray 是数组或类数组对象
    if (
      !Array.isArray(argsArray) &&
      !(argsArray instanceof Object) &&
      !("length" in argsArray)
    ) {
      throw new TypeError("第二个参数必须是数组或类数组对象");
    }
    result = context[fnSymbol](...argsArray);
  }

  // 删除添加的方法
  delete context[fnSymbol];

  // 返回结果
  return result;
};
```

### 实现过程中的要点

1. **处理上下文**：

   - 如果传入的 `context` 是 `null` 或 `undefined`，应默认为全局对象（浏览器中为 `window`）
   - 需要将非对象类型的 `context` 转换为对象（使用 `Object(context)` 进行转换）
   - 这种转换的行为：
     - `Object(null)` 和 `Object(undefined)` 返回一个空对象 `{}`
     - `Object(1)` 返回 `Number {1}`，一个数字包装对象
     - `Object('string')` 返回 `String {'string'}`，一个字符串包装对象
     - `Object(true)` 返回 `Boolean {true}`，一个布尔包装对象

2. **函数执行**：

   - 将原函数作为 `context` 的一个属性
   - 通过对象方法调用方式执行函数，从而改变 `this` 指向
   - 实际应用中应考虑使用 `Symbol` 等方式避免属性名冲突

3. **参数传递**：

   - `call` 需要处理任意数量的参数
   - `apply` 需要处理数组参数，并验证第二个参数是否为数组或类数组对象

4. **返回值处理**：
   - 需要保留原函数的返回值

### 完整的 ES5 实现（不使用 Symbol 和扩展运算符）

为了完整性，这里提供一个 ES5 兼容的实现版本：

```javascript
// ES5实现myCall
Function.prototype.myCall = function (context) {
  // 处理null或undefined情况
  var ctx = context || window;

  // 将原始类型转换为对象
  ctx = Object(ctx);

  // 创建一个唯一的属性名
  var fnKey = "__fn__" + Date.now();

  // 将调用函数设为对象的方法
  ctx[fnKey] = this;

  // 获取参数
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push("arguments[" + i + "]");
  }

  // 执行函数并获取结果 (使用eval执行字符串形式的函数调用)
  var result = eval("ctx[fnKey](" + args + ")");

  // 删除添加的方法
  delete ctx[fnKey];

  // 返回结果
  return result;
};

// ES5实现myApply
Function.prototype.myApply = function (context, argsArray) {
  // 处理null或undefined情况
  var ctx = context || window;

  // 将原始类型转换为对象
  ctx = Object(ctx);

  // 创建一个唯一的属性名
  var fnKey = "__fn__" + Date.now();

  // 将调用函数设为对象的方法
  ctx[fnKey] = this;

  // 执行并获取结果
  var result;

  if (!argsArray) {
    // 无参数情况
    result = ctx[fnKey]();
  } else {
    // 检查参数是否为类数组
    if (
      Object.prototype.toString.call(argsArray) !== "[object Array]" &&
      typeof argsArray.length !== "number"
    ) {
      throw new TypeError("第二个参数必须是数组或类数组对象");
    }

    // 构建参数字符串
    var args = [];
    for (var i = 0; i < argsArray.length; i++) {
      args.push("argsArray[" + i + "]");
    }

    // 执行函数
    result = eval("ctx[fnKey](" + args + ")");
  }

  // 删除添加的方法
  delete ctx[fnKey];

  // 返回结果
  return result;
};
```

### 原始类型处理的行为验证

通过以下示例可以验证我们实现的对原始类型转换的效果：

```javascript
function showThis() {
  console.log(this);
  return this;
}

// 使用内置的call
console.log("内置 call 的结果:");
showThis.call(1); // Number {1}
showThis.call("hello"); // String {'hello'}
showThis.call(true); // Boolean {true}
showThis.call(null); // window对象
showThis.call(undefined); // window对象

// 使用我们实现的myCall
console.log("自定义 myCall 的结果:");
showThis.myCall(1); // Number {1}
showThis.myCall("hello"); // String {'hello'}
showThis.myCall(true); // Boolean {true}
showThis.myCall(null); // 空对象{} (在标准call中是window)
showThis.myCall(undefined); // 空对象{} (在标准call中是window)
```

这种行为差异说明了一点：JavaScript 内置的`call`和`apply`对 null 和 undefined 的处理是特殊的，直接使用了全局对象，而不是像其他原始类型一样进行对象包装。我们的实现在此处略有不同，但核心原理是一致的。

## 四、实际应用场景

了解 `call`
