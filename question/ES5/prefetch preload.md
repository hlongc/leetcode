# 浏览器资源预加载指令详解：prefetch、preload 及相关技术

## 一、概述

现代浏览器提供了多种资源预加载机制，允许开发者指示浏览器提前加载特定资源，从而优化页面性能。这些预加载指令通过`<link>`标签的`rel`属性实现，主要包括：prefetch、preload、preconnect、dns-prefetch 等。它们在加载时机、优先级和用途上各有差异。

## 二、主要预加载指令详解

### 1. rel="preload"

**定义**：指示浏览器尽快下载并缓存资源，通常用于当前页面即将需要的资源。

**语法示例**：

```html
<link rel="preload" href="/styles/main.css" as="style" />
<link
  rel="preload"
  href="/fonts/awesome.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

**特点**：

- **优先级**：高优先级，与页面主要资源（如当前所需 CSS）相近
- **执行时机**：资源立即加载，但不会自动执行/应用
- **浏览器支持**：现代浏览器广泛支持
- **作用范围**：仅当前页面

**适用场景**：

- 关键渲染路径中的资源（CSS、字体等）
- 确定即将使用但可能被延迟发现的资源
- 在 CSS 中引用的字体文件
- 页面滚动后才会显示的关键内容

**优点**：

- 提前获取关键资源，减少渲染阻塞
- 提高页面加载性能和首屏渲染速度
- 对于字体资源，可避免 FOIT（无样式文本闪烁）问题

**缺点**：

- 使用不当会浪费带宽（加载未使用的资源）
- 如果关键资源过多，可能会延迟首次绘制
- 需要正确设置`as`属性，否则会导致资源重复加载
- 错误使用会导致性能下降而非提升

### 2. rel="prefetch"

**定义**：指示浏览器在空闲时间获取资源，为将来的页面访问做准备。

**语法示例**：

```html
<link rel="prefetch" href="/js/next-page.js" />
<link rel="prefetch" href="/api/data.json" />
```

**特点**：

- **优先级**：低优先级（闲置加载）
- **执行时机**：当前页面加载完成后的空闲时间
- **浏览器支持**：现代浏览器广泛支持
- **作用范围**：可用于后续导航/页面

**适用场景**：

- 用户可能访问的下一个页面的资源
- 分页内容的下一页数据
- SPA 应用中其他路由可能需要的资源
- 购买流程中下一步可能需要的资源

**优点**：

- 提高后续页面的加载速度
- 不与当前页面关键资源竞争带宽
- 可以在用户等待期间提前加载资源

**缺点**：

- 如果预测错误，会浪费用户带宽
- 移动设备上可能导致不必要的流量消耗
- 无法保证资源一定会被缓存（如浏览器可能因内存压力清除）

### 3. rel="dns-prefetch"

**定义**：提前解析域名的 DNS 配置，减少 DNS 解析时间。

**语法示例**：

```html
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//analytics.example.com" />
```

**特点**：

- **优先级**：较低
- **执行时机**：通常在页面解析早期
- **浏览器支持**：广泛，包括较旧的浏览器
- **作用范围**：仅 DNS 解析阶段

**适用场景**：

- 页面将连接的第三方域名（如 CDN、API 服务、广告、分析）
- 多源站点资源的域名
- 用户可能点击的外部链接域名

**优点**：

- 资源消耗极小
- 可显著减少 DNS 查找时间（约 20-120ms）
- 实现简单，风险低

**缺点**：

- 仅优化 DNS 解析阶段，不预建连接
- 对已访问过的域名效果有限（DNS 可能已缓存）
- 过多的 dns-prefetch 可能导致 DNS 服务压力

### 4. rel="preconnect"

**定义**：提前建立与服务器的连接，包括 DNS 解析、TCP 握手和 TLS 协商（如果适用）。

**语法示例**：

```html
<link rel="preconnect" href="https://example.com" />
<link rel="preconnect" href="https://cdn.example.com" crossorigin />
```

**特点**：

- **优先级**：中等
- **执行时机**：页面加载早期
- **浏览器支持**：现代浏览器，但不如 dns-prefetch 广泛
- **作用范围**：网络连接阶段（DNS+TCP+TLS）

**适用场景**：

- 确定会从特定域请求资源，但不确定具体是哪些资源
- 将从第三方域获取关键资源
- 连接建立时间较长的服务器（如跨洋连接）

**优点**：

- 比 dns-prefetch 更全面，完成所有连接前期工作
- 可以节省约 100-500ms 的连接建立时间
- 对 HTTPS 连接尤其有效，可提前完成 TLS 握手

**缺点**：

- 资源消耗比 dns-prefetch 大
- 连接如果未使用会占用系统资源
- 每个浏览器对并发 preconnect 数量有限制（通常为 6-8 个）

### 5. rel="prerender"

**定义**：预先加载并渲染整个页面，包括页面所有资源和执行 JavaScript 等。

**语法示例**：

```html
<link rel="prerender" href="https://example.com/next-page" />
```

**特点**：

- **优先级**：非常低
- **执行时机**：浏览器极度空闲时
- **浏览器支持**：有限，实现不一致
- **作用范围**：整个页面及其资源

**适用场景**：

- 用户几乎肯定会访问的下一个页面
- 搜索结果中最可能点击的链接
- 分步流程中的下一步

**优点**：

- 可实现即时页面切换体验
- 预渲染页面可以包含所有资源和执行所有脚本
- 用户点击时感知为"瞬时加载"

**缺点**：

- 资源消耗巨大
- 浏览器支持不一致，有些仅实现部分功能
- 可能导致不必要的 API 调用或分析统计重复
- 不适合需要用户身份验证的页面

## 三、预加载指令的组合使用

### 最佳实践组合

1. **dns-prefetch + preconnect**：

```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
```

这种组合可提供向后兼容性，老浏览器使用 dns-prefetch，新浏览器使用更全面的 preconnect。

2. **preconnect + preload**：

```html
<link rel="preconnect" href="https://cdn.example.com" />
<link
  rel="preload"
  href="https://cdn.example.com/styles/critical.css"
  as="style"
/>
```

先建立连接，再加载特定资源，进一步优化加载速度。

## 四、资源缓存影响

以上预加载指令获取的资源通常会被缓存：

1. **内存缓存**：大多数预加载资源首先进入内存缓存，特别是：

   - preload 的资源几乎总是进入内存缓存
   - prefetch 的资源通常也会首先进入内存缓存
   - 资源最终存储位置受浏览器内存管理策略影响

2. **磁盘缓存**：
   - 如果资源具有适当的缓存头（如 Cache-Control），则可能会持久化到磁盘缓存
   - 大型 prefetch 资源可能直接进入磁盘缓存
   - 内存压力大时，预加载资源可能从内存转移到磁盘

## 五、性能影响及注意事项

### 资源争用问题

1. **带宽争用**：

   - preload 资源会与关键资源争夺带宽
   - prefetch 设计上避免争用关键资源带宽

2. **优先级控制**：

   - preload 可以使用`importance`属性进一步控制优先级：
     ```html
     <link
       rel="preload"
       href="/assets/critical.js"
       as="script"
       importance="high"
     />
     <link
       rel="preload"
       href="/assets/less-critical.js"
       as="script"
       importance="low"
     />
     ```

3. **移动设备考量**：
   - 在移动设备上更要谨慎使用预加载，尤其是 prefetch 和 prerender
   - 可以基于网络类型（如使用 Network Information API）动态决定是否使用预加载

### 常见错误

1. **未指定正确的`as`属性**：

   ```html
   <!-- 错误：缺少as属性 -->
   <link rel="preload" href="/assets/font.woff2" />

   <!-- 正确 -->
   <link
     rel="preload"
     href="/assets/font.woff2"
     as="font"
     type="font/woff2"
     crossorigin
   />
   ```

2. **过度预加载**：

   - 预加载太多资源会分散带宽，反而降低性能
   - 建议限制 preload 资源在关键资源的 3-5 个以内

3. **预加载未使用的资源**：
   - 如果预加载资源未在 3 秒内使用，Chrome 开发工具会发出警告

## 六、浏览器兼容性

| 功能         | Chrome   | Firefox | Safari | Edge     | IE       |
| ------------ | -------- | ------- | ------ | -------- | -------- |
| preload      | 50+      | 56+     | 11.1+  | 79+      | 不支持   |
| prefetch     | 8+       | 3.5+    | 5.1+   | 12+      | 10+      |
| dns-prefetch | 46+      | 3.5+    | 5+     | 12+      | 9+       |
| preconnect   | 46+      | 39+     | 11.1+  | 79+      | 不支持   |
| prerender    | 部分支持 | 不支持  | 不支持 | 部分支持 | 11(部分) |

## 七、总结对比

| 指令         | 优先级 | 资源消耗 | 适用场景                     | 主要优势             | 主要缺点               |
| ------------ | ------ | -------- | ---------------------------- | -------------------- | ---------------------- |
| preload      | 高     | 中-高    | 当前页面关键资源             | 提前加载当前页面资源 | 可能延迟首屏渲染       |
| prefetch     | 低     | 中       | 下一页可能需要的资源         | 提高后续导航体验     | 可能浪费带宽           |
| dns-prefetch | 低     | 极低     | 第三方域名解析               | 减少 DNS 查询时间    | 优化有限，仅 DNS 层面  |
| preconnect   | 中     | 低-中    | 确定会用但不确定具体资源的域 | 完成所有连接前置工作 | 连接可能被浪费         |
| prerender    | 极低   | 极高     | 几乎必定访问的下一页         | 用户感知的即时加载   | 资源消耗巨大，支持有限 |
