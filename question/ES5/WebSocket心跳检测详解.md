# WebSocket 心跳检测与断线重连

## 🚨 WebSocket 为什么会掉线？

### 常见掉线原因

```javascript
const disconnectReasons = {
  // 1. 网络问题
  network: {
    issue: '网络不稳定、切换网络（WiFi ↔ 4G）',
    example: '手机从 WiFi 切换到移动网络',
    symptom: '连接突然断开，无任何通知',
    frequency: '移动端常见'
  },
  
  // 2. 代理/防火墙超时
  proxy: {
    issue: 'NAT 路由器、代理服务器、防火墙的空闲超时',
    timeout: '通常 60-120 秒无数据传输就断开',
    example: `
      客户端 ←→ NAT 路由器 ←→ 互联网 ←→ 服务器
                    ↑
              60秒无数据 → 清除连接记录 → 断开
    `,
    symptom: '一段时间不活动后连接断开',
    frequency: '非常常见！'
  },
  
  // 3. 服务器主动断开
  server: {
    issue: '服务器重启、维护、负载均衡切换',
    example: '服务器升级部署，关闭所有连接',
    symptom: '收到 close 事件',
    frequency: '部署时'
  },
  
  // 4. 浏览器限制
  browser: {
    issue: '标签页后台、设备休眠',
    example: '手机息屏 5 分钟后，浏览器可能暂停 WebSocket',
    symptom: '恢复前台后连接已断开',
    frequency: '移动端常见'
  },
  
  // 5. 长时间空闲
  idle: {
    issue: '长时间没有数据传输',
    reason: 'TCP 的 keepalive 机制可能失效',
    timeout: '默认 2 小时（操作系统级别）',
    symptom: '看起来连接还在，实际已断开（"僵尸连接"）',
    frequency: '长连接应用'
  }
};
```

---

## 💓 心跳检测原理

### 为什么心跳检测有效？

```javascript
/**
 * 心跳检测解决的核心问题：
 * 
 * 1. 防止代理/防火墙超时断开
 *    - 定期发送数据（心跳包）
 *    - 让中间设备认为连接仍在使用
 *    - 保持 NAT 映射不被清除
 * 
 * 2. 及时发现连接断开
 *    - 发送心跳后等待响应
 *    - 如果没有响应 → 连接已断开
 *    - 立即重连，而不是等到发送业务数据时才发现
 * 
 * 3. 保持连接活跃
 *    - 防止 TCP keepalive 超时（默认 2 小时）
 *    - 更早发现问题（30 秒 vs 2 小时）
 */

const heartbeatPrinciple = {
  // 无心跳的问题
  withoutHeartbeat: {
    scenario: '用户打开页面后不操作',
    timeline: `
      0s:   连接建立
      60s:  NAT 路由器开始计时（无数据传输）
      120s: NAT 超时，清除映射
      180s: 连接实际已断开，但客户端不知道
      300s: 用户发送消息 → 失败！才发现断开
    `,
    problem: '发现断开太晚，用户体验差'
  },
  
  // 有心跳的优势
  withHeartbeat: {
    scenario: '每 30 秒发送一次心跳',
    timeline: `
      0s:   连接建立
      30s:  发送心跳 → NAT 刷新计时器
      60s:  发送心跳 → NAT 刷新计时器
      90s:  发送心跳 → NAT 刷新计时器
      ...   连接保持活跃
    `,
    benefit: '连接不会被超时断开'
  },
  
  // 断线检测
  disconnectDetection: {
    timeline: `
      0s:   发送心跳
      3s:   等待响应
      3s:   超时！没有收到心跳响应
      3s:   立即判定：连接已断开
      3s:   自动重连
    `,
    benefit: '3秒内发现并重连，用户几乎无感知'
  }
};
```

---

## 💻 完整的心跳检测实现

### 客户端（完整版）

```javascript
/**
 * WebSocket 客户端（带心跳检测和自动重连）
 */
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.ws = null;
    
    // 配置
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30秒
    this.heartbeatTimeout = options.heartbeatTimeout || 3000;     // 3秒超时
    this.reconnectInterval = options.reconnectInterval || 5000;   // 5秒后重连
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    
    // 状态
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.reconnectTimer = null;
    this.isManualClose = false;
    
    // 事件回调
    this.onopen = options.onopen || (() => {});
    this.onmessage = options.onmessage || (() => {});
    this.onerror = options.onerror || (() => {});
    this.onclose = options.onclose || (() => {});
    this.onreconnect = options.onreconnect || (() => {});
  }
  
  /**
   * 连接
   */
  connect() {
    try {
      console.log('🔌 连接 WebSocket:', this.url);
      
      this.ws = new WebSocket(this.url);
      
      // 连接打开
      this.ws.onopen = (event) => {
        console.log('✅ WebSocket 连接成功');
        this.reconnectAttempts = 0; // 重置重连次数
        this.startHeartbeat();       // 启动心跳
        this.onopen(event);
      };
      
      // 收到消息
      this.ws.onmessage = (event) => {
        const data = event.data;
        
        // 检查是否是心跳响应
        if (this.isHeartbeatResponse(data)) {
          console.log('💓 收到心跳响应');
          this.resetHeartbeatTimeout(); // 重置超时计时
          return;
        }
        
        // 业务消息
        this.onmessage(event);
      };
      
      // 连接关闭
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket 连接关闭', event.code, event.reason);
        this.stopHeartbeat();
        this.onclose(event);
        
        // 如果不是手动关闭，尝试重连
        if (!this.isManualClose) {
          this.reconnect();
        }
      };
      
      // 错误
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error);
        this.onerror(error);
      };
      
    } catch (error) {
      console.error('❌ 连接失败:', error);
      this.reconnect();
    }
  }
  
  /**
   * 发送消息
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } else {
      console.warn('⚠️ WebSocket 未连接，消息未发送');
      return false;
    }
  }
  
  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    console.log('💓 启动心跳检测，间隔:', this.heartbeatInterval / 1000, '秒');
    
    this.stopHeartbeat(); // 先清除旧的
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('💓 发送心跳包');
        
        // 发送心跳消息
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // 启动超时检测
        this.startHeartbeatTimeout();
      }
    }, this.heartbeatInterval);
  }
  
  /**
   * 启动心跳超时检测
   */
  startHeartbeatTimeout() {
    this.clearHeartbeatTimeout();
    
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('💔 心跳超时，连接可能已断开');
      
      // 主动关闭并重连
      this.ws.close();
    }, this.heartbeatTimeout);
  }
  
  /**
   * 重置心跳超时（收到响应后调用）
   */
  resetHeartbeatTimeout() {
    this.clearHeartbeatTimeout();
  }
  
  /**
   * 清除心跳超时计时器
   */
  clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }
  
  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }
  
  /**
   * 判断是否是心跳响应
   */
  isHeartbeatResponse(data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.type === 'pong';
    } catch {
      return false;
    }
  }
  
  /**
   * 重连
   */
  reconnect() {
    // 清除旧的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // 检查重连次数
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 达到最大重连次数，放弃重连');
      return;
    }
    
    this.reconnectAttempts++;
    
    console.log(`🔄 ${this.reconnectInterval / 1000}秒后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 开始重连...');
      this.onreconnect(this.reconnectAttempts);
      this.connect();
    }, this.reconnectInterval);
  }
  
  /**
   * 手动关闭
   */
  close() {
    console.log('👋 手动关闭连接');
    this.isManualClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
    }
  }
}

// ============================================
// 使用示例
// ============================================
const ws = new WebSocketClient('ws://localhost:3000', {
  heartbeatInterval: 30000,  // 30秒发送一次心跳
  heartbeatTimeout: 3000,    // 3秒未响应视为超时
  reconnectInterval: 5000,   // 5秒后重连
  maxReconnectAttempts: 5,   // 最多重连5次
  
  onopen: () => {
    console.log('🎉 连接成功');
    // 发送认证信息等
  },
  
  onmessage: (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 收到消息:', data);
    
    // 处理业务消息
    if (data.type === 'chat') {
      displayMessage(data.message);
    }
  },
  
  onerror: (error) => {
    console.error('❌ 连接错误:', error);
  },
  
  onclose: (event) => {
    console.log('👋 连接关闭:', event.code, event.reason);
  },
  
  onreconnect: (attempt) => {
    console.log('🔄 正在重连，第', attempt, '次尝试');
    showReconnectingUI();
  }
});

// 连接
ws.connect();

// 发送消息
document.getElementById('sendBtn').addEventListener('click', () => {
  const message = document.getElementById('input').value;
  ws.send({ type: 'chat', message });
});

// 页面卸载时关闭
window.addEventListener('beforeunload', () => {
  ws.close();
});
```

---

## 🖥️ 服务器端实现

### Node.js (ws 库)

```javascript
const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 3000 });

// 客户端连接管理
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  console.log('✅ 新客户端连接:', clientId);
  
  // 保存客户端信息
  clients.set(clientId, {
    ws,
    isAlive: true,
    lastHeartbeat: Date.now()
  });
  
  // 收到消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // 处理心跳包
      if (message.type === 'ping') {
        console.log('💓 收到心跳:', clientId);
        
        // 更新状态
        const client = clients.get(clientId);
        if (client) {
          client.isAlive = true;
          client.lastHeartbeat = Date.now();
        }
        
        // 响应心跳（pong）
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }
      
      // 处理业务消息
      console.log('📨 收到消息:', clientId, message);
      
      if (message.type === 'chat') {
        // 广播给所有客户端
        broadcast(message, clientId);
      }
      
    } catch (error) {
      console.error('❌ 消息解析失败:', error);
    }
  });
  
  // 连接关闭
  ws.on('close', () => {
    console.log('👋 客户端断开:', clientId);
    clients.delete(clientId);
  });
  
  // 错误
  ws.on('error', (error) => {
    console.error('❌ 连接错误:', clientId, error);
  });
});

/**
 * 服务器端主动心跳检测（可选）
 * 定期检查所有连接是否存活
 */
setInterval(() => {
  console.log('🔍 检查连接状态，当前连接数:', clients.size);
  
  clients.forEach((client, clientId) => {
    // 检查是否超时
    const timeSinceLastHeartbeat = Date.now() - client.lastHeartbeat;
    
    if (timeSinceLastHeartbeat > 60000) { // 60秒无心跳
      console.warn('💔 客户端心跳超时:', clientId);
      client.ws.terminate(); // 强制关闭
      clients.delete(clientId);
    }
  });
}, 30000); // 每30秒检查一次

/**
 * 广播消息
 */
function broadcast(message, excludeId) {
  clients.forEach((client, clientId) => {
    if (clientId !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function generateClientId() {
  return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

console.log('🚀 WebSocket 服务器运行在 ws://localhost:3000');
```

---

## 🎯 心跳检测的多种策略

### 策略1：客户端主动心跳（推荐）

```javascript
/**
 * 客户端每 30 秒发送 ping
 * 服务器收到后回复 pong
 */
const clientHeartbeat = {
  flow: `
    客户端                     服务器
      |                          |
      |── ping ──────────────>   |
      |                          |
      |<─────────────── pong ──  |
      |                          |
    收到pong → 连接正常
    超时未收到 → 连接断开 → 重连
  `,
  
  pros: '客户端主导，及时发现断线',
  cons: '客户端开销略大（定时器）'
};
```

### 策略2：服务器主动心跳

```javascript
/**
 * 服务器每 30 秒发送 ping
 * 客户端收到后回复 pong
 */

// 服务器端
setInterval(() => {
  clients.forEach((client, id) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.ping(); // WebSocket 原生的 ping
      
      // 或发送自定义消息
      client.ws.send(JSON.stringify({ type: 'ping' }));
    }
  });
}, 30000);

// 客户端（浏览器端 WebSocket 会自动处理 ping/pong）
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'ping') {
    // 回复 pong
    ws.send(JSON.stringify({ type: 'pong' }));
  }
};

const serverHeartbeat = {
  pros: '减轻客户端压力',
  cons: '服务器需要管理所有客户端的心跳状态'
};
```

### 策略3：双向心跳（最可靠）

```javascript
/**
 * 客户端和服务器都发送心跳
 * 任一方超时都会断开
 */
const bidirectionalHeartbeat = {
  client: '每 30 秒发送心跳，检测服务器状态',
  server: '每 30 秒发送心跳，检测客户端状态',
  benefit: '双重保障，最可靠',
  tradeoff: '资源消耗略大'
};
```

---

## ⏱️ 心跳间隔的选择

### 推荐配置

```javascript
const heartbeatConfig = {
  // 快速响应场景（聊天应用）
  realtime: {
    interval: 15000,  // 15秒
    timeout: 3000,    // 3秒超时
    reason: '需要快速检测断线',
    tradeoff: '开销较大'
  },
  
  // 标准场景（大多数应用）
  standard: {
    interval: 30000,  // 30秒（推荐）
    timeout: 5000,    // 5秒超时
    reason: '平衡性能和及时性',
    mostCommon: '✅ 最常用'
  },
  
  // 低频场景（监控、通知）
  lowFrequency: {
    interval: 60000,  // 60秒
    timeout: 10000,   // 10秒超时
    reason: '减少开销',
    tradeoff: '发现断线较慢'
  },
  
  // 原则
  guidelines: {
    rule1: '间隔必须 < NAT/代理超时（通常 60-120 秒）',
    rule2: '超时时间 = 1-2 个 RTT（往返时间）',
    rule3: '移动端可以适当增加间隔（省电）',
    rule4: '不要太频繁（< 10 秒），浪费资源'
  }
};
```

---

## 🔄 断线重连策略

### 1. 指数退避重连

```javascript
/**
 * 指数退避算法（Exponential Backoff）
 * 
 * 重连间隔逐步增加：1s → 2s → 4s → 8s → 16s
 */
class ReconnectStrategy {
  constructor() {
    this.baseDelay = 1000;      // 基础延迟 1 秒
    this.maxDelay = 60000;      // 最大延迟 60 秒
    this.attempts = 0;
  }
  
  getDelay() {
    // 指数增长：2^n * baseDelay
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts),
      this.maxDelay
    );
    
    // 添加随机抖动（避免大量客户端同时重连）
    const jitter = delay * 0.1 * Math.random();
    
    return delay + jitter;
  }
  
  increment() {
    this.attempts++;
  }
  
  reset() {
    this.attempts = 0;
  }
}

// 使用
const strategy = new ReconnectStrategy();

function reconnect() {
  const delay = strategy.getDelay();
  strategy.increment();
  
  console.log(`🔄 ${(delay / 1000).toFixed(1)} 秒后重连...`);
  
  setTimeout(() => {
    connect();
  }, delay);
}

/**
 * 重连时间轴：
 * 
 * 第1次断开 → 1秒后重连
 * 第2次断开 → 2秒后重连
 * 第3次断开 → 4秒后重连
 * 第4次断开 → 8秒后重连
 * 第5次断开 → 16秒后重连
 * 第6次断开 → 32秒后重连
 * 第7次断开 → 60秒后重连（达到上限）
 * 
 * 优点：避免频繁重连，减轻服务器压力
 */
```

### 2. 固定间隔重连

```javascript
/**
 * 固定时间间隔重连
 */
function reconnectFixed() {
  if (reconnectAttempts >= maxAttempts) {
    console.error('❌ 达到最大重连次数');
    showErrorMessage('连接失败，请刷新页面');
    return;
  }
  
  reconnectAttempts++;
  
  setTimeout(() => {
    console.log('🔄 尝试重连...');
    connect();
  }, 5000); // 固定 5 秒
}
```

### 3. 立即重连 + 退避

```javascript
/**
 * 第一次立即重连，之后退避
 */
function reconnectSmart() {
  if (reconnectAttempts === 0) {
    // 第一次断开，立即重连
    console.log('🔄 立即重连...');
    reconnectAttempts++;
    connect();
  } else {
    // 之后使用指数退避
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
    reconnectAttempts++;
    
    setTimeout(() => {
      connect();
    }, delay);
  }
}
```

---

## 🎨 心跳消息格式

### 方式1：JSON 格式

```javascript
// 客户端发送
{
  "type": "ping",
  "timestamp": 1730678400000
}

// 服务器响应
{
  "type": "pong",
  "timestamp": 1730678400100
}
```

### 方式2：WebSocket 原生 ping/pong

```javascript
// 服务器端（Node.js ws 库）
ws.ping(); // 发送 WebSocket ping 帧

ws.on('pong', () => {
  console.log('收到 pong');
});

// 客户端（浏览器）
// 浏览器会自动处理 ping/pong 帧，无需手动编码
// 但无法通过 JS 监听 pong 事件
```

### 方式3：简单字符串

```javascript
// 客户端
ws.send('ping');

// 服务器
if (data === 'ping') {
  ws.send('pong');
}
```

**推荐**：使用 JSON 格式，便于扩展和调试。

---

## 🔍 为什么心跳检测有效？

### 原理详解

```javascript
/**
 * 心跳检测的作用机制
 */

// ============================================
// 问题1：代理/NAT 超时
// ============================================
const natTimeout = {
  // 无心跳
  without: {
    timeline: `
      0s:   连接建立
      0s:   NAT 路由器记录映射：
            客户端IP:Port ↔ 服务器IP:Port
      
      60s:  无数据传输
      120s: NAT 超时，清除映射
      
      180s: 客户端发送消息
            → 数据包到达 NAT
            → NAT 查找映射表
            → 找不到映射！
            → 丢弃数据包
            → 消息发送失败
    `,
    problem: '连接实际已断，但客户端不知道'
  },
  
  // 有心跳
  with: {
    timeline: `
      0s:   连接建立，NAT 记录映射
      30s:  心跳包 → NAT 刷新映射（重置计时器）
      60s:  心跳包 → NAT 刷新映射
      90s:  心跳包 → NAT 刷新映射
      ...   映射一直保持
      
      任何时候: 客户端发送消息 → 成功
    `,
    benefit: '定期刷新 NAT 映射，连接保持活跃'
  }
};

// ============================================
// 问题2：僵尸连接检测
// ============================================
const zombieConnection = {
  scenario: '网络异常断开，但连接对象还存在',
  
  without: {
    issue: 'WebSocket 对象仍然是 OPEN 状态',
    problem: '发送消息时才发现连接已断（消息丢失）',
    discovery: '业务失败时才发现'
  },
  
  with: {
    detection: `
      发送心跳 → 3秒内无响应 → 判定连接已断
      → 立即关闭并重连
      → 业务代码甚至感知不到（透明重连）
    `,
    benefit: '提前发现问题，避免业务消息丢失'
  }
};

// ============================================
// 问题3：及时性
// ============================================
const timeliness = {
  without: {
    detection: '等到发送业务消息时才发现断开',
    delay: '可能已经断开很久了（几分钟甚至几小时）',
    impact: '用户体验差（消息发送失败）'
  },
  
  with: {
    detection: '最多 30秒+3秒=33秒 内发现断开',
    action: '自动重连，对用户透明',
    impact: '用户几乎无感知'
  }
};
```

### 图解说明

```
┌──────────────────────────────────────────────────────┐
│               无心跳检测的问题                         │
└──────────────────────────────────────────────────────┘

客户端                  NAT路由器              服务器
  |                        |                      |
  |── 建立连接 ──────────→ | ←─── 建立连接 ──── |
  |                        |                      |
  |      (120秒无数据)      |                      |
  |                        |                      |
  |                    映射超时清除                |
  |                        ✗                      |
  |                                               |
  |── 发送消息 ──────────→ |                      |
  |                    找不到映射！                |
  |                    丢弃数据包                  |
  |                        ✗                      |
  |                                               |
  ❌ 消息发送失败


┌──────────────────────────────────────────────────────┐
│               有心跳检测的好处                         │
└──────────────────────────────────────────────────────┘

客户端                  NAT路由器              服务器
  |                        |                      |
  |── 建立连接 ──────────→ | ←─── 建立连接 ──── |
  |                        |                      |
  |── ping (30s) ────────→ | ────────────────→   |
  |                    刷新映射                    |
  |←─────────────────────  | ←──────── pong ──   |
  |                        |                      |
  |── ping (60s) ────────→ | ────────────────→   |
  |                    刷新映射                    |
  |←─────────────────────  | ←──────── pong ──   |
  |                        |                      |
  |── 发送消息 ──────────→ | ────────────────→   |
  |                    映射存在                    |
  |                        ✓                      |
  ✅ 消息发送成功
```

---

## 🚀 高级特性

### 1. 断线缓存队列

```javascript
/**
 * 连接断开时缓存消息，重连后发送
 */
class WebSocketWithQueue extends WebSocketClient {
  constructor(url, options) {
    super(url, options);
    this.messageQueue = []; // 消息队列
    this.maxQueueSize = 100;
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 先发送队列中的消息
      this.flushQueue();
      
      // 发送当前消息
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      // 连接断开，加入队列
      console.log('⏸️ 连接断开，消息加入队列');
      
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(data);
      } else {
        console.warn('⚠️ 队列已满，丢弃最旧的消息');
        this.messageQueue.shift();
        this.messageQueue.push(data);
      }
    }
  }
  
  flushQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 发送队列中的 ${this.messageQueue.length} 条消息`);
      
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
      }
    }
  }
  
  // 重写 onopen
  connect() {
    const originalOnOpen = this.onopen;
    
    this.onopen = (event) => {
      // 连接成功后，发送队列中的消息
      this.flushQueue();
      originalOnOpen(event);
    };
    
    super.connect();
  }
}
```

### 2. 网络状态监听

```javascript
/**
 * 监听网络状态变化，主动重连
 */
class SmartWebSocket extends WebSocketClient {
  constructor(url, options) {
    super(url, options);
    this.setupNetworkListeners();
  }
  
  setupNetworkListeners() {
    // 监听在线/离线事件
    window.addEventListener('online', () => {
      console.log('🌐 网络恢复，立即重连');
      this.reconnect();
    });
    
    window.addEventListener('offline', () => {
      console.log('📡 网络断开');
      this.stopHeartbeat();
    });
    
    // 监听可见性变化（标签页切换）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ 页面可见，检查连接状态');
        this.checkConnection();
      }
    });
  }
  
  checkConnection() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('🔄 连接已断开，立即重连');
      this.connect();
    } else {
      // 发送心跳确认连接
      this.send({ type: 'ping' });
    }
  }
}
```

### 3. 心跳统计和监控

```javascript
/**
 * 心跳统计，用于监控和调优
 */
class HeartbeatMonitor {
  constructor() {
    this.stats = {
      totalSent: 0,
      totalReceived: 0,
      timeouts: 0,
      avgResponseTime: 0,
      responseTimeSum: 0
    };
  }
  
  recordSent() {
    this.stats.totalSent++;
    this.lastSentTime = Date.now();
  }
  
  recordReceived() {
    this.stats.totalReceived++;
    
    if (this.lastSentTime) {
      const responseTime = Date.now() - this.lastSentTime;
      this.stats.responseTimeSum += responseTime;
      this.stats.avgResponseTime = 
        this.stats.responseTimeSum / this.stats.totalReceived;
      
      console.log(`💓 心跳响应时间: ${responseTime}ms`);
    }
  }
  
  recordTimeout() {
    this.stats.timeouts++;
  }
  
  getStats() {
    return {
      ...this.stats,
      successRate: ((this.stats.totalReceived / this.stats.totalSent) * 100).toFixed(2) + '%',
      avgResponseTime: this.stats.avgResponseTime.toFixed(2) + 'ms'
    };
  }
  
  report() {
    console.log('📊 心跳统计:');
    console.table(this.getStats());
  }
}

// 使用
const monitor = new HeartbeatMonitor();

// 发送心跳时
monitor.recordSent();

// 收到响应时
monitor.recordReceived();

// 超时时
monitor.recordTimeout();

// 定期上报
setInterval(() => {
  monitor.report();
}, 60000); // 每分钟
```

---

## 📱 移动端优化

### 针对移动端的特殊处理

```javascript
/**
 * 移动端 WebSocket 优化
 */
class MobileWebSocket extends WebSocketClient {
  constructor(url, options) {
    super(url, options);
    
    // 移动端心跳间隔更长（省电）
    if (this.isMobile()) {
      this.heartbeatInterval = 45000; // 45秒
    }
    
    this.setupMobileOptimizations();
  }
  
  isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  
  setupMobileOptimizations() {
    // 1. 页面隐藏时停止心跳（省电）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        console.log('📱 页面隐藏，暂停心跳');
        this.stopHeartbeat();
      } else {
        console.log('📱 页面可见，恢复心跳');
        this.startHeartbeat();
        
        // 立即发送一次心跳检测连接
        this.send({ type: 'ping' });
      }
    });
    
    // 2. 监听网络变化（WiFi ↔ 4G）
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        console.log('📡 网络类型变化:', navigator.connection.effectiveType);
        
        // 网络切换，立即重连
        this.ws.close();
        setTimeout(() => this.connect(), 1000);
      });
    }
    
    // 3. 电池电量低时降低心跳频率
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            console.log('🔋 电量低，降低心跳频率');
            this.heartbeatInterval = 60000; // 60秒
          } else {
            this.heartbeatInterval = 30000; // 恢复 30秒
          }
        });
      });
    }
  }
}
```

---

## 📊 完整的生产级实现

### 完整的客户端（包含所有特性）

```javascript
/**
 * 生产级 WebSocket 客户端
 * 
 * 特性：
 * - ✅ 心跳检测
 * - ✅ 自动重连（指数退避）
 * - ✅ 消息队列
 * - ✅ 网络状态监听
 * - ✅ 统计监控
 */
class ProductionWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      heartbeatInterval: 30000,
      heartbeatTimeout: 3000,
      reconnectDelay: 1000,
      maxReconnectDelay: 60000,
      maxReconnectAttempts: Infinity,
      debug: false,
      ...options
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.reconnectTimer = null;
    this.isIntentionalClose = false;
    
    this.setupEventListeners();
  }
  
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.log('⚠️ 已经连接');
      return;
    }
    
    this.log('🔌 开始连接:', this.url);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.log('❌ 连接失败:', error);
      this.scheduleReconnect();
    }
  }
  
  setupWebSocketHandlers() {
    this.ws.onopen = () => {
      this.log('✅ 连接成功');
      this.reconnectAttempts = 0;
      this.flushQueue();
      this.startHeartbeat();
      this.options.onopen?.();
    };
    
    this.ws.onmessage = (event) => {
      const data = this.parseMessage(event.data);
      
      if (data?.type === 'pong') {
        this.handleHeartbeatResponse();
        return;
      }
      
      this.options.onmessage?.(event);
    };
    
    this.ws.onclose = (event) => {
      this.log('🔌 连接关闭:', event.code, event.reason);
      this.stopHeartbeat();
      this.options.onclose?.(event);
      
      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      this.log('❌ 错误:', error);
      this.options.onerror?.(error);
    };
  }
  
  send(data) {
    if (this.isConnected()) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      this.queueMessage(data);
    }
  }
  
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  queueMessage(data) {
    this.messageQueue.push(data);
    this.log('⏸️ 消息已加入队列，当前队列长度:', this.messageQueue.length);
  }
  
  flushQueue() {
    if (this.messageQueue.length > 0) {
      this.log(`📤 发送队列中的 ${this.messageQueue.length} 条消息`);
      
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.send(message);
      }
    }
  }
  
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.log('💓 启动心跳，间隔:', this.options.heartbeatInterval / 1000, '秒');
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.log('💓 发送心跳');
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        this.waitForHeartbeatResponse();
      }
    }, this.options.heartbeatInterval);
  }
  
  waitForHeartbeatResponse() {
    this.clearHeartbeatTimeout();
    
    this.heartbeatTimeoutTimer = setTimeout(() => {
      this.log('💔 心跳超时，连接已断开');
      this.ws.close();
    }, this.options.heartbeatTimeout);
  }
  
  handleHeartbeatResponse() {
    this.log('💓 收到心跳响应');
    this.clearHeartbeatTimeout();
  }
  
  clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }
  
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }
  
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.log('❌ 达到最大重连次数');
      this.options.onMaxReconnect?.();
      return;
    }
    
    // 指数退避
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.options.maxReconnectDelay
    );
    
    this.reconnectAttempts++;
    
    this.log(`🔄 ${(delay / 1000).toFixed(1)}秒后重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.options.onreconnect?.(this.reconnectAttempts);
      this.connect();
    }, delay);
  }
  
  setupEventListeners() {
    // 网络状态变化
    window.addEventListener('online', () => {
      this.log('🌐 网络恢复');
      this.connect();
    });
    
    window.addEventListener('offline', () => {
      this.log('📡 网络断开');
    });
    
    // 页面卸载
    window.addEventListener('beforeunload', () => {
      this.close();
    });
  }
  
  close() {
    this.log('👋 手动关闭连接');
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
    }
  }
  
  parseMessage(data) {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  
  log(...args) {
    if (this.options.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

// ============================================
// 使用示例
// ============================================
const socket = new ProductionWebSocket('ws://localhost:3000', {
  heartbeatInterval: 30000,
  heartbeatTimeout: 3000,
  debug: true,
  
  onopen: () => {
    console.log('🎉 连接成功，可以发送消息了');
    showConnectedUI();
  },
  
  onmessage: (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 收到:', data);
    displayMessage(data);
  },
  
  onclose: (event) => {
    console.log('连接关闭');
    showDisconnectedUI();
  },
  
  onreconnect: (attempt) => {
    console.log('正在重连...', attempt);
    showReconnectingUI(attempt);
  },
  
  onMaxReconnect: () => {
    console.log('重连失败，请刷新页面');
    showErrorUI();
  }
});

socket.connect();

// 发送消息
function sendMessage(text) {
  socket.send({
    type: 'chat',
    message: text,
    timestamp: Date.now()
  });
}
```

---

## 📋 总结

### 为什么心跳检测有效？

```
1️⃣ 保持连接活跃
   定期发送数据 → NAT/代理刷新映射 → 连接不会被超时断开

2️⃣ 及时发现断线
   发送心跳 → 3秒未响应 → 判定断开 → 立即重连

3️⃣ 避免僵尸连接
   检测真实连接状态 → 而不是依赖 readyState

4️⃣ 提升用户体验
   透明重连 → 用户几乎无感知
```

### 最佳配置

```javascript
const recommended = {
  heartbeatInterval: 30000,   // 30秒（< NAT超时时间）
  heartbeatTimeout: 3000,     // 3秒（1-2个RTT）
  reconnectDelay: 1000,       // 1秒起始
  maxReconnectDelay: 60000,   // 60秒上限
  maxReconnectAttempts: 10,   // 最多重连10次
  
  strategy: '指数退避 + 消息队列 + 网络监听'
};
```

### 核心代码

```javascript
// 最小实现
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
  
  setTimeout(() => {
    if (!receivedPong) {
      ws.close(); // 超时，关闭并重连
    }
  }, 3000);
}, 30000);
```

文档位置：`WebSocket心跳检测详解.md`

包含：掉线原因、心跳原理、完整实现、移动端优化、生产级代码！🎉
