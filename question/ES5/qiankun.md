# qiankun 微前端实战：常见问题与解决方案

## 问题：在使用 qiankun 构建微应用，在实际开发中常遇到的问题以及解决方案

---

## 目录

1. [样式隔离问题](#一样式隔离问题)
2. [静态资源加载问题](#二静态资源加载问题)
3. [路由问题](#三路由问题)
4. [应用间通信问题](#四应用间通信问题)
5. [全局状态污染问题](#五全局状态污染问题)
6. [生命周期问题](#六生命周期问题)
7. [第三方库兼容性问题](#七第三方库兼容性问题)
8. [性能优化问题](#八性能优化问题)
9. [部署与构建问题](#九部署与构建问题)
10. [开发调试问题](#十开发调试问题)

---

## 一、样式隔离问题

### 问题 1.1：子应用样式污染主应用或其他子应用

**现象：**

```
- 子应用 A 的样式影响了主应用的布局
- 子应用 A 的样式影响了子应用 B
- 主应用的全局样式影响了子应用
```

**原因分析：**

- CSS 全局作用域特性
- qiankun 默认的样式隔离方案有限制

**解决方案 1：使用 qiankun 的 strictStyleIsolation（严格样式隔离）**

```javascript
// 主应用 - main.js
import { registerMicroApps, start } from "qiankun";

registerMicroApps(
  [
    {
      name: "app1",
      entry: "//localhost:8081",
      container: "#subapp-container",
      activeRule: "/app1",
    },
  ],
  {
    // 开启严格样式隔离（基于 Shadow DOM）
    sandbox: {
      strictStyleIsolation: true,
    },
  }
);

start();
```

**优点：** 完全隔离样式
**缺点：**

- 部分 UI 组件库（如 Ant Design 的弹窗）可能不兼容 Shadow DOM
- 第三方插件可能失效

**解决方案 2：使用 experimentalStyleIsolation（实验性样式隔离）**

```javascript
registerMicroApps(
  [
    {
      name: "app1",
      entry: "//localhost:8081",
      container: "#subapp-container",
      activeRule: "/app1",
    },
  ],
  {
    sandbox: {
      // 通过动态添加/移除样式表实现隔离
      experimentalStyleIsolation: true,
    },
  }
);
```

**优点：** 兼容性更好，不使用 Shadow DOM
**缺点：** 隔离效果相对较弱

**解决方案 3：CSS Modules 或 CSS-in-JS（推荐）**

```javascript
// 子应用使用 CSS Modules
import styles from "./App.module.css";

function App() {
  return <div className={styles.container}>子应用内容</div>;
}
```

```javascript
// 或使用 styled-components
import styled from "styled-components";

const Container = styled.div`
  padding: 20px;
  background: #f0f0f0;
`;

function App() {
  return <Container>子应用内容</Container>;
}
```

**解决方案 4：添加统一的命名空间**

```css
/* 子应用 A - 所有样式加前缀 */
.app-a-container {
  padding: 20px;
}

.app-a-header {
  background: #fff;
}
```

```javascript
// 配合 postcss-prefix-selector 自动添加前缀
// postcss.config.js
module.exports = {
  plugins: [
    require("postcss-prefix-selector")({
      prefix: ".app-a",
      exclude: [".app-a"],
    }),
  ],
};
```

### 问题 1.2：第三方组件库（如 Ant Design）的弹窗、Tooltip 等组件样式丢失

**现象：**

```
开启 strictStyleIsolation 后，Ant Design 的 Modal、Tooltip 等组件不显示或样式异常
```

**原因：**

- 这些组件默认挂载到 document.body，在 Shadow DOM 外部
- 子应用的样式无法穿透 Shadow DOM

**解决方案 1：修改组件的挂载容器**

```javascript
// React + Ant Design
import { ConfigProvider } from "antd";

function App() {
  return (
    <ConfigProvider
      getPopupContainer={(triggerNode) => {
        // 将弹窗挂载到当前容器内
        return triggerNode?.parentElement || document.body;
      }}
    >
      <YourComponents />
    </ConfigProvider>
  );
}
```

**解决方案 2：使用 experimentalStyleIsolation 代替 strictStyleIsolation**

```javascript
// 主应用配置
sandbox: {
  experimentalStyleIsolation: true,  // 改用实验性隔离
}
```

**解决方案 3：手动管理弹窗样式**

```javascript
// 子应用入口文件
import { mount } from "qiankun";

export async function bootstrap() {
  // 动态插入样式到 body
  const style = document.createElement("style");
  style.innerHTML = `
    /* Ant Design 弹窗样式 */
    .ant-modal-wrap { /* ... */ }
  `;
  document.head.appendChild(style);
}
```

---

## 二、静态资源加载问题

### 问题 2.1：子应用静态资源 404（图片、字体等）

**现象：**

```
子应用的图片、字体文件加载失败，路径为 http://localhost:8080/static/xxx.png
而实际应该是 http://localhost:8081/static/xxx.png
```

**原因：**

- 子应用使用了相对路径
- qiankun 运行在主应用域名下，资源路径解析错误

**解决方案 1：设置 webpack publicPath（运行时）**

```javascript
// 子应用 - public-path.js（在入口文件最顶部引入）
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

```javascript
// 子应用 - main.js
import "./public-path"; // 必须在最顶部
import Vue from "vue";
import App from "./App.vue";

// ... 其他代码
```

**解决方案 2：配置 webpack publicPath（构建时）**

```javascript
// 子应用 - vue.config.js
const { name } = require("./package.json");

module.exports = {
  publicPath:
    process.env.NODE_ENV === "production"
      ? "https://cdn.example.com/app1/" // 生产环境使用 CDN
      : "//localhost:8081/", // 开发环境使用子应用端口

  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: "umd",
    },
  },
};
```

**解决方案 3：使用绝对路径或完整 URL**

```javascript
// 不推荐：相对路径
<img src="./assets/logo.png" />

// 推荐：绝对路径
<img src={`${process.env.PUBLIC_URL}/assets/logo.png`} />

// 或使用 require
<img src={require('@/assets/logo.png')} />
```

### 问题 2.2：动态加载的资源（懒加载路由、异步组件）加载失败

**现象：**

```
路由懒加载的组件、动态 import 的模块加载 404
```

**解决方案：配置 webpack chunkPublicPath**

```javascript
// 子应用 - vue.config.js
module.exports = {
  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: "umd",
      jsonpFunction: `webpackJsonp_${name}`,
      // 设置异步加载的资源路径
      chunkLoadingGlobal: `webpackJsonp_${name}`,
    },
  },
};
```

```javascript
// React 项目 - config-overrides.js
module.exports = {
  webpack: (config) => {
    config.output.library = `${packageName}-[name]`;
    config.output.libraryTarget = "umd";
    // 确保异步加载的资源路径正确
    config.output.chunkLoadingGlobal = `webpackJsonp_${packageName}`;
    config.output.globalObject = "window";
    return config;
  },
};
```

---

## 三、路由问题

### 问题 3.1：子应用路由刷新后 404

**现象：**

```
访问 http://localhost:8080/app1/dashboard 刷新后 404
```

**原因：**

- 主应用服务器不知道 /app1/dashboard 路由
- 需要配置服务器支持 History 模式

**解决方案 1：主应用服务器配置（开发环境）**

```javascript
// 主应用 - vue.config.js（Vue CLI）
module.exports = {
  devServer: {
    historyApiFallback: true, // 所有 404 都返回 index.html
    proxy: {
      "/app1": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
};
```

**解决方案 2：nginx 配置（生产环境）**

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;  # 所有路由都返回主应用 index.html
  }
}
```

### 问题 3.2：主应用和子应用路由冲突

**现象：**

```
主应用有 /user 路由，子应用也有 /user 路由，导致冲突
```

**解决方案：子应用路由添加 base 前缀**

```javascript
// 子应用 - router.js (Vue Router)
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  // 在 qiankun 环境下使用 /app1 前缀
  history: createWebHistory(window.__POWERED_BY_QIANKUN__ ? "/app1" : "/"),
  routes: [
    { path: "/dashboard", component: Dashboard }, // 实际路径为 /app1/dashboard
    { path: "/user", component: User }, // 实际路径为 /app1/user
  ],
});

export default router;
```

```javascript
// 子应用 - router.js (React Router)
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? "/app1" : "/"}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 问题 3.3：子应用路由跳转不生效

**现象：**

```
在子应用中使用 router.push('/app1/dashboard') 跳转失败
```

**原因：**

- 已经在 basename 中设置了 /app1，重复添加导致路径错误

**解决方案：跳转时使用相对路径**

```javascript
// ❌ 错误写法
router.push("/app1/dashboard");

// ✅ 正确写法（已经在 basename 中配置了 /app1）
router.push("/dashboard");

// 或使用主应用的路由跳转
import { navigateToUrl } from "single-spa";
navigateToUrl("/app1/dashboard");
```

---

## 四、应用间通信问题

### 问题 4.1：主应用如何传递数据给子应用

**解决方案 1：通过 props 传递（推荐用于初始化数据）**

```javascript
// 主应用
registerMicroApps([
  {
    name: "app1",
    entry: "//localhost:8081",
    container: "#subapp-container",
    activeRule: "/app1",
    props: {
      // 传递给子应用的数据
      data: {
        user: { name: "admin", role: "admin" },
        token: "xxx-token",
      },
      // 传递方法
      onGlobalStateChange: (state) => console.log(state),
    },
  },
]);
```

```javascript
// 子应用 - main.js
export async function mount(props) {
  console.log("接收到主应用传递的 props:", props);

  const { data, onGlobalStateChange } = props;

  // 使用数据初始化应用
  render(props);
}

function render(props = {}) {
  const { container, data } = props;

  new Vue({
    router,
    store,
    render: (h) => h(App, { props: { appData: data } }),
  }).$mount(container ? container.querySelector("#app") : "#app");
}
```

**解决方案 2：使用 qiankun 的全局状态管理（推荐用于动态通信）**

```javascript
// 主应用 - main.js
import { initGlobalState } from "qiankun";

// 初始化全局状态
const actions = initGlobalState({
  user: { name: "admin" },
  token: "xxx",
  theme: "light",
});

// 监听全局状态变化
actions.onGlobalStateChange((state, prev) => {
  console.log("主应用监听到状态变化:", state, prev);
});

// 修改全局状态
actions.setGlobalState({
  user: { name: "new-user" },
});

// 将 actions 传递给子应用
registerMicroApps([
  {
    name: "app1",
    entry: "//localhost:8081",
    container: "#subapp-container",
    activeRule: "/app1",
    props: { actions }, // 传递 actions
  },
]);
```

```javascript
// 子应用 - main.js
let actions = null;

export async function mount(props) {
  actions = props.actions;

  // 监听全局状态变化
  actions.onGlobalStateChange((state, prev) => {
    console.log("子应用监听到状态变化:", state, prev);
    // 更新子应用状态
    store.commit("updateUser", state.user);
  }, true); // true 表示立即触发一次回调

  render(props);
}

// 在子应用中修改全局状态
function updateTheme(theme) {
  actions.setGlobalState({ theme });
}
```

**解决方案 3：自定义事件总线**

```javascript
// shared/eventBus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }
}

export default new EventBus();
```

```javascript
// 主应用
import eventBus from "@/shared/eventBus";

eventBus.on("userLogout", () => {
  console.log("用户退出登录");
});

// 将 eventBus 传递给子应用
props: {
  eventBus;
}
```

```javascript
// 子应用
function logout() {
  eventBus.emit("userLogout");
}
```

### 问题 4.2：子应用之间如何通信

**解决方案 1：通过主应用中转（推荐）**

```javascript
// 子应用 A → 主应用 → 子应用 B
// 子应用 A
actions.setGlobalState({
  from: "app-a",
  message: "Hello from App A",
});

// 主应用监听并处理
actions.onGlobalStateChange((state) => {
  if (state.from === "app-a") {
    // 转发给子应用 B
    actions.setGlobalState({
      to: "app-b",
      message: state.message,
    });
  }
});

// 子应用 B 接收
actions.onGlobalStateChange((state) => {
  if (state.to === "app-b") {
    console.log("收到消息:", state.message);
  }
});
```

**解决方案 2：使用 LocalStorage/SessionStorage + 监听**

```javascript
// 子应用 A
localStorage.setItem(
  "app-message",
  JSON.stringify({
    from: "app-a",
    data: "some data",
    timestamp: Date.now(),
  })
);

// 触发 storage 事件
window.dispatchEvent(new Event("storage"));

// 子应用 B
window.addEventListener("storage", (e) => {
  if (e.key === "app-message") {
    const message = JSON.parse(e.newValue);
    console.log("收到消息:", message);
  }
});
```

---

## 五、全局状态污染问题

### 问题 5.1：子应用污染全局变量（window、document）

**现象：**

```javascript
// 子应用 A
window.myGlobalVar = "from app A";

// 子应用 B 意外访问到
console.log(window.myGlobalVar); // 'from app A'
```

**解决方案：qiankun 默认已开启 JavaScript 沙箱**

```javascript
// 主应用配置
registerMicroApps(
  [
    {
      name: "app1",
      entry: "//localhost:8081",
      container: "#subapp-container",
      activeRule: "/app1",
    },
  ],
  {
    sandbox: true, // 默认为 true，开启沙箱
    // 或更细致的配置
    sandbox: {
      strictStyleIsolation: false,
      experimentalStyleIsolation: false,
    },
  }
);
```

**qiankun 沙箱机制：**

- **快照沙箱**（单实例场景）：记录 window 快照，卸载时恢复
- **代理沙箱**（多实例场景）：使用 Proxy 代理 window 对象

### 问题 5.2：子应用卸载后全局事件监听未清除

**现象：**

```javascript
// 子应用注册了事件监听
window.addEventListener("resize", handleResize);

// 子应用卸载后，handleResize 仍在执行，导致内存泄漏
```

**解决方案：在 unmount 生命周期中清理**

```javascript
// 子应用 - main.js
let resizeHandler = null;

export async function mount(props) {
  resizeHandler = () => {
    console.log("窗口大小变化");
  };
  window.addEventListener("resize", resizeHandler);

  render(props);
}

export async function unmount() {
  // 清理事件监听
  window.removeEventListener("resize", resizeHandler);

  // 清理定时器
  clearInterval(timerId);

  // 清理 DOM
  instance.$destroy();
  instance.$el.innerHTML = "";
  instance = null;
}
```

### 问题 5.3：子应用使用了全局的 CSS 样式重置

**现象：**

```css
/* 子应用的全局样式 */
* {
  margin: 0;
  padding: 0;
}

/* 影响了主应用和其他子应用 */
```

**解决方案：使用作用域限定**

```css
/* 方案 1: 添加前缀 */
.app-a * {
  margin: 0;
  padding: 0;
}

/* 方案 2: 使用 CSS Modules */
:global(*) {
  margin: 0;
  padding: 0;
}

/* 方案 3: 使用 scoped（Vue） */
<style scoped>
* {
  margin: 0;
  padding: 0;
}
</style>
```

---

## 六、生命周期问题

### 问题 6.1：子应用首次加载慢

**原因：**

- 需要下载子应用的 JS、CSS 资源
- 子应用初始化耗时

**解决方案 1：预加载（prefetch）**

```javascript
// 主应用
import { start, prefetchApps } from 'qiankun';

// 注册微应用
registerMicroApps([...]);

// 启动 qiankun
start({
  prefetch: true,  // 开启预加载（默认为 true）
  // 或自定义预加载策略
  prefetch: 'all',  // 预加载所有子应用
  // prefetch: ['app1', 'app2'],  // 指定预加载的子应用
});

// 或手动预加载
prefetchApps([
  { name: 'app1', entry: '//localhost:8081' },
]);
```

**解决方案 2：使用 CDN 加速资源加载**

```javascript
// 子应用 - vue.config.js
module.exports = {
  publicPath:
    process.env.NODE_ENV === "production"
      ? "https://cdn.example.com/app1/"
      : "//localhost:8081/",
};
```

**解决方案 3：按需加载子应用资源**

```javascript
// 子应用 - 路由懒加载
const routes = [
  {
    path: "/dashboard",
    component: () =>
      import(/* webpackChunkName: "dashboard" */ "./Dashboard.vue"),
  },
];
```

### 问题 6.2：子应用重复挂载/卸载导致性能问题

**现象：**

```
用户在主应用的多个菜单间频繁切换，导致子应用反复挂载/卸载
```

**解决方案：使用 keepalive 模式（保持子应用存活）**

```javascript
// 主应用
import { loadMicroApp } from "qiankun";

let microApp = null;

function showApp(name, container) {
  if (!microApp) {
    // 首次加载
    microApp = loadMicroApp({
      name,
      entry: "//localhost:8081",
      container,
    });
  } else {
    // 显示已加载的子应用
    container.appendChild(microApp.getContainer());
  }
}

function hideApp() {
  // 隐藏但不卸载
  const container = microApp.getContainer();
  container.style.display = "none";
}
```

或使用 qiankun 的 `singular` 选项：

```javascript
start({
  singular: false, // 允许多个子应用同时存在
});
```

### 问题 6.3：子应用生命周期函数未正确导出

**现象：**

```
控制台报错：application 'app1' died in status LOADING_SOURCE_CODE:
You need to export the functional lifecycles in xxx entry
```

**原因：**

- 子应用未正确导出 bootstrap、mount、unmount 函数
- webpack library 配置错误

**解决方案：**

```javascript
// 子应用 - main.js
let instance = null;

export async function bootstrap() {
  console.log("[Vue] vue app bootstraped");
}

export async function mount(props = {}) {
  console.log("[Vue] props from main framework", props);
  render(props);
}

export async function unmount() {
  instance.$destroy();
  instance.$el.innerHTML = "";
  instance = null;
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

function render(props = {}) {
  const { container } = props;
  instance = new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount(container ? container.querySelector("#app") : "#app");
}
```

```javascript
// 子应用 - vue.config.js
const { name } = require("./package.json");

module.exports = {
  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: "umd", // 必须是 umd 格式
      jsonpFunction: `webpackJsonp_${name}`,
    },
  },
};
```

---

## 七、第三方库兼容性问题

### 问题 7.1：jQuery 或其他直接操作 DOM 的库在子应用中失效

**现象：**

```javascript
// 子应用使用 jQuery
$("#button").click(() => {
  console.log("clicked");
});

// 在 qiankun 中不生效或报错
```

**原因：**

- qiankun 的沙箱机制可能影响 DOM 查询
- 子应用容器动态插入，DOM 未准备好

**解决方案：确保在 mount 后操作 DOM**

```javascript
export async function mount(props) {
  render(props);

  // 等待 DOM 渲染完成
  await nextTick(); // Vue
  // 或
  setTimeout(() => {
    $("#button").click(() => {
      console.log("clicked");
    });
  }, 0);
}
```

### 问题 7.2：Echarts 图表在子应用切换后不显示

**现象：**

```
第一次加载时图表正常，卸载后再次加载，图表不显示
```

**原因：**

- Echarts 实例未正确销毁
- DOM 容器被复用但实例未重新初始化

**解决方案：在生命周期中正确管理实例**

```javascript
// 子应用
let chartInstance = null;

export async function mount(props) {
  render(props);

  // 初始化图表
  const chartDom = document.getElementById("chart");
  chartInstance = echarts.init(chartDom);
  chartInstance.setOption({
    // 配置项...
  });
}

export async function unmount() {
  // 销毁图表实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }

  // 销毁应用实例
  instance.$destroy();
  instance = null;
}
```

### 问题 7.3：Moment.js 等使用全局变量的库冲突

**现象：**

```
主应用和子应用使用不同版本的 moment.js，互相影响
```

**解决方案 1：使用 webpack externals 共享依赖**

```javascript
// 主应用 - 在 index.html 中引入
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>;

// 主应用 - webpack 配置
module.exports = {
  externals: {
    moment: "moment",
  },
};

// 子应用也配置相同的 externals
```

**解决方案 2：使用 Module Federation 共享依赖**

```javascript
// webpack.config.js
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "app1",
      shared: {
        moment: { singleton: true }, // 单例模式，共享同一个实例
        react: { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
};
```

---

## 八、性能优化问题

### 问题 8.1：多个子应用同时加载导致页面卡顿

**解决方案 1：按需加载 + 预加载策略优化**

```javascript
// 主应用
start({
  prefetch: "all", // 在浏览器空闲时预加载所有子应用

  // 或自定义预加载时机
  prefetch(apps) {
    // 只预加载高频使用的子应用
    return apps.filter((app) => ["app1", "app2"].includes(app.name));
  },

  // 手动控制预加载时机
  getPublicPath: (entry) => {
    // 根据 entry 返回公共路径
    return entry;
  },
});
```

**解决方案 2：使用虚拟滚动或懒加载**

```javascript
// 主应用 - 菜单配置
const menuConfig = [
  {
    name: "App 1",
    path: "/app1",
    // 延迟加载配置
    lazy: true,
    preload: false,
  },
];

// 用户点击菜单时才加载子应用
function loadAppOnDemand(appName) {
  import(/* webpackChunkName: "[request]" */ `./apps/${appName}`);
}
```

### 问题 8.2：子应用体积过大

**解决方案 1：代码分割**

```javascript
// 子应用 - webpack 配置
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          name: "chunk-vendors",
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
        },
        common: {
          name: "chunk-common",
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

**解决方案 2：移除未使用的代码**

```javascript
// 使用 Tree Shaking
// webpack 配置
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
  },
};

// package.json
{
  "sideEffects": false
}
```

**解决方案 3：使用轻量级替代库**

```javascript
// 替换体积大的库
// moment.js (200KB) → dayjs (7KB)
import dayjs from "dayjs";

// lodash (整体引入) → lodash-es (按需引入)
import { debounce } from "lodash-es";
```

### 问题 8.3：子应用频繁切换导致性能下降

**解决方案：使用 KeepAlive 缓存子应用实例**

```javascript
// 主应用 - 自定义缓存逻辑
const appCache = new Map();

function mountApp(appConfig) {
  const { name } = appConfig;

  // 检查缓存
  if (appCache.has(name)) {
    const cachedApp = appCache.get(name);
    // 恢复显示
    cachedApp.container.style.display = "block";
    return cachedApp;
  }

  // 首次加载
  const app = loadMicroApp(appConfig);
  appCache.set(name, app);
  return app;
}

function unmountApp(name, destroy = false) {
  const app = appCache.get(name);

  if (destroy) {
    // 完全卸载
    app.unmount();
    appCache.delete(name);
  } else {
    // 仅隐藏
    app.container.style.display = "none";
  }
}
```

---

## 九、部署与构建问题

### 问题 9.1：生产环境跨域问题

**现象：**

```
开发环境正常，生产环境子应用加载失败，跨域错误
```

**解决方案：配置 CORS**

```nginx
# nginx 配置子应用
server {
  listen 80;
  server_name app1.example.com;

  location / {
    root /usr/share/nginx/html/app1;

    # 添加 CORS 头
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';

    if ($request_method = 'OPTIONS') {
      return 204;
    }

    try_files $uri $uri/ /index.html;
  }
}
```

### 问题 9.2：子应用独立部署后无法访问

**现象：**

```
子应用单独访问 http://app1.example.com 正常
但在主应用中加载失败
```

**原因：**

- entry 配置错误
- 资源路径问题

**解决方案：**

```javascript
// 主应用 - 正确配置 entry
registerMicroApps([
  {
    name: "app1",
    // 开发环境
    entry:
      process.env.NODE_ENV === "development"
        ? "//localhost:8081"
        : "https://app1.example.com", // 生产环境
    container: "#subapp-container",
    activeRule: "/app1",
  },
]);
```

```javascript
// 子应用 - 正确配置 publicPath
// vue.config.js
module.exports = {
  publicPath:
    process.env.NODE_ENV === "production"
      ? "https://app1.example.com/"
      : "//localhost:8081/",
};
```

### 问题 9.3：子应用打包后体积过大

**解决方案：使用 CDN + externals**

```javascript
// 子应用 - vue.config.js
module.exports = {
  configureWebpack: {
    externals: {
      vue: "Vue",
      "vue-router": "VueRouter",
      vuex: "Vuex",
      axios: "axios",
      "element-ui": "ELEMENT",
    },
  },
};
```

```html
<!-- 子应用 - index.html -->
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router@3.5.3/dist/vue-router.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vuex@3.6.2/dist/vuex.min.js"></script>
```

---

## 十、开发调试问题

### 问题 10.1：开发环境子应用热更新失效

**现象：**

```
修改子应用代码后，页面不自动刷新
```

**解决方案：配置 webpack devServer**

```javascript
// 子应用 - vue.config.js
module.exports = {
  devServer: {
    port: 8081,
    hot: true, // 开启热更新
    headers: {
      "Access-Control-Allow-Origin": "*", // 允许跨域
    },
    // 禁用 host 检查（如果主应用和子应用域名不同）
    disableHostCheck: true,
  },
};
```

### 问题 10.2：无法在浏览器 DevTools 中调试子应用

**解决方案：启用 sourceMap**

```javascript
// 子应用 - vue.config.js
module.exports = {
  productionSourceMap: false, // 生产环境关闭
  configureWebpack: {
    devtool:
      process.env.NODE_ENV === "development"
        ? "eval-source-map" // 开发环境开启
        : false,
  },
};
```

### 问题 10.3：子应用错误难以定位

**解决方案：添加全局错误处理**

```javascript
// 主应用
import { addGlobalUncaughtErrorHandler } from "qiankun";

addGlobalUncaughtErrorHandler((event) => {
  console.error("微应用错误:", event);

  const { message, filename, lineno, colno, error } = event;

  // 上报错误到监控系统
  reportError({
    type: "qiankun-error",
    message,
    filename,
    lineno,
    colno,
    stack: error?.stack,
  });
});
```

```javascript
// 子应用 - 错误边界
// React
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.log("子应用错误:", error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

// Vue
Vue.config.errorHandler = (err, vm, info) => {
  console.log("子应用错误:", err, info);
};
```

---

## 十一、综合最佳实践

### 11.1 主应用最佳实践

```javascript
// main.js
import {
  registerMicroApps,
  start,
  addGlobalUncaughtErrorHandler,
  initGlobalState,
} from "qiankun";

// 1. 初始化全局状态
const actions = initGlobalState({
  user: null,
  token: null,
});

// 2. 注册微应用
registerMicroApps(
  [
    {
      name: "app1",
      entry: process.env.VUE_APP_SUB_APP1,
      container: "#subapp-container",
      activeRule: "/app1",
      props: {
        actions, // 传递全局状态管理
        routerBase: "/app1",
      },
    },
  ],
  {
    // 生命周期钩子
    beforeLoad: [
      (app) => {
        console.log("[LifeCycle] before load", app.name);
      },
    ],
    beforeMount: [
      (app) => {
        console.log("[LifeCycle] before mount", app.name);
      },
    ],
    afterMount: [
      (app) => {
        console.log("[LifeCycle] after mount", app.name);
      },
    ],
    afterUnmount: [
      (app) => {
        console.log("[LifeCycle] after unmount", app.name);
      },
    ],
  }
);

// 3. 启动 qiankun
start({
  prefetch: "all", // 预加载所有子应用
  sandbox: {
    strictStyleIsolation: false,
    experimentalStyleIsolation: true, // 实验性样式隔离
  },
  singular: false, // 允许多个微应用同时存在
});

// 4. 全局错误处理
addGlobalUncaughtErrorHandler((event) => {
  console.error("微应用加载错误:", event);
});
```

### 11.2 子应用最佳实践

```javascript
// public-path.js
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

// main.js
import "./public-path";
import Vue from "vue";
import VueRouter from "vue-router";
import App from "./App.vue";
import routes from "./router";
import store from "./store";

Vue.config.productionTip = false;

let instance = null;
let router = null;

function render(props = {}) {
  const { container, routerBase } = props;

  router = new VueRouter({
    base: window.__POWERED_BY_QIANKUN__ ? routerBase : "/",
    mode: "history",
    routes,
  });

  instance = new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount(container ? container.querySelector("#app") : "#app");
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap() {
  console.log("[Vue App] bootstraped");
}

export async function mount(props) {
  console.log("[Vue App] mount", props);

  // 接收主应用的全局状态管理
  if (props.actions) {
    props.actions.onGlobalStateChange((state) => {
      console.log("[Vue App] 全局状态变化:", state);
      // 同步到子应用的 store
      store.commit("updateGlobalState", state);
    }, true);
  }

  render(props);
}

export async function unmount() {
  console.log("[Vue App] unmount");

  // 销毁实例
  instance.$destroy();
  instance.$el.innerHTML = "";
  instance = null;
  router = null;
}

// 可选的生命周期
export async function update(props) {
  console.log("[Vue App] update", props);
}
```

```javascript
// vue.config.js
const { name } = require("./package.json");

module.exports = {
  publicPath:
    process.env.NODE_ENV === "production"
      ? "https://cdn.example.com/app1/"
      : "//localhost:8081/",

  devServer: {
    port: 8081,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    disableHostCheck: true,
  },

  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: "umd",
      jsonpFunction: `webpackJsonp_${name}`,
    },
  },

  // CSS 预处理器配置
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
};
```

---

## 十二、常见错误码及解决方案速查表

| 错误信息                                         | 原因                         | 解决方案                                             |
| ------------------------------------------------ | ---------------------------- | ---------------------------------------------------- |
| `application died in status LOADING_SOURCE_CODE` | 子应用未正确导出生命周期函数 | 检查 main.js 导出的 bootstrap/mount/unmount          |
| `未找到 entry 的 HTML 内容`                      | entry 地址错误或跨域         | 检查 entry 配置，配置 CORS                           |
| `静态资源 404`                                   | publicPath 配置错误          | 配置 public-path.js 和 webpack publicPath            |
| `样式污染`                                       | 样式隔离未开启               | 启用 experimentalStyleIsolation 或使用 CSS Modules   |
| `路由刷新 404`                                   | 服务器未配置 History 模式    | 配置 nginx try_files 或 devServer historyApiFallback |
| `子应用白屏`                                     | 生命周期函数执行出错         | 检查 console 错误，添加 try-catch                    |
| `内存泄漏`                                       | unmount 时未清理资源         | 在 unmount 中清理事件监听、定时器、实例              |

---

## 总结

qiankun 微前端开发中的常见问题主要集中在以下几个方面：

### 核心问题分类

1. **样式隔离**：使用 CSS Modules、experimentalStyleIsolation 或命名空间
2. **资源加载**：正确配置 publicPath 和 webpack 输出
3. **路由管理**：配置 basename 和服务器 History 支持
4. **应用通信**：使用 qiankun 的全局状态管理或自定义事件总线
5. **生命周期**：正确实现和管理生命周期函数
6. **性能优化**：预加载、代码分割、缓存策略
7. **部署上线**：CORS 配置、CDN、环境变量管理

### 最佳实践建议

- ✅ 始终配置 public-path.js
- ✅ 使用 CSS Modules 或命名空间避免样式冲突
- ✅ 在 unmount 中清理所有副作用
- ✅ 开启预加载提升用户体验
- ✅ 使用全局状态管理统一数据流
- ✅ 完善错误监控和日志上报
- ✅ 保持主应用和子应用的独立性

通过掌握这些问题和解决方案，可以有效避免 qiankun 微前端开发中的常见坑，构建稳定可靠的微前端应用。
