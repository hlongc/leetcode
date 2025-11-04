class Animal {
  constructor() {
    this.name = "Animal";
  }
  // 方法默认是不可枚举的
  say() {
    console.log("Animal say");
  }
}

const obj = Object.create(Animal.prototype);
Reflect.defineProperty(obj, "testKey", {
  value: "testValue",
  enumerable: false,
  configurable: true,
  writable: true,
});
const symbolKey = Symbol("symbolKey");
obj[symbolKey] = "symbolValue";
obj.name = "obj";
obj.age = 18;
obj[12] = "numberValue";
// 循环遍历自身和继承的可枚举属性，不包括Symbol和不可枚举属性
for (const key in obj) {
  console.log("for (const key in obj)", key);
}

// 返回对象自身的可枚举属性键的数组，不包括Symbol和不可枚举属性
console.log("Object.keys(obj)", Object.keys(obj));
// 返回对象自身的所有属性键的数组，无论是否可枚举，不包括Symbol
console.log("Object.getOwnPropertyNames(obj)", Object.getOwnPropertyNames(obj));
// 返回对象自身的所有Symbol属性键的数组
console.log(
  "Object.getOwnPropertySymbols(obj)",
  Object.getOwnPropertySymbols(obj)
);
// 返回对象自身的所有属性键的数组，无论是否可枚枚举
console.log("Reflect.ownKeys(obj)", Reflect.ownKeys(obj));
