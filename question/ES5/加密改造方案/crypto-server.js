/**
 * ============================================
 * 服务器端加密中间件
 * Node.js / Express
 * ============================================
 */

const crypto = require('crypto');

// ============================================
// 服务器端加密工具
// ============================================
class ServerCryptoUtil {
  static secretKey = 'default-secret-key-2024';
  
  /**
   * 加密数据
   */
  static encrypt(data) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      
      // 使用与前端相同的简化算法
      const key = this.secretKey;
      let result = '';
      
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return Buffer.from(encodeURIComponent(result)).toString('base64');
    } catch (error) {
      console.error('服务器加密失败:', error);
      return data;
    }
  }
  
  /**
   * 解密数据
   */
  static decrypt(encryptedData) {
    try {
      const decoded = decodeURIComponent(
        Buffer.from(encryptedData, 'base64').toString()
      );
      
      const key = this.secretKey;
      let result = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    } catch (error) {
      console.error('服务器解密失败:', error);
      return encryptedData;
    }
  }
}

// ============================================
// Express 中间件：解密请求
// ============================================
function decryptRequestMiddleware(req, res, next) {
  // 检查是否是加密请求
  if (req.headers['x-encrypted'] !== 'true') {
    return next();
  }
  
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      
      if (parsed.encrypted) {
        console.log('[服务器] 解密请求体');
        const decrypted = ServerCryptoUtil.decrypt(parsed.encrypted);
        
        // 替换 req.body
        req.body = decrypted;
        req.rawBody = body; // 保存原始数据
      } else {
        req.body = parsed;
      }
    } catch (error) {
      console.error('[服务器] 请求解密失败:', error);
      req.body = body;
    }
    
    next();
  });
}

// ============================================
// Express 中间件：加密响应
// ============================================
function encryptResponseMiddleware(req, res, next) {
  // 保存原始方法
  const originalJson = res.json;
  const originalSend = res.send;
  
  // 重写 json 方法
  res.json = function(data) {
    // 检查请求是否要求加密
    if (req.headers['x-encrypted'] === 'true') {
      console.log('[服务器] 加密响应');
      
      const encrypted = ServerCryptoUtil.encrypt(data);
      
      res.setHeader('X-Encrypted', 'true');
      res.setHeader('Content-Type', 'text/plain');
      
      return originalSend.call(this, encrypted);
    }
    
    // 正常 JSON 响应
    return originalJson.call(this, data);
  };
  
  // 重写 send 方法
  res.send = function(data) {
    // 如果是字符串或 Buffer，且请求要求加密
    if (req.headers['x-encrypted'] === 'true' && 
        (typeof data === 'string' || Buffer.isBuffer(data))) {
      console.log('[服务器] 加密响应（send）');
      
      const str = Buffer.isBuffer(data) ? data.toString() : data;
      const encrypted = ServerCryptoUtil.encrypt(str);
      
      res.setHeader('X-Encrypted', 'true');
      res.setHeader('Content-Type', 'text/plain');
      
      return originalSend.call(this, encrypted);
    }
    
    return originalSend.apply(this, arguments);
  };
  
  next();
}

// ============================================
// 完整的 Express 应用示例
// ============================================
const express = require('express');
const app = express();

// 设置密钥（与前端保持一致）
ServerCryptoUtil.secretKey = 'your-secret-key-2024';

// CORS（如果需要）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Encrypted');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// 应用加解密中间件（在路由之前）
app.use(decryptRequestMiddleware);
app.use(encryptResponseMiddleware);

// 静态文件服务
app.use(express.static('public'));

// ============================================
// 业务路由（无需修改！）
// ============================================

// 用户登录
app.post('/api/login', (req, res) => {
  // req.body 已经自动解密
  console.log('收到登录请求:', req.body);
  
  const { username, password } = req.body;
  
  // 业务逻辑...
  if (username === 'admin' && password === 'secret') {
    // 响应会自动加密
    res.json({
      success: true,
      token: 'jwt-token-123456',
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 获取用户信息
app.get('/api/user/:id', (req, res) => {
  const { id } = req.params;
  
  // 模拟数据库查询
  const user = {
    id: parseInt(id),
    username: 'john',
    email: 'john@example.com',
    phone: '13800138000'
  };
  
  // 响应会自动加密
  res.json(user);
});

// 更新用户信息
app.put('/api/user/:id', (req, res) => {
  // req.body 已自动解密
  console.log('更新用户:', req.body);
  
  res.json({
    success: true,
    message: '更新成功',
    user: req.body
  });
});

// 公开接口（不加密）
app.get('/api/public/config', (req, res) => {
  res.json({
    version: '1.0.0',
    features: ['feature1', 'feature2']
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
  console.log(`🔐 加密拦截已启用`);
});

// ============================================
// 导出中间件（供其他项目使用）
// ============================================
module.exports = {
  ServerCryptoUtil,
  decryptRequestMiddleware,
  encryptResponseMiddleware
};

