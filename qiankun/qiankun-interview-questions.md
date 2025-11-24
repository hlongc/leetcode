# Qiankun & Import-HTML-Entry 面试题详解

> 本文档基于 qiankun 和 import-html-entry 源码分析，帮助准备资深前端开发工程师面试

---

## 📚 目录

- [第一部分：import-html-entry 核心原理（1-8题）](#第一部分import-html-entry-核心原理)
- [第二部分：qiankun 应用加载与生命周期（9-15题）](#第二部分qiankun-应用加载与生命周期)
- [第三部分：JavaScript 沙箱机制（16-22题）](#第三部分javascript-沙箱机制)
- [第四部分：样式隔离方案（23-26题）](#第四部分样式隔离方案)
- [第五部分：性能优化与工程实践（27-30题）](#第五部分性能优化与工程实践)

---

## 第一部分：import-html-entry 核心原理

### 问题 1：import-html-entry 的核心作用是什么？它解决了微前端中的哪些关键问题？

✅ **详见：`01-import-html-entry的核心作用.md`**

---

### 问题 2：import-html-entry 是如何解析 HTML 模板的？processTpl 函数的实现原理是什么？

✅ **详见：`02-processTpl函数的实现原理.md`**

---

### 问题 3：import-html-entry 如何处理 HTML 中的外链脚本（external scripts）和内联脚本（inline scripts）？

✅ **详见：`03-外链和内联脚本的处理机制.md`**

---

### 问题 4：execScripts 函数的执行机制是什么？它如何保证脚本的执行顺序和作用域隔离？

✅ **详见：`04-execScripts函数的执行机制.md`**

---

### 问题 5：import-html-entry 如何处理 CSS 资源？外链样式和内联样式的加载策略有什么不同？

✅ **详见：`05-CSS资源的处理策略.md`**

---

### 问题 6：importEntry 函数返回的数据结构是什么？各个字段的含义和作用是什么？

✅ **详见：`06-importEntry返回的数据结构.md`**

---

### 问题 7：import-html-entry 的缓存机制是如何实现的？如何避免重复加载相同的资源？

✅ **详见：`07-缓存机制的实现.md`**

---

### 问题 8：fetch 参数的自定义功能有什么作用？在实际项目中如何利用它解决跨域或权限验证问题？

✅ **详见：`08-自定义fetch的作用.md`**

---

## 第二部分：qiankun 应用加载与生命周期

### 问题 9：qiankun 的应用注册流程是怎样的？registerMicroApps 函数做了哪些事情？

✅ **详见：`09-qiankun应用注册流程.md`**

---

### 问题 10：qiankun 如何实现路由劫持和应用切换？start 函数的核心逻辑是什么？

✅ **详见：`10-start函数与路由劫持.md`**

---

### 问题 11：loadMicroApp 和 registerMicroApps 的区别是什么？各自的适用场景是什么？

✅ **详见：`11-loadMicroApp与registerMicroApps的区别.md`**

---

### 问题 12：qiankun 的生命周期有哪些？beforeLoad、beforeMount、afterMount 等钩子的执行时机和用途是什么？

✅ **详见：`12-生命周期钩子详解.md`**

---

### 问题 13：子应用的生命周期函数（bootstrap、mount、unmount）是如何被调用的？

✅ **详见：`13-子应用生命周期的调用机制.md`**

---

### 问题 14：qiankun 如何实现应用的预加载（prefetch）？预加载策略有哪几种？

✅ **详见：`14-预加载机制详解.md`**

---

### 问题 15：当子应用加载失败时，qiankun 的错误处理机制是怎样的？如何自定义错误处理？

✅ **详见：`15-错误处理机制.md`**

---

## 第三部分：JavaScript 沙箱机制

### 问题 16：qiankun 为什么需要 JavaScript 沙箱？沙箱解决了哪些核心问题？

✅ **详见：`16-为什么需要JavaScript沙箱.md`**

---

### 问题 17：qiankun 提供了哪几种沙箱实现？它们分别是什么，有什么区别？

✅ **详见：`17-qiankun的三种沙箱实现.md`**

---

### 问题 18：SnapshotSandbox（快照沙箱）的实现原理是什么？它的优缺点是什么？

✅ **详见：`18-SnapshotSandbox实现原理.md`**

---

### 问题 19：LegacySandbox（单例代理沙箱）是如何工作的？为什么叫"Legacy"？

✅ **详见：`19-LegacySandbox实现原理.md`**

---

### 问题 20：ProxySandbox（多例代理沙箱）的实现原理是什么？它如何实现多个应用同时运行？

✅ **详见：`20-ProxySandbox实现原理.md`**

---

### 问题 21：沙箱如何处理 window 对象的属性修改？Proxy 的 get、set、has 等 trap 分别做了什么？

✅ **详见：`21-Proxy的trap处理机制.md`**

---

### 问题 22：哪些全局属性不能被沙箱代理？qiankun 如何处理这些特殊属性（如 document、location 等）？

✅ **详见：`22-不能被沙箱代理的全局属性.md`**

---

## 第四部分：样式隔离方案

### 问题 23：qiankun 提供了哪些样式隔离方案？strictStyleIsolation 和 experimentalStyleIsolation 的区别是什么？

✅ **详见：`23-样式隔离方案概述.md`**

---

### 问题 24：strictStyleIsolation 是如何通过 Shadow DOM 实现严格样式隔离的？有什么潜在问题？

✅ **详见：`24-strictStyleIsolation的Shadow-DOM实现.md`**

---

### 问题 25：experimentalStyleIsolation（scoped CSS）的实现原理是什么？它如何给样式添加特定的作用域？

✅ **详见：`25-experimentalStyleIsolation的实现原理.md`**

---

### 问题 26：在不开启样式隔离的情况下，qiankun 如何防止子应用的样式污染？

✅ **详见：`26-不开启样式隔离时的防污染策略.md`**

---

## 第五部分：性能优化与工程实践

### 问题 27：qiankun 的资源预加载（prefetch）是如何实现的？requestIdleCallback 在其中起什么作用？

✅ **详见：`27-资源预加载实现详解.md`**

---

### 问题 28：如何优化 qiankun 应用的首屏加载速度？有哪些最佳实践？

✅ **详见：`28-首屏加载优化最佳实践.md`**

---

### 问题 29：qiankun 如何实现应用间通信？全局状态管理（globalState）的实现原理是什么？

✅ **详见：`29-应用间通信机制.md`**

---

### 问题 30：在生产环境中使用 qiankun 需要注意哪些问题？如何处理版本兼容性、浏览器兼容性等问题？

✅ **详见：`30-生产环境注意事项.md`**

---

## 📝 学习建议

1. **结合源码阅读**：每个问题的答案都基于实际源码分析，建议对照源码理解
2. **动手实践**：尝试修改源码，观察行为变化，加深理解
3. **场景思考**：思考每个技术点在实际项目中的应用场景
4. **对比学习**：对比不同实现方案的优缺点，理解设计权衡

---

*本文档将持续更新，添加详细的源码分析和答案...*

