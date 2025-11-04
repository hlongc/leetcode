# 🔐 网络请求加密改造方案

## 📋 目录说明

本目录包含了完整的网络请求加密改造方案，实现**零侵入**的端到端加密。

---

## 📁 文件列表

### 📖 文档（建议阅读顺序）

1. **加密改造使用指南.md** 🚀
   - 快速开始（3步完成）
   - 使用示例
   - 配置说明
   - **推荐先看这个**

2. **网络加密改造方案.md** 📖
   - 完整的技术方案
   - 多种实现方式对比
   - 原理详解
   - 详细文档

3. **加密改造架构图.md** 🏗️
   - 架构设计
   - 数据流程图
   - 性能分析

### 💻 代码文件

| 文件 | 说明 | 推荐场景 |
|------|------|---------|
| `crypto-interceptor.js` | 简化版拦截器 | 开发测试 |
| `crypto-interceptor-secure.js` | 安全版拦截器（AES-256-GCM） | **生产环境** |
| `crypto-server.js` | Node.js 服务器端中间件 | 后端配合 |
| `crypto-demo.html` | 完整演示页面 | 测试验证 |
| `crypto-example-package.json` | NPM 配置 | 项目依赖 |

---

## 🚀 快速开始

### 前端（只需一行）

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 在所有脚本之前添加这一行 -->
  <script src="crypto-interceptor-secure.js" 
          data-key="your-secret-key-2024" 
          data-urls="/api/"></script>
  
  <!-- 第三方库（无需修改） -->
  <script src="axios.min.js"></script>
  
  <!-- 业务代码（无需修改） -->
  <script src="app.js"></script>
</head>
</html>
```

### 服务器端（Node.js）

```javascript
const { decryptRequestMiddleware, encryptResponseMiddleware } = require('./crypto-server');

app.use(decryptRequestMiddleware);
app.use(encryptResponseMiddleware);

// 业务路由（无需修改）
app.post('/api/user', (req, res) => {
  // req.body 已自动解密
  // res.json() 会自动加密
  res.json({ success: true });
});
```

---

## ✨ 核心优势

- ✅ **零侵入**：业务代码一行不改
- ✅ **全兼容**：支持 fetch、axios、jQuery 等所有库
- ✅ **透明加密**：自动加密请求、自动解密响应
- ✅ **易部署**：只需添加一个脚本文件
- ✅ **高安全**：AES-256-GCM 加密

---

## 🎯 工作原理

通过 **Monkey Patching** 技术，在全局 API 加载前替换 `fetch` 和 `XMLHttpRequest`：

```
业务代码调用 fetch()
        ↓
   【拦截器拦截】
        ↓
    加密请求体
        ↓
   发送到服务器
        ↓
  【服务器中间件】
        ↓
    解密→处理→加密
        ↓
    返回到浏览器
        ↓
   【拦截器拦截】
        ↓
    解密响应体
        ↓
业务代码收到明文数据
```

---

## 📊 测试

打开 `crypto-demo.html` 查看完整演示：

- ✅ Fetch API 测试
- ✅ XMLHttpRequest 测试
- ✅ Axios 测试（第三方库）
- ✅ jQuery 测试（第三方库）
- ✅ 登录表单场景
- ✅ 并发请求测试

---

## 📚 相关文档

完整的方案说明请查看：
1. `加密改造使用指南.md` - 快速上手
2. `网络加密改造方案.md` - 原理详解
3. `加密改造架构图.md` - 架构设计

---

## 💡 实施建议

1. 先阅读《加密改造使用指南.md》
2. 在本地运行 `crypto-demo.html` 测试
3. 根据项目需求调整配置
4. 部署到测试环境验证
5. 上线到生产环境

---

**约 20 分钟即可完成改造！** 🎉

