/**
 * ============================================
 * JavaScript Decorator（装饰器）详解
 * ============================================
 *
 * 注意：JavaScript 中的 Decorator 目前还是 Stage 3 提案，尚未正式纳入标准。
 * 但在 TypeScript、Babel 等工具中已经支持。
 *
 * 要使用 decorator，需要配置：
 * - TypeScript: tsconfig.json 中设置 "experimentalDecorators": true
 * - Babel: 使用 @babel/plugin-proposal-decorators 插件
 *
 * ============================================
 * 1. 什么是 Decorator？
 * ============================================
 *
 * Decorator 是一种设计模式，允许在不修改原有代码的情况下，
 * 通过"装饰"的方式给类、方法、属性等添加新的功能。
 *
 * 本质上，Decorator 是一个函数，它接收被装饰的目标，并返回修改后的目标。
 *
 * ============================================
 * 2. Decorator 的类型
 * ============================================
 *
 * JavaScript 支持以下几种 Decorator：
 * - 类装饰器（Class Decorators）
 * - 方法装饰器（Method Decorators）
 * - 属性装饰器（Property Decorators）
 * - 参数装饰器（Parameter Decorators）
 * - 访问器装饰器（Accessor Decorators）
 *
 * ============================================
 * 3. 类装饰器（Class Decorators）
 * ============================================
 *
 * 类装饰器接收类的构造函数作为参数，可以修改或替换类。
 */

// 示例1：简单的类装饰器
function logClass(target) {
  console.log("类被装饰:", target.name);
  // 可以返回新的类，或者修改原类
  return target;
}

@logClass
class MyClass {
  constructor() {
    this.name = "MyClass";
  }
}

// 示例2：带参数的类装饰器（装饰器工厂）
function addMetadata(metadata) {
  return function (target) {
    target.metadata = metadata;
    return target;
  };
}

@addMetadata({ version: "1.0.0", author: "John" })
class ApiService {
  // ...
}

console.log(ApiService.metadata); // { version: '1.0.0', author: 'John' }

// 示例3：修改类的原型
function addMethod(target) {
  target.prototype.newMethod = function () {
    return "这是通过装饰器添加的方法";
  };
  return target;
}

@addMethod
class TestClass {
  // ...
}

const instance = new TestClass();
console.log(instance.newMethod()); // '这是通过装饰器添加的方法'

/**
 * ============================================
 * 4. 方法装饰器（Method Decorators）
 * ============================================
 *
 * 方法装饰器接收三个参数：
 * - target: 类的原型（如果是静态方法，则是类本身）
 * - propertyKey: 方法名
 * - descriptor: 属性描述符（Object.getOwnPropertyDescriptor 的返回值）
 */

// 示例1：日志装饰器
function log(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args) {
    console.log(`调用方法: ${propertyKey}`, args);
    const result = originalMethod.apply(this, args);
    console.log(`方法返回: ${propertyKey}`, result);
    return result;
  };

  return descriptor;
}

class Calculator {
  @log
  add(a, b) {
    return a + b;
  }

  @log
  multiply(a, b) {
    return a * b;
  }
}

const calc = new Calculator();
calc.add(2, 3); // 输出: 调用方法: add [2, 3] 和 方法返回: add 5

// 示例2：性能测量装饰器
function measureTime(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} 执行时间: ${end - start}ms`);
    return result;
  };

  return descriptor;
}

class DataProcessor {
  @measureTime
  processData(data) {
    // 模拟耗时操作
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum;
  }
}

// 示例3：防抖装饰器
function debounce(delay) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    let timeoutId = null;

    descriptor.value = function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, delay);
    };

    return descriptor;
  };
}

class SearchComponent {
  @debounce(300)
  search(query) {
    console.log("搜索:", query);
    // 执行搜索逻辑
  }
}

// 示例4：只读方法装饰器
function readonly(target, propertyKey, descriptor) {
  descriptor.writable = false;
  return descriptor;
}

class Config {
  @readonly
  getApiUrl() {
    return "https://api.example.com";
  }
}

// 示例5：自动重试装饰器
function retry(maxAttempts = 3) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      let lastError;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          console.log(`${propertyKey} 第 ${i + 1} 次尝试失败:`, error.message);
          if (i < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
      throw lastError;
    };

    return descriptor;
  };
}

class ApiClient {
  @retry(3)
  async fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
}

/**
 * ============================================
 * 5. 属性装饰器（Property Decorators）
 * ============================================
 *
 * 属性装饰器接收两个参数：
 * - target: 类的原型（如果是静态属性，则是类本身）
 * - propertyKey: 属性名
 *
 * 注意：属性装饰器不能直接修改属性的值，但可以修改属性描述符。
 */

// 示例1：属性验证装饰器
function validate(type) {
  return function (target, propertyKey) {
    let value;

    const getter = function () {
      return value;
    };

    const setter = function (newValue) {
      if (typeof newValue !== type) {
        throw new TypeError(`${propertyKey} 必须是 ${type} 类型`);
      }
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

class User {
  @validate("string")
  name;

  @validate("number")
  age;

  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const user = new User("John", 25);
// user.name = 123; // 抛出 TypeError

// 示例2：属性监听装饰器
function watch(callback) {
  return function (target, propertyKey) {
    let value;

    const getter = function () {
      return value;
    };

    const setter = function (newValue) {
      const oldValue = value;
      value = newValue;
      callback(propertyKey, oldValue, newValue);
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

class Observable {
  @watch((prop, oldVal, newVal) => {
    console.log(`${prop} 从 ${oldVal} 变为 ${newVal}`);
  })
  count = 0;
}

const obj = new Observable();
obj.count = 1; // 输出: count 从 0 变为 1
obj.count = 2; // 输出: count 从 1 变为 2

/**
 * ============================================
 * 6. 访问器装饰器（Accessor Decorators）
 * ============================================
 *
 * 访问器装饰器用于装饰 getter 和 setter 方法。
 */

// 示例：缓存装饰器
function cache(target, propertyKey, descriptor) {
  const getter = descriptor.get;
  let cachedValue;
  let cached = false;

  descriptor.get = function () {
    if (!cached) {
      cachedValue = getter.call(this);
      cached = true;
    }
    return cachedValue;
  };

  return descriptor;
}

class DataService {
  _data = null;

  @cache
  get expensiveData() {
    console.log("计算昂贵的数据...");
    // 模拟耗时计算
    return { result: Math.random() };
  }
}

const service = new DataService();
console.log(service.expensiveData); // 输出: 计算昂贵的数据... 和结果
console.log(service.expensiveData); // 直接返回缓存，不输出"计算昂贵的数据..."

/**
 * ============================================
 * 7. 参数装饰器（Parameter Decorators）
 * ============================================
 *
 * 参数装饰器接收三个参数：
 * - target: 类的原型（如果是静态方法，则是类本身）
 * - propertyKey: 方法名（如果是构造函数，则为 undefined）
 * - parameterIndex: 参数在参数列表中的索引
 *
 * 注意：参数装饰器主要用于元数据收集，不能直接修改参数。
 */

// 示例：参数验证装饰器（需要配合其他装饰器使用）
function required(target, propertyKey, parameterIndex) {
  // 存储元数据
  if (!target.__requiredParams) {
    target.__requiredParams = {};
  }
  if (!target.__requiredParams[propertyKey]) {
    target.__requiredParams[propertyKey] = [];
  }
  target.__requiredParams[propertyKey].push(parameterIndex);
}

function validateParams(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  const requiredParams = target.__requiredParams?.[propertyKey] || [];

  descriptor.value = function (...args) {
    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(`参数 ${index} 是必需的`);
      }
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

// 注意：参数装饰器是实验性特性，需要特殊配置才能使用
// 在 TypeScript 中需要启用 experimentalDecorators 和 emitDecoratorMetadata
// 在 Babel 中需要配置 @babel/plugin-proposal-decorators
//
// 以下代码展示了参数装饰器的理论用法，实际使用时可能需要：
// 1. 配置相应的编译工具
// 2. 或者使用其他方式实现类似功能（如通过方法装饰器配合参数验证）
class UserService {
  @validateParams
  // 参数装饰器语法（需要特殊配置支持）
  // 如果 linter 报错，可以添加 @ts-ignore 或 eslint-disable 注释
  createUser(name, email, age) {
    // 注意：参数装饰器 @required 的语法在实际 JavaScript 环境中
    // 可能不被完全支持，这里仅作为示例展示概念
    // 实际实现可以通过方法装饰器配合参数验证来实现
    return { name, email, age };
  }
}

const userService = new UserService();
// userService.createUser('John'); // 抛出错误：参数 1 是必需的

// 实际可用的替代方案：使用方法装饰器配合参数验证
function validateRequiredParams(...requiredIndices) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      for (const index of requiredIndices) {
        if (args[index] === undefined || args[index] === null) {
          throw new Error(`参数 ${index} 是必需的`);
        }
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

class UserServiceAlternative {
  @validateRequiredParams(0, 1) // 指定第0和第1个参数是必需的
  createUser(name, email, age) {
    return { name, email, age };
  }
}

const userService2 = new UserServiceAlternative();
// userService2.createUser('John'); // 抛出错误：参数 1 是必需的

/**
 * ============================================
 * 8. 装饰器的执行顺序
 * ============================================
 *
 * 当存在多个装饰器时，执行顺序遵循以下规则：
 *
 * 1. 装饰器工厂函数（带括号的装饰器）先执行，从上到下
 * 2. 装饰器应用函数（实际装饰函数）后执行，从下到上
 * 3. 不同类型的装饰器执行顺序：
 *    - 参数装饰器（从右到左）
 *    - 方法/属性/访问器装饰器（从下到上）
 *    - 类装饰器（从下到上）
 *
 * 重要概念：
 * - 装饰器工厂：返回装饰器函数的函数（如 @decorator()）
 * - 装饰器函数：直接应用的装饰器（如 @decorator）
 * - 工厂函数执行：在类定义时立即执行
 * - 装饰器应用：返回的装饰器函数被调用
 */

// ========== 示例1：多个类装饰器的执行顺序 ==========
function decorator1() {
  console.log("1. 装饰器1 工厂函数执行");
  return function (target) {
    console.log("4. 装饰器1 应用");
    return target;
  };
}

function decorator2() {
  console.log("2. 装饰器2 工厂函数执行");
  return function (target) {
    console.log("3. 装饰器2 应用");
    return target;
  };
}

@decorator1() // 从上到下，先执行工厂函数
@decorator2() // 从上到下，后执行工厂函数
class Example {
  // 执行顺序：
  // 1. 装饰器1 工厂函数执行
  // 2. 装饰器2 工厂函数执行
  // 3. 装饰器2 应用（从下到上，先应用最下面的装饰器）
  // 4. 装饰器1 应用（从下到上，后应用上面的装饰器）
}

// ========== 示例2：多个方法装饰器的执行顺序 ==========
function log1(target, propertyKey, descriptor) {
  console.log("装饰器 log1 应用");
  const originalMethod = descriptor.value;
  descriptor.value = function (...args) {
    console.log("[log1] 调用前");
    const result = originalMethod.apply(this, args);
    console.log("[log1] 调用后");
    return result;
  };
  return descriptor;
}

function log2(target, propertyKey, descriptor) {
  console.log("装饰器 log2 应用");
  const originalMethod = descriptor.value;
  descriptor.value = function (...args) {
    console.log("[log2] 调用前");
    const result = originalMethod.apply(this, args);
    console.log("[log2] 调用后");
    return result;
  };
  return descriptor;
}

function log3(target, propertyKey, descriptor) {
  console.log("装饰器 log3 应用");
  const originalMethod = descriptor.value;
  descriptor.value = function (...args) {
    console.log("[log3] 调用前");
    const result = originalMethod.apply(this, args);
    console.log("[log3] 调用后");
    return result;
  };
  return descriptor;
}

class MethodExample {
  @log1 // 从下到上，最后应用
  @log2 // 从下到上，中间应用
  @log3 // 从下到上，最先应用
  test() {
    console.log("执行 test 方法");
  }
  // 装饰器应用顺序：log3 -> log2 -> log1
  // 方法调用时的执行顺序（因为装饰器嵌套）：
  // [log1] 调用前
  //   [log2] 调用前
  //     [log3] 调用前
  //       执行 test 方法
  //     [log3] 调用后
  //   [log2] 调用后
  // [log1] 调用后
}

// ========== 示例3：装饰器工厂函数 vs 装饰器函数 ==========
function factoryDecorator(name) {
  console.log(`工厂函数 ${name} 执行`);
  return function (target, propertyKey, descriptor) {
    console.log(`装饰器 ${name} 应用`);
    return descriptor;
  };
}

function simpleDecorator(target, propertyKey, descriptor) {
  console.log("简单装饰器应用");
  return descriptor;
}

class FactoryExample {
  @factoryDecorator("A") // 工厂函数先执行
  @factoryDecorator("B") // 工厂函数先执行
  @simpleDecorator // 直接应用
  method() {
    // 执行顺序：
    // 1. 工厂函数 A 执行
    // 2. 工厂函数 B 执行
    // 3. 简单装饰器应用（从下到上，最先）
    // 4. 装饰器 B 应用（从下到上，中间）
    // 5. 装饰器 A 应用（从下到上，最后）
  }
}

// ========== 示例4：混合装饰器（类装饰器 + 方法装饰器）==========
function classDecorator1() {
  console.log("类装饰器1 工厂执行");
  return function (target) {
    console.log("类装饰器1 应用");
    return target;
  };
}

function classDecorator2() {
  console.log("类装饰器2 工厂执行");
  return function (target) {
    console.log("类装饰器2 应用");
    return target;
  };
}

function methodDecorator1() {
  console.log("方法装饰器1 工厂执行");
  return function (target, propertyKey, descriptor) {
    console.log("方法装饰器1 应用");
    return descriptor;
  };
}

function methodDecorator2() {
  console.log("方法装饰器2 工厂执行");
  return function (target, propertyKey, descriptor) {
    console.log("方法装饰器2 应用");
    return descriptor;
  };
}

@classDecorator1()
@classDecorator2()
class MixedExample {
  @methodDecorator1()
  @methodDecorator2()
  test() {
    // 完整执行顺序：
    // 1. 方法装饰器1 工厂执行
    // 2. 方法装饰器2 工厂执行
    // 3. 方法装饰器2 应用（从下到上）
    // 4. 方法装饰器1 应用（从下到上）
    // 5. 类装饰器1 工厂执行
    // 6. 类装饰器2 工厂执行
    // 7. 类装饰器2 应用（从下到上）
    // 8. 类装饰器1 应用（从下到上）
  }
}

// ========== 示例5：实际应用 - 理解执行顺序的重要性 ==========
function validate() {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
      console.log("[validate] 验证参数");
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

function log() {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
      console.log("[log] 记录日志");
      const result = originalMethod.apply(this, args);
      console.log("[log] 日志记录完成");
      return result;
    };
    return descriptor;
  };
}

function cache() {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    let cachedResult = null;
    descriptor.value = function (...args) {
      if (cachedResult) {
        console.log("[cache] 返回缓存");
        return cachedResult;
      }
      console.log("[cache] 计算并缓存");
      cachedResult = originalMethod.apply(this, args);
      return cachedResult;
    };
    return descriptor;
  };
}

class OrderExample {
  @validate() // 最后应用，最外层
  @log() // 中间应用
  @cache() // 最先应用，最内层
  getData(id) {
    console.log("执行 getData");
    return { id, data: "result" };
  }
  // 装饰器应用顺序：cache -> log -> validate
  // 方法调用时的执行顺序：
  // [validate] 验证参数
  //   [log] 记录日志
  //     [cache] 计算并缓存（第一次）
  //       执行 getData
  //     [cache] 返回缓存（第二次及以后）
  //   [log] 日志记录完成
  // 返回结果
}

// ========== 总结 ==========
/**
 * 装饰器执行顺序总结：
 *
 * 1. 工厂函数执行：从上到下，在类定义时立即执行
 * 2. 装饰器应用：从下到上，返回的装饰器函数被调用
 * 3. 方法调用时：从外到内执行（因为装饰器嵌套）
 *
 * 记忆技巧：
 * - 工厂函数：上 -> 下
 * - 装饰器应用：下 -> 上
 * - 方法执行：外 -> 内
 *
 * 实际影响：
 * - 最下面的装饰器最先应用，但最外层执行
 * - 最上面的装饰器最后应用，但最内层执行
 * - 这导致方法调用时，执行顺序与装饰器应用顺序相反
 */

/**
 * ============================================
 * 9. 实际应用场景
 * ============================================
 */

// 场景1：API 路由装饰器（类似 Express.js）
function route(path, method = "GET") {
  return function (target, propertyKey, descriptor) {
    if (!target.routes) {
      target.routes = [];
    }
    target.routes.push({ path, method, handler: descriptor.value });
    return descriptor;
  };
}

class UserController {
  @route("/users", "GET")
  getUsers() {
    return ["user1", "user2"];
  }

  @route("/users/:id", "GET")
  getUser(id) {
    return { id, name: "User" };
  }

  @route("/users", "POST")
  createUser(userData) {
    return { id: 1, ...userData };
  }
}

// 场景2：权限检查装饰器
function requireAuth(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args) {
    // 模拟检查用户是否已登录
    const isAuthenticated = this.user !== undefined;
    if (!isAuthenticated) {
      throw new Error("需要登录");
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class ProtectedService {
  user = null;

  @requireAuth
  getSecretData() {
    return "这是秘密数据";
  }
}

// 场景3：依赖注入装饰器
function inject(dependencyName) {
  return function (target, propertyKey, parameterIndex) {
    if (!target.__injections) {
      target.__injections = {};
    }
    if (!target.__injections[propertyKey]) {
      target.__injections[propertyKey] = {};
    }
    target.__injections[propertyKey][parameterIndex] = dependencyName;
  };
}

const dependencies = {
  logger: { log: (msg) => console.log(msg) },
  db: { query: (sql) => console.log("执行:", sql) },
};

function autoInject(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  const injections = target.__injections?.[propertyKey] || {};

  descriptor.value = function (...args) {
    const injectedArgs = args.map((arg, index) => {
      if (injections[index]) {
        return dependencies[injections[index]];
      }
      return arg;
    });
    return originalMethod.apply(this, injectedArgs);
  };

  return descriptor;
}

// 注意：参数装饰器是实验性特性
// 以下代码展示了参数装饰器的理论用法
class Service {
  @autoInject
  // 参数装饰器语法（需要特殊配置支持）
  // 如果 linter 报错，可以添加 @ts-ignore 或 eslint-disable 注释
  doSomething(logger, db, customParam) {
    // 注意：参数装饰器 @inject 的语法在实际 JavaScript 环境中
    // 可能不被完全支持，这里仅作为示例展示概念
    // 实际实现可以通过方法装饰器配合依赖注入容器来实现
    logger.log("执行操作");
    db.query("SELECT * FROM users");
    return customParam;
  }
}

/**
 * ============================================
 * 10. 注意事项和最佳实践
 * ============================================
 *
 * 1. 装饰器是实验性特性，生产环境使用需谨慎
 * 2. 装饰器不能用于函数（只能用于类、方法、属性等）
 * 3. 装饰器在类定义时执行，而不是在实例化时执行
 * 4. 装饰器应该保持纯函数特性，避免副作用
 * 5. 装饰器可以组合使用，但要考虑执行顺序
 * 6. 属性装饰器不能直接修改属性值，需要通过 defineProperty
 * 7. 参数装饰器主要用于元数据收集，需要配合其他装饰器使用
 *
 * ============================================
 * 11. 与 TypeScript 的区别
 * ============================================
 *
 * TypeScript 中的装饰器：
 * - 需要启用 "experimentalDecorators": true
 * - 支持类型检查
 * - 可以配合 reflect-metadata 使用
 * - 装饰器签名有类型定义
 *
 * JavaScript 中的装饰器：
 * - 需要 Babel 或类似工具转译
 * - 无类型检查
 * - 语法和行为基本一致
 */

// 示例：TypeScript 风格的装饰器（在 JS 中使用）
function typeCheck(expectedType) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      // 简单的类型检查
      args.forEach((arg, index) => {
        if (expectedType[index] && typeof arg !== expectedType[index]) {
          throw new TypeError(
            `参数 ${index} 应该是 ${expectedType[index]} 类型`
          );
        }
      });
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

class TypedCalculator {
  @typeCheck(["number", "number"])
  add(a, b) {
    return a + b;
  }
}

/**
 * ============================================
 * 总结
 * ============================================
 *
 * Decorator 是一种强大的元编程工具，可以：
 * - 在不修改原代码的情况下添加功能
 * - 实现横切关注点（日志、性能、验证等）
 * - 提高代码的可复用性和可维护性
 * - 实现类似 AOP（面向切面编程）的效果
 *
 * 常见用途：
 * - 日志记录
 * - 性能监控
 * - 参数验证
 * - 权限检查
 * - 缓存
 * - 防抖/节流
 * - 依赖注入
 * - 路由注册
 *
 * 虽然还是提案阶段，但在现代 JavaScript/TypeScript 开发中已经广泛使用。
 */
