# Service Worker 注册时机详解

## 🎯 核心问题

**问：使用 fetch 拦截请求，是否需要在页面加载的 head 标签中注册 Service Worker？**

**答：是的，应该尽早注册，但即使在 head 中注册，首次访问时仍无法拦截页面本身的请求。**

---

## 📋 为什么首次访问无法拦截？

### Service Worker 的生命周期

```
首次访问流程：
1. 用户访问网站
2. 浏览器下载 HTML
3. 解析 HTML，执行注册代码
4. Service Worker 开始注册（异步）
5. 页面继续加载 CSS/JS/图片 ← 此时 SW 还未激活
6. SW 安装 (install 事件)
7. SW 激活 (activate 事件)
8. SW 开始控制页面 ← 但大部分资源已加载完成

后续访问流程：
1. 用户访问网站
2. SW 已激活，立即拦截请求 ✅
3. SW 可以拦截所有请求（包括 HTML）
```

### 时间线示例

```
首次访问：
0ms    - 开始加载 HTML
10ms   - 注册 Service Worker (异步)
20ms   - 加载 CSS
50ms   - 加载 JavaScript
100ms  - 加载图片
200ms  - Service Worker 安装完成
250ms  - Service Worker 激活并控制页面 ← 资源已加载完成
300ms+ - 后续请求可以被拦截 ✅

第二次访问：
0ms    - Service Worker 已激活
1ms    - 拦截 HTML 请求 ✅
10ms   - 拦截 CSS 请求 ✅
20ms   - 拦截 JS 请求 ✅
50ms   - 拦截图片请求 ✅
```

---

## ✅ 最佳实践

### 1. 在 `<head>` 中尽早注册

**推荐方式：内联脚本**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>My App</title>

    <!-- ✅ 立即注册 Service Worker -->
    <script>
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js", {
            scope: "/", // 控制整个网站
          })
          .then((registration) => {
            console.log("SW registered:", registration);
          })
          .catch((error) => {
            console.error("SW registration failed:", error);
          });
      }
    </script>

    <!-- 其他资源 -->
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <!-- 页面内容 -->
  </body>
</html>
```

**为什么使用内联脚本？**

- ✅ 无需额外的 HTTP 请求
- ✅ 立即执行，不会被阻塞
- ✅ 最快的注册方式

### 2. SW 文件中使用 `skipWaiting()` 和 `clients.claim()`

```javascript
// sw.js

// 安装时立即激活
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open("my-cache-v1")
      .then((cache) => cache.addAll(["/index.html", "/style.css"]))
      .then(() => {
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
  );
});

// 激活时立即接管页面
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    // 清理旧缓存
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) => name.startsWith("my-cache-") && name !== "my-cache-v1"
            )
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        // 立即接管所有页面
        return self.clients.claim();
      })
  );
});

// 拦截请求
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### 3. 监听 SW 控制变化

```javascript
// 页面 JavaScript

// 监听控制权变化
navigator.serviceWorker.addEventListener("controllerchange", () => {
  console.log("Service Worker 开始控制页面");
  // 可以在这里提示用户或刷新资源
});

// 监听 SW 消息
navigator.serviceWorker.addEventListener("message", (event) => {
  console.log("收到 SW 消息:", event.data);
});

// 等待 SW 准备就绪
navigator.serviceWorker.ready.then((registration) => {
  console.log("Service Worker 已准备就绪");

  // 监听更新
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;

    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        // 新版本已安装，提示用户刷新
        if (confirm("发现新版本，是否刷新页面？")) {
          window.location.reload();
        }
      }
    });
  });
});
```

---

## ⚠️ 常见错误

### ❌ 错误 1：延迟注册

```javascript
// ❌ 错误：在用户点击按钮时才注册
document.getElementById("subscribe").addEventListener("click", async () => {
  const registration = await navigator.serviceWorker.register("/sw.js");
  // 此时页面资源已全部加载完成，SW 无法拦截
});
```

**问题：**

- 页面资源已加载完成
- 用户可能永远不会点击按钮
- 延迟了离线缓存的建立

**修复：**

```javascript
// ✅ 正确：页面加载时立即注册
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

// 订阅功能单独处理
document.getElementById("subscribe").addEventListener("click", async () => {
  const registration = await navigator.serviceWorker.ready;
  // 使用已注册的 SW 进行订阅
});
```

### ❌ 错误 2：在外部 JS 文件中注册（文件在 body 底部加载）

```html
<body>
  <!-- 页面内容 -->
  <img src="/image1.jpg" />
  <!-- 无法被拦截 -->
  <img src="/image2.jpg" />
  <!-- 无法被拦截 -->

  <!-- ❌ 错误：在最后才加载注册脚本 -->
  <script src="/js/register-sw.js"></script>
</body>
```

**修复：**

```html
<head>
  <!-- ✅ 正确：在 head 中内联注册代码 -->
  <script>
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  </script>
</head>
<body>
  <img src="/image1.jpg" />
  <!-- 首次访问无法拦截，后续可以 -->
  <img src="/image2.jpg" />
</body>
```

### ❌ 错误 3：没有使用 `clients.claim()`

```javascript
// sw.js

// ❌ 错误：没有调用 clients.claim()
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(/* 清理缓存 */)
    // 缺少 clients.claim()
  );
});
```

**问题：**

- 首次访问时，即使 SW 激活了，也不会立即控制页面
- 需要刷新页面后才生效

**修复：**

```javascript
// ✅ 正确：使用 clients.claim()
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then(/* 清理缓存 */)
      .then(() => self.clients.claim()) // 立即接管页面
  );
});
```

---

## 📊 注册位置对比

| 注册位置          | 首次访问                        | 后续访问        | 推荐指数   | 说明           |
| ----------------- | ------------------------------- | --------------- | ---------- | -------------- |
| `<head>` 内联脚本 | ⚠️ 无法拦截页面，但最快开始注册 | ✅ 拦截所有请求 | ⭐⭐⭐⭐⭐ | **最推荐**     |
| `<head>` 外部脚本 | ⚠️ 需要额外 HTTP 请求           | ✅ 拦截所有请求 | ⭐⭐⭐⭐   | 可缓存         |
| `<body>` 底部     | ❌ 大部分资源已加载             | ✅ 拦截所有请求 | ⭐⭐⭐     | 不推荐         |
| 用户交互后        | ❌ 延迟太多                     | ✅ 拦截所有请求 | ⭐         | **强烈不推荐** |

---

## 🔍 调试技巧

### Chrome DevTools

1. **查看 SW 状态**

   - 打开 DevTools → Application → Service Workers
   - 可以看到所有已注册的 SW 及其状态

2. **手动更新 SW**

   - 点击 "Update" 按钮强制检查更新
   - 勾选 "Update on reload" 自动更新

3. **注销 SW**

   - 点击 "Unregister" 注销 SW
   - 刷新页面可以测试首次访问体验

4. **查看拦截的请求**
   - Network 面板中，被 SW 处理的请求会显示 "Service Worker" 标记

### Console 日志

```javascript
// 监听所有 SW 相关事件
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then((registration) => {
    console.log("✅ SW registered:", registration.scope);

    registration.addEventListener("updatefound", () => {
      console.log("🔄 SW update found");
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("🎮 SW controller changed");
  });

  navigator.serviceWorker.ready.then(() => {
    console.log("✅ SW ready");
  });
}

// 在 SW 文件中
self.addEventListener("install", (event) => {
  console.log("📦 SW installing");
});

self.addEventListener("activate", (event) => {
  console.log("✅ SW activated");
});

self.addEventListener("fetch", (event) => {
  console.log("🌐 Fetch:", event.request.url);
});
```

---

## 💡 关键要点总结

1. ✅ **在 `<head>` 中尽早注册 Service Worker**

   - 使用内联脚本，无需额外 HTTP 请求
   - 越早注册，越早建立离线缓存

2. ⚠️ **首次访问的限制**

   - 即使在 head 中注册，首次访问仍无法拦截页面本身
   - 这是 SW 生命周期的固有限制，无法完全避免

3. ✅ **使用 `skipWaiting()` 和 `clients.claim()`**

   - `skipWaiting()`: 立即激活新 SW
   - `clients.claim()`: 立即接管当前页面

4. ✅ **后续访问体验完美**

   - 一旦 SW 激活，后续访问可以拦截所有请求
   - 实现完整的离线体验和性能优化

5. ❌ **不要延迟注册**
   - 不要等用户交互后才注册
   - 不要在页面底部注册
   - 不要在外部 JS 文件末尾注册

---

## 🎯 实际案例

### 您当前代码的问题

**当前实现：**

```javascript
// push-notification-mozilla.html

// ❌ 问题：在用户点击"订阅"按钮时才注册
async function subscribeToPush() {
  const registration = await registerServiceWorker(); // 这里才注册
  // ...
}

document.getElementById("subscribe").addEventListener("click", subscribeToPush);
```

**改进方案：**

```javascript
// 1. 在 <head> 中立即注册 SW
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-fixed.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.error('SW failed', err));
  }
</script>

// 2. 订阅功能使用已注册的 SW
async function subscribeToPush() {
  // 等待已注册的 SW 准备就绪
  const registration = await navigator.serviceWorker.ready;

  // 使用 registration 进行推送订阅
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey
  });
  // ...
}
```

---

## 📚 参考资源

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google: Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [Jake Archibald: The Service Worker Lifecycle](https://jakearchibald.com/2014/service-worker-first-fetch/)

---

## 🧪 测试页面

运行 `sw-register-timing-demo.html` 查看完整的交互式演示：

```bash
# 启动本地服务器
cd /Users/hulongchao/Documents/code/2025/leetcode/question/ES5/web-push
python3 -m http.server 8080

# 访问
# http://localhost:8080/sw-register-timing-demo.html
```

打开浏览器控制台，观察 SW 的注册、安装、激活过程。
