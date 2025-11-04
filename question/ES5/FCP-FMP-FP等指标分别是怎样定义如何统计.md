# Web 性能指标详解

## 核心性能指标概览

| 指标    | 全称                     | 含义           | 重要性           |
| ------- | ------------------------ | -------------- | ---------------- |
| **FP**  | First Paint              | 首次绘制       | ⭐⭐⭐           |
| **FCP** | First Contentful Paint   | 首次内容绘制   | ⭐⭐⭐⭐         |
| **FMP** | First Meaningful Paint   | 首次有意义绘制 | ⭐⭐⭐（已废弃） |
| **LCP** | Largest Contentful Paint | 最大内容绘制   | ⭐⭐⭐⭐⭐       |
| **TTI** | Time to Interactive      | 可交互时间     | ⭐⭐⭐⭐         |
| **TBT** | Total Blocking Time      | 总阻塞时间     | ⭐⭐⭐⭐         |
| **FID** | First Input Delay        | 首次输入延迟   | ⭐⭐⭐⭐⭐       |
| **CLS** | Cumulative Layout Shift  | 累积布局偏移   | ⭐⭐⭐⭐⭐       |

---

## 详细指标解析

### 1. FP (First Paint) - 首次绘制

**定义**：浏览器首次渲染**任何像素**到屏幕的时间点。

**含义**：页面从白屏到有内容（哪怕只是背景色）的时刻。

**测量方式**：

```javascript
// 使用 Performance API
const fp = performance
  .getEntriesByType("paint")
  .find((entry) => entry.name === "first-paint");

if (fp) {
  console.log("FP:", fp.startTime, "ms");
}

// 或使用 PerformanceObserver
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === "first-paint") {
      console.log("FP:", entry.startTime, "ms");
    }
  }
});

observer.observe({ entryTypes: ["paint"] });
```

**示例**：

```
时间线：
0ms: 开始加载页面（白屏）
100ms: ✅ FP - 浏览器绘制了背景色
200ms: 内容开始显示
```

---

### 2. FCP (First Contentful Paint) - 首次内容绘制

**定义**：浏览器首次渲染**任何文本、图像、非空白 canvas 或 SVG** 的时间点。

**含义**：用户首次看到有意义内容的时刻。

**测量方式**：

```javascript
const fcp = performance
  .getEntriesByType("paint")
  .find((entry) => entry.name === "first-contentful-paint");

if (fcp) {
  console.log("FCP:", fcp.startTime, "ms");
}

// 使用 PerformanceObserver（推荐）
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === "first-contentful-paint") {
      console.log("FCP:", entry.startTime, "ms");

      // 发送到分析服务
      sendToAnalytics({
        metric: "FCP",
        value: entry.startTime,
        url: window.location.href,
      });
    }
  }
});

observer.observe({ entryTypes: ["paint"] });
```

**评分标准**：

| 时间     | 评级        |
| -------- | ----------- |
| 0-1.8s   | 🟢 良好     |
| 1.8-3.0s | 🟡 需要改进 |
| > 3.0s   | 🔴 较差     |

**示例**：

```
时间线：
0ms: 开始加载
100ms: FP（背景色出现）
250ms: ✅ FCP - 首个文字或图片显示
500ms: 更多内容加载
```

---

### 3. FMP (First Meaningful Paint) - 首次有意义绘制

**定义**：页面**主要内容**对用户可见的时间点。

**状态**：⚠️ 已被 LCP 替代，不再推荐使用

**含义**：用户认为页面有用的内容开始显示的时刻（主观性强）。

**问题**：

- 定义模糊（什么是"有意义"？）
- 不同网站定义不同
- 难以统一衡量

**测量方式**（已不推荐）：

```javascript
// Lighthouse 之前的计算方式（已废弃）
// 基于布局变化最大的时刻

// 现在应该使用 LCP 替代
```

---

### 4. LCP (Largest Contentful Paint) - 最大内容绘制 ⭐⭐⭐⭐⭐

**定义**：视口内**最大的可见内容元素**渲染到屏幕的时间点。

**包含的元素**：

- `<img>` 元素
- `<image>` 元素（SVG 内）
- `<video>` 元素（封面图）
- 通过 `url()` 加载的背景图片元素
- 包含文本节点的块级元素

**测量方式**：

```javascript
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1]; // 最后一个就是 LCP

  console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime, "ms");
  console.log("LCP 元素:", lastEntry.element);

  // 发送到分析服务
  sendToAnalytics({
    metric: "LCP",
    value: lastEntry.renderTime || lastEntry.loadTime,
    element: lastEntry.element?.tagName,
    url: window.location.href,
  });
});

observer.observe({ entryTypes: ["largest-contentful-paint"] });
```

**评分标准**：

| 时间     | 评级        |
| -------- | ----------- |
| 0-2.5s   | 🟢 良好     |
| 2.5-4.0s | 🟡 需要改进 |
| > 4.0s   | 🔴 较差     |

**优化建议**：

- 优化服务器响应时间
- 使用 CDN
- 压缩图片
- 预加载关键资源
- 使用骨架屏

---

### 5. TTI (Time to Interactive) - 可交互时间

**定义**：页面**完全可交互**的时间点。

**条件**（同时满足）：

1. FCP 已发生
2. 大部分可见元素已注册事件处理器
3. 页面在 50ms 内响应用户交互
4. 没有长任务阻塞主线程

**测量方式**：

```javascript
// TTI 通常通过 Lighthouse 或 web-vitals 库测量
// 手动测量较复杂

// 使用 web-vitals 库
import { getTTI } from "web-vitals";

getTTI((metric) => {
  console.log("TTI:", metric.value, "ms");
  console.log("Rating:", metric.rating); // 'good', 'needs-improvement', 'poor'

  sendToAnalytics(metric);
});
```

**评分标准**：

| 时间     | 评级        |
| -------- | ----------- |
| 0-3.8s   | 🟢 良好     |
| 3.8-7.3s | 🟡 需要改进 |
| > 7.3s   | 🔴 较差     |

---

### 6. FID (First Input Delay) - 首次输入延迟 ⭐⭐⭐⭐⭐

**定义**：用户**首次交互**（点击、触摸等）到浏览器**实际响应**的延迟时间。

**测量方式**：

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 只关注第一次输入
    const FID = entry.processingStart - entry.startTime;

    console.log("FID:", FID, "ms");
    console.log("输入类型:", entry.name);

    sendToAnalytics({
      metric: "FID",
      value: FID,
      inputType: entry.name,
    });
  }
});

observer.observe({
  type: "first-input",
  buffered: true, // 包含已发生的事件
});

// 或使用 web-vitals 库（推荐）
import { onFID } from "web-vitals";

onFID((metric) => {
  console.log("FID:", metric.value, "ms");
  sendToAnalytics(metric);
});
```

**评分标准**：

| 时间      | 评级        |
| --------- | ----------- |
| 0-100ms   | 🟢 良好     |
| 100-300ms | 🟡 需要改进 |
| > 300ms   | 🔴 较差     |

**优化建议**：

- 减少 JavaScript 执行时间
- 拆分长任务
- 使用 Web Worker
- 代码分割

---

### 7. TBT (Total Blocking Time) - 总阻塞时间

**定义**：FCP 和 TTI 之间，所有**长任务阻塞时间**的总和。

**长任务**：执行时间超过 50ms 的任务。

**计算方式**：

```
每个长任务的阻塞时间 = 任务执行时间 - 50ms

例如：
任务1: 80ms  → 阻塞时间 = 80 - 50 = 30ms
任务2: 120ms → 阻塞时间 = 120 - 50 = 70ms
任务3: 40ms  → 阻塞时间 = 0ms（未超过50ms）

TBT = 30 + 70 = 100ms
```

**测量方式**：

```javascript
const observer = new PerformanceObserver((list) => {
  let totalBlockingTime = 0;

  for (const entry of list.getEntries()) {
    // 长任务：超过 50ms
    if (entry.duration > 50) {
      const blockingTime = entry.duration - 50;
      totalBlockingTime += blockingTime;

      console.log("长任务:", {
        name: entry.name,
        duration: entry.duration,
        blockingTime: blockingTime,
      });
    }
  }

  console.log("TBT:", totalBlockingTime, "ms");
});

observer.observe({ entryTypes: ["longtask"] });
```

**评分标准**：

| 时间      | 评级        |
| --------- | ----------- |
| 0-200ms   | 🟢 良好     |
| 200-600ms | 🟡 需要改进 |
| > 600ms   | 🔴 较差     |

---

### 8. CLS (Cumulative Layout Shift) - 累积布局偏移 ⭐⭐⭐⭐⭐

**定义**：页面生命周期内，所有**意外布局偏移**的累积分数。

**计算公式**：

```
布局偏移分数 = 影响分数 × 距离分数

影响分数 = 受影响的可见区域占视口的比例
距离分数 = 元素移动距离占视口的比例
```

**测量方式**：

```javascript
let clsScore = 0;

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 只统计没有用户输入的布局偏移
    if (!entry.hadRecentInput) {
      clsScore += entry.value;

      console.log("布局偏移:", {
        value: entry.value,
        sources: entry.sources,
        currentCLS: clsScore,
      });
    }
  }

  console.log("当前 CLS:", clsScore);
});

observer.observe({ entryTypes: ["layout-shift"] });

// 使用 web-vitals 库（推荐）
import { onCLS } from "web-vitals";

onCLS((metric) => {
  console.log("CLS:", metric.value);
  console.log("Rating:", metric.rating);
  sendToAnalytics(metric);
});
```

**评分标准**：

| 分数     | 评级        |
| -------- | ----------- |
| 0-0.1    | 🟢 良好     |
| 0.1-0.25 | 🟡 需要改进 |
| > 0.25   | 🔴 较差     |

**常见原因和解决方案**：

```html
<!-- ❌ 导致 CLS 的情况 -->

<!-- 1. 图片没有尺寸 -->
<img src="image.jpg" />

<!-- ✅ 解决：设置尺寸 -->
<img src="image.jpg" width="400" height="300" />
<!-- 或使用 aspect-ratio -->
<img src="image.jpg" style="aspect-ratio: 4/3; width: 100%;" />

<!-- 2. 动态内容插入 -->
<!-- ❌ 顶部突然出现横幅 -->
<div id="banner"></div>

<!-- ✅ 解决：预留空间 -->
<div id="banner" style="min-height: 100px;"></div>

<!-- 3. Web 字体导致文字闪烁 -->
<!-- ❌ FOIT (Flash of Invisible Text) -->
<style>
  @font-face {
    font-family: "CustomFont";
    src: url("font.woff2");
  }
  body {
    font-family: "CustomFont", sans-serif;
  }
</style>

<!-- ✅ 解决：使用 font-display -->
<style>
  @font-face {
    font-family: "CustomFont";
    src: url("font.woff2");
    font-display: swap; /* 立即显示备用字体 */
  }
</style>
```

---

## 完整的性能监控实现

### 1. 基础版本

```javascript
// performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // 1. 监听 Paint 事件（FP, FCP）
    this.observePaint();

    // 2. 监听 LCP
    this.observeLCP();

    // 3. 监听 FID
    this.observeFID();

    // 4. 监听 CLS
    this.observeCLS();

    // 5. 监听长任务（TBT）
    this.observeLongTasks();

    // 6. 页面卸载时发送数据
    this.setupBeacon();
  }

  observePaint() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-paint") {
          this.metrics.FP = entry.startTime;
          console.log("✅ FP:", entry.startTime.toFixed(2), "ms");
        }

        if (entry.name === "first-contentful-paint") {
          this.metrics.FCP = entry.startTime;
          console.log("✅ FCP:", entry.startTime.toFixed(2), "ms");
        }
      }
    });

    observer.observe({ entryTypes: ["paint"] });
  }

  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
      this.metrics.LCPElement = lastEntry.element?.tagName;

      console.log("✅ LCP:", this.metrics.LCP.toFixed(2), "ms");
      console.log("   元素:", lastEntry.element);
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  }

  observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const FID = entry.processingStart - entry.startTime;
        this.metrics.FID = FID;

        console.log("✅ FID:", FID.toFixed(2), "ms");
        console.log("   输入类型:", entry.name);
      }
    });

    observer.observe({ type: "first-input", buffered: true });
  }

  observeCLS() {
    let clsScore = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }

      this.metrics.CLS = clsScore;
      console.log("✅ CLS:", clsScore.toFixed(4));
    });

    observer.observe({ entryTypes: ["layout-shift"] });
  }

  observeLongTasks() {
    let totalBlockingTime = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          totalBlockingTime += entry.duration - 50;
        }
      }

      this.metrics.TBT = totalBlockingTime;
      console.log("✅ TBT:", totalBlockingTime.toFixed(2), "ms");
    });

    observer.observe({ entryTypes: ["longtask"] });
  }

  setupBeacon() {
    // 页面卸载时发送数据
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.sendMetrics();
      }
    });

    window.addEventListener("pagehide", () => {
      this.sendMetrics();
    });
  }

  sendMetrics() {
    const data = JSON.stringify({
      url: window.location.href,
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // 使用 sendBeacon 确保数据发送
    navigator.sendBeacon("/api/analytics", data);

    console.log("📊 发送性能数据:", this.metrics);
  }

  getMetrics() {
    return this.metrics;
  }
}

// 使用
const monitor = new PerformanceMonitor();

// 获取所有指标
setTimeout(() => {
  console.table(monitor.getMetrics());
}, 5000);
```

---

### 2. 使用 web-vitals 库（推荐）

```javascript
// 安装
// npm install web-vitals

import { onCLS, onFID, onLCP, onFCP, onTTFB } from "web-vitals";

// 统一的分析函数
function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // 发送到分析服务
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", body);
  } else {
    fetch("/api/analytics", {
      body,
      method: "POST",
      keepalive: true,
    });
  }

  console.log(`${metric.name}:`, metric.value, "ms", `(${metric.rating})`);
}

// 监听所有 Core Web Vitals
onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// 自定义配置
onLCP(sendToAnalytics, {
  reportAllChanges: true, // 报告所有变化，不只是最终值
});
```

---

## 其他重要指标

### TTFB (Time to First Byte) - 首字节时间

**定义**：从请求发出到接收到**第一个字节**的时间。

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === "navigation") {
      const ttfb = entry.responseStart - entry.requestStart;
      console.log("TTFB:", ttfb, "ms");
    }
  }
});

observer.observe({ entryTypes: ["navigation"] });

// 或直接获取
const [navigationEntry] = performance.getEntriesByType("navigation");
if (navigationEntry) {
  const ttfb = navigationEntry.responseStart;
  console.log("TTFB:", ttfb, "ms");
}
```

### DOMContentLoaded 和 Load

```javascript
// DOMContentLoaded: HTML 解析完成
window.addEventListener("DOMContentLoaded", () => {
  const domContentLoaded = performance.now();
  console.log("DOMContentLoaded:", domContentLoaded, "ms");
});

// Load: 所有资源加载完成
window.addEventListener("load", () => {
  const loadTime = performance.now();
  console.log("Load:", loadTime, "ms");

  // 获取详细信息
  const [navigation] = performance.getEntriesByType("navigation");
  console.log(
    "DNS 查询:",
    navigation.domainLookupEnd - navigation.domainLookupStart,
    "ms"
  );
  console.log(
    "TCP 连接:",
    navigation.connectEnd - navigation.connectStart,
    "ms"
  );
  console.log(
    "请求时间:",
    navigation.responseEnd - navigation.requestStart,
    "ms"
  );
  console.log(
    "DOM 解析:",
    navigation.domComplete - navigation.domInteractive,
    "ms"
  );
});
```

---

## 完整的性能监控系统

### 前端监控代码

```javascript
// analytics.js
class WebVitalsAnalytics {
  constructor(options = {}) {
    this.endpoint = options.endpoint || "/api/analytics";
    this.appId = options.appId;
    this.sessionId = this.generateSessionId();
    this.metrics = {};

    this.init();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  init() {
    // 使用 web-vitals 库
    import("web-vitals").then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
      onCLS(this.handleMetric.bind(this));
      onFID(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
    });

    // 自定义指标
    this.trackCustomMetrics();
  }

  handleMetric(metric) {
    this.metrics[metric.name] = metric.value;

    const data = {
      appId: this.appId,
      sessionId: this.sessionId,
      metricName: metric.name,
      metricValue: metric.value,
      rating: metric.rating,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      // 额外上下文
      connection: navigator.connection?.effectiveType,
      deviceMemory: navigator.deviceMemory,
    };

    this.send(data);
  }

  trackCustomMetrics() {
    // 1. 首屏时间
    window.addEventListener("load", () => {
      const firstScreenTime = performance.now();
      this.send({
        metricName: "FirstScreen",
        metricValue: firstScreenTime,
      });
    });

    // 2. 资源加载时间
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) {
          // 慢资源
          this.send({
            metricName: "SlowResource",
            resourceName: entry.name,
            duration: entry.duration,
          });
        }
      }
    });

    resourceObserver.observe({ entryTypes: ["resource"] });

    // 3. 错误监控
    window.addEventListener("error", (e) => {
      this.send({
        metricName: "JSError",
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    });
  }

  send(data) {
    const payload = JSON.stringify({
      ...data,
      appId: this.appId,
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: Date.now(),
    });

    // 优先使用 sendBeacon
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, payload);
    } else {
      // 降级到 fetch
      fetch(this.endpoint, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch((err) => console.error("发送失败:", err));
    }
  }

  // 获取所有指标
  getAllMetrics() {
    return {
      ...this.metrics,
      // Navigation Timing
      ...this.getNavigationTiming(),
    };
  }

  getNavigationTiming() {
    const [nav] = performance.getEntriesByType("navigation");
    if (!nav) return {};

    return {
      DNS: nav.domainLookupEnd - nav.domainLookupStart,
      TCP: nav.connectEnd - nav.connectStart,
      TTFB: nav.responseStart - nav.requestStart,
      DOMParse: nav.domInteractive - nav.responseEnd,
      ResourceLoad: nav.loadEventStart - nav.domContentLoadedEventEnd,
      Total: nav.loadEventEnd - nav.fetchStart,
    };
  }
}

// 初始化
const analytics = new WebVitalsAnalytics({
  appId: "my-app",
  endpoint: "https://analytics.example.com/collect",
});

// 查看所有指标
setTimeout(() => {
  console.table(analytics.getAllMetrics());
}, 5000);
```

---

## 服务器端收集和分析

### Node.js 后端示例

```javascript
// server.js
const express = require("express");
const app = express();

app.use(express.json());

// 存储性能数据
const metricsStore = [];

app.post("/api/analytics", (req, res) => {
  const data = req.body;

  // 验证数据
  if (!data.metricName || !data.metricValue) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // 存储数据（实际应该存到数据库）
  metricsStore.push({
    ...data,
    receivedAt: new Date().toISOString(),
  });

  console.log("收到性能数据:", {
    metric: data.metricName,
    value: data.metricValue,
    url: data.url,
  });

  res.status(200).json({ success: true });
});

// 查询接口
app.get("/api/analytics/stats", (req, res) => {
  // 按指标类型分组
  const stats = metricsStore.reduce((acc, item) => {
    const metric = item.metricName;
    if (!acc[metric]) {
      acc[metric] = {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
      };
    }

    acc[metric].count++;
    acc[metric].total += item.metricValue;
    acc[metric].min = Math.min(acc[metric].min, item.metricValue);
    acc[metric].max = Math.max(acc[metric].max, item.metricValue);
    acc[metric].values.push(item.metricValue);

    return acc;
  }, {});

  // 计算平均值和中位数
  Object.keys(stats).forEach((metric) => {
    const data = stats[metric];
    data.average = data.total / data.count;

    // 计算中位数
    const sorted = data.values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    data.median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // P75, P95, P99
    data.p75 = sorted[Math.floor(sorted.length * 0.75)];
    data.p95 = sorted[Math.floor(sorted.length * 0.95)];
    data.p99 = sorted[Math.floor(sorted.length * 0.99)];

    delete data.values; // 删除原始数据，减少响应大小
  });

  res.json(stats);
});

app.listen(3000, () => {
  console.log("Analytics server running on port 3000");
});
```

---

## 实用代码片段

### 一键复制的监控代码

```javascript
// 复制到你的项目中
(function () {
  // 性能指标收集
  const metrics = {};

  // FCP
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        metrics.FCP = entry.startTime;
        console.log("FCP:", entry.startTime.toFixed(2), "ms");
      }
    }
  }).observe({ entryTypes: ["paint"] });

  // LCP
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
    console.log("LCP:", metrics.LCP.toFixed(2), "ms");
  }).observe({ entryTypes: ["largest-contentful-paint"] });

  // FID
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      metrics.FID = entry.processingStart - entry.startTime;
      console.log("FID:", metrics.FID.toFixed(2), "ms");
    }
  }).observe({ type: "first-input", buffered: true });

  // CLS
  let cls = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        cls += entry.value;
      }
    }
    metrics.CLS = cls;
    console.log("CLS:", cls.toFixed(4));
  }).observe({ entryTypes: ["layout-shift"] });

  // 导出到全局
  window.getPerformanceMetrics = () => metrics;
})();
```

---

## 性能指标对比图

```
页面加载时间线：

0ms
│
├─ 开始加载
│
100ms
├─ ✅ FP (First Paint)
│   └─ 首次像素绘制（背景色）
│
250ms
├─ ✅ FCP (First Contentful Paint)
│   └─ 首次内容绘制（文字/图片）
│
800ms
├─ ✅ LCP (Largest Contentful Paint)
│   └─ 最大内容绘制（主要内容）
│
1000ms
├─ 用户首次点击
│
1050ms
├─ ✅ FID (First Input Delay = 50ms)
│   └─ 浏览器开始响应
│
2000ms
├─ ✅ TTI (Time to Interactive)
│   └─ 页面完全可交互
│
整个生命周期
└─ ✅ CLS (Cumulative Layout Shift)
    └─ 累积布局偏移分数
```

---

## 总结

### Core Web Vitals（核心指标）⭐⭐⭐⭐⭐

Google 重点关注的三个指标（影响 SEO）：

| 指标    | 含义         | 好分数  | 关注点     |
| ------- | ------------ | ------- | ---------- |
| **LCP** | 最大内容绘制 | < 2.5s  | 加载性能   |
| **FID** | 首次输入延迟 | < 100ms | 交互性     |
| **CLS** | 累积布局偏移 | < 0.1   | 视觉稳定性 |

### 监控工具

| 工具                   | 类型              | 特点                 |
| ---------------------- | ----------------- | -------------------- |
| **Lighthouse**         | 实验室数据        | Chrome DevTools 内置 |
| **PageSpeed Insights** | 实验室 + 真实数据 | Google 官方工具      |
| **web-vitals**         | 真实用户数据      | JavaScript 库        |
| **Chrome DevTools**    | 实验室数据        | Performance 面板     |
| **Google Analytics**   | 真实用户数据      | 需配置 web-vitals    |

### 快速检测命令

```bash
# 使用 Lighthouse CLI
npm install -g lighthouse
lighthouse https://example.com --view

# 使用 PageSpeed Insights API
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&category=performance"
```

### 最佳实践

```javascript
// 1. 在项目中集成 web-vitals
import { getCLS, getFID, getLCP } from "web-vitals";

function sendToGoogleAnalytics({ name, value, id }) {
  gtag("event", name, {
    value: Math.round(name === "CLS" ? value * 1000 : value),
    event_category: "Web Vitals",
    event_label: id,
    non_interaction: true,
  });
}

getCLS(sendToGoogleAnalytics);
getFID(sendToGoogleAnalytics);
getLCP(sendToGoogleAnalytics);

// 2. 定期检查和优化
// 3. 设置性能预算
// 4. 持续监控真实用户数据（RUM）
```

掌握这些性能指标，能有效优化网站加载速度和用户体验！
