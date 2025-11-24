# 问题5：import-html-entry 如何处理 CSS 资源？外链样式和内联样式的加载策略有什么不同？

## 📌 CSS 资源的两种形式

### 1. 外链样式（External Styles）
```html
<link rel="stylesheet" href="./main.css">
<link rel="stylesheet" href="https://cdn.com/theme.css">
```

### 2. 内联样式（Inline Styles）
```html
<style>
  .app { color: red; }
</style>
```

## 🔍 处理流程对比

| 阶段 | 外链样式 | 内联样式 |
|------|---------|---------|
| **解析阶段** | 提取 href，替换为注释 | 保留原样 |
| **加载阶段** | fetch 下载内容 | 无需加载 |
| **缓存策略** | styleCache 缓存 | 无需缓存 |
| **嵌入阶段** | 转换为 `<style>` 内联 | 已在 HTML 中 |
| **最终形式** | `<style>/* url */content</style>` | `<style>content</style>` |

## 📋 1. 解析阶段（processTpl）

### 外链样式的提取

```javascript
// src/process-tpl.js: 74-109
.replace(LINK_TAG_REGEX, match => {
    // 1. 判断是否是 stylesheet
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
            
            // 3. 检查 ignore 属性
            if (styleIgnore) {
                return genIgnoreAssetReplaceSymbol(newHref);
            }

            // 4. 解析 URL 转义字符
            newHref = parseUrl(newHref);
            
            // 5. 收集到 styles 数组
            styles.push(newHref);
            
            // 6. 替换为注释占位符
            return genLinkReplaceSymbol(newHref);
        }
    }
    return match;
})
```

**转换示例：**

```html
<!-- 原始 HTML -->
<link rel="stylesheet" href="./main.css">
<link rel="stylesheet" href="./theme.css">

<!-- 解析后的 template -->
<!-- link http://localhost:8080/main.css replaced by import-html-entry -->
<!-- link http://localhost:8080/theme.css replaced by import-html-entry -->

<!-- styles 数组 -->
['http://localhost:8080/main.css', 'http://localhost:8080/theme.css']
```

**为什么替换为注释？**

1. **保持位置信息**：便于调试时定位原始位置
2. **避免重复加载**：移除原始 link 标签，防止浏览器自动加载
3. **统一管理**：由 import-html-entry 控制样式加载时机

### 内联样式的处理

```javascript
// src/process-tpl.js: 110-115
.replace(STYLE_TAG_REGEX, match => {
    if (STYLE_IGNORE_REGEX.test(match)) {
        return genIgnoreAssetReplaceSymbol('style file');
    }
    return match;  // ⭐ 保留原样
})
```

**关键点：内联样式直接保留在 HTML 中，不做任何修改。**

```html
<!-- 原始 HTML -->
<style>
  .app { color: red; }
  .header { font-size: 16px; }
</style>

<!-- 解析后仍然保留 -->
<style>
  .app { color: red; }
  .header { font-size: 16px; }
</style>
```

**为什么保留内联样式？**

1. **无需额外处理**：内容已在 HTML 中
2. **避免解析成本**：提取、存储、再插入是多余操作
3. **保持结构**：样式可能依赖位置（如相邻选择器）

## 📥 2. 加载阶段（getExternalStyleSheets）

这个阶段只处理外链样式，下载样式内容。

```javascript
// src/index.js: 80-121
export function getExternalStyleSheets(styles, fetch = defaultFetch) {
    return allSettledButCanBreak(styles.map(async styleLink => {
        if (isInlineCode(styleLink)) {
            // 如果是内联样式（理论上不会走到这里）
            return getInlineCode(styleLink);
        } else {
            // 外链样式：下载并缓存
            return styleCache[styleLink] ||
                (styleCache[styleLink] = fetch(styleLink).then(response => {
                    if (response.status >= 400) {
                        throw new Error(`${styleLink} load failed with status ${response.status}`);
                    }
                    return response.text();
                }).catch(e => {
                    try {
                        if (e.message.indexOf(styleLink) === -1) {
                            e.message = `${styleLink} ${e.message}`;
                        }
                    } catch (_) {
                        // e.message 可能是 readonly
                    }
                    throw e;
                }));
        }
    })).then(results => results.map((result, i) => {
        if (result.status === 'fulfilled') {
            result.value = {
                src: styles[i],      // 样式 URL
                value: result.value,  // 样式内容
            };
        }
        return result;
    }).filter(result => {
        // 忽略失败的请求，避免阻塞后续资源
        if (result.status === 'rejected') {
            Promise.reject(result.reason);
        }
        return result.status === 'fulfilled';
    }).map(result => result.value));
}
```

### 关键特性

#### 1. 缓存机制

```javascript
styleCache[styleLink] || (styleCache[styleLink] = fetch(...))
```

**示例：**

```javascript
// 第一次加载
getExternalStyleSheets(['http://example.com/main.css'])
// → fetch 下载，存入 styleCache['http://example.com/main.css']

// 第二次加载（可能是另一个微应用也用了这个样式）
getExternalStyleSheets(['http://example.com/main.css'])
// → 直接从 styleCache 返回，不再发起请求
```

**为什么需要缓存？**

```javascript
// 场景：多个微应用共享样式库
// 微应用A
<link rel="stylesheet" href="https://cdn.com/antd.css">

// 微应用B
<link rel="stylesheet" href="https://cdn.com/antd.css">

// 没有缓存：antd.css 下载 2 次，浪费带宽
// 有缓存：antd.css 只下载 1 次，提升性能
```

#### 2. Promise 缓存

```javascript
styleCache[url] = fetch(url).then(...)  // 缓存的是 Promise
```

**好处：避免重复请求**

```javascript
// 假设缓存的是结果
styleCache[url] = await fetch(url)  // ❌ 第一个请求完成前，第二个请求已发起

// 缓存 Promise
styleCache[url] = fetch(url)  // ✅ 第二个请求会复用第一个请求的 Promise

// 示例
const promise1 = getExternalStyleSheets(['main.css']);  // 发起请求
const promise2 = getExternalStyleSheets(['main.css']);  // 复用请求
await Promise.all([promise1, promise2]);  // 只有一个网络请求
```

#### 3. 错误容忍

```javascript
.filter(result => {
    if (result.status === 'rejected') {
        Promise.reject(result.reason);  // 异步抛出错误
    }
    return result.status === 'fulfilled';  // 只返回成功的
})
```

**为什么这样设计？**

```javascript
// 场景：某个样式加载失败
styles = [
    'https://cdn.com/main.css',     // ✓ 加载成功
    'https://cdn.com/theme.css',    // ✗ 404 Not Found
    'https://cdn.com/icons.css'     // ✓ 加载成功
]

// 没有容错：一个失败，全部失败
// 有容错：返回 ['main.css', 'icons.css']，应用仍可运行
```

**实际场景：**
- CDN 某个文件丢失
- 网络临时波动
- 非核心样式（如第三方主题）

#### 4. allSettledButCanBreak

```javascript
// src/allSettledButCanBreak.js
export function allSettledButCanBreak(promises, shouldBreakWhileError) {
    return new Promise((resolve, reject) => {
        // 类似 Promise.allSettled，但可以提前中断
    });
}
```

**普通样式加载：不会提前中断**

```javascript
getExternalStyleSheets([
    'main.css',   // 失败不中断
    'theme.css',  // 继续加载
    'icons.css'   // 继续加载
])
```

## 🎨 3. 嵌入阶段（getEmbedHTML）

将外链样式转换为内联样式，插入到 HTML 中。

```javascript
// src/index.js: 39-53
function getEmbedHTML(template, styles, opts = {}) {
    const { fetch = defaultFetch } = opts;
    let embedHTML = template;

    return getExternalStyleSheets(styles, fetch)
        .then(styleSheets => {
            // styleSheets = [{ src: 'main.css', value: 'css content' }, ...]
            
            embedHTML = styleSheets.reduce((html, styleSheet) => {
                const styleSrc = styleSheet.src;
                const styleSheetContent = styleSheet.value;
                
                // 替换注释占位符为 <style> 标签
                html = html.replace(
                    genLinkReplaceSymbol(styleSrc),
                    isInlineCode(styleSrc) 
                        ? `${styleSrc}`  // 理论上不会走到这里
                        : `<style>/* ${styleSrc} */${styleSheetContent}</style>`
                );
                return html;
            }, embedHTML);
            
            return embedHTML;
        });
}
```

### 转换示例

**输入：**

```javascript
// template（processTpl 的输出）
`<!DOCTYPE html>
<html>
<head>
    <!-- link http://localhost:8080/main.css replaced by import-html-entry -->
    <style>.inline { color: blue; }</style>
    <!-- link http://localhost:8080/theme.css replaced by import-html-entry -->
</head>
<body>
    <div id="app"></div>
</body>
</html>`

// styles
['http://localhost:8080/main.css', 'http://localhost:8080/theme.css']

// styleSheets（getExternalStyleSheets 的输出）
[
    { src: 'http://localhost:8080/main.css', value: '.app { font-size: 14px; }' },
    { src: 'http://localhost:8080/theme.css', value: '.dark { background: #000; }' }
]
```

**输出（embedHTML）：**

```html
<!DOCTYPE html>
<html>
<head>
    <style>/* http://localhost:8080/main.css */.app { font-size: 14px; }</style>
    <style>.inline { color: blue; }</style>
    <style>/* http://localhost:8080/theme.css */.dark { background: #000; }</style>
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

### 为什么转换为内联？

#### 1. 避免延迟加载

```html
<!-- 外链：浏览器需要额外的网络请求 -->
<link rel="stylesheet" href="main.css">
<!-- 渲染阻塞，等待 CSS 下载完成 -->

<!-- 内联：CSS 已在 HTML 中 -->
<style>.app { font-size: 14px; }</style>
<!-- 立即可用，无网络延迟 -->
```

#### 2. 控制加载时机

```javascript
// import-html-entry 控制加载
const { template } = await importHTML(url);
// 此时所有样式已下载并内联到 template 中

container.innerHTML = template;
// 插入 DOM 时，样式立即生效
```

#### 3. 避免跨域问题

```javascript
// 场景：样式托管在不同域
// 主应用：https://main.com
// 子应用：https://sub.com
// 样式：https://cdn.com/styles.css

// 外链方式可能遇到 CORS 问题
<link rel="stylesheet" href="https://cdn.com/styles.css">

// 内联方式：通过 fetch 下载，避免 CORS
// （fetch 可以自定义 headers 处理鉴权）
```

#### 4. 样式隔离准备

```javascript
// qiankun 可以对内联样式做作用域处理
<style>
.app { color: red; }
</style>

// 转换为
<style>
.app[data-qiankun-microapp] { color: red; }
</style>
```

### 样式顺序保证

```javascript
styleSheets.reduce((html, styleSheet) => {
    // 按照 styleSheets 数组顺序依次替换
    html = html.replace(genLinkReplaceSymbol(styleSrc), `<style>...</style>`);
    return html;
}, embedHTML);
```

**顺序很重要：**

```css
/* main.css */
.button { background: blue; }

/* theme.css */
.button { background: red; }  /* 优先级相同，后面的覆盖前面的 */
```

```html
<!-- 正确顺序 -->
<style>/* main.css */.button { background: blue; }</style>
<style>/* theme.css */.button { background: red; }</style>
<!-- .button 最终是红色 ✓ -->

<!-- 错误顺序 -->
<style>/* theme.css */.button { background: red; }</style>
<style>/* main.css */.button { background: blue; }</style>
<!-- .button 最终是蓝色 ✗ -->
```

## 🔄 4. 完整流程示例

```javascript
// 原始 HTML
const html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./reset.css">
    <style>.global { margin: 0; }</style>
    <link rel="stylesheet" href="./main.css">
</head>
<body>
    <div id="app"></div>
</body>
</html>
`;

// 步骤1: processTpl 解析
const { template, styles } = processTpl(html, 'http://localhost:8080/');
/*
template = `
<!DOCTYPE html>
<html>
<head>
    <!-- link http://localhost:8080/reset.css replaced by import-html-entry -->
    <style>.global { margin: 0; }</style>
    <!-- link http://localhost:8080/main.css replaced by import-html-entry -->
</head>
<body>
    <div id="app"></div>
</body>
</html>
`

styles = [
    'http://localhost:8080/reset.css',
    'http://localhost:8080/main.css'
]
*/

// 步骤2: getExternalStyleSheets 下载
const styleSheets = await getExternalStyleSheets(styles);
/*
styleSheets = [
    { src: 'http://localhost:8080/reset.css', value: '* { margin: 0; padding: 0; }' },
    { src: 'http://localhost:8080/main.css', value: '.app { font-size: 14px; }' }
]
*/

// 步骤3: getEmbedHTML 嵌入
const embedHTML = await getEmbedHTML(template, styles);
/*
embedHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>/* http://localhost:8080/reset.css */* { margin: 0; padding: 0; }</style>
    <style>.global { margin: 0; }</style>
    <style>/* http://localhost:8080/main.css */.app { font-size: 14px; }</style>
</head>
<body>
    <div id="app"></div>
</body>
</html>
`
*/

// 步骤4: 插入 DOM
container.innerHTML = embedHTML;
// 所有样式立即生效
```

## 📊 5. 性能对比

### 传统外链加载

```html
<link rel="stylesheet" href="reset.css">    <!-- 请求1: 100ms -->
<link rel="stylesheet" href="main.css">     <!-- 请求2: 150ms -->
<link rel="stylesheet" href="theme.css">    <!-- 请求3: 120ms -->
<!-- 总计: 370ms (串行) 或 150ms (并行，但阻塞渲染) -->
```

### import-html-entry 加载

```javascript
// 1. 下载 HTML: 50ms
const html = await fetch('http://sub.com/index.html');

// 2. 并行下载所有样式: 150ms (最慢的那个)
const styles = await Promise.all([
    fetch('reset.css'),   // 100ms
    fetch('main.css'),    // 150ms
    fetch('theme.css')    // 120ms
]);

// 3. 嵌入 HTML: 1ms
const embedHTML = embedStyles(html, styles);

// 4. 插入 DOM: 5ms
container.innerHTML = embedHTML;

// 总计: 50 + 150 + 1 + 5 = 206ms
```

**优势：**
- 并行下载所有资源
- 一次性插入 DOM
- 避免多次重排重绘

## 🎓 面试要点

### 处理策略差异

1. **外链样式**：提取 → 下载 → 缓存 → 内联
2. **内联样式**：保留在 HTML 中，不做处理

### 设计原因

1. **转换为内联**：避免网络延迟，控制加载时机
2. **缓存机制**：复用相同样式，提升性能
3. **错误容忍**：部分样式失败不影响整体
4. **顺序保证**：按 HTML 中的顺序嵌入
5. **Promise 缓存**：避免重复请求

### 实际应用

1. **样式隔离**：内联样式便于 qiankun 做作用域处理
2. **动态加载**：微应用切换时重新加载样式
3. **跨域处理**：通过自定义 fetch 解决 CORS
4. **性能优化**：并行下载，一次性渲染

## 💡 为什么内联样式不提取？

```javascript
// 假设要提取内联样式
<style>.app { color: red; }</style>

// 提取后
styles.push('<style>.app { color: red; }</style>');

// 嵌入时还要插回去
html.replace(placeholder, '<style>.app { color: red; }</style>');

// 这是无意义的循环操作！
// 内联样式本来就在 HTML 中，保留即可
```

**总结：** import-html-entry 对外链样式做了大量优化（下载、缓存、内联），而内联样式已经是最优形式，无需额外处理。

