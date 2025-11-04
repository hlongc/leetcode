/**
 * ============================================
 * Crypto Interceptor - 安全版本
 * 使用 Web Crypto API 进行真实的 AES-GCM 加密
 * ============================================
 * 
 * 使用方式：
 * <script src="crypto-interceptor-secure.js" 
 *          data-key="your-secret-key-2024" 
 *          data-urls="/api/,/user/"
 *          data-debug="true"></script>
 */

(function(global) {
  'use strict';
  
  // ============================================
  // 配置
  // ============================================
  const currentScript = document.currentScript;
  const CONFIG = {
    secretKey: currentScript?.getAttribute('data-key') || 'default-secret-key-2024',
    encryptUrls: (currentScript?.getAttribute('data-urls') || '/api/').split(',').map(u => u.trim()),
    debug: currentScript?.getAttribute('data-debug') === 'true'
  };
  
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[🔐 Crypto]', ...args);
    }
  }
  
  // ============================================
  // 加密工具类 - 使用 Web Crypto API
  // ============================================
  class SecureCrypto {
    static _cachedKey = null;
    
    /**
     * 派生加密密钥（从字符串密钥）
     */
    static async deriveKey() {
      if (this._cachedKey) {
        return this._cachedKey;
      }
      
      const encoder = new TextEncoder();
      
      // 导入密钥材料
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(CONFIG.secretKey),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      // 派生实际的加密密钥
      this._cachedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('crypto-interceptor-salt-2024'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      return this._cachedKey;
    }
    
    /**
     * 加密数据（AES-GCM）
     */
    static async encrypt(data) {
      try {
        const encoder = new TextEncoder();
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        const dataBuffer = encoder.encode(str);
        
        // 生成随机 IV（初始化向量）
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // 获取密钥
        const key = await this.deriveKey();
        
        // 加密
        const encryptedBuffer = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          dataBuffer
        );
        
        // 组合 IV + 加密数据
        const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encryptedBuffer), iv.length);
        
        // 转为 Base64
        return this.arrayBufferToBase64(result.buffer);
      } catch (error) {
        console.error('加密失败:', error);
        throw error;
      }
    }
    
    /**
     * 解密数据
     */
    static async decrypt(encryptedData) {
      try {
        if (!encryptedData) return null;
        
        // Base64 解码
        const buffer = this.base64ToArrayBuffer(encryptedData);
        const dataView = new Uint8Array(buffer);
        
        // 提取 IV 和加密数据
        const iv = dataView.slice(0, 12);
        const data = dataView.slice(12);
        
        // 获取密钥
        const key = await this.deriveKey();
        
        // 解密
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          data
        );
        
        // 转为字符串
        const decoder = new TextDecoder();
        const decryptedStr = decoder.decode(decryptedBuffer);
        
        // 尝试解析 JSON
        try {
          return JSON.parse(decryptedStr);
        } catch {
          return decryptedStr;
        }
      } catch (error) {
        console.error('解密失败:', error);
        throw error;
      }
    }
    
    // Base64 编码/解码
    static arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    
    static base64ToArrayBuffer(base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }
  }
  
  // ============================================
  // 判断是否需要加密
  // ============================================
  function shouldEncrypt(url) {
    const urlStr = typeof url === 'string' ? url : 
                   url instanceof URL ? url.href : 
                   url?.url || '';
    
    return CONFIG.encryptUrls.some(pattern => urlStr.includes(pattern));
  }
  
  // ============================================
  // Fetch API 拦截
  // ============================================
  const originalFetch = global.fetch;
  
  global.fetch = async function(...args) {
    let [resource, options = {}] = args;
    
    const url = typeof resource === 'string' ? resource : resource.url;
    
    // 加密请求体
    if (options.body && shouldEncrypt(url)) {
      log('📤 加密 Fetch 请求:', url);
      
      try {
        const encrypted = await SecureCrypto.encrypt(options.body);
        
        options = {
          ...options,
          body: JSON.stringify({ encrypted }),
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'X-Encrypted': 'aes-gcm'
          }
        };
      } catch (error) {
        console.error('请求加密失败，使用未加密数据:', error);
      }
    }
    
    // 调用原始 fetch
    const response = await originalFetch(resource, options);
    
    // 解密响应
    const encryptionType = response.headers.get('X-Encrypted');
    if (encryptionType === 'aes-gcm') {
      try {
        const cloned = response.clone();
        const encryptedText = await cloned.text();
        
        log('📥 解密 Fetch 响应');
        const decrypted = await SecureCrypto.decrypt(encryptedText);
        
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
  // XMLHttpRequest 拦截（支持同步和异步）
  // ============================================
  const OriginalXHR = global.XMLHttpRequest;
  
  global.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    const originalSetRequestHeader = xhr.setRequestHeader;
    
    let requestURL = '';
    let isAsync = true;
    let isPending = false;
    
    // 拦截 open
    xhr.open = function(method, url, async = true, ...args) {
      requestURL = url;
      isAsync = async;
      return originalOpen.apply(this, [method, url, async, ...args]);
    };
    
    // 拦截 send
    xhr.send = function(body) {
      if (body && shouldEncrypt(requestURL)) {
        log('📤 加密 XHR 请求:', requestURL);
        
        // 对于异步请求，使用 Promise
        if (isAsync) {
          isPending = true;
          
          SecureCrypto.encrypt(body)
            .then(encrypted => {
              originalSetRequestHeader.call(this, 'Content-Type', 'application/json');
              originalSetRequestHeader.call(this, 'X-Encrypted', 'aes-gcm');
              originalSend.call(this, JSON.stringify({ encrypted }));
              isPending = false;
            })
            .catch(error => {
              console.error('XHR 加密失败:', error);
              originalSend.apply(this, [body]);
              isPending = false;
            });
          
          return;
        } else {
          // 同步请求：使用简化加密（Web Crypto API 不支持同步）
          console.warn('⚠️ 同步 XHR 请求，使用简化加密');
          const encrypted = btoa(encodeURIComponent(body));
          originalSetRequestHeader.call(this, 'X-Encrypted', 'simple');
          return originalSend.call(this, JSON.stringify({ encrypted }));
        }
      }
      
      return originalSend.apply(this, arguments);
    };
    
    return xhr;
  };
  
  Object.setPrototypeOf(global.XMLHttpRequest, OriginalXHR);
  global.XMLHttpRequest.prototype = OriginalXHR.prototype;
  
  // ============================================
  // 初始化
  // ============================================
  log('✅ 安全加密拦截器已安装');
  log('加密算法: AES-256-GCM');
  log('加密 URLs:', CONFIG.encryptUrls);
  
  // 暴露接口
  global.SecureCryptoInterceptor = {
    config: CONFIG,
    encrypt: (data) => SecureCrypto.encrypt(data),
    decrypt: (data) => SecureCrypto.decrypt(data),
    shouldEncrypt: shouldEncrypt
  };
  
})(window);

