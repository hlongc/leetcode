# var、let 和 const 区别的实现原理

JavaScript 中的`var`、`let`和`const`是用于声明变量的三种方式，它们在行为和底层实现上有很大差异。本文将详细分析这三种声明方式的区别及其实现原理。

## 一、核心区别概述

| 特性       | var                    | let                    | const                            |
| ---------- | ---------------------- | ---------------------- | -------------------------------- |
| 作用域     | 函数作用域             | 块级作用域             | 块级作用域                       |
| 变量提升   | 是                     | 否（存在暂时性死区）   | 否（存在暂时性死区）             |
| 重复声明   | 允许                   | 同一作用域内不允许     | 同一作用域内不允许               |
| 全局声明   | 成为全局对象属性       | 不成为全局对象属性     | 不成为全局对象属性               |
| 初始化要求 | 无要求，默认 undefined | 无要求，默认 undefined | 必须初始化赋值                   |
| 可修改性   | 可修改                 | 可修改                 | 引用不可修改（但对象属性可修改） |

## 二、var 的实现原理

### 1. 变量提升（Hoisting）机制

`var`声明的变量会在执行环境（执行上下文）创建时被提升到作用域顶部，但初始化操作保留在原位置。

```javascript
console.log(a); // 输出: undefined（不会报错）
var a = 10;
console.log(a); // 输出: 10
```

**内部实现原理**：JavaScript 引擎在编译阶段会将变量声明提升，相当于：

```javascript
var a; // 声明提升到顶部，初始化为undefined
console.log(a);
a = 10; // 初始化操作保留在原位置
console.log(a);
```

### 2. 函数作用域（Function Scope）

`var`声明的变量只能是**全局作用域**或**函数作用域**，不受块级作用域（如`if`语句、`for`循环）的限制。

```javascript
function example() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 输出: 10（x在整个函数内可访问）
}
example();

console.log(x); // 报错: x is not defined（函数外不可访问）
```

**内部实现原理**：JavaScript 引擎在创建执行上下文时，会为`var`声明的变量在当前函数的变量对象（Variable Object）中创建属性，而非块级作用域。

### 3. 全局对象的属性

在全局作用域中用`var`声明的变量会成为全局对象（浏览器中的`window`或 Node.js 中的`global`）的属性。

```javascript
var globalVar = "global";
console.log(window.globalVar); // 浏览器中输出: "global"
```

**内部实现原理**：全局执行上下文的变量对象就是全局对象本身，因此`var`声明会直接在全局对象上创建属性。

### 4. 允许重复声明

同一作用域内可以多次使用`var`重复声明同一个变量，后面的声明会覆盖前面的。

```javascript
var counter = 1;
function increment() {
  var counter = counter + 1; // 这里实际上是在函数内重新声明了counter
  console.log(counter); // 输出: NaN（undefined + 1）
}
increment();
```

**内部实现原理**：JavaScript 引擎在处理重复声明时，只会保留一个变量，但会执行每次的赋值操作。

## 三、let 的实现原理

### 1. 块级作用域（Block Scope）

`let`声明的变量具有块级作用域，仅在声明它的块（由`{}`定义）内可访问。

```javascript
function blockScopeExample() {
  if (true) {
    let blockVar = 20;
    console.log(blockVar); // 输出: 20
  }
  console.log(blockVar); // 报错: blockVar is not defined
}
blockScopeExample();
```

**内部实现原理**：JavaScript 引擎在执行代码时维护一个**词法环境**（Lexical Environment）链，在进入代码块时创建新的词法环境，`let`变量绑定到当前块的词法环境中。

### 2. 暂时性死区（Temporal Dead Zone, TDZ）

在块作用域内，使用`let`声明的变量在声明前不可访问（不存在变量提升）。

```javascript
function tdzExample() {
  console.log(tdzVar); // 报错: Cannot access 'tdzVar' before initialization
  let tdzVar = 30;
}
tdzExample();
```

**内部实现原理**：

1. 当 JavaScript 引擎扫描代码并发现`let`声明时，会将该变量记录在当前块的词法环境中，但标记为"未初始化"
2. 在词法环境中创建变量与实际执行声明语句之间的这段时间，变量处于"暂时性死区"中
3. 在此期间访问变量会触发运行时错误
4. 只有执行完声明语句后，变量才可以安全使用

### 3. 禁止重复声明

`let`不允许在同一块作用域内重复声明同一个变量。

```javascript
function duplicateExample() {
  let dupVar = 40;
  let dupVar = 50; // 报错: Identifier 'dupVar' has already been declared
}
duplicateExample();
```

**内部实现原理**：JavaScript 引擎在处理`let`声明时会检查当前词法环境中是否已存在同名变量，如果存在则抛出语法错误。

### 4. 不绑定全局对象

全局作用域中用`let`声明的变量不会成为全局对象的属性。

```javascript
let globalLetVar = "not global property";
console.log(window.globalLetVar); // 输出: undefined
console.log(globalLetVar); // 输出: "not global property"
```

**内部实现原理**：全局`let`变量存储在一个特殊的声明性环境记录（Declarative Environment Record）中，而非全局对象的环境记录（Object Environment Record）中。

## 四、const 的实现原理

### 1. 与 let 共同的特性

`const`与`let`共享以下特性，实现原理也相同：

- 块级作用域
- 暂时性死区
- a.禁止重复声明
- 不绑定全局对象

### 2. 必须初始化

`const`声明的变量必须在声明时进行初始化（赋值）。

```javascript
const requiredInit; // 报错: Missing initializer in const declaration
```

**内部实现原理**：JavaScript 引擎在语法分析阶段就会检查`const`声明是否包含初始化器，如果没有则抛出语法错误。

### 3. 不可重新赋值

`const`声明的变量创建了一个不可变的绑定，不能重新赋值。

```javascript
const fixedValue = 100;
fixedValue = 200; // 报错: Assignment to constant variable
```

**内部实现原理**：

1. `const`变量在词法环境中被标记为"只读"
2. 尝试修改绑定值（重新赋值）时，JavaScript 引擎会检查变量是否为"只读"，如果是则抛出运行时错误
3. 注意：只是绑定不可变，如果绑定的是对象，对象的内容仍然可以修改

```javascript
const user = { name: "Alice" };
user.name = "Bob"; // 这是允许的，修改的是对象属性
user = { name: "Charlie" }; // 报错: Assignment to constant variable
```

## 五、执行上下文与词法环境的实现差异

要理解这三种声明方式的底层原理，需要了解 JavaScript 引擎如何处理执行上下文（Execution Context）和词法环境（Lexical Environment）。

### 1. var 的处理流程（ES5 规范）

```javascript
function varExample() {
  var x = 10;
  if (true) {
    var y = 20;
  }
  console.log(x, y);
}
```

**执行过程**：

1. 创建函数执行上下文
2. 创建变量对象（VO），扫描`var`声明和函数声明
3. `x`和`y`都被添加到函数的变量对象中，初始值为`undefined`
4. 执行代码，为`x`和`y`赋值
5. 函数执行完毕，其执行上下文从栈中弹出

### 2. let/const 的处理流程（ES6 规范）

```javascript
function letConstExample() {
  let x = 10;
  if (true) {
    const y = 20;
    console.log(x, y); // 10, 20
  }
  console.log(x); // 10
  console.log(y); // 报错
}
```

**执行过程**：

1. 创建函数执行上下文
2. 创建词法环境（Lexical Environment）
   - 函数级词法环境包含`x`，标记为可修改/不可修改（取决于 let/const）
   - 进入 if 块时创建新的块级词法环境，包含`y`，标记为不可修改（const）
   - 块级环境的 outer 引用指向函数级环境，形成环境链
3. 执行代码：
   - 访问变量时，引擎沿词法环境链查找
   - 离开 if 块时，块级词法环境被销毁，`y`变得不可访问
4. 函数执行完毕，其执行上下文和词法环境从栈中弹出

## 六、案例分析：展示核心差异

### 案例 1：循环中的闭包问题

**使用 var：**

```javascript
function createFunctions() {
  var functions = [];
  for (var i = 0; i < 3; i++) {
    functions.push(function () {
      console.log(i);
    });
  }
  return functions;
}

var fs = createFunctions();
fs[0](); // 输出: 3
fs[1](); // 输出: 3
fs[2](); // 输出: 3
```

**原理解释**：

- `var i`声明在函数作用域中，只有一个`i`
- 循环结束后`i`变为 3
- 所有闭包函数引用的是同一个`i`

**使用 let：**

```javascript
function createFunctions() {
  var functions = [];
  for (let i = 0; i < 3; i++) {
    functions.push(function () {
      console.log(i);
    });
  }
  return functions;
}

var fs = createFunctions();
fs[0](); // 输出: 0
fs[1](); // 输出: 1
fs[2](); // 输出: 2
```

**原理解释**：

- 每次循环迭代都会创建新的词法环境
- 每个闭包捕获的是各自迭代中的`i`值
- JavaScript 引擎内部会为每次迭代"记住"这个`i`的值

### 案例 2：暂时性死区的细节

```javascript
function tdzDetail() {
  const condition = true;

  if (condition) {
    console.log(value); // 报错: Cannot access 'value' before initialization
    let value = "TDZ Example";
  }
}
```

**原理解释**：

- 块级作用域存在于执行进入块时到声明变量前这段时间
- 虽然变量"存在"于块中，但在声明前处于"未初始化"状态
- 即使外部作用域有同名变量，也无法访问（被"遮蔽"）

### 案例 3：对象不变性与 const

```javascript
const user = {
  name: "Alice",
  profile: {
    age: 25,
  },
};

// 这些操作都是允许的
user.name = "Bob";
user.profile.age = 30;
user.location = "New York";

// 这个操作不允许
user = { name: "Charlie" }; // 报错
```

**原理解释**：

- `const`只确保引用（绑定）本身不变
- 对象的内部结构可以更改
- JavaScript 的对象是可变的，除非使用`Object.freeze()`等方法额外保护

### 案例 4：`let`/`const`在循环中的特殊处理

`for`循环中的`let`和`const`有特殊处理：

```javascript
// 使用let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 0, 1, 2

// 使用var
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 3, 3, 3
```

**原理解释**：

- 对于`let`，每次迭代都会创建新的变量绑定
- `setTimeout`中的函数形成闭包，捕获每次迭代的变量
- 而`var`声明只有一个变量，循环结束后变量值为 3

## 七、总结：底层实现机制的区别

1. **var 的实现**：

   - 基于旧的变量对象（Variable Object）机制
   - 变量声明提升到函数作用域顶部
   - 可重复声明，后面的覆盖前面的
   - 全局声明成为全局对象属性

2. **let/const 的实现**：

   - 基于 ES6 词法环境（Lexical Environment）机制
   - 声明不提升，存在暂时性死区
   - 在词法环境中创建块级绑定
   - 禁止重复声明，独立存储（不与全局对象关联）
   - `const`额外增加只读标记，禁止重新赋值

3. **主要区别的技术实现**：
   - 作用域差异：函数变量对象 vs 块级词法环境
   - 提升行为：创建并初始化为`undefined` vs 创建但标记为"未初始化"
   - 重复声明：覆盖 vs 抛出错误
   - 可变性：`const`实现了对引用的"只读"保护

通过理解这些底层实现差异，我们可以更好地选择适合特定场景的声明方式，编写更安全、更可维护的 JavaScript 代码。
