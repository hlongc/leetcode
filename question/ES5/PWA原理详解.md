# PWA（Progressive Web App）原理详解

## 📖 什么是 PWA？

PWA（渐进式 Web 应用）是一种可以提供类似原生应用体验的 Web 应用。它结合了 Web 和原生应用的优点。

### 核心特性

| 特性 | 说明 | 实现方式 |
|------|------|---------|
| **可安装** | 可以添加到主屏幕，像原生应用一样启动 | Web App Manifest |
| **离线可用** | 没有网络也能访问 | Service Worker + Cache API |
| **推送通知** | 可以接收服务器推送的消息 | Push API + Notification API |
| **后台同步** | 网络恢复时自动同步数据 | Background Sync API |
| **响应式** | 适配各种屏幕尺寸 | 响应式设计 |
| **安全** | 必须通过 HTTPS 访问 | HTTPS |
| **渐进增强** | 在所有浏览器上都能运行 | 特性检测 |

---

## 🏗️ PWA 架构原理

```
┌─────────────────────────────────────────────┐
│                  用户界面                    │
│            (HTML + CSS + JS)                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│              Service Worker                  │
│         (独立的后台线程)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 拦截请求 │  │ 缓存管理 │  │ 推送通知 │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└────────┬───────────────────────────┬────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│   Cache Storage │         │   IndexedDB      │
│   (静态资源)    │         │   (动态数据)     │
└─────────────────┘         └──────────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
            ┌─────────────────┐
            │   网络/服务器    │
            └─────────────────┘
```

---

## 1️⃣ Service Worker（核心原理）

### Service Worker 是什么？

Service Worker 是一个在浏览器后台运行的脚本，独立于网页，提供了拦截和处理网络请求的能力。

```javascript
/**
 * Service Worker 生命周期
 * 
 * 1. 注册（Register）
 * 2. 安装（Install）
 * 3. 激活（Activate）
 * 4. 工作（Fetch/Message）
 * 5. 销毁（Terminated）
 */

// ============================================
// 主页面：注册 Service Worker
// ============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      console.log('✅ Service Worker 注册成功:', registration.scope);
      
      // 检查更新
      registration.update();
      
      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 发现新版本');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ 新版本已安装，等待激活');
            // 提示用户刷新页面
          }
        });
      });
    })
    .catch((error) => {
      console.error('❌ Service Worker 注册失败:', error);
    });
}

// ============================================
// service-worker.js：Service Worker 脚本
// ============================================

const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/logo.png',
  '/offline.html'
];

/**
 * 1. Install 事件：首次安装时触发
 * 
 * 作用：预缓存静态资源
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 缓存静态资源');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
  );
});

/**
 * 2. Activate 事件：激活时触发
 * 
 * 作用：清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本缓存
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有页面
      return self.clients.claim();
    })
  );
});

/**
 * 3. Fetch 事件：拦截所有网络请求
 * 
 * 核心：实现离线功能
 */
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] 拦截请求:', event.request.url);
  
  event.respondWith(
    // 缓存优先策略（Cache First）
    caches.match(event.request)
      .then((cachedResponse) => {
        // 缓存命中，返回缓存
        if (cachedResponse) {
          console.log('[Cache] 从缓存读取:', event.request.url);
          return cachedResponse;
        }
        
        // 缓存未命中，从网络获取
        console.log('[Network] 从网络获取:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应（响应是流，只能读一次）
            const responseToCache = response.clone();
            
            // 缓存新资源
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 网络失败，返回离线页面
            return caches.match('/offline.html');
          });
      })
  );
});
```

### Service Worker 工作原理图解

```
网页发起请求
    │
    ▼
Service Worker 拦截
    │
    ├─────────────┬─────────────┐
    ▼             ▼             ▼
缓存优先     网络优先      仅缓存
    │             │             │
查找缓存     请求网络      查找缓存
    │             │             │
找到？       成功？         找到？
   ├─是→返回    ├─是→缓存+返回  ├─是→返回
   └─否→网络    └─否→缓存兜底   └─否→404
```

---

## 2️⃣ 缓存策略（Caching Strategies）

### 策略1：Cache First（缓存优先）

**适用场景**：静态资源（CSS、JS、图片）

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
```

**流程**：
1. 先查缓存
2. 缓存命中 → 返回
3. 缓存未命中 → 请求网络

### 策略2：Network First（网络优先）

**适用场景**：API 数据、频繁更新的内容

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 更新缓存
        const cache = caches.open(CACHE_NAME);
        cache.then(c => c.put(event.request, response.clone()));
        return response;
      })
      .catch(() => {
        // 网络失败，使用缓存
        return caches.match(event.request);
      })
  );
});
```

**流程**：
1. 先请求网络
2. 成功 → 更新缓存 → 返回
3. 失败 → 使用缓存

### 策略3：Stale While Revalidate（缓存同时更新）

**适用场景**：需要快速响应且能接受稍旧数据

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // 立即返回缓存
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // 后台更新缓存
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        
        // 返回缓存（如果有）或网络响应
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

**流程**：
1. 立即返回缓存（如果有）
2. 同时发起网络请求
3. 网络响应后更新缓存

### 策略4：Network Only（仅网络）

**适用场景**：必须实时的数据

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

### 策略5：Cache Only（仅缓存）

**适用场景**：离线优先应用

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

### 完整的路由策略示例

```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 根据不同的请求类型使用不同策略
  if (url.pathname.startsWith('/api/')) {
    // API 请求：网络优先
    event.respondWith(networkFirst(request));
  } else if (request.destination === 'image') {
    // 图片：缓存优先
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.endsWith('.html')) {
    // HTML：Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // 其他：缓存优先
    event.respondWith(cacheFirst(request));
  }
});

// 缓存优先实现
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// 网络优先实现
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate 实现
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });
  
  return cached || fetchPromise;
}
```

---

## 3️⃣ Web App Manifest（应用清单）

### 什么是 Manifest？

Manifest 是一个 JSON 文件，告诉浏览器如何将 Web 应用安装到设备上。

```json
{
  "name": "我的 PWA 应用",
  "short_name": "PWA App",
  "description": "一个完整的 PWA 示例应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ]
}
```

### Manifest 属性详解

| 属性 | 说明 | 示例 |
|------|------|------|
| `name` | 应用全名 | "我的 PWA 应用" |
| `short_name` | 短名称（主屏幕显示） | "PWA" |
| `start_url` | 启动 URL | "/" |
| `display` | 显示模式 | "standalone" |
| `background_color` | 启动画面背景色 | "#ffffff" |
| `theme_color` | 主题色（地址栏） | "#2196F3" |
| `icons` | 应用图标 | 不同尺寸的图标数组 |
| `orientation` | 屏幕方向 | "portrait" |

### display 属性选项

```javascript
/**
 * display 属性控制应用的显示模式
 */

// fullscreen: 全屏模式（隐藏浏览器UI）
"display": "fullscreen"

// standalone: 独立应用模式（推荐）
// 看起来像原生应用，没有浏览器UI
"display": "standalone"

// minimal-ui: 最小UI模式
// 保留一些浏览器UI（后退按钮等）
"display": "minimal-ui"

// browser: 浏览器模式（默认）
// 普通浏览器标签页
"display": "browser"
```

### 在 HTML 中引用

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- iOS Safari -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="PWA App">
  <link rel="apple-touch-icon" href="/icons/icon-152x152.png">
  
  <!-- Windows -->
  <meta name="msapplication-TileImage" content="/icons/icon-144x144.png">
  <meta name="msapplication-TileColor" content="#2196F3">
  
  <title>我的 PWA 应用</title>
</head>
<body>
  <!-- 应用内容 -->
</body>
</html>
```

---

## 4️⃣ 推送通知（Push Notifications）

### 推送通知原理

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│   服务器  │  推送   │  浏览器推送   │  唤醒   │   Service    │
│          ├────────→│   服务商      ├────────→│   Worker     │
└──────────┘         └──────────────┘         └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │  显示通知   │
                                               └─────────────┘
```

### 实现推送通知

```javascript
// ============================================
// 1. 请求通知权限
// ============================================
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('✅ 通知权限已授予');
    return true;
  } else if (permission === 'denied') {
    console.log('❌ 通知权限被拒绝');
    return false;
  } else {
    console.log('⏸️ 通知权限待定');
    return false;
  }
}

// ============================================
// 2. 订阅推送
// ============================================
async function subscribeToPush() {
  // 获取 Service Worker 注册对象
  const registration = await navigator.serviceWorker.ready;
  
  // 订阅推送
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true, // 必须显示通知给用户
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
  });
  
  console.log('✅ 推送订阅成功:', JSON.stringify(subscription));
  
  // 将订阅信息发送给服务器
  await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
  
  return subscription;
}

// VAPID 公钥转换
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============================================
// 3. Service Worker 接收推送
// ============================================
// 在 service-worker.js 中
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 收到推送:', event);
  
  let data = { title: '新消息', body: '您有一条新消息' };
  
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icons/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================
// 4. 处理通知点击
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 通知被点击:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // 打开特定页面
    event.waitUntil(
      clients.openWindow('https://yoursite.com/page')
    );
  } else if (event.action === 'close') {
    // 关闭通知（已经执行）
  } else {
    // 默认行为：打开应用
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 如果已经有打开的窗口，聚焦它
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// ============================================
// 5. 显示本地通知（不需要服务器推送）
// ============================================
async function showLocalNotification() {
  const registration = await navigator.serviceWorker.ready;
  
  registration.showNotification('本地通知', {
    body: '这是一个本地生成的通知',
    icon: '/icons/icon-192x192.png',
    tag: 'local-notification',
    requireInteraction: false // true: 用户必须手动关闭
  });
}
```

### 服务器端推送（Node.js 示例）

```javascript
// 使用 web-push 库
const webPush = require('web-push');

// 设置 VAPID 密钥
const vapidKeys = {
  publicKey: 'YOUR_PUBLIC_KEY',
  privateKey: 'YOUR_PRIVATE_KEY'
};

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 发送推送
const subscription = {
  endpoint: '...',
  keys: {
    auth: '...',
    p256dh: '...'
  }
};

const payload = JSON.stringify({
  title: '新消息',
  body: '您有一条新消息',
  icon: '/icons/icon-192x192.png',
  url: '/messages'
});

webPush.sendNotification(subscription, payload)
  .then(response => console.log('✅ 推送成功'))
  .catch(error => console.error('❌ 推送失败:', error));
```

---

## 5️⃣ 后台同步（Background Sync）

### 原理

后台同步允许在网络恢复时自动重试失败的请求。

```javascript
// ============================================
// 1. 主页面：注册后台同步
// ============================================
async function sendMessage(message) {
  try {
    // 尝试立即发送
    await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(message)
    });
    console.log('✅ 消息发送成功');
  } catch (error) {
    // 失败时注册后台同步
    console.log('❌ 发送失败，注册后台同步');
    
    // 保存到 IndexedDB
    await saveToIndexedDB(message);
    
    // 注册同步
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-messages');
  }
}

// ============================================
// 2. Service Worker：处理同步事件
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] 后台同步触发:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // 从 IndexedDB 获取待发送消息
  const messages = await getMessagesFromIndexedDB();
  
  // 尝试发送所有消息
  const promises = messages.map(async (message) => {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message)
      });
      // 成功后从 IndexedDB 删除
      await deleteFromIndexedDB(message.id);
      console.log('✅ 消息同步成功:', message.id);
    } catch (error) {
      console.log('❌ 消息同步失败:', message.id);
      throw error; // 重新抛出，触发重试
    }
  });
  
  return Promise.all(promises);
}
```

---

## 6️⃣ 完整的 PWA 实战示例

### 项目结构

```
my-pwa/
├── index.html
├── app.js
├── styles.css
├── manifest.json
├── service-worker.js
├── offline.html
└── icons/
    ├── icon-72x72.png
    ├── icon-192x192.png
    └── icon-512x512.png
```

### index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="一个完整的 PWA 示例">
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- 主题色 -->
  <meta name="theme-color" content="#2196F3">
  
  <!-- iOS -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  
  <title>My PWA App</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="app">
    <header>
      <h1>PWA 示例应用</h1>
      <button id="install-btn" hidden>安装应用</button>
    </header>
    
    <main>
      <section>
        <h2>在线状态</h2>
        <p id="online-status">检查中...</p>
      </section>
      
      <section>
        <h2>推送通知</h2>
        <button id="enable-notifications">启用通知</button>
      </section>
      
      <section>
        <h2>发送消息</h2>
        <input type="text" id="message-input" placeholder="输入消息">
        <button id="send-message">发送</button>
      </section>
    </main>
  </div>
  
  <script src="/app.js"></script>
</body>
</html>
```

### app.js

```javascript
// ============================================
// 注册 Service Worker
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker 注册成功');
      })
      .catch((error) => {
        console.error('❌ Service Worker 注册失败:', error);
      });
  });
}

// ============================================
// 安装提示
// ============================================
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止自动弹出
  e.preventDefault();
  // 保存事件
  deferredPrompt = e;
  // 显示安装按钮
  installBtn.hidden = false;
  
  console.log('💡 可以安装 PWA');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  // 显示安装提示
  deferredPrompt.prompt();
  
  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`用户选择: ${outcome}`);
  
  // 清除保存的事件
  deferredPrompt = null;
  installBtn.hidden = true;
});

// 安装完成
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA 已安装');
  deferredPrompt = null;
});

// ============================================
// 在线状态检测
// ============================================
const statusEl = document.getElementById('online-status');

function updateOnlineStatus() {
  statusEl.textContent = navigator.onLine ? '🟢 在线' : '🔴 离线';
  statusEl.style.color = navigator.onLine ? 'green' : 'red';
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ============================================
// 推送通知
// ============================================
document.getElementById('enable-notifications').addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('浏览器不支持通知');
    return;
  }
  
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('✅ 通知权限已授予');
    
    // 显示测试通知
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('欢迎！', {
      body: '您已成功启用通知',
      icon: '/icons/icon-192x192.png'
    });
  }
});

// ============================================
// 发送消息（支持离线）
// ============================================
document.getElementById('send-message').addEventListener('click', async () => {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, timestamp: Date.now() })
    });
    
    console.log('✅ 消息发送成功');
    input.value = '';
  } catch (error) {
    console.log('❌ 发送失败，将在网络恢复时重试');
    
    // 注册后台同步
    if ('sync' in navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-messages');
    }
  }
});
```

---

## 7️⃣ PWA 调试工具

### Chrome DevTools

```
1. Application 面板
   ├── Manifest: 查看 manifest.json
   ├── Service Workers: 管理 Service Worker
   │   ├── Update: 更新
   │   ├── Unregister: 注销
   │   └── Bypass for network: 跳过缓存
   ├── Cache Storage: 查看缓存
   ├── IndexedDB: 查看数据库
   └── Background Services: 后台服务

2. Network 面板
   └── Disable cache: 禁用缓存测试

3. Lighthouse 面板
   └── PWA 审计: 检查 PWA 合规性
```

### 常用调试命令

```javascript
// 查看当前 Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg);
});

// 强制更新 Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});

// 注销 Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
  reg.unregister();
});

// 查看缓存
caches.keys().then(keys => {
  console.log('缓存列表:', keys);
});

// 清除所有缓存
caches.keys().then(keys => {
  return Promise.all(keys.map(key => caches.delete(key)));
});
```

---

## 8️⃣ PWA 最佳实践

### ✅ 应该做的

1. **HTTPS 必需**
   - PWA 必须通过 HTTPS 访问（localhost 除外）

2. **离线体验**
   - 至少提供基本的离线页面
   - 缓存核心资源

3. **响应式设计**
   - 适配各种屏幕尺寸

4. **快速加载**
   - 首屏加载时间 < 3秒
   - 使用骨架屏

5. **渐进增强**
   - 在不支持的浏览器上仍能基本使用

6. **更新策略**
   - 提示用户有新版本
   - 允许用户选择何时更新

### ❌ 不应该做的

1. **不要阻塞主线程**
   - Service Worker 在后台线程运行
   - 不要在主线程做重计算

2. **不要过度缓存**
   - 只缓存必要资源
   - 定期清理旧缓存

3. **不要忽略错误处理**
   - 网络请求可能失败
   - 提供友好的错误提示

4. **不要滥用通知**
   - 只在必要时推送
   - 提供关闭选项

---

## 9️⃣ PWA vs 原生应用 vs 传统 Web

| 特性 | PWA | 原生应用 | 传统 Web |
|------|-----|---------|---------|
| **安装** | ✅ 轻量级安装 | ❌ 需要应用商店 | ❌ 无法安装 |
| **更新** | ✅ 自动更新 | ❌ 手动更新 | ✅ 自动更新 |
| **离线** | ✅ 可离线使用 | ✅ 可离线使用 | ❌ 需要网络 |
| **推送** | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| **性能** | 🔶 良好 | ✅ 最佳 | 🔶 一般 |
| **开发成本** | ✅ 低（一次开发） | ❌ 高（多平台） | ✅ 低 |
| **分发** | ✅ URL 直接访问 | ❌ 应用商店审核 | ✅ URL 访问 |
| **硬件访问** | 🔶 部分支持 | ✅ 完全支持 | 🔶 部分支持 |

---

## 🔟 浏览器支持情况

| 特性 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Cache API | ✅ | ✅ | ✅ | ✅ |
| Push API | ✅ | ✅ | ⚠️ 16.4+ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Web App Manifest | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ❌ | ⚠️ 有限 | ✅ |

---

## 📚 总结

### PWA 核心原理

```
1️⃣ Service Worker（核心）
   └── 拦截请求 + 缓存管理 + 离线支持

2️⃣ Cache API
   └── 存储静态资源和 API 响应

3️⃣ Web App Manifest
   └── 定义应用外观和行为

4️⃣ Push Notifications
   └── 推送消息和通知

5️⃣ Background Sync
   └── 后台同步数据

6️⃣ HTTPS
   └── 安全要求
```

### 实现 PWA 的步骤

1. ✅ 创建 `manifest.json`
2. ✅ 编写 `service-worker.js`
3. ✅ 注册 Service Worker
4. ✅ 实现缓存策略
5. ✅ 添加离线页面
6. ✅ 测试和优化
7. ✅ 部署到 HTTPS

PWA 是 Web 应用的未来！🚀

