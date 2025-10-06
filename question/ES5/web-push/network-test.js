// 网络连接测试工具
const https = require("https");
const dns = require("dns");

console.log("🔍 网络连接诊断工具");
console.log("==================");

// 测试DNS解析
async function testDNS() {
  console.log("\n1. 测试DNS解析...");

  const domains = [
    "fcm.googleapis.com",
    "updates.push.services.mozilla.com",
    "api.push.apple.com",
  ];

  for (const domain of domains) {
    try {
      const addresses = await new Promise((resolve, reject) => {
        dns.resolve4(domain, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      console.log(`✅ ${domain}: ${addresses.join(", ")}`);
    } catch (error) {
      console.log(`❌ ${domain}: ${error.message}`);
    }
  }
}

// 测试HTTPS连接
async function testHTTPS() {
  console.log("\n2. 测试HTTPS连接...");

  const testUrls = [
    "https://fcm.googleapis.com/fcm/send",
    "https://updates.push.services.mozilla.com/wpush/v2",
    "https://api.push.apple.com/3/device",
  ];

  for (const url of testUrls) {
    try {
      await new Promise((resolve, reject) => {
        const req = https.request(
          url,
          {
            method: "HEAD",
            timeout: 10000,
            family: 4, // 强制使用IPv4
          },
          (res) => {
            console.log(`✅ ${url}: ${res.statusCode}`);
            resolve();
          }
        );

        req.on("error", reject);
        req.on("timeout", () => reject(new Error("Timeout")));
        req.end();
      });
    } catch (error) {
      console.log(`❌ ${url}: ${error.message}`);
    }
  }
}

// 测试IPv6连接
async function testIPv6() {
  console.log("\n3. 测试IPv6连接...");

  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve6("fcm.googleapis.com", (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log(`✅ IPv6地址: ${addresses.join(", ")}`);
  } catch (error) {
    console.log(`❌ IPv6解析失败: ${error.message}`);
  }
}

// 检查网络接口
function checkNetworkInterfaces() {
  console.log("\n4. 检查网络接口...");
  const os = require("os");
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    console.log(`\n${name}:`);
    addresses.forEach((addr) => {
      console.log(
        `  ${addr.family}: ${addr.address} (${
          addr.internal ? "internal" : "external"
        })`
      );
    });
  }
}

// 主函数
async function main() {
  try {
    await testDNS();
    await testHTTPS();
    await testIPv6();
    checkNetworkInterfaces();

    console.log("\n💡 建议:");
    console.log("- 如果IPv6连接失败，请使用IPv4");
    console.log("- 检查防火墙设置");
    console.log("- 尝试使用VPN或代理");
    console.log("- 检查网络提供商的IPv6支持");
  } catch (error) {
    console.error("诊断失败:", error);
  }
}

main();
