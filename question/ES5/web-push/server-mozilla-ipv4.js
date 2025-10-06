// 使用Mozilla推送服务的服务器 - IPv4版本
// 解决IPv6连接超时问题

const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const path = require("path");
const https = require("https");

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// VAPID 密钥
const vapidKeys = {
  publicKey:
    "BPD7TcMOZHUH2SYi_DEhRKvpkQwaH7vxyN4qrOXr41g7jKpeOLcQ5bgU0uiCGmKCgNtQTBtfwN8hKFVapgh-X68",
  privateKey: "J2zTUIPLn2bB8ldT0I60w8LHojExXWXP-fYZAHxnm84",
};

// 设置 VAPID 详情
webpush.setVapidDetails(
  "mailto:hulc_it@163.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 创建IPv4专用的HTTPS Agent
const ipv4Agent = new https.Agent({
  family: 4, // 强制使用IPv4
  keepAlive: true,
  timeout: 30000, // 30秒超时
});

// 存储推送订阅
let pushSubscriptions = [];

// 生成 VAPID 密钥的端点
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// 保存推送订阅
app.post("/api/push-subscription", (req, res) => {
  const subscription = req.body;

  // 检查是否已存在相同的订阅
  const existingIndex = pushSubscriptions.findIndex(
    (sub) => sub.endpoint === subscription.endpoint
  );

  if (existingIndex >= 0) {
    pushSubscriptions[existingIndex] = subscription;
  } else {
    pushSubscriptions.push(subscription);
  }

  console.log("推送订阅已保存:", subscription.endpoint);
  res.json({ success: true, count: pushSubscriptions.length });
});

// 发送推送通知 (Mozilla IPv4版本)
app.post("/api/send-push", async (req, res) => {
  const { subscription, payload } = req.body;

  try {
    const notificationPayload = JSON.stringify({
      title: payload.title || "推送通知",
      body: payload.body || "您收到了一条新消息",
      icon: payload.icon || "/icon.png",
      badge: payload.badge || "/badge.png",
      data: payload.data || {},
      actions: payload.actions || [
        {
          action: "open",
          title: "打开",
          icon: "/open-icon.png",
        },
      ],
    });

    // 使用IPv4 Agent发送推送
    const pushOptions = {
      TTL: 24 * 60 * 60, // 24小时
      headers: {
        "User-Agent": "Node-WebPush-Mozilla-IPv4",
      },
      agent: ipv4Agent,
    };

    await webpush.sendNotification(
      subscription,
      notificationPayload,
      pushOptions
    );

    console.log("推送通知已发送");
    res.json({ success: true, message: "推送通知已发送" });
  } catch (error) {
    console.error("发送推送通知失败:", error);

    // 提供更详细的错误信息
    let errorMessage = error.message;
    let suggestion = "";

    if (error.code === "ETIMEDOUT") {
      errorMessage = "网络连接超时，请检查网络连接";
      suggestion = "尝试更换VPN节点或检查网络设置";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "无法解析推送服务地址";
      suggestion = "检查DNS设置或尝试使用其他DNS服务器";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "连接被拒绝，可能是防火墙问题";
      suggestion = "检查防火墙设置或尝试使用代理";
    } else if (error.code === "EPROTO") {
      errorMessage = "协议错误";
      suggestion = "可能是网络配置问题，尝试重启网络";
    } else if (error.statusCode === 410) {
      errorMessage = "推送订阅已过期";
      suggestion = "请重新订阅推送服务";
    } else if (error.statusCode === 413) {
      errorMessage = "推送载荷过大";
      suggestion = "请减少推送内容的大小";
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      code: error.code,
      statusCode: error.statusCode,
      suggestion: suggestion,
    });
  }
});

// 广播推送通知给所有订阅者 (Mozilla IPv4版本)
app.post("/api/broadcast-push", async (req, res) => {
  const { title, body, icon, data } = req.body;

  if (pushSubscriptions.length === 0) {
    return res.json({
      success: false,
      message: "没有活跃的推送订阅",
    });
  }

  const notificationPayload = JSON.stringify({
    title: title || "广播通知",
    body: body || "这是一条广播消息",
    icon: icon || "/icon.png",
    data: data || {},
    tag: "broadcast",
  });

  const results = [];

  for (const subscription of pushSubscriptions) {
    try {
      const pushOptions = {
        TTL: 24 * 60 * 60,
        headers: {
          "User-Agent": "Node-WebPush-Mozilla-IPv4",
        },
        agent: ipv4Agent,
      };

      await webpush.sendNotification(
        subscription,
        notificationPayload,
        pushOptions
      );
      results.push({ success: true, endpoint: subscription.endpoint });
    } catch (error) {
      console.error("发送失败:", subscription.endpoint, error.message);
      results.push({
        success: false,
        endpoint: subscription.endpoint,
        error: error.message,
        statusCode: error.statusCode,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;

  res.json({
    success: true,
    message: `推送通知已发送给 ${successCount}/${pushSubscriptions.length} 个订阅者`,
    results,
  });
});

// 获取订阅统计
app.get("/api/subscription-stats", (req, res) => {
  res.json({
    totalSubscriptions: pushSubscriptions.length,
    subscriptions: pushSubscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      subscribedAt: sub.subscribedAt || "未知",
    })),
  });
});

// 清理无效订阅
app.post("/api/cleanup-subscriptions", async (req, res) => {
  const validSubscriptions = [];

  for (const subscription of pushSubscriptions) {
    try {
      const pushOptions = {
        TTL: 60, // 1分钟
        headers: {
          "User-Agent": "Node-WebPush-Mozilla-IPv4",
        },
        agent: ipv4Agent,
      };

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "测试",
          body: "验证订阅有效性",
        }),
        pushOptions
      );
      validSubscriptions.push(subscription);
    } catch (error) {
      console.log("无效订阅已移除:", subscription.endpoint);
    }
  }

  const removedCount = pushSubscriptions.length - validSubscriptions.length;
  pushSubscriptions = validSubscriptions;

  res.json({
    success: true,
    message: `已清理 ${removedCount} 个无效订阅`,
    remainingCount: validSubscriptions.length,
  });
});

// 网络状态检查端点
app.get("/api/network-status", (req, res) => {
  res.json({
    status: "online",
    mode: "mozilla-ipv4",
    message: "使用Mozilla推送服务 (IPv4)",
    service: "updates.push.services.mozilla.com",
    ipVersion: "IPv4",
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mozilla推送通知服务器运行在 http://localhost:${PORT}`);
  console.log(
    `📱 测试页面: http://localhost:${PORT}/push-notification-mozilla.html`
  );
  console.log(`🔑 VAPID 公钥: ${vapidKeys.publicKey}`);
  console.log(`🌐 推送服务: Mozilla (updates.push.services.mozilla.com)`);
  console.log(`🔧 网络模式: IPv4专用 (解决IPv6连接超时问题)`);
});

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n🛑 服务器正在关闭...");
  process.exit(0);
});
