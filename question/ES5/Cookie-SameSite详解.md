# Cookie SameSite 属性详解

## 🎯 核心问题

**SameSite=Lax 如何控制 Cookie 的发送？顶级域名不同会发送吗？**

---

## 📖 SameSite 属性概述

### 三种模式

```javascript
// 设置 Cookie 时指定 SameSite
res.cookie('sessionId', 'abc123', {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict'  // 或 'Lax' 或 'None'
});

const sameSiteModes = {
  // Strict - 最严格
  strict: {
    rule: '完全禁止第三方请求携带 Cookie',
    send: '只有同站请求才发送',
    security: '⭐⭐⭐⭐⭐ 最安全'
  },
  
  // Lax - 部分允许（默认值）
  lax: {
    rule: '部分第三方请求可以携带 Cookie',
    send: '同站请求 + 顶级导航的 GET 请求',
    security: '⭐⭐⭐⭐ 较安全',
    default: '✅ Chrome 80+ 的默认值'
  },
  
  // None - 完全允许
  none: {
    rule: '所有跨站请求都可以携带 Cookie',
    send: '任何请求都发送',
    security: '⭐ 不安全',
    requirement: '必须同时设置 Secure（HTTPS）'
  }
};
```

---

## 🔍 SameSite=Lax 的详细规则

### 什么是"同站"（Same-Site）？

```javascript
/**
 * 同站判断：比较 eTLD+1（有效顶级域名+1级域名）
 */

const sameSiteDefinition = {
  // eTLD+1（Effective Top-Level Domain + 1）
  concept: '有效顶级域名 + 一级域名',
  
  examples: {
    // 同站（Same-Site）
    sameSite: [
      'https://example.com  ←→  https://www.example.com',
      'https://example.com  ←→  https://sub.example.com',
      'https://example.com  ←→  http://example.com',  // 协议不同也算同站！
      'https://a.example.com ←→ https://b.example.com'
    ],
    
    // 跨站（Cross-Site）
    crossSite: [
      'https://example.com  ←→  https://other.com',      // 不同域名
      'https://example.com  ←→  https://example.org',    // 不同顶级域名
      'https://example.co.uk ←→ https://example.com',    // 不同国家域名
      'https://github.io    ←→  https://example.github.io' // 公共后缀
    ]
  },
  
  // eTLD+1 分解
  breakdown: {
    'www.example.com': {
      eTLD: 'com',           // 顶级域名
      eTLDPlus1: 'example.com'  // eTLD+1（用于判断）
    },
    
    'sub.blog.example.com': {
      eTLD: 'com',
      eTLDPlus1: 'example.com'  // 与 www.example.com 相同 → 同站
    },
    
    'example.co.uk': {
      eTLD: 'co.uk',         // 英国的顶级域名
      eTLDPlus1: 'example.co.uk'
    }
  }
};
```

### Lax 模式的具体规则

```javascript
/**
 * SameSite=Lax 何时发送 Cookie？
 */

const laxRules = {
  // ✅ 情况1：同站请求（总是发送）
  sameSiteRequest: {
    scenario: '在 example.com 页面上请求 example.com 的资源',
    
    examples: [
      {
        from: 'https://www.example.com/page',
        to: 'https://api.example.com/data',
        method: 'GET/POST/PUT/DELETE',
        result: '✅ 发送 Cookie（同站）'
      },
      {
        from: 'https://sub.example.com',
        to: 'https://example.com/api',
        method: 'ANY',
        result: '✅ 发送 Cookie（同站）'
      }
    ]
  },
  
  // ✅ 情况2：顶级导航（Top-Level Navigation）的 GET 请求
  topLevelNavigation: {
    definition: '导致浏览器地址栏 URL 变化的导航',
    
    allowed: [
      {
        scenario: '从 other.com 点击链接到 example.com',
        detail: '<a href="https://example.com">链接</a>',
        method: 'GET',
        navigation: true,
        result: '✅ 发送 Cookie'
      },
      {
        scenario: '从 other.com 提交 GET 表单到 example.com',
        detail: '<form action="https://example.com" method="GET">',
        method: 'GET',
        navigation: true,
        result: '✅ 发送 Cookie'
      },
      {
        scenario: '从 other.com 使用 window.location 跳转',
        detail: 'window.location = "https://example.com"',
        method: 'GET',
        navigation: true,
        result: '✅ 发送 Cookie'
      }
    ]
  },
  
  // ❌ 情况3：跨站的非顶级导航请求
  crossSiteNonTopLevel: {
    blocked: [
      {
        scenario: '从 other.com 的 iframe 发送请求',
        detail: '<iframe src="https://example.com">',
        navigation: false,
        result: '❌ 不发送 Cookie（非顶级导航）'
      },
      {
        scenario: '从 other.com 的 AJAX 请求',
        detail: 'fetch("https://example.com/api")',
        method: 'GET/POST',
        navigation: false,
        result: '❌ 不发送 Cookie'
      },
      {
        scenario: '从 other.com 提交 POST 表单',
        detail: '<form action="https://example.com" method="POST">',
        method: 'POST',
        navigation: true,  // 虽然是导航
        result: '❌ 不发送 Cookie（不是 GET）'
      },
      {
        scenario: '从 other.com 加载图片',
        detail: '<img src="https://example.com/image.jpg">',
        method: 'GET',
        navigation: false,
        result: '❌ 不发送 Cookie（非导航）'
      }
    ]
  }
};
```

---

## 📊 详细对比表

### SameSite=Lax 的发送规则

| 场景 | 从 other.com 到 example.com | 方法 | 导航 | 发送 Cookie？ |
|------|---------------------------|------|------|-------------|
| 点击链接 | `<a href="https://example.com">` | GET | ✅ 是 | ✅ 发送 |
| GET 表单 | `<form method="GET">` | GET | ✅ 是 | ✅ 发送 |
| window.location | `location.href = "https://example.com"` | GET | ✅ 是 | ✅ 发送 |
| POST 表单 | `<form method="POST">` | POST | ✅ 是 | ❌ 不发送 |
| AJAX/Fetch | `fetch("https://example.com/api")` | ANY | ❌ 否 | ❌ 不发送 |
| iframe | `<iframe src="https://example.com">` | GET | ❌ 否 | ❌ 不发送 |
| img/script | `<img src="https://example.com/img">` | GET | ❌ 否 | ❌ 不发送 |

### 三种模式完整对比

| 场景 | Strict | Lax | None |
|------|--------|-----|------|
| 同站请求 | ✅ | ✅ | ✅ |
| 跨站点击链接（GET） | ❌ | ✅ | ✅ |
| 跨站 GET 表单 | ❌ | ✅ | ✅ |
| 跨站 POST 表单 | ❌ | ❌ | ✅ |
| 跨站 AJAX | ❌ | ❌ | ✅ |
| 跨站 iframe | ❌ | ❌ | ✅ |
| 跨站 img | ❌ | ❌ | ✅ |

---

## 🔍 顶级域名不同会发送吗？

### 答案：取决于具体场景！

```javascript
/**
 * 场景分析：从 other.com 到 example.com
 * （顶级域名不同 → 跨站）
 */

const crossSiteScenarios = {
  // Cookie 设置
  cookie: {
    domain: 'example.com',
    sameSite: 'Lax'
  },
  
  // 场景1：用户点击链接（顶级导航 GET）
  scenario1: {
    from: 'https://other.com/page',
    action: '用户点击 <a href="https://example.com/dashboard">',
    method: 'GET',
    navigation: true,
    result: '✅ 发送 Cookie',
    reason: '满足 Lax 的"顶级导航 GET"条件',
    
    userExperience: `
      用户在 other.com 看到链接
      → 点击链接
      → 浏览器跳转到 example.com
      → 携带 Cookie
      → 用户看到已登录状态（保持登录）✅
    `
  },
  
  // 场景2：POST 表单提交
  scenario2: {
    from: 'https://other.com/page',
    action: '<form action="https://example.com/api" method="POST">',
    method: 'POST',
    navigation: true,
    result: '❌ 不发送 Cookie',
    reason: 'Lax 不允许跨站 POST（防止 CSRF）',
    
    security: `
      这是 Lax 的关键安全特性！
      
      恶意网站（other.com）上的表单：
      <form action="https://bank.com/transfer" method="POST">
        <input name="to" value="attacker">
        <input name="amount" value="10000">
      </form>
      
      如果发送 Cookie → 转账成功 → CSRF 攻击！💥
      Lax 模式阻止了这种攻击 ✅
    `
  },
  
  // 场景3：AJAX 请求
  scenario3: {
    from: 'https://other.com/page',
    action: 'fetch("https://example.com/api")',
    method: 'GET/POST',
    navigation: false,
    result: '❌ 不发送 Cookie',
    reason: '不是顶级导航'
  },
  
  // 场景4：iframe 嵌入
  scenario4: {
    from: 'https://other.com/page',
    action: '<iframe src="https://example.com/widget">',
    method: 'GET',
    navigation: false,
    result: '❌ 不发送 Cookie',
    reason: '不是顶级导航（是子框架）'
  },
  
  // 场景5：图片、脚本等资源
  scenario5: {
    from: 'https://other.com/page',
    action: '<img src="https://example.com/avatar.jpg">',
    method: 'GET',
    navigation: false,
    result: '❌ 不发送 Cookie',
    reason: '不是导航请求'
  }
};
```

---

## 🎯 什么是"顶级导航"（Top-Level Navigation）？

### 定义

```javascript
/**
 * 顶级导航 = 导致浏览器地址栏 URL 变化的导航
 */

const topLevelNavigation = {
  // ✅ 是顶级导航
  yes: [
    '用户点击链接: <a href="...">',
    '用户提交表单（会跳转）',
    'JavaScript 跳转: window.location.href = "..."',
    '浏览器前进/后退按钮',
    '书签跳转',
    '地址栏输入 URL'
  ],
  
  // ❌ 不是顶级导航
  no: [
    'AJAX/Fetch 请求（页面不跳转）',
    'iframe 加载（地址栏不变）',
    '图片、CSS、JS 等资源加载',
    'WebSocket 连接',
    '<img> <script> <link> 等标签'
  ]
};
```

### 图解说明

```
✅ 顶级导航（地址栏变化）:

other.com (用户当前页面)
    ↓ 点击链接
    ↓ 浏览器地址栏变化
example.com (跳转到新页面)
    ↑
  地址栏: https://example.com  ← 变了！


❌ 非顶级导航（地址栏不变）:

other.com (用户当前页面)
    ↓ 发送 AJAX
    ↓ 或加载 iframe/img
example.com (请求资源)
    ↑
  地址栏: https://other.com  ← 没变！
```

---

## 💻 具体示例

### 示例1：点击链接（Lax 发送 Cookie）

```html
<!-- ============================================ -->
<!-- 页面：https://other.com/page.html -->
<!-- ============================================ -->
<!DOCTYPE html>
<html>
<body>
  <h1>这是 other.com</h1>
  
  <!-- 用户点击这个链接 -->
  <a href="https://example.com/dashboard">
    去 example.com 的仪表板
  </a>
</body>
</html>

<!-- 
  用户点击链接：
  
  1. 浏览器发起 GET 请求到 example.com
  2. 这是顶级导航（地址栏会变）
  3. 方法是 GET
  4. example.com 的 Cookie（SameSite=Lax）会被发送 ✅
  
  请求头：
  GET /dashboard HTTP/1.1
  Host: example.com
  Cookie: sessionId=abc123  ← Lax 允许发送
  
  结果：
  - 用户跳转到 example.com
  - 看到已登录状态（因为发送了 Cookie）
  - 用户体验好 ✅
-->
```

### 示例2：POST 表单（Lax 不发送 Cookie）

```html
<!-- ============================================ -->
<!-- 页面：https://attacker.com/evil.html -->
<!-- ============================================ -->
<!DOCTYPE html>
<html>
<body>
  <h1>恶意页面</h1>
  
  <!-- CSRF 攻击尝试 -->
  <form action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker-account">
    <input type="hidden" name="amount" value="10000">
    <button type="submit">点击领奖</button>
  </form>
  
  <script>
    // 或自动提交
    // document.forms[0].submit();
  </script>
</body>
</html>

<!-- 
  用户点击提交：
  
  1. 浏览器发起 POST 请求到 bank.com
  2. 这是顶级导航（表单提交会跳转）
  3. 但方法是 POST（不是 GET）
  4. bank.com 的 Cookie（SameSite=Lax）不会发送 ❌
  
  请求头：
  POST /transfer HTTP/1.1
  Host: bank.com
  Cookie: (无)  ← Lax 阻止了 POST
  
  结果：
  - 请求到达服务器，但没有 Cookie
  - 服务器认为用户未登录
  - 转账失败
  - CSRF 攻击被阻止 ✅
-->
```

### 示例3：AJAX 请求（Lax 不发送 Cookie）

```html
<!-- ============================================ -->
<!-- 页面：https://other.com/page.html -->
<!-- ============================================ -->
<!DOCTYPE html>
<html>
<body>
  <script>
    // 发送 AJAX 到 example.com
    fetch('https://example.com/api/user', {
      method: 'GET',
      credentials: 'include'  // 尝试携带 Cookie
    })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
  </script>
</body>
</html>

<!-- 
  AJAX 请求：
  
  1. 这是跨站请求（other.com → example.com）
  2. 不是顶级导航（地址栏不变，仍然是 other.com）
  3. example.com 的 Cookie（SameSite=Lax）不会发送 ❌
  
  请求头：
  GET /api/user HTTP/1.1
  Host: example.com
  Cookie: (无)  ← Lax 不发送
  
  结果：
  - 请求失败或返回未登录
  - 跨站 AJAX 读取数据被阻止
  - 安全 ✅
-->
```

### 示例4：iframe 嵌入（Lax 不发送 Cookie）

```html
<!-- ============================================ -->
<!-- 页面：https://other.com/page.html -->
<!-- ============================================ -->
<!DOCTYPE html>
<html>
<body>
  <!-- 嵌入 example.com 的内容 -->
  <iframe src="https://example.com/widget"></iframe>
</body>
</html>

<!-- 
  iframe 加载：
  
  1. 这是跨站请求（other.com → example.com）
  2. 不是顶级导航（地址栏仍是 other.com）
  3. example.com 的 Cookie（SameSite=Lax）不会发送 ❌
  
  请求头：
  GET /widget HTTP/1.1
  Host: example.com
  Cookie: (无)  ← Lax 不发送
  
  结果：
  - iframe 中显示未登录状态
  - 防止跨站读取用户数据
-->
```

---

## 🆚 三种模式的实际对比

### 实际测试

```javascript
// ============================================
// 服务器设置（Node.js/Express）
// ============================================

// 设置三种不同的 Cookie
app.get('/set-cookies', (req, res) => {
  // Strict Cookie
  res.cookie('strict_cookie', 'value1', {
    sameSite: 'Strict',
    httpOnly: true,
    secure: true
  });
  
  // Lax Cookie
  res.cookie('lax_cookie', 'value2', {
    sameSite: 'Lax',
    httpOnly: true,
    secure: true
  });
  
  // None Cookie
  res.cookie('none_cookie', 'value3', {
    sameSite: 'None',
    httpOnly: true,
    secure: true  // None 必须配合 Secure
  });
  
  res.send('Cookies 已设置');
});

// ============================================
// 测试页面（other.com）
// ============================================

// 场景1：点击链接
<a href="https://example.com/test">点击测试</a>

// 请求头：
// Cookie: lax_cookie=value2; none_cookie=value3
// 
// ✅ lax_cookie: 发送（顶级导航 GET）
// ❌ strict_cookie: 不发送（跨站）
// ✅ none_cookie: 发送


// 场景2：POST 表单
<form action="https://example.com/test" method="POST">
  <button>提交</button>
</form>

// 请求头：
// Cookie: none_cookie=value3
// 
// ❌ lax_cookie: 不发送（POST）
// ❌ strict_cookie: 不发送（跨站）
// ✅ none_cookie: 发送


// 场景3：AJAX
fetch('https://example.com/test', {
  credentials: 'include'
});

// 请求头：
// Cookie: none_cookie=value3
// 
// ❌ lax_cookie: 不发送（非导航）
// ❌ strict_cookie: 不发送（跨站）
// ✅ none_cookie: 发送
```

---

## 🛡️ 安全性分析

### Lax 防御的攻击

```javascript
/**
 * Lax 模式防御 CSRF 攻击
 */

const csrfProtection = {
  // 攻击场景：恶意网站的 POST 表单
  attack: `
    <!-- attacker.com -->
    <form action="https://bank.com/transfer" method="POST">
      <input name="to" value="attacker">
      <input name="amount" value="10000">
    </form>
    <script>document.forms[0].submit();</script>
  `,
  
  // Lax 保护
  protection: {
    without: `
      SameSite=None 或无设置（旧浏览器）：
      → Cookie 被发送
      → 转账成功
      → CSRF 攻击成功 💥
    `,
    
    with: `
      SameSite=Lax：
      → Cookie 不发送（POST 表单）
      → 服务器认为未登录
      → 转账失败
      → CSRF 攻击被阻止 ✅
    `
  }
};
```

### Lax 的权衡

```javascript
const laxTradeoff = {
  // ✅ 优点
  pros: {
    security: '✅ 防止大部分 CSRF 攻击（POST）',
    usability: '✅ 保持良好的用户体验（GET 链接）',
    default: '✅ Chrome 的默认值（合理）'
  },
  
  // ⚠️ 缺点
  cons: {
    limitation: '⚠️ 不能完全防止 CSRF（GET 请求仍可能被利用）',
    iframe: '⚠️ 跨站 iframe 无法使用（需要 None）',
    ajax: '⚠️ 跨站 AJAX 无法携带 Cookie'
  },
  
  // 使用场景
  useCase: {
    recommended: '✅ 推荐用于大多数网站（默认）',
    notSuitable: [
      '需要被第三方网站 iframe 嵌入',
      '需要跨站 AJAX 携带 Cookie'
    ]
  }
};
```

---

## 🔧 实际应用建议

### 推荐配置

```javascript
// ============================================
// 场景1：普通网站（推荐 Lax）
// ============================================
res.cookie('sessionId', token, {
  httpOnly: true,      // 防止 XSS
  secure: true,        // 只在 HTTPS
  sameSite: 'Lax',    // 防止 CSRF，保持用户体验
  maxAge: 24 * 60 * 60 * 1000  // 24小时
});

/**
 * 适用：
 * - 电商网站
 * - 社交网站
 * - 博客系统
 * - 大多数应用
 */

// ============================================
// 场景2：高安全要求（使用 Strict）
// ============================================
res.cookie('adminSession', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',  // 最严格
  maxAge: 30 * 60 * 1000  // 30分钟
});

/**
 * 适用：
 * - 银行网站
 * - 支付系统
 * - 管理后台
 * 
 * 缺点：
 * - 从其他网站点链接过来 → 显示未登录
 * - 需要用户重新登录
 * - 用户体验稍差
 */

// ============================================
// 场景3：需要跨站使用（使用 None）
// ============================================
res.cookie('tracking', trackingId, {
  sameSite: 'None',    // 允许跨站
  secure: true,        // None 必须配合 Secure
  maxAge: 365 * 24 * 60 * 60 * 1000  // 1年
});

/**
 * 适用：
 * - 第三方登录（OAuth）
 * - 嵌入式 widget（需要在 iframe 中使用）
 * - 广告追踪
 * - 跨站分析
 * 
 * 注意：
 * - 必须 HTTPS
 * - 安全性最低
 */
```

---

## 📋 完整的决策表

### 根据场景选择 SameSite

```
需求                              →  SameSite 设置
─────────────────────────────────────────────────
普通网站，平衡安全和体验          →  Lax（推荐）
银行、支付等高安全要求            →  Strict
第三方服务、需要跨站使用          →  None + Secure
嵌入式 widget（iframe）          →  None + Secure
OAuth 第三方登录                 →  None + Secure
广告追踪                         →  None + Secure
```

---

## 🎨 实际测试

### 测试页面

```html
<!-- ============================================ -->
<!-- test-lax.html（部署在 other.com）-->
<!-- ============================================ -->
<!DOCTYPE html>
<html>
<head>
  <title>SameSite=Lax 测试</title>
  <style>
    .test { margin: 20px; padding: 20px; border: 1px solid #ccc; }
    .result { background: #f0f0f0; padding: 10px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>SameSite=Lax 测试（当前在 other.com）</h1>
  
  <!-- 测试1：点击链接 -->
  <div class="test">
    <h3>测试1：点击链接（GET，顶级导航）</h3>
    <a href="https://example.com/test?source=link" target="_blank">
      点击跳转到 example.com
    </a>
    <div class="result">
      预期：✅ Lax Cookie 会发送
    </div>
  </div>
  
  <!-- 测试2：POST 表单 -->
  <div class="test">
    <h3>测试2：POST 表单（POST，顶级导航）</h3>
    <form action="https://example.com/test" method="POST" target="_blank">
      <input type="hidden" name="source" value="form-post">
      <button type="submit">提交 POST 表单</button>
    </form>
    <div class="result">
      预期：❌ Lax Cookie 不会发送
    </div>
  </div>
  
  <!-- 测试3：GET 表单 -->
  <div class="test">
    <h3>测试3：GET 表单（GET，顶级导航）</h3>
    <form action="https://example.com/test" method="GET" target="_blank">
      <input type="hidden" name="source" value="form-get">
      <button type="submit">提交 GET 表单</button>
    </form>
    <div class="result">
      预期：✅ Lax Cookie 会发送
    </div>
  </div>
  
  <!-- 测试4：AJAX -->
  <div class="test">
    <h3>测试4：AJAX（GET，非导航）</h3>
    <button onclick="testAjax()">发送 AJAX</button>
    <div class="result" id="ajax-result">
      预期：❌ Lax Cookie 不会发送
    </div>
  </div>
  
  <!-- 测试5：iframe -->
  <div class="test">
    <h3>测试5：iframe（GET，非导航）</h3>
    <iframe src="https://example.com/test?source=iframe" width="400" height="100"></iframe>
    <div class="result">
      预期：❌ Lax Cookie 不会发送
    </div>
  </div>
  
  <!-- 测试6：图片 -->
  <div class="test">
    <h3>测试6：图片（GET，非导航）</h3>
    <img src="https://example.com/test?source=img" width="100" height="100">
    <div class="result">
      预期：❌ Lax Cookie 不会发送
    </div>
  </div>
  
  <script>
    function testAjax() {
      fetch('https://example.com/test?source=ajax', {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => res.text())
      .then(data => {
        document.getElementById('ajax-result').innerHTML += 
          '<br>响应：' + data;
      })
      .catch(err => {
        document.getElementById('ajax-result').innerHTML += 
          '<br>错误：' + err.message;
      });
    }
  </script>
</body>
</html>
```

---

## 📊 总结

### 核心答案

**Q: SameSite=Lax 如何控制 Cookie 的发送？**

A: 
- ✅ **同站请求**：总是发送
- ✅ **跨站 + 顶级导航 + GET**：发送（如点击链接）
- ❌ **跨站 + 非 GET** 或 **非顶级导航**：不发送

**Q: 顶级域名不同会发送吗？**

A: **看情况**：
- ✅ 如果是点击链接（顶级导航 GET）→ 发送
- ❌ 如果是 POST、AJAX、iframe、img → 不发送

### 判断流程

```
跨站请求（顶级域名不同）
    ↓
是否是顶级导航（地址栏变化）？
├─ 是
│  └─ 方法是 GET？
│     ├─ 是 → ✅ 发送 Cookie（Lax 允许）
│     └─ 否 → ❌ 不发送（Lax 阻止 POST）
│
└─ 否（AJAX/iframe/img）
   └─ ❌ 不发送（Lax 阻止）
```

### 安全建议

```javascript
const securityRecommendation = {
  // 默认使用 Lax
  default: 'SameSite=Lax',
  
  // 组合使用
  combination: [
    'HttpOnly（防 XSS）',
    'Secure（只 HTTPS）',
    'SameSite=Lax（防 CSRF）',
    'CSRF Token（额外防护）'
  ],
  
  example: `
    res.cookie('sessionId', token, {
      httpOnly: true,    // ✅ 防 XSS
      secure: true,      // ✅ 只 HTTPS
      sameSite: 'Lax',  // ✅ 防 CSRF
      maxAge: 86400000   // 24小时
    });
  `
};
```

文档位置：`Cookie-SameSite详解.md`

包含：完整的 SameSite 规则、实际测试代码、安全分析、最佳实践！🎉
