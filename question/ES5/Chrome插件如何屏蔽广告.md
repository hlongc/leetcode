# Chrome 插件如何屏蔽广告

## 概述

Chrome 扩展程序屏蔽广告主要通过以下几种方式：

| 方式         | 原理                    | 优点               | 缺点             |
| ------------ | ----------------------- | ------------------ | ---------------- |
| **请求拦截** | 阻止广告资源加载        | 节省带宽，性能最佳 | 需要维护规则列表 |
| **CSS 隐藏** | 用 CSS 隐藏广告元素     | 简单易用           | 资源仍会加载     |
| **DOM 操作** | JavaScript 删除广告元素 | 灵活精确           | 可能影响性能     |
| **代理过滤** | 通过代理服务器过滤      | 全局生效           | 需要额外服务     |

---

## Chrome 扩展基础结构

### 1. Manifest 文件（清单文件）

```json
// manifest.json (Manifest V3)
{
  "manifest_version": 3,
  "name": "Ad Blocker",
  "version": "1.0.0",
  "description": "简单的广告屏蔽扩展",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": [
    "declarativeNetRequest", // 网络请求拦截（V3 新增）
    "storage", // 本地存储
    "tabs", // 标签页访问
    "activeTab" // 当前活动标签
  ],
  "host_permissions": [
    "<all_urls>" // 所有网站
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  },
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "ruleset_1",
        "enabled": true,
        "path": "rules.json"
      }
    ]
  }
}
```

### 2. 文件结构

```
ad-blocker/
├── manifest.json          # 清单文件
├── background.js          # 后台脚本
├── content.js            # 内容脚本
├── content.css           # 注入的 CSS
├── popup.html            # 弹出页面
├── popup.js              # 弹出页面脚本
├── rules.json            # 拦截规则
├── icons/                # 图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── filters/              # 过滤规则
    ├── easylist.txt
    └── custom.txt
```

---

## 方法一：请求拦截（推荐，性能最佳）

### Manifest V3 方式（declarativeNetRequest）

#### 1. 规则文件（rules.json）

```json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "block"
    },
    "condition": {
      "urlFilter": "*://ads.example.com/*",
      "resourceTypes": ["script", "image", "stylesheet"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": {
      "type": "block"
    },
    "condition": {
      "urlFilter": "*/ads/*",
      "resourceTypes": ["script", "image"]
    }
  },
  {
    "id": 3,
    "priority": 1,
    "action": {
      "type": "block"
    },
    "condition": {
      "regexFilter": "^https?://([a-z0-9-]+\\.)*doubleclick\\.net/",
      "resourceTypes": ["script", "xmlhttprequest", "image"]
    }
  },
  {
    "id": 4,
    "priority": 1,
    "action": {
      "type": "block"
    },
    "condition": {
      "urlFilter": "*://pagead2.googlesyndication.com/*",
      "resourceTypes": ["script"]
    }
  },
  {
    "id": 5,
    "priority": 1,
    "action": {
      "type": "block"
    },
    "condition": {
      "domains": ["youtube.com"],
      "urlFilter": "*get_video_info*",
      "resourceTypes": ["xmlhttprequest"]
    }
  }
]
```

#### 2. 动态添加规则

```javascript
// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Ad Blocker 已安装");
});

// 动态添加规则
async function addBlockingRule(url) {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  const nextId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: nextId,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: url,
          resourceTypes: ["script", "image", "stylesheet"],
        },
      },
    ],
  });

  console.log(`已添加屏蔽规则: ${url}`);
}

// 从存储中加载自定义规则
chrome.storage.sync.get(["customRules"], (result) => {
  const customRules = result.customRules || [];
  customRules.forEach((rule) => addBlockingRule(rule));
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addRule") {
    addBlockingRule(request.url).then(() => {
      sendResponse({ success: true });
    });
    return true; // 保持消息通道开放
  }

  if (request.action === "getStats") {
    // 获取拦截统计
    chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
      sendResponse({ rulesCount: rules.length });
    });
    return true;
  }
});
```

### Manifest V2 方式（webRequest，即将废弃）

```javascript
// background.js (Manifest V2)
const adDomains = [
  "*://*.doubleclick.net/*",
  "*://pagead2.googlesyndication.com/*",
  "*://*.googlesyndication.com/*",
  "*://*.google-analytics.com/*",
  "*://ads.*.com/*",
  "*://*/ads/*",
  "*://*/ad/*",
  "*://*/banner/*",
];

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log("拦截请求:", details.url);
    return { cancel: true }; // 取消请求
  },
  { urls: adDomains },
  ["blocking"]
);

// 统计拦截数量
let blockedCount = 0;

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    blockedCount++;
    chrome.storage.local.set({ blockedCount });

    // 更新 badge
    chrome.action.setBadgeText({ text: blockedCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

    return { cancel: true };
  },
  { urls: adDomains },
  ["blocking"]
);
```

---

## 方法二：CSS 隐藏

### 1. 注入 CSS（content.css）

```css
/* 通用广告选择器 */
.ad,
.ads,
.advertisement,
.banner,
.sponsored,
.sponsor,
[class*="ad-"],
[class*="ads-"],
[id*="ad-"],
[id*="ads-"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  height: 0 !important;
  width: 0 !important;
}

/* Google Ads */
ins.adsbygoogle,
.adsbygoogle {
  display: none !important;
}

/* YouTube 广告 */
.video-ads,
.ytp-ad-module,
.ytp-ad-overlay-container {
  display: none !important;
}

/* 社交媒体推广内容 */
[data-ad-type],
[data-sponsored],
article[data-promoted] {
  display: none !important;
}

/* 修复布局问题 */
body {
  /* 防止广告占位空白 */
}
```

### 2. 动态注入 CSS

```javascript
// content.js
function injectCSS() {
  const style = document.createElement("style");
  style.textContent = `
    /* 动态广告选择器 */
    iframe[src*="doubleclick"],
    iframe[src*="googlesyndication"],
    iframe[src*="/ads/"],
    div[class*="AdContainer"],
    div[id*="google_ads"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  console.log("CSS 广告屏蔽已注入");
}

// 页面加载时立即执行
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectCSS);
} else {
  injectCSS();
}
```

---

## 方法三：DOM 操作

### 1. 基础版本

```javascript
// content.js
(function () {
  "use strict";

  // 广告相关的选择器
  const adSelectors = [
    ".ad",
    ".ads",
    ".advertisement",
    ".banner",
    '[class*="ad-"]',
    '[class*="ads-"]',
    '[id*="ad-"]',
    '[id*="ads-"]',
    "ins.adsbygoogle",
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
  ];

  // 移除广告元素
  function removeAds() {
    let removedCount = 0;

    adSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.remove();
        removedCount++;
      });
    });

    if (removedCount > 0) {
      console.log(`已移除 ${removedCount} 个广告元素`);
    }
  }

  // 初始移除
  removeAds();

  // 监听 DOM 变化（处理动态加载的广告）
  const observer = new MutationObserver((mutations) => {
    removeAds();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("广告屏蔽器已启动");
})();
```

### 2. 高级版本（带性能优化）

```javascript
// content.js
class AdBlocker {
  constructor() {
    this.adSelectors = [
      ".ad",
      ".ads",
      ".advertisement",
      "[class*='ad-']",
      '[id*="ad-"]',
      "ins.adsbygoogle",
      'iframe[src*="doubleclick"]',
    ];

    this.blockedCount = 0;
    this.observer = null;
    this.debounceTimer = null;
  }

  // 检查元素是否是广告
  isAdElement(element) {
    // 检查类名
    const className = element.className || "";
    if (
      typeof className === "string" &&
      /\b(ad|ads|advertisement|banner|sponsored)\b/i.test(className)
    ) {
      return true;
    }

    // 检查 ID
    const id = element.id || "";
    if (/\b(ad|ads|advertisement)\b/i.test(id)) {
      return true;
    }

    // 检查 data 属性
    if (element.dataset.ad || element.dataset.sponsored) {
      return true;
    }

    // 检查 iframe src
    if (element.tagName === "IFRAME") {
      const src = element.src || "";
      if (/doubleclick|googlesyndication|ads\./i.test(src)) {
        return true;
      }
    }

    return false;
  }

  // 移除广告元素
  removeAds() {
    const elements = document.querySelectorAll("*");
    let removed = 0;

    elements.forEach((el) => {
      if (this.isAdElement(el) && el.parentNode) {
        // 检查是否已经被标记为广告
        if (!el.dataset.adBlocked) {
          el.dataset.adBlocked = "true";
          el.style.display = "none";
          removed++;
        }
      }
    });

    if (removed > 0) {
      this.blockedCount += removed;
      this.updateBadge();
      console.log(`本次移除 ${removed} 个广告，总计 ${this.blockedCount} 个`);
    }
  }

  // 防抖处理
  debouncedRemoveAds() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.removeAds();
    }, 100);
  }

  // 更新扩展图标徽章
  updateBadge() {
    chrome.runtime.sendMessage({
      action: "updateBadge",
      count: this.blockedCount,
    });
  }

  // 启动观察器
  startObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
      }

      if (shouldCheck) {
        this.debouncedRemoveAds();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 初始化
  init() {
    console.log("Ad Blocker 初始化...");

    // 立即执行一次
    this.removeAds();

    // 启动观察器
    this.startObserver();

    // 定期检查（备用）
    setInterval(() => {
      this.removeAds();
    }, 5000);
  }
}

// 启动广告屏蔽器
const adBlocker = new AdBlocker();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => adBlocker.init());
} else {
  adBlocker.init();
}
```

---

## 完整示例：功能齐全的广告屏蔽器

### 1. Popup 界面（popup.html）

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Ad Blocker</title>
    <style>
      body {
        width: 300px;
        padding: 15px;
        font-family: Arial, sans-serif;
      }

      .header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
      }

      .header img {
        width: 32px;
        height: 32px;
        margin-right: 10px;
      }

      .stats {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 15px;
      }

      .stats-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .stats-number {
        font-size: 24px;
        font-weight: bold;
        color: #4caf50;
      }

      .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
      }

      .switch {
        position: relative;
        width: 50px;
        height: 24px;
      }

      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.4s;
        border-radius: 24px;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }

      input:checked + .slider {
        background-color: #4caf50;
      }

      input:checked + .slider:before {
        transform: translateX(26px);
      }

      .btn {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-primary {
        background: #2196f3;
        color: white;
      }

      .btn-danger {
        background: #f44336;
        color: white;
      }

      .btn:hover {
        opacity: 0.8;
      }

      .custom-rule {
        margin-top: 15px;
      }

      .custom-rule input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 3px;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="icons/icon48.png" alt="Ad Blocker" />
      <h2>Ad Blocker</h2>
    </div>

    <div class="stats">
      <div class="stats-item">
        <span>已拦截广告:</span>
        <span class="stats-number" id="blockedCount">0</span>
      </div>
      <div class="stats-item">
        <span>规则数量:</span>
        <span id="rulesCount">0</span>
      </div>
    </div>

    <div class="toggle">
      <span>启用广告屏蔽</span>
      <label class="switch">
        <input type="checkbox" id="enableToggle" checked />
        <span class="slider"></span>
      </label>
    </div>

    <button class="btn btn-primary" id="refreshBtn">刷新当前页面</button>
    <button class="btn btn-danger" id="clearStatsBtn">清除统计</button>

    <div class="custom-rule">
      <h4>添加自定义规则</h4>
      <input
        type="text"
        id="customRuleInput"
        placeholder="例如: *://ads.example.com/*"
      />
      <button class="btn btn-primary" id="addRuleBtn">添加规则</button>
    </div>

    <script src="popup.js"></script>
  </body>
</html>
```

### 2. Popup 脚本（popup.js）

```javascript
// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const blockedCountEl = document.getElementById("blockedCount");
  const rulesCountEl = document.getElementById("rulesCount");
  const enableToggle = document.getElementById("enableToggle");
  const refreshBtn = document.getElementById("refreshBtn");
  const clearStatsBtn = document.getElementById("clearStatsBtn");
  const addRuleBtn = document.getElementById("addRuleBtn");
  const customRuleInput = document.getElementById("customRuleInput");

  // 加载统计数据
  function loadStats() {
    chrome.storage.local.get(["blockedCount", "enabled"], (result) => {
      blockedCountEl.textContent = result.blockedCount || 0;
      enableToggle.checked = result.enabled !== false;
    });

    chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
      rulesCountEl.textContent = rules.length;
    });
  }

  // 初始加载
  loadStats();

  // 启用/禁用切换
  enableToggle.addEventListener("change", () => {
    const enabled = enableToggle.checked;
    chrome.storage.local.set({ enabled });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: enabled ? "enable" : "disable",
      });
    });
  });

  // 刷新按钮
  refreshBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
      window.close();
    });
  });

  // 清除统计
  clearStatsBtn.addEventListener("click", () => {
    chrome.storage.local.set({ blockedCount: 0 }, () => {
      blockedCountEl.textContent = "0";
      chrome.action.setBadgeText({ text: "" });
    });
  });

  // 添加自定义规则
  addRuleBtn.addEventListener("click", async () => {
    const rule = customRuleInput.value.trim();
    if (!rule) {
      alert("请输入规则");
      return;
    }

    try {
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      const nextId =
        rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;

      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
          {
            id: nextId,
            priority: 1,
            action: { type: "block" },
            condition: {
              urlFilter: rule,
              resourceTypes: [
                "script",
                "image",
                "stylesheet",
                "xmlhttprequest",
              ],
            },
          },
        ],
      });

      customRuleInput.value = "";
      alert("规则添加成功");
      loadStats();
    } catch (error) {
      alert("规则添加失败: " + error.message);
    }
  });
});
```

---

## 高级功能

### 1. EasyList 规则解析

```javascript
// easylist-parser.js
class EasyListParser {
  constructor() {
    this.rules = [];
  }

  // 解析 EasyList 格式的规则
  parseRule(line) {
    line = line.trim();

    // 忽略注释和空行
    if (!line || line.startsWith("!") || line.startsWith("[")) {
      return null;
    }

    // CSS 选择器规则 (##)
    if (line.includes("##")) {
      const [domain, selector] = line.split("##");
      return {
        type: "css",
        domain: domain || "*",
        selector: selector,
      };
    }

    // 元素隐藏规则 (#@#)
    if (line.includes("#@#")) {
      return null; // 白名单规则，暂不处理
    }

    // URL 过滤规则
    if (line.startsWith("||")) {
      // 域名规则
      let url = line.substring(2);
      const options = {};

      if (url.includes("$")) {
        [url, optionsStr] = url.split("$");
        optionsStr.split(",").forEach((opt) => {
          if (opt.startsWith("~")) {
            options.exclude = opt.substring(1);
          } else {
            options[opt] = true;
          }
        });
      }

      return {
        type: "url",
        pattern: url,
        options: options,
      };
    }

    // 通配符规则
    if (line.includes("*")) {
      return {
        type: "url",
        pattern: line,
        options: {},
      };
    }

    return null;
  }

  // 从文本加载规则
  async loadFromText(text) {
    const lines = text.split("\n");
    const rules = [];

    for (const line of lines) {
      const rule = this.parseRule(line);
      if (rule) {
        rules.push(rule);
      }
    }

    this.rules = rules;
    console.log(`已加载 ${rules.length} 条规则`);
    return rules;
  }

  // 从 URL 加载规则
  async loadFromURL(url) {
    const response = await fetch(url);
    const text = await response.text();
    return this.loadFromText(text);
  }

  // 转换为 Chrome 规则格式
  toChromeRules() {
    const chromeRules = [];
    let id = 1;

    this.rules.forEach((rule) => {
      if (rule.type === "url") {
        chromeRules.push({
          id: id++,
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: rule.pattern,
            resourceTypes: ["script", "image", "stylesheet", "xmlhttprequest"],
          },
        });
      }
    });

    return chromeRules;
  }
}

// 使用示例
const parser = new EasyListParser();
parser
  .loadFromURL("https://easylist.to/easylist/easylist.txt")
  .then((rules) => {
    const chromeRules = parser.toChromeRules();
    console.log("转换的 Chrome 规则数量:", chromeRules.length);
  });
```

### 2. 白名单功能

```javascript
// whitelist.js
class Whitelist {
  constructor() {
    this.domains = new Set();
    this.load();
  }

  // 从存储加载白名单
  async load() {
    const result = await chrome.storage.sync.get(["whitelist"]);
    this.domains = new Set(result.whitelist || []);
  }

  // 保存白名单
  async save() {
    await chrome.storage.sync.set({
      whitelist: Array.from(this.domains),
    });
  }

  // 添加域名
  async add(domain) {
    this.domains.add(domain);
    await this.save();
  }

  // 移除域名
  async remove(domain) {
    this.domains.delete(domain);
    await this.save();
  }

  // 检查域名是否在白名单
  has(domain) {
    return this.domains.has(domain);
  }

  // 从 URL 提取域名
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  }
}

// 在 content script 中使用
chrome.storage.sync.get(["whitelist"], (result) => {
  const whitelist = new Set(result.whitelist || []);
  const currentDomain = new URL(window.location.href).hostname;

  if (whitelist.has(currentDomain)) {
    console.log("当前网站在白名单中，不屏蔽广告");
  } else {
    // 执行广告屏蔽
    startAdBlocking();
  }
});
```

### 3. 统计和日志

```javascript
// analytics.js
class AdBlockerAnalytics {
  constructor() {
    this.stats = {
      totalBlocked: 0,
      blockedByDomain: {},
      blockedByType: {},
      dailyBlocked: {},
    };
    this.load();
  }

  async load() {
    const result = await chrome.storage.local.get(["stats"]);
    if (result.stats) {
      this.stats = result.stats;
    }
  }

  async save() {
    await chrome.storage.local.set({ stats: this.stats });
  }

  // 记录拦截
  recordBlock(url, type) {
    this.stats.totalBlocked++;

    // 按域名统计
    const domain = new URL(url).hostname;
    this.stats.blockedByDomain[domain] =
      (this.stats.blockedByDomain[domain] || 0) + 1;

    // 按类型统计
    this.stats.blockedByType[type] = (this.stats.blockedByType[type] || 0) + 1;

    // 按日期统计
    const today = new Date().toISOString().split("T")[0];
    this.stats.dailyBlocked[today] = (this.stats.dailyBlocked[today] || 0) + 1;

    this.save();

    // 更新徽章
    chrome.action.setBadgeText({
      text: this.stats.totalBlocked.toString(),
    });
  }

  // 获取统计数据
  getStats() {
    return this.stats;
  }

  // 重置统计
  reset() {
    this.stats = {
      totalBlocked: 0,
      blockedByDomain: {},
      blockedByType: {},
      dailyBlocked: {},
    };
    this.save();
    chrome.action.setBadgeText({ text: "" });
  }
}

// 使用
const analytics = new AdBlockerAnalytics();
```

---

## 性能优化

### 1. 使用 Bloom Filter（布隆过滤器）

```javascript
// bloom-filter.js
class BloomFilter {
  constructor(size = 10000) {
    this.size = size;
    this.bits = new Uint8Array(Math.ceil(size / 8));
    this.numHashes = 3;
  }

  // 哈希函数
  hash(str, seed = 0) {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.size;
  }

  // 添加元素
  add(item) {
    for (let i = 0; i < this.numHashes; i++) {
      const index = this.hash(item, i);
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      this.bits[byteIndex] |= 1 << bitIndex;
    }
  }

  // 检查元素是否可能存在
  mightContain(item) {
    for (let i = 0; i < this.numHashes; i++) {
      const index = this.hash(item, i);
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((this.bits[byteIndex] & (1 << bitIndex)) === 0) {
        return false;
      }
    }
    return true;
  }
}

// 使用 Bloom Filter 快速检查 URL
const adFilter = new BloomFilter(100000);

// 添加已知广告域名
const adDomains = [
  "doubleclick.net",
  "googlesyndication.com",
  "google-analytics.com",
  // ... 更多域名
];

adDomains.forEach((domain) => adFilter.add(domain));

// 快速检查
function isLikelyAd(url) {
  const domain = new URL(url).hostname;
  return adFilter.mightContain(domain);
}
```

### 2. 延迟加载和批处理

```javascript
// 批处理 DOM 操作
class BatchDOMProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(callback) {
    this.queue.push(callback);
    this.scheduleProcess();
  }

  scheduleProcess() {
    if (this.processing) return;

    this.processing = true;
    requestIdleCallback(() => {
      this.process();
    });
  }

  process() {
    const batch = this.queue.splice(0, 100); // 每次处理 100 个

    batch.forEach((callback) => {
      try {
        callback();
      } catch (e) {
        console.error("批处理错误:", e);
      }
    });

    if (this.queue.length > 0) {
      requestAnimationFrame(() => {
        this.processing = false;
        this.scheduleProcess();
      });
    } else {
      this.processing = false;
    }
  }
}

const processor = new BatchDOMProcessor();

// 使用
document.querySelectorAll(".ad").forEach((ad) => {
  processor.add(() => {
    ad.remove();
  });
});
```

---

## 调试和测试

### 测试页面

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ad Blocker 测试页面</title>
  </head>
  <body>
    <h1>广告屏蔽测试</h1>

    <!-- 模拟各种广告 -->
    <div class="ad">广告 1（类名）</div>
    <div id="ad-banner">广告 2（ID）</div>
    <div class="advertisement">广告 3</div>
    <div data-ad="true">广告 4（data 属性）</div>
    <ins class="adsbygoogle">Google Ads</ins>

    <!-- 外部广告脚本 -->
    <script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

    <!-- iframe 广告 -->
    <iframe src="https://ads.example.com/banner.html"></iframe>

    <script>
      console.log("测试页面加载完成");
      console.log(
        "广告元素数量:",
        document.querySelectorAll(".ad, #ad-banner").length
      );
    </script>
  </body>
</html>
```

---

## 总结

### 推荐方案

| 场景         | 推荐方法                    | 原因              |
| ------------ | --------------------------- | ----------------- |
| **一般使用** | declarativeNetRequest + CSS | 性能最佳，兼容 V3 |
| **高级定制** | DOM 操作 + 规则解析         | 灵活精确          |
| **兼容性**   | 混合使用多种方法            | 覆盖更多场景      |

### 关键要点

✅ **Manifest V3**：使用 `declarativeNetRequest` 代替 `webRequest`  
✅ **性能优化**：使用防抖、批处理、Bloom Filter  
✅ **用户体验**：提供白名单、统计、自定义规则  
✅ **规则更新**：支持导入 EasyList 等规则库  
✅ **调试友好**：添加日志、统计面板

### 完整流程

```
1. 请求拦截 (declarativeNetRequest)
   ↓
2. CSS 隐藏 (content.css)
   ↓
3. DOM 扫描 (content.js)
   ↓
4. 白名单检查
   ↓
5. 统计更新
```

这套方案结合了性能、功能和用户体验，是构建现代 Chrome 广告屏蔽扩展的最佳实践！
