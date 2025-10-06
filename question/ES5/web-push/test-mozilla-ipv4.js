// 测试Mozilla推送服务 - IPv4版本
const https = require("https");

const testMozillaIPv4Push = async () => {
  console.log("🧪 测试Mozilla推送服务 - IPv4版本");
  console.log("=====================================");

  // 模拟一个Mozilla推送订阅
  const testSubscription = {
    endpoint:
      "https://updates.push.services.mozilla.com/wpush/v2/test-endpoint",
    keys: {
      p256dh: "test-p256dh-key",
      auth: "test-auth-key",
    },
  };

  const testPayload = {
    title: "Mozilla IPv4推送测试",
    body: "这是通过Mozilla推送服务(IPv4)发送的测试通知",
    icon: "/icon.png",
  };

  try {
    console.log("📤 发送Mozilla IPv4测试推送...");

    const response = await fetch("http://localhost:3000/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: testSubscription,
        payload: testPayload,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Mozilla IPv4推送发送成功:", result.message);
    } else {
      console.log("❌ Mozilla IPv4推送发送失败:", result.error);
      console.log("💡 建议:", result.suggestion);
    }
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
};

// 检查服务器状态
const checkServer = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/network-status");
    const status = await response.json();
    console.log("🌐 服务器状态:", status.message);
    console.log("🔗 推送服务:", status.service);
    console.log("🌍 IP版本:", status.ipVersion);
    return true;
  } catch (error) {
    console.error("❌ 无法连接到服务器:", error.message);
    return false;
  }
};

// 测试Mozilla推送服务IPv4连接
const testMozillaIPv4Connection = async () => {
  try {
    console.log("🔍 测试Mozilla推送服务IPv4连接...");

    // 创建IPv4专用的HTTPS Agent
    const ipv4Agent = new https.Agent({
      family: 4, // 强制使用IPv4
      keepAlive: true,
      timeout: 10000,
    });

    const response = await fetch(
      "https://updates.push.services.mozilla.com/wpush/v2",
      {
        method: "HEAD",
        agent: ipv4Agent,
      }
    );

    if (response.ok || response.status === 405) {
      console.log("✅ Mozilla推送服务IPv4连接正常");
      return true;
    } else {
      console.log("❌ Mozilla推送服务IPv4连接异常:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Mozilla推送服务IPv4连接失败:", error.message);
    return false;
  }
};

// 主函数
const main = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    const mozillaIPv4Connected = await testMozillaIPv4Connection();
    if (mozillaIPv4Connected) {
      await testMozillaIPv4Push();
    } else {
      console.log("⚠️  Mozilla推送服务IPv4连接失败，但服务器正在运行");
    }
  } else {
    console.log("请先启动Mozilla IPv4推送服务器: npm run start:mozilla-ipv4");
  }
};

main();
