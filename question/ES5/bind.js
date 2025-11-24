Object.create = function (prototype) {
  function F() {}
  F.prototype = prototype;
  return new F();
};

Function.prototype.bind = function (oThis) {
  const F = this;
  const outerArgs = Array.prototype.slice.call(arguments, 1);

  function bound() {
    const args = outerArgs.concat(Array.prototype.slice.call(arguments));
    if (this instanceof bound) {
      console.log("这里", this);
      return F.apply(this, args);
    } else {
      const t =
        oThis === null || oThis === undefined ? globalThis : Object(oThis);
      return F.apply(t, args);
    }
  }

  if (F.prototype) {
    bound.prototype = Object.create(F.prototype);
  }

  return bound;
};

const obj1 = { name: "obj1" };
const obj2 = { name: "obj2" };
const obj3 = { name: "obj3" };
const obj4 = { name: "obj4" };
const obj5 = { name: "obj5" };
const obj6 = { name: "obj6" };

var value = 2;
var foo = {
  value: 1,
  bar: bar.bind(null),
};

function bar() {
  console.log(this.value);
}

foo.bar(); // 2

// function Animal(name, type) {
//   this.name = name;
//   this.type = type;
// }

// Animal.prototype.say = function () {
//   console.log(this);
//   console.log(this.name, this.type);
// };

// const F = Animal.bind(obj1, "小狗");

// const dog = new F("犬科");
// dog.say();

// function test() {
//   console.log(this.name);
// }

// test.bind(obj1).bind(obj2).bind(obj3).bind(obj4).bind(obj5).bind(obj6)();

Function.prototype.call = function (oThis, ...args) {
  if (typeof this !== "function") {
    throw new TypeError("call只能被函数调用");
  }

  const context =
    oThis === null || oThis === undefined ? globalThis : Object(oThis);

  const key = Symbol("key");
  context[key] = this;

  const ret = context[key](...args);

  delete context[key];

  return ret;
};

// ==================== ES5版本的call实现 ====================
// 不使用ES6+语法（没有扩展操作符、Symbol等）
Function.prototype.callES5 = function (oThis) {
  if (typeof this !== "function") {
    throw new TypeError("call只能被函数调用");
  }

  // 处理null和undefined的情况
  var context =
    oThis === null || oThis === undefined ? globalThis : Object(oThis);

  // 使用随机数作为临时属性名，避免与原对象属性冲突
  var key = "__temp_" + Math.random();
  context[key] = this;

  // 收集参数（从第二个参数开始）
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  // 直接调用（因为this已经是context）
  var ret;
  if (args.length > 0) {
    ret = context[key].apply(context, args);
  } else {
    ret = context[key]();
  }

  // 清理临时属性
  delete context[key];

  return ret;
};

// ==================== 使用eval的call实现 ====================
// 使用eval动态执行代码，不使用apply
Function.prototype.callEval = function (oThis) {
  if (typeof this !== "function") {
    throw new ReferenceError("call只能被函数调用");
  }

  var context =
    oThis === undefined || oThis === null ? globalThis : Object(oThis);
  var key = "__temp__" + Date.now();
  context[key] = this;

  var params = [];
  for (let i = 1; i < arguments.length; i++) {
    params.push("arguments[" + i + "]");
  }

  var code = "context['" + key + "']" + "(" + params.join(",") + ")";
  var ret = eval(code);

  delete context[key];

  return ret;
};

// ==================== 测试用例 ====================

console.log("\n=== callEval 方法测试 ===");

// 测试1: 基础 this 绑定
console.log("\n测试1: 基础 this 绑定");
const objTestEval1 = { value: 200 };
function testFuncEval1() {
  console.log("this.value =", this.value);
  return this.value;
}
const resultEval1 = testFuncEval1.callEval(objTestEval1);
console.log("返回值:", resultEval1, "✓");

// 测试2: 多参数传递
console.log("\n测试2: 多参数传递");
const objTestEval2 = { value: 0 };
function testFuncEval2(a, b, c) {
  this.value = a + b + c;
  return this.value;
}
const resultEval2 = testFuncEval2.callEval(objTestEval2, 4, 5, 6);
console.log("this.value =", objTestEval2.value, "返回值:", resultEval2, "✓");

console.log("\n=== callES5 方法测试 ===");

// 测试1: 基础 this 绑定
console.log("\n测试1: 基础 this 绑定");
const objTestES51 = { value: 100 };
function testFuncES51() {
  console.log("this.value =", this.value);
  return this.value;
}
const resultES51 = testFuncES51.callES5(objTestES51);
console.log("返回值:", resultES51, "✓");

// 测试2: 多参数传递
console.log("\n测试2: 多参数传递");
const objTestES52 = { value: 0 };
function testFuncES52(a, b, c) {
  this.value = a + b + c;
  return this.value;
}
const resultES52 = testFuncES52.callES5(objTestES52, 1, 2, 3);
console.log("this.value =", objTestES52.value, "返回值:", resultES52, "✓");

console.log("\n=== call 方法测试 ===");

// 测试1: 基础 this 绑定
console.log("\n测试1: 基础 this 绑定");
const objTest1 = { value: 100 };
function testFunc1() {
  console.log("this.value =", this.value);
  return this.value;
}
const result1 = testFunc1.call(objTest1);
console.log("返回值:", result1, "✓");

// 测试2: 传入 null
console.log("\n测试2: 传入 null");
const result2 = testFunc1.call(null);
console.log("返回 globalThis.value:", result2, "✓");

// 测试3: 传入 undefined
console.log("\n测试3: 传入 undefined");
const result3 = testFunc1.call(undefined);
console.log("返回 globalThis.value:", result3, "✓");

// 测试4: 传入原始值（数字）
console.log("\n测试4: 传入原始值（数字）");
const result4 = testFunc1.call(42);
console.log("this.value =", this.value, "创建了临时对象");

// 测试5: 传入原始值（字符串）
console.log("\n测试5: 传入原始值（字符串）");
const result5 = testFunc1.call("hello");
console.log("临时对象创建", "✓");

// 测试6: 传入原始值（布尔值）
console.log("\n测试6: 传入原始值（布尔值）");
const result6 = testFunc1.call(true);
console.log("临时对象创建", "✓");

// 测试7: 多参数传递
console.log("\n测试7: 多参数传递");
const objTest7 = { value: 0 };
function testFunc7(a, b, c) {
  this.value = a + b + c;
  return this.value;
}
const result7 = testFunc7.call(objTest7, 1, 2, 3);
console.log("this.value =", objTest7.value, "返回值:", result7, "✓");

// 测试8: 返回值处理
console.log("\n测试8: 返回值处理");
const objTest8 = { value: 999 };
function testFunc8() {
  return { success: true, data: this.value };
}
const result8 = testFunc8.call(objTest8);
console.log("返回值对象:", result8, "✓");

// 测试9: 箭头函数的 this 无法被修改（作为对比）
console.log("\n测试9: 箭头函数 this 绑定（作为对比）");
const objTest9 = { value: "obj9" };
const arrowFunc = () => {
  console.log("arrow this:", this);
  return this;
};
const result9 = arrowFunc.call(objTest9);
console.log("箭头函数 this 无法被修改", "✓");

// 测试10: 方法调用
console.log("\n测试10: 方法调用");
const objTest10 = {
  name: "testObj",
  greet(prefix, suffix) {
    return `${prefix} ${this.name} ${suffix}`;
  },
};
const result10 = objTest10.greet.call({ name: "other" }, "Hello", "!");
console.log("方法调用结果:", result10, "✓");

// 测试11: 与内置 call 对比
console.log("\n测试11: 与内置 call 对比");
function testFunc11(x, y) {
  return this.num + x + y;
}
const objTest11 = { num: 10 };
const customResult = testFunc11.call(objTest11, 5, 3);
const nativeResult = testFunc11.call.call(testFunc11, objTest11, 5, 3);
console.log("自定义实现结果:", customResult);
console.log("原生 call 结果:", nativeResult);
console.log("结果一致:", customResult === nativeResult, "✓");
