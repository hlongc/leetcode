# 内容安全策略（Content Security Policy，CSP）详解

> 本文详细介绍 CSP 的概念、工作原理、应用场景及最佳实践，帮助开发者有效防御 XSS 等常见的 Web 安全威胁。

## 一、CSP 基本概念

内容安全策略（CSP）是一种额外的安全层，用于检测并削弱特定类型的攻击，包括跨站脚本攻击（XSS）和数据注入攻击。这些攻击可用于窃取数据、网站破坏、分发恶意软件等。

CSP 通过指定浏览器应该认为哪些动态资源是可执行的，从而减少浏览器可能遭受的攻击面。例如，CSP 可以完全禁用潜在危险的特性如内联 JavaScript 和 eval()，或者限制允许加载资源的域。

## 二、CSP 的工作原理

CSP 的基本工作原理是通过声明性策略限制浏览器可以加载和执行的资源：

1. 服务器向浏览器发送 HTTP 响应头 Content-Security-Policy（或 HTML 中的`<meta>`标签）
2. 该头部包含一组指令，每个指令定义了特定资源类型的加载策略
3. 浏览器在加载和执行资源前，会根据这些策略进行检查
4. 如果资源违反了策略，浏览器会阻止资源的加载或执行
5. 浏览器还可以向指定的 URI 报告违规情况

## 三、CSP 指令详解

### 基本指令类型

CSP 提供多种指令控制不同类型的资源，主要包括：

#### 1. 获取指令：控制加载各种资源的位置

- `default-src`: 所有资源类型的默认策略
- `script-src`: JavaScript 源
- `style-src`: CSS 样式表源
- `img-src`: 图片源
- `connect-src`: 控制可以通过 XHR、WebSockets 等进行连接的源
- `font-src`: Web 字体源
- `media-src`: 音频和视频源
- `frame-src`: iframe 源
- `worker-src`: Worker、SharedWorker 或 ServiceWorker 源

#### 2. 文档指令：控制文档属性或插件类型

- `base-uri`: 限制`<base>`元素中 URL 的使用
- `sandbox`: 为请求的资源启用类似 iframe 的沙箱
- `form-action`: 限制可以提交表单的地址

#### 3. 导航指令：控制用户导航

- `frame-ancestors`: 指定可以嵌入当前页面的源
- `navigate-to`: 限制文档可以导航到的 URL

#### 4. 报告指令：控制违规报告

- `report-uri`: 指定接收 CSP 违规报告的 URL
- `report-to`: 更现代的替代方案，使用 Reporting API

### 源值类型

CSP 指令可以接受多种源值类型：

1. **主机源**

   - 例如：example.com, \*.example.com, https://example.com:443

2. **方案源**

   - 例如：https:, data:, blob:

3. **关键字**
   - `'none'`: 不允许任何源
   - `'self'`: 只允许同源
   - `'unsafe-inline'`: 允许内联脚本和样式
   - `'unsafe-eval'`: 允许使用 eval()等动态代码执行方法
   - `'nonce-{随机值}'`: 允许带有匹配 nonce 值的内联脚本或样式
   - `'sha256-{哈希值}'`: 允许内容匹配指定哈希的内联脚本或样式
   - `'strict-dynamic'`: 信任由受信任脚本加载的脚本

## 四、CSP 实际应用场景

### 1. 防御 XSS 攻击

最主要的应用场景是减轻 XSS 攻击威胁。通过限制 JavaScript 的执行来源，即使攻击者能够注入脚本，这些脚本也会被 CSP 策略阻止执行。

**示例策略**：

```
Content-Security-Policy: script-src 'self'; object-src 'none'
```

该策略只允许从同一源加载脚本，并完全禁止对象（如 Flash）。

### 2. 限制内联脚本执行

内联脚本是 XSS 攻击的常见载体。CSP 可以禁止所有内联脚本，或通过 nonce 或 hash 值允许特定的内联脚本。

**示例策略**：

```
Content-Security-Policy: script-src 'self' 'nonce-randomValue123'
```

对应的 HTML：

```html
<script nonce="randomValue123">
  // 这个脚本会被允许执行
</script>
```

### 3. 阻止不安全的 eval()调用

eval()和其他动态代码执行方法（如 new Function()）是安全风险。CSP 默认禁止这些方法，除非显式允许。

**示例策略**：

```
Content-Security-Policy: script-src 'self'; object-src 'none'
```

在这种策略下，以下代码将被阻止：

```javascript
eval("alert('XSS')");
setTimeout("alert('XSS')", 100);
new Function("return alert('XSS')");
```

### 4. 只允许受信任的资源

CSP 可以限制网站只从受信任的 CDN 或自身域名加载资源，防止从恶意域加载可执行内容。

**示例策略**：

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; img-src *
```

该策略允许：

- 从同源加载默认资源
- 从同源和 trusted-cdn.com 加载脚本
- 从任何源加载图片

### 5. 防止混合内容

当 HTTPS 页面加载 HTTP 资源时会出现混合内容问题。CSP 可以强制所有内容通过 HTTPS 加载。

**示例策略**：

```
Content-Security-Policy: upgrade-insecure-requests
```

该指令会自动将 HTTP 请求升级为 HTTPS 请求。

### 6. 减轻点击劫持攻击

CSP 可以通过 frame-ancestors 指令控制哪些网站可以将你的网站嵌入 iframe 中，有效防止点击劫持攻击。

**示例策略**：

```
Content-Security-Policy: frame-ancestors 'self' https://trusted-parent.com
```

该策略只允许同源和 trusted-parent.com 嵌入当前页面。

### 7. 报告违规行为

CSP 可以配置为将违规情况报告给指定端点，便于监控和调试。

**示例策略**：

```
Content-Security-Policy: default-src 'self'; report-uri /csp-report-endpoint
```

或仅报告模式（不阻止实际内容）：

```
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report-endpoint
```

### 8. 单页应用安全性增强

对于 SPA 应用，CSP 可以帮助限制动态加载的内容和 API 连接。

**示例策略**：

```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://api.example.com
```

该策略允许应用从自身和指定 API 域进行数据请求。

### 9. 强制使用子资源完整性(SRI)

CSP 可以配合 SRI 使用，确保加载的外部资源未被篡改。

**示例策略**：

```
Content-Security-Policy: require-sri-for script style
```

该策略要求所有脚本和样式表必须有 integrity 属性。

## 五、CSP 实现方式

### 1. HTTP 头部方式

通过服务器响应头部发送 CSP 策略是最常见和推荐的方式：

例如，在 Express.js 中：

```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://trusted-cdn.com"
  );
  next();
});
```

或使用 helmet 中间件：

```javascript
const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-cdn.com"],
    },
  })
);
```

### 2. META 标签方式

如果无法修改 HTTP 头部，可以使用 HTML 中的 meta 标签：

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://trusted-cdn.com"
/>
```

注意：meta 标签方式不支持 frame-ancestors 和 report-uri 等指令。

## 六、CSP 案例分析

### 1. 严格安全的网站

**内容安全策略**:

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  connect-src 'self';
  img-src 'self';
  style-src 'self';
  font-src 'self';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none'
```

这种严格的配置：

- 默认阻止所有资源加载
- 只允许从同源加载脚本、样式、图片等
- 防止任何站点通过 iframe 嵌入该网站
- 适合高度安全敏感的应用，如银行网站

### 2. 内容型网站（如博客）

**内容安全策略**:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://i.imgur.com;
  connect-src 'self' https://api.example.com;
  frame-src 'self' https://www.youtube.com;
  upgrade-insecure-requests;
  report-uri /csp-report
```

这种配置：

- 允许从可信 CDN 加载脚本
- 允许内联样式（对于某些博客平台必要）
- 允许从流行服务加载字体和图片
- 允许嵌入 YouTube 视频
- 自动升级 HTTP 请求到 HTTPS
- 适合需要集成多种第三方服务的内容网站

### 3. 单页应用(SPA)

**内容安全策略**:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-randomValuePerRequest';
  style-src 'self' 'nonce-randomValuePerRequest';
  connect-src 'self' https://api.example.com;
  img-src 'self' data: blob:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  upgrade-insecure-requests;
  report-uri /csp-report
```

这种配置：

- 使用 nonce 值允许必要的内联脚本（如初始状态注入）
- 允许 API 请求到指定域
- 允许 data:和 blob:图片（常用于图片处理和上传预览）
- 适合 React、Vue 或 Angular 等现代 SPA 应用

## 七、CSP 部署策略与最佳实践

### 1. 渐进式部署

在复杂现有应用中部署 CSP 可能会破坏功能。建议：

a. **先使用报告模式**

- 使用 Content-Security-Policy-Report-Only 头部
- 收集违规报告，分析现有代码

b. **从宽松策略开始**

- 初始策略允许所有当前资源
- 逐步收紧规则

c. **逐步淘汰内联代码**

- 将内联脚本和样式迁移到外部文件
- 或使用 nonce/hash 值方法

### 2. 安全性与可用性平衡

根据应用需求调整 CSP 严格程度：

a. **高度安全敏感应用**

- 采用严格的 CSP，禁用'unsafe-inline'和'unsafe-eval'
- 使用 nonce 或 hash 值允许必要的内联脚本

b. **内容型网站**

- 可能需要较宽松的规则以支持富文本内容
- 考虑对用户生成内容区域使用沙箱隔离

### 3. 报告和监控

持续监控 CSP 违规对维护安全至关重要：

a. **设置报告端点**

- 创建专门的服务器端点接收违规报告

b. **分析违规模式**

- 区分正常功能触发的违规和实际攻击尝试

c. **使用第三方监控**

- 考虑使用专业安全监控服务

### 4. 特殊情况处理

a. **旧浏览器兼容性**

- 使用 feature detection 确定是否应用 CSP
- 考虑为旧浏览器提供降级体验

b. **第三方脚本**

- 评估必要性，尽量减少第三方脚本
- 对不可控的第三方脚本使用 iframe 隔离

c. **动态内容**

- 使用动态生成的 nonce 值
- 或预计算内容哈希

## 八、常见挑战与解决方案

### 1. 内联事件处理器

**问题**：HTML 中的 onclick 等内联事件处理器会被 CSP 阻止

**解决方案**：

- 使用 addEventListener 替代内联事件
- 例如，将 `<button onclick="doSomething()">` 改为：

```html
<button id="actionButton">执行操作</button>
<script>
  document
    .getElementById("actionButton")
    .addEventListener("click", doSomething);
</script>
```

### 2. eval()和动态代码

**问题**：依赖 eval()或 new Function()的库或代码会被阻止

**解决方案**：

- 重构代码避免使用动态代码执行
- 必要时，在隔离的 iframe 中使用这些功能
- 或在特定环境中使用'unsafe-eval'（不推荐）

### 3. 内联样式

**问题**：style 属性或`<style>`标签会被阻止

**解决方案**：

- 将样式移至外部 CSS 文件
- 使用类代替内联样式
- 如必须使用内联样式，可考虑 nonce 值方法

### 4. 第三方小部件

**问题**：社交媒体小部件、评论系统等通常需要放宽 CSP

**解决方案**：

- 使用 iframe 隔离第三方内容
- 明确列出小部件所需的所有域
- 考虑替代实现方式（如服务器端 API 整合）

## 九、CSP 实际效果与局限性

### 1. 有效防御

- CSP 能有效防御反射型和存储型 XSS 攻击
- 大大减少 DOM XSS 的风险
- 限制成功 XSS 攻击的危害程度

### 2. 局限性

- 不能完全替代输入验证和输出编码
- 对于高度动态的应用实施困难
- 浏览器实现可能存在差异
- 某些旧版浏览器支持有限

### 3. 辅助性质

- CSP 应作为深度防御策略的一部分
- 与其他安全措施配合使用

## 十、CSP 未来发展

### 1. CSP Level 3 新特性

- `trusted-types`: 防止 DOM XSS 漏洞
- `strict-dynamic`: 简化现代 Web 应用的 CSP 部署
- `report-to`: 取代 report-uri 的新报告机制

### 2. 集成与工具链

- 自动化 CSP 生成和验证工具的普及
- 与 CI/CD 流程更紧密的集成

### 3. 广泛采用

- 随着网络安全意识提高，CSP 采用率持续增长
- 可能成为高安全性站点的标准配置

## 案例：GitHub 的 CSP 实践

GitHub 的 CSP 策略是业界优秀实践的代表：

```
Content-Security-Policy:
  default-src 'none';
  base-uri 'self';
  block-all-mixed-content;
  connect-src 'self' uploads.github.com www.githubstatus.com collector.githubapp.com
    api.github.com github-cloud.s3.amazonaws.com github-production-repository-file-5c1aeb.s3.amazonaws.com
    github-production-upload-manifest-file-7fdce7.s3.amazonaws.com github-production-user-asset-6210df.s3.amazonaws.com
    cdn.optimizely.com logx.optimizely.com/v1/events wss://alive.github.com github.githubassets.com;
  font-src github.githubassets.com;
  form-action 'self' github.com gist.github.com;
  frame-ancestors 'none';
  frame-src render.githubusercontent.com viewscreen.githubusercontent.com notebooks.githubusercontent.com;
  img-src 'self' data: github.githubassets.com identicons.github.com collector.githubapp.com
    github-cloud.s3.amazonaws.com secured-user-images.githubusercontent.com/ *.githubusercontent.com;
  manifest-src 'self';
  media-src github.com user-images.githubusercontent.com/;
  script-src github.githubassets.com;
  style-src 'unsafe-inline' github.githubassets.com;
  worker-src github.com/socket-worker-3f088aa2.js gist.github.com/socket-worker-3f088aa2.js
```

GitHub 的策略特点：

- 默认阻止所有内容（default-src 'none'）
- 明确列出所有必需的资源域
- 禁止网站被 iframe 嵌入（frame-ancestors 'none'）
- 阻止所有混合内容（block-all-mixed-content）
- 样式使用'unsafe-inline'但将大部分 CSS 托管在可控的 CDN
- 脚本完全从可控的 CDN 加载，无内联脚本

## 总结

CSP 作为 Web 安全中的重要一环，能显著提升网站抵御 XSS 等常见攻击的能力。合理配置和使用 CSP，可以在不影响用户体验的前提下，大幅提高网站安全性。
