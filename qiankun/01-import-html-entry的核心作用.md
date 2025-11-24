# 问题1：import-html-entry 的核心作用是什么？它解决了微前端中的哪些关键问题？

## 📌 核心作用

`import-html-entry` 是一个轻量级的 HTML 入口解析库，是 qiankun 微前端框架的核心依赖之一。它的主要作用是：

**将一个 HTML 文件作为微应用的入口，解析并动态加载其中的 JavaScript 和 CSS 资源。**

## 🎯 解决的核心问题

### 1. **HTML 入口方式的微应用加载**

传统的 JavaScript 模块加载（如 SystemJS、AMD）需要直接指定 JS 文件入口，而 import-html-entry 允许以 HTML 文件作为入口，这更符合实际的 Web 应用部署方式。

**源码体现：**
```javascript
// src/index.js: 310-359
export default function importHTML(url, opts = {}) {
    // ...
    return embedHTMLCache[url] || (embedHTMLCache[url] = fetch(url)
        .then(response => readResAsString(response, autoDecodeResponse))
        .then(html => {
            const assetPublicPath = getPublicPath(url);
            const { template, scripts, entry, styles } = processTpl(
                getTemplate(html), 
                assetPublicPath, 
                postProcessTemplate
            );

            return getEmbedHTML(template, styles, { fetch }).then(embedHTML => ({
                template: embedHTML,
                assetPublicPath,
                getExternalScripts: () => getExternalScripts(scripts, fetch),
                getExternalStyleSheets: () => getExternalStyleSheets(styles, fetch),
                execScripts: (proxy, strictGlobal, opts = {}) => {
                    // 执行脚本逻辑
                }
            }));
        }));
}
```

### 2. **资源解析与提取**

从 HTML 中自动识别和提取：
- 外链脚本（`<script src="...">`）
- 内联脚本（`<script>...</script>`）
- 外链样式（`<link rel="stylesheet">`）
- 内联样式（`<style>...</style>`）

**源码体现：**
```javascript
// src/process-tpl.js: 60-210
export default function processTpl(tpl, baseURI, postProcessTemplate) {
    let scripts = [];
    const styles = [];
    let entry = null;

    const template = tpl
        .replace(HTML_COMMENT_REGEX, '') // 移除 HTML 注释
        .replace(LINK_TAG_REGEX, match => { /* 处理 link 标签 */ })
        .replace(STYLE_TAG_REGEX, match => { /* 处理 style 标签 */ })
        .replace(ALL_SCRIPT_REGEX, (match, scriptTag) => { 
            /* 处理 script 标签 */ 
        });

    return {
        template,  // 处理后的 HTML 模板
        scripts,   // 提取的脚本列表
        styles,    // 提取的样式列表
        entry      // 入口脚本
    };
}
```

### 3. **资源加载顺序控制**

确保脚本按照正确的顺序执行，这对于有依赖关系的脚本至关重要。

**源码体现：**
```javascript
// src/index.js: 286-301
function schedule(i, resolvePromise) {
    if (i < scriptsText.length) {
        const script = scriptsText[i];
        const scriptSrc = script.src;
        const inlineScript = script.value;

        exec(scriptSrc, inlineScript, resolvePromise);
        // 递归调度，确保顺序执行
        if (!entry && i === scriptsText.length - 1) {
            resolvePromise();
        } else {
            schedule(i + 1, resolvePromise);
        }
    }
}
```

### 4. **脚本作用域隔离**

支持通过 `proxy` 参数为脚本创建独立的执行上下文，防止全局变量污染。

**源码体现：**
```javascript
// src/index.js: 57-77
function getExecutableScript(scriptSrc, scriptText, opts = {}) {
    const { proxy, strictGlobal, scopedGlobalVariables = [] } = opts;
    
    const globalWindow = (0, eval)('window');
    globalWindow.proxy = proxy;
    
    // 通过 bind 将 proxy 作为 this 绑定
    return strictGlobal
        ? `;(function(){with(this){${scriptText}\n${sourceUrl}}}).bind(window.proxy)();`
        : `;(function(window, self, globalThis){;${scriptText}\n${sourceUrl}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);`;
}
```

### 5. **资源缓存机制**

避免重复加载相同的资源，提升性能。

**源码体现：**
```javascript
// src/index.js: 19-21
const styleCache = {};
const scriptCache = {};
const embedHTMLCache = {};

// 脚本缓存逻辑
const fetchScript = (scriptUrl, opts) => scriptCache[scriptUrl] ||
    (scriptCache[scriptUrl] = fetch(scriptUrl, opts).then(response => {
        // ...
        return response.text();
    }));
```

### 6. **样式内联优化**

将外链 CSS 转换为内联样式，避免样式加载的网络延迟。

**源码体现：**
```javascript
// src/index.js: 39-53
function getEmbedHTML(template, styles, opts = {}) {
    const { fetch = defaultFetch } = opts;
    let embedHTML = template;

    return getExternalStyleSheets(styles, fetch)
        .then(styleSheets => {
            embedHTML = styleSheets.reduce((html, styleSheet) => {
                const styleSrc = styleSheet.src;
                const styleSheetContent = styleSheet.value;
                // 将 link 标签替换为 style 标签
                html = html.replace(
                    genLinkReplaceSymbol(styleSrc), 
                    `<style>/* ${styleSrc} */${styleSheetContent}</style>`
                );
                return html;
            }, embedHTML);
            return embedHTML;
        });
}
```

### 7. **自定义 fetch 支持**

允许自定义资源加载方式，解决跨域、鉴权等问题。

**源码体现：**
```javascript
// src/index.js: 310-333
export default function importHTML(url, opts = {}) {
    let fetch = defaultFetch;
    // ...
    if (opts.fetch) {
        if (typeof opts.fetch === 'function') {
            fetch = opts.fetch;
        } else {
            fetch = opts.fetch.fn || defaultFetch;
            autoDecodeResponse = !!opts.fetch.autoDecodeResponse;
        }
    }
    // 使用自定义 fetch 加载资源
}
```

## 🔑 主要 API

### 1. `importHTML(url, opts)`

加载并解析 HTML 入口文件。

**返回值：**
```javascript
{
    template: string,              // 处理后的 HTML 模板
    assetPublicPath: string,       // 资源公共路径
    getExternalScripts: Function,  // 获取外部脚本
    getExternalStyleSheets: Function, // 获取外部样式
    execScripts: Function          // 执行脚本
}
```

### 2. `importEntry(entry, opts)`

更灵活的入口方式，支持 HTML URL 或配置对象。

**支持的 entry 格式：**
```javascript
// 1. HTML URL
importEntry('http://localhost:8080/index.html')

// 2. 配置对象
importEntry({
    scripts: ['main.js', 'vendor.js'],
    styles: ['main.css'],
    html: '<div id="app"></div>'
})
```

## 🎓 面试要点

1. **核心价值**：以 HTML 作为微应用入口，符合 Web 应用的自然形态
2. **资源管理**：自动解析、加载、缓存 JS/CSS 资源
3. **执行控制**：保证脚本顺序执行，支持作用域隔离
4. **性能优化**：缓存机制、样式内联、异步脚本支持
5. **灵活性**：支持自定义 fetch、模板处理、多种入口格式

## 💡 与 qiankun 的关系

qiankun 通过 import-html-entry 实现：
- 加载子应用的 HTML 入口
- 提取子应用的 JS/CSS 资源
- 配合沙箱机制执行子应用代码
- 实现子应用的样式隔离

可以说，**import-html-entry 是 qiankun 实现"HTML Entry"模式的基础能力提供者**。

