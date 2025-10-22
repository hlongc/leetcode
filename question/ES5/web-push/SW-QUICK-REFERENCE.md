# Service Worker 快速参考

## 🎯 一句话总结

**Service Worker 应该在 `<head>` 中尽早注册，但首次访问时仍无法拦截页面本身，只有后续访问才能完全拦截所有请求。**

---

## 📋 快速检查清单

### ✅ 必须做的

- [ ] 在 `<head>` 中使用**内联脚本**注册 SW
- [ ] SW 文件中使用 `skipWaiting()` (install 事件)
- [ ] SW 文件中使用 `clients.claim()` (activate 事件)
- [ ] 拦截请求时检查请求方法 (只拦截 GET)
- [ ] 使用 `event.respondWith()` 返回响应
- [ ] 使用 `event.waitUntil()` 延长事件生命周期

### ❌ 不要做的

- [ ] ~~在用户交互后才注册 SW~~
- [ ] ~~在 `<body>` 底部注册 SW~~
- [ ] ~~在外部 JS 文件中注册（如果文件在底部加载）~~
- [ ] ~~期望首次访问能拦截所有请求~~
- [ ] ~~忘记使用 `clients.claim()`~~

---

## ⚡ 最小化代码模板

### HTML (页面)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>My App</title>

    <!-- ✅ 立即注册 SW -->
    <script>
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registered:", reg))
          .catch((err) => console.error("SW failed:", err));
      }
    </script>
  </head>
  <body>
    <!-- 页面内容 -->
  </body>
</html>
```

### Service Worker (sw.js)

```javascript
const CACHE_NAME = "my-cache-v1";
const urlsToCache = ["/", "/style.css", "/app.js"];

// 安装
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // ✅ 立即激活
  );
});

// 激活
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // ✅ 立即接管
  );
});

// 拦截请求
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

---

## 🔍 常见问题速查

### Q: 为什么首次访问无法拦截？

**A:** SW 注册是异步的，需要下载 → 安装 → 激活，这个过程需要时间。当 SW 激活时，页面已经加载完成。

### Q: 如何确保后续访问能拦截？

**A:** 使用 `skipWaiting()` + `clients.claim()`，并确保在 head 中注册。

### Q: 如何调试 SW？

**A:** Chrome DevTools → Application → Service Workers

### Q: 如何测试首次访问？

**A:**

1. DevTools → Application → Service Workers → Unregister
2. 清除缓存
3. 刷新页面

### Q: 如何强制更新 SW？

**A:**

```javascript
navigator.serviceWorker.getRegistration().then((reg) => reg.update());
```

---

## ⏱️ 生命周期速记

```
首次访问: 注册 → 安装 → 激活 (⚠️ 无法拦截页面)
后续访问: 已激活 → ✅ 拦截所有请求
```

---

## 📊 注册时机评分

| 位置          | 评分       | 说明     |
| ------------- | ---------- | -------- |
| `<head>` 内联 | ⭐⭐⭐⭐⭐ | **最佳** |
| `<head>` 外部 | ⭐⭐⭐⭐   | 可行     |
| `<body>` 底部 | ⭐⭐       | 不推荐   |
| 用户交互后    | ⭐         | **避免** |

---

## 🚨 关键 API

```javascript
// 注册
navigator.serviceWorker.register("/sw.js");

// 等待就绪
navigator.serviceWorker.ready;

// 获取已注册的 SW
navigator.serviceWorker.getRegistration();

// 检查是否被控制
navigator.serviceWorker.controller;

// 立即激活 (SW 文件中)
self.skipWaiting();

// 立即接管 (SW 文件中)
self.clients.claim();

// 延长生命周期 (SW 文件中)
event.waitUntil(promise);

// 自定义响应 (SW 文件中)
event.respondWith(promise);
```

---

## 📁 相关文件

- `sw-register-timing-demo.html` - 完整演示页面
- `SW-REGISTER-TIMING.md` - 详细文档
- `sw-fixed.js` - Service Worker 实现

---

## 🎯 记住这三点

1. **尽早注册** - HEAD 中立即执行
2. **首次限制** - 无法拦截页面本身
3. **后续完美** - 可以拦截所有请求

---

最后更新: 2025-10-22
