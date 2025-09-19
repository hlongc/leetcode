// 定义全局变量 myLibrary，这是由 output.library 配置项指定的
var myLibrary;

// 整个打包后的代码被包裹在一个立即执行函数表达式(IIFE)中，以避免全局作用域污染
(() => {
  debugger; // 调试断点
  ("use strict"); // 启用严格模式

  // __webpack_modules__ 对象存储了所有模块的代码
  // 键是模块路径，值是模块函数
  var __webpack_modules__ = {
    // 这是源代码中的 src/index.js 模块
    "./src/index.js": (
      __unused_webpack_module, // 未使用的参数，在非 CommonJS 模块中不需要
      __webpack_exports__, // 模块的导出对象
      __webpack_require__ // webpack 的 require 函数
    ) => {
      // eval 执行模块代码，这里包含了源代码的转换结果
      // 实际上是将 ES6 的 export 语法转换为 webpack 的模块系统
      eval(
        // 注册模块为 ES 模块
        "__webpack_require__.r(__webpack_exports__);\n" +
          // 定义导出的函数
          "/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n" +
          "/* harmony export */   bootstrap: () => (/* binding */ bootstrap),\n" +
          "/* harmony export */   mount: () => (/* binding */ mount),\n" +
          "/* harmony export */   unmount: () => (/* binding */ unmount),\n" +
          "/* harmony export */   update: () => (/* binding */ update)\n" +
          "/* harmony export */ });\n" +
          // 源代码中的四个异步函数
          "// 注意 single-spa 中需要加载 async 函数\n" +
          "async function bootstrap() {\n" +
          '  console.log("bootstrap");\n' +
          "}\n\n" +
          "async function mount() {\n" +
          '  console.log("mount");\n' +
          "}\n\n" +
          "async function unmount() {\n" +
          '  console.log("unmount");\n' +
          "}\n\n" +
          "async function update() {\n" +
          '  console.log("update");\n' +
          "}\n\n" +
          // 源映射 URL，用于调试
          "//# sourceURL=webpack://myLibrary/./src/index.js?"
      );
    },
  };

  // 初始化 webpack 的模块系统
  var __webpack_require__ = {};

  // 定义 __webpack_require__.d 函数
  // 用于在导出对象上定义 getter 属性
  (() => {
    __webpack_require__.d = (exports, definition) => {
      for (var key in definition) {
        // 检查属性是否已存在
        if (
          __webpack_require__.o(definition, key) &&
          !__webpack_require__.o(exports, key)
        ) {
          // 使用 Object.defineProperty 定义 getter
          // 这样当访问 exports.bootstrap 时，实际上会调用 definition.bootstrap 函数
          Object.defineProperty(exports, key, {
            enumerable: true, // 属性可枚举
            get: definition[key], // 使用 getter 函数
          });
        }
      }
    };
  })();

  // 定义 __webpack_require__.o 函数
  // 检查对象是否具有特定属性的简写方法
  (() => {
    __webpack_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
  })();

  // 定义 __webpack_require__.r 函数
  // 将模块标记为 ES 模块
  (() => {
    __webpack_require__.r = (exports) => {
      // 如果环境支持 Symbol，添加 Symbol.toStringTag 属性
      // 这样 Object.prototype.toString.call(exports) 会返回 "[object Module]"
      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, {
          value: "Module",
        });
      }
      // 添加 __esModule 标记，表示这是一个 ES 模块
      Object.defineProperty(exports, "__esModule", { value: true });
    };
  })();

  // 创建一个空对象作为模块的导出容器
  var __webpack_exports__ = {};

  // 加载入口模块 "./src/index.js"
  // 参数: 0 (未使用), 导出对象, require 函数
  __webpack_modules__["./src/index.js"](
    0,
    __webpack_exports__,
    __webpack_require__
  );

  // 将模块的导出赋值给全局变量 myLibrary
  // 这就是 output.library: "myLibrary" 配置的效果
  myLibrary = __webpack_exports__;
})();

// 使用示例:
// myLibrary.bootstrap().then(() => console.log('Bootstrap completed'));
// myLibrary.mount().then(() => console.log('Mount completed'));
// myLibrary.unmount().then(() => console.log('Unmount completed'));
// myLibrary.update().then(() => console.log('Update completed'));
