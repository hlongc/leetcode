/**
 * ES5与ES6继承的主要区别
 *
 * 本文件详细解释ES5和ES6继承的区别，不仅包括语法上的差异，
 * 还包括底层机制、功能特性和使用限制等方面的不同。
 */

// =====================================================
// 一、构造函数执行顺序的不同
// =====================================================

// ES5的继承：先创建子类的实例对象this，再将父类的属性方法添加到this上
console.log("=== ES5继承中的构造函数执行顺序 ===");
function Animal5(name) {
  console.log("Animal5构造函数执行");
  this.name = name;
  this.type = "animal";
}

function Dog5(name, breed) {
  console.log("Dog5构造函数执行");
  // 先创建子类的this，再调用父类构造函数修饰this
  Animal5.call(this, name); // 通过call将父类属性添加到子类实例
  this.breed = breed;
}

// 设置原型链，实现方法继承
Dog5.prototype = Object.create(Animal5.prototype);
Dog5.prototype.constructor = Dog5;

// ES6的继承：先创建父类的实例对象this，然后再用子类的构造函数修改this
console.log("\n=== ES6继承中的构造函数执行顺序 ===");
class Animal6 {
  constructor(name) {
    console.log("Animal6构造函数执行");
    this.name = name;
    this.type = "animal";
  }
}

class Dog6 extends Animal6 {
  constructor(name, breed) {
    console.log("Dog6构造函数中super调用前的代码"); // 这行会报错，因为必须先调用super()
    super(name); // 先调用父类构造函数创建this
    console.log("Dog6构造函数中super调用后的代码");
    this.breed = breed;
  }
}

// 测试构造函数执行顺序
const dog5 = new Dog5("旺财", "金毛");
const dog6 = new Dog6("小黑", "拉布拉多");

// =====================================================
// 二、原型链结构的不同
// =====================================================

console.log("\n=== ES5与ES6的原型链结构区别 ===");

// ES5原型链演示
function Parent5() {
  this.name = "parent5";
}
Parent5.prototype.getName = function () {
  return this.name;
};

function Child5() {
  Parent5.call(this);
  this.age = 12;
}

// ES5继承的核心步骤
Child5.prototype = Object.create(Parent5.prototype);
Child5.prototype.constructor = Child5;

// 静态方法需要单独继承
Parent5.staticMethod = function () {
  return "父类的静态方法";
};
Child5.staticMethod = Parent5.staticMethod;

console.log("ES5静态方法继承需要手动实现:", Child5.staticMethod());

// ES6原型链演示
class Parent6 {
  constructor() {
    this.name = "parent6";
  }

  getName() {
    return this.name;
  }

  static staticMethod() {
    return "父类的静态方法";
  }
}

class Child6 extends Parent6 {
  constructor() {
    super();
    this.age = 12;
  }
}

console.log("ES6自动继承静态方法:", Child6.staticMethod());

// =====================================================
// 三、__proto__属性的区别
// =====================================================

console.log("\n=== ES5与ES6的__proto__属性区别 ===");

// ES5中子类的__proto__指向Function.prototype
console.log(
  "ES5中Child5.__proto__ === Function.prototype:",
  Child5.__proto__ === Function.prototype
);

// ES6中子类的__proto__指向父类本身
console.log("ES6中Child6.__proto__ === Parent6:", Child6.__proto__ === Parent6);

// =====================================================
// 四、继承内置类的区别
// =====================================================

console.log("\n=== 继承内置类的表现区别 ===");

// ES5很难正确继承内置类
function MyArray5() {
  Array.apply(this, arguments);
}
MyArray5.prototype = Object.create(Array.prototype);
MyArray5.prototype.constructor = MyArray5;

var arr5 = new MyArray5(1, 2, 3);
console.log("ES5继承内置Array后的length:", arr5.length); // 可能为0，而不是预期的3
arr5.push(4);
console.log("ES5 push后的长度:", arr5.length); // 表现不正常

// ES6可以正确继承内置类
class MyArray6 extends Array {
  constructor(...args) {
    super(...args);
  }
}

const arr6 = new MyArray6(1, 2, 3);
console.log("ES6继承内置Array后的length:", arr6.length); // 正确为3
arr6.push(4);
console.log("ES6 push后的长度:", arr6.length); // 正确为4

// =====================================================
// 五、super关键字
// =====================================================

console.log("\n=== super关键字的使用 ===");

// ES5中没有super关键字，需要通过以下方式调用父类方法
function Base5() {
  this.value = 123;
}
Base5.prototype.getValue = function () {
  return this.value;
};

function Derived5() {
  Base5.call(this); // 调用父类构造函数
}
Derived5.prototype = Object.create(Base5.prototype);
Derived5.prototype.constructor = Derived5;

// 调用父类方法需要显式指定上下文
Derived5.prototype.getValue = function () {
  // ES5中调用父类方法的方式
  return Base5.prototype.getValue.call(this) + 100;
};

// ES6中可以通过super关键字优雅地引用父类
class Base6 {
  constructor() {
    this.value = 123;
  }

  getValue() {
    return this.value;
  }
}

class Derived6 extends Base6 {
  constructor() {
    super(); // 调用父类构造函数
  }

  getValue() {
    // ES6中直接通过super调用父类方法
    return super.getValue() + 100;
  }
}

const derived5 = new Derived5();
const derived6 = new Derived6();

console.log("ES5中调用父类方法:", derived5.getValue()); // 223
console.log("ES6中调用父类方法:", derived6.getValue()); // 223

// =====================================================
// 总结：ES5和ES6继承的主要区别
// =====================================================

/**
 * ES5和ES6继承的核心区别：
 *
 * 1. 构造函数执行顺序:
 *    - ES5: 先创建子类实例，再将父类实例属性添加到子类上
 *    - ES6: 先创建父类实例，再将子类实例属性添加到this上
 *
 * 2. 调用父类构造函数的方式:
 *    - ES5: 使用 Parent.call(this, ...args)
 *    - ES6: 使用 super(...args)，且必须在使用this之前调用
 *
 * 3. 原型链设置方式:
 *    - ES5: 需要手动设置子类原型：Child.prototype = Object.create(Parent.prototype)
 *    - ES6: 通过extends自动设置原型链
 *
 * 4. 静态方法继承:
 *    - ES5: 不会自动继承静态方法，需要手动复制
 *    - ES6: 会自动继承父类的静态方法
 *
 * 5. 内置类继承:
 *    - ES5: 很难正确继承内置类（如Array、Error等）
 *    - ES6: 可以轻松地继承内置类，并正确识别子类的实例
 *
 * 6. __proto__属性指向:
 *    - ES5: 子类.__proto__ === Function.prototype
 *    - ES6: 子类.__proto__ === 父类
 *
 * 7. 底层实现:
 *    - ES5: 是先创建子类实例，再执行父类构造函数的属性拷贝
 *    - ES6: 是先调用父类的构造函数创建实例，然后再修改实例
 *
 * 8. 使用方式:
 *    - ES5: 需要写大量样板代码实现继承
 *    - ES6: 通过简洁的class/extends语法实现继承
 */
