# Web 应用和组件库使用相同依赖 lodash 的打包问题与解决方案

## 问题背景

当 Web 应用和其引入的组件库都依赖相同的第三方库（如 lodash）时，在打包过程中可能会出现依赖被打包两次的情况，导致最终构建产物体积增大、加载性能下降，甚至可能引起运行时冲突。

## 什么情况下 lodash 会被打包两次

### 1. 不同版本的 lodash

当 Web 应用和组件库使用不同版本的 lodash 时，Webpack 通常会将两个版本都打包进最终产物：

```
node_modules/
├── my-component-lib/
│   ├── node_modules/
│   │   └── lodash@4.17.15/
│   └── package.json (dependencies: {"lodash": "^4.17.15"})
└── lodash@4.17.21/
└── package.json (dependencies: {"lodash": "^4.17.21"})
```

### 2. 组件库将依赖打包为内部代码

当组件库在构建时将 lodash 直接打包到自身代码中（而不是声明为外部依赖）：

```javascript
// 组件库的 webpack 配置
module.exports = {
  // ...
  externals: {
    // lodash 没有被声明为外部依赖
    react: "React",
    "react-dom": "ReactDOM",
  },
};
```

### 3. 不同的导入方式

当应用和库使用不同的导入方式时，Webpack 可能无法识别它们是同一依赖：

```javascript
// 组件库中
import _ from "lodash";

// Web 应用中
import { map } from "lodash";
// 或
const lodash = require("lodash");
```

### 4. 别名或自定义解析配置

当应用或库使用了 Webpack 的 alias 或自定义解析配置指向不同的 lodash 实现：

```javascript
// 组件库的 webpack 配置
resolve: {
  alias: {
    'lodash': path.resolve(__dirname, 'custom-lodash-implementation')
  }
}
```

### 5. 组件库使用了 UMD/IIFE 打包格式

当组件库使用 UMD 或 IIFE 格式打包，而不是 ESM 或 CommonJS 时，其内部依赖会被封装，使 Webpack 无法进行依赖分析和优化。

## 解决方案：使 lodash 只被打包一次

### 1. 将共享依赖声明为 peerDependencies

在组件库的 `package.json` 中，将 lodash 从 `dependencies` 移到 `peerDependencies`：

```json
{
  "name": "my-component-lib",
  "version": "1.0.0",
  "peerDependencies": {
    "lodash": "^4.17.15"
  }
}
```

这样，组件库会使用宿主应用提供的 lodash，而不是自己的副本。

### 2. 在组件库中将 lodash 声明为外部依赖

在组件库的 Webpack 配置中，将 lodash 设置为外部依赖：

```javascript
// 组件库的 webpack.config.js
module.exports = {
  // ...
  externals: {
    lodash: {
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
      root: "_",
    },
  },
};
```

或者使用简化写法：

```javascript
externals: ["lodash"];
```

这样，组件库构建时不会将 lodash 打包进去，而是期望运行环境提供它。

### 3. 使用 Webpack 的 DLL 插件

在 Web 应用中使用 DLL 插件预先打包 lodash，然后在组件库和应用构建中引用这个 DLL：

```javascript
// webpack.dll.config.js
const webpack = require("webpack");
const path = require("path");

module.exports = {
  entry: {
    vendor: ["lodash"],
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].dll.js",
    library: "[name]_library",
  },
  plugins: [
    new webpack.DllPlugin({
      name: "[name]_library",
      path: path.join(__dirname, "dist", "[name]-manifest.json"),
    }),
  ],
};
```

然后在应用的 Webpack 配置中引用这个 DLL：

```javascript
// webpack.config.js
plugins: [
  new webpack.DllReferencePlugin({
    context: __dirname,
    manifest: require("./dist/vendor-manifest.json"),
  }),
];
```

### 4. 使用 Webpack 5 的模块联邦 (Module Federation)

Webpack 5 引入的模块联邦功能可以在多个独立构建之间共享模块：

```javascript
// 组件库的 webpack.config.js
new ModuleFederationPlugin({
  name: "component_lib",
  filename: "remoteEntry.js",
  exposes: {
    "./components": "./src/components",
  },
  shared: {
    lodash: {
      singleton: true,
      requiredVersion: "^4.17.15",
    },
  },
});

// Web 应用的 webpack.config.js
new ModuleFederationPlugin({
  name: "web_app",
  remotes: {
    component_lib: "component_lib@http://localhost:3001/remoteEntry.js",
  },
  shared: {
    lodash: {
      singleton: true,
      requiredVersion: "^4.17.15",
    },
  },
});
```

### 5. 使用 Webpack 的 externals 结合 CDN

将 lodash 配置为外部依赖，并通过 CDN 引入：

```javascript
// webpack.config.js
module.exports = {
  // ...
  externals: {
    lodash: "_",
  },
};
```

然后在 HTML 中通过 CDN 引入 lodash：

```html
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
```

### 6. 使用 Webpack 的 optimization.splitChunks

在 Web 应用的 Webpack 配置中，使用 `splitChunks` 提取共享模块：

```javascript
// webpack.config.js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]lodash[\\/]/,
          name: "vendor.lodash",
          chunks: "all",
        },
      },
    },
  },
};
```

### 7. 使用 resolve.alias 确保使用同一个 lodash 实例

在 Web 应用的 Webpack 配置中，使用 `resolve.alias` 强制所有 lodash 引用指向同一位置：

```javascript
// webpack.config.js
module.exports = {
  // ...
  resolve: {
    alias: {
      lodash: path.resolve(__dirname, "node_modules/lodash"),
    },
  },
};
```

## 不同方案的适用场景与比较

| 解决方案         | 优点                         | 缺点                             | 适用场景                   |
| ---------------- | ---------------------------- | -------------------------------- | -------------------------- |
| peerDependencies | 简单，无需改变构建配置       | 依赖版本管理可能复杂             | 发布到 npm 的库            |
| externals        | 配置简单，减小库体积         | 需要确保运行环境提供依赖         | 与特定框架集成的库         |
| DLL 插件         | 提高构建速度，明确依赖管理   | 配置复杂，需要额外构建步骤       | 大型应用，多个依赖共享     |
| 模块联邦         | 灵活，支持运行时共享         | 需要 Webpack 5，配置较复杂       | 微前端架构，独立部署的应用 |
| externals + CDN  | 减小打包体积，利用浏览器缓存 | 增加额外的网络请求，依赖外部服务 | 公共库使用广泛的场景       |
| splitChunks      | 配置简单，自动处理           | 不适用于库开发，只对应用有效     | 单一应用中整合多个库       |
| resolve.alias    | 实现简单，强制使用同一实例   | 可能导致版本冲突                 | 解决特定依赖问题           |

## 实际应用示例

### 示例一：组件库开发者最佳实践

如果你是组件库的开发者，最佳实践是：

```json
// 组件库的 package.json
{
  "name": "my-ui-library",
  "version": "1.0.0",
  "peerDependencies": {
    "lodash": "^4.17.15"
  },
  "devDependencies": {
    "lodash": "^4.17.15"
  }
}
```

```javascript
// 组件库的 webpack.config.js
module.exports = {
  // ...
  externals: {
    lodash: {
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
      root: "_",
    },
    react: "React",
    "react-dom": "ReactDOM",
  },
};
```

### 示例二：Web 应用开发者最佳实践

如果你是使用组件库的 Web 应用开发者：

```javascript
// Web 应用的 webpack.config.js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        lodash: {
          test: /[\\/]node_modules[\\/]lodash[\\/]/,
          name: "vendor.lodash",
          chunks: "all",
          priority: 10,
        },
      },
    },
  },
  resolve: {
    alias: {
      // 确保使用同一个 lodash 实例
      lodash: path.resolve(__dirname, "node_modules/lodash"),
    },
  },
};
```

## 如何验证 lodash 是否被打包多次

### 1. 使用 Webpack Bundle Analyzer

安装并配置 Webpack Bundle Analyzer 插件：

```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  // ...
  plugins: [new BundleAnalyzerPlugin()],
};
```

构建后，它会生成一个可视化报告，显示各模块在打包结果中的体积占比。

### 2. 检查打包后的代码

在打包后的代码中搜索 lodash 特有的函数实现或注释，如果出现多次，说明被重复打包。

### 3. 使用 source-map-explorer

```bash
npm install --save-dev source-map-explorer
```

```bash
source-map-explorer dist/main.js
```

## 常见陷阱与注意事项

### 1. 子依赖中的 lodash

有时问题不是直接依赖的 lodash，而是子依赖中使用的 lodash。解决方法：

- 使用 npm 的 `resolutions` 字段（在 yarn 中）强制所有子依赖使用相同版本
- 使用 Webpack 的 `resolve.alias` 将所有 lodash 引用指向同一实例

### 2. 不同形式的 lodash 引用

lodash 有多种引用形式，如 `lodash`、`lodash-es`、单个函数如 `lodash.debounce` 等。确保处理所有形式：

```javascript
resolve: {
  alias: {
    'lodash': path.resolve(__dirname, 'node_modules/lodash'),
    'lodash-es': path.resolve(__dirname, 'node_modules/lodash')
  }
}
```

### 3. Tree Shaking 与完整引入

使用 ES 模块和按需导入可以启用 Tree Shaking：

```javascript
// 不利于 Tree Shaking
import _ from "lodash";

// 有利于 Tree Shaking
import { map, filter } from "lodash-es";
```

### 4. 版本兼容性问题

当强制使用单一 lodash 实例时，可能会遇到版本兼容性问题。解决方法：

- 在应用中使用与所有组件库兼容的 lodash 版本
- 使用 semver 范围确保兼容性，如 `^4.0.0`（兼容 4.x.x 的所有版本）

## 总结

防止 lodash 被重复打包的最佳实践组合：

1. **组件库开发者**：

   - 使用 `peerDependencies` 声明 lodash
   - 配置 Webpack `externals` 排除 lodash
   - 考虑提供 ES 模块版本以支持 Tree Shaking

2. **Web 应用开发者**：

   - 使用 `splitChunks` 提取共享依赖
   - 配置 `resolve.alias` 确保使用同一实例
   - 使用 Bundle Analyzer 监控打包结果

3. **大型项目或微前端架构**：
   - 考虑使用 Webpack 5 的模块联邦
   - 或使用 DLL 插件预打包共享依赖

通过以上策略，可以有效避免 lodash 被重复打包，减小构建产物体积，提高应用加载性能。
