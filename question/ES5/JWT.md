# JSON Web Token (JWT) 详解及实践

## 一、JWT 基础概念

### 什么是 JWT？

JWT（JSON Web Token）是一种开放标准（RFC 7519），它定义了一种紧凑且自包含的方式，用于在各方之间以 JSON 对象安全地传输信息。由于数字签名的存在，这些信息是可验证和可信的。JWT 可以使用密钥（使用 HMAC 算法）或使用 RSA 或 ECDSA 的公钥/私钥对进行签名。

### JWT 的结构

JWT 由三部分组成，它们之间用点（.）分隔：

1. **Header（头部）** - 通常由两部分组成：令牌的类型（即 JWT）和签名算法（如 HMAC SHA256 或 RSA）
2. **Payload（负载）** - 包含声明（claims），声明是关于实体（通常是用户）和其他数据的声明
3. **Signature（签名）** - 用于验证消息在传输过程中没有被更改，对于使用私钥签名的令牌，它还可以验证 JWT 的发送方是否为它所称的发送方

一个典型的 JWT 看起来像：

```
xxxxx.yyyyy.zzzzz
```

### JWT 的优势

1. **紧凑性**：JWT 可以通过 URL、POST 参数或 HTTP Header 发送，体积小，传输速度快
2. **自包含**：JWT 包含了用户所需的所有信息，避免了多次查询数据库
3. **跨语言支持**：几乎所有主流编程语言都有 JWT 的实现
4. **易于扩展**：可以根据需求添加自定义的声明
5. **无状态**：服务器不需要保存会话信息，有利于应用的扩展

### JWT 的使用场景

1. **身份认证**：最常见的场景，用户登录后，每个后续请求都将包含 JWT
2. **信息交换**：JWT 是在各方之间安全传输信息的一种方式
3. **单点登录（SSO）**：跨服务身份验证的理想选择
4. **微服务架构**：不同服务之间的通信验证

## 二、JWT 工作原理

### 认证流程

1. 用户通过提供凭证（如用户名和密码）进行登录
2. 服务器验证凭证，并生成一个 JWT
3. 服务器将 JWT 返回给客户端
4. 客户端存储 JWT（通常在 localStorage、sessionStorage 或 cookie 中）
5. 客户端在后续请求中携带 JWT（通常在 Authorization 请求头中）
6. 服务器验证 JWT 并处理请求

### 签名验证过程

1. 服务器接收到 JWT
2. 将 JWT 拆分为 Header、Payload 和 Signature
3. 使用 Header 中指定的算法和密钥，对 Header 和 Payload 部分重新计算签名
4. 比较计算出的签名与接收到的签名是否一致
5. 如果签名一致，则 JWT 有效；否则，拒绝请求

## 三、在 Node.js 中实现 JWT

### 安装所需库

```bash
npm install jsonwebtoken express body-parser cors
```

### 创建一个简单的 Node.js 服务器

```javascript
// server.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "your_jwt_secret"; // 在生产环境中应使用环境变量存储

// 中间件
app.use(bodyParser.json());
app.use(cors());

// 模拟用户数据库
const users = [
  { id: 1, username: "user1", password: "password1", role: "admin" },
  { id: 2, username: "user2", password: "password2", role: "user" },
];

// 登录路由
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // 查找用户
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "用户名或密码不正确" });
  }

  // 创建JWT
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" } // 令牌过期时间
  );

  res.json({ token });
});

// 验证JWT的中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "未提供认证令牌" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "令牌无效或已过期" });
    }

    req.user = user;
    next();
  });
}

// 需要认证的受保护路由
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({
    message: "这是受保护的数据",
    user: req.user,
  });
});

// 需要特定角色的路由
app.get("/api/admin", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "需要管理员权限" });
  }

  res.json({ message: "管理员专属内容" });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

### JWT 的刷新机制

为了提高安全性，我们可以实现令牌刷新机制：

```javascript
// 添加到server.js

// 存储失效的令牌（生产环境应使用Redis等）
const invalidatedTokens = new Set();

// 刷新令牌路由
app.post("/api/refresh-token", authenticateToken, (req, res) => {
  // 使当前令牌失效
  invalidatedTokens.add(req.headers.authorization.split(" ")[1]);

  // 创建新令牌
  const newToken = jwt.sign(
    {
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token: newToken });
});

// 修改验证中间件以检查令牌是否被注销
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供认证令牌" });
  }

  // 检查令牌是否已被注销
  if (invalidatedTokens.has(token)) {
    return res.status(403).json({ message: "令牌已被注销" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "令牌无效或已过期" });
    }

    req.user = user;
    next();
  });
}

// 登出路由
app.post("/api/logout", authenticateToken, (req, res) => {
  // 使令牌失效
  invalidatedTokens.add(req.headers.authorization.split(" ")[1]);
  res.json({ message: "已成功登出" });
});
```

### 双令牌机制：Access Token 与 Refresh Token

双令牌认证机制是目前广泛应用的 JWT 认证最佳实践，它通过同时使用短期的访问令牌（Access Token）和长期的刷新令牌（Refresh Token）来兼顾安全性和用户体验。

#### 双令牌机制的原理

1. **Access Token**：

   - 短期有效（通常 15 分钟到 1 小时）
   - 用于访问受保护的资源和 API
   - 每次请求都会携带此令牌

2. **Refresh Token**：
   - 长期有效（通常数天至数周）
   - 仅用于获取新的 Access Token
   - 通常只在 Access Token 过期时使用
   - 比 Access Token 具有更严格的安全措施

#### 在 Node.js 中实现双令牌机制（客户端存储两种令牌）

```javascript
// server.js 双令牌实现

const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN_SECRET = "your_access_token_secret"; // 生产环境应使用环境变量
const REFRESH_TOKEN_SECRET = "your_refresh_token_secret"; // 使用不同的密钥

// 中间件
app.use(bodyParser.json());
app.use(cors());

// 模拟用户数据库
const users = [
  { id: 1, username: "user1", password: "password1", role: "admin" },
  { id: 2, username: "user2", password: "password2", role: "user" },
];

// 存储有效的刷新令牌（生产环境应使用Redis等）
const refreshTokens = new Set();

// 生成访问令牌
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "30m" } // 短期令牌
  );
}

// 生成刷新令牌
function generateRefreshToken(user) {
  const refreshToken = jwt.sign(
    { userId: user.id, username: user.username },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" } // 长期令牌
  );

  // 存储刷新令牌以便之后验证
  refreshTokens.add(refreshToken);
  return refreshToken;
}

// 登录路由
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // 查找用户
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "用户名或密码不正确" });
  }

  // 创建两种令牌
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 将两种令牌都返回给客户端
  res.json({
    accessToken,
    refreshToken,
    expiresIn: 30 * 60, // access_token过期时间，30分钟（秒为单位）
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// 刷新访问令牌的路由
app.post("/api/token/refresh", (req, res) => {
  // 从请求体中获取刷新令牌
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "未提供刷新令牌" });
  }

  // 验证刷新令牌是否在有效集合中
  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ message: "刷新令牌无效或已过期" });
  }

  // 验证刷新令牌
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      // 从集合中移除无效的刷新令牌
      refreshTokens.delete(refreshToken);
      return res.status(403).json({ message: "刷新令牌已过期或无效" });
    }

    // 查找完整的用户信息
    const fullUser = users.find((u) => u.id === user.userId);
    if (!fullUser) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 生成新的访问令牌
    const newAccessToken = generateAccessToken(fullUser);

    // 可选：轮换刷新令牌（增强安全性）
    // 移除旧的刷新令牌
    refreshTokens.delete(refreshToken);
    // 生成新的刷新令牌
    const newRefreshToken = generateRefreshToken(fullUser);

    // 返回新令牌
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // 返回新的刷新令牌
      expiresIn: 30 * 60, // 30分钟（秒为单位）
    });

    // 如果不需要轮换刷新令牌，可以使用下面的代码替代：
    /*
    res.json({
      accessToken: newAccessToken,
      expiresIn: 30 * 60 // 30分钟（秒为单位）
    });
    */
  });
});

// 验证访问令牌的中间件
function authenticateAccessToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "未提供访问令牌" });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // 令牌过期或无效
      return res.status(403).json({
        message: "访问令牌已过期或无效",
        expired: err.name === "TokenExpiredError",
      });
    }

    req.user = user;
    next();
  });
}

// 登出路由
app.post("/api/logout", (req, res) => {
  // 从请求体中获取刷新令牌
  const { refreshToken } = req.body;

  // 从存储中移除刷新令牌
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  res.json({ message: "已成功登出" });
});

// 需要认证的受保护路由
app.get("/api/protected", authenticateAccessToken, (req, res) => {
  res.json({
    message: "这是受保护的数据",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

## 四、前端与 JWT 交互

### 在前端存储和使用 JWT

```javascript
// 登录请求
async function login(username, password) {
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "登录失败");
    }

    // 存储令牌
    localStorage.setItem("token", data.token);

    return true;
  } catch (error) {
    console.error("登录错误:", error);
    return false;
  }
}

// 发送带有JWT的请求
async function fetchProtectedData() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("未登录");
    }

    const response = await fetch("http://localhost:3000/api/protected", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // 令牌问题，可能需要重新登录
        localStorage.removeItem("token");
      }
      throw new Error(data.message || "请求失败");
    }

    return data;
  } catch (error) {
    console.error("获取数据错误:", error);
    throw error;
  }
}

// 刷新令牌
async function refreshToken() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("未登录");
    }

    const response = await fetch("http://localhost:3000/api/refresh-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "刷新令牌失败");
    }

    // 存储新令牌
    localStorage.setItem("token", data.token);

    return true;
  } catch (error) {
    console.error("刷新令牌错误:", error);
    return false;
  }
}

// 退出登录
function logout() {
  // 发送登出请求
  const token = localStorage.getItem("token");
  if (token) {
    fetch("http://localhost:3000/api/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((error) => console.error("登出错误:", error));
  }

  // 清除本地令牌
  localStorage.removeItem("token");
}
```

### 使用 Axios 拦截器自动处理 JWT

```javascript
// 使用Axios拦截器更优雅地处理JWT
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// 请求拦截器 - 添加令牌到请求头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理令牌错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是401错误且没有重试过
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 尝试刷新令牌
        const res = await api.post("/refresh-token");
        const newToken = res.data.token;

        // 存储新令牌
        localStorage.setItem("token", newToken);

        // 更新请求头并重试原请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // 刷新失败，需要重新登录
        localStorage.removeItem("token");
        window.location.href = "/login"; // 重定向到登录页
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 使用方式
export const login = (username, password) =>
  api.post("/login", { username, password });
export const getProtectedData = () => api.get("/protected");
export const getAdminData = () => api.get("/admin");
export const logoutUser = () => api.post("/logout");
```

## 五、JWT 最佳实践与安全注意事项

### 最佳实践

1. **使用 HTTPS**：始终通过 HTTPS 传输 JWT，防止中间人攻击
2. **设置合理的过期时间**：短期令牌更安全，通常设置为 15-60 分钟
3. **实现令牌刷新机制**：使用刷新令牌来获取新的访问令牌
4. **妥善保管密钥**：使用环境变量存储密钥，不要硬编码
5. **验证所有输入**：在处理 JWT 之前检查和清理所有用户输入
6. **包含最少信息**：JWT 负载中只存储必要信息，避免敏感数据

### 安全注意事项

1. **不要在客户端存储敏感信息**：JWT 是可以解码的，尽管签名部分是安全的
2. **防范 XSS 攻击**：如果使用 localStorage 存储，要防范 XSS 攻击
3. **防范 CSRF 攻击**：虽然 JWT 可以减轻 CSRF 风险，但仍应实施适当的保护
4. **令牌吊销**：实现令牌黑名单或使用短期令牌
5. **算法选择**：优先使用强加密算法如 RS256 而非 HS256
6. **防止 JWT 爆破攻击**：使用复杂密钥并实施速率限制

## 六、JWT 与其他认证方式的比较

| 认证方式       | 优点                                 | 缺点                               |
| -------------- | ------------------------------------ | ---------------------------------- |
| JWT            | 无状态、可扩展、跨域、可包含用户信息 | 令牌吊销复杂、大小较大、密钥管理   |
| Session-Cookie | 易于实现和管理、可即时撤销           | 需要服务器存储、跨域问题、扩展性差 |
| OAuth 2.0      | 适用于第三方授权、安全性高           | 实现复杂、流程较长                 |
| OpenID Connect | 身份验证标准化、与 OAuth 结合        | 复杂度高、学习曲线陡峭             |

## 结论

JWT 提供了一种灵活、安全且可扩展的方式来处理用户认证和信息交换。在 Node.js 中使用 JWT 非常简单，结合前端可以创建完整的认证解决方案。虽然 JWT 有其优势，但也存在一些挑战，特别是在令牌吊销和安全实践方面。在实际应用中，应该根据项目的具体需求和安全要求，选择合适的认证机制，并遵循最佳实践来确保系统的安全性。
