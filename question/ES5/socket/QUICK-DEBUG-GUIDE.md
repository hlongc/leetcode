# SharedWorker 日志查看 - 快速指南

## 🚀 5 秒快速开始

### Chrome/Edge 用户：

1. **在浏览器新标签页中输入：**

   ```
   chrome://inspect/#workers
   ```

2. **找到你的 SharedWorker**

   ```
   Shared workers
   └── http://localhost:3000/shared-worker.js  [inspect] ← 点这里
   ```

3. **查看彩色日志输出：**

   ```
   ============================================================
   [14:30:22] [SUCCESS] 🚀 SharedWorker 已启动
   [14:30:22] [INFO] 📍 Worker 位置: http://localhost:3000/shared-worker.js
   [14:30:22] [INFO] ⏰ 启动时间: 2025-10-20T06:30:22.123Z
   ============================================================

   👤 客户端 1 连接
     [14:30:23] [SUCCESS] ✅ 新客户端连接
     [14:30:23] [INFO] 🆔 客户端 ID: 1
     [14:30:23] [INFO] 📊 当前连接数: 1
     ┌─────────┬────────────┬──────────────┐
     │ (index) │  客户端ID  │   连接时间   │
     ├─────────┼────────────┼──────────────┤
     │    0    │     1      │  '14:30:23'  │
     └─────────┴────────────┴──────────────┘

   [14:30:25] [INFO] ➕ 计数器递增: 1 (客户端 1)
   [14:30:27] [SUCCESS] 💬 收到消息 (客户端 1): Hello
   [14:30:37] [INFO] 💓 心跳 - 连接数: 1, 计数器: 1, 消息数: 1
   ```

## 📱 完整步骤（带截图说明）

### Step 1: 打开页面

```
http://localhost:3000/shared-worker-demo.html
```

### Step 2: 访问调试页面

在新标签页输入：`chrome://inspect/#workers`

你会看到类似这样的界面：

```
═══════════════════════════════════════════════════════════
  Service Workers    Web Workers    Shared Workers
═══════════════════════════════════════════════════════════

Shared workers for localhost:3000

  http://localhost:3000/shared-worker.js
  Started: 2 minutes ago
  [inspect]  ← 点击这里！
```

### Step 3: 查看日志

点击 `[inspect]` 后会打开新窗口，切换到 **Console** 标签即可看到彩色日志。

## 🎨 日志颜色说明

| 颜色    | 级别    | 说明     | 示例               |
| ------- | ------- | -------- | ------------------ |
| 🟢 绿色 | SUCCESS | 成功操作 | 连接建立、消息发送 |
| 🔵 蓝色 | INFO    | 普通信息 | 计数器变化、心跳   |
| 🟠 橙色 | WARNING | 警告信息 | 重置、清空         |
| 🔴 红色 | ERROR   | 错误信息 | 发送失败、未知类型 |

## 🔍 常见问题

### Q: 找不到 "Shared workers" 部分？

**A:** 确保你已经打开了 `shared-worker-demo.html` 页面。SharedWorker 只有在被使用时才会出现。

### Q: 点击 inspect 没反应？

**A:** 检查弹窗拦截器，或者手动允许弹窗。

### Q: 日志不更新？

**A:**

1. 检查是否打开了正确的 DevTools（SharedWorker 的，不是页面的）
2. 尝试刷新页面
3. 关闭所有标签页后重新打开

### Q: 修改代码后看不到变化？

**A:** SharedWorker 不会自动重载！需要：

1. 关闭所有使用该 Worker 的标签页
2. 或者在 `chrome://inspect` 中 terminate
3. 然后重新打开页面

## 🎯 测试建议

### 1. 打开多个标签页

```bash
# 快捷键
Ctrl+T (Windows) 或 Cmd+T (Mac)

# 打开 3-5 个相同的页面
http://localhost:3000/shared-worker-demo.html
```

### 2. 在任意标签页操作

- 点击 "增加" 按钮
- 发送消息
- 观察 SharedWorker 的 Console 日志

### 3. 你会看到：

```
[14:31:10] [INFO] ➕ 计数器递增: 5 (客户端 2)
[14:31:12] [SUCCESS] 💬 收到消息 (客户端 3): Test message
[14:31:15] [WARNING] 🔄 计数器重置 (客户端 1)
```

## 🦊 Firefox 用户

1. 访问：`about:debugging#/runtime/this-firefox`
2. 找到 "Shared Workers" 部分
3. 点击 "检查" 按钮
4. 在 Console 标签查看日志

## 💡 高级技巧

### 使用过滤器

在 Console 中可以过滤日志：

```
SUCCESS     # 只看成功的日志
计数器      # 只看计数器相关
客户端 1    # 只看特定客户端
```

### 清空日志

```javascript
clear(); // 在 Console 中输入
```

### 设置断点

在 Sources 标签中可以给 `shared-worker.js` 设置断点，调试更方便。

## 📚 相关命令

```javascript
// 在 SharedWorker 的 Console 中可以执行：
ports.length; // 查看连接数
sharedCounter; // 查看计数器值
messages; // 查看所有消息
connectedClients; // 查看客户端映射
```

## 🎓 学习路径

1. ✅ 查看 SharedWorker 启动日志
2. ✅ 打开多个标签页，观察连接日志
3. ✅ 操作按钮，观察计数器日志
4. ✅ 发送消息，观察消息日志
5. ✅ 查看每 10 秒的心跳日志
6. ✅ 关闭标签页，观察连接数变化

---

**提示：** 保持 `chrome://inspect/#workers` 标签页打开，方便随时查看日志！
