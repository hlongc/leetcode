# 生产环境中更新 SharedWorker 的策略

## 🎯 问题描述

在生产环境中，当你部署了新版本的 `shared-worker.js`：

- ❌ 旧的 SharedWorker 不会自动更新
- ❌ 只要有一个标签页在使用，旧版本就会一直运行
- ❌ 用户不会知道有新版本
- ❌ 多个版本可能同时存在

## 💡 解决方案对比

| 方案                 | 优点               | 缺点         | 推荐度     |
| -------------------- | ------------------ | ------------ | ---------- |
| 方案 1：版本号管理   | 简单可靠，强制更新 | 失去共享特性 | ⭐⭐⭐⭐   |
| 方案 2：主动检测更新 | 用户体验好         | 实现复杂     | ⭐⭐⭐⭐⭐ |
| 方案 3：定时重连     | 自动化             | 需要后端配合 | ⭐⭐⭐⭐   |
| 方案 4：用户刷新提示 | 最简单             | 依赖用户操作 | ⭐⭐⭐     |

---

## 🚀 方案 1：版本号管理（最简单可靠）

### 核心思路

在构建时给 SharedWorker URL 添加版本号或哈希值。

### 实现方式

#### 1.1 使用文件哈希（推荐）

**构建配置（Webpack/Vite）：**

```javascript
// webpack.config.js
module.exports = {
  output: {
    filename: "[name].[contenthash].js",
  },
};

// 输出：shared-worker.a1b2c3d4.js
```

**HTML 中引用：**

```javascript
// 由构建工具自动注入正确的文件名
const worker = new SharedWorker("/static/js/shared-worker.a1b2c3d4.js");
```

#### 1.2 使用版本号（手动管理）

**在入口文件中定义版本：**

```javascript
// config.js
export const WORKER_VERSION = "1.0.2";

// shared-worker-demo.html
import { WORKER_VERSION } from "./config.js";
const worker = new SharedWorker(`shared-worker.js?v=${WORKER_VERSION}`);
```

#### 1.3 使用构建时间戳

```javascript
// 在构建脚本中替换
const BUILD_TIME = Date.now();
const worker = new SharedWorker(`shared-worker.js?v=${BUILD_TIME}`);
```

### 优点

✅ 部署新版本后，用户刷新页面自动使用新版本
✅ 不同版本完全隔离，不会冲突
✅ 简单可靠，容易实现

### 缺点

❌ 同一用户的不同标签页可能使用不同版本（刷新前后）
❌ 失去了 SharedWorker 的"共享"特性（在版本切换期间）

---

## 🎯 方案 2：主动检测更新 + 提示用户（推荐）

### 完整实现

#### 2.1 在 SharedWorker 中添加版本信息

```javascript
// shared-worker.js
const WORKER_VERSION = "1.0.2"; // 更新时修改这个

console.log("SharedWorker 版本:", WORKER_VERSION);

self.onconnect = (e) => {
  const port = e.ports[0];

  // 发送版本信息给客户端
  port.postMessage({
    type: "version",
    version: WORKER_VERSION,
  });

  // ... 其他代码
};
```

#### 2.2 在主页面检测版本

```javascript
// shared-worker-demo.html
const EXPECTED_VERSION = "1.0.2"; // 与 shared-worker.js 保持同步
let currentWorkerVersion = null;

const worker = new SharedWorker("shared-worker.js");
const port = worker.port;

port.onmessage = (event) => {
  if (event.data.type === "version") {
    currentWorkerVersion = event.data.version;

    // 检查版本是否匹配
    if (currentWorkerVersion !== EXPECTED_VERSION) {
      showUpdateNotification();
    }
  }
};

function showUpdateNotification() {
  // 显示更新提示
  const notification = document.createElement("div");
  notification.className = "update-notification";
  notification.innerHTML = `
    <div class="notification-content">
      ⚠️ 检测到新版本！
      <button onclick="location.reload()">立即更新</button>
      <button onclick="this.parentElement.parentElement.remove()">稍后</button>
    </div>
  `;
  document.body.appendChild(notification);
}
```

#### 2.3 定期检查后端版本

```javascript
// 每5分钟检查一次是否有新版本
setInterval(async () => {
  try {
    const response = await fetch("/api/worker-version");
    const { version } = await response.json();

    if (version !== EXPECTED_VERSION) {
      showUpdateNotification();
    }
  } catch (error) {
    console.error("检查版本失败:", error);
  }
}, 5 * 60 * 1000);
```

#### 2.4 后端接口

```javascript
// server.js (Express)
app.get("/api/worker-version", (req, res) => {
  // 从配置文件或构建信息中读取
  res.json({ version: "1.0.2" });
});
```

### 优点

✅ 用户体验好，主动通知
✅ 保持 SharedWorker 共享特性
✅ 灵活可控

### 缺点

❌ 实现相对复杂
❌ 需要后端配合
❌ 依赖用户主动刷新

---

## ⏰ 方案 3：定时重连机制

### 实现方式

#### 3.1 在 SharedWorker 中添加自动终止

```javascript
// shared-worker.js
const WORKER_VERSION = "1.0.2";
const MAX_LIFETIME = 30 * 60 * 1000; // 30分钟后自动终止

// 设置最大生命周期
setTimeout(() => {
  console.log("SharedWorker 达到最大生命周期，准备终止...");

  // 通知所有客户端即将重启
  ports.forEach(({ port }) => {
    port.postMessage({
      type: "worker-restarting",
      message: "即将重启以加载新版本",
    });
  });

  // 1秒后终止
  setTimeout(() => {
    self.close();
  }, 1000);
}, MAX_LIFETIME);
```

#### 3.2 客户端自动重连

```javascript
// shared-worker-demo.html
let worker;
let port;
let shouldReconnect = true;

function connectToWorker() {
  worker = new SharedWorker("shared-worker.js");
  port = worker.port;
  port.start();

  port.onmessage = (event) => {
    if (event.data.type === "worker-restarting") {
      // Worker 即将重启，准备重连
      console.log("检测到 Worker 重启，准备重新连接...");

      setTimeout(() => {
        if (shouldReconnect) {
          connectToWorker(); // 重新连接
        }
      }, 2000);
    }

    // 处理其他消息...
  };
}

// 初始连接
connectToWorker();

// 页面关闭时停止重连
window.addEventListener("beforeunload", () => {
  shouldReconnect = false;
});
```

### 优点

✅ 自动化，无需手动干预
✅ 定期刷新，确保使用最新版本

### 缺点

❌ 会导致短暂的连接中断
❌ 可能影响用户体验

---

## 🔔 方案 4：结合 Service Worker（高级）

### 实现思路

```javascript
// service-worker.js
const CACHE_VERSION = "v1.0.2";

self.addEventListener("install", (event) => {
  // 强制更新
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );

  // 通知所有客户端更新
  return self.clients.claim().then(() => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "new-version-available",
          version: CACHE_VERSION,
        });
      });
    });
  });
});

// 拦截 SharedWorker 请求
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("shared-worker.js")) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) => {
        return fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    );
  }
});
```

---

## 📝 最佳实践方案（综合推荐）

结合多个方案的优点，这是我推荐的生产环境策略：

### 实现步骤

#### 1. 使用版本号 + 检测机制

```javascript
// config.js - 集中管理版本
export const APP_VERSION = "1.0.2";
export const WORKER_VERSION = "1.0.2";
```

#### 2. 构建时处理

```javascript
// build.js
const fs = require("fs");
const version = require("./package.json").version;

// 替换版本号
const content = fs.readFileSync("shared-worker.js", "utf8");
const updated = content.replace("__VERSION__", version);
fs.writeFileSync("dist/shared-worker.js", updated);
```

#### 3. 运行时检测

```javascript
// app.js
const EXPECTED_VERSION = "__VERSION__"; // 构建时替换

async function checkWorkerVersion() {
  const response = await fetch("/shared-worker.js");
  const text = await response.text();
  const match = text.match(/WORKER_VERSION = ['"](.+?)['"]/);

  if (match && match[1] !== EXPECTED_VERSION) {
    return match[1]; // 返回新版本号
  }
  return null;
}

// 每10分钟检查一次
setInterval(async () => {
  const newVersion = await checkWorkerVersion();
  if (newVersion) {
    showUpdateDialog(newVersion);
  }
}, 10 * 60 * 1000);
```

---

## 🎨 完整代码示例

让我创建一个包含版本管理的完整示例...
