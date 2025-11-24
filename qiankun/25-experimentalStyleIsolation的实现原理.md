# 问题25：experimentalStyleIsolation（scoped CSS）的实现原理是什么？它如何给样式添加特定的作用域？

## 📌 Scoped CSS 的核心思想

**属性选择器 + 动态改写**

1. **给容器添加属性**：`data-qiankun="appName"`
2. **改写 CSS 规则**：在每个选择器后添加属性选择器
3. **作用域限制**：样式只对带有该属性的元素生效

## 🎯 实现原理

### 核心流程

```javascript
// 1. 容器标记
<div id="subapp-container" data-qiankun="react-app">
    <!-- 子应用内容 -->
</div>

// 2. CSS 改写
/* 原始样式 */
.title { color: red; }
.button { background: blue; }

/* 改写后 */
.title[data-qiankun="react-app"] { color: red; }
.button[data-qiankun="react-app"] { background: blue; }

// 3. 效果
// 只有带 data-qiankun="react-app" 的元素才会应用样式
```

### 简化实现

```javascript
/**
 * experimentalStyleIsolation 简化实现
 */
function scopedCSS(styleNode, appName) {
    const prefix = `[data-qiankun="${appName}"]`;
    const rules = styleNode.sheet?.cssRules;
    
    if (!rules) return;

    // 遍历所有 CSS 规则
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        
        // 只处理样式规则（不包括 @media、@keyframes 等）
        if (rule.type === CSSRule.STYLE_RULE) {
            const cssText = rule.cssText;
            const selectorText = rule.selectorText;
            
            // 改写选择器
            const scopedSelector = scopeSelector(selectorText, prefix);
            const scopedCssText = cssText.replace(selectorText, scopedSelector);
            
            // 删除旧规则，插入新规则
            styleNode.sheet.deleteRule(i);
            styleNode.sheet.insertRule(scopedCssText, i);
        }
    }
}

/**
 * 给选择器添加作用域
 */
function scopeSelector(selector, prefix) {
    // 简单情况：单个选择器
    // .title → .title[data-qiankun="app"]
    
    // 复杂情况：多个选择器
    // .title, .content → .title[data-qiankun="app"], .content[data-qiankun="app"]
    
    return selector
        .split(',')
        .map(item => {
            const trimmed = item.trim();
            // 添加属性选择器
            return `${trimmed}${prefix}`;
        })
        .join(', ');
}
```

### 实际使用示例

```javascript
start({
    sandbox: {
        experimentalStyleIsolation: true
    }
});

registerMicroApps([
    {
        name: 'react-app',
        entry: '//localhost:8080',
        container: '#subapp-container',
        activeRule: '/react-app'
    }
]);
```

**DOM 结构：**

```html
<!-- 主应用 -->
<div id="main-app">
    <style>
        .title { color: blue; }
        .button { background: blue; }
    </style>
    
    <h1 class="title">主应用标题</h1>
    <button class="button">主应用按钮</button>
    
    <!-- 子应用容器（带属性标记）-->
    <div id="subapp-container" data-qiankun="react-app">
        <style>
            /* 改写后的样式 */
            .title[data-qiankun="react-app"] { color: red; }
            .button[data-qiankun="react-app"] { background: red; }
        </style>
        
        <div id="root" data-qiankun="react-app">
            <h1 class="title" data-qiankun="react-app">子应用标题</h1>
            <button class="button" data-qiankun="react-app">子应用按钮</button>
        </div>
    </div>
</div>
```

**渲染结果：**

```
主应用标题：蓝色（匹配 .title）
主应用按钮：蓝色背景（匹配 .button）

子应用标题：红色（匹配 .title[data-qiankun="react-app"]）
子应用按钮：红色背景（匹配 .button[data-qiankun="react-app"]）

隔离成功 ✓
```

## 🔄 动态插入样式的处理

### 问题场景

```javascript
// 子应用动态插入样式
const style = document.createElement('style');
style.textContent = `
    .dynamic { color: green; }
`;
document.head.appendChild(style);

// 这个样式需要被改写！
```

### qiankun 的处理

```javascript
// 劫持 appendChild 和 insertBefore

const originalAppendChild = HTMLHeadElement.prototype.appendChild;

HTMLHeadElement.prototype.appendChild = function(element) {
    if (element.tagName === 'STYLE' || element.tagName === 'LINK') {
        // ⭐ 改写样式
        const appName = getCurrentAppName();
        if (appName) {
            scopedCSS(element, appName);
        }
    }
    
    return originalAppendChild.call(this, element);
};
```

**效果：**

```javascript
// 子应用代码
const style = document.createElement('style');
style.textContent = '.dynamic { color: green; }';
document.head.appendChild(style);

// qiankun 自动改写
style.textContent = '.dynamic[data-qiankun="react-app"] { color: green; }';
```

## 🎨 各种选择器的改写

### 1. 类选择器

```css
/* 原始 */
.title { color: red; }

/* 改写后 */
.title[data-qiankun="app"] { color: red; }
```

### 2. ID 选择器

```css
/* 原始 */
#app { width: 100%; }

/* 改写后 */
#app[data-qiankun="app"] { width: 100%; }
```

### 3. 标签选择器

```css
/* 原始 */
div { margin: 0; }
p { line-height: 1.5; }

/* 改写后 */
div[data-qiankun="app"] { margin: 0; }
p[data-qiankun="app"] { line-height: 1.5; }
```

### 4. 复合选择器

```css
/* 原始 */
.header .title { font-size: 20px; }
.container > .item { padding: 10px; }

/* 改写后 */
.header[data-qiankun="app"] .title[data-qiankun="app"] { font-size: 20px; }
.container[data-qiankun="app"] > .item[data-qiankun="app"] { padding: 10px; }
```

### 5. 伪类选择器

```css
/* 原始 */
.button:hover { background: blue; }
.link:visited { color: purple; }

/* 改写后 */
.button[data-qiankun="app"]:hover { background: blue; }
.link[data-qiankun="app"]:visited { color: purple; }
```

### 6. 伪元素选择器

```css
/* 原始 */
.title::before { content: '»'; }
.title::after { content: '«'; }

/* 改写后 */
.title[data-qiankun="app"]::before { content: '»'; }
.title[data-qiankun="app"]::after { content: '«'; }
```

### 7. 多个选择器

```css
/* 原始 */
.title, .subtitle, .heading { font-weight: bold; }

/* 改写后 */
.title[data-qiankun="app"], 
.subtitle[data-qiankun="app"], 
.heading[data-qiankun="app"] { font-weight: bold; }
```

## ⚠️ 无法完全隔离的情况

### 1. body 和 html 标签

```css
/* 原始 */
body { margin: 0; }
html { font-size: 14px; }

/* 改写后 */
body[data-qiankun="app"] { margin: 0; }
html[data-qiankun="app"] { font-size: 14px; }

/* 问题：
   body 和 html 不在容器内
   无法添加 data-qiankun 属性
   样式不会生效 ❌ */
```

**解决方案：**

```css
/* 不使用 body/html 选择器 */
/* 使用容器选择器代替 */
#root { margin: 0; }
.app-container { font-size: 14px; }
```

### 2. 动态创建但未标记的元素

```javascript
// 子应用动态创建元素
const div = document.createElement('div');
div.className = 'dynamic';

// ⚠️ 没有添加 data-qiankun 属性
document.body.appendChild(div);

// CSS
.dynamic[data-qiankun="app"] { color: red; }

// 问题：div 没有属性，样式不生效 ❌
```

**解决方案：**

```javascript
// qiankun 劫持 createElement

const originalCreateElement = document.createElement;

document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    // ⭐ 自动添加属性
    const appName = getCurrentAppName();
    if (appName) {
        element.setAttribute('data-qiankun', appName);
    }
    
    return element;
};
```

### 3. @media 和 @keyframes

```css
/* @media 查询 */
@media (max-width: 768px) {
    .title { font-size: 14px; }
}

/* 改写后 */
@media (max-width: 768px) {
    .title[data-qiankun="app"] { font-size: 14px; }
}

/* @keyframes 动画 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 改写后 */
@keyframes fadeIn-app {  /* 添加应用后缀 */
    from { opacity: 0; }
    to { opacity: 1; }
}

.element[data-qiankun="app"] {
    animation: fadeIn-app 1s;  /* 使用新名称 */
}
```

## 📊 与 strictStyleIsolation 的对比

| 特性 | strictStyleIsolation | experimentalStyleIsolation |
|------|---------------------|---------------------------|
| **实现** | Shadow DOM | 属性选择器 |
| **隔离程度** | 完全隔离 | 部分隔离 |
| **弹窗** | ❌ 样式丢失 | ✅ 正常 |
| **全局样式** | ❌ 不可用 | ✅ 可用 |
| **DOM 结构** | 改变（Shadow DOM） | 不改变 |
| **性能** | 好（浏览器原生） | 较差（运行时改写） |
| **兼容性** | 差（某些库不兼容） | 好 |
| **推荐度** | ⭐⭐ | ⭐⭐⭐⭐ |

## 🎓 面试要点

### 实现原理

1. **属性标记**：给容器添加 `data-qiankun` 属性
2. **选择器改写**：在选择器后添加属性选择器
3. **动态劫持**：劫持 createElement、appendChild
4. **运行时处理**：样式插入时实时改写

### 优点

1. **兼容性好**：不改变 DOM 结构
2. **弹窗正常**：弹窗样式不受影响
3. **全局样式**：可以使用外部样式库
4. **易于使用**：无需修改应用代码

### 缺点

1. **不完全隔离**：body/html 等无法隔离
2. **性能开销**：运行时改写 CSS
3. **选择器限制**：某些选择器可能改写失败
4. **实验性**：可能有未知问题

### 适用场景

- ✅ 大部分业务应用
- ✅ 使用 UI 组件库
- ✅ 有弹窗需求
- ✅ 需要全局样式
- ⚠️ 样式规则特别多时性能影响

## 💡 最佳实践

### 1. 避免使用 body/html 选择器

```css
/* ❌ 不推荐 */
body { margin: 0; }
html { font-size: 14px; }

/* ✅ 推荐 */
#root { margin: 0; }
.app-container { font-size: 14px; }
```

### 2. 配合 CSS Modules

```javascript
// CSS Modules 会生成唯一的类名
import styles from './App.module.css';

// .title_a1b2c3
<div className={styles.title}>标题</div>

// 配合 scoped CSS：
.title_a1b2c3[data-qiankun="app"] { color: red; }

// 双重保障 ✓
```

### 3. 样式前缀规范

```css
/* 给所有样式添加应用前缀 */
.react-app-title { color: red; }
.react-app-button { background: blue; }

/* 改写后 */
.react-app-title[data-qiankun="react-app"] { color: red; }
.react-app-button[data-qiankun="react-app"] { background: blue; }

/* 三重保障：前缀 + scoped + 规范 */
```

experimentalStyleIsolation 通过巧妙的选择器改写，在保证兼容性的同时实现了较好的样式隔离效果，是 qiankun 推荐的样式隔离方案！

