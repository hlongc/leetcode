const express = require("express");
const WebSocket = require("ws");

const app = express();

app.use(express.static("."));

app.get("/socket", (req, res, next) => {
  res.send("WebSocket server is running");
});

// SharedWorker 版本管理 API
app.get("/api/worker-version", (req, res) => {
  // 在实际生产环境中，这个版本号应该从配置文件或环境变量中读取
  res.json({
    version: "1.0.0",
    buildTime: "2025-10-20T14:30:00Z",
    updateAvailable: false,
  });
});

// SSE 端点
app.get("/sse", (req, res) => {
  // 设置 SSE 必需的响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("新的 SSE 连接已建立");

  // 发送欢迎消息
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "SSE 连接成功！",
    })}\n\n`
  );

  // 模拟打字机效果 - 逐字发送一段文本
  const text =
    "这是一个 Server-Sent Events (SSE) 演示。SSE 是一种服务器推送技术，允许服务器向客户端发送实时更新。与 WebSocket 不同，SSE 是单向的（只能服务器到客户端），但它更简单，且基于 HTTP 协议。";
  let index = 0;

  const intervalId = setInterval(() => {
    if (index < text.length) {
      res.write(
        `data: ${JSON.stringify({
          type: "char",
          char: text[index],
          index: index,
        })}\n\n`
      );
      index++;
    } else {
      // 文本发送完成
      res.write(
        `data: ${JSON.stringify({ type: "done", message: "发送完成" })}\n\n`
      );
      clearInterval(intervalId);
    }
  }, 100); // 每100ms发送一个字符

  // 每5秒发送一次心跳
  // 作用：
  // 1. 保持连接活跃，防止超时
  // 2. 检测连接状态
  // 3. 避免代理/防火墙关闭空闲连接
  const heartbeatId = setInterval(() => {
    try {
      res.write(`:heartbeat ${Date.now()}\n\n`);
      // 以 : 开头的是注释行，客户端会忽略，不触发 onmessage
    } catch (error) {
      console.error("心跳发送失败，连接可能已断开:", error);
      clearInterval(heartbeatId);
    }
  }, 5000);

  // 客户端断开连接时清理
  req.on("close", () => {
    console.log("SSE 连接已关闭");
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    res.end();
  });
});

// SSE 端点 - 实时时间推送
app.get("/sse/time", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("新的时间推送 SSE 连接已建立");

  // 每秒发送当前时间
  const intervalId = setInterval(() => {
    const now = new Date();
    res.write(
      `data: ${JSON.stringify({
        time: now.toLocaleTimeString("zh-CN"),
        timestamp: now.getTime(),
      })}\n\n`
    );
  }, 1000);

  req.on("close", () => {
    console.log("时间推送 SSE 连接已关闭");
    clearInterval(intervalId);
    res.end();
  });
});

// 创建 HTTP 服务器
const server = app.listen(3000, () => {
  console.log("server run on 3000 port");
});

// 在同一个端口上创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 监听 WebSocket 连接
wss.on("connection", (ws, req) => {
  console.log("新的 WebSocket 连接已建立");

  // 向客户端发送欢迎消息
  ws.send(JSON.stringify({ type: "welcome", message: "连接成功！" }));

  // 监听客户端发送的消息
  ws.on("message", (message) => {
    console.log("收到消息:", message.toString());

    // 回显消息给客户端
    ws.send(
      JSON.stringify({
        type: "echo",
        message: `服务器收到: ${message.toString()}`,
      })
    );
  });

  // 监听连接关闭
  ws.on("close", () => {
    console.log("WebSocket 连接已关闭");
  });

  // 监听错误
  ws.on("error", (error) => {
    console.error("WebSocket 错误:", error);
  });
});
