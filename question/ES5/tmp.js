function fn1() {
  console.log(1);
  this.num = 111;
  this.sayHey = function () {
    console.log("say hey.");
  };
}
function fn2() {
  console.log(2);
  this.num = 222;
  this.sayHello = function () {
    console.log("say hello.");
  };
}
fn1.call(fn2); // 1

fn1(); // 1
fn1.num; // undefined
fn1.sayHey(); // fn1.sayHey is not a function

fn2(); // 2
fn2.num; // 111
fn2.sayHello(); // fn2.sayHello is not a function

fn2.sayHey(); //say hey.

/* 
代码解释和输出分析：

1. fn1.call(fn2) 输出 1
   - call方法改变了fn1中this的指向，使其指向fn2
   - 执行fn1函数体，console.log(1)输出1
   - this.num = 111 相当于 fn2.num = 111，覆盖了fn2中原有的num值
   - this.sayHey = function(){...} 相当于给fn2添加了sayHey方法

2. fn1() 输出 1
   - 正常调用fn1函数，输出1
   - 此时this指向全局对象(非严格模式下)或undefined(严格模式下)
   - 在全局对象上设置了num属性和sayHey方法

3. fn1.num 结果是 undefined
   - 这里访问的是函数对象fn1的num属性，而不是执行fn1()后设置的全局num
   - 函数对象fn1上没有定义num属性，所以返回undefined

4. fn1.sayHey() 报错：fn1.sayHey is not a function
   - 同理，函数对象fn1上没有sayHey方法
   - sayHey被添加到了全局对象上(fn1()调用时)和fn2上(fn1.call(fn2)调用时)，而不是fn1上

5. fn2() 输出 2
   - 正常调用fn2函数，输出2
   - 执行this.num = 222，但由于之前fn1.call(fn2)已经将fn2.num设为111，
     现在又将其重置为222
   - 执行this.sayHello将sayHello方法添加到全局对象上

6. fn2.num 结果是 111
   - 这里访问的是函数对象fn2的num属性
   - 由于之前fn1.call(fn2)执行时，将111赋值给了fn2.num
   - 虽然fn2()执行时又将全局对象的num设为222，但这不影响fn2对象上的num属性

7. fn2.sayHello() 报错：fn2.sayHello is not a function
   - 函数对象fn2上没有sayHello方法
   - sayHello方法是在执行fn2()时添加到全局对象上的，而不是fn2上

8. fn2.sayHey() 输出 "say hey."
   - 在fn1.call(fn2)执行时，sayHey方法被添加到了fn2对象上
   - 因此fn2.sayHey()能够正常调用并输出"say hey."

关键点总结：
1. call/apply可以改变函数内部this的指向
2. 函数作为对象和函数调用时的行为不同
3. this的指向在函数调用时才确定，取决于调用方式
4. 直接调用函数时(fn1())，this指向全局对象(非严格模式)
5. 修改和访问的对象属性取决于this的指向
*/
