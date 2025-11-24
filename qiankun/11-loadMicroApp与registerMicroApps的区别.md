# 问题11：loadMicroApp 和 registerMicroApps 的区别是什么？各自的适用场景是什么？

## 📌 两个 API 的基本定义

### registerMicroApps（路由驱动）

```typescript
// packages/qiankun/src/apis/registerMicroApps.ts: 16
export function registerMicroApps<T extends ObjectType>(
    apps: Array<RegistrableApp<T>>, 
    lifeCycles?: LifeCycles<T>
)

// 配置结构
{
    name: string;
    entry: string;
    container: string | HTMLElement;
    activeRule: string | Function | Array;  // ⭐ 关键：需要激活规则
    loader?: Function;
    props?: Object;
}
```

### loadMicroApp（手动加载）

```typescript
// packages/qiankun/src/apis/loadMicroApp.ts: 12
export function loadMicroApp<T extends ObjectType>(
    app: LoadableApp<T>,
    configuration?: AppConfiguration,
    lifeCycles?: LifeCycles<T>,
): MicroApp

// 配置结构
{
    name: string;
    entry: string;
    container: string | HTMLElement;
    // ⭐ 关键：没有 activeRule
    props?: Object;
}
```

## 🎯 核心区别对比

| 特性 | registerMicroApps | loadMicroApp |
|------|------------------|--------------|
| **触发方式** | 路由自动触发 | 手动调用触发 |
| **activeRule** | ✅ 必需 | ❌ 不需要 |
| **依赖 start()** | ✅ 需要调用 start() | ❌ 不需要 |
| **返回值** | void | MicroApp 实例 |
| **生命周期控制** | single-spa 自动管理 | 手动管理（unmount/mount） |
| **使用场景** | 主导航、路由切换 | 组件化、弹窗、特定区域 |
| **多实例** | 同名应用单实例 | 可创建多个实例 |

## 🔍 详细源码对比

### registerMicroApps 的实现

```typescript
// packages/qiankun/src/apis/registerMicroApps.ts: 16-44
export function registerMicroApps<T extends ObjectType>(apps, lifeCycles?) {
    const unregisteredApps = apps.filter(
        (app) => !microApps.some((registeredApp) => registeredApp.name === app.name)
    );

    microApps.push(...unregisteredApps);

    unregisteredApps.forEach((app) => {
        const { name, activeRule, loader = noop, props, entry, container } = app;

        // ⭐ 关键：注册到 single-spa
        registerApplication({
            name,
            app: async () => {
                loader(true);
                await frameworkStartedDefer.promise;  // ⭐ 等待 start()

                const { mount, ...otherMicroAppConfigs } = (
                    await loadApp({ name, entry, container, props }, frameworkConfiguration, lifeCycles)
                )(container);

                return {
                    mount: [
                        async () => loader(true),
                        ...toArray(mount),
                        async () => loader(false)
                    ],
                    ...otherMicroAppConfigs,
                };
            },
            activeWhen: activeRule,  // ⭐ single-spa 根据这个规则自动激活
            customProps: props,
        });
    });
}
```

**关键点：**
1. 调用 single-spa 的 `registerApplication`
2. 传入 `activeWhen` 规则
3. 等待 `start()` 调用才开始加载

### loadMicroApp 的实现

```typescript
// packages/qiankun/src/apis/loadMicroApp.ts: 12-121
export function loadMicroApp<T extends ObjectType>(
    app: LoadableApp<T>,
    configuration?: AppConfiguration,
    lifeCycles?: LifeCycles<T>,
): MicroApp {
    const { props, name, container } = app;

    const containerXPath = getContainerXPath(container);
    const getContainerXPathKey = (xpath: string) => `${name}-${xpath}`;

    let microApp: MicroApp;
    
    // ⭐ 缓存机制：同一个容器的同名应用只加载一次
    const memorizedLoadingFn = async (): Promise<ParcelConfigObject> => {
        const userConfiguration = configuration;

        if (containerXPath) {
            const appContainerXPathKey = getContainerXPathKey(containerXPath);
            const parcelConfigGetterPromise = appConfigPromiseGetterMap.get(appContainerXPathKey);
            if (parcelConfigGetterPromise) {
                // 复用已加载的应用配置
                return wrapParcelConfigForRemount((await parcelConfigGetterPromise)(container));
            }
        }

        // 加载应用
        const parcelConfigObjectGetterPromise = loadApp(app, userConfiguration, lifeCycles);

        let parcelConfigObjectGetter: ParcelConfigObjectGetter | undefined;

        if (containerXPath) {
            const appContainerXPathKey = getContainerXPathKey(containerXPath);
            appConfigPromiseGetterMap.set(appContainerXPathKey, parcelConfigObjectGetterPromise);
            try {
                parcelConfigObjectGetter = await parcelConfigObjectGetterPromise;
            } catch (e) {
                appConfigPromiseGetterMap.delete(appContainerXPathKey);
                throw e;
            }
        }

        parcelConfigObjectGetter = parcelConfigObjectGetter || (await parcelConfigObjectGetterPromise);
        return parcelConfigObjectGetter(container);
    };

    if (!started) {
        // ⭐ 如果 start 还没调用，自动调用
        start();
    }

    // ⭐ 关键：使用 single-spa 的 mountRootParcel
    // 这是一个手动挂载的 API，不依赖路由
    microApp = mountRootParcel(memorizedLoadingFn, { 
        domElement: document.createElement('div'), 
        ...props 
    });

    // 管理多实例
    if (containerXPath) {
        const appContainerXPathKey = getContainerXPathKey(containerXPath);
        const microAppsRef = containerMicroAppsMap.get(appContainerXPathKey) || [];
        microAppsRef.push(microApp);
        containerMicroAppsMap.set(appContainerXPathKey, microAppsRef);

        const cleanup = () => {
            const index = microAppsRef.indexOf(microApp);
            microAppsRef.splice(index, 1);
            microApp = null;
        };

        microApp.unmountPromise.then(cleanup).catch(cleanup);
    }

    return microApp;  // ⭐ 返回实例，可以手动控制
}
```

**关键点：**
1. 使用 single-spa 的 `mountRootParcel`（手动挂载）
2. 不需要 `activeWhen` 规则
3. 立即加载，不等待路由
4. 返回 MicroApp 实例，可以手动控制

## 🎨 使用场景对比

### registerMicroApps 的典型场景

#### 场景1: 主导航应用切换

```javascript
// 主应用结构
// +----------------------------------+
// | [首页] [商品] [订单] [用户中心]   |  ← 主导航
// +----------------------------------+
// |                                  |
// |        微应用渲染区域              |  ← 根据路由切换
// |                                  |
// +----------------------------------+

// 配置
registerMicroApps([
    {
        name: 'home',
        entry: '//localhost:8080',
        container: '#subapp-viewport',
        activeRule: '/',
    },
    {
        name: 'product',
        entry: '//localhost:8081',
        container: '#subapp-viewport',
        activeRule: '/product',
    },
    {
        name: 'order',
        entry: '//localhost:8082',
        container: '#subapp-viewport',
        activeRule: '/order',
    },
    {
        name: 'user',
        entry: '//localhost:8083',
        container: '#subapp-viewport',
        activeRule: '/user',
    }
]);

start();

// 用户点击导航 → 路由变化 → single-spa 自动切换应用
```

#### 场景2: 子路由应用

```javascript
// URL 结构
// /admin          → 管理后台主页
// /admin/users    → 用户管理（微应用）
// /admin/settings → 系统设置（微应用）

registerMicroApps([
    {
        name: 'admin-users',
        entry: '//localhost:8081',
        container: '#admin-content',
        activeRule: '/admin/users',
    },
    {
        name: 'admin-settings',
        entry: '//localhost:8082',
        container: '#admin-content',
        activeRule: '/admin/settings',
    }
]);

start();
```

#### 场景3: 按权限显示应用

```javascript
// 根据用户权限动态注册应用
const apps = [
    {
        name: 'dashboard',
        entry: '//localhost:8080',
        container: '#container',
        activeRule: '/dashboard',
        requiredPermission: 'VIEW_DASHBOARD'
    },
    {
        name: 'admin',
        entry: '//localhost:8081',
        container: '#container',
        activeRule: '/admin',
        requiredPermission: 'ADMIN'
    }
];

// 过滤用户有权限的应用
const allowedApps = apps.filter(app => 
    userPermissions.includes(app.requiredPermission)
);

registerMicroApps(allowedApps);
start();
```

### loadMicroApp 的典型场景

#### 场景1: 弹窗/模态框中的微应用

```javascript
// 点击按钮打开弹窗，弹窗中加载微应用
function openUserProfileModal(userId) {
    // 显示弹窗
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">×</span>
            <div id="user-profile-container"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // 在弹窗中加载微应用
    const microApp = loadMicroApp({
        name: 'user-profile',
        entry: '//localhost:8080',
        container: '#user-profile-container',
        props: { userId }
    });

    // 关闭弹窗时卸载微应用
    window.closeModal = () => {
        microApp.unmount().then(() => {
            document.body.removeChild(modal);
        });
    };
}

// 使用
<button onclick="openUserProfileModal(123)">查看用户资料</button>
```

#### 场景2: Tab 页签中的微应用

```javascript
// 多个 Tab，每个 Tab 加载不同的微应用
const TabPanel = () => {
    const [activeTab, setActiveTab] = useState('tab1');
    const microAppsRef = useRef({});

    const loadTab = (tabName) => {
        // 卸载其他 Tab 的应用
        Object.entries(microAppsRef.current).forEach(([name, app]) => {
            if (name !== tabName) {
                app.unmount();
            }
        });

        // 加载当前 Tab 的应用
        if (!microAppsRef.current[tabName]) {
            microAppsRef.current[tabName] = loadMicroApp({
                name: tabName,
                entry: tabConfigs[tabName].entry,
                container: `#tab-content-${tabName}`,
            });
        } else {
            microAppsRef.current[tabName].mount();
        }

        setActiveTab(tabName);
    };

    return (
        <div>
            <div className="tabs">
                <button onClick={() => loadTab('tab1')}>Tab 1</button>
                <button onClick={() => loadTab('tab2')}>Tab 2</button>
                <button onClick={() => loadTab('tab3')}>Tab 3</button>
            </div>
            <div className="tab-content">
                <div id="tab-content-tab1" />
                <div id="tab-content-tab2" />
                <div id="tab-content-tab3" />
            </div>
        </div>
    );
};
```

#### 场景3: 动态多实例

```javascript
// 同时展示多个相同应用的实例，但传入不同的 props
function DashboardPage() {
    const [widgets, setWidgets] = useState([]);
    const microAppsRef = useRef([]);

    const addWidget = (widgetType, widgetData) => {
        const containerId = `widget-${Date.now()}`;
        
        // 创建容器
        const container = document.createElement('div');
        container.id = containerId;
        container.className = 'widget';
        document.querySelector('#dashboard').appendChild(container);

        // 加载微应用实例
        const microApp = loadMicroApp({
            name: `${widgetType}-${containerId}`,  // 唯一名称
            entry: widgetConfigs[widgetType].entry,
            container: `#${containerId}`,
            props: widgetData
        });

        microAppsRef.current.push(microApp);
        setWidgets([...widgets, { id: containerId, microApp }]);
    };

    const removeWidget = (widgetId) => {
        const index = widgets.findIndex(w => w.id === widgetId);
        if (index !== -1) {
            // 卸载并移除
            widgets[index].microApp.unmount();
            document.querySelector(`#${widgetId}`).remove();
            
            setWidgets(widgets.filter(w => w.id !== widgetId));
        }
    };

    return (
        <div>
            <button onClick={() => addWidget('chart', { type: 'bar' })}>
                添加图表组件
            </button>
            <button onClick={() => addWidget('table', { pageSize: 10 })}>
                添加表格组件
            </button>
            <div id="dashboard" className="dashboard">
                {/* 动态添加的 widget 容器 */}
            </div>
        </div>
    );
}
```

#### 场景4: 条件渲染

```javascript
// 根据业务逻辑决定是否加载微应用
function ProductDetail({ productId }) {
    const [product, setProduct] = useState(null);
    const [reviewsApp, setReviewsApp] = useState(null);

    useEffect(() => {
        // 加载商品详情
        fetchProduct(productId).then(data => {
            setProduct(data);
            
            // 只有评价数 > 0 才加载评价组件
            if (data.reviewCount > 0) {
                const app = loadMicroApp({
                    name: 'product-reviews',
                    entry: '//localhost:8080',
                    container: '#reviews-container',
                    props: { productId }
                });
                setReviewsApp(app);
            }
        });

        // 清理
        return () => {
            if (reviewsApp) {
                reviewsApp.unmount();
            }
        };
    }, [productId]);

    return (
        <div>
            <h1>{product?.name}</h1>
            <div>{product?.description}</div>
            
            {product?.reviewCount > 0 && (
                <div id="reviews-container"></div>
            )}
        </div>
    );
}
```

## 🔄 生命周期控制对比

### registerMicroApps：自动管理

```javascript
registerMicroApps([{
    name: 'app',
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app'
}]);

start();

// 生命周期由 single-spa 自动管理：
// 用户访问 /app → mount
// 用户离开 /app → unmount
// 用户再次访问 /app → mount

// 开发者无需关心 mount/unmount 的调用时机
```

### loadMicroApp：手动管理

```javascript
// 手动加载
const app = loadMicroApp({
    name: 'app',
    entry: '//localhost:8080',
    container: '#container'
});

// 手动卸载
await app.unmount();

// 手动重新挂载
await app.mount();

// 获取状态
app.getStatus();  // 'MOUNTED' | 'UNMOUNTED' | ...

// 监听状态变化
app.mountPromise.then(() => {
    console.log('应用已挂载');
});

app.unmountPromise.then(() => {
    console.log('应用已卸载');
});
```

## 📊 缓存机制对比

### registerMicroApps：应用级缓存

```javascript
registerMicroApps([{
    name: 'app1',
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app1'
}]);

// 同名应用只会注册一次
// 第二次注册会被过滤掉
registerMicroApps([{
    name: 'app1',  // 已存在，被忽略
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app1'
}]);
```

### loadMicroApp：容器级缓存

```typescript
// packages/qiankun/src/apis/loadMicroApp.ts: 9-10
const appConfigPromiseGetterMap = new Map<string, Promise<ParcelConfigObjectGetter>>();
const containerMicroAppsMap = new Map<string, MicroApp[]>();

// 缓存 key: name + containerXPath
// 相同名称 + 相同容器 → 复用
// 相同名称 + 不同容器 → 创建新实例
```

**示例：**

```javascript
// 第一次加载
const app1 = loadMicroApp({
    name: 'widget',
    entry: '//localhost:8080',
    container: '#container1'  // 容器1
});

// 第二次加载（不同容器）
const app2 = loadMicroApp({
    name: 'widget',
    entry: '//localhost:8080',
    container: '#container2'  // 容器2
});

// app1 和 app2 是两个独立的实例
// 可以同时运行

// 第三次加载（相同名称 + 相同容器）
const app3 = loadMicroApp({
    name: 'widget',
    entry: '//localhost:8080',
    container: '#container1'  // 容器1（与 app1 相同）
});

// app3 会复用 app1 的配置
// 不会重新下载和解析资源
```

## 🎓 面试要点

### 核心区别

1. **触发方式**：
   - registerMicroApps：路由驱动，自动触发
   - loadMicroApp：手动调用，立即加载

2. **生命周期**：
   - registerMicroApps：single-spa 自动管理
   - loadMicroApp：开发者手动管理

3. **返回值**：
   - registerMicroApps：void，无返回值
   - loadMicroApp：MicroApp 实例，可控制

4. **多实例**：
   - registerMicroApps：同名应用单实例
   - loadMicroApp：支持多实例（不同容器）

### 适用场景

**registerMicroApps：**
- ✅ 主导航切换
- ✅ 路由驱动的页面
- ✅ 标准的单页应用架构
- ✅ 需要 URL 和应用状态同步

**loadMicroApp：**
- ✅ 弹窗、模态框
- ✅ Tab 页签
- ✅ 动态组件
- ✅ 条件渲染
- ✅ 多实例场景
- ✅ 不依赖路由的场景

### 技术细节

1. **依赖关系**：
   - registerMicroApps 依赖 start()
   - loadMicroApp 不依赖（会自动调用）

2. **底层实现**：
   - registerMicroApps → single-spa.registerApplication
   - loadMicroApp → single-spa.mountRootParcel

3. **缓存策略**：
   - registerMicroApps：应用名称唯一
   - loadMicroApp：名称 + 容器 XPath 唯一

## 💡 为什么需要两个 API？

### 解决不同的问题

```javascript
// 问题1: 路由驱动的应用（80% 的场景）
// 用户点击导航 → URL 变化 → 加载对应应用
// registerMicroApps 完美解决 ✓

// 问题2: 非路由场景（20% 的场景）
// 点击按钮 → 打开弹窗 → 加载应用（URL 不变）
// registerMicroApps 无法解决 ❌
// loadMicroApp 解决 ✓
```

### 设计理念

```javascript
// registerMicroApps：声明式
// "告诉 qiankun 有哪些应用，什么时候激活"
registerMicroApps([
    { name: 'app', activeRule: '/app', ... }
]);
// qiankun 自动管理一切

// loadMicroApp：命令式
// "现在立即加载这个应用"
const app = loadMicroApp({ name: 'app', ... });
// 开发者完全控制
```

### 灵活性与简洁性

```javascript
// 简单场景：registerMicroApps
// 配置一次，路由自动切换，简单高效

// 复杂场景：loadMicroApp
// 完全控制，灵活性max，适应各种需求

// 两者互补，覆盖所有场景
```

## 🔗 组合使用

```javascript
// 主应用：使用 registerMicroApps
registerMicroApps([
    {
        name: 'dashboard',
        entry: '//localhost:8080',
        container: '#main-container',
        activeRule: '/dashboard'
    }
]);

start();

// 某个页面：使用 loadMicroApp 加载弹窗
function DashboardPage() {
    const openSettings = () => {
        const modal = createModal();
        
        const app = loadMicroApp({
            name: 'settings',
            entry: '//localhost:8081',
            container: modal.container
        });

        modal.onClose = () => {
            app.unmount();
        };
    };

    return (
        <div>
            <button onClick={openSettings}>设置</button>
            {/* 主内容 */}
        </div>
    );
}

// 结果：
// - 主应用通过路由切换
// - 弹窗应用手动加载
// - 两者和谐共存
```

qiankun 通过提供这两个 API，实现了**路由驱动**和**手动控制**的完美结合，满足微前端的各种应用场景！

