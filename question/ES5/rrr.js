class Person {
  constructor(name) {
    this.name = name;
  }

  // 实例方法：this 指向实例
  sayHello() {
    console.log("实例方法 this:", this);
    console.log("我是", this.name);
  }

  // 静态方法：this 指向类本身
  static introduce() {
    console.log("静态方法 this:", this);
    console.log("this === Person:", this === Person);
    console.log("this.name:", this.name); // 类的 name 属性
  }

  static createAdmin() {
    console.log("静态方法中的 this:", this);
    // this 就是 Person 类，可以用来创建实例
    return new this("Admin");
  }
}

// 测试
const person = new Person("张三");

person.sayHello();
// 输出：
// 实例方法 this: Person { name: '张三' }
// 我是 张三

Person.introduce();
// 输出：
// 静态方法 this: [class Person]
// this === Person: true
// this.name: Person

const admin = Person.createAdmin();
console.log(admin);
// 输出：Person { name: 'Admin' }

function tag(strings, ...values) {
  console.log("strings 数组:", strings);
  console.log("values 数组:", values);

  // strings 有一个特殊属性：raw（原始字符串）
  console.log("strings.raw:", strings.raw);

  // 通常这样重建完整字符串
  let result = "";
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      result += values[i];
    }
  });
  return result;
}

const name = "Alice";
const score = 95;

const result = tag`Student ${name} scored ${score} points!`;

console.log("返回结果:", result);

async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
  setTimeout(() => {
    console.log("timer1");
  }, 0);
}
async function async2() {
  setTimeout(() => {
    console.log("timer2");
  }, 0);
  console.log("async2");
}
async1();
setTimeout(() => {
  console.log("timer3");
}, 0);
console.log("start");

const time = (timer) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timer);
  });
};
const ajax1 = () =>
  time(2000).then(() => {
    console.log(1);
    return 1;
  });
const ajax2 = () =>
  time(1000).then(() => {
    console.log(2);
    return 2;
  });
const ajax3 = () =>
  time(1000).then(() => {
    console.log(3);
    return 3;
  });

function mergePromise(list) {
  // 在这里写代码

  return new Promise(async (resolve) => {
    const ret = [];

    for (const item of list) {
      ret.push(await item());
    }

    resolve(ret);
  });
}

mergePromise([ajax1, ajax2, ajax3]).then((data) => {
  console.log("done");
  console.log(data); // data 为 [1, 2, 3]
});

async function concurrent(promises, limit) {
  const queue = new Set();
  const ret = [];

  for (const p of promises) {
    if (queue.size >= limit) {
      await Promise.race(queue);
    }

    const newP = p.then((r) => {
      ret.push(r);
      queue.delete(newP);
    });

    queue.add(newP);
  }

  await Promise.all(queue);
  return ret;
}

// 要求分别输出
// 1
// 2
// 3
// done
// [1, 2, 3]
