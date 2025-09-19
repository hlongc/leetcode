# Webpack 的 `output.library` 和 `output.libraryTarget` 配置详解

当使用 Webpack 打包一个库（library）而不是应用时，`output.library` 和 `output.libraryTarget` 是两个核心配置项，它们决定了库如何被暴露和消费。这两个配置项共同控制打包后的代码如何导出，以及如何被其他代码引用。

## 基本概念

### output.library

`output.library` 配置项定义了库被导出时的名称。这个名称的具体含义取决于 `libraryTarget` 的值。

**语法**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
  },
};
```

在 Webpack 5 中，也可以使用对象形式：

```javascript
module.exports = {
  output: {
    library: {
      name: "MyLibrary",
      type: "var",
    },
  },
};
```

### output.libraryTarget

`output.libraryTarget` 配置项定义了库应该以何种方式被导出。它决定了库如何与各种模块系统和环境交互。

**语法**：

```javascript
module.exports = {
  output: {
    libraryTarget: "var",
  },
};
```

## `output.library` 的属性值

`output.library` 可以接受以下类型的值：

### 1. 字符串

最简单的形式，指定库的名称：

```javascript
output: {
  library: "MyLibrary";
}
```

### 2. 对象（Webpack 5+）

在 Webpack 5 中，可以使用对象形式，同时指定名称和类型：

```javascript
output: {
  library: {
    name: 'MyLibrary',
    type: 'var'
  }
}
```

### 3. 数组

当 `libraryTarget` 是 `'umd'` 时，可以使用数组指定在不同环境中的不同名称：

```javascript
output: {
  library: ["MyLib", "MyLibrary"];
}
```

这会生成类似以下的代码：

```javascript
// 当在 CommonJS 环境中
exports['MyLib'] = ...
// 当在 AMD 环境中
define('MyLibrary', [], function() { ... })
```

## `output.libraryTarget` 的属性值及应用场景

### 1. `'var'`（默认值）

**效果**：将库作为一个变量声明暴露，使用 `output.library` 指定的名称。

**输出示例**：

```javascript
var MyLibrary = (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 最简单的使用场景，适合通过 `<script>` 标签直接在浏览器中使用
- 不支持模块化系统，仅在全局作用域中添加一个变量

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "var",
  },
};
```

### 2. `'this'`

**效果**：将库作为 `this` 的一个属性暴露。

**输出示例**：

```javascript
this['MyLibrary'] = (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 当库需要作为当前上下文（如函数内部或对象方法中）的一个属性使用
- 适合在特定执行上下文中使用，而不是全局变量

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "this",
  },
};
```

### 3. `'window'`

**效果**：将库作为 `window` 对象的一个属性暴露。

**输出示例**：

```javascript
window['MyLibrary'] = (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 明确指定库应该附加到浏览器的 `window` 对象上
- 适合需要在浏览器全局作用域中使用的库

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "window",
  },
};
```

### 4. `'global'`

**效果**：将库作为全局对象的一个属性暴露（在 Node.js 中是 `global`，在浏览器中是 `window`）。

**输出示例**：

```javascript
(typeof global !== 'undefined' ? global : window)['MyLibrary'] = (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 需要在 Node.js 和浏览器环境中都能工作的库
- 适合跨平台的工具库

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "global",
  },
};
```

### 5. `'commonjs'`

**效果**：将库作为 CommonJS 模块导出。

**输出示例**：

```javascript
exports['MyLibrary'] = (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 适合在 Node.js 环境中使用的库
- 适合与 CommonJS 模块系统兼容的环境

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "commonjs",
  },
};
```

### 6. `'commonjs2'`

**效果**：将库作为 CommonJS 模块导出，但使用 `module.exports` 而不是 `exports`。

**输出示例**：

```javascript
module.exports = (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 适合在 Node.js 环境中使用的库
- 当库需要作为一个完整的模块导出，而不是作为 `exports` 的属性
- 适合与 webpack、browserify 等打包工具配合使用

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "commonjs2",
  },
};
```

### 7. `'amd'`

**效果**：将库作为 AMD 模块导出。

**输出示例**：

```javascript
define('MyLibrary', [], function() {
  // 库的代码
  return {...};
});
```

**应用场景**：

- 适合在使用 RequireJS 等 AMD 加载器的浏览器环境中使用
- 适合需要异步加载的大型库

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "amd",
  },
};
```

### 8. `'umd'`（通用模块定义）

**效果**：将库暴露为所有模块定义下都可运行的方式，包括 AMD、CommonJS 和全局变量。

**输出示例**：

```javascript
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MyLibrary', [], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else {
    // 全局变量
    root.MyLibrary = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  // 库的代码
  return {...};
}));
```

**应用场景**：

- 最通用的选择，适合需要在多种环境中使用的库
- 适合发布到 npm 的公共库
- 适合既要支持模块化引入又要支持 `<script>` 标签引入的库

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "umd",
    // 可选：指定 UMD 构建中的全局变量名
    umdNamedDefine: true,
  },
};
```

### 9. `'jsonp'`

**效果**：将库作为 JSONP 模块导出。

**输出示例**：

```javascript
MyLibrary((function() {
  // 库的代码
  return {...};
})());
```

**应用场景**：

- 需要跨域加载库的场景
- 需要动态加载代码的场景
- 适合作为旧式 API 的回调处理

**配置示例**：

```javascript
module.exports = {
  output: {
    library: "MyLibrary",
    libraryTarget: "jsonp",
  },
};
```

### 10. `'module'`（Webpack 5 新增）

**效果**：将库作为 ES 模块导出。

**输出示例**：

```javascript
export default (function() {
  // 库的代码
  return {...};
})();
```

**应用场景**：

- 适合现代 JavaScript 应用
- 支持 Tree Shaking
- 适合与 ES 模块系统配合使用

**配置示例**：

```javascript
module.exports = {
  experiments: {
    outputModule: true,
  },
  output: {
    library: {
      type: "module",
    },
  },
};
```

### 11. `'system'`（Webpack 5 新增）

**效果**：将库作为 System.js 模块导出。

**应用场景**：

- 适合与 System.js 模块加载器一起使用
- 适合微前端架构

**配置示例**：

```javascript
module.exports = {
  output: {
    library: {
      type: "system",
    },
  },
};
```

## output.chunkLoadingGlobal（旧名：jsonpFunction）

`output.chunkLoadingGlobal` 是 Webpack 5 中的配置项（在 Webpack 4 中称为 `output.jsonpFunction`），用于配置加载异步 chunk 时使用的全局变量名。

### 基本概念

当 Webpack 打包生成多个 chunk 文件时（如通过动态 import() 或 SplitChunksPlugin 分割代码），它需要一种方式在运行时加载这些 chunk。默认情况下，Webpack 使用 JSONP 技术来加载这些异步 chunk，并使用一个全局函数作为回调接收加载的 chunk 内容。

**语法**：

```javascript
module.exports = {
  output: {
    chunkLoadingGlobal: "myCustomWebpackJsonp",
  },
};
```

### 默认行为

如果不指定 `chunkLoadingGlobal`，Webpack 会基于项目名称生成一个唯一的函数名，如 `webpackJsonp_[package-name]`。

**默认输出示例**：

```javascript
// 主 bundle
(self["webpackChunk_my_project"] = self["webpackChunk_my_project"] || []).push([
  [chunkId],
  {
    // chunk 内容
  },
]);
```

### 为什么需要自定义 chunkLoadingGlobal

在以下情况下，自定义 `chunkLoadingGlobal` 很重要：

1. **多个 Webpack 应用共存**：当页面上有多个由 Webpack 打包的应用时，它们可能会使用相同的默认函数名，导致冲突
2. **微前端架构**：多个独立构建的微应用需要在同一页面上运行
3. **版本控制**：在进行渐进式升级时，新旧版本的应用可能需要共存

### 微前端场景下的作用

在微前端架构中，`chunkLoadingGlobal` 扮演着至关重要的角色：

#### 1. 避免全局变量冲突

当多个独立构建的微应用在同一页面上运行时，如果它们都使用默认的 chunk 加载函数名，会导致冲突，使得后加载的应用覆盖先前应用的函数，导致运行时错误。

**问题示例**：

```javascript
// 微应用 A
(self["webpackChunk"] = self["webpackChunk"] || []).push([...]);

// 微应用 B 也使用相同的名称，会覆盖微应用 A 的加载机制
(self["webpackChunk"] = self["webpackChunk"] || []).push([...]);
```

**解决方案**：

```javascript
// 微应用 A 的配置
module.exports = {
  output: {
    chunkLoadingGlobal: "webpackChunkAppA",
  },
};

// 微应用 B 的配置
module.exports = {
  output: {
    chunkLoadingGlobal: "webpackChunkAppB",
  },
};
```

#### 2. 实现微应用的独立加载

每个微应用需要能够独立加载自己的异步 chunk，而不干扰其他微应用的加载过程。

**示例配置**：

```javascript
// 为每个微应用配置唯一的 chunkLoadingGlobal
const microApps = ["app1", "app2", "app3"];

microApps.forEach((app) => {
  module.exports = {
    name: app,
    output: {
      chunkLoadingGlobal: `webpackChunk_${app}`,
    },
  };
});
```

#### 3. 支持微应用的并行加载和卸载

在微前端架构中，微应用可能需要动态加载和卸载。自定义 `chunkLoadingGlobal` 可以确保这些操作不会相互干扰。

**实际应用示例**：

```javascript
// 微前端框架配置
const apps = [
  {
    name: "navbar",
    entry: "//localhost:8081",
    container: "#navbar",
    activeRule: "/",
    chunkLoadingGlobal: "webpackChunk_navbar",
  },
  {
    name: "dashboard",
    entry: "//localhost:8082",
    container: "#content",
    activeRule: "/dashboard",
    chunkLoadingGlobal: "webpackChunk_dashboard",
  },
];
```

#### 4. 与模块联邦（Module Federation）配合

在使用 Webpack 5 的模块联邦功能构建微前端时，正确配置 `chunkLoadingGlobal` 对于避免冲突至关重要。

**模块联邦示例**：

```javascript
// 主应用
new ModuleFederationPlugin({
  name: "host",
  remotes: {
    appA: "appA@http://localhost:3001/remoteEntry.js",
    appB: "appB@http://localhost:3002/remoteEntry.js",
  },
  shared: ["react", "react-dom"],
});

// 在 output 中配置
output: {
  chunkLoadingGlobal: "webpackChunkHost";
}

// 微应用 A
new ModuleFederationPlugin({
  name: "appA",
  filename: "remoteEntry.js",
  exposes: {
    "./Component": "./src/Component",
  },
  shared: ["react", "react-dom"],
});

// 在 output 中配置
output: {
  chunkLoadingGlobal: "webpackChunkAppA";
}
```

### 最佳实践

1. **使用项目唯一标识**：为每个应用配置基于项目名称的唯一 `chunkLoadingGlobal`

   ```javascript
   chunkLoadingGlobal: `webpackJsonp_${packageJson.name.replace(/-/g, "_")}`;
   ```

2. **微前端架构中的命名约定**：建立命名约定，确保所有微应用使用不冲突的名称

   ```javascript
   chunkLoadingGlobal: `webpackJsonp_${organizationPrefix}_${appName}`;
   ```

3. **与其他配置结合**：与 `output.uniqueName` 结合使用，确保完全的隔离

   ```javascript
   module.exports = {
     output: {
       uniqueName: "org_app1",
       chunkLoadingGlobal: "webpackChunk_org_app1",
     },
   };
   ```

4. **版本控制**：在进行应用版本升级时，考虑为新版本使用不同的 `chunkLoadingGlobal`

   ```javascript
   chunkLoadingGlobal: `webpackJsonp_${appName}_v${appVersion.replace(
     /\./g,
     "_"
   )}`;
   ```

## 相关配置项

### output.libraryExport

指定从库的导出中应该暴露哪一部分。默认为整个导出对象。

**示例**：

```javascript
module.exports = {
  output: {
    library: "MyLib",
    libraryTarget: "umd",
    libraryExport: "default", // 只导出 default 导出
  },
};
```

这在处理 ES 模块的默认导出时特别有用。

### output.globalObject

当 `libraryTarget` 是 `'umd'` 时，指定全局对象的引用。默认为 `'this'`。

**示例**：

```javascript
module.exports = {
  output: {
    library: "MyLib",
    libraryTarget: "umd",
    globalObject: "this", // 或 'globalThis', 'self', 'window' 等
  },
};
```

## 实际应用示例

### 1. 创建一个可在浏览器中通过 `<script>` 标签使用的库

```javascript
module.exports = {
  output: {
    filename: "my-library.js",
    library: "MyLibrary",
    libraryTarget: "var",
  },
};
```

使用方式：

```html
<script src="my-library.js"></script>
<script>
  MyLibrary.doSomething();
</script>
```

### 2. 创建一个 UMD 库，可以在任何环境中使用

```javascript
module.exports = {
  output: {
    filename: "my-library.js",
    library: "MyLibrary",
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
  },
};
```

使用方式：

```javascript
// 在 CommonJS 环境中
const MyLibrary = require('my-library');

// 在 AMD 环境中
define(['my-library'], function(MyLibrary) {
  // 使用 MyLibrary
});

// 在浏览器中
<script src="my-library.js"></script>
<script>
  MyLibrary.doSomething();
</script>
```

### 3. 创建一个 Node.js 库

```javascript
module.exports = {
  output: {
    filename: "my-library.js",
    libraryTarget: "commonjs2",
  },
};
```

使用方式：

```javascript
const myLibrary = require("my-library");
myLibrary.doSomething();
```

### 4. 创建一个支持 ES 模块的现代库（Webpack 5）

```javascript
module.exports = {
  experiments: {
    outputModule: true,
  },
  output: {
    filename: "my-library.js",
    library: {
      type: "module",
    },
  },
};
```

使用方式：

```javascript
import MyLibrary from "my-library";
MyLibrary.doSomething();
```

### 5. 微前端应用中的配置示例

```javascript
// 主应用配置
module.exports = {
  output: {
    filename: "[name].[contenthash].js",
    chunkLoadingGlobal: "webpackChunkMainApp",
    uniqueName: "main_app",
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "main",
      remotes: {
        app1: "app1@http://localhost:3001/remoteEntry.js",
        app2: "app2@http://localhost:3002/remoteEntry.js",
      },
    }),
  ],
};

// 微应用1配置
module.exports = {
  output: {
    filename: "[name].[contenthash].js",
    chunkLoadingGlobal: "webpackChunkApp1",
    uniqueName: "app1",
    publicPath: "http://localhost:3001/",
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "app1",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App",
      },
    }),
  ],
};
```

## 最佳实践：多格式输出

在实际项目中，通常需要为不同的使用场景提供不同格式的库。可以通过多次配置 webpack 来实现：

```javascript
// webpack.config.js
const path = require("path");
const { merge } = require("webpack-merge");

const baseConfig = {
  entry: "./src/index.js",
  module: {
    rules: [
      // 配置 loader
    ],
  },
};

module.exports = [
  // UMD 构建，可通过 <script> 标签使用
  merge(baseConfig, {
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "my-library.umd.js",
      library: {
        name: "MyLibrary",
        type: "umd",
        umdNamedDefine: true,
      },
      globalObject: "this",
      chunkLoadingGlobal: "webpackChunkMyLibraryUMD",
    },
  }),

  // CommonJS 构建，用于 Node.js
  merge(baseConfig, {
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "my-library.cjs.js",
      library: {
        type: "commonjs2",
      },
      chunkLoadingGlobal: "webpackChunkMyLibraryCJS",
    },
  }),

  // ES 模块构建，用于现代打包工具
  merge(baseConfig, {
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "my-library.esm.js",
      library: {
        type: "module",
      },
      chunkLoadingGlobal: "webpackChunkMyLibraryESM",
    },
  }),
];
```

然后在 `package.json` 中正确配置入口点：

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "main": "dist/my-library.cjs.js", // CommonJS 入口
  "module": "dist/my-library.esm.js", // ES 模块入口
  "browser": "dist/my-library.umd.js", // 浏览器入口
  "exports": {
    ".": {
      "import": "./dist/my-library.esm.js",
      "require": "./dist/my-library.cjs.js"
    }
  },
  "files": ["dist"]
}
```

## 选择正确的 libraryTarget 的决策流程

1. **库的使用环境是什么？**

   - 仅浏览器：考虑 `var`、`window` 或简单的 `umd`
   - 仅 Node.js：使用 `commonjs2`
   - 两者都有：使用 `umd`
   - 现代应用：考虑 `module`

2. **库的消费者使用什么模块系统？**

   - ES 模块：使用 `module`
   - CommonJS：使用 `commonjs2`
   - AMD：使用 `amd`
   - 多种系统：使用 `umd`

3. **库是否需要支持 Tree Shaking？**

   - 是：优先考虑 `module`
   - 否：可以使用其他格式

4. **库的大小和加载性能要求如何？**

   - 对大小敏感：提供 ES 模块版本以支持 Tree Shaking
   - 需要异步加载：考虑 `amd` 或 `jsonp`

5. **是否在微前端环境中使用？**
   - 是：确保配置唯一的 `chunkLoadingGlobal`
   - 是：考虑使用 `system` 类型与 SystemJS 集成
   - 是：与 `output.uniqueName` 结合使用

## 总结

`output.library` 和 `output.libraryTarget` 是 Webpack 中构建可重用库的核心配置项：

- `output.library` 定义库的名称，决定如何引用库
- `output.libraryTarget` 定义库的导出格式，决定如何与不同环境集成
- `output.chunkLoadingGlobal` 在多应用共存场景（尤其是微前端）中至关重要，用于避免全局变量冲突

选择正确的配置取决于库的目标用户和使用环境。对于现代库项目，最佳实践是提供多种格式（UMD、CommonJS、ES 模块）以满足不同的使用场景，并在微前端架构中正确配置 `chunkLoadingGlobal` 以确保应用间的隔离。

通过正确配置这些选项，可以确保你的库能够被各种不同的环境和模块系统正确消费，提高库的通用性和开发者体验，同时避免在复杂应用架构中的冲突问题。
