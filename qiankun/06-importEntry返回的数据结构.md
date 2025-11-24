# 问题6：importEntry 函数返回的数据结构是什么？各个字段的含义和作用是什么？

## 📌 函数签名

```javascript
// src/index.js: 361
export function importEntry(entry, opts = {})
```

**参数说明：**
- `entry`: 入口配置，支持两种格式
  - **字符串**：HTML 文件 URL
  - **对象**：配置对象（scripts、styles、html）
- `opts`: 可选配置

## 🎯 返回值结构

importEntry 返回一个 Promise，resolve 后得到以下结构：

```javascript
{
    template: string,                           // 处理后的 HTML 模板
    assetPublicPath: string,                    // 资源公共路径
    getExternalScripts: () => Promise<Array>,   // 获取外部脚本
    getExternalStyleSheets: () => Promise<Array>, // 获取外部样式
    execScripts: (proxy, strictGlobal, opts) => Promise // 执行脚本
}
```

## 📋 完整源码解析

### 1. HTML 入口模式

```javascript
// src/index.js: 361-406
export function importEntry(entry, opts = {}) {
    const { fetch = defaultFetch, getTemplate = defaultGetTemplate, postProcessTemplate } = opts;
    const getPublicPath = opts.getPublicPath || opts.getDomain || defaultGetPublicPath;

    if (!entry) {
        throw new SyntaxError('entry should not be empty!');
    }

    // ===== HTML 入口模式 =====
    if (typeof entry === 'string') {
        return importHTML(entry, {
            fetch,
            getPublicPath,
            getTemplate,
            postProcessTemplate,
        });
    }

    // ===== 配置入口模式 =====
    if (Array.isArray(entry.scripts) || Array.isArray(entry.styles)) {
        // ... (后面详解)
    } else {
        throw new SyntaxError('entry scripts or styles should be array!');
    }
}
```

### 2. importHTML 实现

```javascript
// src/index.js: 310-359
export default function importHTML(url, opts = {}) {
    let fetch = defaultFetch;
    let autoDecodeResponse = false;
    let getPublicPath = defaultGetPublicPath;
    let getTemplate = defaultGetTemplate;
    const { postProcessTemplate } = opts;

    // 参数处理逻辑...

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
                // ===== 返回对象结构 =====
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
        }));
}
```

## 🔎 各字段详解

### 1. template（HTML 模板）

**类型：** `string`

**含义：** 处理后的 HTML 模板字符串，所有外链资源已被替换。

**特点：**
- 外链样式 → 内联样式
- 外链/内联脚本 → 注释占位符
- 保留内联样式和其他标签

**示例：**

```javascript
const { template } = await importEntry('http://localhost:8080/index.html');

console.log(template);
/*
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>微应用</title>
    <style>/* http://localhost:8080/main.css */.app { font-size: 14px; }</style>
    <style>.inline { color: blue; }</style>
</head>
<body>
    <div id="root"></div>
    <!-- script http://localhost:8080/vendor.js replaced by import-html-entry -->
    <!-- inline scripts replaced by import-html-entry -->
    <!-- script http://localhost:8080/main.js replaced by import-html-entry -->
</body>
</html>
*/
```

**使用场景：**

```javascript
// qiankun 中的使用
const { template } = await importEntry(entry);

// 挂载到容器
const container = document.querySelector('#subapp-container');
container.innerHTML = template;

// 此时：
// 1. HTML 结构已渲染
// 2. 样式已生效
// 3. 脚本还未执行（需要调用 execScripts）
```

**为什么脚本要移除？**

```javascript
// 如果保留脚本标签
container.innerHTML = `
    <div id="app"></div>
    <script src="main.js"></script>
`;
// 浏览器会自动执行 main.js，无法控制执行时机和作用域

// 移除脚本标签
container.innerHTML = `
    <div id="app"></div>
    <!-- script main.js replaced -->
`;
// 通过 execScripts 手动控制执行，可以注入沙箱
```

### 2. assetPublicPath（资源公共路径）

**类型：** `string`

**含义：** 子应用资源的基础路径，用于补全相对路径。

**计算逻辑：**

```javascript
// src/utils.js: 84-98
export function defaultGetPublicPath(entry) {
    if (typeof entry === 'object') {
        return '/';
    }
    try {
        const { origin, pathname } = new URL(entry, location.href);
        const paths = pathname.split('/');
        // 移除最后一个元素（文件名）
        paths.pop();
        return `${origin}${paths.join('/')}/`;
    } catch (e) {
        console.warn(e);
        return '';
    }
}
```

**示例：**

```javascript
// 示例1: 标准路径
entry = 'http://localhost:8080/app/index.html'
assetPublicPath = 'http://localhost:8080/app/'

// 示例2: 根路径
entry = 'http://localhost:8080/index.html'
assetPublicPath = 'http://localhost:8080/'

// 示例3: 多级路径
entry = 'http://localhost:8080/sub/app/index.html'
assetPublicPath = 'http://localhost:8080/sub/app/'
```

**使用场景：**

```javascript
// 子应用中相对路径的资源
// HTML: http://localhost:8080/app/index.html
<img src="./logo.png">
<script src="./main.js"></script>

// import-html-entry 自动补全
// assetPublicPath = 'http://localhost:8080/app/'
// ./logo.png → http://localhost:8080/app/logo.png
// ./main.js → http://localhost:8080/app/main.js
```

**在微应用中使用：**

```javascript
// 微应用需要动态加载资源时
export async function mount(props) {
    // qiankun 会传入 assetPublicPath
    const { assetPublicPath } = props;
    
    // 动态加载图片
    const img = new Image();
    img.src = `${assetPublicPath}assets/logo.png`;
    
    // 动态加载脚本
    const script = document.createElement('script');
    script.src = `${assetPublicPath}plugins/analytics.js`;
}
```

**自定义 publicPath：**

```javascript
await importEntry(entry, {
    getPublicPath: (entry) => {
        // 自定义逻辑
        if (entry.includes('localhost')) {
            return 'http://localhost:8080/';
        }
        return 'https://cdn.example.com/';
    }
});
```

### 3. getExternalScripts（获取脚本）

**类型：** `() => Promise<Array<{src, value}>>`

**含义：** 返回一个函数，调用后获取所有脚本的内容。

**返回格式：**

```javascript
[
    { src: 'http://localhost:8080/vendor.js', value: 'vendor code...' },
    { src: '<script>console.log("inline")</script>', value: 'console.log("inline")' },
    { src: 'http://localhost:8080/main.js', value: 'main code...' }
]
```

**使用场景：**

```javascript
const { getExternalScripts } = await importEntry(entry);

// 场景1: 预加载脚本（不执行）
const scripts = await getExternalScripts();
console.log('脚本已下载，但未执行', scripts);

// 场景2: 检查脚本内容
const scripts = await getExternalScripts();
const hasReact = scripts.some(s => s.value.includes('React'));
console.log('是否包含 React:', hasReact);

// 场景3: 分析脚本大小
const scripts = await getExternalScripts();
const totalSize = scripts.reduce((sum, s) => sum + s.value.length, 0);
console.log('脚本总大小:', totalSize, 'bytes');
```

**为什么是函数？**

```javascript
// ❌ 如果直接返回 Promise
{
    externalScripts: Promise<Array>  // 立即开始下载
}
// 问题：无法控制下载时机

// ✅ 返回函数
{
    getExternalScripts: () => Promise<Array>  // 按需下载
}
// 优势：
// 1. 延迟加载：需要时才下载
// 2. 可重复调用：每次调用都会检查缓存
// 3. 灵活控制：可以选择不下载
```

**实际应用：预加载功能**

```javascript
// qiankun 的预加载实现
function prefetchApps(apps) {
    apps.forEach(async app => {
        const { getExternalScripts, getExternalStyleSheets } = await importEntry(app.entry);
        
        // 空闲时预加载
        requestIdleCallback(() => {
            getExternalScripts();  // 触发下载
            getExternalStyleSheets();
        });
    });
}
```

### 4. getExternalStyleSheets（获取样式）

**类型：** `() => Promise<Array<{src, value}>>`

**含义：** 返回一个函数，调用后获取所有外链样式的内容。

**返回格式：**

```javascript
[
    { src: 'http://localhost:8080/reset.css', value: '* { margin: 0; }' },
    { src: 'http://localhost:8080/main.css', value: '.app { font-size: 14px; }' }
]
```

**注意：** 内联样式不在此列表中（已在 template 里）。

**使用场景：**

```javascript
const { getExternalStyleSheets } = await importEntry(entry);

// 场景1: 动态卸载样式
let styleNodes = [];
const styles = await getExternalStyleSheets();
styles.forEach(({ src, value }) => {
    const style = document.createElement('style');
    style.innerHTML = value;
    style.setAttribute('data-src', src);
    document.head.appendChild(style);
    styleNodes.push(style);
});

// 卸载时移除
function unmount() {
    styleNodes.forEach(node => node.remove());
    styleNodes = [];
}

// 场景2: 样式预处理
const styles = await getExternalStyleSheets();
const processedStyles = styles.map(({ src, value }) => ({
    src,
    value: addScopeToCSS(value, 'app-prefix')  // 添加作用域
}));
```

**qiankun 中的使用：**

```javascript
// qiankun 不直接使用这个方法
// 因为样式已经通过 template 嵌入了

const { template } = await importEntry(entry);
container.innerHTML = template;  // 样式已在 template 中

// 但在某些特殊场景可能需要：
// 1. 动态样式隔离
// 2. 样式作用域处理
// 3. CSS Modules 转换
```

### 5. execScripts（执行脚本）

**类型：** `(proxy?, strictGlobal?, opts?) => Promise<exports>`

**含义：** 执行所有脚本，返回入口脚本的导出对象。

**参数：**
- `proxy`: 沙箱代理对象（用于隔离全局变量）
- `strictGlobal`: 是否使用严格隔离模式（with）
- `opts`: 额外配置
  - `beforeExec`: 执行前钩子
  - `afterExec`: 执行后钩子
  - `scopedGlobalVariables`: 缓存的全局变量列表

**返回值：** 入口脚本导出的对象（通常是生命周期函数）

**示例：**

```javascript
const { template, execScripts } = await importEntry(entry);

// 1. 渲染 HTML
container.innerHTML = template;

// 2. 创建沙箱
const sandbox = new Proxy(window, {
    get(target, prop) {
        console.log('get', prop);
        return target[prop];
    },
    set(target, prop, value) {
        console.log('set', prop, value);
        // 拦截全局变量设置
        return true;
    }
});

// 3. 执行脚本
const exports = await execScripts(sandbox, true, {
    beforeExec(code, url) {
        console.log('执行前:', url);
        return code;
    },
    afterExec(code, url) {
        console.log('执行后:', url);
    },
    scopedGlobalVariables: ['location', 'document']
});

console.log(exports);
/*
{
    bootstrap: [Function],
    mount: [Function],
    unmount: [Function],
    update: [Function]
}
*/

// 4. 调用生命周期
await exports.bootstrap();
await exports.mount({ container });
```

**不同参数的效果：**

```javascript
// 1. 无沙箱（直接在 window 上执行）
await execScripts();

// 2. 有沙箱（隔离全局变量）
await execScripts(sandboxProxy);

// 3. 严格模式（with 增强隔离）
await execScripts(sandboxProxy, true);

// 4. 带钩子和优化
await execScripts(sandboxProxy, true, {
    beforeExec: (code) => babel.transform(code).code,  // 转译代码
    afterExec: (code, url) => console.log(`${url} 执行完成`),
    scopedGlobalVariables: ['location', 'document', 'navigator']  // 性能优化
});
```

## 🎨 配置入口模式

除了 HTML URL，importEntry 还支持配置对象：

```javascript
// src/index.js: 380-402
if (Array.isArray(entry.scripts) || Array.isArray(entry.styles)) {
    const { scripts = [], styles = [], html = '' } = entry;
    
    // 生成带占位符的 HTML
    const getHTMLWithStylePlaceholder = tpl => 
        styles.reduceRight((html, styleSrc) => 
            `${genLinkReplaceSymbol(styleSrc)}${html}`, tpl);
    
    const getHTMLWithScriptPlaceholder = tpl => 
        scripts.reduce((html, scriptSrc) => 
            `${html}${genScriptReplaceSymbol(scriptSrc)}`, tpl);

    return getEmbedHTML(
        getTemplate(getHTMLWithScriptPlaceholder(getHTMLWithStylePlaceholder(html))), 
        styles, 
        { fetch }
    ).then(embedHTML => ({
        template: embedHTML,
        assetPublicPath: getPublicPath(entry),
        getExternalScripts: () => getExternalScripts(scripts, fetch),
        getExternalStyleSheets: () => getExternalStyleSheets(styles, fetch),
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
    }));
}
```

**使用示例：**

```javascript
// 不依赖 HTML 文件，直接配置资源
const result = await importEntry({
    scripts: [
        'https://cdn.com/react.min.js',
        'https://cdn.com/react-dom.min.js',
        'http://localhost:8080/main.js'
    ],
    styles: [
        'https://cdn.com/antd.min.css',
        'http://localhost:8080/main.css'
    ],
    html: '<div id="root"></div>'
});

// 返回结构相同
const { template, execScripts } = result;
container.innerHTML = template;
await execScripts();
```

**应用场景：**
1. **无 HTML 入口**：只有 JS/CSS 文件
2. **动态构建**：根据配置动态生成入口
3. **兼容旧版**：适配不支持 HTML Entry 的应用

## 📊 完整使用流程

```javascript
// ===== 步骤1: 导入入口 =====
const entryInfo = await importEntry('http://localhost:8080/index.html', {
    fetch: customFetch,  // 自定义 fetch（处理鉴权）
    getPublicPath: (entry) => 'https://cdn.com/',  // 自定义 publicPath
    getTemplate: (tpl) => tpl.replace('<!-- placeholder -->', '<div>插入内容</div>')  // 处理模板
});

// ===== 步骤2: 解构返回值 =====
const {
    template,
    assetPublicPath,
    getExternalScripts,
    getExternalStyleSheets,
    execScripts
} = entryInfo;

// ===== 步骤3: 渲染 HTML =====
const container = document.querySelector('#subapp-container');
container.innerHTML = template;
console.log('HTML 已渲染，样式已生效');

// ===== 步骤4: （可选）检查资源 =====
const scripts = await getExternalScripts();
console.log('脚本列表:', scripts.map(s => s.src));

const styles = await getExternalStyleSheets();
console.log('样式列表:', styles.map(s => s.src));

// ===== 步骤5: 执行脚本 =====
const sandbox = createSandbox();  // 创建沙箱
const appExports = await execScripts(sandbox.proxy, true, {
    scopedGlobalVariables: ['location', 'document']
});

// ===== 步骤6: 调用生命周期 =====
await appExports.bootstrap();
await appExports.mount({
    container,
    assetPublicPath  // 传递给子应用
});

// ===== 步骤7: 卸载 =====
await appExports.unmount();
sandbox.destroy();
container.innerHTML = '';
```

## 🎓 面试要点

### 返回结构设计

1. **template**: 处理后的 HTML，可直接渲染
2. **assetPublicPath**: 资源基础路径，用于相对路径补全
3. **getExternalScripts**: 函数形式，支持延迟加载和预加载
4. **getExternalStyleSheets**: 函数形式，支持样式自定义处理
5. **execScripts**: 核心方法，支持沙箱隔离和生命周期导出

### 设计理念

1. **分离关注点**：HTML 渲染、资源加载、脚本执行分离
2. **延迟执行**：getXXX 函数按需调用，不自动执行
3. **灵活控制**：每个环节都可自定义（fetch、template、sandbox）
4. **错误容忍**：资源加载失败不影响整体流程

### 实际应用

1. **qiankun 使用**：template 渲染 + execScripts 执行
2. **预加载**：提前调用 getExternalScripts
3. **资源分析**：通过 getXXX 分析应用依赖
4. **样式隔离**：处理 template 中的样式

## 💡 为什么这样设计？

### 1. 为什么 template 要把脚本移除？

```javascript
// 保留脚本的问题
container.innerHTML = '<script src="main.js"></script>';
// 浏览器自动执行，无法控制作用域

// 移除脚本的好处
container.innerHTML = '<!-- script main.js -->';
await execScripts(sandbox.proxy);
// 完全控制执行时机和环境
```

### 2. 为什么 getXXX 是函数而不是直接返回 Promise？

```javascript
// 直接返回 Promise
{
    scripts: Promise.resolve([...])  // 立即开始加载
}

// 返回函数
{
    getScripts: () => Promise.resolve([...])  // 按需加载
}

// 好处：
// 1. 支持预加载（空闲时调用）
// 2. 支持条件加载（根据情况决定是否调用）
// 3. 可多次调用（利用缓存）
```

### 3. 为什么需要 assetPublicPath？

```javascript
// 问题：子应用部署路径和运行路径不同
// 部署：https://cdn.com/app/index.html
// 运行：https://main.com （主应用域名）

// 子应用中的相对路径
<img src="./logo.png">  // 会解析为 https://main.com/logo.png ❌

// 通过 assetPublicPath 修正
const publicPath = 'https://cdn.com/app/';
img.src = publicPath + 'logo.png';  // https://cdn.com/app/logo.png ✓
```

这种设计让 import-html-entry 既强大又灵活，满足各种微前端场景的需求。

