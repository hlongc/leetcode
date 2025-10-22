# Service Worker 版本管理 - 快速开始指南

## 🎯 5 分钟快速体验

### 步骤 1：启动服务器

```bash
cd /Users/hulongchao/Documents/code/2025/leetcode/question/ES5/web-push
node server-mozilla-ipv4.js
```

看到这个输出表示成功：

```
🚀 服务器启动成功
📍 本地地址: http://localhost:3000
```

### 步骤 2：打开演示页面

在浏览器中访问：

```
http://localhost:3000/sw-version-demo.html
```

你会看到一个漂亮的界面，显示：

- 📋 版本信息（期望版本、实际版本、构建时间等）
- 🎮 操作控制（检查更新、强制更新、缓存管理等）
- 📝 实时操作日志

### 步骤 3：测试版本更新

#### 3.1 模拟发布新版本

打开 `sw-version-demo.js`，修改第 6 行的版本号：

```javascript
// 从
const VERSION = "1.0.0";

// 改为
const VERSION = "1.0.1";
```

保存文件。

#### 3.2 检测更新

在演示页面中点击 **"🔄 检查更新"** 按钮。

#### 3.3 查看效果

你会看到：

- ✅ 右上角弹出一个精美的更新通知
- ✅ 显示新旧版本对比
- ✅ 提供"立即更新"和"稍后"两个选项
- ✅ 日志中显示完整的更新流程

#### 3.4 应用更新

点击 **"立即更新"** 按钮，页面会自动刷新，然后：

- ✅ 版本号更新为 1.0.1
- ✅ 缓存已清理
- ✅ 新版本 Service Worker 已激活

---

## 📚 核心概念

### 1. Service Worker 生命周期

```
下载 → 安装(installing) → 等待(waiting) → 激活(activated) → 运行
              ↓                    ↓
           skipWaiting()      clients.claim()
```

**关键点：**

- 新 SW 默认会等待所有标签页关闭才激活
- 用户可能永远不关闭标签页（特别是移动端）
- 需要主动控制更新流程

### 2. 版本号管理

```javascript
// Service Worker 中
const VERSION = "1.0.0";
const CACHE_NAME = `app-cache-v${VERSION}`;

// HTML 页面中
const EXPECTED_VERSION = "1.0.0";
```

**重要：** 两个版本号必须保持一致！

### 3. 更新检测

```javascript
// 定期检查（每5分钟）
setInterval(() => {
  registration.update();
}, 5 * 60 * 1000);

// 监听更新
registration.addEventListener("updatefound", () => {
  // 处理新版本
});
```

### 4. 缓存清理

```javascript
// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

---

## 🎨 4 种更新策略对比

### 方案一：基础版本管理 ⭐

**适合：** 内容网站、博客

**特点：**

- ✅ 友好提示用户更新
- ✅ 给用户选择权
- ✅ 不打断用户操作

**代码：**

```javascript
// 不使用 skipWaiting()，等待用户确认
self.addEventListener("install", (event) => {
  // 不调用 self.skipWaiting()
});
```

**效果：** 用户看到提示 → 用户选择更新 → 刷新页面 → 应用新版本

---

### 方案二：自动更新 ⚡

**适合：** 实时应用、聊天工具

**特点：**

- ✅ 新版本立即激活
- ✅ 页面自动刷新
- ⚠️ 可能打断用户操作

**代码：**

```javascript
// Service Worker 中
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 立即激活
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // 通知所有客户端刷新
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "RELOAD" });
        });
      });
    })
  );
});

// 客户端中
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "RELOAD") {
    window.location.reload();
  }
});
```

**效果：** 发布新版本 → 立即激活 → 自动刷新 → 用户无感知

---

### 方案三：智能更新 💎 (推荐)

**适合：** Web 应用、管理系统

**特点：**

- ✅ 在用户空闲时更新
- ✅ 保存用户数据后再刷新
- ✅ 关键操作时不打断
- ✅ 给用户选择权

**代码：**

```javascript
// 检查用户是否繁忙
function isUserBusy() {
  // 检查表单是否有未保存的数据
  const forms = document.querySelectorAll("form.dirty");
  if (forms.length > 0) return true;

  // 检查是否有正在进行的上传
  const uploads = document.querySelectorAll(".uploading");
  if (uploads.length > 0) return true;

  return false;
}

// 智能处理更新
function handleUpdate() {
  if (isUserBusy()) {
    // 用户正在操作，延迟提示
    setTimeout(handleUpdate, 60000); // 1分钟后再检查
    return;
  }

  // 显示友好的更新对话框
  showUpdateDialog();
}

// 保存用户数据
async function saveUserData() {
  // 自动保存表单数据到 localStorage
  const forms = document.querySelectorAll("form");
  for (const form of forms) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    localStorage.setItem(`form_backup_${form.id}`, JSON.stringify(data));
  }
}
```

**效果：** 发布新版本 → 检测用户状态 → 空闲时提示 → 保存数据 → 更新

---

### 方案四：渐进式更新 🎯 (大型应用)

**适合：** 大型应用、电商、社交平台

**特点：**

- ✅ 灰度发布（只对部分用户推送）
- ✅ A/B 测试
- ✅ 可回滚
- ✅ 监控和统计

**代码：**

```javascript
const UPDATE_STRATEGY = {
  rolloutPercentage: 20, // 只对20%的用户推送更新
  minVersion: "1.0.0",
  forceUpdateVersion: "0.9.0", // 强制更新的版本阈值
};

// 判断是否应该显示更新
async function shouldShowUpdate(strategy) {
  // 1. 检查是否需要强制更新
  const currentVersion = await getCurrentVersion();
  if (compareVersion(currentVersion, strategy.forceUpdateVersion) < 0) {
    return true; // 强制更新
  }

  // 2. 灰度发布逻辑
  if (strategy.rolloutPercentage < 100) {
    // 基于用户ID的哈希值决定是否在灰度范围内
    const hash = hashCode(userId);
    const inRollout = hash % 100 < strategy.rolloutPercentage;

    // 上报灰度决策
    reportRolloutDecision(inRollout);

    return inRollout;
  }

  return true;
}

// 简单哈希函数
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

**效果：** 发布新版本 → 灰度策略判断 → 部分用户更新 → 监控指标 → 全量发布

---

## 🎯 选择合适的策略

### 快速决策表

| 你的应用类型       | 推荐方案 | 理由                     |
| ------------------ | -------- | ------------------------ |
| 博客、新闻网站     | 方案一   | 更新频率低，用户体验优先 |
| 实时聊天、协作工具 | 方案二   | 需要所有用户保持同步     |
| 后台管理系统       | 方案三   | 保护用户数据，体验最佳   |
| 电商、大型社交应用 | 方案四   | 需要灰度发布和监控       |

### 详细对比

| 维度         | 方案一     | 方案二     | 方案三     | 方案四     |
| ------------ | ---------- | ---------- | ---------- | ---------- |
| **实现难度** | ⭐         | ⭐⭐       | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| **用户体验** | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| **更新速度** | ⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐     |
| **可控性**   | ⭐⭐⭐     | ⭐         | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **适用规模** | 小型       | 中小型     | 中大型     | 大型       |

---

## 🛠️ 实际部署流程

### 手动管理（适合小型项目）

```bash
# 1. 修改版本号
# 编辑 sw-version-demo.js
const VERSION = "1.0.1";

# 编辑 sw-version-demo.html
const EXPECTED_VERSION = "1.0.1";

# 2. 部署到服务器
scp sw-version-demo.js server:/var/www/app/
scp sw-version-demo.html server:/var/www/app/

# 3. 重启服务（如果需要）
ssh server "pm2 restart app"

# 4. 用户下次访问时会自动检测到更新
```

### 自动化构建（推荐）

```javascript
// build.js
const fs = require("fs");
const { version } = require("./package.json");
const buildTime = new Date().toISOString();

// 替换 Service Worker 中的版本号
let swContent = fs.readFileSync("sw-version-demo.js", "utf8");
swContent = swContent.replace(
  /const VERSION = ["'].+?["']/,
  `const VERSION = "${version}"`
);
swContent = swContent.replace(
  /const BUILD_TIME = ["'].+?["']/,
  `const BUILD_TIME = "${buildTime}"`
);
fs.writeFileSync("dist/sw-version-demo.js", swContent);

// 替换 HTML 中的版本号
let htmlContent = fs.readFileSync("sw-version-demo.html", "utf8");
htmlContent = htmlContent.replace(
  /const EXPECTED_VERSION = ["'].+?["']/,
  `const EXPECTED_VERSION = "${version}"`
);
fs.writeFileSync("dist/sw-version-demo.html", htmlContent);

console.log(`✅ 构建完成，版本: ${version}`);
```

```json
// package.json
{
  "name": "my-app",
  "version": "1.0.1",
  "scripts": {
    "build": "node build.js",
    "deploy": "npm run build && rsync -avz dist/ server:/var/www/app/"
  }
}
```

```bash
# 更新版本并部署
npm version patch  # 1.0.0 -> 1.0.1
npm run deploy     # 自动构建和部署
```

---

## ⚠️ 重要注意事项

### 1. Service Worker 文件不能被缓存

**问题：** 如果 SW 文件被缓存，浏览器永远无法检测到更新。

**解决方案：**

```nginx
# Nginx 配置
location ~* sw.*\.js$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

```javascript
// Express 配置
app.get("/sw-*.js", (req, res) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.sendFile(req.path);
});
```

### 2. 版本号必须同步

确保三个地方的版本号一致：

- ✅ Service Worker 中的 `VERSION`
- ✅ HTML 中的 `EXPECTED_VERSION`
- ✅ 服务器 API 返回的版本号（如果有）

**建议：** 使用自动化构建脚本统一管理。

### 3. 测试环境和生产环境分离

```javascript
const isDev = location.hostname === "localhost";

if (isDev) {
  // 开发环境：快速更新
  self.skipWaiting();
  self.clients.claim();
} else {
  // 生产环境：友好提示
  // 不使用 skipWaiting()
}
```

### 4. 准备回滚机制

```bash
# 部署前备份
cp sw-version-demo.js sw-version-demo.js.backup

# 出问题时快速回滚
mv sw-version-demo.js.backup sw-version-demo.js
pm2 restart app
```

---

## 🔍 调试技巧

### Chrome DevTools

1. **打开 Application 标签**

   - Service Workers：查看 SW 状态
   - Storage > Cache Storage：查看缓存内容
   - Clear storage：清除所有数据

2. **常用操作**

   - Update：手动检查更新
   - Unregister：注销 Service Worker
   - Bypass for network：跳过 SW，直接访问网络

3. **调试模式**
   ```
   chrome://serviceworker-internals/
   ```
   查看所有已注册的 Service Worker

### Firefox DevTools

```
about:debugging#/runtime/this-firefox
```

查看和调试 Service Worker

### 命令行检查

```javascript
// 在浏览器控制台执行

// 查看所有注册的 SW
navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log("注册的 Service Workers:", regs);
});

// 查看当前 SW 状态
navigator.serviceWorker.ready.then((reg) => {
  console.log("活动的 SW:", reg.active);
  console.log("等待的 SW:", reg.waiting);
  console.log("安装中的 SW:", reg.installing);
});

// 查看推送订阅
navigator.serviceWorker.ready
  .then((reg) => {
    return reg.pushManager.getSubscription();
  })
  .then((sub) => {
    console.log("推送订阅:", sub);
  });
```

---

## 📊 监控和统计

### 版本分布统计

```javascript
// 服务器端记录版本信息
app.post("/api/report-version", (req, res) => {
  const { version, userId, userAgent } = req.body;

  // 保存到数据库
  db.versions.insert({
    version,
    userId,
    userAgent,
    timestamp: new Date(),
  });

  res.json({ status: "ok" });
});

// 客户端上报
async function reportVersion() {
  const version = await getCurrentVersion();
  await fetch("/api/report-version", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version,
      userId: getUserId(),
      userAgent: navigator.userAgent,
    }),
  });
}
```

### 更新成功率统计

```javascript
// 记录更新流程
app.post("/api/update-stats", (req, res) => {
  const { event, oldVersion, newVersion, userId } = req.body;

  // event: 'detected', 'shown', 'accepted', 'completed', 'failed'

  db.updateStats.insert({
    event,
    oldVersion,
    newVersion,
    userId,
    timestamp: new Date(),
  });

  res.json({ status: "ok" });
});
```

---

## 🎓 总结

### 核心原则

1. **永远不要阻止浏览器更新检查**
2. **给用户选择权，但引导更新**
3. **保护用户数据和操作**
4. **监控更新成功率**
5. **准备回滚机制**

### 推荐组合

```
小型项目  = 方案一（基础）+ 手动管理
中型项目  = 方案三（智能）+ 自动化构建
大型项目  = 方案四（渐进式）+ 完善监控
```

### 下一步

1. ✅ 体验演示页面：`http://localhost:3000/sw-version-demo.html`
2. ✅ 阅读完整指南：`SERVICE-WORKER-VERSION-GUIDE.md`
3. ✅ 查看代码实现：`sw-version-demo.js` 和 `sw-version-demo.html`
4. ✅ 在实际项目中应用

---

## 📚 相关资源

- **本项目文档**

  - [完整版本管理指南](./SERVICE-WORKER-VERSION-GUIDE.md)
  - [推送通知完整文档](./README.md)
  - [演示页面](http://localhost:3000/sw-version-demo.html)

- **MDN 文档**

  - [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
  - [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
  - [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

- **最佳实践**
  - [Google Workbox](https://developers.google.com/web/tools/workbox)
  - [PWA 指南](https://web.dev/progressive-web-apps/)

---

**祝你的 Service Worker 版本管理之旅顺利！** 🎉

如有问题，请查看完整文档或在项目中提 Issue。
