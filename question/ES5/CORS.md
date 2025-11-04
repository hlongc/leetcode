# CORS 预检请求详解

## 为什么非简单请求需要预检，简单请求不需要？

### 核心原因

#### 1. **简单请求在 CORS 之前就存在**

在 CORS 规范出现之前，这些请求就已经可以跨域发送了：

```html
<!-- ✅ 表单提交（一直允许跨域） -->
<form action="https://other-domain.com/api" method="POST">
  <input type="text" name="username" />
  <button type="submit">提交</button>
</form>

<!-- ✅ 图片、脚本、样式（一直允许跨域） -->
<img src="https://other-domain.com/image.jpg" />
<script src="https://other-domain.com/script.js"></script>
<link href="https://other-domain.com/style.css" />
```

**关键点**：

- 这些请求在没有 CORS 的时代就能发送
- 服务器早已习惯处理这类请求
- 如果突然要求预检，会破坏现有网站

#### 2. **非简单请求是"新"功能，可能有风险**

```javascript
// ❌ 在 CORS 之前，这些请求无法跨域发送

// 自定义请求头
fetch("https://api.example.com/data", {
  headers: {
    "X-Custom-Header": "value", // ⚠️ 自定义头
    "Content-Type": "application/json", // ⚠️ JSON 内容
  },
});

// PUT/DELETE 方法
fetch("https://api.example.com/resource", {
  method: "DELETE", // ⚠️ 危险方法
});
```

**为什么需要预检？**

- 服务器可能没准备好处理这些请求
- 可能对服务器造成副作用（删除、修改数据）
- 需要让服务器"同意"才能发送

---

## 简单请求 vs 非简单请求

### ✅ 简单请求（不需要预检）

必须同时满足以下所有条件：

**1. 请求方法只能是：**

- `GET`
- `HEAD`
- `POST`

**2. Content-Type 只能是：**

- `text/plain`
- `multipart/form-data`
- `application/x-www-form-urlencoded`

**3. 请求头只能包含：**

- `Accept`
- `Accept-Language`
- `Content-Language`
- `Content-Type`（仅限上述三种值）
- `Range`（简单范围）

**示例：简单请求**

```javascript
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "name=John&age=30",
});
```

### ⚠️ 非简单请求（需要预检）

只要不满足简单请求的任何一个条件：

```javascript
// 示例1：JSON 内容（需要预检）
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json", // ❌ 触发预检
  },
  body: JSON.stringify({ name: "John" }),
});

// 示例2：自定义请求头（需要预检）
fetch("https://api.example.com/data", {
  headers: {
    Authorization: "Bearer token", // ❌ 触发预检
    "X-Custom-Header": "value", // ❌ 触发预检
  },
});

// 示例3：PUT/DELETE 方法（需要预检）
fetch("https://api.example.com/resource", {
  method: "DELETE", // ❌ 触发预检
});
```

---

## 预检请求的工作流程

```
客户端（浏览器）                         服务器
      │                                     │
      │  1. 浏览器检测到非简单请求          │
      │                                     │
      │  2. 自动发送 OPTIONS 预检请求       │
      ├──────────────────────────────────→ │
      │  OPTIONS /api/data HTTP/1.1         │
      │  Origin: https://mysite.com         │
      │  Access-Control-Request-Method: POST│
      │  Access-Control-Request-Headers:    │
      │    Content-Type, Authorization      │
      │                                     │
      │  3. 服务器检查是否允许              │
      │     - 检查 Origin                   │
      │     - 检查 Method                   │
      │     - 检查 Headers                  │
      │                                     │
      │  4. 返回预检响应                    │
      │ ←────────────────────────────────  │
      │  HTTP/1.1 200 OK                    │
      │  Access-Control-Allow-Origin: *     │
      │  Access-Control-Allow-Methods:      │
      │    GET, POST, PUT, DELETE           │
      │  Access-Control-Allow-Headers:      │
      │    Content-Type, Authorization      │
      │  Access-Control-Max-Age: 86400      │
      │                                     │
      │  5. 预检通过，发送实际请求          │
      ├──────────────────────────────────→ │
      │  POST /api/data HTTP/1.1            │
      │  Content-Type: application/json     │
      │  Authorization: Bearer token        │
      │  { "name": "John" }                 │
      │                                     │
      │  6. 返回实际响应                    │
      │ ←────────────────────────────────  │
      │  HTTP/1.1 200 OK                    │
      │  { "success": true }                │
```

---

## 为什么这样设计？安全考虑

### 场景 1：防止对旧服务器的意外攻击

```javascript
// 假设某个旧 API 从未考虑过跨域请求
// 服务器代码（2010 年写的）
app.delete("/api/user/:id", (req, res) => {
  // 没有任何跨域检查
  // 直接删除用户
  deleteUser(req.params.id);
  res.send("Deleted");
});

// 如果没有预检机制，恶意网站可以直接发送：
fetch("https://old-api.com/api/user/123", {
  method: "DELETE", // 💀 直接删除，服务器来不及拒绝
});

// ✅ 有预检机制：
// 1. 浏览器先发送 OPTIONS 请求
// 2. 旧服务器没有配置 CORS，返回 403
// 3. 浏览器阻止实际的 DELETE 请求
// 4. 用户数据安全 ✓
```

### 场景 2：防止 CSRF 升级攻击

```javascript
// 简单请求（表单提交）：服务器已经有防护
// 例如：CSRF token, SameSite Cookie

// <form action="https://bank.com/transfer" method="POST">
//   <input name="amount" value="1000">
//   <input name="csrf_token" value="abc123">  <!-- 有防护 -->
// </form>

// 非简单请求：新的攻击向量
fetch("https://bank.com/api/transfer", {
  method: "POST",
  headers: {
    "Content-Type": "application/json", // 非简单请求
    "X-Transaction-Type": "wire", // 自定义头
  },
  body: JSON.stringify({
    amount: 1000000,
    to: "attacker-account",
  }),
});

// 预检请求给服务器机会说"不"
// 如果服务器没有配置允许这些头，请求被阻止
```

---

## 完整示例对比

### 示例 1：简单请求（无预检）

```javascript
// 前端
fetch("https://api.example.com/form", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "name=John&age=30",
});

// 浏览器行为：
// 1. 直接发送请求（不预检）
// 2. 服务器返回响应
// 3. 浏览器检查 CORS 头
// 4. 如果允许，暴露响应给 JS；否则报错

// 服务器（Node.js）
app.post("/form", (req, res) => {
  // 只需设置响应头
  res.header("Access-Control-Allow-Origin", "*");
  res.json({ success: true });
});
```

**网络请求：**

```http
→ POST /form HTTP/1.1
  Host: api.example.com
  Origin: https://mysite.com
  Content-Type: application/x-www-form-urlencoded

  name=John&age=30

← HTTP/1.1 200 OK
  Access-Control-Allow-Origin: *
  Content-Type: application/json

  {"success":true}
```

### 示例 2：非简单请求（有预检）

```javascript
// 前端
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json", // 触发预检
    Authorization: "Bearer token123", // 触发预检
  },
  body: JSON.stringify({ name: "John" }),
});

// 服务器（Node.js）
app.options("/data", (req, res) => {
  // ✅ 处理预检请求
  res.header("Access-Control-Allow-Origin", "https://mysite.com");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Max-Age", "86400"); // 缓存 24 小时
  res.sendStatus(204);
});

app.post("/data", (req, res) => {
  // ✅ 处理实际请求
  res.header("Access-Control-Allow-Origin", "https://mysite.com");
  res.json({ success: true });
});
```

**网络请求：**

```http
→ OPTIONS /data HTTP/1.1                    (预检请求)
  Host: api.example.com
  Origin: https://mysite.com
  Access-Control-Request-Method: POST
  Access-Control-Request-Headers: content-type, authorization

← HTTP/1.1 204 No Content                   (预检响应)
  Access-Control-Allow-Origin: https://mysite.com
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: content-type, authorization
  Access-Control-Max-Age: 86400

→ POST /data HTTP/1.1                       (实际请求)
  Host: api.example.com
  Origin: https://mysite.com
  Content-Type: application/json
  Authorization: Bearer token123

  {"name":"John"}

← HTTP/1.1 200 OK                           (实际响应)
  Access-Control-Allow-Origin: https://mysite.com
  Content-Type: application/json

  {"success":true}
```

---

## 历史背景

```
时间线：

1995-2005
┌────────────────────────────────────┐
│ Web 1.0 时代                        │
│ - 可以跨域加载资源（img, script）   │
│ - 表单可以跨域提交                  │
│ - AJAX 同源策略限制                 │
└────────────────────────────────────┘

2006-2010
┌────────────────────────────────────┐
│ AJAX 流行，但受同源策略限制          │
│ - 开发者需要跨域请求                │
│ - JSONP 等 hack 出现                │
│ - 需要标准化的跨域方案              │
└────────────────────────────────────┘

2010+
┌────────────────────────────────────┐
│ CORS 规范制定                       │
│ 设计原则：                          │
│ 1. 兼容现有（简单请求无预检）       │
│ 2. 保护旧服务器（新请求需预检）     │
│ 3. 服务器明确授权                  │
└────────────────────────────────────┘
```

---

## 为什么不全部使用预检？

### 1. 性能考虑

```javascript
// 如果所有请求都预检：

// 简单的 GET 请求
fetch("https://api.example.com/data");

// 需要发送两次请求：
// 1. OPTIONS 预检      ← 额外的网络往返
// 2. GET 实际请求

// 对于高频请求，这会严重影响性能
// 例如：每次页面加载都要预检多个 API
```

### 2. 向后兼容

```javascript
// 大量现有网站使用简单请求
// 例如：表单提交、普通 AJAX

// 如果突然要求预检：
// ❌ 数百万网站会立即崩溃
// ❌ 旧服务器不知道如何响应 OPTIONS
// ❌ 整个 Web 生态系统受影响
```

---

## 总结对比表

| 特性             | 简单请求        | 非简单请求            |
| ---------------- | --------------- | --------------------- |
| **是否预检**     | ❌ 否           | ✅ 是（OPTIONS）      |
| **历史**         | CORS 之前就存在 | CORS 引入的新能力     |
| **方法**         | GET, HEAD, POST | PUT, DELETE, PATCH 等 |
| **Content-Type** | 表单类型        | application/json 等   |
| **自定义头**     | ❌ 不允许       | ✅ 允许               |
| **性能**         | 快（1 次请求）  | 慢（2 次请求）        |
| **安全性**       | 服务器已有防护  | 需要额外检查          |

---

## 关键要点

### 为什么简单请求不需要预检？

1. ✅ **向后兼容** - 这些请求在 CORS 之前就能发送
2. ✅ **服务器已适应** - 已有 CSRF 等防护机制
3. ✅ **性能优化** - 避免额外的网络往返
4. ✅ **避免破坏现有网站** - 不能突然改变行为

### 为什么非简单请求需要预检？

1. ⚠️ **新功能** - 服务器可能没准备好
2. ⚠️ **潜在危险** - 自定义头、危险方法
3. ⚠️ **保护旧服务器** - 给服务器拒绝的机会
4. ⚠️ **明确授权** - 服务器必须显式允许

---

## 常见 CORS 响应头

### 预检请求响应头

```http
Access-Control-Allow-Origin: https://example.com
# 允许的源，不能是 * 如果需要携带凭证

Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# 允许的 HTTP 方法

Access-Control-Allow-Headers: Content-Type, Authorization, X-Custom-Header
# 允许的请求头

Access-Control-Max-Age: 86400
# 预检结果缓存时间（秒），减少预检请求

Access-Control-Allow-Credentials: true
# 是否允许携带凭证（Cookie、HTTP 认证等）
```

### 实际请求响应头

```http
Access-Control-Allow-Origin: https://example.com
# 必须：允许的源

Access-Control-Expose-Headers: X-Custom-Response-Header
# 可选：允许 JS 访问的响应头

Access-Control-Allow-Credentials: true
# 可选：如果需要携带凭证
```

---

## 最佳实践

### 1. 服务器端配置

```javascript
// Express.js 示例
const cors = require("cors");

// 方式1：简单配置（允许所有源）
app.use(cors());

// 方式2：详细配置（推荐）
app.use(
  cors({
    origin: "https://trusted-site.com", // 或使用函数动态判断
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Total-Count"],
    credentials: true, // 允许携带凭证
    maxAge: 86400, // 预检缓存 24 小时
  })
);

// 方式3：动态配置
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = ["https://site1.com", "https://site2.com"];
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
```

### 2. 前端最佳实践

```javascript
// 1. 尽量使用简单请求（性能更好）
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded", // 简单请求
  },
  body: new URLSearchParams({ name: "John", age: 30 }),
});

// 2. 如果必须使用 JSON，确保服务器配置了预检
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "John" }),
});

// 3. 携带凭证时的配置
fetch("https://api.example.com/data", {
  credentials: "include", // 携带 Cookie
  headers: {
    Authorization: "Bearer token",
  },
});
```

---

## 调试 CORS 问题

### 常见错误

```
1. Access to fetch at 'https://api.example.com' from origin 'https://mysite.com'
   has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.

   → 解决：服务器需要添加 Access-Control-Allow-Origin 响应头

2. Access to fetch at 'https://api.example.com' has been blocked by CORS policy:
   Response to preflight request doesn't pass access control check.

   → 解决：服务器需要正确处理 OPTIONS 预检请求

3. Access to fetch at 'https://api.example.com' has been blocked by CORS policy:
   The value of the 'Access-Control-Allow-Origin' header must not be '*'
   when the request's credentials mode is 'include'.

   → 解决：使用凭证时，必须指定具体的源，不能使用 *
```

### 调试技巧

1. **查看浏览器控制台 Network 标签**

   - 检查是否发送了 OPTIONS 预检请求
   - 检查预检响应头是否正确
   - 检查实际请求的响应头

2. **使用 curl 测试**

   ```bash
   # 测试预检请求
   curl -X OPTIONS https://api.example.com/data \
     -H "Origin: https://mysite.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v
   ```

3. **临时禁用 CORS（仅开发环境）**
   ```bash
   # Chrome 禁用同源策略（仅用于测试！）
   open -na "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome
   ```

---

**这是一个安全性和兼容性之间精心设计的平衡！**
