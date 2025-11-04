# Push Cache（HTTP/2 推送缓存）详解

## 🎯 什么是 Push Cache？

Push Cache 是 **HTTP/2** 引入的一种特殊缓存机制，允许服务器**主动推送**资源到客户端，而不是等待客户端请求。

### 在缓存体系中的位置

```
浏览器缓存查找顺序：

1️⃣ Service Worker Cache（最高优先级）
     ↓ 未命中
2️⃣ Memory Cache（内存缓存）
     ↓ 未命中
3️⃣ Disk Cache（磁盘缓存 - 强缓存）
     ↓ 未命中或已过期
4️⃣ Push Cache（HTTP/2 推送缓存）← 🆕 在这里
     ↓ 未命中
5️⃣ 网络请求（可能触发协商缓存）
```

---

## 🚀 工作原理

### 传统 HTTP/1.1 vs HTTP/2 Server Push

```javascript
/**
 * HTTP/1.1 传统方式
 */
const http1Flow = {
  timeline: {
    '0ms': '客户端: 请求 index.html',
    '100ms': '服务器: 返回 index.html',
    '100ms': '客户端: 解析 HTML，发现 <link href="style.css">',
    '100ms': '客户端: 请求 style.css',
    '200ms': '服务器: 返回 style.css',
    '200ms': '客户端: 解析 HTML，发现 <script src="app.js">',
    '200ms': '客户端: 请求 app.js',
    '300ms': '服务器: 返回 app.js'
  },
  
  totalTime: '300ms',
  networkRoundTrips: 3,  // 3 个 RTT（往返时间）
  problem: '串行加载，慢！'
};

/**
 * HTTP/2 Server Push
 */
const http2PushFlow = {
  timeline: {
    '0ms': '客户端: 请求 index.html',
    '10ms': '服务器: 开始返回 index.html',
    '10ms': '服务器: 同时推送 style.css（PUSH_PROMISE）',
    '15ms': '服务器: 同时推送 app.js（PUSH_PROMISE）',
    '100ms': '客户端: 收到 index.html',
    '110ms': '客户端: 收到 style.css → 存入 Push Cache',
    '120ms': '客户端: 收到 app.js → 存入 Push Cache',
    '120ms': '客户端: 解析 HTML，需要 style.css',
    '120ms': '客户端: 从 Push Cache 读取（瞬间！）',
    '120ms': '客户端: 解析 HTML，需要 app.js',
    '120ms': '客户端: 从 Push Cache 读取（瞬间！）'
  },
  
  totalTime: '120ms',
  networkRoundTrips: 1,  // 只有 1 个 RTT
  benefit: '快了 2.5 倍！减少了 2 个往返'
};
```

### 图解

```
传统方式（HTTP/1.1）:
───────────────────────────────────────────────
时间  0        100       200       300ms
───────────────────────────────────────────────
请求  HTML──┐
响应        └──HTML
请求           CSS──┐
响应                └──CSS
请求                    JS──┐
响应                        └──JS
完成                           ●
───────────────────────────────────────────────


HTTP/2 Server Push:
───────────────────────────────────────────────
时间  0        100       120ms
───────────────────────────────────────────────
请求  HTML──┐
推送  ├─CSS─┐(主动推送，无需等待)
推送  ├─JS──┐(主动推送，无需等待)
响应  └──┴──┴─ 全部到达 → Push Cache
使用         从 Push Cache 读取 CSS & JS
完成                        ●
───────────────────────────────────────────────
```

---

## 🔍 Push Cache 的特性

### 1. 一次性使用（用完即删）

```javascript
/**
 * Push Cache 的资源只能使用一次
 */

// 服务器推送 app.js
server.push('/app.js', response);

// Push Cache 状态
const pushCacheState = {
  after_push: {
    content: ['/app.js'],
    note: '资源已存入 Push Cache'
  },
  
  first_request: {
    action: '浏览器请求 /app.js',
    result: '✅ 从 Push Cache 读取',
    cacheAfter: '[] ← app.js 被删除'
  },
  
  second_request: {
    action: '再次请求 /app.js',
    result: '❌ Push Cache 已空',
    fallback: '检查 Memory Cache → Disk Cache → 网络'
  }
};

// 示意
push('/app.js')  → Push Cache: [app.js]
request app.js   → 读取 + 删除 → Push Cache: []
request app.js   → 未命中 → 从其他缓存或网络获取
```

### 2. 非常短暂的生命周期

```javascript
const pushCacheLifetime = {
  // 创建时机
  creation: 'HTTP/2 连接建立，服务器推送资源时',
  
  // 失效条件（任一条件满足即失效）
  expiration: {
    condition1: {
      name: '资源被使用',
      action: '读取后立即删除',
      duration: '瞬间'
    },
    
    condition2: {
      name: '超时未使用',
      duration: '约 5 分钟（Chrome）',
      note: '不同浏览器可能不同'
    },
    
    condition3: {
      name: 'HTTP/2 连接关闭',
      action: 'Push Cache 全部清空',
      trigger: ['关闭标签页', '刷新页面', '连接超时']
    },
    
    condition4: {
      name: 'Session 结束',
      action: 'Push Cache 清空',
      scope: '会话级缓存'
    }
  },
  
  // 示例
  example: `
    10:00:00 - 服务器推送 app.js → Push Cache
    10:00:01 - 浏览器使用 app.js → Push Cache 清空
    
    或
    
    10:00:00 - 服务器推送 app.js → Push Cache
    10:05:00 - 5分钟后自动过期 → Push Cache 清空
    
    或
    
    10:00:00 - 服务器推送 app.js → Push Cache
    10:00:10 - 用户刷新页面 → Push Cache 清空
  `
};
```

### 3. 严格匹配

```javascript
/**
 * Push Cache 严格匹配 URL
 */

// 服务器推送
server.push('https://example.com/app.js?v=1.0');

// 匹配情况
const matchingCases = {
  // ✅ 完全匹配
  case1: {
    request: 'https://example.com/app.js?v=1.0',
    result: '命中 Push Cache',
    hit: true
  },
  
  // ❌ 查询参数不同
  case2: {
    request: 'https://example.com/app.js?v=2.0',
    result: '未命中 Push Cache',
    hit: false,
    reason: '查询参数不一致'
  },
  
  // ❌ 缺少查询参数
  case3: {
    request: 'https://example.com/app.js',
    result: '未命中 Push Cache',
    hit: false,
    reason: '缺少 ?v=1.0'
  },
  
  // ❌ 协议不同
  case4: {
    request: 'http://example.com/app.js?v=1.0',
    result: '未命中 Push Cache',
    hit: false,
    reason: 'http vs https'
  }
};

// 结论：必须完全一致！
```

### 4. 可以被浏览器拒绝

```javascript
/**
 * 浏览器何时会拒绝 Server Push
 */
const rejectionReasons = {
  reason1: {
    condition: 'Push Cache 已满',
    action: '发送 RST_STREAM 帧拒绝',
    note: 'Push Cache 空间有限（< 10MB）'
  },
  
  reason2: {
    condition: '已有更新的缓存',
    example: '浏览器 Disk Cache 中已有 app.js v2.0',
    push: '服务器推送 app.js v1.0',
    action: '拒绝推送（避免浪费）'
  },
  
  reason3: {
    condition: '资源太大',
    limit: '某些浏览器限制单个推送资源大小',
    typical: '> 1MB 的资源可能被拒绝'
  },
  
  reason4: {
    condition: '用户禁用 Server Push',
    setting: 'chrome://flags/#enable-http2-server-push',
    action: '拒绝所有推送'
  }
};
```

---

## 🖥️ 服务器端实现

### Node.js (原生 HTTP/2)

```javascript
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
});

server.on('stream', (stream, headers) => {
  const path = headers[':path'];
  
  if (path === '/' || path === '/index.html') {
    console.log('📄 收到 HTML 请求，准备推送资源...');
    
    // 推送 CSS
    stream.pushStream({ ':path': '/critical.css' }, (err, pushStream) => {
      if (err) {
        console.error('❌ CSS 推送失败:', err);
        return;
      }
      
      pushStream.respond({
        ':status': 200,
        'content-type': 'text/css',
        'cache-control': 'max-age=3600'
      });
      
      const css = fs.readFileSync('./public/critical.css');
      pushStream.end(css);
      console.log('✅ 推送 critical.css');
    });
    
    // 推送 JS
    stream.pushStream({ ':path': '/app.js' }, (err, pushStream) => {
      if (err) {
        console.error('❌ JS 推送失败:', err);
        return;
      }
      
      pushStream.respond({
        ':status': 200,
        'content-type': 'application/javascript',
        'cache-control': 'max-age=3600'
      });
      
      const js = fs.readFileSync('./public/app.js');
      pushStream.end(js);
      console.log('✅ 推送 app.js');
    });
    
    // 返回 HTML
    stream.respond({
      ':status': 200,
      'content-type': 'text/html'
    });
    stream.end(fs.readFileSync('./public/index.html'));
    console.log('✅ 返回 index.html');
  }
});

server.listen(3000, () => {
  console.log('🚀 HTTP/2 服务器运行在 https://localhost:3000');
});
```

### Express + HTTP/2

```javascript
const express = require('express');
const spdy = require('spdy');
const fs = require('fs');
const path = require('path');

const app = express();

// 智能推送中间件
function serverPushMiddleware(req, res, next) {
  // 只对 HTML 页面推送
  if (req.path === '/' && res.push) {
    const isFirstVisit = !req.cookies.visited;
    
    if (isFirstVisit) {
      console.log('👤 首次访问，推送关键资源');
      
      // 推送关键 CSS
      const pushCSS = res.push('/critical.css', {
        status: 200,
        method: 'GET',
        request: { accept: 'text/css' },
        response: { 
          'content-type': 'text/css',
          'cache-control': 'max-age=31536000'
        }
      });
      
      if (pushCSS) {
        pushCSS.on('error', err => console.error('CSS 推送错误:', err));
        pushCSS.end(fs.readFileSync('./public/critical.css'));
      }
      
      // 推送 JS
      const pushJS = res.push('/app.js', {
        status: 200,
        method: 'GET',
        request: { accept: 'application/javascript' },
        response: { 
          'content-type': 'application/javascript',
          'cache-control': 'max-age=31536000'
        }
      });
      
      if (pushJS) {
        pushJS.on('error', err => console.error('JS 推送错误:', err));
        pushJS.end(fs.readFileSync('./public/app.js'));
      }
      
      // 设置 Cookie 标记
      res.cookie('visited', '1', { maxAge: 86400000 }); // 24小时
    } else {
      console.log('🔄 再次访问，跳过推送（用户可能已有缓存）');
    }
  }
  
  next();
}

app.use(serverPushMiddleware);
app.use(express.static('public'));

// 启动 HTTP/2 服务器
const options = {
  key: fs.readFileSync('./server-key.pem'),
  cert: fs.readFileSync('./server-cert.pem'),
  spdy: {
    protocols: ['h2', 'http/1.1']
  }
};

spdy.createServer(options, app).listen(3000, () => {
  console.log('🚀 HTTP/2 服务器启动成功');
});
```

### Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 启用 HTTP/2
    http2_max_field_size 16k;
    http2_max_header_size 32k;
    
    location = /index.html {
        # 配置 Server Push
        http2_push /critical.css;
        http2_push /app.js;
        http2_push /logo.svg;
        
        # 不要推送太多
        # http2_push /large-image.jpg;  ❌ 太大
        # http2_push /analytics.js;     ❌ 非关键
        
        root /var/www/html;
    }
    
    location / {
        root /var/www/html;
        index index.html;
    }
}
```

---

## 🔍 Push Cache 的特殊性质

### 1. 会话级缓存

```javascript
/**
 * Push Cache 是会话级的
 */
const sessionLevel = {
  scope: '仅在当前 HTTP/2 连接（Session）内有效',
  
  scenario1: {
    action: '用户访问页面 → 建立连接 → 推送资源',
    cache: 'Push Cache: [css, js, logo]',
    usage: '使用资源 → Push Cache: []'
  },
  
  scenario2: {
    action: '用户刷新页面（F5）',
    connection: '新的 HTTP/2 连接',
    cache: 'Push Cache: [] ← 之前的 Push Cache 已失效',
    result: '需要重新推送'
  },
  
  scenario3: {
    action: '用户在同一标签页内点击链接',
    connection: '可能复用同一连接',
    cache: 'Push Cache 可能仍有效（取决于连接是否保持）'
  }
};
```

### 2. 不能通过代码访问

```javascript
/**
 * Push Cache 对开发者不可见
 */
const accessibility = {
  canAccess: false,
  
  comparison: {
    serviceWorker: {
      api: 'caches.open() / caches.match()',
      control: '✅ 完全控制'
    },
    
    httpCache: {
      api: 'Cache-Control 响应头',
      control: '⚠️ 部分控制'
    },
    
    pushCache: {
      api: '❌ 无 API',
      control: '❌ 无法直接访问',
      visibility: '只能通过 DevTools 观察',
      note: '完全由浏览器自动管理'
    }
  }
};
```

### 3. 大小限制

```javascript
const sizeLimit = {
  typical: '< 10 MB',
  perResource: '建议 < 200 KB',
  recommendation: '只推送小的关键资源',
  
  example: {
    good: [
      'critical.css (20 KB)',
      'above-fold.js (50 KB)',
      'logo.svg (5 KB)'
    ],
    bad: [
      'bundle.js (2 MB)',        // ❌ 太大
      'hero-image.jpg (500 KB)', // ❌ 太大
      'video.mp4 (10 MB)'        // ❌ 太大
    ]
  }
};
```

---

## 🎯 最佳实践

### 1. 什么应该推送？

```javascript
const pushDecision = {
  // ✅ 应该推送
  shouldPush: {
    criticalCSS: {
      file: 'critical.css',
      size: '< 50 KB',
      reason: '首屏渲染必需，且用户可能没有缓存'
    },
    
    aboveFoldJS: {
      file: 'above-fold.js',
      size: '< 100 KB',
      reason: '首屏交互必需'
    },
    
    logo: {
      file: 'logo.svg',
      size: '< 20 KB',
      reason: '首屏必需的小图片'
    }
  },
  
  // ❌ 不应该推送
  shouldNotPush: {
    largeFiles: {
      files: ['bundle.js (> 500KB)', 'images/hero.jpg'],
      reason: '太大，可能浪费带宽'
    },
    
    nonCritical: {
      files: ['analytics.js', 'chatWidget.js'],
      reason: '非首屏必需，可以延迟加载'
    },
    
    cached: {
      files: ['jquery.min.js', 'bootstrap.css'],
      reason: '用户可能已有缓存（来自 CDN）'
    },
    
    conditional: {
      files: ['admin-panel.js'],
      reason: '只有部分用户需要'
    }
  }
};
```

### 2. 智能推送策略

```javascript
/**
 * 根据条件决定是否推送
 */
app.get('/', (req, res) => {
  if (!res.push) {
    // 不支持 HTTP/2，正常返回
    return res.sendFile('index.html');
  }
  
  // 检查各种条件
  const shouldPush = 
    !req.cookies.visited &&           // 首次访问
    !req.headers['save-data'] &&      // 非省流量模式
    !isSlowConnection(req) &&          // 网络较好
    !isMobileDevice(req);              // 非移动设备
  
  if (shouldPush) {
    console.log('✅ 满足推送条件，推送资源');
    pushCriticalResources(res);
  } else {
    console.log('⏭️ 跳过推送');
  }
  
  res.sendFile('index.html');
});

function isSlowConnection(req) {
  // 检查连接速度（通过 Client Hints）
  const rtt = req.headers['rtt'];
  const downlink = req.headers['downlink'];
  
  return rtt > 300 || downlink < 1; // RTT > 300ms 或 带宽 < 1Mbps
}

function pushCriticalResources(res) {
  // 只推送 < 50KB 的关键资源
  const resources = [
    { path: '/critical.css', size: 30000 },
    { path: '/app.js', size: 45000 },
    { path: '/logo.svg', size: 5000 }
  ];
  
  resources.forEach(resource => {
    if (resource.size < 50000) {
      const stream = res.push(resource.path, {/*...*/});
      stream.end(fs.readFileSync('./public' + resource.path));
    }
  });
}
```

### 3. 避免重复推送

```javascript
/**
 * Link 预加载头 + 条件推送
 */
app.get('/', (req, res) => {
  // 方式1：使用 Link 预加载头（让浏览器决定）
  res.setHeader('Link', [
    '</critical.css>; rel=preload; as=style',
    '</app.js>; rel=preload; as=script'
  ].join(', '));
  
  // 方式2：智能推送
  if (shouldPushResources(req)) {
    // 只在必要时推送
    pushResources(res);
  }
  
  res.sendFile('index.html');
});

function shouldPushResources(req) {
  // 检查 Cookie，避免重复推送给同一用户
  const lastPush = req.cookies.lastPush;
  
  if (lastPush) {
    const timeSinceLastPush = Date.now() - parseInt(lastPush);
    
    // 24小时内推送过，跳过（用户可能有缓存）
    if (timeSinceLastPush < 86400000) {
      return false;
    }
  }
  
  return true;
}
```

---

## 🧪 浏览器端检测

### Chrome DevTools 查看

```
1. 打开 Chrome DevTools
2. Network 标签
3. 启用以下列：
   - Protocol（显示 h2）
   - Initiator（显示 Push / index.html）
   - Size（显示 (push)）

4. 观察：
   Protocol  | Name         | Initiator       | Size
   h2        | index.html   | (index)         | 15.2 KB
   h2        | critical.css | Push /          | (push)
   h2        | app.js       | Push /          | (push)
            ↑              ↑               ↑
          HTTP/2      Server Push      从 Push Cache
```

### Performance API 检测

```javascript
/**
 * 检测哪些资源来自 Server Push
 */
window.addEventListener('load', () => {
  const resources = performance.getEntriesByType('resource');
  
  const pushedResources = resources.filter(resource => {
    // HTTP/2 推送资源的特征
    return (
      resource.nextHopProtocol === 'h2' &&  // HTTP/2
      resource.requestStart === 0 &&         // 没有请求阶段
      resource.responseStart > 0             // 但有响应
    );
  });
  
  if (pushedResources.length > 0) {
    console.log('🚀 以下资源通过 Server Push 获取:');
    pushedResources.forEach(r => {
      console.log({
        name: r.name,
        size: (r.transferSize / 1024).toFixed(2) + ' KB',
        duration: r.duration.toFixed(2) + ' ms',
        protocol: r.nextHopProtocol
      });
    });
  } else {
    console.log('ℹ️ 没有使用 Server Push 或不支持 HTTP/2');
  }
});
```

---

## ⚠️ Push Cache 的问题和限制

### 问题1：可能浪费带宽

```javascript
/**
 * 过度推送的问题
 */
const overPushIssue = {
  scenario: '服务器推送了 app.js (200KB)',
  
  problem1: {
    situation: '用户的 Disk Cache 中已有 app.js',
    result: '推送的资源被浪费（用户使用缓存版本）',
    waste: '200KB 带宽白费'
  },
  
  problem2: {
    situation: '用户只看首页，不需要 app.js',
    result: '推送的资源从未使用，5分钟后过期',
    waste: '200KB 带宽白费'
  },
  
  problem3: {
    situation: '推送了 10 个资源，用户只用了 3 个',
    result: '70% 的推送被浪费',
    waste: '大量带宽浪费'
  }
};
```

### 问题2：无法检测客户端缓存

```javascript
/**
 * 服务器盲推的问题
 */
const blindPush = {
  limitation: '服务器无法知道客户端是否已有缓存',
  
  scenario: {
    server: '推送 jquery.min.js',
    client: '已有 jQuery 的强缓存（来自 CDN）',
    result: '推送被浪费，客户端使用自己的缓存'
  },
  
  solution: {
    method1: '使用 Cookie 记录用户访问历史',
    method2: '只推送自己网站的关键资源',
    method3: '不推送第三方库（用户可能已缓存）'
  }
};
```

### 问题3：浏览器支持差异

```javascript
const browserSupport = {
  chrome: {
    support: '✅ 完全支持',
    version: 'Chrome 41+',
    pushCache: '✅ 有 Push Cache'
  },
  
  firefox: {
    support: '✅ 支持',
    version: 'Firefox 36+',
    pushCache: '✅ 有 Push Cache'
  },
  
  safari: {
    support: '⚠️ 部分支持',
    version: 'Safari 15+',
    note: '较晚支持，实现可能不完整'
  },
  
  edge: {
    support: '✅ 支持',
    version: 'Edge 79+（Chromium 内核）'
  }
};
```

---

## 💡 Push Cache vs 其他缓存

### 与 HTTP 缓存的关系

```javascript
/**
 * Push Cache 和其他缓存可以共存
 */
const coexistence = {
  example: '推送 app.js 并设置强缓存',
  
  serverPush: {
    action: 'Server Push app.js',
    storage: 'Push Cache（临时，会话级）',
    duration: '5分钟或使用后删除'
  },
  
  httpCache: {
    header: 'Cache-Control: max-age=31536000',
    storage: 'Disk Cache（长期）',
    duration: '1年'
  },
  
  flow: `
    首次访问:
      1. Server Push → Push Cache
      2. 使用 app.js → 从 Push Cache 读取
      3. 同时保存到 Disk Cache（因为有 Cache-Control）
      4. Push Cache 清空
    
    第二次访问:
      1. 检查 Push Cache → 空
      2. 检查 Disk Cache → 命中！
      3. 使用 Disk Cache（无需推送）
  `,
  
  conclusion: '第一次用 Push Cache，之后用 HTTP Cache'
};
```

### 与 Service Worker 的关系

```javascript
/**
 * Service Worker 优先级更高
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)  // 先检查 Service Worker 缓存
      .then(cached => {
        if (cached) {
          // ✅ Service Worker 命中，不会检查 Push Cache
          return cached;
        }
        
        // 未命中，继续检查 Memory → Disk → Push → Network
        return fetch(event.request);
      })
  );
});

/**
 * 流程：
 * 
 * 有 Service Worker:
 *   Service Worker → (命中) → 返回
 *                 → (未命中) → Memory → Disk → Push → Network
 * 
 * 无 Service Worker:
 *   Memory → Disk → Push → Network
 */
```

---

## 📊 性能对比

### 实际性能提升

```javascript
/**
 * 实测数据（3G 网络环境）
 */
const performanceComparison = {
  // HTTP/1.1（无推送）
  http1: {
    htmlDownload: '100ms',
    cssRequest: '+ 50ms',
    cssDownload: '+ 100ms',
    jsRequest: '+ 50ms',
    jsDownload: '+ 100ms',
    total: '400ms'
  },
  
  // HTTP/2（有推送）
  http2Push: {
    htmlDownload: '100ms',
    pushCSS: '+ 0ms（并行）',
    pushJS: '+ 0ms（并行）',
    fromPushCache: '+ 0ms（瞬间）',
    total: '100ms（快 4 倍！）'
  },
  
  // 节省的时间
  saved: '300ms',
  improvement: '75%'
};
```

---

## 🔧 调试和验证

### 验证 Server Push 是否生效

```bash
# 使用 curl 测试（需要支持 HTTP/2）
curl -I --http2 https://example.com

# 查看响应头
# HTTP/2 200
# link: </critical.css>; rel=preload; as=style
# 
# 如果看到 link 头，说明服务器支持推送提示
```

```javascript
// 浏览器控制台检测
(function checkHTTP2Push() {
  // 检查协议
  const protocol = window.performance
    .getEntriesByType('navigation')[0]
    .nextHopProtocol;
  
  console.log('当前协议:', protocol);
  
  if (protocol === 'h2' || protocol === 'h3') {
    console.log('✅ 支持 HTTP/2');
    
    // 检查是否有推送资源
    const resources = performance.getEntriesByType('resource');
    const pushed = resources.filter(r => 
      r.nextHopProtocol === 'h2' && r.requestStart === 0
    );
    
    if (pushed.length > 0) {
      console.log('✅ 检测到 Server Push:');
      pushed.forEach(r => console.log('  -', r.name));
    } else {
      console.log('ℹ️ 未检测到 Server Push');
    }
  } else {
    console.log('❌ 使用 HTTP/1.1，不支持 Server Push');
  }
})();
```

---

## 📚 总结

### Push Cache 核心特点

| 特性 | 说明 |
|------|------|
| **优先级** | 第4位（Service Worker → Memory → Disk → **Push** → Network） |
| **生命周期** | 很短（5分钟或连接关闭） |
| **使用次数** | 一次性（用完即删） |
| **大小** | 很小（< 10MB） |
| **配额** | ❌ 不计入 Storage API 配额 |
| **管理** | 浏览器自动，开发者不可访问 |
| **协议** | 仅 HTTP/2 或 HTTP/3 |

### 与其他缓存的关系

```
┌─────────────────────────────────────┐
│   Storage API 配额（约 10-20GB）    │
│   ├─ Service Worker Cache   ✅      │
│   ├─ IndexedDB              ✅      │
│   └─ LocalStorage           ✅      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   浏览器自动管理（不计入配额）       │
│   ├─ Memory Cache           ❌      │
│   ├─ Disk Cache（强缓存）   ❌      │
│   ├─ 协商缓存               ❌      │
│   └─ Push Cache             ❌      │ ← 在这里
└─────────────────────────────────────┘
```

### 使用建议

1. ✅ **只推送首屏关键资源**（< 50KB）
2. ✅ **智能判断**是否需要推送
3. ✅ **配合 HTTP 缓存**（推送的资源也设置缓存头）
4. ❌ **不要过度推送**（浪费带宽）
5. ❌ **不要推送大文件**（> 200KB）
6. ❌ **不要推送非关键资源**

### 最佳实践

```nginx
# Nginx 最佳配置
location = /index.html {
    # 只推送首屏必需的小资源
    http2_push /critical.css;      # ✅ 20KB
    http2_push /above-fold.js;     # ✅ 45KB
    http2_push /logo.svg;          # ✅ 5KB
    
    # 不推送这些
    # http2_push /bundle.js;       # ❌ 500KB 太大
    # http2_push /jquery.min.js;   # ❌ CDN，用户可能已缓存
}
```

**Push Cache 是 HTTP/2 性能优化的利器，但要合理使用！** 🚀

