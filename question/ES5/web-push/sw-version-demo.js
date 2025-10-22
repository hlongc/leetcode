// Service Worker 版本管理演示
// 这是一个完整的、可运行的 Service Worker 示例

// ==================== 版本信息 ====================
// 🚨 部署新版本时务必更新这个版本号！
const VERSION = "1.0.0";
const BUILD_TIME = "2025-10-20T15:00:00Z";
const CACHE_NAME = `app-cache-v${VERSION}`;
// =================================================

// 需要缓存的资源
const URLS_TO_CACHE = ["/", "/sw-version-demo.html", "/test-mozilla-ipv4.js"];

console.log("=".repeat(60));
console.log(`🚀 Service Worker ${VERSION} 启动`);
console.log(`🏗️ 构建时间: ${BUILD_TIME}`);
console.log(`📦 缓存名称: ${CACHE_NAME}`);
console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
console.log("=".repeat(60));

// ==================== 安装事件 ====================
self.addEventListener("install", (event) => {
  console.log(`📦 安装 Service Worker ${VERSION}`);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("✅ 缓存已打开");
        // 尝试缓存资源，失败不影响安装
        return Promise.allSettled(
          URLS_TO_CACHE.map((url) =>
            cache.add(url).catch((error) => {
              console.warn(`⚠️ 缓存失败 ${url}:`, error.message);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log("✅ 安装完成");
        // 🔥 可选：立即激活新版本（激进策略）
        // return self.skipWaiting();
      })
  );
});

// ==================== 激活事件 ====================
self.addEventListener("activate", (event) => {
  console.log(`🎉 激活 Service Worker ${VERSION}`);

  event.waitUntil(
    Promise.all([
      // 1. 清理旧缓存
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => name !== CACHE_NAME)
              .map((name) => {
                console.log(`🗑️ 删除旧缓存: ${name}`);
                return caches.delete(name);
              })
          );
        })
        .then((deleted) => {
          console.log(`✅ 已删除 ${deleted.filter(Boolean).length} 个旧缓存`);
        }),

      // 2. 立即控制所有客户端
      self.clients.claim().then(() => {
        console.log("✅ 已接管所有客户端");
      }),
    ]).then(() => {
      // 3. 通知所有客户端：新版本已激活
      return self.clients.matchAll({ type: "window" }).then((clients) => {
        console.log(`📢 向 ${clients.length} 个客户端发送激活通知`);
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_ACTIVATED",
            version: VERSION,
            buildTime: BUILD_TIME,
            timestamp: Date.now(),
          });
        });
      });
    })
  );
});

// ==================== 网络请求拦截 ====================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 只处理 GET 请求
  if (event.request.method !== "GET") {
    return;
  }

  // 跳过非同源请求
  if (url.origin !== self.location.origin) {
    return;
  }

  // 跳过 API 请求（这里使用网络优先策略）
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // HTML 文件 - 网络优先，失败时使用缓存
  if (url.pathname.endsWith(".html") || url.pathname === "/") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 静态资源 - 缓存优先，后台更新
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 其他请求 - 网络优先
  event.respondWith(networkFirst(event.request));
});

// 网络优先策略
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // 如果响应成功，更新缓存
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log(
      `⚠️ 网络请求失败，尝试缓存: ${request.url.substring(0, 50)}...`
    );

    // 网络失败，使用缓存
    const cached = await caches.match(request);
    if (cached) {
      console.log("✅ 使用缓存");
      return cached;
    }

    // 缓存也没有，返回离线页面
    return new Response("离线模式 - 无法加载资源", {
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({
        "Content-Type": "text/plain; charset=utf-8",
      }),
    });
  }
}

// 缓存优先策略
async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    // 后台更新缓存
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response);
          });
        }
      })
      .catch(() => {
        // 后台更新失败不影响用户
      });

    return cached;
  }

  // 缓存中没有，从网络获取
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("无法加载资源", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// ==================== 消息处理 ====================
self.addEventListener("message", (event) => {
  console.log("📨 收到消息:", event.data);

  // 获取版本信息
  if (event.data === "GET_VERSION" || event.data?.type === "GET_VERSION") {
    const port = event.ports?.[0] || event.source;
    port.postMessage({
      type: "VERSION_INFO",
      version: VERSION,
      buildTime: BUILD_TIME,
      cacheName: CACHE_NAME,
      timestamp: Date.now(),
    });
    return;
  }

  // 客户端确认更新
  if (event.data === "SKIP_WAITING" || event.data?.type === "SKIP_WAITING") {
    console.log("🚀 客户端确认，立即激活新版本");
    self.skipWaiting();
    return;
  }

  // 清理缓存
  if (event.data === "CLEAR_CACHE" || event.data?.type === "CLEAR_CACHE") {
    console.log("🗑️ 清理所有缓存");
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => {
        console.log("✅ 缓存已清理");
        event.source.postMessage({
          type: "CACHE_CLEARED",
          timestamp: Date.now(),
        });
      });
    return;
  }

  // 获取缓存统计
  if (
    event.data === "GET_CACHE_STATS" ||
    event.data?.type === "GET_CACHE_STATS"
  ) {
    getCacheStats().then((stats) => {
      event.source.postMessage({
        type: "CACHE_STATS",
        stats,
        timestamp: Date.now(),
      });
    });
    return;
  }
});

// 获取缓存统计
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {
    cacheCount: cacheNames.length,
    caches: {},
  };

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats.caches[name] = {
      itemCount: keys.length,
      items: keys.map((req) => req.url),
    };
  }

  return stats;
}

// ==================== Push 通知 ====================
self.addEventListener("push", (event) => {
  console.log("📬 收到 Push 消息");

  let notificationData = {
    title: "新消息",
    body: "您收到了一条新消息",
    icon: "/icon.png",
    badge: "/badge.png",
    tag: `notification-${Date.now()}`,
    data: {
      url: "/",
      timestamp: Date.now(),
      version: VERSION,
    },
  };

  if (event.data) {
    try {
      const serverData = event.data.json();
      notificationData = { ...notificationData, ...serverData };
    } catch (error) {
      console.error("解析 Push 数据失败:", error);
    }
  }

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log("✅ 通知已显示");
      })
      .catch((error) => {
        console.error("❌ 通知显示失败:", error);
      })
  );
});

// 通知点击事件
self.addEventListener("notificationclick", (event) => {
  console.log("👆 通知被点击", event.action);

  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // 如果已有窗口打开，聚焦它
          for (const client of clientList) {
            if (client.url === "/" && "focus" in client) {
              return client.focus();
            }
          }
          // 否则打开新窗口
          if (clients.openWindow) {
            return clients.openWindow("/");
          }
        })
    );
  }
});

// ==================== 错误处理 ====================
self.addEventListener("error", (event) => {
  console.error("❌ Service Worker 错误:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ 未处理的 Promise 拒绝:", event.reason);
});

// ==================== 订阅变化 ====================
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("🔄 Push 订阅已变化");

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          event.oldSubscription?.options?.applicationServerKey,
      })
      .then((subscription) => {
        console.log("✅ 新订阅已创建");
        // 这里应该将新订阅发送到服务器
        return fetch("/api/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
      })
      .catch((error) => {
        console.error("❌ 重新订阅失败:", error);
      })
  );
});

console.log("✅ Service Worker 脚本加载完成");
