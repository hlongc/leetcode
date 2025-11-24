# 问题4：execScripts 函数的执行机制是什么？它如何保证脚本的执行顺序和作用域隔离？

## 📌 函数签名

```javascript
// src/index.js: 215
export function execScripts(entry, scripts, proxy = window, opts = {})
```

**参数说明：**
- `entry`: 入口脚本的标识（URL 或最后一个脚本）
- `scripts`: 脚本列表（从 processTpl 提取的）
- `proxy`: 代理对象（用于作用域隔离）
- `opts`: 配置选项

**返回值：**
- Promise，resolve 时返回入口脚本导出的对象

## 🎯 核心职责

execScripts 函数负责三大核心任务：

1. **加载脚本内容**（外链脚本需要下载）
2. **保证执行顺序**（按 HTML 中的顺序串行执行）
3. **作用域隔离**（通过 proxy 实现沙箱）

## 🔄 1. 执行顺序保证机制

### 问题场景

假设有如下 HTML：

```html
<script src="./vendor.js"></script>      <!-- 提供 jQuery -->
<script src="./plugin.js"></script>      <!-- 依赖 jQuery -->
<script>
  // 使用 jQuery 和 plugin
  $('#app').plugin();
</script>
<script src="./main.js" entry></script>  <!-- 应用入口 -->
```

**如果不保证顺序会发生什么？**
- plugin.js 可能在 vendor.js 之前执行 → jQuery is not defined
- 内联脚本可能在 plugin.js 之前执行 → plugin is not defined
- 应用逻辑错乱，依赖关系破坏

### 解决方案：递归调度器（Schedule）

```javascript
// src/index.js: 286-301
function schedule(i, resolvePromise) {
    if (i < scriptsText.length) {
        const script = scriptsText[i];
        const scriptSrc = script.src;
        const inlineScript = script.value;

        // 执行当前脚本
        exec(scriptSrc, inlineScript, resolvePromise);
        
        // 判断是否继续
        if (!entry && i === scriptsText.length - 1) {
            // 没有 entry 且是最后一个脚本，完成
            resolvePromise();
        } else {
            // 递归执行下一个脚本
            schedule(i + 1, resolvePromise);
        }
    }
}

// 启动调度
return new Promise(resolve => schedule(0, success || resolve));
```

**关键设计：**

1. **递归调用**：`schedule(i)` → `exec()` → `schedule(i+1)`
2. **同步执行**：每个脚本执行完才进入下一个
3. **索引递增**：确保按数组顺序执行

**执行流程示例：**

```javascript
// scripts = ['vendor.js', 'plugin.js', '<script>...</script>', 'main.js']

schedule(0)  // 执行 vendor.js
  → exec('vendor.js')
  → schedule(1)  // 执行 plugin.js
    → exec('plugin.js')
    → schedule(2)  // 执行内联脚本
      → exec('<script>...</script>')
      → schedule(3)  // 执行 main.js (entry)
        → exec('main.js')
        → resolvePromise(exports)  // 返回 entry 的导出
```

### 为什么不用 Promise.all 或 forEach？

```javascript
// ❌ 错误做法1：Promise.all（并行执行）
Promise.all(scripts.map(script => executeScript(script)))

// 问题：所有脚本并行执行，无法保证顺序
// vendor.js 和 plugin.js 可能同时执行，导致依赖错误

// ❌ 错误做法2：forEach（同步遍历但异步执行）
scripts.forEach(script => {
    fetch(script).then(code => eval(code));
});

// 问题：fetch 是异步的，forEach 不会等待
// 所有 fetch 同时发起，代码执行顺序不可控

// ✅ 正确做法：递归调度（串行执行）
function schedule(i) {
    if (i < scripts.length) {
        executeScript(scripts[i]).then(() => schedule(i + 1));
    }
}
```

### async 脚本的特殊处理

```javascript
// src/index.js: 270-276
else {
    // external script marked with async
    inlineScript.async && inlineScript?.content
        .then(downloadedScriptText => geval(inlineScript.src, downloadedScriptText))
        .catch(e => {
            throwNonBlockingError(e, `...`);
        });
}
```

**async 脚本不阻塞主流程：**

```javascript
// scripts = ['vendor.js', {async: true, src: 'analytics.js'}, 'main.js']

schedule(0)
  → exec('vendor.js') ✓ 执行并等待
  → schedule(1)
    → exec(analytics.js) → 触发异步下载，不等待 ⚡
    → schedule(2) → 立即继续
      → exec('main.js') ✓ 执行并等待
      → resolvePromise()
        
// analytics.js 在后台下载完成后异步执行
```

**为什么这样设计？**
- 分析、监控类脚本不影响主流程
- 提升首屏加载性能
- 符合 HTML `<script async>` 的语义

## 🔒 2. 作用域隔离机制

### 问题场景

假设主应用和子应用都使用全局变量：

```javascript
// 主应用
window.user = { id: 1, name: 'Admin' };
window.apiBase = 'https://main.com/api';

// 子应用（希望独立运行）
window.user = { id: 2, name: 'User' };  // ⚠️ 覆盖了主应用的 user
window.apiBase = 'https://sub.com/api';  // ⚠️ 覆盖了主应用的 apiBase

// 卸载子应用后，主应用的全局变量被污染！
```

### 解决方案：Proxy 代理对象

```javascript
// src/index.js: 57-77
function getExecutableScript(scriptSrc, scriptText, opts = {}) {
    const { proxy, strictGlobal, scopedGlobalVariables = [] } = opts;

    const sourceUrl = isInlineCode(scriptSrc) ? '' : `//# sourceURL=${scriptSrc}\n`;

    // 将 scopedGlobalVariables 拼接成变量声明
    const scopedGlobalVariableDefinition = 
        scopedGlobalVariables.length 
            ? `const {${scopedGlobalVariables.join(',')}}=this;` 
            : '';

    // 获取全局 window 对象
    const globalWindow = (0, eval)('window');
    globalWindow.proxy = proxy;

    // 根据 strictGlobal 选择不同的包装方式
    return strictGlobal
        ? (
            scopedGlobalVariableDefinition
                ? `;(function(){with(this){${scopedGlobalVariableDefinition}${scriptText}\n${sourceUrl}}}).bind(window.proxy)();`
                : `;(function(window, self, globalThis){with(window){;${scriptText}\n${sourceUrl}}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);`
        )
        : `;(function(window, self, globalThis){;${scriptText}\n${sourceUrl}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);`;
}
```

### 隔离原理详解

#### 方式1：参数覆盖（默认模式，strictGlobal = false）

```javascript
;(function(window, self, globalThis){
    ;scriptText
    //# sourceURL=http://xxx.js
}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);
```

**工作原理：**

```javascript
// 子应用代码
window.user = { id: 2 };

// 包装后
(function(window, self, globalThis){
    window.user = { id: 2 };  // 这里的 window 是参数，指向 proxy
}).bind(proxy)(proxy, proxy, proxy);

// 等价于
function execute(window, self, globalThis) {
    window.user = { id: 2 };  // proxy.user = { id: 2 }
}
execute.call(proxy, proxy, proxy, proxy);
```

**关键点：**
1. `window`、`self`、`globalThis` 作为**函数参数**
2. 参数优先级高于全局变量，覆盖了真实的 window
3. `bind(proxy)` 将 `this` 绑定为 proxy
4. 所有全局访问都指向 proxy，而非真实 window

**示例对比：**

```javascript
// 没有隔离
(function() {
    window.user = { id: 2 };  // 直接污染全局 window
    console.log(window === Window);  // true
})();

// 有隔离
(function(window) {
    window.user = { id: 2 };  // 写入 proxy.user
    console.log(window === Window);  // false，window 是 proxy
}).call(proxy, proxy);
```

#### 方式2：with 作用域（严格模式，strictGlobal = true）

```javascript
;(function(window, self, globalThis){
    with(window){
        ;scriptText
        //# sourceURL=http://xxx.js
    }
}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);
```

**with 的作用：**

```javascript
// 子应用代码
var user = { id: 2 };
console.log(user);

// 使用 with 包装
with(proxy) {
    var user = { id: 2 };  // 在 proxy 上创建 user 属性
    console.log(user);     // 从 proxy 上读取 user
}

// 等价于
proxy.user = { id: 2 };
console.log(proxy.user);
```

**为什么需要 with？**

```javascript
// 没有 with 的问题
(function(window) {
    var user = { id: 2 };  // var 会在函数作用域创建，不在 proxy 上
})(proxy);

// 使用 with 解决
(function(window) {
    with(window) {
        var user = { id: 2 };  // var 会尝试在 with 作用域（proxy）创建
    }
})(proxy);
```

#### 方式3：scopedGlobalVariables 优化

```javascript
// opts.scopedGlobalVariables = ['location', 'document', 'navigator']

// 生成的代码
;(function(){
    with(this){
        const {location, document, navigator} = this;  // 缓存常用全局变量
        ;scriptText
    }
}).bind(window.proxy)();
```

**为什么需要这个优化？**

```javascript
// 问题：频繁访问 proxy 有性能开销
function myApp() {
    console.log(location.href);      // 触发 proxy.get('location')
    console.log(document.title);     // 触发 proxy.get('document')
    console.log(navigator.userAgent); // 触发 proxy.get('navigator')
    // 每次访问都要走一遍 Proxy trap
}

// 优化：提前缓存
function myApp() {
    const {location, document, navigator} = proxy;  // 只触发 3 次 proxy.get
    console.log(location.href);       // 直接访问缓存的对象
    console.log(document.title);      // 直接访问缓存的对象
    console.log(navigator.userAgent); // 直接访问缓存的对象
}
```

### proxy 对象的来源

proxy 通常由 qiankun 的沙箱提供：

```javascript
// qiankun 调用 import-html-entry
const { template, execScripts } = await importEntry(entry);

// 创建沙箱
const sandbox = new ProxySandbox();

// 执行脚本，传入沙箱的 proxy
const exports = await execScripts(sandbox.proxy, true, {
    scopedGlobalVariables: ['location', 'document']
});
```

## 📊 3. 完整执行流程

```javascript
// src/index.js: 215-308
export function execScripts(entry, scripts, proxy = window, opts = {}) {
    const {
        fetch = defaultFetch,
        strictGlobal = false,
        success,
        error = () => {},
        beforeExec = () => {},
        afterExec = () => {},
        scopedGlobalVariables = [],
    } = opts;

    // 步骤1: 加载脚本内容
    return getExternalScripts(scripts, fetch, entry)
        .then(scriptsText => {
            // scriptsText = [{ src: 'vendor.js', value: 'code...' }, ...]

            // 步骤2: 定义执行函数
            const geval = (scriptSrc, inlineScript) => {
                // 2.1 执行前钩子
                const rawCode = beforeExec(inlineScript, scriptSrc) || inlineScript;
                
                // 2.2 包装代码（添加作用域隔离）
                const code = getExecutableScript(scriptSrc, rawCode, {
                    proxy,
                    strictGlobal,
                    scopedGlobalVariables
                });

                // 2.3 执行代码
                evalCode(scriptSrc, code);

                // 2.4 执行后钩子
                afterExec(inlineScript, scriptSrc);
            };

            // 步骤3: 定义单个脚本执行逻辑
            function exec(scriptSrc, inlineScript, resolve) {
                // 性能监控
                const markName = `Evaluating script ${scriptSrc}`;
                if (process.env.NODE_ENV === 'development' && supportsUserTiming) {
                    performance.mark(markName);
                }

                // 3.1 entry 脚本特殊处理
                if (scriptSrc === entry) {
                    // 记录执行前的全局属性
                    noteGlobalProps(strictGlobal ? proxy : window);

                    try {
                        geval(scriptSrc, inlineScript);
                        
                        // 获取 entry 脚本导出的对象
                        const exports = proxy[getGlobalProp(strictGlobal ? proxy : window)] || {};
                        resolve(exports);
                    } catch (e) {
                        // entry 错误必须抛出
                        console.error(`[import-html-entry]: error occurs while executing entry script ${scriptSrc}`);
                        throw e;
                    }
                } 
                // 3.2 普通脚本
                else {
                    if (typeof inlineScript === 'string') {
                        try {
                            if (scriptSrc?.src) {
                                geval(scriptSrc.src, inlineScript);
                            } else {
                                geval(scriptSrc, inlineScript);
                            }
                        } catch (e) {
                            // 普通脚本错误不阻塞
                            throwNonBlockingError(e, `...`);
                        }
                    } else {
                        // async 脚本
                        inlineScript.async && inlineScript?.content
                            .then(downloadedScriptText => geval(inlineScript.src, downloadedScriptText))
                            .catch(e => {
                                throwNonBlockingError(e, `...`);
                            });
                    }
                }

                // 性能监控
                if (process.env.NODE_ENV === 'development' && supportsUserTiming) {
                    performance.measure(measureName, markName);
                    performance.clearMarks(markName);
                    performance.clearMeasures(measureName);
                }
            }

            // 步骤4: 递归调度器（保证顺序）
            function schedule(i, resolvePromise) {
                if (i < scriptsText.length) {
                    const script = scriptsText[i];
                    const scriptSrc = script.src;
                    const inlineScript = script.value;

                    exec(scriptSrc, inlineScript, resolvePromise);
                    
                    if (!entry && i === scriptsText.length - 1) {
                        resolvePromise();
                    } else {
                        schedule(i + 1, resolvePromise);
                    }
                }
            }

            // 步骤5: 启动执行
            return new Promise(resolve => schedule(0, success || resolve));
        })
        .catch((e) => {
            error();
            throw e;
        });
}
```

## 🎨 4. 获取 entry 导出对象

### 原理：检测新增的全局属性

```javascript
// src/utils.js: 32-58, 60-76
export function getGlobalProp(global) {
    let cnt = 0;
    let lastProp;
    let hasIframe = false;

    for (let p in global) {
        if (shouldSkipProperty(global, p))
            continue;

        // 检查是否是 iframe
        for (let i = 0; i < window.frames.length && !hasIframe; i++) {
            const frame = window.frames[i];
            if (frame === global[p]) {
                hasIframe = true;
                break;
            }
        }

        if (!hasIframe && (cnt === 0 && p !== firstGlobalProp || cnt === 1 && p !== secondGlobalProp))
            return p;
        cnt++;
        lastProp = p;
    }

    if (lastProp !== lastGlobalProp)
        return lastProp;
}

export function noteGlobalProps(global) {
    // 记录执行前的全局属性
    firstGlobalProp = secondGlobalProp = undefined;

    for (let p in global) {
        if (shouldSkipProperty(global, p))
            continue;
        if (!firstGlobalProp)
            firstGlobalProp = p;
        else if (!secondGlobalProp)
            secondGlobalProp = p;
        lastGlobalProp = p;
    }

    return lastGlobalProp;
}
```

**工作流程：**

```javascript
// 执行 entry 脚本前
noteGlobalProps(proxy);
// 记录：firstGlobalProp = 'foo', secondGlobalProp = 'bar', lastGlobalProp = 'baz'

// 执行 entry 脚本
eval(`
    window.__POWERED_BY_QIANKUN__ = true;
    window.microApp = {
        mount() {},
        unmount() {}
    };
`);

// 执行后，proxy 上新增了 '__POWERED_BY_QIANKUN__' 和 'microApp'
getGlobalProp(proxy);  // 返回 'microApp'（最后新增的属性）

const exports = proxy['microApp'];  // { mount, unmount }
```

**为什么这样设计？**
- 无需约定特定的导出变量名
- 自动检测脚本新增的全局对象
- 兼容各种导出方式

**常见导出方式：**

```javascript
// 方式1: 挂载到 window
window.myMicroApp = { mount, unmount };

// 方式2: 全局变量声明
var myMicroApp = { mount, unmount };

// 方式3: 条件导出
if (window.__POWERED_BY_QIANKUN__) {
    window.qiankunLifecycle = { mount, unmount };
}
```

## 🎓 面试要点

### 执行顺序保证

1. **递归调度器**：通过 `schedule(i)` 递归实现串行执行
2. **同步阻塞**：每个脚本执行完才执行下一个
3. **async 特例**：async 脚本异步执行，不阻塞主流程
4. **错误隔离**：普通脚本错误不影响后续脚本

### 作用域隔离

1. **参数覆盖**：通过函数参数覆盖全局 window
2. **this 绑定**：通过 bind 将 this 绑定为 proxy
3. **with 增强**：strictGlobal 模式使用 with 强化隔离
4. **性能优化**：scopedGlobalVariables 缓存常用全局变量

### entry 导出

1. **属性检测**：比较执行前后的全局属性
2. **自动识别**：无需约定导出变量名
3. **灵活导出**：支持多种导出方式

## 💡 为什么这样设计？

### 1. 为什么用递归而不是循环？

```javascript
// ❌ 循环无法处理异步
for (let i = 0; i < scripts.length; i++) {
    await executeScript(scripts[i]);  // await 在普通函数中不可用
}

// ✅ 递归天然支持异步串行
function schedule(i) {
    if (i < scripts.length) {
        executeScript(scripts[i]).then(() => schedule(i + 1));
    }
}
```

### 2. 为什么不用 async/await？

```javascript
// 可以用 async/await 实现
async function execScripts(scripts) {
    for (let script of scripts) {
        await executeScript(script);
    }
}

// 但 import-html-entry 需要兼容老版本浏览器
// 使用 Promise + 递归更通用
```

### 3. 为什么需要 beforeExec/afterExec 钩子？

```javascript
// 使用场景：代码转换
beforeExec: (code, url) => {
    // 转换 ES6+ 代码为 ES5
    return babel.transform(code).code;
}

// 使用场景：性能监控
afterExec: (code, url) => {
    console.log(`${url} executed in ${Date.now() - start}ms`);
}

// 使用场景：注入全局变量
beforeExec: (code, url) => {
    return `window.__PUBLIC_PATH__ = "${publicPath}";\n${code}`;
}
```

这些设计让 execScripts 既保证了正确性（顺序、隔离），又提供了足够的灵活性（钩子、配置）。

