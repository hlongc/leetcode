# 如何终止和重置 SharedWorker

## 🚫 为什么需要终止 SharedWorker？

- 修改了 `shared-worker.js` 代码
- 想要重置所有状态（计数器、消息等）
- 调试时需要重新开始
- SharedWorker 出现异常

**注意：** SharedWorker 不会自动重载！修改代码后必须手动终止。

## ⚡ 快速方法对比

| 方法                     | 速度       | 推荐度     | 适用场景        |
| ------------------------ | ---------- | ---------- | --------------- |
| 方法 1：关闭所有标签页   | ⭐⭐⭐     | ⭐⭐       | 标签页少时      |
| 方法 2：chrome://inspect | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 推荐！任何时候  |
| 方法 3：self.close()     | ⭐⭐⭐⭐   | ⭐⭐⭐     | 已打开 DevTools |
| 方法 4：强制重载模式     | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | 开发调试时      |

---

## 🔄 方法 1：关闭所有标签页（最简单）

### 步骤：

1. 关闭所有打开 `http://localhost:3000/shared-worker-demo.html` 的标签页
2. 等待 2-3 秒（确保 SharedWorker 完全终止）
3. 重新打开页面

### 优点：

✅ 最简单，不需要额外操作

### 缺点：

❌ 需要关闭所有标签页
❌ 麻烦，每次都要重新打开

---

## 🔄 方法 2：通过 chrome://inspect 终止（⭐ 推荐）

### 步骤：

#### 1. 打开检查页面

在浏览器地址栏输入：

```
chrome://inspect/#workers
```

#### 2. 找到 SharedWorker

你会看到：

```
═══════════════════════════════════════════
Shared workers for localhost:3000

  http://localhost:3000/shared-worker.js
  Started: 5 minutes ago
  Connections: 3
  [inspect]  [terminate]  ← 点击 terminate
═══════════════════════════════════════════
```

#### 3. 点击 [terminate] 按钮

- SharedWorker 会立即终止
- 所有标签页的连接会断开

#### 4. 刷新任意标签页

按 `F5` 或 `Cmd+R`，SharedWorker 会重新启动并加载最新代码

### 优点：

✅ 不需要关闭标签页
✅ 可以立即看到效果
✅ 适合频繁调试

### 缺点：

❌ 需要额外打开一个标签页

### 截图说明：

```
1. 打开 chrome://inspect/#workers

2. 找到 Shared workers 部分：
   ┌────────────────────────────────────────────┐
   │ Shared workers                             │
   ├────────────────────────────────────────────┤
   │ http://localhost:3000/shared-worker.js     │
   │ Started: 2 minutes ago                     │
   │ [inspect] [terminate] ← 点这里             │
   └────────────────────────────────────────────┘

3. 点击后，所有标签页会显示断开连接
4. 刷新页面，重新连接
```

---

## 🔄 方法 3：通过 DevTools 终止

### 步骤：

#### 1. 打开 SharedWorker DevTools

```
chrome://inspect/#workers → 点击 [inspect]
```

#### 2. 在 Console 中执行

```javascript
self.close();
```

#### 3. 刷新标签页

按 `F5` 重新启动 SharedWorker

### 优点：

✅ 如果已经打开了 DevTools，非常快

### 缺点：

❌ 需要先打开 DevTools
❌ 需要手动输入命令

---

## 🔄 方法 4：强制重载模式（开发时推荐）

### 配置方法：

我已经在 `shared-worker-demo.html` 中添加了强制重载功能！

查看第 459 行：

```javascript
// 开发模式：添加时间戳强制重载
const isDev = true; // ← 开发时设为 true

const workerUrl = isDev
  ? `shared-worker.js?v=${Date.now()}`
  : "shared-worker.js";

const worker = new SharedWorker(workerUrl);
```

### 使用方法：

#### 开发模式（自动重载）

```javascript
const isDev = true; // ✅ 开启
```

- 每次刷新页面都会创建新的 SharedWorker
- 不需要手动终止
- 适合频繁修改代码

#### 生产模式（共享）

```javascript
const isDev = false; // ✅ 关闭
```

- 多个标签页共享同一个 SharedWorker
- 正常使用场景

### 优点：

✅ 开发时最方便
✅ 不需要手动终止
✅ 刷新页面即可看到最新代码

### 缺点：

❌ 每个标签页会创建独立的 Worker（失去"共享"特性）
❌ 生产环境必须关闭

---

## 📋 完整操作流程

### 场景 1：修改代码后重新加载

#### 使用强制重载模式（推荐）：

```bash
1. 确保 isDev = true
2. 修改 shared-worker.js
3. 按 F5 刷新页面
4. ✅ 完成！
```

#### 使用 terminate 方式：

```bash
1. 修改 shared-worker.js
2. 打开 chrome://inspect/#workers
3. 点击 [terminate]
4. 按 F5 刷新页面
5. ✅ 完成！
```

### 场景 2：重置所有状态

```bash
1. 打开 chrome://inspect/#workers
2. 点击 [terminate]
3. 刷新所有标签页
4. ✅ 计数器、消息等都已重置
```

### 场景 3：调试时快速重启

```bash
# 如果已打开 SharedWorker DevTools：
1. 在 Console 中输入：self.close()
2. 按 F5 刷新页面
3. ✅ 完成！
```

---

## 🎯 推荐工作流程

### 开发调试时：

```javascript
// shared-worker-demo.html 中设置
const isDev = true; // 开启强制重载

// 工作流程：
1. 修改代码
2. 按 F5 刷新
3. 立即看到效果
```

### 测试共享功能时：

```javascript
// shared-worker-demo.html 中设置
const isDev = false; // 关闭强制重载

// 工作流程：
1. 打开多个标签页
2. 测试跨标签页通信
3. 如需重置，用 terminate 方法
```

### 生产环境：

```javascript
// shared-worker-demo.html 中设置
const isDev = false; // 必须关闭

// 多个标签页共享同一个 SharedWorker
```

---

## ❓ 常见问题

### Q1: 修改代码后刷新页面，为什么没变化？

**A:** SharedWorker 不会自动重载！必须：

1. 设置 `isDev = true`（推荐）
2. 或者手动 terminate

### Q2: 怎么知道 SharedWorker 已经终止？

**A:** 在 `chrome://inspect/#workers` 中：

- 终止后，该项会消失
- 或者状态变为 "terminated"

### Q3: 终止后，标签页还能正常工作吗？

**A:**

- 终止后，连接会断开
- 必须刷新页面重新连接
- 或者代码中实现自动重连

### Q4: 为什么我的 SharedWorker 列表是空的？

**A:**

- 确保至少有一个标签页已经创建了 SharedWorker
- 检查是否有 JavaScript 错误阻止了 Worker 创建
- 刷新 `chrome://inspect` 页面

### Q5: 开发时应该用哪种方法？

**A:** 推荐：

1. **频繁修改代码**：使用强制重载模式 (`isDev = true`)
2. **测试共享功能**：使用 terminate 方式
3. **偶尔调试**：关闭所有标签页

---

## 🔍 验证是否成功重置

### 检查清单：

#### 1. 在 SharedWorker DevTools 中查看

```
chrome://inspect/#workers → [inspect]

Console 中应该看到：
============================================================
[新的时间] [SUCCESS] 🚀 SharedWorker 已启动
============================================================
```

#### 2. 在页面中查看

- 计数器应该回到 0
- 消息列表应该清空
- 连接数应该重新计算

#### 3. 查看客户端 ID

- 新的 SharedWorker 会从 1 开始分配 ID
- 如果看到 ID 还是之前的，说明没有重置成功

---

## 📝 快速命令参考

### Chrome DevTools Console（页面）

```javascript
// 查看当前 Worker 状态
worker.port;

// 重新创建 Worker（需要添加版本号）
const newWorker = new SharedWorker("shared-worker.js?v=" + Date.now());
```

### SharedWorker DevTools Console

```javascript
// 终止 SharedWorker
self.close();

// 查看连接数
ports.length;

// 查看所有数据
console.table(
  ports.map((p) => ({
    客户端ID: p.clientId,
    连接时间: p.connectedAt,
  }))
);
```

---

## 🎓 总结

| 场景                         | 推荐方法                           |
| ---------------------------- | ---------------------------------- |
| **开发调试**（频繁修改代码） | 方法 4：强制重载模式               |
| **测试共享功能**（多标签页） | 方法 2：chrome://inspect terminate |
| **快速重置**                 | 方法 2：chrome://inspect terminate |
| **偶尔调试**                 | 方法 1：关闭所有标签页             |

**记住：** 生产环境一定要设置 `isDev = false`！
