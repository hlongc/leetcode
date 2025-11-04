# CSP (Content Security Policy) 内容安全策略详解

## 🎯 什么是 CSP 白名单？

**CSP 白名单**是指在 Content Security Policy 中明确指定的**允许加载资源的来源列表**。只有在白名单中的来源才能加载对应类型的资源，其他来源的资源会被浏览器阻止。

### 核心概念

```http
Content-Security-Policy: script-src 'self' https://cdn.example.com
                         ↑          ↑     ↑
                         指令    白名单1  白名单2
```

**解读**：

- `script-src`：指令（控制脚本来源）
- `'self'`：白名单项 1（允许同源脚本）
- `https://cdn.example.com`：白名单项 2（允许来自这个 CDN 的脚本）
- 其他来源的脚本 → ❌ 被阻止

---

## 🛡️ 为什么需要 CSP 白名单？

### 防止 XSS 攻击

```html
<!-- 假设网站存在 XSS 漏洞 -->
<div id="content">
  <!-- 攻击者注入的恶意脚本 -->
  <script src="https://evil.com/steal-cookies.js"></script>
</div>
```

**没有 CSP**：

```
恶意脚本会执行 → 窃取用户信息 💥
```

**有 CSP 白名单**：

```http
Content-Security-Policy: script-src 'self' https://cdn.example.com
```

```
evil.com 不在白名单中 → 脚本被阻止 ✅
浏览器控制台显示：
"Refused to load the script 'https://evil.com/steal-cookies.js'
because it violates the following Content Security Policy directive:
'script-src 'self' https://cdn.example.com'"
```

---

## 📋 CSP 指令和白名单语法

### 常用指令

| 指令              | 控制的资源类型                    | 示例                                   |
| ----------------- | --------------------------------- | -------------------------------------- |
| `default-src`     | 默认策略（其他指令的后备）        | `default-src 'self'`                   |
| `script-src`      | JavaScript                        | `script-src 'self' https://cdn.com`    |
| `style-src`       | CSS 样式                          | `style-src 'self' 'unsafe-inline'`     |
| `img-src`         | 图片                              | `img-src 'self' data: https:`          |
| `font-src`        | 字体                              | `font-src 'self' https://fonts.com`    |
| `connect-src`     | AJAX、WebSocket、Fetch            | `connect-src 'self' https://api.com`   |
| `media-src`       | 音视频                            | `media-src 'self' https://video.com`   |
| `object-src`      | `<object>`、`<embed>`、`<applet>` | `object-src 'none'`                    |
| `frame-src`       | iframe                            | `frame-src 'self' https://trusted.com` |
| `frame-ancestors` | 谁能嵌入此页面                    | `frame-ancestors 'self'`               |
| `base-uri`        | `<base>` 标签                     | `base-uri 'self'`                      |
| `form-action`     | 表单提交目标                      | `form-action 'self'`                   |

### 白名单值的类型

```http
Content-Security-Policy:
  script-src
    'none'                          # 1. 特殊关键字：禁止所有
    'self'                          # 2. 特殊关键字：同源
    'unsafe-inline'                 # 3. 特殊关键字：允许内联脚本
    'unsafe-eval'                   # 4. 特殊关键字：允许 eval()
    https://cdn.example.com         # 5. 具体域名
    https://cdn.example.com/lib/    # 6. 具体路径
    *.example.com                   # 7. 通配符域名
    https:                          # 8. 协议
    data:                           # 9. data: URL
    'nonce-2726c7f26c'              # 10. nonce（随机数）
    'sha256-xxx...'                 # 11. 哈希值
```

---

## 🔑 特殊关键字详解

### 1. `'none'` - 禁止所有

```http
Content-Security-Policy: object-src 'none'
```

**含义**：完全禁止加载此类型的资源

```html
<!-- ❌ 会被阻止 -->
<object data="flash.swf"></object>
<embed src="plugin.swf" />
```

### 2. `'self'` - 仅同源

```http
Content-Security-Policy: script-src 'self'
```

**含义**：只允许同源（相同协议、域名、端口）的资源

```html
<!-- 假设当前页面是 https://example.com -->

<!-- ✅ 允许：同源 -->
<script src="/js/app.js"></script>
<script src="https://example.com/js/lib.js"></script>

<!-- ❌ 阻止：不同域名 -->
<script src="https://cdn.com/jquery.js"></script>

<!-- ❌ 阻止：不同协议 -->
<script src="http://example.com/app.js"></script>

<!-- ❌ 阻止：不同端口 -->
<script src="https://example.com:8080/app.js"></script>
```

### 3. `'unsafe-inline'` - 允许内联代码

```http
Content-Security-Policy: script-src 'self' 'unsafe-inline'
```

**含义**：允许内联的 JavaScript/CSS

```html
<!-- ✅ 允许内联脚本 -->
<script>
  console.log("Hello");
</script>

<!-- ✅ 允许内联事件处理器 -->
<button onclick="alert('click')">Click</button>

<!-- ✅ 允许 javascript: URL -->
<a href="javascript:void(0)">Link</a>
```

**⚠️ 警告**：`'unsafe-inline'` 会降低安全性，建议使用 nonce 或 hash 替代！

### 4. `'unsafe-eval'` - 允许 eval()

```http
Content-Security-Policy: script-src 'self' 'unsafe-eval'
```

**含义**：允许使用 `eval()`、`new Function()` 等动态代码执行

```javascript
// ✅ 允许
eval('console.log("hello")');
new Function("a", "b", "return a + b");
setTimeout('console.log("timeout")', 1000);
```

**⚠️ 警告**：`'unsafe-eval'` 非常危险，应避免使用！

### 5. 域名白名单

```http
Content-Security-Policy: script-src 'self' https://cdn.example.com
```

```html
<!-- ✅ 允许 -->
<script src="https://cdn.example.com/jquery.js"></script>

<!-- ❌ 阻止：不在白名单 -->
<script src="https://other-cdn.com/lib.js"></script>

<!-- ❌ 阻止：协议不匹配（http vs https） -->
<script src="http://cdn.example.com/lib.js"></script>
```

### 6. 路径白名单

```http
Content-Security-Policy: script-src https://cdn.example.com/libs/
```

```html
<!-- ✅ 允许：在指定路径下 -->
<script src="https://cdn.example.com/libs/jquery.js"></script>

<!-- ❌ 阻止：不在指定路径 -->
<script src="https://cdn.example.com/other/lib.js"></script>
```

### 7. 通配符域名

```http
Content-Security-Policy: img-src 'self' *.example.com
```

```html
<!-- ✅ 允许：匹配通配符 -->
<img src="https://cdn.example.com/logo.png" />
<img src="https://static.example.com/bg.jpg" />

<!-- ❌ 阻止：不匹配 -->
<img src="https://example.com.cn/pic.png" />
```

**⚠️ 注意**：通配符只能用于子域名，不能用于协议或端口

### 8. 协议白名单

```http
Content-Security-Policy: img-src 'self' https: data:
```

```html
<!-- ✅ 允许：HTTPS 协议 -->
<img src="https://any-cdn.com/image.jpg" />

<!-- ✅ 允许：data: URL -->
<img src="data:image/png;base64,iVBORw0KGgo..." />

<!-- ❌ 阻止：HTTP 协议 -->
<img src="http://cdn.com/image.jpg" />
```

### 9. nonce（推荐替代 unsafe-inline）

```http
Content-Security-Policy: script-src 'self' 'nonce-r4nd0m123456'
```

**每次请求生成不同的随机数**：

```html
<!-- ✅ 允许：nonce 匹配 -->
<script nonce="r4nd0m123456">
  console.log("This is allowed");
</script>

<!-- ❌ 阻止：nonce 不匹配 -->
<script nonce="wrong-nonce">
  console.log("This is blocked");
</script>

<!-- ❌ 阻止：没有 nonce -->
<script>
  console.log("This is blocked");
</script>
```

**服务器端实现（Node.js/Express）**：

```javascript
const crypto = require("crypto");

app.use((req, res, next) => {
  // 生成随机 nonce
  const nonce = crypto.randomBytes(16).toString("base64");

  // 设置 CSP 头
  res.setHeader(
    "Content-Security-Policy",
    `script-src 'self' 'nonce-${nonce}'`
  );

  // 传递给模板
  res.locals.nonce = nonce;
  next();
});

// 在模板中使用
// <script nonce="<%= nonce %>">...</script>
```

### 10. hash（针对特定内联脚本）

```http
Content-Security-Policy: script-src 'self' 'sha256-xxx...'
```

**计算脚本的 SHA-256 哈希**：

```html
<script>
  console.log("Hello, World!");
</script>
```

```bash
# 计算哈希值
echo -n "console.log('Hello, World!');" | openssl dgst -sha256 -binary | base64
# 输出：qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng=
```

```http
Content-Security-Policy: script-src 'self' 'sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng='
```

**浏览器会自动计算内联脚本的哈希并比对**：

- ✅ 哈希匹配 → 允许执行
- ❌ 哈希不匹配 → 阻止执行

---

## 🌟 实战示例

### 示例 1：最小化 CSP（严格）

```http
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
```

**说明**：

- 默认拒绝所有
- 只允许同源资源
- 图片额外允许 data: URL
- 禁止被嵌入 iframe

### 示例 2：常规网站 CSP

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: *.gravatar.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com;
  frame-src https://www.youtube.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self'
```

**说明**：

- 允许指定的 CDN 加载脚本
- 允许内联样式（因为很多组件需要）
- 允许 HTTPS 图片
- 允许嵌入 YouTube 视频
- 禁止 Flash 等插件

### 示例 3：使用 nonce（推荐）

```javascript
// 服务器端
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; ` +
      `script-src 'self' 'nonce-${nonce}'; ` +
      `style-src 'self' 'nonce-${nonce}'`
  );

  res.locals.scriptNonce = nonce;
  next();
});
```

```html
<!-- HTML 模板 -->
<!DOCTYPE html>
<html>
  <head>
    <!-- ✅ 使用 nonce -->
    <style nonce="<%= scriptNonce %>">
      body {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <script nonce="<%= scriptNonce %>">
      console.log("Inline script with nonce");
    </script>

    <!-- ✅ 外部脚本不需要 nonce -->
    <script src="/js/app.js"></script>
  </body>
</html>
```

### 示例 4：渐进增强策略（Report-Only）

```http
Content-Security-Policy-Report-Only:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  report-uri /csp-violation-report
```

**说明**：

- 使用 `Report-Only` 模式：不阻止，只报告违规
- 适合测试阶段，观察哪些资源会被阻止
- 违规报告发送到 `/csp-violation-report`

**接收违规报告**：

```javascript
app.post(
  "/csp-violation-report",
  express.json({ type: "application/csp-report" }),
  (req, res) => {
    console.log("CSP Violation:", JSON.stringify(req.body, null, 2));

    // 示例报告：
    // {
    //   "csp-report": {
    //     "document-uri": "https://example.com/page",
    //     "violated-directive": "script-src 'self'",
    //     "blocked-uri": "https://evil.com/malicious.js",
    //     "original-policy": "default-src 'self'; script-src 'self'"
    //   }
    // }

    res.status(204).end();
  }
);
```

---

## 🔍 CSP 白名单的优先级

### 指令优先级

```http
Content-Security-Policy:
  default-src 'self';
  script-src https://cdn.com;
  img-src *
```

**规则**：

1. 具体指令优先于 `default-src`
2. `script-src` 不会继承 `default-src 'self'`
3. 如果没有 `script-src`，才使用 `default-src`

```html
<!-- script-src 的白名单是 https://cdn.com -->
<script src="https://cdn.com/lib.js"></script>
<!-- ✅ -->
<script src="/app.js"></script>
<!-- ❌ 同源也被阻止 -->

<!-- img-src 的白名单是 * （所有来源） -->
<img src="https://any.com/pic.jpg" />
<!-- ✅ -->
<img src="/logo.png" />
<!-- ✅ -->

<!-- style-src 没有指定，使用 default-src -->
<link rel="stylesheet" href="/style.css" />
<!-- ✅ 同源 -->
<link rel="stylesheet" href="https://cdn.com/" />
<!-- ❌ 不同源 -->
```

---

## ⚠️ 常见错误和解决方案

### 错误 1：忘记添加 'self'

```http
❌ Content-Security-Policy: script-src https://cdn.com
```

**问题**：自己网站的脚本也被阻止了！

```html
<script src="/app.js"></script>
<!-- ❌ 被阻止 -->
```

**解决**：

```http
✅ Content-Security-Policy: script-src 'self' https://cdn.com
```

### 错误 2：滥用 'unsafe-inline'

```http
❌ Content-Security-Policy: script-src 'self' 'unsafe-inline'
```

**问题**：允许所有内联脚本，XSS 攻击仍然有效！

**解决**：使用 nonce 或 hash

```http
✅ Content-Security-Policy: script-src 'self' 'nonce-xxx'
```

### 错误 3：忘记协议

```http
❌ Content-Security-Policy: script-src cdn.example.com
```

**问题**：只允许 `http://cdn.example.com`，不允许 HTTPS！

**解决**：

```http
✅ Content-Security-Policy: script-src https://cdn.example.com
```

### 错误 4：混合使用 nonce 和 unsafe-inline

```http
❌ Content-Security-Policy: script-src 'self' 'nonce-xxx' 'unsafe-inline'
```

**问题**：nonce 会被 unsafe-inline 削弱

**解决**：只使用 nonce

```http
✅ Content-Security-Policy: script-src 'self' 'nonce-xxx'
```

### 错误 5：忘记 data: URL

```http
❌ Content-Security-Policy: img-src 'self'
```

**问题**：Base64 编码的图片无法显示

```html
<img src="data:image/png;base64,iVBORw0KGgo..." />
<!-- ❌ -->
```

**解决**：

```http
✅ Content-Security-Policy: img-src 'self' data:
```

---

## 🧪 测试和调试

### 1. 浏览器开发者工具

```javascript
// 打开 Chrome DevTools
// Console 标签会显示 CSP 违规

// 示例错误：
"Refused to load the script 'https://evil.com/bad.js' because it
violates the following Content Security Policy directive:
'script-src 'self' https://cdn.com'"
```

### 2. CSP Evaluator（Google 工具）

```
https://csp-evaluator.withgoogle.com/

输入你的 CSP 策略，获取：
- 安全评分
- 潜在问题
- 改进建议
```

### 3. Report URI 服务

```http
Content-Security-Policy:
  default-src 'self';
  report-uri https://your-domain.report-uri.com/r/d/csp/enforce
```

**第三方服务**：

- https://report-uri.com
- https://sentry.io（也支持 CSP 报告）

### 4. 测试页面

```html
<!DOCTYPE html>
<html>
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'"
    />
    <title>CSP Test</title>
  </head>
  <body>
    <h1>CSP 测试</h1>

    <!-- ✅ 应该加载 -->
    <script src="/local.js"></script>

    <!-- ❌ 应该被阻止 -->
    <script src="https://cdn.com/external.js"></script>

    <!-- ❌ 应该被阻止 -->
    <script>
      alert("Inline script");
    </script>

    <p>打开控制台查看 CSP 违规报告</p>
  </body>
</html>
```

---

## 📊 CSP 白名单最佳实践

### ✅ 应该做的

1. **从严格开始，逐步放宽**

```http
# 第1步：最严格
Content-Security-Policy: default-src 'none'

# 第2步：只加载必需的资源
Content-Security-Policy: default-src 'self'

# 第3步：添加必要的白名单
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://trusted-cdn.com
```

2. **使用 nonce 替代 unsafe-inline**

```http
✅ script-src 'self' 'nonce-random123'
❌ script-src 'self' 'unsafe-inline'
```

3. **禁用危险的资源类型**

```http
object-src 'none';        # 禁用 Flash
base-uri 'self';          # 防止 <base> 标签攻击
form-action 'self';       # 限制表单提交目标
```

4. **使用 HTTPS**

```http
upgrade-insecure-requests;  # 自动升级 HTTP 到 HTTPS
```

5. **启用报告**

```http
Content-Security-Policy:
  default-src 'self';
  report-uri /csp-report;
  report-to csp-endpoint
```

### ❌ 不应该做的

1. **不要使用 unsafe-inline 和 unsafe-eval**

```http
❌ script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

2. **不要使用过于宽松的白名单**

```http
❌ script-src *              # 允许所有来源
❌ script-src https:         # 允许所有 HTTPS
❌ script-src 'unsafe-inline' # 允许所有内联
```

3. **不要忘记同源**

```http
❌ script-src https://cdn.com      # 忘记 'self'
✅ script-src 'self' https://cdn.com
```

---

## 🚀 完整配置示例

### Node.js / Express

```javascript
const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();

// 方案1：使用 helmet（简单）
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["https://www.youtube.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// 方案2：动态 nonce（推荐）
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; ` +
      `script-src 'self' 'nonce-${res.locals.nonce}'; ` +
      `style-src 'self' 'nonce-${res.locals.nonce}'; ` +
      `img-src 'self' data: https:; ` +
      `object-src 'none'; ` +
      `base-uri 'self'; ` +
      `form-action 'self'; ` +
      `frame-ancestors 'none'; ` +
      `upgrade-insecure-requests`
  );

  next();
});
```

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # CSP 白名单
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' https://cdn.jsdelivr.net https://www.google-analytics.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.example.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
        upgrade-insecure-requests
    " always;
}
```

---

## 📚 总结

### CSP 白名单的核心要点

1. **白名单是允许列表**：只有在列表中的来源才能加载资源
2. **每个指令独立**：`script-src`、`style-src` 等各自维护白名单
3. **特殊值要加引号**：`'self'`、`'none'`、`'unsafe-inline'` 等
4. **域名不加引号**：`https://cdn.com`
5. **优先级**：具体指令 > `default-src`

### 常用白名单配置模板

```http
# 严格模式（推荐）
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self';
  img-src 'self';
  object-src 'none'

# 标准模式（常用）
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  object-src 'none'

# 使用 nonce（最佳）
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}';
  object-src 'none'
```

CSP 白名单是现代 Web 安全的重要组成部分，正确配置可以有效防御 XSS 攻击！🛡️
