# 问题2：import-html-entry 是如何解析 HTML 模板的？processTpl 函数的实现原理是什么？

## 📌 函数签名

```javascript
// src/process-tpl.js: 60
export default function processTpl(tpl, baseURI, postProcessTemplate)
```

**参数说明：**
- `tpl`: 原始 HTML 模板字符串
- `baseURI`: 资源的基础路径（用于补全相对路径）
- `postProcessTemplate`: 后处理函数（可选）

**返回值：**
```javascript
{
    template: string,   // 处理后的 HTML 模板（脚本和样式被替换为注释）
    scripts: Array,     // 提取的脚本列表（URL 或内联代码）
    styles: Array,      // 提取的样式列表（URL）
    entry: string       // 入口脚本（最后一个脚本或标记为 entry 的脚本）
}
```

## 🔍 核心实现原理

### 1. **正则表达式定义**

processTpl 使用一系列正则表达式来匹配 HTML 标签：

```javascript
// src/process-tpl.js: 8-27
const ALL_SCRIPT_REGEX = /(<script[\s\S]*?>)[\s\S]*?<\/script>/gi;
const SCRIPT_TAG_REGEX = /<(script)\s+((?!type=('|")text\/ng-template\3).)*?>.*?<\/\1>/is;
const SCRIPT_SRC_REGEX = /.*\ssrc=('|")?([^>'"\s]+)/;
const SCRIPT_TYPE_REGEX = /.*\stype=('|")?([^>'"\s]+)/;
const SCRIPT_ENTRY_REGEX = /.*\sentry\s*.*/;
const SCRIPT_ASYNC_REGEX = /.*\sasync\s*.*/;
const SCRIPT_CROSSORIGIN_REGEX = /.*\scrossorigin=('|")?use-credentials\1/;
const SCRIPT_NO_MODULE_REGEX = /.*\snomodule\s*.*/;
const SCRIPT_MODULE_REGEX = /.*\stype=('|")?module('|")?\s*.*/;

const LINK_TAG_REGEX = /<(link)\s+.*?>/isg;
const LINK_PRELOAD_OR_PREFETCH_REGEX = /\srel=('|")?(preload|prefetch)\1/;
const LINK_HREF_REGEX = /.*\shref=('|")?([^>'"\s]+)/;
const STYLE_TAG_REGEX = /<style[^>]*>[\s\S]*?<\/style>/gi;
const STYLE_TYPE_REGEX = /\s+rel=('|")?stylesheet\1.*/;

const HTML_COMMENT_REGEX = /<!--([\s\S]*?)-->/g;
const LINK_IGNORE_REGEX = /<link(\s+|\s+.+\s+)ignore(\s*|\s+.*|=.*)>/is;
const STYLE_IGNORE_REGEX = /<style(\s+|\s+.+\s+)ignore(\s*|\s+.*|=.*)>/is;
const SCRIPT_IGNORE_REGEX = /<script(\s+|\s+.+\s+)ignore(\s*|\s+.*|=.*)>/is;
```

### 2. **解析流程（四步替换法）**

processTpl 的核心是通过链式调用 `replace` 方法处理 HTML：

```javascript
// src/process-tpl.js: 67-191
const template = tpl
    // 第一步：移除 HTML 注释
    .replace(HTML_COMMENT_REGEX, '')
    
    // 第二步：处理 link 标签
    .replace(LINK_TAG_REGEX, match => { /* ... */ })
    
    // 第三步：处理 style 标签
    .replace(STYLE_TAG_REGEX, match => { /* ... */ })
    
    // 第四步：处理 script 标签
    .replace(ALL_SCRIPT_REGEX, (match, scriptTag) => { /* ... */ });
```

## 📋 详细解析步骤

### 步骤一：移除 HTML 注释

```javascript
.replace(HTML_COMMENT_REGEX, '')
```

**目的**：清理注释，避免干扰后续解析。

### 步骤二：处理 link 标签（样式表）

```javascript
// src/process-tpl.js: 74-109
.replace(LINK_TAG_REGEX, match => {
    // 1. 判断是否是样式表
    const styleType = !!match.match(STYLE_TYPE_REGEX);
    if (styleType) {
        const styleHref = match.match(STYLE_HREF_REGEX);
        const styleIgnore = match.match(LINK_IGNORE_REGEX);

        if (styleHref) {
            const href = styleHref && styleHref[2];
            let newHref = href;

            // 2. 补全相对路径
            if (href && !hasProtocol(href)) {
                newHref = getEntirePath(href, baseURI);
            }
            
            // 3. 处理 ignore 属性
            if (styleIgnore) {
                return genIgnoreAssetReplaceSymbol(newHref);
            }

            // 4. 解析 URL 中的转义字符
            newHref = parseUrl(newHref);
            
            // 5. 收集样式 URL
            styles.push(newHref);
            
            // 6. 用注释替换原标签
            return genLinkReplaceSymbol(newHref);
        }
    }

    // 处理 preload/prefetch 链接
    const preloadOrPrefetchType = match.match(LINK_PRELOAD_OR_PREFETCH_REGEX) 
        && match.match(LINK_HREF_REGEX) 
        && !match.match(LINK_AS_FONT);
    if (preloadOrPrefetchType) {
        const [, , linkHref] = match.match(LINK_HREF_REGEX);
        return genLinkReplaceSymbol(linkHref, true);
    }

    return match;
})
```

**关键操作：**
1. 识别 `rel="stylesheet"` 的 link 标签
2. 补全相对路径为完整 URL
3. 收集到 `styles` 数组
4. 用注释占位符替换原标签

**替换示例：**
```html
<!-- 原始 -->
<link rel="stylesheet" href="./main.css">

<!-- 替换后 -->
<!-- link http://localhost:8080/main.css replaced by import-html-entry -->
```

### 步骤三：处理 style 标签（内联样式）

```javascript
// src/process-tpl.js: 110-115
.replace(STYLE_TAG_REGEX, match => {
    if (STYLE_IGNORE_REGEX.test(match)) {
        return genIgnoreAssetReplaceSymbol('style file');
    }
    return match;  // 保留内联样式在 HTML 中
})
```

**注意**：内联样式 `<style>` 标签会保留在 HTML 中，不做提取。

### 步骤四：处理 script 标签（核心逻辑）

这是最复杂的部分，需要区分外链脚本和内联脚本：

```javascript
// src/process-tpl.js: 116-191
.replace(ALL_SCRIPT_REGEX, (match, scriptTag) => {
    const scriptIgnore = scriptTag.match(SCRIPT_IGNORE_REGEX);
    const moduleScriptIgnore =
        (moduleSupport && !!scriptTag.match(SCRIPT_NO_MODULE_REGEX)) ||
        (!moduleSupport && !!scriptTag.match(SCRIPT_MODULE_REGEX));

    // 1. 验证脚本类型
    const matchedScriptTypeMatch = scriptTag.match(SCRIPT_TYPE_REGEX);
    const matchedScriptType = matchedScriptTypeMatch && matchedScriptTypeMatch[2];
    if (!isValidJavaScriptType(matchedScriptType)) {
        return match;  // 非 JS 脚本，保持原样
    }

    // 2. 外链脚本处理
    if (SCRIPT_TAG_REGEX.test(match) && scriptTag.match(SCRIPT_SRC_REGEX)) {
        const matchedScriptEntry = scriptTag.match(SCRIPT_ENTRY_REGEX);
        const matchedScriptSrcMatch = scriptTag.match(SCRIPT_SRC_REGEX);
        let matchedScriptSrc = matchedScriptSrcMatch && matchedScriptSrcMatch[2];

        // 2.1 检查是否标记为 entry
        if (entry && matchedScriptEntry) {
            throw new SyntaxError('You should not set multiply entry script!');
        }

        if (matchedScriptSrc) {
            // 2.2 补全相对路径
            if (!hasProtocol(matchedScriptSrc)) {
                matchedScriptSrc = getEntirePath(matchedScriptSrc, baseURI);
            }
            matchedScriptSrc = parseUrl(matchedScriptSrc);
        }

        // 2.3 记录 entry 脚本
        entry = entry || matchedScriptEntry && matchedScriptSrc;

        // 2.4 处理 ignore 和 module 脚本
        if (scriptIgnore) {
            return genIgnoreAssetReplaceSymbol(matchedScriptSrc || 'js file');
        }
        if (moduleScriptIgnore) {
            return genModuleScriptReplaceSymbol(matchedScriptSrc || 'js file', moduleSupport);
        }

        if (matchedScriptSrc) {
            // 2.5 检测 async 和 crossOrigin 属性
            const asyncScript = !!scriptTag.match(SCRIPT_ASYNC_REGEX);
            const crossOriginScript = !!scriptTag.match(SCRIPT_CROSSORIGIN_REGEX);
            
            // 2.6 收集脚本信息
            scripts.push(
                (asyncScript || crossOriginScript) 
                    ? { async: asyncScript, src: matchedScriptSrc, crossOrigin: crossOriginScript }
                    : matchedScriptSrc
            );
            
            // 2.7 替换为注释
            return genScriptReplaceSymbol(matchedScriptSrc, asyncScript, crossOriginScript);
        }

        return match;
    } 
    // 3. 内联脚本处理
    else {
        if (scriptIgnore) {
            return genIgnoreAssetReplaceSymbol('js file');
        }
        if (moduleScriptIgnore) {
            return genModuleScriptReplaceSymbol('js file', moduleSupport);
        }

        // 3.1 提取内联代码
        const code = getInlineCode(match);

        // 3.2 过滤纯注释代码块
        const isPureCommentBlock = code.split(/[\r\n]+/)
            .every(line => !line.trim() || line.trim().startsWith('//'));

        if (!isPureCommentBlock) {
            scripts.push(match);  // 保存完整的 script 标签
        }

        // 3.3 替换为注释
        return inlineScriptReplaceSymbol;
    }
})
```

**外链脚本处理流程：**
1. 提取 `src` 属性
2. 补全相对路径
3. 检测 `entry`、`async`、`crossorigin` 属性
4. 收集到 `scripts` 数组（字符串或对象）
5. 用注释替换

**内联脚本处理流程：**
1. 提取 `<script>` 标签内的代码
2. 过滤纯注释块
3. 收集完整的 `<script>...</script>` 标签
4. 用注释替换

**替换示例：**
```html
<!-- 外链脚本 -->
<script src="./main.js"></script>
<!-- 替换为 -->
<!-- script http://localhost:8080/main.js replaced by import-html-entry -->

<!-- 内联脚本 -->
<script>console.log('hello')</script>
<!-- 替换为 -->
<!-- inline scripts replaced by import-html-entry -->

<!-- async 脚本 -->
<script async src="./analytics.js"></script>
<!-- 替换为 -->
<!-- async script http://localhost:8080/analytics.js replaced by import-html-entry -->
```

## 🔧 辅助函数

### 1. 路径补全

```javascript
// src/process-tpl.js: 29-35
function hasProtocol(url) {
    return url.startsWith('http://') || url.startsWith('https://');
}

function getEntirePath(path, baseURI) {
    return new URL(path, baseURI).toString();
}
```

### 2. 内联代码提取

```javascript
// src/utils.js: 78-82
export function getInlineCode(match) {
    const start = match.indexOf('>') + 1;
    const end = match.lastIndexOf('<');
    return match.substring(start, end);
}
```

### 3. URL 转义处理

```javascript
// src/utils.js: 182-187
export function parseUrl(url){
    const parser = new DOMParser();
    const html = `<script src="${url}"></script>`;
    const doc = parser.parseFromString(html, "text/html");
    return doc.scripts[0].src;
}
```

**作用**：转换 URL 中的 HTML 实体，如 `&amp;` → `&`

### 4. 占位符生成

```javascript
// src/process-tpl.js: 42-46
export const genLinkReplaceSymbol = (linkHref, preloadOrPrefetch = false) => 
    `<!-- ${preloadOrPrefetch ? 'prefetch/preload' : ''} link ${linkHref} replaced by import-html-entry -->`;

export const genScriptReplaceSymbol = (scriptSrc, async = false, crossOrigin = false) => 
    `<!-- ${ crossOrigin ? 'cors' : '' } ${async ? 'async' : ''} script ${scriptSrc} replaced by import-html-entry -->`;

export const inlineScriptReplaceSymbol = 
    `<!-- inline scripts replaced by import-html-entry -->`;
```

## 🎯 entry 脚本的确定

```javascript
// src/process-tpl.js: 198-204
let tplResult = {
    template,
    scripts,
    styles,
    // 如果没有显式标记 entry，则使用最后一个脚本
    entry: entry || scripts[scripts.length - 1],
};
```

**entry 确定规则：**
1. 优先使用标记了 `entry` 属性的脚本
2. 否则使用最后一个脚本作为 entry
3. entry 脚本的执行结果会作为微应用的导出对象

**示例：**
```html
<script src="vendor.js"></script>
<script src="main.js" entry></script>  <!-- 显式标记 -->
<script src="utils.js"></script>
```

## 💡 设计巧思

### 1. **用注释占位保持结构**
替换为注释而非直接删除，保持 HTML 结构和位置信息，便于调试。

### 2. **支持相对路径**
自动补全相对路径为绝对路径，解决跨域部署问题。

### 3. **Module Script 兼容**
根据浏览器是否支持 `type="module"` 来决定是否加载相应脚本。

### 4. **ignore 属性支持**
允许通过 `ignore` 属性跳过某些资源的处理。

### 5. **后处理钩子**
提供 `postProcessTemplate` 参数，允许用户自定义处理逻辑。

## 🎓 面试要点

1. **正则驱动**：使用多个正则表达式匹配不同类型的标签
2. **链式替换**：通过链式 `replace` 调用逐步处理 HTML
3. **占位符机制**：用注释占位符替换原标签，保持 HTML 结构
4. **路径补全**：将相对路径转换为绝对路径
5. **资源分类**：区分外链/内联、同步/异步、普通/entry 脚本
6. **顺序保证**：按 HTML 中的出现顺序收集脚本，保证执行顺序

## 📊 处理结果示例

**输入 HTML：**
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./main.css">
    <style>.app { color: red; }</style>
</head>
<body>
    <div id="app"></div>
    <script src="./vendor.js"></script>
    <script>window.config = {};</script>
    <script src="./main.js" entry></script>
</body>
</html>
```

**输出结果：**
```javascript
{
    template: `<!DOCTYPE html>
<html>
<head>
    <!-- link http://localhost:8080/main.css replaced by import-html-entry -->
    <style>.app { color: red; }</style>
</head>
<body>
    <div id="app"></div>
    <!-- script http://localhost:8080/vendor.js replaced by import-html-entry -->
    <!-- inline scripts replaced by import-html-entry -->
    <!-- script http://localhost:8080/main.js replaced by import-html-entry -->
</body>
</html>`,
    scripts: [
        'http://localhost:8080/vendor.js',
        '<script>window.config = {};</script>',
        'http://localhost:8080/main.js'
    ],
    styles: [
        'http://localhost:8080/main.css'
    ],
    entry: 'http://localhost:8080/main.js'
}
```


## 🧠 更深入的源码级解析与边界说明

### 1) 入口脚本的判定不是看 src 中是否包含“entry”
入口判定依赖 `<script>` 标签是否显式包含 `entry` 属性，而非 `src` 路径包含 “entry”。源码正则如下：

```javascript
// file: /import-html-entry/src/process-tpl.js (12-13)
const SCRIPT_ENTRY_REGEX = /.*\sentry\s*.*/;
```

处理外链脚本时，若同时存在多个 `entry` 会抛错；若未显式标记，则在最终结果里以“最后一个脚本”为回退的 entry：

```javascript
// file: /import-html-entry/src/process-tpl.js (135-153)
const matchedScriptEntry = scriptTag.match(SCRIPT_ENTRY_REGEX);
const matchedScriptSrcMatch = scriptTag.match(SCRIPT_SRC_REGEX);
let matchedScriptSrc = matchedScriptSrcMatch && matchedScriptSrcMatch[2];

if (entry && matchedScriptEntry) {
  throw new SyntaxError('You should not set multiply entry script!');
}

if (matchedScriptSrc) {
  if (!hasProtocol(matchedScriptSrc)) {
    matchedScriptSrc = getEntirePath(matchedScriptSrc, baseURI);
  }
  matchedScriptSrc = parseUrl(matchedScriptSrc);
}

entry = entry || matchedScriptEntry && matchedScriptSrc;
```

```javascript
// file: /import-html-entry/src/process-tpl.js (202-204)
// set the last script as entry if have not set
entry: entry || scripts[scripts.length - 1],
```

实战建议：
- 显式标记 `<script src="main.js" entry></script>` 更可控，可避免因为顺序变更导致 entry 漂移。
- 严禁多个 `entry`，否则会抛 `SyntaxError` 并中断。

---

### 2) `scripts` 数组的结构与下载/执行策略
- `scripts` 元素既可能是字符串，也可能是对象：
  - 字符串：外链 URL 或完整的内联 `<script>...</script>` 标签。
  - 对象：当脚本带有 `async` 或 `crossorigin` 属性时，形如 `{ async: boolean, src: string, crossOrigin: boolean }`。
- 下载阶段由 `getExternalScripts` 负责处理，支持同步脚本、内联脚本文本抽取、以及异步脚本在空闲时间下载：

```javascript
// file: /import-html-entry/src/index.js (123-191)
export function getExternalScripts(scripts, fetch = defaultFetch, entry) {
  // ...
  if (typeof script === 'string') {
    if (isInlineCode(script)) {
      return getInlineCode(script);
    } else {
      return fetchScript(script);
    }
  } else {
    const { src, async, crossOrigin } = script;
    const fetchOpts = crossOrigin ? { credentials: 'include' } : {};
    if (async) {
      return {
        src,
        async: true,
        content: new Promise((resolve, reject) =>
          requestIdleCallback(() => fetchScript(src, fetchOpts).then(resolve, reject))),
      };
    }
    return fetchScript(src, fetchOpts);
  }
  // ...
}
```

关键点：
- 带 `async` 的外链脚本不会阻塞主序列的执行，下载工作通过 `requestIdleCallback` 延迟到空闲时间。
- `crossorigin="use-credentials"` 会以 `credentials: 'include'` 方式请求脚本。
- entry 下载失败会“打断”（break）整个下载流程，保持与浏览器期望一致。

---

### 3) 执行顺序、entry 导出与错误处理
执行阶段由 `execScripts` 负责，严格按照 `scripts` 收集顺序串行执行普通脚本，并在遇到 `async` 脚本时异步派发执行，不阻塞主链路：

```javascript
// file: /import-html-entry/src/index.js (215-309)
export function execScripts(entry, scripts, proxy = window, opts = {}) {
  // ...
  const geval = (scriptSrc, inlineScript) => {
    const rawCode = beforeExec(inlineScript, scriptSrc) || inlineScript;
    const code = getExecutableScript(scriptSrc, rawCode, { proxy, strictGlobal, scopedGlobalVariables });
    evalCode(scriptSrc, code);
    afterExec(inlineScript, scriptSrc);
  };
  function exec(scriptSrc, inlineScript, resolve) {
    if (scriptSrc === entry) {
      noteGlobalProps(strictGlobal ? proxy : window);
      try {
        geval(scriptSrc, inlineScript);
        const exports = proxy[getGlobalProp(strictGlobal ? proxy : window)] || {};
        resolve(exports);
      } catch (e) {
        console.error(`[import-html-entry]: error occurs while executing entry script ${scriptSrc}`);
        throw e;
      }
    } else {
      if (typeof inlineScript === 'string') {
        try {
          if (scriptSrc?.src) {
            geval(scriptSrc.src, inlineScript);
          } else {
            geval(scriptSrc, inlineScript);
          }
        } catch (e) {
          // 非 entry 的脚本执行错误采用非阻塞策略
          throwNonBlockingError(e, `[import-html-entry]: error occurs while executing normal script ${scriptSrc}`);
        }
      } else {
        // async 外链脚本
        inlineScript.async && inlineScript?.content
          .then(downloadedScriptText => geval(inlineScript.src, downloadedScriptText))
          .catch(e => {
            throwNonBlockingError(e, `[import-html-entry]: error occurs while executing async script ${inlineScript.src}`);
          });
      }
    }
  }
  // ...
}
```

要点总结：
- 非 entry 的脚本执行错误“不阻塞其余脚本与最终 Promise 结算”，通过 `throwNonBlockingError` 延后抛出以便控制台可见。
- entry 执行之前会调用 `noteGlobalProps`，执行之后通过 `getGlobalProp` 从全局（或沙箱代理）中检索新挂载的导出对象作为返回值。
- 若未显式指定 entry，执行完最后一个脚本即 resolve，不返回导出对象（与 `execScripts` 的调用方配合）。

---

### 4) module/nomodule 兼容与过滤逻辑
`processTpl` 会根据浏览器是否支持 `<script type="module">` 来忽略某些脚本：
- 若浏览器支持 module，则忽略 `nomodule`。
- 若浏览器不支持 module，则忽略 `type="module"`。

```javascript
// file: /import-html-entry/src/utils.js (100-106)
export function isModuleScriptSupported() {
  const s = document.createElement('script');
  return 'noModule' in s;
}
```

```javascript
// file: /import-html-entry/src/process-tpl.js (116-121)
const moduleScriptIgnore =
  (moduleSupport && !!scriptTag.match(SCRIPT_NO_MODULE_REGEX)) ||
  (!moduleSupport && !!scriptTag.match(SCRIPT_MODULE_REGEX));
```

并非真正加载 ES Module，而是简单“忽略/保留”策略，以适配老浏览器与新浏览器的共存写法。

---

### 5) ignore 属性如何工作
当 `<script ... ignore>`、`<link ... ignore>`、`<style ... ignore>` 出现时，对应资源被替换为一个注释占位符，不会进入下载/执行/收集：

```javascript
// file: /import-html-entry/src/process-tpl.js (24-27)
const LINK_IGNORE_REGEX = /<link(\s+|\s+.+\s+)ignore(\s*|\s+.*|=.*)>/is;
const STYLE_IGNORE_REGEX = /<style(\s+|\s+.+\s+)ignore(\s*|\s+.*|=.*)>/is;
const SCRIPT_IGNORE_REGEX = /<script(\s+|\s+.+\s+)ignore(\s*|\s+.*|=.*)>/is;
```

这便于在调试或渐进迁移时临时排除某些静态资源。

---

### 6) URL 解析、转义与 `baseURI` 的作用
- 相对路径通过 `new URL(path, baseURI)` 转为绝对路径：

```javascript
// file: /import-html-entry/src/process-tpl.js (33-35)
function getEntirePath(path, baseURI) {
  return new URL(path, baseURI).toString();
}
```

- `parseUrl` 借助 `DOMParser` 还原 HTML 实体（如 `&amp;` → `&`），确保后续请求 URL 正确：

```javascript
// file: /import-html-entry/src/utils.js (181-187)
export function parseUrl(url){
  const parser = new DOMParser();
  const html = `<script src="${url}"></script>`;
  const doc = parser.parseFromString(html, "text/html");
  return doc.scripts[0].src;
}
```

注意：
- `baseURI` 来自上游的 `getPublicPath(url)`，通常为 HTML 所在目录，保证资源定位相对一致。
- `parseUrl` 依赖浏览器环境的 `DOMParser`，在 Node 测试环境通常有 polyfill 或绕过（见测试用例的兼容处理）。

---

### 7) 性能与缓存
- `styleCache` / `scriptCache` 会缓存外部样式与脚本文本，避免二次请求：

```javascript
// file: /import-html-entry/src/index.js (19-21)
const styleCache = {};
const scriptCache = {};
```

- 样式会在 `getEmbedHTML` 阶段内联到模板中，减少运行时样式请求数量，提升首屏速度：

```javascript
// file: /import-html-entry/src/index.js (39-53)
function getEmbedHTML(template, styles, opts = {}) {
  // ...
  return getExternalStyleSheets(styles, fetch)
    .then(styleSheets => {
      embedHTML = styleSheets.reduce((html, styleSheet) => {
        const styleSrc = styleSheet.src;
        const styleSheetContent = styleSheet.value;
        html = html.replace(genLinkReplaceSymbol(styleSrc),
          isInlineCode(styleSrc) ? `${styleSrc}` : `<style>/* ${styleSrc} */${styleSheetContent}</style>`);
        return html;
      }, embedHTML);
      return embedHTML;
    });
}
```

---

### 8) 常见坑与建议
- 不要在多个 `<script>` 上同时加 `entry`，会抛错。
- 若未显式标注 `entry`，请确保最后一个脚本正是微应用入口，否则返回的导出对象会不符合预期。
- `async` 脚本并不会插入到主序列执行中，它们在空闲时下载、下载后再独立执行；不要依赖其在主链路中的同步副作用。
- `crossorigin="use-credentials"` 会携带凭证请求脚本，请确认后端 CORS 配置。
- `type="module"` 与 `nomodule` 只是过滤策略，不代表此库加载 ES Module 依赖关系（没有 import graph 解析），需要自行打包为单文件。

---

### 9) 与上游调用的衔接（importHTML/importEntry）
- `importHTML(url)` 会：
  1) 拉取 HTML → 2) 调用 `processTpl` 拿到 `{ template, scripts, styles, entry }` → 3) 内联样式 → 4) 暴露 `execScripts` 等。
  5) 最终由调用方在合适时机调用 `execScripts(proxy, strictGlobal, opts)` 执行脚本。

```javascript
// file: /import-html-entry/src/index.js (339-357)
const { template, scripts, entry, styles } = processTpl(getTemplate(html), assetPublicPath, postProcessTemplate);
return getEmbedHTML(template, styles, { fetch }).then(embedHTML => ({
  template: embedHTML,
  assetPublicPath,
  getExternalScripts: () => getExternalScripts(scripts, fetch),
  getExternalStyleSheets: () => getExternalStyleSheets(styles, fetch),
  execScripts: (proxy, strictGlobal, opts = {}) => {
    if (!scripts.length) {
      return Promise.resolve();
    }
    return execScripts(entry, scripts, proxy, {
      fetch,
      strictGlobal,
      ...opts,
    });
  },
}));
```

- `importEntry(config)` 支持直接传入 `{ scripts, styles, html }`，并默认将“最后一个脚本”作为 entry：

```javascript
// file: /import-html-entry/src/index.js (389-399)
execScripts: (proxy, strictGlobal, opts = {}) => {
  if (!scripts.length) {
    return Promise.resolve();
  }
  return execScripts(scripts[scripts.length - 1], scripts, proxy, {
    fetch,
    strictGlobal,
    ...opts,
  });
},
```

---

### 10) 小结
- `processTpl` 专注“提取”和“占位替换”，并确定 entry。
- 下载与执行策略在上游 `index.js` 中分层实现，兼顾顺序一致性与异步脚本的性能。
- 通过 `entry` 明确微应用导出对象的获取点，提升可预测性。
