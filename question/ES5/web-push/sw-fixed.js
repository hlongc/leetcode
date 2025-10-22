// ========================================
// 启用 Service Worker 类型提示
// ========================================
// 下面这行代码让编辑器（VSCode/Cursor）提供 Service Worker API 的代码提示
//
// ❓ 为什么是 "webworker" 而不是 "serviceworker"？
// 答：因为 Service Worker 是 Web Worker 的一个特殊类型
//
// Web Worker 家族包括：
//   1. Dedicated Worker（专用工作线程）
//   2. Shared Worker（共享工作线程）
//   3. Service Worker（服务工作线程）← 我们用的这个
//
// TypeScript 的 "webworker" 类型库包含了所有 Worker 类型的定义，
// 包括 Service Worker 的所有 API（如 caches、push、notification 等）
//
// 📚 可用的 TypeScript lib 选项：
//   - lib="dom"          → 浏览器 DOM API（window, document 等）
//   - lib="webworker"    → Web Worker API（包括 Service Worker）
//   - lib="es2015"       → ES2015 语法特性
//   - lib="esnext"       → 最新 ES 特性
//
/// <reference lib="webworker" />

// 🔧 修复类型问题：明确告诉编辑器 self 是 ServiceWorkerGlobalScope
// 这样可以避免 "类型 'Window & typeof globalThis' 上不存在属性" 的错误
/** @type {ServiceWorkerGlobalScope} */
// @ts-ignore - 忽略 self 的类型检查
const sw = self;

// ========================================
// Service Worker 文件说明
// ========================================
// Service Worker 是一个运行在浏览器后台的脚本，独立于网页运行
// 它可以拦截网络请求、缓存资源、接收推送通知等
// 这个文件是修复版的 Service Worker，专门用于处理推送通知
// ========================================

// ========================================
// 🔍 关于 event.waitUntil() 方法
// ========================================
// waitUntil() 不是所有事件都有的！它只存在于以下特殊事件中：
//
// ✅ 拥有 waitUntil() 的事件（都是 ExtendableEvent 类型）：
//    - install 事件       (InstallEvent)
//    - activate 事件      (ExtendableEvent)
//    - fetch 事件         (FetchEvent，有 respondWith 和 waitUntil)
//    - push 事件          (PushEvent)
//    - notificationclick  (NotificationEvent)
//    - notificationclose  (NotificationEvent)
//    - sync 事件          (SyncEvent)
//    - message 事件       (ExtendableMessageEvent)
//
// ❌ 没有 waitUntil() 的事件（普通事件）：
//    - 普通的 DOM 事件（如 click, mouseover 等）
//    - window 的 load, DOMContentLoaded 等事件
//    - 自定义事件（CustomEvent）
//
// 📌 为什么只有这些事件有 waitUntil()？
// 因为 Service Worker 运行在独立的线程中，浏览器需要知道何时可以
// 终止 Service Worker。waitUntil() 就是告诉浏览器"请等待异步操作完成"
// ========================================

// ========================================
// 1. 缓存配置部分
// ========================================

// 定义缓存的名称和版本号
// 当你更新 Service Worker 时，修改版本号可以强制清除旧缓存

const CACHE_PREFIX = "push-notification-cache-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;

// 定义需要预缓存的文件列表
// 这些文件会在 Service Worker 安装时被缓存，以便离线访问
const urlsToCache = [
  "/push-notification-mozilla.html", // 主页面
  "/push-notification-mozilla-forced.html", // 备用页面
];

// ========================================
// 2. 工具函数：检查 URL 是否可缓存
// ========================================
// 这个函数用于判断一个 URL 是否适合被缓存
// 不是所有的 URL 都能被缓存（例如 chrome:// 协议的 URL）
function isCacheableUrl(url) {
  try {
    // 尝试创建 URL 对象来解析 URL
    const urlObj = new URL(url);

    // 返回是否可缓存的判断结果
    return (
      // 检查协议：只缓存 http 或 https 协议的资源
      (urlObj.protocol === "http:" || urlObj.protocol === "https:") &&
      // 检查主机名：只缓存本地或有效域名的资源
      (urlObj.hostname === "localhost" || // 本地开发环境
        urlObj.hostname === "127.0.0.1" || // 本地 IP
        urlObj.hostname.includes(".")) // 有效域名（包含点号）
    );
  } catch (error) {
    // 如果 URL 解析失败（无效的 URL），记录警告并返回 false
    console.warn("Invalid URL:", url, error);
    return false;
  }
}

// ========================================
// 3. Service Worker 生命周期：安装阶段 (install)
// ========================================
// 当浏览器首次检测到 Service Worker 文件，或者文件内容发生变化时，会触发 install 事件
// 这是 Service Worker 生命周期的第一个阶段
// 通常在这个阶段预缓存静态资源
sw.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  // ========================================
  // 🔥 event.waitUntil() 详解
  // ========================================
  // 作用：告诉浏览器 "等待这个 Promise 完成后，才能认为 install 事件结束"
  // 延长事件生命周期：waitUntil() 让浏览器等待异步操作完成
  //
  // 如果不使用 event.waitUntil()：
  // ❌ 浏览器会立即认为 install 事件完成
  // ❌ Service Worker 可能在缓存文件下载完成前就进入下一个阶段
  // ❌ 缓存操作可能被中断，导致文件没有缓存成功
  //
  // 使用 event.waitUntil() 后：
  // ✅ 浏览器会等待 Promise resolve 后才认为 install 完成
  // ✅ 如果 Promise reject，install 失败，Service Worker 被丢弃
  // ✅ 确保所有缓存操作完成后才进入 activate 阶段
  //
  // 代码对比：
  //
  // 错误写法（不用 waitUntil）：
  // self.addEventListener('install', (event) => {
  //   caches.open(CACHE_NAME).then(cache => {
  //     cache.addAll(urlsToCache);  // 可能还没执行完，install 就结束了！
  //   });
  //   // ⚠️ 这里 install 事件立即结束，缓存可能还在进行中
  // });
  //
  // 正确写法（使用 waitUntil）：
  // self.addEventListener('install', (event) => {
  //   event.waitUntil(
  //     caches.open(CACHE_NAME).then(cache => {
  //       return cache.addAll(urlsToCache);  // 等待缓存完成
  //     })
  //   );
  //   // ✅ 只有当 Promise resolve 后，install 才算完成
  // });
  // ========================================
  event.waitUntil(
    caches
      // 打开（或创建）一个名为 CACHE_NAME 的缓存存储空间
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");

        // Promise.allSettled() 会等待所有 Promise 完成，无论成功还是失败
        // 这比 Promise.all() 更宽容，不会因为一个文件缓存失败而导致整个安装失败
        return Promise.allSettled(
          // 遍历 urlsToCache 数组，尝试缓存每个 URL
          urlsToCache.map((url) =>
            // cache.add() 会发起网络请求，然后将响应存入缓存
            cache.add(url).catch((error) => {
              // 如果某个文件缓存失败，只记录警告，不中断整个流程
              console.warn(`Failed to cache ${url}:`, error);
              return null; // 返回 null 表示这个文件缓存失败了，但继续执行
            })
          )
        );
      })
      .then(() => {
        console.log("Cache installation completed");
        // self.skipWaiting() 让新的 Service Worker 立即激活，不等待旧的 Service Worker 停止
        // 通常新的 Service Worker 要等到所有使用旧版本的页面都关闭后才会激活
        // 调用 skipWaiting() 可以跳过这个等待过程
        return sw.skipWaiting();
      })
  );
});

// ========================================
// 4. Service Worker 生命周期：激活阶段 (activate)
// ========================================
// 在 Service Worker 安装成功后，会进入激活阶段
// 这个阶段通常用来清理旧版本的缓存
// 激活成功后，Service Worker 就可以开始控制页面了
//
// ⚠️ 重要概念：Service Worker 的作用域 (Scope)
// ========================================
// Q: 一个域名可以有多个 Service Worker 吗？
// A: 可以！但有限制：
//    - 一个 **scope（作用域）** 只能有一个激活的 Service Worker
//    - 同一个域名可以有多个不同 scope 的 Service Worker
//
// 示例：
// navigator.serviceWorker.register('/sw.js', { scope: '/' });
//   → 控制整个网站
//
// navigator.serviceWorker.register('/app1/sw.js', { scope: '/app1/' });
//   → 只控制 /app1/ 路径
//
// navigator.serviceWorker.register('/app2/sw.js', { scope: '/app2/' });
//   → 只控制 /app2/ 路径
//
// 这三个 Service Worker 可以同时存在！
//
// ⚠️ 这段代码的问题：
// caches.keys() 会获取**整个域名下所有的缓存**，包括：
//   - 当前 SW 不同版本的缓存 (push-notification-cache-v1, v2, v3...)
//   - 其他 scope 的 SW 创建的缓存 (app1-cache, app2-cache...)
//   - 甚至网页直接使用 Cache API 创建的缓存
//
// 当前代码会删除所有不是 CACHE_NAME 的缓存，这可能误删其他应用的缓存！
//
// ✅ 推荐做法：使用缓存名称前缀，只删除属于当前应用的旧缓存
// 例如：const CACHE_PREFIX = 'push-notification-cache-';
//      只删除以这个前缀开头的旧缓存
// ========================================
sw.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  // event.waitUntil() 确保清理工作完成后才激活
  event.waitUntil(
    caches
      // caches.keys() 获取所有缓存存储空间的名称
      // ⚠️ 注意：这会返回整个域名下**所有**的缓存，不仅仅是当前 SW 的缓存
      .keys()
      .then((cacheNames) => {
        // Promise.all() 等待所有缓存清理完成
        return Promise.all(
          // 遍历所有缓存名称
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith(CACHE_PREFIX) &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
            // 如果是当前版本的缓存，不做任何操作（返回 undefined）
          })
        );
      })
      .then(() => {
        // self.clients.claim() 让当前的 Service Worker 立即接管所有页面
        // 通常新的 Service Worker 只会控制新打开的页面，已打开的页面仍由旧版本控制
        // 调用 claim() 可以让新版本立即接管所有页面，包括已打开的页面
        return sw.clients.claim();
      })
  );
});

// ========================================
// 5. 网络请求拦截 (fetch)
// ========================================
// Service Worker 可以拦截页面发出的所有网络请求
// 这让我们可以实现离线缓存、请求修改等功能
// 这里使用的是 "缓存优先" 策略：先查缓存，没有再发网络请求
//
// 🔍 fetch 事件的特殊性：
// fetch 事件对象 (FetchEvent) 有两个特殊方法：
//    1. event.respondWith(promise) - 自定义响应（必须同步调用）
//    2. event.waitUntil(promise)   - 延长事件生命周期（可以异步调用）
//
// 区别：
// - respondWith() 用于返回响应给页面（替代默认的网络请求）
// - waitUntil() 用于执行后台任务（如更新缓存），不阻塞响应
// ========================================
sw.addEventListener("fetch", (event) => {
  // ========================================
  // 🔍 调试日志：记录所有被拦截的请求
  // ========================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌐 [Fetch Event] 拦截到请求");
  console.log("📍 URL:", event.request.url);
  console.log("🔧 Method:", event.request.method);
  console.log("📦 Mode:", event.request.mode);
  console.log("🎯 Destination:", event.request.destination);

  // 只处理 GET 请求，其他请求（POST、PUT、DELETE 等）直接放行
  // 因为 GET 请求通常用于获取资源，适合缓存
  if (event.request.method !== "GET") {
    console.log("⏭️ 跳过非 GET 请求");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return; // 不拦截非 GET 请求
  }

  // 检查这个 URL 是否适合缓存
  // 例如 chrome:// 协议的 URL 不能缓存
  if (!isCacheableUrl(event.request.url)) {
    console.log("⏭️ 跳过不可缓存的 URL:", event.request.url);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return; // 不拦截不可缓存的 URL
  }

  // event.respondWith() 让我们可以自定义响应
  // 浏览器会使用我们返回的响应，而不是默认的网络请求
  event.respondWith(
    // 先从缓存中查找匹配的请求
    caches.match(event.request).then((response) => {
      // 如果缓存中有匹配的响应（缓存命中）
      if (response) {
        console.log("✅ 从缓存返回:", event.request.url);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return response; // 直接返回缓存的响应，不发起网络请求
      }

      // 缓存未命中，需要发起网络请求
      console.log("🌍 缓存未命中，从网络获取:", event.request.url);
      return fetch(event.request)
        .then((response) => {
          console.log("✅ 网络请求成功:", event.request.url);
          console.log("📊 状态码:", response.status);
          console.log("📦 响应类型:", response.type);

          // 检查响应是否有效
          // !response: 响应不存在
          // response.status !== 200: HTTP 状态码不是 200（成功）
          // response.type !== "basic": 不是同源请求的响应
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            console.log("⚠️ 响应无效，不缓存");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            // 如果响应无效，直接返回，不缓存
            return response;
          }

          // 响应只能被读取一次，所以需要克隆
          // 一份用于返回给页面，一份用于存入缓存
          const responseToCache = response.clone();

          // 将响应存入缓存（异步操作，不阻塞响应返回）
          caches.open(CACHE_NAME).then((cache) => {
            console.log("💾 将响应存入缓存:", event.request.url);
            cache.put(event.request, responseToCache);
          });

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          // 返回原始响应给页面
          return response;
        })
        .catch((error) => {
          // 网络请求失败（例如离线状态）
          console.error("❌ 网络请求失败:", event.request.url);
          console.error("💥 错误信息:", error);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

          // 返回一个错误响应
          return new Response("网络请求失败，且没有缓存", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain; charset=utf-8",
            }),
          });
        });
    })
  );
});

// ========================================
// 6. 推送通知事件 (push) - 核心功能
// ========================================
// 当服务器向用户推送消息时，会触发这个事件
// 这是 Service Worker 最重要的功能之一
// 即使用户没有打开你的网站，也能收到推送通知
sw.addEventListener("push", (event) => {
  // 记录推送事件，方便调试
  console.log("Push event received:", event);
  // 显示推送携带的数据（如果有）
  console.log("Push data:", event.data ? event.data.text() : "No data");

  // 定义通知的默认配置
  // 如果服务器没有发送配置，就使用这些默认值
  let notificationData = {
    title: "默认通知", // 通知标题
    body: "您收到了一条新消息", // 通知正文
    icon: "/icon.png", // 通知图标（显示在通知左侧）
    badge: "/badge.png", // 徽章图标（显示在通知栏上的小图标）

    // 🔧 修复：使用唯一标签，避免通知被合并
    // tag 是通知的标识符，相同 tag 的通知会互相替换
    // 这里生成一个唯一的 tag，确保每个通知都能显示出来
    tag: `push-notification-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`, // 使用时间戳和随机字符串组合

    requireInteraction: true, // 要求用户手动关闭通知（不自动消失）

    // 定义通知上的操作按钮
    actions: [
      {
        action: "open", // 操作标识符
        title: "打开", // 按钮文字
        icon: "/open-icon.png", // 按钮图标
      },
      {
        action: "close", // 操作标识符
        title: "关闭", // 按钮文字
        icon: "/close-icon.png", // 按钮图标
      },
    ],

    // 附加数据，可以在用户点击通知时获取
    data: {
      url: "/", // 点击通知后要打开的 URL
      timestamp: Date.now(), // 推送时间戳
      pushId: Math.random().toString(36).substr(2, 9), // 推送 ID
    },
  };

  // 如果服务器发送了数据，使用服务器数据覆盖默认配置
  if (event.data) {
    try {
      // event.data.json() 将推送数据解析为 JSON 对象
      const serverData = event.data.json();
      console.log("Server data received:", serverData);

      // 使用 ES6 展开运算符合并对象
      // 服务器数据会覆盖默认数据
      notificationData = {
        ...notificationData, // 先展开默认配置
        ...serverData, // 再展开服务器配置（会覆盖同名属性）
        tag: serverData.tag || notificationData.tag, // tag 特殊处理
        data: {
          ...notificationData.data, // 合并 data 对象
          ...serverData.data,
        },
      };
    } catch (error) {
      // 如果服务器发送的不是有效的 JSON，记录错误并使用默认配置
      console.error("解析推送数据失败:", error);
    }
  }

  // 显示最终的通知配置，方便调试
  console.log("Final notification data:", notificationData);

  // event.waitUntil() 确保通知显示完成后才结束推送事件
  // 如果不使用 waitUntil，Service Worker 可能在通知显示前就被终止
  event.waitUntil(
    // self.registration.showNotification() 显示通知
    // 第一个参数是标题，第二个参数是配置对象
    sw.registration
      .showNotification(notificationData.title, notificationData)
      .then(() => {
        // 通知显示成功
        console.log("✅ 通知显示成功");
      })
      .catch((error) => {
        // 通知显示失败（例如用户拒绝了通知权限）
        console.error("❌ 通知显示失败:", error);
      })
  );
});

// ========================================
// 7. 通知点击事件 (notificationclick)
// ========================================
// 当用户点击通知或通知上的按钮时触发
// 可以根据用户点击的按钮执行不同的操作
sw.addEventListener("notificationclick", (event) => {
  // 记录点击事件的详细信息
  console.log("Notification clicked:", event);
  console.log("Action:", event.action); // 用户点击的按钮标识（如果点击的是通知主体，则为空字符串）
  console.log("Notification data:", event.notification.data); // 通知携带的自定义数据

  // 向所有打开的页面发送消息，告知用户点击了通知
  // 这样页面可以根据用户的点击做出响应
  event.waitUntil(
    // clients.matchAll() 获取所有由当前 Service Worker 控制的客户端（页面）
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        // 向所有打开的窗口发送消息
        clientList.forEach((client) => {
          // client.postMessage() 向页面发送消息
          // 页面可以通过 navigator.serviceWorker.addEventListener('message') 接收
          client.postMessage({
            type: "NOTIFICATION_ACTION_CLICKED", // 消息类型
            action: event.action, // 用户点击的操作
            notificationData: event.notification.data, // 通知数据
            timestamp: Date.now(), // 点击时间
          });
        });
      }
    })
  );

  // 关闭通知
  // 点击后自动关闭通知，避免通知一直显示
  event.notification.close();

  // 根据用户点击的不同按钮执行不同的操作
  if (event.action === "open" || !event.action) {
    // 如果点击的是"打开"按钮，或者点击的是通知主体（!event.action 为真）
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        console.log("Existing clients:", clientList.length);

        if (clientList.length > 0) {
          // 如果已经有打开的窗口，聚焦到第一个窗口
          console.log("Focusing existing window");
          return clientList[0].focus(); // 激活并聚焦窗口
        } else {
          // 如果没有打开的窗口，打开一个新窗口
          console.log("Opening new window");
          return clients.openWindow("/"); // 打开网站首页
        }
      })
    );
  } else if (event.action === "close") {
    // 用户点击了"关闭"按钮
    console.log("Notification closed by user");
    // 通知已在上面关闭，这里只需要记录日志
  } else if (event.action === "reply") {
    // 用户点击了"回复"按钮
    console.log("User clicked reply action");
    // 这里可以添加回复相关的逻辑
    // 例如打开一个回复界面或显示输入框
  } else if (event.action === "action1") {
    // 自定义操作1
    console.log("User clicked action1");
  } else if (event.action === "action2") {
    // 自定义操作2
    console.log("User clicked action2");
  } else if (event.action === "single_action") {
    // 单一操作
    console.log("User clicked single_action");
  } else if (event.action === "like") {
    // 点赞操作
    console.log("User clicked like action");
  } else if (event.action === "share") {
    // 分享操作
    console.log("User clicked share action");
  } else {
    // 未知的操作
    console.log("User clicked unknown action:", event.action);
  }
});

// ========================================
// 8. 通知关闭事件 (notificationclose)
// ========================================
// 当用户关闭通知（不是点击，而是直接关闭）时触发
// 可以用于统计用户行为，例如记录有多少用户关闭了通知而没有点击
sw.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
  console.log("Closed notification data:", event.notification.data);
  // 可以在这里发送统计数据到服务器
  // 例如：fetch('/api/notification-closed', { method: 'POST', ... })
});

// ========================================
// 9. 推送订阅变化事件 (pushsubscriptionchange)
// ========================================
// 当推送订阅过期或被撤销时触发
// 需要重新订阅推送服务
sw.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed:", event);

  // 自动重新订阅
  event.waitUntil(
    sw.registration.pushManager
      .subscribe({
        // userVisibleOnly: true 表示所有推送都必须显示通知
        // 这是浏览器的要求，不允许静默推送
        userVisibleOnly: true,
        // 使用旧订阅的服务器公钥（如果有）
        // 这个公钥是服务器生成的，用于加密推送消息
        applicationServerKey: event.oldSubscription
          ? event.oldSubscription.options.applicationServerKey
          : null,
      })
      .then((subscription) => {
        // 订阅成功，将新的订阅信息发送到服务器
        console.log("New subscription created:", subscription);
        return fetch("/api/push-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // 将订阅对象转换为 JSON 发送给服务器
          // 服务器需要保存这个订阅信息，以便后续推送消息
          body: JSON.stringify(subscription),
        });
      })
      .catch((error) => {
        // 重新订阅失败
        console.error("重新订阅失败:", error);
      })
  );
});

// ========================================
// 10. 消息事件 (message) - 与页面通信
// ========================================
// 当页面通过 serviceWorker.postMessage() 发送消息时触发
// Service Worker 和页面可以通过这个机制互相通信
sw.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  // 如果页面发送了 SKIP_WAITING 消息
  // 立即激活新的 Service Worker
  if (event.data && event.data.type === "SKIP_WAITING") {
    sw.skipWaiting(); // 跳过等待，立即激活
  }

  // 可以在这里处理其他类型的消息
  // 例如：
  // if (event.data.type === "CLEAR_CACHE") {
  //   caches.delete(CACHE_NAME);
  // }
});

// ========================================
// 11. 错误处理事件 (error)
// ========================================
// 当 Service Worker 中发生未捕获的错误时触发
// 用于全局错误处理和日志记录
sw.addEventListener("error", (event) => {
  console.error("Service Worker error:", event);
  // 可以在这里将错误发送到错误追踪服务
  // 例如：Sentry、Bugsnag 等
});

// ========================================
// 12. 未处理的 Promise 拒绝事件 (unhandledrejection)
// ========================================
// 当 Promise 被拒绝但没有 .catch() 处理时触发
// 用于捕获异步代码中的错误
sw.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker unhandled promise rejection:", event);
  // event.reason 包含了拒绝的原因
  // 同样可以发送到错误追踪服务
});

// ========================================
// Service Worker 生命周期总结
// ========================================
// 1. 注册 (Register)     - 在页面中调用 navigator.serviceWorker.register()
// 2. 安装 (Install)      - 触发 install 事件，预缓存资源
// 3. 等待 (Waiting)      - 等待旧版本停止（除非调用 skipWaiting()）
// 4. 激活 (Activate)     - 触发 activate 事件，清理旧缓存
// 5. 控制 (Controlling)  - 开始控制页面，拦截请求和接收推送
// 6. 冗余 (Redundant)    - 被新版本替换或安装失败
// ========================================
