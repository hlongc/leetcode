# Service Worker 版本管理 - 核心总结

> 用户友好的 Service Worker 版本更新策略完整指南

## 🎯 核心问题

当你发布新的 Service Worker 脚本时，面临以下挑战：

| 问题                   | 影响                 | 解决方案             |
| ---------------------- | -------------------- | -------------------- |
| **浏览器缓存 SW 文件** | 用户获取不到最新版本 | 设置 no-cache 响应头 |
| **旧版本继续运行**     | 新功能无法生效       | 实现更新检测机制     |
| **用户不关闭标签页**   | 新版本永远不激活     | 主动提示用户更新     |
| **缓存策略错误**       | 可能永远无法更新     | 使用版本化的缓存名   |

---

## ✅ 4 种更新策略

### 📊 对比表

| 策略             | 适用场景           | 更新方式 | 用户体验   | 实现难度   | 推荐指数   |
| ---------------- | ------------------ | -------- | ---------- | ---------- | ---------- |
| **基础版本管理** | 内容网站、博客     | 手动提示 | ⭐⭐⭐⭐⭐ | ⭐         | ⭐⭐⭐     |
| **自动更新**     | 实时应用、聊天     | 自动刷新 | ⭐⭐       | ⭐⭐       | ⭐⭐⭐     |
| **智能更新**     | Web 应用、管理系统 | 智能判断 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| **渐进式更新**   | 大型应用、电商     | 灰度发布 | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |

---

## 🚀 策略详解

### 1️⃣ 基础版本管理

**核心思路：** 检测到新版本时，友好提示用户，由用户决定是否更新。

```javascript
// Service Worker (不使用 skipWaiting)
self.addEventListener("install", (event) => {
  // 安装新版本，但不立即激活
});

// 客户端
registration.addEventListener("updatefound", () => {
  const newWorker = registration.installing;
  newWorker.addEventListener("statechange", () => {
    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
      // 显示提示："新版本可用，点击更新"
      showUpdateNotification();
    }
  });
});
```

**优点：** ✅ 用户体验好 ✅ 不打断操作 ✅ 实现简单  
**缺点：** ❌ 更新依赖用户操作 ❌ 可能长时间停留在旧版本

---

### 2️⃣ 自动更新（激进策略）

**核心思路：** 检测到新版本立即激活并刷新页面。

```javascript
// Service Worker
self.addEventListener("install", () => {
  self.skipWaiting(); // 🔥 立即激活
});

self.addEventListener("activate", () => {
  self.clients.claim(); // 🔥 立即控制所有页面
  // 通知客户端刷新
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: "RELOAD" }));
  });
});

// 客户端
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "RELOAD") {
    window.location.reload(); // 🔥 自动刷新
  }
});
```

**优点：** ✅ 更新快速 ✅ 用户无感知 ✅ 版本统一  
**缺点：** ❌ 可能打断用户操作 ❌ 可能丢失未保存数据

---

### 3️⃣ 智能更新（推荐）⭐⭐⭐⭐⭐

**核心思路：** 检测用户状态，在空闲时提示更新，保存数据后刷新。

```javascript
// 检查用户是否繁忙
function isUserBusy() {
  // 检查表单是否有未保存数据
  const dirtyForms = document.querySelectorAll("form.dirty");
  if (dirtyForms.length > 0) return true;

  // 检查是否有上传任务
  const uploads = document.querySelectorAll(".uploading");
  if (uploads.length > 0) return true;

  return false;
}

// 智能处理更新
function handleUpdate() {
  if (isUserBusy()) {
    // 用户正忙，延迟提示
    setTimeout(handleUpdate, 60000); // 1分钟后重试
    return;
  }

  // 用户空闲，显示更新对话框
  showUpdateDialog();
}

// 更新前保存数据
async function beforeUpdate() {
  // 自动保存表单数据
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    const data = new FormData(form);
    localStorage.setItem(
      `backup_${form.id}`,
      JSON.stringify(Object.fromEntries(data))
    );
  });
}
```

**优点：** ✅ 体验最佳 ✅ 保护用户数据 ✅ 智能判断  
**缺点：** ❌ 实现稍复杂

**适用场景：**

- 后台管理系统
- 表单密集型应用
- 需要保护用户数据的应用

---

### 4️⃣ 渐进式更新（灰度发布）

**核心思路：** 先对部分用户推送更新，监控指标，逐步扩大范围。

```javascript
const UPDATE_STRATEGY = {
  rolloutPercentage: 20, // 只对20%用户推送
  forceUpdateVersion: "1.0.0", // 强制更新阈值
};

// 判断用户是否在灰度范围内
function shouldShowUpdate(userId) {
  const hash = hashCode(userId);
  return hash % 100 < UPDATE_STRATEGY.rolloutPercentage;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// 使用
if (shouldShowUpdate(currentUserId)) {
  showUpdateNotification();
  reportMetric("update_shown", { userId, version });
}
```

**优点：** ✅ 风险可控 ✅ 可以回滚 ✅ 数据驱动  
**缺点：** ❌ 实现复杂 ❌ 需要监控系统

**适用场景：**

- 大型电商平台
- 社交应用
- 金融应用

---

## 🛠️ 关键实现要点

### 1. 版本号管理

```javascript
// Service Worker
const VERSION = "1.0.0";
const CACHE_NAME = `app-cache-v${VERSION}`;

// HTML 页面
const EXPECTED_VERSION = "1.0.0";

// ⚠️ 两者必须保持一致！
```

### 2. 清理旧缓存

```javascript
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

### 3. SW 文件不能被缓存

```nginx
# Nginx
location ~* sw.*\.js$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

```javascript
// Express
app.get("/sw-*.js", (req, res) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  res.sendFile(req.path);
});
```

### 4. 定期检查更新

```javascript
// 每5分钟检查一次
setInterval(() => {
  registration.update();
}, 5 * 60 * 1000);

// 页面重新可见时检查
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    registration.update();
  }
});
```

---

## 🎨 UI/UX 最佳实践

### 更新通知示例

```javascript
function showUpdateNotification() {
  const notification = `
    <div style="position: fixed; top: 20px; right: 20px; 
                background: white; padding: 20px; border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <h3>🎉 新版本可用</h3>
      <p>我们改进了性能和功能。更新只需几秒钟。</p>
      <button onclick="updateNow()">立即更新</button>
      <button onclick="updateLater()">稍后</button>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", notification);
}
```

### 加载状态提示

```javascript
function updateNow() {
  // 显示加载状态
  showToast("正在更新...", { duration: Infinity });

  // 保存数据
  saveUserData();

  // 触发更新
  newWorker.postMessage({ type: "SKIP_WAITING" });
}
```

---

## 📊 监控指标

### 关键指标

| 指标           | 说明                       | 目标值    |
| -------------- | -------------------------- | --------- |
| **版本覆盖率** | 使用最新版本的用户占比     | > 95%     |
| **更新成功率** | 成功完成更新的比例         | > 99%     |
| **更新延迟**   | 从发布到用户更新的平均时间 | < 24 小时 |
| **用户接受率** | 看到提示后选择更新的比例   | > 80%     |

### 上报示例

```javascript
// 版本信息上报
async function reportVersion() {
  await fetch("/api/metrics", {
    method: "POST",
    body: JSON.stringify({
      metric: "sw_version",
      version: VERSION,
      userId: getUserId(),
      timestamp: Date.now(),
    }),
  });
}

// 更新流程上报
// 1. 检测到更新
reportMetric("update_detected", { oldVersion, newVersion });

// 2. 显示提示
reportMetric("update_shown", { version });

// 3. 用户接受
reportMetric("update_accepted", { version });

// 4. 更新完成
reportMetric("update_completed", { version });
```

---

## 🔍 调试技巧

### Chrome DevTools

1. **Application > Service Workers**

   - 查看状态
   - 手动 Update
   - Unregister

2. **Application > Cache Storage**

   - 查看缓存内容
   - 删除缓存

3. **Network 标签**
   - 勾选 "Disable cache"
   - 查看 SW 文件请求

### 控制台命令

```javascript
// 查看所有 SW
navigator.serviceWorker.getRegistrations().then(console.log);

// 查看当前 SW 状态
navigator.serviceWorker.ready.then((reg) => {
  console.log("Active:", reg.active);
  console.log("Waiting:", reg.waiting);
  console.log("Installing:", reg.installing);
});

// 强制更新
navigator.serviceWorker.ready.then((reg) => reg.update());

// 注销所有 SW
navigator.serviceWorker.getRegistrations().then((regs) => {
  regs.forEach((reg) => reg.unregister());
});
```

---

## ⚡ 快速决策

### 我应该选择哪个策略？

```
是否是大型应用（100万+ 用户）？
├─ 是 → 渐进式更新（方案四）
└─ 否 → 是否需要实时同步（聊天、协作）？
         ├─ 是 → 自动更新（方案二）
         └─ 否 → 是否有表单/数据录入？
                  ├─ 是 → 智能更新（方案三）⭐推荐
                  └─ 否 → 基础版本管理（方案一）
```

### 我的实现步骤

```bash
1. 添加版本号管理
   ✅ Service Worker: const VERSION = "1.0.0"
   ✅ HTML: const EXPECTED_VERSION = "1.0.0"

2. 实现更新检测
   ✅ 监听 updatefound 事件
   ✅ 定期调用 registration.update()

3. 处理缓存清理
   ✅ 使用版本化缓存名
   ✅ activate 时清理旧缓存

4. 添加用户提示
   ✅ 设计更新通知 UI
   ✅ 提供"立即更新"和"稍后"选项

5. 配置服务器
   ✅ SW 文件设置 no-cache
   ✅ 静态资源设置合适的缓存策略

6. 测试验证
   ✅ 本地测试更新流程
   ✅ 验证缓存清理
   ✅ 测试用户交互
```

---

## 📚 文档索引

### 完整文档

- **[SERVICE-WORKER-VERSION-GUIDE.md](./question/ES5/web-push/SERVICE-WORKER-VERSION-GUIDE.md)**  
  完整的理论指南，包含 4 种策略的详细代码实现

- **[QUICK-START-VERSION.md](./question/ES5/web-push/QUICK-START-VERSION.md)**  
  5 分钟快速开始指南，包含实操步骤

- **[README.md](./question/ES5/web-push/README.md)**  
  推送通知完整文档（已添加版本管理章节）

### 演示代码

- **[sw-version-demo.js](./question/ES5/web-push/sw-version-demo.js)**  
  完整的 Service Worker 实现，包含版本管理、缓存策略、推送处理

- **[sw-version-demo.html](./question/ES5/web-push/sw-version-demo.html)**  
  可运行的演示页面，包含完整的 UI 和交互逻辑

### 快速访问

```bash
# 启动演示服务器
cd question/ES5/web-push
node server-mozilla-ipv4.js

# 访问演示页面
http://localhost:3000/sw-version-demo.html
```

---

## 🎯 核心原则

1. **永远不要阻止浏览器更新检查**  
   定期调用 `registration.update()`

2. **给用户选择权，但引导更新**  
   显示友好提示，说明更新的好处

3. **保护用户数据和操作**  
   更新前保存数据，避免打断关键操作

4. **监控更新成功率**  
   上报版本信息和更新流程指标

5. **准备回滚机制**  
   保留旧版本文件，问题时快速回滚

---

## 🎉 总结

### Service Worker 版本管理的本质

**问题：** 浏览器缓存 + 长连接 = 用户无法获取更新

**解决：** 主动检测 + 友好提示 + 智能判断 = 用户体验最佳的更新策略

### 推荐方案

对于大多数 Web 应用，推荐使用 **智能更新策略（方案三）**：

✅ 在用户空闲时提示  
✅ 保存数据后再更新  
✅ 给用户选择权  
✅ 体验最佳

### 立即开始

1. 查看演示：`http://localhost:3000/sw-version-demo.html`
2. 阅读快速指南：`QUICK-START-VERSION.md`
3. 在项目中实施
4. 监控和优化

---

**祝你的 Service Worker 版本管理之旅顺利！** 🚀

有问题？查看完整文档或提 Issue。
