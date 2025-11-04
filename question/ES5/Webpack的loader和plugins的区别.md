# Webpack Loader 和 Plugin 的区别

## 核心区别

| 特性         | Loader                  | Plugin                                       |
| ------------ | ----------------------- | -------------------------------------------- |
| **作用时机** | 模块加载时（文件转换）  | 整个编译生命周期                             |
| **作用对象** | 特定类型的文件          | 整个构建流程                                 |
| **功能范围** | 文件转换（输入 → 输出） | 更广泛（打包优化、资源管理、注入环境变量等） |
| **执行顺序** | 从右到左、从下到上      | 按照插件注册顺序                             |
| **本质**     | 函数（转换函数）        | 类（带有 apply 方法）                        |
| **配置位置** | `module.rules`          | `plugins` 数组                               |

---

## 1. Loader 详解

### 什么是 Loader？

**Loader 是文件转换器**，它让 Webpack 能够处理非 JavaScript 文件（如 CSS、图片、TypeScript 等）。

### 工作原理

```javascript
// Loader 的本质是一个函数
module.exports = function (source) {
  // source 是文件内容（字符串或 Buffer）

  // 对内容进行转换
  const transformedSource = transform(source);

  // 返回转换后的内容
  return transformedSource;
};
```

### 特点

1. **单一职责**：每个 Loader 只做一件事
2. **链式调用**：多个 Loader 可以串联使用
3. **从右到左执行**（或从下到上）

### 常见 Loader 示例

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      // 1. 处理 CSS 文件
      {
        test: /\.css$/,
        use: [
          "style-loader", // 3. 将 CSS 插入到 DOM
          "css-loader", // 2. 解析 CSS，处理 @import 和 url()
          "postcss-loader", // 1. 使用 PostCSS 处理 CSS（添加浏览器前缀等）
        ],
        // ⚠️ 执行顺序：postcss-loader → css-loader → style-loader
      },

      // 2. 处理 TypeScript
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },

      // 3. 处理图片
      {
        test: /\.(png|jpg|gif)$/,
        type: "asset/resource", // Webpack 5 内置
        // 或使用 file-loader（Webpack 4）
      },

      // 4. 处理字体
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset/resource",
      },

      // 5. 处理 Babel
      {
        test: /\.jsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
        exclude: /node_modules/,
      },

      // 6. 处理 SCSS
      {
        test: /\.scss$/,
        use: [
          "style-loader", // 4. 插入到 DOM
          "css-loader", // 3. 解析 CSS
          "postcss-loader", // 2. PostCSS 处理
          "sass-loader", // 1. 编译 SCSS 为 CSS
        ],
      },

      // 7. 处理 Vue 单文件组件
      {
        test: /\.vue$/,
        use: "vue-loader",
      },

      // 8. 处理 Markdown
      {
        test: /\.md$/,
        use: ["html-loader", "markdown-loader"],
      },
    ],
  },
};
```

### Loader 的执行顺序

```javascript
// 示例：处理 SCSS 文件
{
  test: /\.scss$/,
  use: ['style-loader', 'css-loader', 'sass-loader']
}

// 执行流程：
// 1. sass-loader:  .scss → .css
// 2. css-loader:   解析 CSS，处理依赖
// 3. style-loader: 将 CSS 插入到 <style> 标签
```

**可视化流程**：

```
.scss 文件
    ↓
sass-loader (编译)
    ↓
CSS 字符串
    ↓
css-loader (解析依赖)
    ↓
CSS Module 对象
    ↓
style-loader (插入 DOM)
    ↓
浏览器显示样式
```

### 自定义 Loader 示例

```javascript
// my-loader.js
/**
 * 简单的 Loader：将文件内容转为大写
 * @param {string} source - 文件内容
 * @returns {string} - 转换后的内容
 */
module.exports = function (source) {
  // this 是 Webpack 提供的上下文对象
  const options = this.getOptions(); // 获取 Loader 配置

  console.log("Processing file:", this.resourcePath);

  // 转换内容
  const result = source.toUpperCase();

  // 返回转换后的内容
  return result;
};

// 使用
module.exports = {
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: {
          loader: "./my-loader.js",
          options: {
            // Loader 配置
          },
        },
      },
    ],
  },
};
```

### 带缓存的 Loader

```javascript
// cache-loader-example.js
const crypto = require("crypto");

module.exports = function (source) {
  // 获取缓存
  const callback = this.async(); // 异步 Loader
  const cacheKey = crypto.createHash("md5").update(source).digest("hex");

  // 检查缓存
  this.cacheable?.(true); // 标记可缓存

  // 异步处理
  setTimeout(() => {
    const result = transform(source);
    callback(null, result);
  }, 100);
};

function transform(source) {
  // 耗时的转换操作
  return source.replace(/foo/g, "bar");
}
```

---

## 2. Plugin 详解

### 什么是 Plugin？

**Plugin 是功能扩展器**，它可以在 Webpack 构建流程的各个阶段执行自定义操作。

### 工作原理

```javascript
// Plugin 的本质是一个类
class MyPlugin {
  constructor(options) {
    this.options = options;
  }

  // apply 方法是 Plugin 的入口
  apply(compiler) {
    // compiler 是 Webpack 的核心对象
    // 包含了所有的配置信息和方法

    // 监听 Webpack 的生命周期钩子
    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      // compilation 包含了本次构建的所有信息
      console.log("即将生成文件...");

      // 修改输出资源
      compilation.assets["extra-file.txt"] = {
        source: () => "Extra content",
        size: () => 13,
      };

      callback();
    });
  }
}

module.exports = MyPlugin;
```

### 特点

1. **功能强大**：可以访问整个编译流程
2. **事件驱动**：基于 Tapable 的钩子系统
3. **灵活性高**：可以修改输出、添加资源、优化等

### 常见 Plugin 示例

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  plugins: [
    // 1. 自动生成 HTML 文件
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
    }),

    // 2. 提取 CSS 到单独文件
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:8].css",
      chunkFilename: "css/[id].[contenthash:8].css",
    }),

    // 3. 清理输出目录
    new CleanWebpackPlugin(),

    // 4. 复制静态资源
    new CopyWebpackPlugin({
      patterns: [{ from: "public", to: "assets" }],
    }),

    // 5. 定义环境变量
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      API_URL: JSON.stringify("https://api.example.com"),
    }),

    // 6. 热模块替换
    new webpack.HotModuleReplacementPlugin(),

    // 7. 进度显示
    new webpack.ProgressPlugin((percentage, message) => {
      console.log(`${(percentage * 100).toFixed(2)}% ${message}`);
    }),

    // 8. 压缩 JavaScript
    // Webpack 5 内置，通过 optimization.minimize 配置

    // 9. 分析打包结果
    // new BundleAnalyzerPlugin(),

    // 10. 提取公共代码（通过 optimization.splitChunks 配置）
  ],
};
```

### Webpack 生命周期钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // 1. 初始化阶段
    compiler.hooks.initialize.tap("MyPlugin", () => {
      console.log("Webpack 初始化");
    });

    // 2. 编译开始
    compiler.hooks.beforeCompile.tapAsync("MyPlugin", (params, callback) => {
      console.log("编译即将开始");
      callback();
    });

    compiler.hooks.compile.tap("MyPlugin", () => {
      console.log("编译开始");
    });

    // 3. 模块构建
    compiler.hooks.compilation.tap("MyPlugin", (compilation) => {
      // 监听模块构建
      compilation.hooks.buildModule.tap("MyPlugin", (module) => {
        console.log("构建模块:", module.resource);
      });

      // 优化模块
      compilation.hooks.optimizeModules.tap("MyPlugin", (modules) => {
        console.log("优化模块");
      });
    });

    // 4. 资源生成
    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      console.log("即将生成文件");

      // 访问生成的资源
      Object.keys(compilation.assets).forEach((filename) => {
        console.log("生成文件:", filename);
      });

      callback();
    });

    // 5. 完成
    compiler.hooks.done.tap("MyPlugin", (stats) => {
      console.log("编译完成");
      console.log("耗时:", stats.endTime - stats.startTime, "ms");
    });

    // 6. 失败
    compiler.hooks.failed.tap("MyPlugin", (error) => {
      console.error("编译失败:", error);
    });
  }
}
```

### 自定义 Plugin 实战示例

#### 示例 1：文件列表 Plugin

```javascript
// file-list-plugin.js
class FileListPlugin {
  constructor(options = {}) {
    this.filename = options.filename || "filelist.md";
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("FileListPlugin", (compilation, callback) => {
      // 获取所有生成的文件
      const filelist = Object.keys(compilation.assets)
        .map((filename) => {
          const size = compilation.assets[filename].size();
          return `- ${filename} (${(size / 1024).toFixed(2)} KB)`;
        })
        .join("\n");

      // 生成文件列表
      const content = `# 构建文件列表\n\n生成时间: ${new Date().toLocaleString()}\n\n${filelist}`;

      // 添加到输出资源
      compilation.assets[this.filename] = {
        source: () => content,
        size: () => content.length,
      };

      callback();
    });
  }
}

module.exports = FileListPlugin;

// 使用
module.exports = {
  plugins: [new FileListPlugin({ filename: "build-files.md" })],
};
```

#### 示例 2：压缩图片 Plugin

```javascript
// compress-images-plugin.js
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");

class CompressImagesPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "CompressImagesPlugin",
      async (compilation, callback) => {
        const imageAssets = Object.keys(compilation.assets).filter((filename) =>
          /\.(png|jpg|jpeg|gif)$/i.test(filename)
        );

        for (const filename of imageAssets) {
          const asset = compilation.assets[filename];
          const source = asset.source();

          // 压缩图片
          const compressed = await imagemin.buffer(source, {
            plugins: [imageminPngquant({ quality: [0.6, 0.8] })],
          });

          // 更新资源
          compilation.assets[filename] = {
            source: () => compressed,
            size: () => compressed.length,
          };

          console.log(
            `压缩图片: ${filename} (${(source.length / 1024).toFixed(2)}KB → ${(
              compressed.length / 1024
            ).toFixed(2)}KB)`
          );
        }

        callback();
      }
    );
  }
}

module.exports = CompressImagesPlugin;
```

#### 示例 3：注入版本号 Plugin

```javascript
// version-plugin.js
class VersionPlugin {
  constructor(options = {}) {
    this.version = options.version || "1.0.0";
  }

  apply(compiler) {
    compiler.hooks.compilation.tap("VersionPlugin", (compilation) => {
      // 处理 HTML
      const HtmlWebpackPlugin = require("html-webpack-plugin");

      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        "VersionPlugin",
        (data, callback) => {
          // 在 HTML 中注入版本号
          data.html = data.html.replace(
            "</head>",
            `<meta name="version" content="${this.version}"></head>`
          );
          callback(null, data);
        }
      );
    });

    compiler.hooks.emit.tap("VersionPlugin", (compilation) => {
      // 在 JS 文件中注入版本号
      Object.keys(compilation.assets).forEach((filename) => {
        if (filename.endsWith(".js")) {
          const asset = compilation.assets[filename];
          const source = asset.source();

          // 在文件开头添加注释
          const newSource = `/* Version: ${
            this.version
          } - Built: ${new Date().toISOString()} */\n${source}`;

          compilation.assets[filename] = {
            source: () => newSource,
            size: () => newSource.length,
          };
        }
      });
    });
  }
}

module.exports = VersionPlugin;
```

---

## 3. Loader vs Plugin 对比实例

### 场景 1：处理 CSS

#### 使用 Loader

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};

// 作用：将 CSS 文件转换并注入到 JS 中
// 结果：CSS 以 <style> 标签的形式插入到 HTML
```

#### 使用 Plugin

```javascript
// webpack.config.js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // 替代 style-loader
          "css-loader",
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
};

// 作用：将 CSS 提取到单独的文件
// 结果：生成独立的 styles.css 文件
```

### 场景 2：代码压缩

#### Loader 的局限

```javascript
// ❌ 不适合用 Loader 做代码压缩
// Loader 是针对单个文件的转换，无法处理全局优化
```

#### Plugin 的优势

```javascript
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true, // 多进程压缩
        terserOptions: {
          compress: {
            drop_console: true, // 删除 console
          },
        },
      }),
    ],
  },
};

// 作用：压缩所有 JS 文件
// Plugin 可以访问所有资源，进行全局优化
```

---

## 4. 实战配置示例

### 完整的 Webpack 配置

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].[contenthash:8].js",
    clean: true,
  },

  module: {
    rules: [
      // Loader 配置
      {
        test: /\.jsx?$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8KB 以下转 base64
          },
        },
        generator: {
          filename: "images/[name].[hash:8][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[hash:8][ext]",
        },
      },
    ],
  },

  plugins: [
    // Plugin 配置
    new CleanWebpackPlugin(),

    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
      },
    }),

    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:8].css",
      chunkFilename: "css/[id].[contenthash:8].css",
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

---

## 5. 关键要点总结

### Loader

✅ **用于文件转换**  
✅ **单一职责，链式调用**  
✅ **作用于模块加载阶段**  
✅ **从右到左、从下到上执行**  
✅ **处理特定类型文件**

**使用场景**：

- 编译 TypeScript、Babel
- 处理 CSS、SCSS、Less
- 加载图片、字体
- 转换 Markdown、YAML 等

### Plugin

✅ **功能扩展，更强大**  
✅ **可访问整个编译流程**  
✅ **基于事件钩子系统**  
✅ **按注册顺序执行**  
✅ **可以修改输出、优化、添加资源**

**使用场景**：

- 打包优化、压缩
- 生成 HTML 文件
- 提取 CSS 到单独文件
- 清理目录
- 定义环境变量
- 代码分割
- 热更新

---

## 6. 选择 Loader 还是 Plugin？

### 判断标准

```
需要转换文件内容？
    ↓
   YES → 使用 Loader
    │
    └─ 例如：
       - 将 SCSS 编译为 CSS
       - 将 TypeScript 编译为 JavaScript
       - 处理图片、字体

需要在构建流程中执行操作？
    ↓
   YES → 使用 Plugin
    │
    └─ 例如：
       - 压缩代码
       - 生成 HTML
       - 提取 CSS
       - 清理目录
       - 代码分割
```

### 实际例子

```javascript
// ❓ 我想将 SCSS 转为 CSS
// ✅ 使用 Loader
{
  test: /\.scss$/,
  use: ['style-loader', 'css-loader', 'sass-loader']
}

// ❓ 我想将 CSS 提取到单独文件
// ✅ 使用 Plugin
new MiniCssExtractPlugin({
  filename: 'styles.css'
})

// ❓ 我想压缩所有 JS 文件
// ✅ 使用 Plugin
new TerserPlugin()

// ❓ 我想转换 ES6+ 语法
// ✅ 使用 Loader
{
  test: /\.js$/,
  use: 'babel-loader'
}
```

---

## 7. 常见误区

### 误区 1：Loader 和 Plugin 可以互换

❌ **错误理解**：Loader 和 Plugin 功能类似，可以随意选择

✅ **正确理解**：

- Loader 专注于**文件转换**（输入 → 输出）
- Plugin 负责**构建流程扩展**（更广泛的功能）

### 误区 2：Loader 只能转换一次

❌ **错误理解**：一个文件只能被一个 Loader 处理

✅ **正确理解**：

- Loader 可以**链式调用**
- 多个 Loader 按顺序处理同一个文件

### 误区 3：Plugin 必须在 Loader 之后

❌ **错误理解**：Plugin 要等 Loader 执行完才能运行

✅ **正确理解**：

- Plugin 在**整个构建生命周期**中运行
- 可以在 Loader 之前、之中、之后执行
- 通过钩子系统灵活控制执行时机

---

## 8. 面试高频问题

### Q1: Loader 和 Plugin 的本质区别是什么？

**答案**：

- **Loader**：本质是**函数**，用于转换文件内容（输入 → 输出）
- **Plugin**：本质是**类**，通过 `apply` 方法接入 Webpack 构建流程，可以监听各种钩子事件

### Q2: 为什么 Loader 是从右到左执行？

**答案**：
这是函数式编程的组合（compose）模式：

```javascript
// 从右到左
use: ["a-loader", "b-loader", "c-loader"];

// 等价于
compose(aLoader, bLoader, cLoader)(source);
// = aLoader(bLoader(cLoader(source)))

// 执行顺序：c-loader → b-loader → a-loader
```

### Q3: Plugin 如何获取 Webpack 的配置信息？

**答案**：

```javascript
class MyPlugin {
  apply(compiler) {
    // compiler.options 包含所有配置
    const { entry, output, mode } = compiler.options;
    console.log("Entry:", entry);
    console.log("Output:", output);
    console.log("Mode:", mode);
  }
}
```

### Q4: 如何编写一个同时处理多种文件的工具？

**答案**：

- 如果是**文件转换** → 编写多个 Loader
- 如果是**构建优化** → 编写一个 Plugin

```javascript
// ✅ Loader 方式（针对不同文件类型）
module: {
  rules: [
    { test: /\.css$/, use: "my-css-loader" },
    { test: /\.scss$/, use: "my-scss-loader" },
  ];
}

// ✅ Plugin 方式（统一处理所有资源）
plugins: [
  new OptimizeAssetsPlugin(), // 可以优化所有类型的资源
];
```

---

## 总结

| 维度       | Loader             | Plugin           |
| ---------- | ------------------ | ---------------- |
| **定义**   | 模块转换器（函数） | 功能扩展器（类） |
| **作用**   | 转换文件内容       | 扩展构建功能     |
| **时机**   | 模块加载时         | 整个构建生命周期 |
| **能力**   | 文件级别           | 全局级别         |
| **复杂度** | 相对简单           | 相对复杂         |
| **配置**   | `module.rules`     | `plugins`        |
| **API**    | 同步/异步函数      | Tapable 钩子系统 |

**记忆口诀**：

- **Loader** = 转换器，处理文件，从右到左
- **Plugin** = 扩展器，处理流程，监听钩子

掌握这些知识点，就能在面试和实际开发中游刃有余地使用 Webpack！
