// 修复版Service Worker for Push Notifications
// 解决通知不显示的问题

const CACHE_NAME = "push-notification-cache-v2";
const urlsToCache = [
  "/push-notification-mozilla.html",
  "/push-notification-mozilla-forced.html",
];

// 检查URL是否可以被缓存
function isCacheableUrl(url) {
  try {
    const urlObj = new URL(url);
    return (
      (urlObj.protocol === "http:" || urlObj.protocol === "https:") &&
      (urlObj.hostname === "localhost" ||
        urlObj.hostname === "127.0.0.1" ||
        urlObj.hostname.includes("."))
    );
  } catch (error) {
    console.warn("Invalid URL:", url, error);
    return false;
  }
}

// 安装事件
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return Promise.allSettled(
          urlsToCache.map((url) =>
            cache.add(url).catch((error) => {
              console.warn(`Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log("Cache installation completed");
        return self.skipWaiting();
      })
  );
});

// 激活事件
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (!isCacheableUrl(event.request.url)) {
    console.log("Skipping cache for unsupported URL:", event.request.url);
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("Serving from cache:", event.request.url);
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error("Fetch failed:", error);
          return response;
        });
    })
  );
});

// 修复版推送事件处理
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);
  console.log("Push data:", event.data ? event.data.text() : "No data");

  let notificationData = {
    title: "默认通知",
    body: "您收到了一条新消息",
    icon: "/icon.png",
    badge: "/badge.png",
    // 🔧 修复：使用唯一标签，避免通知被合并
    tag: `push-notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    requireInteraction: true,
    actions: [
      {
        action: "open",
        title: "打开",
        icon: "/open-icon.png",
      },
      {
        action: "close",
        title: "关闭",
        icon: "/close-icon.png",
      },
    ],
    data: {
      url: "/",
      timestamp: Date.now(),
      pushId: Math.random().toString(36).substr(2, 9),
    },
  };

  // 如果服务器发送了数据，使用服务器数据
  if (event.data) {
    try {
      const serverData = event.data.json();
      console.log("Server data received:", serverData);

      // 合并服务器数据，但保持唯一标签
      notificationData = {
        ...notificationData,
        ...serverData,
        tag: serverData.tag || notificationData.tag, // 使用服务器标签或生成唯一标签
        data: {
          ...notificationData.data,
          ...serverData.data,
        },
      };
    } catch (error) {
      console.error("解析推送数据失败:", error);
    }
  }

  console.log("Final notification data:", notificationData);

  // 显示通知
  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log("✅ 通知显示成功");
      })
      .catch((error) => {
        console.error("❌ 通知显示失败:", error);
      })
  );
});

// 通知点击事件
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);
  console.log("Action:", event.action);
  console.log("Notification data:", event.notification.data);

  // 通知主页面用户点击了哪个action
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        // 向所有打开的窗口发送消息
        clientList.forEach((client) => {
          client.postMessage({
            type: "NOTIFICATION_ACTION_CLICKED",
            action: event.action,
            notificationData: event.notification.data,
            timestamp: Date.now(),
          });
        });
      }
    })
  );

  event.notification.close();

  // 根据不同的action执行不同的操作
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        console.log("Existing clients:", clientList.length);

        if (clientList.length > 0) {
          // 聚焦到现有窗口
          console.log("Focusing existing window");
          return clientList[0].focus();
        } else {
          // 打开新窗口
          console.log("Opening new window");
          return clients.openWindow("/");
        }
      })
    );
  } else if (event.action === "close") {
    console.log("Notification closed by user");
  } else if (event.action === "reply") {
    console.log("User clicked reply action");
    // 这里可以添加回复相关的逻辑
  } else if (event.action === "action1") {
    console.log("User clicked action1");
  } else if (event.action === "action2") {
    console.log("User clicked action2");
  } else if (event.action === "single_action") {
    console.log("User clicked single_action");
  } else if (event.action === "like") {
    console.log("User clicked like action");
  } else if (event.action === "share") {
    console.log("User clicked share action");
  } else {
    console.log("User clicked unknown action:", event.action);
  }
});

// 通知关闭事件
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
  console.log("Closed notification data:", event.notification.data);
});

// 推送订阅变化事件
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed:", event);

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription
          ? event.oldSubscription.options.applicationServerKey
          : null,
      })
      .then((subscription) => {
        console.log("New subscription created:", subscription);
        return fetch("/api/push-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });
      })
      .catch((error) => {
        console.error("重新订阅失败:", error);
      })
  );
});

// 消息事件（与主线程通信）
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 错误处理
self.addEventListener("error", (event) => {
  console.error("Service Worker error:", event);
});

// 未处理的Promise拒绝
self.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker unhandled promise rejection:", event);
});
