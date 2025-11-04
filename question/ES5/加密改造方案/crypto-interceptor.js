/**
 * ============================================
 * Crypto Interceptor - 网络请求加密拦截器
 * ============================================
 * 
 * 功能：
 * 1. 拦截所有 fetch 和 XMLHttpRequest 请求
 * 2. 自动加密请求体
 * 3. 自动解密响应体
 * 4. 对第三方库透明（无需修改代码）
 * 
 * 使用方式：
 * <script src="crypto-interceptor.js" data-key="your-secret-key" data-urls="/api/,/user/"></script>
 * 
 * 注意：必须在所有其他脚本之前引入！
 */

(function(global) {
  'use strict';
  
  // ============================================
  // 配置读取
  // ============================================
  const currentScript = document.currentScript;
  const CONFIG = {
    secretKey: currentScript?.getAttribute('data-key') || 'default-secret-key-2024',
    encryptUrls: (currentScript?.getAttribute('data-urls') || '/api/').split(',').map(u => u.trim()),
    debug: currentScript?.getAttribute('data-debug') === 'true'
  };
  
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[CryptoInterceptor]', ...args);
    }
  }
  
  // ============================================
  // 加密工具类（使用简化版，实际项目用 Web Crypto API）
  // ============================================
  class CryptoUtil {
    static _key = null;
    
    /**
     * 加密数据
     */
    static encrypt(data) {
      try {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        
        // 简化版加密（实际项目使用 AES）
        // 这里使用 Base64 + 简单混淆作为示例
        const encoded = this.simpleEncrypt(str);
        
        log('加密完成:', str.substring(0, 50) + '...');
        return encoded;
      } catch (error) {
        console.error('加密失败:', error);
        return data;
      }
    }
    
    /**
     * 解密数据
     */
    static decrypt(encryptedData) {
      try {
        const decrypted = this.simpleDecrypt(encryptedData);
        
        log('解密完成:', decrypted.substring(0, 50) + '...');
        
        // 尝试解析 JSON
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      } catch (error) {
        console.error('解密失败:', error);
        return encryptedData;
      }
    }
    
    /**
     * 简化版加密（示例，实际使用 Web Crypto API）
     */
    static simpleEncrypt(str) {
      // Base64 + XOR
      const key = CONFIG.secretKey;
      let result = '';
      
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return btoa(encodeURIComponent(result));
    }
    
    static simpleDecrypt(encrypted) {
      const decoded = decodeURIComponent(atob(encrypted));
      const key = CONFIG.secretKey;
      let result = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return result;
    }
  }
  
  // ============================================
  // 判断是否需要加密
  // ============================================
  function shouldEncrypt(url) {
    // 检查 URL 是否匹配加密规则
    return CONFIG.encryptUrls.some(pattern => {
      if (typeof url === 'string') {
        return url.includes(pattern);
      }
      if (url instanceof URL) {
        return url.pathname.includes(pattern);
      }
      return false;
    });
  }
  
  // ============================================
  // Fetch API 拦截
  // ============================================
  const originalFetch = global.fetch;
  
  global.fetch = async function(...args) {
    let [resource, options = {}] = args;
    
    // 获取 URL
    const url = typeof resource === 'string' ? resource : resource.url;
    
    log('拦截 Fetch:', url);
    
    // 加密请求体
    if (options.body && shouldEncrypt(url)) {
      log('加密请求体');
      
      const encrypted = CryptoUtil.encrypt(options.body);
      
      options = {
        ...options,
        body: JSON.stringify({ encrypted }),
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'X-Encrypted': 'true'
        }
      };
    }
    
    // 调用原始 fetch
    const response = await originalFetch(resource, options);
    
    // 解密响应
    if (response.headers.get('X-Encrypted') === 'true') {
      try {
        const cloned = response.clone();
        const text = await cloned.text();
        
        log('解密响应体');
        const decrypted = CryptoUtil.decrypt(text);
        
        // 创建新的 Response
        return new Response(
          typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted),
          {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          }
        );
      } catch (error) {
        console.error('响应解密失败:', error);
        return response;
      }
    }
    
    return response;
  };
  
  // ============================================
  // XMLHttpRequest 拦截
  // ============================================
  const OriginalXHR = global.XMLHttpRequest;
  
  global.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    // 保存原始方法
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    const originalSetRequestHeader = xhr.setRequestHeader;
    
    let requestURL = '';
    let requestMethod = '';
    
    // 拦截 open
    xhr.open = function(method, url, ...args) {
      requestURL = url;
      requestMethod = method;
      log('拦截 XHR:', method, url);
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    // 拦截 send
    xhr.send = function(body) {
      if (body && shouldEncrypt(requestURL)) {
        log('加密 XHR 请求体');
        
        const encrypted = CryptoUtil.encrypt(body);
        
        // 设置加密标记
        originalSetRequestHeader.call(this, 'Content-Type', 'application/json');
        originalSetRequestHeader.call(this, 'X-Encrypted', 'true');
        
        return originalSend.call(this, JSON.stringify({ encrypted }));
      }
      
      return originalSend.apply(this, arguments);
    };
    
    // 拦截响应（处理 responseText）
    const originalResponseTextGetter = Object.getOwnPropertyDescriptor(
      OriginalXHR.prototype,
      'responseText'
    ).get;
    
    Object.defineProperty(xhr, 'responseText', {
      get: function() {
        const originalText = originalResponseTextGetter.call(this);
        
        // 检查是否需要解密
        if (this.getResponseHeader('X-Encrypted') === 'true' && originalText) {
          try {
            log('解密 XHR 响应');
            const decrypted = CryptoUtil.decrypt(originalText);
            return typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted);
          } catch (error) {
            console.error('XHR 响应解密失败:', error);
            return originalText;
          }
        }
        
        return originalText;
      }
    });
    
    return xhr;
  };
  
  // 保持原型链
  Object.setPrototypeOf(global.XMLHttpRequest, OriginalXHR);
  global.XMLHttpRequest.prototype = OriginalXHR.prototype;
  
  // ============================================
  // 初始化完成
  // ============================================
  log('✅ 加密拦截器已安装');
  log('配置:', {
    secretKey: CONFIG.secretKey.substring(0, 10) + '...',
    encryptUrls: CONFIG.encryptUrls
  });
  
  // 暴露配置接口（供运行时修改）
  global.CryptoInterceptor = {
    config: CONFIG,
    encrypt: (data) => CryptoUtil.encrypt(data),
    decrypt: (data) => CryptoUtil.decrypt(data),
    addEncryptUrl: (url) => CONFIG.encryptUrls.push(url),
    removeEncryptUrl: (url) => {
      const index = CONFIG.encryptUrls.indexOf(url);
      if (index > -1) CONFIG.encryptUrls.splice(index, 1);
    }
  };
  
})(window);

