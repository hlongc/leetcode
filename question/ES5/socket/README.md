# WebSocket 服务器示例

这是一个简单的 WebSocket 服务器实现，使用 Express 和 ws 库。

## 安装依赖

```bash
npm install
```

## 运行服务器

```bash
npm start
```

或者

```bash
node server.js
```

## 使用方法

1. 启动服务器后，在浏览器中打开 `http://localhost:3000`
2. 页面会自动连接到 WebSocket 服务器
3. 在输入框中输入消息并点击"发送"按钮
4. 服务器会回显你发送的消息

## 功能说明

### 服务器端 (server.js)

- 在 3000 端口启动 HTTP 和 WebSocket 服务器
- 监听 WebSocket 连接
- 接收客户端消息并回显
- 记录连接状态

### 客户端 (index.html)

- 自动连接到 WebSocket 服务器
- 发送和接收消息
- 显示连接状态
- 断线自动重连

## WebSocket API

### 连接

```javascript
const ws = new WebSocket("ws://localhost:3000");
```

### 发送消息

```javascript
ws.send("你的消息");
```

### 接收消息

```javascript
ws.onmessage = (event) => {
  console.log("收到消息:", event.data);
};
```

## 技术栈

- **Express**: Web 框架
- **ws**: WebSocket 库
- **原生 JavaScript**: 客户端实现
