# 🚀 浏览器推送通知完整示例 - Mozilla 版本

这个项目演示了如何实现"即使浏览器未打开也能发送通知"的功能，基于 Mozilla 推送服务，解决 Google FCM 连接问题。

## 📋 技术原理

### 1. **Service Worker**

- 在后台运行的 JavaScript 线程
- 即使页面关闭也能继续运行
- 负责接收和处理推送消息
- 使用`sw-fixed.js`实现

### 2. **Push API**

- 浏览器提供的推送通知 API
- 需要用户授权才能使用
- 支持加密和认证
- 通过 Mozilla 推送服务实现

### 3. **推送服务**

- **Chrome**: Google FCM (Firebase Cloud Messaging) - 有连接问题
- **Firefox**: Mozilla Push Service - 本项目使用
- **Safari**: Apple APNs

### 4. **VAPID 密钥**

- Voluntary Application Server Identification
- 用于服务器身份验证
- 确保推送来源可信
- 本项目使用固定密钥避免配置问题

## 🔄 完整流程时序图

### 1. 初始化阶段

```
用户浏览器                    Service Worker              服务器
     |                            |                        |
     |--1. 检查浏览器支持--------->|                        |
     |<--支持状态-----------------|                        |
     |                            |                        |
     |--2. 请求通知权限----------->|                        |
     |<--权限授权结果-------------|                        |
     |                            |                        |
     |--3. 注册Service Worker----->|                        |
     |<--注册成功-----------------|                        |
```

### 2. 订阅阶段

```
用户浏览器                    Service Worker              服务器
     |                            |                        |
     |--4. 获取VAPID公钥--------->|                        |
     |<--VAPID公钥---------------|                        |
     |                            |                        |
     |--5. 创建推送订阅----------->|                        |
     |                            |--6. 调用PushManager---->|
     |                            |<--推送订阅对象---------|
     |<--订阅成功-----------------|                        |
     |                            |                        |
     |--7. 发送订阅到服务器------->|                        |
     |                            |                        |--8. 保存订阅信息--------|
     |<--订阅保存成功-------------|                        |
```

### 3. 推送阶段

```
用户浏览器                    Service Worker              服务器                    Mozilla推送服务
     |                            |                        |                           |
     |--9. 发送推送请求----------->|                        |                           |
     |                            |                        |--10. 发送到Mozilla服务--->|
     |                            |                        |<--推送确认---------------|
     |<--推送发送成功-------------|                        |                           |
     |                            |                        |                           |
     |                            |--11. 接收推送消息------>|                           |
     |                            |--12. 解析推送数据------|                           |
     |                            |--13. 显示通知----------|                           |
     |<--14. 用户看到通知---------|                        |                           |
```

### 4. 交互阶段

```
用户浏览器                    Service Worker              服务器
     |                            |                        |
     |--15. 点击通知------------->|                        |
     |                            |--16. 处理点击事件------|
     |                            |--17. 检查窗口状态------|
     |<--18. 打开/聚焦窗口--------|                        |
```

## 🏗️ 系统组件交互图

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户浏览器     │    │  Service Worker  │    │   后端服务器     │    │ Mozilla推送服务  │
│                 │    │                  │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  HTML页面   │ │    │ │ 推送事件监听  │ │    │ │ 订阅管理    │ │    │ │ 推送转发    │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ 权限管理    │ │◄──►│ │ 通知显示     │ │    │ │ 推送发送    │ │◄──►│                 │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │    │                 │
│                 │    │                  │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ 订阅管理    │ │◄──►│ │ 点击处理     │ │    │ │ 错误处理    │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏗️ 系统架构

### 前端组件 (`push-notification-mozilla.html`)

1. **权限管理**

   - 检查浏览器支持
   - 请求通知权限
   - 处理权限状态

2. **Service Worker 注册**

   - 注册`sw-fixed.js`
   - 处理注册成功/失败

3. **推送订阅**

   - 获取 VAPID 公钥
   - 创建推送订阅
   - 发送订阅到服务器

4. **推送测试**
   - 发送测试推送
   - 发送自定义推送
   - 查看推送结果

### Service Worker (`sw-fixed.js`)

1. **生命周期管理**

   - 安装事件：缓存资源
   - 激活事件：清理旧缓存
   - 更新事件：跳过等待

2. **推送处理**

   - 接收推送消息
   - 解析推送数据
   - 显示通知
   - 处理通知点击

3. **缓存管理**
   - 缓存静态资源
   - 提供离线支持

### 后端服务 (`server-mozilla-ipv4.js`)

1. **订阅管理**

   - 保存推送订阅
   - 更新订阅信息
   - 清理无效订阅

2. **推送发送**

   - 单个推送发送
   - 广播推送
   - 错误处理和重试

3. **网络优化**
   - IPv4 专用配置
   - 连接超时处理
   - 详细错误信息

## 🔧 Mozilla 服务特有配置

### 1. **IPv4 强制模式**

```javascript
const ipv4Agent = new https.Agent({
  family: 4, // 强制使用IPv4
  keepAlive: true,
  timeout: 30000, // 30秒超时
});
```

### 2. **推送选项配置**

```javascript
const pushOptions = {
  TTL: 24 * 60 * 60, // 24小时
  headers: {
    "User-Agent": "Node-WebPush-Mozilla-IPv4",
  },
  agent: ipv4Agent,
};
```

### 3. **VAPID 密钥**

```javascript
const vapidKeys = {
  publicKey:
    "BPD7TcMOZHUH2SYi_DEhRKvpkQwaH7vxyN4qrOXr41g7jKpeOLcQ5bgU0uiCGmKCgNtQTBtfwN8hKFVapgh-X68",
  privateKey: "J2zTUIPLn2bB8ldT0I60w8LHojExXWXP-fYZAHxnm84",
};
```

## 🛠️ 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 Mozilla 推送服务器

```bash
node server-mozilla-ipv4.js
```

### 3. 打开测试页面

访问 `http://localhost:3000/push-notification-mozilla.html`

## 📋 详细使用流程

### 步骤 1：权限检查与授权

1. **浏览器支持检测**

   - 检查`Notification` API 支持
   - 检查`Service Worker`支持
   - 检查`PushManager`支持

2. **请求通知权限**
   ```javascript
   const permission = await Notification.requestPermission();
   ```

### 步骤 2：Service Worker 注册

1. **注册 Service Worker**

   ```javascript
   const registration = await navigator.serviceWorker.register("/sw-fixed.js");
   ```

2. **Service Worker 生命周期**
   - 安装：缓存必要资源
   - 激活：清理旧缓存，声明控制权
   - 更新：跳过等待，立即激活

### 步骤 3：推送订阅创建

1. **获取 VAPID 公钥**

   ```javascript
   const response = await fetch("/api/vapid-public-key");
   const { publicKey } = await response.json();
   ```

2. **创建推送订阅**

   ```javascript
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(publicKey),
   });
   ```

3. **保存订阅到服务器**
   ```javascript
   await fetch("/api/push-subscription", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(subscription),
   });
   ```

### 步骤 4：推送消息处理

1. **服务器发送推送**

   ```javascript
   await webpush.sendNotification(subscription, payload, pushOptions);
   ```

2. **Service Worker 接收推送**

   ```javascript
   self.addEventListener("push", (event) => {
     const data = event.data.json();
     self.registration.showNotification(data.title, data);
   });
   ```

3. **通知显示与交互**
   - 显示通知给用户
   - 处理通知点击事件
   - 打开或聚焦到应用窗口

## 🔍 关键代码解析

### 1. Service Worker 推送处理 (`sw-fixed.js`)

```javascript
// 推送事件处理
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "默认通知",
    body: "您收到了一条新消息",
    icon: "/icon.png",
    // 🔧 修复：使用唯一标签，避免通知被合并
    tag: `push-notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    requireInteraction: true,
    actions: [
      { action: "open", title: "打开", icon: "/open-icon.png" },
      { action: "close", title: "关闭", icon: "/close-icon.png" },
    ],
  };

  // 如果服务器发送了数据，使用服务器数据
  if (event.data) {
    const serverData = event.data.json();
    notificationData = { ...notificationData, ...serverData };
  }

  // 显示通知
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});
```

### 2. 服务器推送发送 (`server-mozilla-ipv4.js`)

```javascript
// 创建IPv4专用的HTTPS Agent
const ipv4Agent = new https.Agent({
  family: 4, // 强制使用IPv4
  keepAlive: true,
  timeout: 30000, // 30秒超时
});

// 发送推送通知
const pushOptions = {
  TTL: 24 * 60 * 60, // 24小时
  headers: { "User-Agent": "Node-WebPush-Mozilla-IPv4" },
  agent: ipv4Agent,
};

await webpush.sendNotification(subscription, notificationPayload, pushOptions);
```

### 3. 前端订阅管理 (`push-notification-mozilla.html`)

```javascript
// 订阅推送
async function subscribeToPush() {
  const registration = await registerServiceWorker();
  const response = await fetch("/api/vapid-public-key");
  const { publicKey } = await response.json();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // 发送订阅到服务器
  await fetch("/api/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
}
```

## 🔧 功能特性

### 前端功能 (`push-notification-mozilla.html`)

- ✅ 浏览器支持检测
- ✅ 通知权限管理
- ✅ Service Worker 注册
- ✅ 推送订阅管理
- ✅ 测试推送发送
- ✅ 自定义推送发送
- ✅ 订阅统计查看
- ✅ 网络状态检查

### Service Worker 功能 (`sw-fixed.js`)

- ✅ 资源缓存管理
- ✅ 推送消息接收
- ✅ 通知显示处理
- ✅ 通知点击处理
- ✅ 唯一标签生成（避免通知合并）
- ✅ 错误处理机制

### 后端功能 (`server-mozilla-ipv4.js`)

- ✅ 推送订阅存储
- ✅ 单个推送发送
- ✅ 广播推送
- ✅ 订阅统计
- ✅ 无效订阅清理
- ✅ IPv4 网络优化
- ✅ 详细错误处理
- ✅ 网络状态检查

## 📱 使用步骤

### 1. 环境准备

1. 确保 Node.js 已安装
2. 安装项目依赖：`npm install`
3. 启动服务器：`node server-mozilla-ipv4.js`

### 2. 基础通知测试

1. 打开 `http://localhost:3000/push-notification-mozilla.html`
2. 点击"请求通知权限"
3. 在浏览器弹窗中点击"允许"
4. 查看权限状态是否变为"granted"

### 3. 推送通知测试

1. 点击"订阅推送"
2. 等待 Service Worker 注册和推送订阅创建
3. 点击"发送测试推送"
4. 查看是否收到推送通知
5. 关闭浏览器标签页
6. 再次点击"发送测试推送"（即使浏览器关闭也会收到）

### 4. 高级功能测试

1. 点击"发送自定义推送"输入自定义内容
2. 点击"获取订阅统计"查看订阅信息
3. 点击"清理无效订阅"清理过期订阅
4. 点击"检查网络状态"查看连接状态

## 🔍 技术细节

### Service Worker 生命周期

```javascript
// 安装
self.addEventListener("install", (event) => {
  // 缓存资源
});

// 激活
self.addEventListener("activate", (event) => {
  // 清理旧缓存
});

// 推送
self.addEventListener("push", (event) => {
  // 显示通知
});

// 点击
self.addEventListener("notificationclick", (event) => {
  // 处理点击事件
});
```

### 推送订阅

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey,
});
```

### 服务器推送

```javascript
await webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: "通知标题",
    body: "通知内容",
    icon: "/icon.png",
  })
);
```

## 🚨 注意事项

### 1. HTTPS 要求

- 生产环境必须使用 HTTPS
- 本地开发可以使用 localhost

### 2. 浏览器支持

- Chrome 42+
- Firefox 44+
- Safari 16+ (macOS 13+)
- Edge 17+

### 3. 权限管理

- 需要用户明确授权
- 权限可以被撤销
- 需要处理权限状态变化

### 4. 推送服务限制

- 有推送频率限制
- 有推送大小限制
- 需要处理推送失败

## 🔧 故障排除

### 1. 通知不显示

**可能原因：**

- 系统通知设置被禁用
- 浏览器通知权限被拒绝
- Service Worker 注册失败
- 通知被浏览器合并（相同 tag）

**解决方案：**

```javascript
// 检查系统通知设置
if (Notification.permission === "denied") {
  console.log("通知权限被拒绝，需要在浏览器设置中手动开启");
}

// 使用唯一标签避免通知合并
tag: `push-notification-${Date.now()}-${Math.random()
  .toString(36)
  .substr(2, 9)}`;
```

### 2. 推送订阅失败

**可能原因：**

- VAPID 密钥配置错误
- 不在安全上下文中（非 HTTPS/localhost）
- 浏览器不支持 Push API
- 网络连接问题

**解决方案：**

```javascript
// 检查浏览器支持
if (!("PushManager" in window)) {
  console.log("浏览器不支持推送API");
}

// 检查安全上下文
if (!window.isSecureContext) {
  console.log("需要HTTPS或localhost环境");
}
```

### 3. 服务器推送失败

**可能原因：**

- 推送订阅已过期（410 错误）
- 网络连接超时
- Mozilla 推送服务不可用
- IPv6 连接问题

**解决方案：**

```javascript
// IPv4强制模式
const ipv4Agent = new https.Agent({
  family: 4, // 强制使用IPv4
  keepAlive: true,
  timeout: 30000, // 30秒超时
});

// 错误处理
if (error.statusCode === 410) {
  console.log("推送订阅已过期，需要重新订阅");
} else if (error.code === "ETIMEDOUT") {
  console.log("网络连接超时，检查网络设置");
}
```

### 4. Mozilla 服务特有问题

**IPv6 连接超时：**

```javascript
// 使用IPv4专用Agent
const ipv4Agent = new https.Agent({
  family: 4, // 强制使用IPv4
  keepAlive: true,
  timeout: 30000,
});
```

**推送服务地址解析失败：**

```javascript
// 检查DNS设置
nslookup updates.push.services.mozilla.com

// 使用备用DNS
// 8.8.8.8 或 1.1.1.1
```

**VAPID 密钥问题：**

```javascript
// 确保密钥格式正确
const vapidKeys = {
  publicKey:
    "BPD7TcMOZHUH2SYi_DEhRKvpkQwaH7vxyN4qrOXr41g7jKpeOLcQ5bgU0uiCGmKCgNtQTBtfwN8hKFVapgh-X68",
  privateKey: "J2zTUIPLn2bB8ldT0I60w8LHojExXWXP-fYZAHxnm84",
};
```

### 5. 调试技巧

**1. 检查 Service Worker 状态：**

```javascript
// 在浏览器控制台
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log("Service Workers:", registrations);
});
```

**2. 检查推送订阅：**

```javascript
// 检查当前订阅
navigator.serviceWorker.ready
  .then((registration) => {
    return registration.pushManager.getSubscription();
  })
  .then((subscription) => {
    console.log("当前订阅:", subscription);
  });
```

**3. 检查网络连接：**

```bash
# 测试Mozilla推送服务连接
curl -I https://updates.push.services.mozilla.com/

# 检查IPv4连接
ping -4 updates.push.services.mozilla.com
```

**4. 浏览器开发者工具：**

- Application > Service Workers：查看 Service Worker 状态
- Application > Storage > IndexedDB：查看推送订阅数据
- Network：查看推送请求和响应
- Console：查看错误日志

### 6. 常见错误代码

| 错误代码       | 含义         | 解决方案            |
| -------------- | ------------ | ------------------- |
| `ETIMEDOUT`    | 连接超时     | 检查网络，使用 IPv4 |
| `ENOTFOUND`    | DNS 解析失败 | 检查 DNS 设置       |
| `ECONNREFUSED` | 连接被拒绝   | 检查防火墙设置      |
| `EPROTO`       | 协议错误     | 检查网络配置        |
| `410`          | 订阅过期     | 重新订阅            |
| `413`          | 载荷过大     | 减少推送内容        |

### 7. 性能优化建议

**1. 推送频率控制：**

```javascript
// 避免过于频繁的推送
const lastPushTime = localStorage.getItem("lastPushTime");
const now = Date.now();
if (now - lastPushTime < 60000) {
  // 1分钟内不重复推送
  return;
}
```

**2. 订阅管理：**

```javascript
// 定期清理无效订阅
setInterval(async () => {
  await fetch("/api/cleanup-subscriptions", { method: "POST" });
}, 24 * 60 * 60 * 1000); // 每24小时清理一次
```

**3. 错误重试机制：**

```javascript
// 推送失败重试
async function sendPushWithRetry(subscription, payload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await webpush.sendNotification(subscription, payload, pushOptions);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 📚 相关资源

- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [VAPID](https://tools.ietf.org/html/rfc8292)
- [Mozilla Push Service](https://mozilla.github.io/application-services/docs/push/)
- [web-push 库文档](https://github.com/web-push-libs/web-push)

## 🎯 实际应用场景

- 📧 邮件通知
- 💬 即时消息
- 🔔 系统提醒
- 📰 新闻推送
- 🛒 购物提醒
- 📅 日程提醒
- 🎮 游戏通知
- 📊 数据监控
- 🔐 安全提醒
- 📱 移动端推送

## 💡 最佳实践

### 1. **用户体验**

- 明确说明为什么需要通知权限
- 提供关闭通知的选项
- 避免过度推送
- 使用有意义的通知内容
- 提供通知设置页面

### 2. **技术实现**

- 使用 VAPID 密钥确保安全
- 处理推送失败和重试
- 定期清理无效订阅
- 使用唯一标签避免通知合并
- 实现推送订阅更新机制

### 3. **性能优化**

- 合理使用缓存
- 避免频繁推送
- 监控推送成功率
- 使用 IPv4 避免连接问题
- 实现推送频率限制

### 4. **Mozilla 服务优化**

- 强制使用 IPv4 连接
- 设置合适的超时时间
- 处理网络连接错误
- 监控推送服务状态
- 实现备用推送方案

## 🔄 完整流程总结

1. **初始化阶段**

   - 检查浏览器支持
   - 请求通知权限
   - 注册 Service Worker

2. **订阅阶段**

   - 获取 VAPID 公钥
   - 创建推送订阅
   - 保存订阅到服务器

3. **推送阶段**

   - 服务器发送推送
   - Mozilla 服务转发推送
   - Service Worker 接收推送
   - 显示通知给用户

4. **交互阶段**
   - 用户点击通知
   - 处理点击事件
   - 打开或聚焦应用

## 🔄 Service Worker 版本管理

### 为什么需要版本管理？

Service Worker 的版本管理至关重要，因为：

- ❌ 浏览器会缓存 Service Worker 文件
- ❌ 即使有新版本，旧版本仍会继续运行
- ❌ 用户可能长时间使用旧版本，导致功能异常
- ❌ 缓存策略错误可能导致永远无法更新

### 🚀 快速体验版本管理

我们提供了一个完整的 Service Worker 版本管理演示：

```bash
# 1. 启动服务器（如果还没启动）
node server-mozilla-ipv4.js

# 2. 打开版本管理演示页面
http://localhost:3000/sw-version-demo.html
```

**演示功能：**

- ✅ 版本信息实时显示
- ✅ 自动检测版本更新
- ✅ 用户友好的更新提示
- ✅ 缓存统计和管理
- ✅ 实时操作日志

### 📋 版本管理策略

我们提供了 **4 种版本管理方案**，适用于不同场景：

| 方案               | 适用场景           | 更新方式 | 用户体验 |
| ------------------ | ------------------ | -------- | -------- |
| **方案一：基础**   | 内容网站、博客     | 手动提示 | 友好     |
| **方案二：自动**   | 实时应用、聊天     | 自动刷新 | 可能打断 |
| **方案三：智能**   | Web 应用、管理系统 | 智能判断 | 最佳     |
| **方案四：渐进式** | 大型应用、电商     | 灰度发布 | 可控     |

### 📚 详细文档

查看完整的版本管理指南：

- **[SERVICE-WORKER-VERSION-GUIDE.md](./SERVICE-WORKER-VERSION-GUIDE.md)** - 完整的理论指南和实践方案
- **[sw-version-demo.html](./sw-version-demo.html)** - 可运行的演示页面
- **[sw-version-demo.js](./sw-version-demo.js)** - 完整的 Service Worker 实现

### 🎯 关键要点

1. **版本号管理**

   ```javascript
   // Service Worker 中
   const VERSION = "1.0.0";
   const CACHE_NAME = `app-cache-v${VERSION}`;
   ```

2. **自动更新检测**

   ```javascript
   // 定期检查更新（每5分钟）
   setInterval(() => {
     registration.update();
   }, 5 * 60 * 1000);
   ```

3. **用户友好的更新提示**

   ```javascript
   // 检测到新版本时显示提示
   if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
     showUpdateNotification(newWorker);
   }
   ```

4. **缓存清理**
   ```javascript
   // 激活时清理旧缓存
   caches.keys().then((cacheNames) => {
     return Promise.all(
       cacheNames
         .filter((name) => name !== CACHE_NAME)
         .map((name) => caches.delete(name))
     );
   });
   ```

### ⚡ 推荐策略

**对于本推送通知项目，推荐使用「智能更新策略」（方案三）：**

- ✅ 在用户空闲时更新
- ✅ 保存用户数据后再刷新
- ✅ 关键操作时不打断
- ✅ 给用户选择权

**核心代码示例：**

```javascript
// 检测到新版本时
registration.addEventListener("updatefound", () => {
  const newWorker = registration.installing;

  newWorker.addEventListener("statechange", () => {
    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
      // 检查用户是否繁忙
      if (!isUserBusy()) {
        showUpdateDialog(); // 显示友好的更新对话框
      } else {
        // 稍后再提示
        setTimeout(handleUpdate, 60000);
      }
    }
  });
});
```

### 🔧 实际应用

在你的项目中使用版本管理：

1. **更新 Service Worker 版本号**

   ```javascript
   // sw-fixed.js 或 sw-version-demo.js
   const VERSION = "1.0.1"; // 从 1.0.0 更新到 1.0.1
   ```

2. **更新 HTML 中的期望版本**

   ```javascript
   // push-notification-mozilla.html
   const EXPECTED_VERSION = "1.0.1";
   ```

3. **部署新版本**

   ```bash
   # 上传更新后的文件到服务器
   scp sw-fixed.js server:/path/to/app/
   scp push-notification-mozilla.html server:/path/to/app/
   ```

4. **用户自动获得更新**
   - 用户刷新页面时检测到新版本
   - 显示友好的更新提示
   - 用户确认后自动更新

---

## 🎉 项目特色

- ✅ **解决 Google FCM 连接问题**：使用 Mozilla 推送服务
- ✅ **IPv4 网络优化**：强制使用 IPv4 避免连接超时
- ✅ **完整错误处理**：详细的错误信息和解决建议
- ✅ **唯一通知标签**：避免通知被浏览器合并
- ✅ **订阅管理**：自动清理无效订阅
- ✅ **版本管理**：完整的 Service Worker 版本更新方案
- ✅ **详细文档**：完整的流程说明和故障排除指南

这个基于 Mozilla 服务的 Web Push 实现展示了完整的推送通知解决方案，解决了 Google FCM 的连接问题，提供了稳定的推送服务。包含完整的 Service Worker 版本管理功能，确保用户始终使用最新版本。您可以根据实际需求进行修改和扩展。
