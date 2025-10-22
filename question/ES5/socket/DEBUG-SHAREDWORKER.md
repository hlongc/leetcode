# 如何调试 SharedWorker

## 🔍 查看 SharedWorker 的 console.log

SharedWorker 运行在独立的线程中，日志不会出现在普通的浏览器控制台。

### 🌐 Chrome/Edge 浏览器

#### 方法 1：通过 chrome://inspect

1. **打开检查页面**

   - 在地址栏输入：`chrome://inspect/#workers`
   - 或者：右键页面 → 检查 → 点击 "Sources" → 左侧找到 Threads

2. **找到 SharedWorker**

   - 在页面中找到 **"Shared workers"** 部分
   - 会显示类似：`http://localhost:3000/shared-worker.js`

3. **打开 DevTools**

   - 点击 SharedWorker 右侧的 **"inspect"** 链接
   - 会打开一个新的 DevTools 窗口

4. **查看日志**
   - 切换到 **Console** 标签
   - 所有 `console.log` 输出都在这里

#### 方法 2：通过主页面 DevTools

1. 打开你的页面（如 `http://localhost:3000/shared-worker-demo.html`）
2. 按 `F12` 打开 DevTools
3. 点击 **Sources** 标签
4. 左侧面板找到 **Threads** → 展开
5. 找到你的 SharedWorker
6. 点击它，就能看到代码和日志

### 🦊 Firefox 浏览器

1. **打开调试页面**

   - 在地址栏输入：`about:debugging#/runtime/this-firefox`

2. **找到 Shared Workers**

   - 在 "This Firefox" 标签下
   - 找到 **Shared Workers** 部分

3. **检查 Worker**

   - 点击你的 SharedWorker 右侧的 **"检查"** 按钮
   - 打开独立的调试窗口

4. **查看日志**
   - 在 Console 标签查看输出

### 🧪 Safari 浏览器

Safari 对 SharedWorker 的支持有限，调试功能也较弱。

## 📸 Chrome DevTools 截图说明

### 你会看到什么：

```
chrome://inspect/#workers

Shared workers
├── http://localhost:3000/shared-worker.js  [inspect]
│   Started: 2025-10-20 14:30:22
│   Connections: 3
```

点击 `[inspect]` 后，在 Console 中会看到：

```
SharedWorker 已启动
新客户端连接，ID: 1，当前连接数: 1
新客户端连接，ID: 2，当前连接数: 2
计数器递增: 1
收到消息: Hello from client 1
```

## 💡 调试技巧

### 1. 使用断点

在 SharedWorker DevTools 的 Sources 标签中：

- 点击行号设置断点
- 当代码执行到断点时会暂停
- 可以查看变量值、调用栈等

### 2. 增强日志

在 SharedWorker 中添加更详细的日志：

```javascript
// shared-worker.js
console.log("=".repeat(50));
console.log("🔵 SharedWorker 启动时间:", new Date().toISOString());
console.log("=".repeat(50));

self.onconnect = (e) => {
  const clientId = ++clientIdCounter;
  console.group(`👤 客户端 ${clientId} 连接`);
  console.log("连接时间:", new Date().toLocaleTimeString());
  console.log("当前总连接数:", ports.length + 1);
  console.groupEnd();

  port.onmessage = (event) => {
    console.log("📨 收到消息:", {
      from: clientId,
      type: event.data.type,
      data: event.data.data,
    });
  };
};
```

### 3. 使用 console.table

查看数组或对象更清晰：

```javascript
console.table(
  ports.map((p, i) => ({
    index: i,
    clientId: p.clientId,
    connectedAt: p.connectedAt,
  }))
);
```

### 4. 使用 Performance API

测量性能：

```javascript
console.time("处理消息");
// ... 处理逻辑
console.timeEnd("处理消息");
```

## 🚨 常见问题

### Q1: 找不到 Shared Workers 部分？

**A:** 确保至少有一个页面连接到 SharedWorker。如果页面还没有创建 SharedWorker 实例，这个部分不会显示。

### Q2: 点击 inspect 没反应？

**A:**

- 检查是否被弹窗拦截器阻止
- 尝试刷新 `chrome://inspect` 页面
- 重启浏览器

### Q3: 日志不显示？

**A:**

- 确认已经打开了正确的 DevTools（SharedWorker 的，不是页面的）
- 检查 Console 是否有过滤器（All levels）
- 尝试在 SharedWorker 中添加 `debugger;` 语句

### Q4: 多个标签页打开，看到多条日志？

**A:** 这是正常的。SharedWorker 是共享的，所有连接的日志都会显示在同一个 Console 中。可以用前缀区分：

```javascript
console.log(`[Client ${clientId}] 消息内容`);
```

## 🔄 热重载问题

**注意：** SharedWorker 不会自动重载！

修改 `shared-worker.js` 后需要：

1. 关闭所有使用该 Worker 的标签页
2. 重新打开页面
3. 或者在 `chrome://inspect` 中手动 terminate

### 解决方案：添加版本号

```javascript
// 页面中
const worker = new SharedWorker("shared-worker.js?v=" + Date.now());
```

或者：

```javascript
// 开发时使用
const isDev = true;
const workerUrl = isDev
  ? `shared-worker.js?v=${Date.now()}`
  : "shared-worker.js";
const worker = new SharedWorker(workerUrl);
```

## 📝 推荐的日志格式

```javascript
// shared-worker.js
const LOG_STYLES = {
  info: "color: #2196F3; font-weight: bold",
  success: "color: #4CAF50; font-weight: bold",
  warning: "color: #FF9800; font-weight: bold",
  error: "color: #F44336; font-weight: bold",
};

function log(level, ...args) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(
    `%c[${timestamp}] [${level.toUpperCase()}]`,
    LOG_STYLES[level],
    ...args
  );
}

// 使用
log("info", "SharedWorker 已启动");
log("success", "客户端连接成功", clientId);
log("warning", "连接数过多", ports.length);
log("error", "消息处理失败", error);
```

## 🎯 快速测试

要快速验证 SharedWorker 日志是否正常，在 `shared-worker.js` 开头添加：

```javascript
console.log("🚀 SharedWorker 加载成功！时间:", new Date().toISOString());
console.log("📍 Worker 位置:", self.location.href);

// 定时输出心跳
setInterval(() => {
  console.log(
    "💓 心跳:",
    new Date().toLocaleTimeString(),
    "连接数:",
    ports.length
  );
}, 5000);
```

刷新页面后，去 `chrome://inspect/#workers` 应该能看到这些日志。

## 🔗 相关链接

- [Chrome DevTools - Inspect Workers](https://developer.chrome.com/docs/devtools/javascript/workers)
- [MDN - Debugging Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#debugging_worker_threads)
