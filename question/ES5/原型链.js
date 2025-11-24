function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function () {
  console.log(this.name + " is eating");
};

function Dog(name, breed) {
  // 继承属性
  Animal.call(this, name);
  this.breed = breed;
}

Object.create = function (prototype) {
  function F() {}
  F.prototype = prototype;
  const newObj = new F();

  if (prototype === null) {
    Object.setPrototypeOf(newObj, null);
  }

  return newObj;
};

// 继承方法：将 Dog.prototype 的 __proto__ 指向 Animal.prototype
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function () {
  console.log(this.name + " is barking");
};

const dog = new Dog("旺财", "拉布拉多");
dog.eat(); // 旺财 is eating
dog.bark(); // 旺财 is barking

console.log(Dog.prototype.__proto__ === Animal.prototype);
console.log(Animal.prototype.__proto__ === Object.prototype);

console.log(Dog.prototype.__proto__);
