// 方法1: 使用 new.target 检测是否被 new 调用 (ES6+)
class Singleton {
  constructor() {
    // 检测是否通过 new 调用
    if (!new.target) {
      throw new Error("Singleton 必须通过 new 关键字调用");
    }

    // 如果已存在实例，返回之前的实例
    if (Singleton.instance) {
      return Singleton.instance;
    }

    // 初始化实例属性
    this.timestamp = Date.now();
    this.data = "这是单例数据";

    // 将实例挂载到静态属性上
    Singleton.instance = this;
  }

  // 静态方法获取实例
  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  // 实例方法
  showInfo() {
    console.log(`实例创建时间: ${this.timestamp}, 数据: ${this.data}`);
  }
}

// 测试
console.log("=== 测试方法1: 使用 new.target ===");
const s1 = new Singleton();
const s2 = new Singleton();
const s3 = Singleton.getInstance();

console.log("s1 === s2:", s1 === s2); // true
console.log("s1 === s3:", s1 === s3); // true
s1.showInfo();

// 尝试不用 new 调用会报错
try {
  const s4 = Singleton();
} catch (e) {
  console.log("错误:", e.message);
}

console.log("\n=== 方法2: ES5 函数式实现 ===");

// 方法2: 使用 ES5 的构造函数方式
function SingletonES5() {
  // 检测是否通过 new 调用
  // 方式1: 使用 instanceof
  if (!(this instanceof SingletonES5)) {
    throw new Error("SingletonES5 必须通过 new 关键字调用");
  }

  // 如果已存在实例，返回之前的实例
  if (SingletonES5.instance) {
    return SingletonES5.instance;
  }

  // 初始化实例
  this.timestamp = Date.now();
  this.data = "ES5单例数据";

  // 将实例挂载到静态属性
  SingletonES5.instance = this;
}

// 添加原型方法
SingletonES5.prototype.showInfo = function () {
  console.log("ES5实例创建时间: " + this.timestamp + ", 数据: " + this.data);
};

// 静态方法
SingletonES5.getInstance = function () {
  if (!SingletonES5.instance) {
    SingletonES5.instance = new SingletonES5();
  }
  return SingletonES5.instance;
};

const es5_s1 = new SingletonES5();
const es5_s2 = new SingletonES5();
console.log("es5_s1 === es5_s2:", es5_s1 === es5_s2); // true
es5_s1.showInfo();

// 尝试不用 new 调用会报错
try {
  const es5_s3 = SingletonES5();
} catch (e) {
  console.log("错误:", e.message);
}

console.log("\n=== 方法3: 闭包实现 (最安全) ===");

// 方法3: 使用闭包实现单例（最推荐）
const SingletonClosure = (function () {
  let instance = null;

  function Singleton() {
    // 检测是否通过 new 调用
    if (!(this instanceof Singleton)) {
      throw new Error("Singleton 必须通过 new 关键字调用");
    }

    // 如果已存在实例，返回之前的实例
    if (instance) {
      return instance;
    }

    // 初始化
    this.timestamp = Date.now();
    this.data = "闭包单例数据";

    // 保存实例
    instance = this;
  }

  Singleton.prototype.showInfo = function () {
    console.log("闭包实例创建时间: " + this.timestamp + ", 数据: " + this.data);
  };

  // 静态方法
  Singleton.getInstance = function () {
    if (!instance) {
      instance = new Singleton();
    }
    return instance;
  };

  return Singleton;
})();

const closure_s1 = new SingletonClosure();
const closure_s2 = new SingletonClosure();
const closure_s3 = SingletonClosure.getInstance();
console.log("closure_s1 === closure_s2:", closure_s1 === closure_s2); // true
console.log("closure_s1 === closure_s3:", closure_s1 === closure_s3); // true
closure_s1.showInfo();

console.log("\n=== 方法4: 使用 Proxy 实现 (最灵活) ===");

// 方法4: 使用 Proxy 拦截 construct 和 apply
function SingletonBase() {
  this.timestamp = Date.now();
  this.data = "Proxy单例数据";
}

SingletonBase.prototype.showInfo = function () {
  console.log("Proxy实例创建时间: " + this.timestamp + ", 数据: " + this.data);
};

// 使用 Proxy 包装构造函数
const SingletonProxy = new Proxy(SingletonBase, {
  instance: null,

  // 拦截 new 操作符调用
  construct(target, args) {
    console.log("✅ 检测到通过 new 调用构造函数");

    // 如果已有实例，返回旧实例
    if (this.instance) {
      console.log("返回已存在的实例");
      return this.instance;
    }

    // 创建新实例
    console.log("创建新实例");
    this.instance = new target(...args);
    return this.instance;
  },

  // 拦截普通函数调用
  apply(target, thisArg, args) {
    console.log("❌ 检测到普通函数调用（没有使用 new）");
    throw new Error("SingletonProxy 必须通过 new 关键字调用");
  },
});

const proxy_s1 = new SingletonProxy();
const proxy_s2 = new SingletonProxy();
console.log("proxy_s1 === proxy_s2:", proxy_s1 === proxy_s2); // true
proxy_s1.showInfo();

// 尝试不用 new 调用会被拦截
try {
  const proxy_s3 = SingletonProxy();
} catch (e) {
  console.log("错误:", e.message);
}

console.log("\n=== 方法5: 使用 Proxy + Class 实现 ===");

// 方法5: 使用 Proxy 包装 ES6 Class
class SingletonClass {
  constructor() {
    this.timestamp = Date.now();
    this.data = "Proxy+Class单例数据";
  }

  showInfo() {
    console.log(
      `Proxy+Class实例创建时间: ${this.timestamp}, 数据: ${this.data}`
    );
  }
}

// 创建 Proxy 包装器
const createSingletonProxy = (TargetClass) => {
  let instance = null;

  return new Proxy(TargetClass, {
    construct(target, args) {
      if (!instance) {
        console.log("Proxy: 创建新的单例实例");
        instance = new target(...args);
      } else {
        console.log("Proxy: 返回已存在的实例");
      }
      return instance;
    },

    apply(target, thisArg, args) {
      throw new Error(`${target.name} 必须通过 new 关键字调用`);
    },
  });
};

const ProxySingleton = createSingletonProxy(SingletonClass);

const ps1 = new ProxySingleton();
const ps2 = new ProxySingleton();
console.log("ps1 === ps2:", ps1 === ps2); // true
ps1.showInfo();

try {
  const ps3 = ProxySingleton();
} catch (e) {
  console.log("错误:", e.message);
}

console.log("\n=== 方法6: Proxy 高级用法 - 监控所有操作 ===");

// 方法6: 完整的 Proxy 监控
class SingletonAdvanced {
  constructor(name) {
    this.name = name;
    this.timestamp = Date.now();
  }

  greet() {
    return `Hello from ${this.name}`;
  }
}

const createMonitoredSingleton = (TargetClass) => {
  let instance = null;
  let constructCount = 0;
  let applyCount = 0;

  return new Proxy(TargetClass, {
    construct(target, args) {
      constructCount++;
      console.log(`📊 construct 调用次数: ${constructCount}`);

      if (!instance) {
        instance = new target(...args);
        console.log(`✨ 创建新实例，参数:`, args);
      } else {
        console.log(`♻️  返回已有实例 (忽略新参数)`);
      }
      return instance;
    },

    apply(target, thisArg, args) {
      applyCount++;
      console.log(`📊 apply 调用次数: ${applyCount}`);
      console.log(`⚠️  禁止普通调用`);
      throw new Error(`${target.name} 必须使用 new 关键字`);
    },

    // 可以添加更多拦截
    get(target, prop) {
      console.log(`🔍 尝试访问静态属性: ${String(prop)}`);

      // 提供统计信息
      if (prop === "stats") {
        return {
          constructCount,
          applyCount,
          hasInstance: !!instance,
        };
      }

      return target[prop];
    },
  });
};

const MonitoredSingleton = createMonitoredSingleton(SingletonAdvanced);

console.log("\n创建第一个实例:");
const ms1 = new MonitoredSingleton("Alice");

console.log("\n创建第二个实例:");
const ms2 = new MonitoredSingleton("Bob"); // 参数会被忽略

console.log("\nms1 === ms2:", ms1 === ms2);
console.log("ms1.name:", ms1.name); // Alice
console.log("ms2.name:", ms2.name); // Alice (因为是同一个实例)
console.log("ms1.greet():", ms1.greet());

console.log("\n尝试普通调用:");
try {
  MonitoredSingleton("Charlie");
} catch (e) {
  console.log("错误:", e.message);
}

console.log("\n查看统计信息:");
const stats = MonitoredSingleton.stats;
console.log("统计:", stats);

console.log("\n=== 总结 ===");
console.log("检测 new 调用的方法:");
console.log("1. ES6: 使用 new.target");
console.log("2. ES5: 使用 this instanceof Constructor");
console.log("3. 闭包方式更安全，可以完全隐藏实例变量");
console.log("4. Proxy: 拦截 construct (new) 和 apply (普通调用)");
console.log("5. Proxy 优势: 可以监控、记录、增强构造过程");
console.log("6. Proxy 可以实现最灵活和功能最强的单例模式");
