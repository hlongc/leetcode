# HTML Meta 标签配置大全

Meta 标签是 HTML 文档头部的元数据，用于描述网页的各种属性，影响 SEO、浏览器行为、社交媒体分享等。

## 📱 移动端适配

### 1. 视口配置 (Viewport)

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

**应用场景：** 移动端响应式网页必备配置

- `width=device-width`: 宽度适配设备宽度
- `initial-scale=1.0`: 初始缩放比例为 1
- `maximum-scale=1.0`: 最大缩放比例
- `user-scalable=no`: 禁止用户缩放（谨慎使用，影响可访问性）

**实际案例：** 所有移动端 H5 页面、响应式网站

### 2. iOS 状态栏样式

```html
<!-- 黑色半透明状态栏 -->
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>

<!-- 添加到主屏幕后全屏显示 -->
<meta name="apple-mobile-web-app-capable" content="yes" />

<!-- 设置应用名称 -->
<meta name="apple-mobile-web-app-title" content="我的应用" />
```

**应用场景：** iOS Safari 浏览器，PWA 应用

- 控制添加到主屏幕后的显示效果
- 常用于需要类原生 App 体验的 Web 应用

### 3. 禁止电话号码识别

```html
<!-- iOS Safari 禁止自动识别电话号码 -->
<meta name="format-detection" content="telephone=no" />

<!-- 禁止邮箱识别 -->
<meta name="format-detection" content="email=no" />

<!-- 禁止地址识别 -->
<meta name="format-detection" content="address=no" />

<!-- 全部禁止 -->
<meta name="format-detection" content="telephone=no, email=no, address=no" />
```

**应用场景：** 页面中有数字但不是电话号码时（如订单号、身份证号）

## 🔍 SEO 优化

### 4. 基础 SEO Meta

```html
<!-- 页面标题（最重要的 SEO 因素之一） -->
<title>页面标题 - 网站名称</title>

<!-- 页面描述，显示在搜索结果中 -->
<meta
  name="description"
  content="这是一段关于页面内容的简短描述，建议 120-160 字符"
/>

<!-- 关键词（现代搜索引擎基本不使用） -->
<meta name="keywords" content="关键词1, 关键词2, 关键词3" />

<!-- 作者信息 -->
<meta name="author" content="作者姓名" />
```

**应用场景：** 所有网页，影响搜索引擎排名和展示效果

### 5. 搜索引擎爬虫控制

```html
<!-- 允许索引和跟踪链接（默认行为） -->
<meta name="robots" content="index, follow" />

<!-- 不允许索引但跟踪链接 -->
<meta name="robots" content="noindex, follow" />

<!-- 允许索引但不跟踪链接 -->
<meta name="robots" content="index, nofollow" />

<!-- 完全不允许（后台管理页面、隐私页面） -->
<meta name="robots" content="noindex, nofollow" />

<!-- 不缓存页面 -->
<meta name="robots" content="noarchive" />

<!-- 不显示摘要 -->
<meta name="robots" content="nosnippet" />
```

**应用场景：**

- 登录页面、管理后台：`noindex, nofollow`
- 隐私协议页面：`noindex, follow`
- 临时页面、测试页面：`noindex, nofollow`

### 6. 规范链接 (Canonical)

```html
<link rel="canonical" href="https://example.com/page" />
```

**应用场景：** 避免重复内容问题

- 同一内容有多个 URL（如带参数的链接）
- 移动端和桌面端使用不同 URL
- 告诉搜索引擎哪个是主要版本

## 🌐 Open Graph (社交媒体分享)

### 7. Facebook / LinkedIn 分享优化

```html
<!-- 基础 OG 标签 -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:title" content="分享标题" />
<meta property="og:description" content="分享描述文字" />
<meta property="og:image" content="https://example.com/share-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- 网站名称 -->
<meta property="og:site_name" content="网站名称" />

<!-- 语言 -->
<meta property="og:locale" content="zh_CN" />
```

**应用场景：**

- 文章页面、产品页面需要在社交媒体分享时有良好展示
- 建议图片尺寸：1200×630 像素

### 8. Twitter Card

```html
<!-- Twitter 卡片类型 -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@网站账号" />
<meta name="twitter:creator" content="@作者账号" />
<meta name="twitter:title" content="分享标题" />
<meta name="twitter:description" content="分享描述" />
<meta name="twitter:image" content="https://example.com/twitter-image.jpg" />
```

**Card 类型：**

- `summary`: 小图摘要
- `summary_large_image`: 大图摘要（推荐）
- `app`: 应用卡片
- `player`: 视频/音频播放器

## 🔒 安全相关

### 9. 内容安全策略 (CSP)

```html
<!-- 升级不安全请求为 HTTPS -->
<meta
  http-equiv="Content-Security-Policy"
  content="upgrade-insecure-requests"
/>

<!-- 限制资源加载来源 -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://trusted.cdn.com; style-src 'self' 'unsafe-inline'"
/>
```

**应用场景：**

- 防止 XSS 攻击
- 从 HTTP 迁移到 HTTPS 时自动升级请求
- 限制只能加载信任来源的资源

### 10. X-Frame-Options (防止点击劫持)

```html
<!-- 禁止被嵌入 iframe -->
<meta http-equiv="X-Frame-Options" content="DENY" />

<!-- 只允许同源嵌入 -->
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN" />

<!-- 允许指定域名嵌入 -->
<meta http-equiv="X-Frame-Options" content="ALLOW-FROM https://example.com" />
```

**应用场景：**

- 银行、支付页面：`DENY`
- 后台管理系统：`SAMEORIGIN`
- 防止网站被恶意嵌入钓鱼网站

### 11. 引荐来源策略 (Referrer Policy)

```html
<!-- 不发送 referer -->
<meta name="referrer" content="no-referrer" />

<!-- 只发送源（不含路径） -->
<meta name="referrer" content="origin" />

<!-- 同源发送完整 URL，跨域发送源 -->
<meta name="referrer" content="origin-when-cross-origin" />

<!-- 只在 HTTPS→HTTPS 时发送 -->
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

**应用场景：**

- 保护用户隐私，不泄露 URL 参数
- 防止敏感信息通过 referer 泄露

## 🎨 浏览器行为控制

### 12. 浏览器兼容模式

```html
<!-- IE 使用最新渲染引擎 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge" />

<!-- 360 浏览器使用 Webkit 内核 -->
<meta name="renderer" content="webkit" />
```

**应用场景：** 国内环境，兼容老版本 IE 和双核浏览器

### 13. 缓存控制

```html
<!-- 禁止缓存 -->
<meta
  http-equiv="Cache-Control"
  content="no-cache, no-store, must-revalidate"
/>
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

**应用场景：**

- 经常更新的数据页面（股票、汇率）
- 用户敏感信息页面
- **注意：** HTTP 头的缓存控制优先级更高

### 14. 自动刷新 / 跳转

```html
<!-- 10 秒后刷新页面 -->
<meta http-equiv="refresh" content="10" />

<!-- 3 秒后跳转到其他页面 -->
<meta http-equiv="refresh" content="3; url=https://example.com" />
```

**应用场景：**

- 倒计时跳转页面
- 实时数据展示（不推荐，建议用 JavaScript）
- 临时重定向（301/302 更好）

### 15. 字符编码

```html
<!-- UTF-8 编码（推荐，支持所有语言） -->
<meta charset="UTF-8" />

<!-- 或使用完整格式 -->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
```

**应用场景：** 所有网页必备，防止乱码

## 🎯 主题色 / PWA

### 16. 主题颜色

```html
<!-- 浏览器地址栏颜色（Android Chrome） -->
<meta name="theme-color" content="#4285f4" />

<!-- 可以根据媒体查询设置不同颜色 -->
<meta
  name="theme-color"
  content="#ffffff"
  media="(prefers-color-scheme: light)"
/>
<meta
  name="theme-color"
  content="#000000"
  media="(prefers-color-scheme: dark)"
/>
```

**应用场景：** PWA 应用，提升品牌一致性

### 17. Web App Manifest

```html
<link rel="manifest" href="/manifest.json" />
```

**manifest.json 示例：**

```json
{
  "name": "我的应用",
  "short_name": "应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4285f4",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**应用场景：** PWA 渐进式 Web 应用

## 🌍 国际化

### 18. 语言声明

```html
<!-- HTML lang 属性 -->
<html lang="zh-CN">
  <!-- 备用语言 -->
  <meta http-equiv="content-language" content="zh-CN" />

  <!-- 多语言版本链接 -->
  <link rel="alternate" hreflang="en" href="https://example.com/en" />
  <link rel="alternate" hreflang="zh-CN" href="https://example.com/zh" />
</html>
```

**应用场景：** 多语言网站，帮助搜索引擎识别语言

## 📊 其他实用配置

### 19. DNS 预解析

```html
<!-- 预解析 DNS -->
<link rel="dns-prefetch" href="https://api.example.com" />

<!-- 预连接（包含 DNS、TCP、TLS） -->
<link rel="preconnect" href="https://cdn.example.com" />

<!-- 预加载资源 -->
<link rel="preload" href="/critical.css" as="style" />

<!-- 预获取下一页资源 -->
<link rel="prefetch" href="/next-page.html" />
```

**应用场景：** 性能优化，减少请求延迟

### 20. 版权与许可

```html
<meta name="copyright" content="© 2025 Company Name" />
<meta name="license" content="MIT" />
```

## 🎬 完整示例

### 标准网页模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <!-- 字符编码 -->
    <meta charset="UTF-8" />

    <!-- 移动端适配 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- 浏览器兼容 -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <!-- SEO -->
    <title>页面标题 - 网站名称</title>
    <meta name="description" content="页面描述，120-160字符" />
    <meta name="keywords" content="关键词1, 关键词2" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="分享标题" />
    <meta property="og:description" content="分享描述" />
    <meta property="og:image" content="https://example.com/share.jpg" />
    <meta property="og:url" content="https://example.com" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="分享标题" />
    <meta name="twitter:description" content="分享描述" />
    <meta name="twitter:image" content="https://example.com/share.jpg" />

    <!-- 安全 -->
    <meta
      http-equiv="Content-Security-Policy"
      content="upgrade-insecure-requests"
    />

    <!-- 主题色 -->
    <meta name="theme-color" content="#4285f4" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  </head>
  <body>
    <!-- 页面内容 -->
  </body>
</html>
```

## 📝 最佳实践建议

1. **必备标签**：`charset`、`viewport`、`title`、`description`
2. **SEO 优化**：每个页面独特的 title 和 description
3. **社交分享**：重要页面添加 OG 和 Twitter Card
4. **安全第一**：生产环境使用 CSP、X-Frame-Options
5. **性能优化**：合理使用 dns-prefetch、preconnect
6. **移动优先**：重视移动端 meta 配置
7. **测试验证**：
   - Facebook 分享调试：https://developers.facebook.com/tools/debug/
   - Twitter 卡片验证：https://cards-dev.twitter.com/validator
   - Google 结构化数据测试：https://search.google.com/test/rich-results

## 🔗 参考资源

- [MDN - Meta 标签](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Web App Manifest](https://developer.mozilla.org/zh-CN/docs/Web/Manifest)
