# HTTP 安全响应头详解

## X-Frame-Options（防止点击劫持）

### 🎯 作用

`X-Frame-Options` 响应头用于控制网页是否可以被嵌入到 `<iframe>`、`<frame>`、`<embed>` 或 `<object>` 中，**主要目的是防止点击劫持攻击（Clickjacking）**。

### 🚨 什么是点击劫持（Clickjacking）？

点击劫持是一种欺骗用户点击的攻击方式：

```html
<!-- 攻击者的恶意页面 -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 将目标网站设为透明并覆盖在诱饵上 */
    #victim-site {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0; /* 完全透明 */
      z-index: 2;
    }
    
    #decoy {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
  </style>
</head>
<body>
  <!-- 诱饵按钮（用户看到的） -->
  <div id="decoy">
    <button style="position: absolute; top: 100px; left: 100px;">
      🎁 点击领取免费礼品
    </button>
  </div>
  
  <!-- 
    实际的目标网站（用户看不到）
    攻击者精确定位，让用户以为点击礼品按钮
    实际上点击的是删除账户按钮
  -->
  <iframe id="victim-site" src="https://bank.com/delete-account"></iframe>
</body>
</html>
```

**攻击流程**：
1. 用户看到"领取礼品"按钮
2. 实际上透明的 iframe 覆盖在上面
3. 用户点击时，真正点击的是 iframe 中的"删除账户"按钮
4. 用户在不知情的情况下删除了账户 💥

### ✅ X-Frame-Options 的值

#### 1. `DENY`（最严格）

```http
X-Frame-Options: DENY
```

**含义**：禁止任何网站通过 iframe 嵌入此页面（包括同源网站）

```javascript
// 服务器端设置（Node.js/Express）
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

**使用场景**：
- ✅ 银行网站
- ✅ 支付页面
- ✅ 管理后台
- ✅ 登录页面

#### 2. `SAMEORIGIN`（常用）

```http
X-Frame-Options: SAMEORIGIN
```

**含义**：只允许同源网站嵌入

```javascript
// 同源可以嵌入
// https://example.com 可以嵌入 https://example.com/page
// https://example.com 不能嵌入 https://other.com/page

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
```

**使用场景**：
- ✅ 需要在自己网站内嵌入的页面
- ✅ 后台的子页面
- ✅ 需要 iframe 预览的功能

#### 3. `ALLOW-FROM uri`（已废弃）

```http
X-Frame-Options: ALLOW-FROM https://trusted-site.com
```

**⚠️ 注意**：这个选项已被废弃，浏览器支持不佳，推荐使用 `Content-Security-Policy` 的 `frame-ancestors` 替代。

### 🌐 各语言/框架设置示例

#### Node.js / Express

```javascript
const express = require('express');
const app = express();

// 方法1：手动设置
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// 方法2：使用 helmet 中间件（推荐）
const helmet = require('helmet');
app.use(helmet.frameguard({ action: 'deny' }));
// 或
app.use(helmet.frameguard({ action: 'sameorigin' }));
```

#### Nginx

```nginx
# 在 server 或 location 块中添加
server {
    listen 80;
    server_name example.com;
    
    # 添加 X-Frame-Options
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # 或者完全拒绝
    # add_header X-Frame-Options "DENY" always;
}
```

#### Apache

```apache
# 在 .htaccess 或配置文件中
Header always set X-Frame-Options "SAMEORIGIN"

# 或者
Header always set X-Frame-Options "DENY"
```

#### PHP

```php
<?php
// 在页面顶部设置
header('X-Frame-Options: SAMEORIGIN');

// 或者
header('X-Frame-Options: DENY');
?>
```

#### Django (Python)

```python
# settings.py
X_FRAME_OPTIONS = 'DENY'
# 或
X_FRAME_OPTIONS = 'SAMEORIGIN'
```

#### ASP.NET

```csharp
// Web.config
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="X-Frame-Options" value="SAMEORIGIN" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

#### Spring Boot (Java)

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .headers()
            .frameOptions().deny(); // 或 .sameOrigin()
    }
}
```

### 🧪 测试是否生效

#### 方法1：浏览器开发者工具

```javascript
// 1. 打开网页
// 2. F12 打开开发者工具
// 3. 切换到 Network 标签
// 4. 刷新页面
// 5. 点击文档请求
// 6. 查看 Response Headers

// 应该看到：
X-Frame-Options: SAMEORIGIN
```

#### 方法2：使用 curl

```bash
curl -I https://example.com

# 输出应包含：
# X-Frame-Options: SAMEORIGIN
```

#### 方法3：尝试嵌入

```html
<!-- 创建测试页面 test.html -->
<!DOCTYPE html>
<html>
<head>
  <title>测试 X-Frame-Options</title>
</head>
<body>
  <h1>尝试嵌入目标网站</h1>
  
  <!-- 如果设置了 X-Frame-Options: DENY -->
  <!-- 这个 iframe 会被阻止加载 -->
  <iframe src="https://your-site.com" width="800" height="600"></iframe>
  
  <script>
    // 监听错误
    window.addEventListener('error', (e) => {
      console.log('❌ Frame 加载失败:', e);
    }, true);
  </script>
</body>
</html>
```

**如果设置正确，浏览器控制台会显示**：
```
Refused to display 'https://your-site.com' in a frame because it set 
'X-Frame-Options' to 'DENY'.
```

---

## 🆕 现代替代方案：Content-Security-Policy

### CSP 的 frame-ancestors 指令

`X-Frame-Options` 正在被 `Content-Security-Policy` 的 `frame-ancestors` 替代，因为它更灵活。

```http
Content-Security-Policy: frame-ancestors 'none'
# 等同于 X-Frame-Options: DENY

Content-Security-Policy: frame-ancestors 'self'
# 等同于 X-Frame-Options: SAMEORIGIN

Content-Security-Policy: frame-ancestors 'self' https://trusted.com
# 允许同源和 trusted.com 嵌入（X-Frame-Options 无法实现）
```

### 对比

| 特性 | X-Frame-Options | CSP frame-ancestors |
|------|----------------|---------------------|
| **浏览器支持** | ✅ 更广泛 | 🔶 现代浏览器 |
| **灵活性** | ❌ 有限（只能单一来源） | ✅ 支持多个来源 |
| **标准化** | ⚠️ 非标准 | ✅ W3C 标准 |
| **推荐使用** | 🔶 兼容性考虑 | ✅ 优先推荐 |

### 最佳实践：同时设置

```javascript
// Node.js/Express 示例
app.use((req, res, next) => {
  // 旧浏览器支持
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // 现代浏览器支持（更强大）
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://trusted-partner.com"
  );
  
  next();
});
```

---

## 🛡️ 其他重要的安全响应头

### 1. Content-Security-Policy (CSP)

**作用**：防止 XSS、数据注入等攻击

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

```javascript
// 详细配置
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",                    // 默认只允许同源
    "script-src 'self' https://cdn.com",     // 脚本来源
    "style-src 'self' 'unsafe-inline'",      // 样式来源
    "img-src 'self' data: https:",           // 图片来源
    "font-src 'self' https://fonts.com",     // 字体来源
    "connect-src 'self' https://api.com",    // AJAX/WebSocket
    "frame-ancestors 'none'",                // 禁止被嵌入
    "base-uri 'self'",                       // 限制 <base> 标签
    "form-action 'self'"                     // 表单提交目标
  ].join('; '));
  next();
});
```

### 2. Strict-Transport-Security (HSTS)

**作用**：强制浏览器使用 HTTPS

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

**参数说明**：
- `max-age=31536000`：1年内强制 HTTPS
- `includeSubDomains`：子域名也强制 HTTPS
- `preload`：加入浏览器预加载列表

### 3. X-Content-Type-Options

**作用**：防止浏览器 MIME 类型嗅探

```http
X-Content-Type-Options: nosniff
```

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

**防止的攻击**：
```html
<!-- 攻击者上传图片 -->
<img src="evil.jpg">

<!-- evil.jpg 实际包含 JavaScript 代码 -->
<!-- 如果没有 nosniff，浏览器可能将其当作脚本执行 -->
```

### 4. X-XSS-Protection

**作用**：启用浏览器 XSS 过滤器（已过时，建议使用 CSP）

```http
X-XSS-Protection: 1; mode=block
```

```javascript
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

**⚠️ 注意**：现代浏览器推荐使用 CSP 替代。

### 5. Referrer-Policy

**作用**：控制 Referer 头的发送

```http
Referrer-Policy: strict-origin-when-cross-origin
```

```javascript
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

**可选值**：
- `no-referrer`：不发送
- `same-origin`：仅同源发送
- `strict-origin-when-cross-origin`：推荐（跨域只发送源）

### 6. Permissions-Policy（前身是 Feature-Policy）

**作用**：控制浏览器特性的使用权限

```http
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

```javascript
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', [
    'geolocation=()',           // 禁用地理位置
    'microphone=()',            // 禁用麦克风
    'camera=()',                // 禁用摄像头
    'payment=()',               // 禁用支付API
    'usb=()',                   // 禁用USB
    'fullscreen=(self)'         // 只允许同源全屏
  ].join(', '));
  next();
});
```

---

## 🚀 完整的安全头配置示例

### Node.js / Express（使用 Helmet）

```javascript
const express = require('express');
const helmet = require('helmet');
const app = express();

// 使用 Helmet（推荐）
app.use(helmet({
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // Content-Security-Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // 其他
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Nginx（完整配置）

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 安全响应头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none'" always;
    
    location / {
        root /var/www/html;
        index index.html;
    }
}
```

---

## 🧪 在线测试工具

### 1. SecurityHeaders.com

```
https://securityheaders.com
```

输入你的网址，获得安全评级（A+ 到 F）

### 2. Mozilla Observatory

```
https://observatory.mozilla.org
```

全面的安全扫描和建议

### 3. 浏览器开发者工具

```javascript
// 在浏览器控制台运行
fetch('https://your-site.com')
  .then(res => {
    console.log('Security Headers:');
    console.log('X-Frame-Options:', res.headers.get('X-Frame-Options'));
    console.log('CSP:', res.headers.get('Content-Security-Policy'));
    console.log('HSTS:', res.headers.get('Strict-Transport-Security'));
    console.log('X-Content-Type:', res.headers.get('X-Content-Type-Options'));
  });
```

---

## 📊 安全等级评估

### 基础安全（D 级）

```http
# 仅基本配置
X-Frame-Options: SAMEORIGIN
```

### 良好安全（C 级）

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### 优秀安全（B 级）

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000
```

### 卓越安全（A+ 级）

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## ⚠️ 常见问题

### 1. 设置了 X-Frame-Options 但仍能被嵌入？

**可能原因**：
- ❌ 响应头拼写错误
- ❌ 被其他中间件覆盖
- ❌ 只在部分路由设置

**解决方案**：
```javascript
// 确保在所有路由之前设置
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// 而不是
app.get('/', (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY'); // ❌ 只在单个路由
  res.send('Hello');
});
```

### 2. 需要允许特定网站嵌入怎么办？

使用 CSP 的 `frame-ancestors`：

```javascript
res.setHeader(
  'Content-Security-Policy',
  "frame-ancestors 'self' https://trusted-partner.com https://another-trusted.com"
);
```

### 3. 开发环境 iframe 被阻止？

```javascript
// 根据环境设置不同策略
const frameOption = process.env.NODE_ENV === 'production' 
  ? 'DENY' 
  : 'SAMEORIGIN';

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', frameOption);
  next();
});
```

---

## 📚 总结

### X-Frame-Options 速查

| 值 | 含义 | 使用场景 |
|----|------|---------|
| `DENY` | 禁止任何嵌入 | 银行、支付、敏感操作 |
| `SAMEORIGIN` | 只允许同源嵌入 | 一般网站、需要内部iframe |
| ~~`ALLOW-FROM`~~ | 已废弃 | 使用 CSP 替代 |

### 最佳实践

1. ✅ 默认设置 `X-Frame-Options: DENY`
2. ✅ 同时设置 CSP `frame-ancestors`
3. ✅ 配合其他安全头使用
4. ✅ 定期使用工具检测
5. ✅ 生产环境必须启用 HTTPS

### 安全头优先级

```
1️⃣ HTTPS (Strict-Transport-Security)
2️⃣ 防点击劫持 (X-Frame-Options / CSP frame-ancestors)
3️⃣ 防XSS (Content-Security-Policy)
4️⃣ 防MIME嗅探 (X-Content-Type-Options)
5️⃣ 隐私保护 (Referrer-Policy)
6️⃣ 功能限制 (Permissions-Policy)
```

**记住**：安全是一个整体，单一的响应头无法完全保护你的网站。需要多层防护！🛡️

