// SharedWorker - 可以被多个浏览器标签页共享的 Worker
// 用于在不同页面之间共享数据和通信

// ==================== 版本信息 ====================
// 🚨 部署新版本时务必更新这个版本号！
const WORKER_VERSION = "1.0.0";
const BUILD_TIME = "2025-10-20T14:30:00Z";
// =================================================

// 存储所有连接的端口
const ports = [];
let sharedCounter = 0;
const messages = [];
const connectedClients = new Map();
let clientIdCounter = 0;

// 日志样式
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

console.log("=".repeat(60));
log("success", "🚀 SharedWorker 已启动");
log("info", "📦 版本号:", WORKER_VERSION);
log("info", "🏗️ 构建时间:", BUILD_TIME);
log("info", "📍 Worker 位置:", self.location.href);
log("info", "⏰ 启动时间:", new Date().toISOString());
console.log("=".repeat(60));

// 监听连接事件
self.onconnect = (e) => {
  const port = e.ports[0];
  const clientId = ++clientIdCounter;

  ports.push({ port, clientId, connectedAt: new Date() });
  connectedClients.set(port, clientId);

  console.group(`👤 客户端 ${clientId} 连接`);
  log("success", "✅ 新客户端连接");
  log("info", "🆔 客户端 ID:", clientId);
  log("info", "📊 当前连接数:", ports.length);
  console.table(
    ports.map((p) => ({
      客户端ID: p.clientId,
      连接时间: p.connectedAt.toLocaleTimeString(),
    }))
  );
  console.groupEnd();

  // 向新连接的客户端发送初始化数据
  port.postMessage({
    type: "init",
    clientId: clientId,
    counter: sharedCounter,
    messages: messages,
    totalConnections: ports.length,
    // 版本信息
    version: WORKER_VERSION,
    buildTime: BUILD_TIME,
  });

  // 通知所有其他客户端有新连接
  broadcast(
    {
      type: "client-connected",
      clientId: clientId,
      totalConnections: ports.length,
      timestamp: new Date().toISOString(),
    },
    port
  );

  // 监听消息
  port.onmessage = (event) => {
    const { type, data } = event.data;

    switch (type) {
      case "increment":
        sharedCounter++;
        log("info", `➕ 计数器递增: ${sharedCounter} (客户端 ${clientId})`);
        // 广播给所有客户端
        broadcast({
          type: "counter-update",
          counter: sharedCounter,
          updatedBy: clientId,
        });
        break;

      case "decrement":
        sharedCounter--;
        log("info", `➖ 计数器递减: ${sharedCounter} (客户端 ${clientId})`);
        broadcast({
          type: "counter-update",
          counter: sharedCounter,
          updatedBy: clientId,
        });
        break;

      case "reset":
        sharedCounter = 0;
        log("warning", `🔄 计数器重置 (客户端 ${clientId})`);
        broadcast({
          type: "counter-update",
          counter: sharedCounter,
          updatedBy: clientId,
        });
        break;

      case "send-message":
        const message = {
          id: messages.length + 1,
          clientId: clientId,
          text: data,
          timestamp: new Date().toISOString(),
        };
        messages.push(message);
        log("success", `💬 收到消息 (客户端 ${clientId}):`, data);

        // 广播给所有客户端
        broadcast({
          type: "new-message",
          message: message,
        });
        break;

      case "clear-messages":
        messages.length = 0;
        log("warning", `🗑️ 消息已清空 (客户端 ${clientId})`);
        broadcast({
          type: "messages-cleared",
          clearedBy: clientId,
        });
        break;

      case "ping":
        // 响应 ping 请求
        port.postMessage({
          type: "pong",
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        log("error", "❌ 未知消息类型:", type);
    }
  };

  // 监听端口关闭
  port.onmessageerror = (error) => {
    log("error", "❌ 消息错误:", error);
  };

  // 开始监听消息
  port.start();
};

// 广播消息给所有客户端（除了发送者）
function broadcast(message, excludePort = null) {
  ports.forEach(({ port }) => {
    if (port !== excludePort) {
      try {
        port.postMessage(message);
      } catch (error) {
        log("error", "❌ 发送消息失败:", error);
      }
    }
  });
}

// 注意：SharedWorker 没有简单的方法检测端口断开
// 需要在客户端主动关闭时发送消息，或使用心跳机制

// 定期输出心跳日志（方便调试）
setInterval(() => {
  if (ports.length > 0) {
    log(
      "info",
      `💓 心跳 - 连接数: ${ports.length}, 计数器: ${sharedCounter}, 消息数: ${messages.length}`
    );
  }
}, 10000); // 每10秒一次
