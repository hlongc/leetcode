# 问题8：fetch 参数的自定义功能有什么作用？在实际项目中如何利用它解决跨域或权限验证问题？

## 📌 fetch 参数的位置

import-html-entry 在多个地方支持自定义 fetch：

```javascript
// src/index.js: 310-334
export default function importHTML(url, opts = {}) {
    let fetch = defaultFetch;  // 默认使用 window.fetch
    // ...
    if (opts.fetch) {
        if (typeof opts.fetch === 'function') {
            fetch = opts.fetch;  // ⭐ 使用自定义 fetch
        } else {
            fetch = opts.fetch.fn || defaultFetch;
            autoDecodeResponse = !!opts.fetch.autoDecodeResponse;
        }
    }
    // ...
}

// src/index.js: 361-377
export function importEntry(entry, opts = {}) {
    const { fetch = defaultFetch, ... } = opts;  // ⭐ 支持自定义 fetch
    
    if (typeof entry === 'string') {
        return importHTML(entry, {
            fetch,  // 传递给 importHTML
            getPublicPath,
            getTemplate,
            postProcessTemplate,
        });
    }
    // ...
}
```

## 🎯 自定义 fetch 的核心作用

### 1. **拦截所有资源请求**

import-html-entry 加载的所有资源都会通过 fetch 函数：

```javascript
// 使用自定义 fetch 的资源类型
1. HTML 入口文件
2. 外链 JavaScript 文件  
3. 外链 CSS 文件
4. 动态加载的其他资源
```

### 2. **统一处理网络请求**

```javascript
// 自定义 fetch 的标准格式
function customFetch(url, opts) {
    // 1. 请求前处理（添加 headers、修改 URL 等）
    // 2. 发起请求
    // 3. 响应后处理（转换数据、错误处理等）
    return window.fetch(url, opts);
}

// 使用
importEntry(entry, {
    fetch: customFetch
});
```

## 💼 实际应用场景

### 场景1: 解决跨域问题（CORS）

#### 问题描述

```javascript
// 主应用：https://main.com
// 子应用：https://sub.com

// 直接加载会遇到 CORS 错误
await importHTML('https://sub.com/index.html');
// ❌ Access to fetch at 'https://sub.com/index.html' from origin 'https://main.com' 
//    has been blocked by CORS policy
```

#### 解决方案1: 通过代理服务器

```javascript
// 主应用部署了一个代理接口：/api/proxy
// 代理服务器会添加 CORS 头
function fetchWithProxy(url, opts) {
    // 将请求转发到代理服务器
    const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
    return window.fetch(proxyUrl, opts);
}

await importHTML('https://sub.com/index.html', {
    fetch: fetchWithProxy
});

// 请求流程：
// 1. 浏览器请求 https://main.com/api/proxy?target=https://sub.com/index.html
// 2. 代理服务器请求 https://sub.com/index.html
// 3. 代理服务器添加 CORS 头返回给浏览器
// 4. 不存在跨域问题 ✓
```

#### 解决方案2: 添加凭证

```javascript
// 如果子应用服务器支持 CORS 但需要凭证
function fetchWithCredentials(url, opts = {}) {
    return window.fetch(url, {
        ...opts,
        credentials: 'include',  // 携带 cookies
        mode: 'cors'
    });
}

await importHTML('https://sub.com/index.html', {
    fetch: fetchWithCredentials
});
```

### 场景2: 权限验证（Token）

#### 问题描述

```javascript
// 子应用的资源需要身份验证
// 服务器检查 Authorization header
// 没有 token 会返回 401 Unauthorized
```

#### 解决方案: 注入 Token

```javascript
// 从 localStorage 或其他地方获取 token
function fetchWithAuth(url, opts = {}) {
    const token = localStorage.getItem('authToken');
    
    return window.fetch(url, {
        ...opts,
        headers: {
            ...opts.headers,
            'Authorization': `Bearer ${token}`,  // 添加 token
            'X-Custom-Header': 'custom-value'    // 其他自定义 header
        }
    });
}

await importHTML('https://api.com/micro-app/index.html', {
    fetch: fetchWithAuth
});

// 所有资源请求都会携带 token：
// GET /micro-app/index.html
//   Authorization: Bearer eyJhbGc...
// GET /micro-app/main.js
//   Authorization: Bearer eyJhbGc...
// GET /micro-app/main.css
//   Authorization: Bearer eyJhbGc...
```

#### 高级场景: Token 过期自动刷新

```javascript
function fetchWithTokenRefresh(url, opts = {}) {
    const getToken = () => localStorage.getItem('authToken');
    
    const fetchWithToken = (token) => {
        return window.fetch(url, {
            ...opts,
            headers: {
                ...opts.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    };
    
    return fetchWithToken(getToken())
        .then(response => {
            // 检查是否 token 过期
            if (response.status === 401) {
                // 刷新 token
                return refreshToken().then(newToken => {
                    localStorage.setItem('authToken', newToken);
                    // 重试请求
                    return fetchWithToken(newToken);
                });
            }
            return response;
        });
}

// 使用
await importHTML(entry, {
    fetch: fetchWithTokenRefresh
});
```

### 场景3: 请求重试机制

#### 问题描述

```javascript
// 网络不稳定时，偶尔会加载失败
// 希望自动重试，提高成功率
```

#### 解决方案

```javascript
function fetchWithRetry(url, opts = {}, retries = 3) {
    return window.fetch(url, opts)
        .then(response => {
            // 检查响应状态
            if (response.ok) {
                return response;
            }
            // 服务器错误，可重试
            if (response.status >= 500 && retries > 0) {
                console.log(`请求失败，剩余重试次数：${retries}`);
                // 延迟后重试
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(fetchWithRetry(url, opts, retries - 1));
                    }, 1000);
                });
            }
            // 客户端错误（4xx），不重试
            return response;
        })
        .catch(error => {
            // 网络错误，重试
            if (retries > 0) {
                console.log(`网络错误，剩余重试次数：${retries}`, error);
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(fetchWithRetry(url, opts, retries - 1));
                    }, 1000);
                });
            }
            throw error;
        });
}

await importHTML(entry, {
    fetch: fetchWithRetry
});

// 效果：
// 第一次请求失败 → 等待1秒 → 重试
// 第二次请求失败 → 等待1秒 → 重试
// 第三次请求失败 → 等待1秒 → 重试
// 第四次请求失败 → 抛出错误
```

### 场景4: 请求日志和监控

#### 记录所有资源加载情况

```javascript
function fetchWithLogging(url, opts = {}) {
    const startTime = Date.now();
    
    console.log(`[Fetch] 开始加载：${url}`);
    
    return window.fetch(url, opts)
        .then(response => {
            const duration = Date.now() - startTime;
            console.log(`[Fetch] 加载完成：${url}`, {
                status: response.status,
                duration: `${duration}ms`,
                size: response.headers.get('content-length')
            });
            
            // 发送到监控系统
            sendMetrics({
                url,
                status: response.status,
                duration,
                timestamp: Date.now()
            });
            
            return response;
        })
        .catch(error => {
            const duration = Date.now() - startTime;
            console.error(`[Fetch] 加载失败：${url}`, {
                error: error.message,
                duration: `${duration}ms`
            });
            
            // 发送错误到监控系统
            sendError({
                url,
                error: error.message,
                duration,
                timestamp: Date.now()
            });
            
            throw error;
        });
}

await importHTML(entry, {
    fetch: fetchWithLogging
});

// 输出示例：
// [Fetch] 开始加载：http://localhost:8080/index.html
// [Fetch] 加载完成：http://localhost:8080/index.html { status: 200, duration: '50ms', size: '1024' }
// [Fetch] 开始加载：http://localhost:8080/main.js
// [Fetch] 加载完成：http://localhost:8080/main.js { status: 200, duration: '30ms', size: '50000' }
```

### 场景5: 缓存控制

#### 强制使用最新资源

```javascript
function fetchWithNoCache(url, opts = {}) {
    return window.fetch(url, {
        ...opts,
        cache: 'no-cache',  // 不使用浏览器缓存
        headers: {
            ...opts.headers,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
}

// 开发环境使用
if (process.env.NODE_ENV === 'development') {
    await importHTML(entry, {
        fetch: fetchWithNoCache
    });
}
```

### 场景6: 请求转换和适配

#### URL 转换

```javascript
// 场景：测试环境和生产环境 URL 不同
function fetchWithUrlTransform(url, opts = {}) {
    let transformedUrl = url;
    
    // 开发环境：使用本地服务器
    if (process.env.NODE_ENV === 'development') {
        transformedUrl = url.replace('https://cdn.com', 'http://localhost:8080');
    }
    
    // 测试环境：使用测试 CDN
    if (process.env.NODE_ENV === 'testing') {
        transformedUrl = url.replace('https://cdn.com', 'https://test-cdn.com');
    }
    
    console.log(`URL 转换：${url} → ${transformedUrl}`);
    return window.fetch(transformedUrl, opts);
}
```

#### 响应转换

```javascript
// 场景：服务器返回加密内容，需要解密
function fetchWithDecryption(url, opts = {}) {
    return window.fetch(url, opts)
        .then(response => {
            // 克隆 response（response.text() 只能调用一次）
            const clonedResponse = response.clone();
            
            return clonedResponse.text().then(encryptedText => {
                // 解密内容
                const decryptedText = decrypt(encryptedText);
                
                // 创建新的 Response 对象
                return new Response(decryptedText, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            });
        });
}
```

### 场景7: 模拟数据（Mock）

#### 开发时使用模拟数据

```javascript
const mockData = {
    'http://localhost:8080/index.html': `
        <!DOCTYPE html>
        <html>
        <head><title>Mock App</title></head>
        <body><div id="app">Mock Content</div></body>
        </html>
    `,
    'http://localhost:8080/main.js': `
        window.microApp = {
            bootstrap() {},
            mount() {},
            unmount() {}
        };
    `
};

function fetchWithMock(url, opts = {}) {
    // 检查是否有 mock 数据
    if (mockData[url]) {
        console.log(`[Mock] 使用模拟数据：${url}`);
        return Promise.resolve(new Response(mockData[url], {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html' }
        }));
    }
    
    // 没有 mock 数据，使用真实请求
    return window.fetch(url, opts);
}

await importHTML(entry, {
    fetch: fetchWithMock
});
```

## 🔧 qiankun 中的实际使用

### qiankun 的 fetch 增强

```javascript
// qiankun/packages/qiankun/src/core/loadApp.ts: 53
const enhancedFetch = makeFetchCacheable(
    makeFetchRetryable(
        makeFetchThrowable(fetch)
    )
);
```

**三层增强：**

1. **makeFetchThrowable**: 将 HTTP 错误转为异常
2. **makeFetchRetryable**: 添加重试机制
3. **makeFetchCacheable**: 添加缓存

### 在 qiankun 中自定义 fetch

```javascript
import { loadMicroApp } from 'qiankun';

// 方式1: 全局配置
import { start } from 'qiankun';

start({
    fetch: customFetch  // 所有微应用使用
});

// 方式2: 单个应用配置
loadMicroApp(
    { entry: 'http://localhost:8080/index.html' },
    { 
        fetch: customFetch  // 只对这个应用生效
    }
);
```

## 📊 完整的企业级 fetch 实现

```javascript
/**
 * 企业级 fetch 封装
 * 功能：认证、重试、日志、监控、错误处理
 */
function createEnterpriseFetch(config = {}) {
    const {
        getToken = () => localStorage.getItem('token'),
        retries = 3,
        retryDelay = 1000,
        enableLogging = true,
        enableMetrics = true,
        proxyUrl = null
    } = config;
    
    return function enterpriseFetch(url, opts = {}) {
        const startTime = Date.now();
        let attemptCount = 0;
        
        // 日志
        const log = (message, data) => {
            if (enableLogging) {
                console.log(`[EnterpriseFetch] ${message}`, data);
            }
        };
        
        // 发送指标
        const sendMetrics = (metrics) => {
            if (enableMetrics) {
                // 发送到监控系统
                window.analytics?.track('resource_load', metrics);
            }
        };
        
        // 实际的 fetch 逻辑
        const doFetch = () => {
            attemptCount++;
            
            // 构建最终的 URL
            let finalUrl = url;
            if (proxyUrl) {
                finalUrl = `${proxyUrl}?target=${encodeURIComponent(url)}`;
            }
            
            // 构建 headers
            const token = getToken();
            const headers = {
                ...opts.headers,
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            log(`开始请求 (尝试 ${attemptCount}/${retries + 1})`, { url: finalUrl });
            
            return window.fetch(finalUrl, {
                ...opts,
                headers,
                credentials: 'include'
            }).then(response => {
                const duration = Date.now() - startTime;
                
                // Token 过期
                if (response.status === 401) {
                    log('Token 过期，需要重新登录', { url });
                    // 触发重新登录
                    window.dispatchEvent(new CustomEvent('token-expired'));
                    throw new Error('Token expired');
                }
                
                // 服务器错误，可重试
                if (response.status >= 500 && attemptCount <= retries) {
                    log(`服务器错误，准备重试`, { 
                        status: response.status, 
                        attempt: attemptCount 
                    });
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(doFetch());
                        }, retryDelay);
                    });
                }
                
                // 成功
                if (response.ok) {
                    log('请求成功', { 
                        url, 
                        status: response.status, 
                        duration: `${duration}ms` 
                    });
                    
                    sendMetrics({
                        url,
                        status: response.status,
                        duration,
                        success: true,
                        attempts: attemptCount
                    });
                }
                
                return response;
            }).catch(error => {
                const duration = Date.now() - startTime;
                
                // 网络错误，可重试
                if (attemptCount <= retries) {
                    log(`网络错误，准备重试`, { 
                        error: error.message, 
                        attempt: attemptCount 
                    });
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(doFetch());
                        }, retryDelay);
                    });
                }
                
                // 达到最大重试次数
                log('请求失败，已达最大重试次数', { 
                    url, 
                    error: error.message, 
                    attempts: attemptCount 
                });
                
                sendMetrics({
                    url,
                    error: error.message,
                    duration,
                    success: false,
                    attempts: attemptCount
                });
                
                throw error;
            });
        };
        
        return doFetch();
    };
}

// 使用
const customFetch = createEnterpriseFetch({
    getToken: () => localStorage.getItem('authToken'),
    retries: 3,
    retryDelay: 1000,
    enableLogging: process.env.NODE_ENV === 'development',
    enableMetrics: true,
    proxyUrl: process.env.PROXY_URL
});

await importHTML(entry, {
    fetch: customFetch
});
```

## 🎓 面试要点

### 核心作用

1. **统一拦截**：拦截所有资源请求（HTML/JS/CSS）
2. **请求增强**：添加认证、重试、日志等功能
3. **灵活适配**：解决跨域、权限、环境差异等问题

### 常见场景

1. **跨域**：代理转发、添加凭证
2. **认证**：注入 Token、处理过期
3. **容错**：自动重试、错误处理
4. **监控**：请求日志、性能指标
5. **开发**：Mock 数据、禁用缓存

### 设计优势

1. **非侵入**：不修改 import-html-entry 源码
2. **统一管理**：一处配置，全局生效
3. **职责分离**：fetch 处理网络，import-html-entry 处理解析
4. **灵活扩展**：可以叠加多个增强功能

## 💡 为什么需要自定义 fetch？

### 问题场景

```javascript
// 没有自定义 fetch 的困境

// 问题1: 子应用需要认证
// ❌ 无法在请求中添加 token
await importHTML('https://api.com/app/index.html');
// 401 Unauthorized

// 问题2: 跨域
// ❌ 无法处理 CORS
await importHTML('https://other-domain.com/app/index.html');
// CORS error

// 问题3: 网络不稳定
// ❌ 一次失败就放弃
// Error: Failed to fetch

// 有了自定义 fetch
// ✓ 可以添加 token
// ✓ 可以通过代理
// ✓ 可以自动重试
// ✓ 可以记录日志
// ✓ 可以监控性能
```

自定义 fetch 是 import-html-entry 留给使用者的**扩展点**，让它能够适应各种复杂的企业级场景！

