# 问题24：strictStyleIsolation 是如何通过 Shadow DOM 实现严格样式隔离的？有什么潜在问题？

## 📌 Shadow DOM 基础

### 什么是 Shadow DOM？

Shadow DOM 是 Web Components 标准的一部分，允许将一个**隐藏的、独立的 DOM 树**附加到元素上。

```javascript
// 创建 Shadow DOM
const container = document.querySelector('#container');
const shadowRoot = container.attachShadow({ mode: 'open' });

// 在 Shadow DOM 中添加内容
shadowRoot.innerHTML = `
    <style>
        .title { color: red; }
    </style>
    <div class="title">这是 Shadow DOM 中的内容</div>
`;
```

**DOM 结构：**

```html
<div id="container">
    #shadow-root (open)  ⭐ Shadow DOM 边界
        <style>.title { color: red; }</style>
        <div class="title">这是 Shadow DOM 中的内容</div>
</div>

<!-- 外部的样式 -->
<style>.title { color: blue; }</style>
<div class="title">这是外部的内容</div>
```

**隔离效果：**

```css
/* 外部的样式 */
.title { color: blue; }

/* Shadow DOM 内的样式 */
#shadow-root → .title { color: red; }

/* 结果：
   外部的 .title: 蓝色
   Shadow DOM 内的 .title: 红色
   完全隔离！ */
```

## 🎯 strictStyleIsolation 的实现原理

### 核心思路

将子应用的内容放入 Shadow DOM，实现样式的完全隔离。

### 简化实现

```javascript
// qiankun 的 strictStyleIsolation 实现（简化版）

function mountWithStrictStyleIsolation(container, appContent) {
    // 1. 为容器创建 Shadow DOM
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // 2. 将子应用内容放入 Shadow DOM
    shadowRoot.innerHTML = appContent;

    // 完成！样式已隔离
}
```

### 完整流程

```javascript
// qiankun 加载子应用的流程（启用 strictStyleIsolation）

async function loadApp(app, options) {
    const { entry, container } = app;
    const { strictStyleIsolation } = options.sandbox;

    // 1. 加载入口
    const { template, execScripts } = await importEntry(entry);

    // 2. 获取容器元素
    const containerElement = document.querySelector(container);

    // 3. 如果开启严格隔离，创建 Shadow DOM
    if (strictStyleIsolation) {
        // ⭐ 创建 Shadow DOM
        const shadowRoot = containerElement.attachShadow({ mode: 'open' });
        
        // 4. 将内容渲染到 Shadow DOM 中
        shadowRoot.innerHTML = template;
        
        // 5. 在 Shadow DOM 的作用域中执行脚本
        await execScripts(sandbox.proxy);
    } else {
        // 普通模式：直接渲染到容器
        containerElement.innerHTML = template;
        await execScripts(sandbox.proxy);
    }
}
```

### 实际效果

```html
<!-- 主应用 -->
<div id="main-app">
    <style>
        .button { background: blue; padding: 10px; }
        .title { font-size: 24px; }
    </style>
    
    <h1 class="title">主应用标题</h1>
    <button class="button">主应用按钮</button>
    
    <!-- 子应用容器 -->
    <div id="subapp-container">
        #shadow-root (open)
            <style>
                .button { background: red; padding: 5px; }
                .title { font-size: 16px; }
            </style>
            
            <div id="root">
                <h1 class="title">子应用标题</h1>
                <button class="button">子应用按钮</button>
            </div>
    </div>
</div>
```

**渲染结果：**

```
主应用标题：24px，默认颜色
主应用按钮：蓝色背景，10px padding

子应用标题：16px，默认颜色
子应用按钮：红色背景，5px padding

完全隔离 ✓
```

## ⚠️ 潜在问题

### 问题1: 弹窗样式丢失

```javascript
// 子应用使用 Ant Design 的 Modal

import { Modal } from 'antd';

function App() {
    const showModal = () => {
        Modal.info({
            title: '提示',
            content: '这是一个弹窗'
        });
    };

    return <button onClick={showModal}>打开弹窗</button>;
}
```

**DOM 结构：**

```html
<div id="subapp-container">
    #shadow-root (open)
        <style>
            /* Ant Design 的样式在 Shadow DOM 内 */
            .ant-modal { /* ... */ }
        </style>
        
        <div id="root">
            <button>打开弹窗</button>
        </div>
</div>

<!-- ⚠️ Modal 挂载到外部 -->
<div class="ant-modal-root">
    <div class="ant-modal">  ⭐ 在 Shadow DOM 外部
        <div class="ant-modal-content">
            提示信息
        </div>
    </div>
</div>
```

**问题：**
- 弹窗在 Shadow DOM 外部
- 样式在 Shadow DOM 内部
- 弹窗没有样式！ ❌

**解决方案：**

```javascript
// 方案1: 配置弹窗渲染到 Shadow DOM 内

Modal.info({
    title: '提示',
    content: '这是一个弹窗',
    getContainer: () => document.querySelector('#subapp-container').shadowRoot  // ⭐ 指定容器
});

// 方案2: 将样式复制到外部
const shadowRoot = container.shadowRoot;
const styles = shadowRoot.querySelectorAll('style, link[rel=stylesheet]');

styles.forEach(style => {
    const clonedStyle = style.cloneNode(true);
    document.head.appendChild(clonedStyle);  // 复制到外部
});

// 方案3: 不使用 strictStyleIsolation
start({
    sandbox: {
        experimentalStyleIsolation: true  // 使用 scoped CSS
    }
});
```

### 问题2: 全局样式无法应用

```html
<!-- 主应用引入全局样式库 -->
<link rel="stylesheet" href="https://cdn.com/normalize.css">
<link rel="stylesheet" href="https://cdn.com/antd.min.css">
```

**问题：**

```javascript
// 子应用在 Shadow DOM 中
// 外部的样式无法穿透进来

// 子应用使用 Ant Design 组件
<Button type="primary">按钮</Button>

// 期望：应用 antd.min.css 的样式
// 实际：没有样式（样式在 Shadow DOM 外部）❌
```

**解决方案：**

```javascript
// 在子应用中重新引入样式

// 方式1: 在 HTML 中引入
// 子应用的 index.html
<link rel="stylesheet" href="https://cdn.com/antd.min.css">

// 方式2: 在代码中动态引入
import 'antd/dist/antd.css';

// 这些样式会被加载到 Shadow DOM 中
// 可以正常应用 ✓

// 缺点：
// - 样式重复加载（主应用和子应用都加载）
// - 增加体积和加载时间
```

### 问题3: :host 和 ::slotted 选择器

```css
/* Shadow DOM 的特殊选择器 */

/* :host - 选择 shadow host */
:host {
    display: block;
    width: 100%;
}

/* :host-context - 基于外部上下文 */
:host-context(.dark-theme) {
    background: black;
}

/* ::slotted - 选择插槽内容 */
::slotted(*) {
    margin: 10px;
}

/* 问题：
   如果子应用没有使用这些选择器，
   某些样式可能无法生效 */
```

### 问题4: 某些 DOM API 行为改变

```javascript
// Shadow DOM 中的 DOM 查询

// 外部查询
document.querySelector('.title');
// 返回：外部的 .title
// 找不到 Shadow DOM 内的 .title ❌

// 需要：
const shadowRoot = container.shadowRoot;
shadowRoot.querySelector('.title');
// 返回：Shadow DOM 内的 .title ✓

// 这可能导致某些第三方库失效
```

### 问题5: 事件委托问题

```javascript
// 主应用的事件委托

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('action-button')) {
        // 处理点击
    }
});

// 问题：Shadow DOM 中的事件
// event.target 在事件冒泡到外部时会变成 shadow host
// 无法获取实际点击的元素 ❌

// Shadow DOM 的事件重定向（Event Retargeting）
// 保护了 Shadow DOM 的封装性
// 但可能破坏某些事件处理逻辑
```

## ✅ strictStyleIsolation 的最佳实践

### 1. 适合的场景

```javascript
// ✅ 样式完全独立的应用
// - 不依赖全局样式
// - 不使用弹窗
// - 不需要与外部交互

// 例如：
// - 独立的小组件
// - 完全自包含的应用
// - 数据展示类应用
```

### 2. 配置弹窗容器

```javascript
// 统一配置弹窗渲染到 Shadow DOM 内

// React 应用
import { ConfigProvider } from 'antd';

function App() {
    return (
        <ConfigProvider
            getPopupContainer={(triggerNode) => {
                // 返回 Shadow DOM 根节点
                return triggerNode.getRootNode();
            }}
        >
            {/* 应用内容 */}
        </ConfigProvider>
    );
}
```

### 3. 样式提取

```javascript
// 将样式提取到 Shadow DOM 内

function extractStylesToShadowRoot(shadowRoot) {
    // 从外部复制样式
    const externalStyles = document.querySelectorAll('link[rel=stylesheet], style');
    
    externalStyles.forEach(style => {
        const clonedStyle = style.cloneNode(true);
        shadowRoot.appendChild(clonedStyle);
    });
}
```

## 🎓 面试要点

### 实现原理

1. **Shadow DOM**：浏览器原生隔离机制
2. **边界**：shadow-root 形成隔离边界
3. **样式作用域**：样式只在 Shadow DOM 内生效

### 优点

1. **完全隔离**：浏览器级别的隔离
2. **性能好**：原生实现，无运行时开销
3. **标准化**：基于 Web Components 标准

### 缺点

1. **弹窗问题**：弹窗样式丢失
2. **全局样式**：无法使用外部样式
3. **DOM 查询**：需要特殊处理
4. **事件处理**：事件重定向
5. **兼容性**：某些组件库不兼容

### 适用场景

- ✅ 完全独立的应用
- ✅ 不使用弹窗
- ✅ 不依赖全局样式
- ❌ 使用 UI 库（Ant Design、Element UI 等）
- ❌ 需要与外部 DOM 交互

## 💡 为什么不是默认方案？

```javascript
// Shadow DOM 虽然隔离完美，但兼容性问题太多

// 问题列表：
// 1. 弹窗样式丢失（最常见）
// 2. 全局样式库无法使用
// 3. 某些第三方库不兼容
// 4. 需要改造现有应用
// 5. 事件处理复杂

// 因此 qiankun 推荐使用 experimentalStyleIsolation
// 兼容性好，大部分场景够用
```

strictStyleIsolation 通过 Shadow DOM 实现了最彻底的样式隔离，但也带来了一些兼容性问题，需要根据实际场景权衡使用！

