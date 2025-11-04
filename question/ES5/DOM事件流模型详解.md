# DOM 事件流模型详解

## 🎯 什么是 DOM 事件流？

**DOM 事件流**（Event Flow）描述了事件在 DOM 树中传播的完整过程，分为三个阶段：

```
1️⃣ 捕获阶段（Capture Phase）     - 从根节点到目标元素
2️⃣ 目标阶段（Target Phase）      - 到达目标元素
3️⃣ 冒泡阶段（Bubbling Phase）    - 从目标元素回到根节点
```

---

## 📊 事件流的三个阶段

### 完整流程图

```html
<!DOCTYPE html>
<html>                           ← 1. 从这里开始（捕获）
  <body>                         ← 2. 向下传播
    <div id="outer">             ← 3. 继续向下
      <div id="inner">           ← 4. 继续向下
        <button id="btn">        ← 5. 到达目标（目标阶段）
          点击我                  ← 6. 从这里往上（冒泡）
        </button>                ← 7. 向上传播
      </div>                     ← 8. 继续向上
    </div>                       ← 9. 继续向上
  </body>                        ← 10. 继续向上
</html>                          ← 11. 回到根节点
```

### 图示

```
点击 button，事件传播路径：

捕获阶段 ↓                        冒泡阶段 ↑
─────────────────────────────────────────────
window                            window
  ↓                                 ↑
document                          document
  ↓                                 ↑
<html>                            <html>
  ↓                                 ↑
<body>                            <body>
  ↓                                 ↑
<div id="outer">                  <div id="outer">
  ↓                                 ↑
<div id="inner">                  <div id="inner">
  ↓                                 ↑
<button>  ← ← ← 目标阶段 → → →  <button>
```

---

## 💻 代码示例（完整演示）

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 10px; }
    div { border: 2px solid #ccc; }
    #outer { background: #ffebee; }
    #inner { background: #fff3e0; }
    button { background: #e3f2fd; }
  </style>
</head>
<body>
  <div id="outer">
    Outer
    <div id="inner">
      Inner
      <button id="btn">点击我</button>
    </div>
  </div>
  
  <div id="log"></div>
  
  <script>
    const outer = document.getElementById('outer');
    const inner = document.getElementById('inner');
    const btn = document.getElementById('btn');
    const log = document.getElementById('log');
    
    let eventCount = 0;
    
    function logEvent(element, phase, event) {
      eventCount++;
      const message = `${eventCount}. [${phase}] ${element}`;
      console.log(message);
      
      const p = document.createElement('p');
      p.textContent = message;
      p.style.color = phase === '捕获' ? 'blue' : 
                      phase === '目标' ? 'green' : 'red';
      log.appendChild(p);
    }
    
    // ============================================
    // 捕获阶段监听器（第三个参数 true）
    // ============================================
    outer.addEventListener('click', (e) => {
      logEvent('outer', '捕获', e);
    }, true);  // ← true 表示在捕获阶段监听
    
    inner.addEventListener('click', (e) => {
      logEvent('inner', '捕获', e);
    }, true);
    
    btn.addEventListener('click', (e) => {
      logEvent('button', '目标', e);
    }, true);  // 虽然是 true，但因为是目标元素，所以在目标阶段
    
    // ============================================
    // 冒泡阶段监听器（第三个参数 false 或不写）
    // ============================================
    outer.addEventListener('click', (e) => {
      logEvent('outer', '冒泡', e);
    }, false);  // ← false（或不写）表示在冒泡阶段监听
    
    inner.addEventListener('click', (e) => {
      logEvent('inner', '冒泡', e);
    });  // 默认 false
    
    btn.addEventListener('click', (e) => {
      logEvent('button', '冒泡', e);
    });
    
    // 点击按钮，输出顺序：
    /**
     * 1. [捕获] outer      ← 捕获阶段：从外到内
     * 2. [捕获] inner
     * 3. [目标] button     ← 目标阶段
     * 4. [冒泡] button     ← 冒泡阶段：从内到外
     * 5. [冒泡] inner
     * 6. [冒泡] outer
     */
  </script>
</body>
</html>
```

---

## 🔍 详细解析

### 阶段1：捕获阶段（Capture Phase）

```javascript
/**
 * 事件从 window 向下传播到目标元素
 * 
 * 传播路径：
 * window → document → html → body → ... → 目标元素
 */

const capturePhase = {
  direction: '从外到内（从根到目标）',
  
  trigger: '只有设置了捕获监听器（第三个参数为 true）才会触发',
  
  example: `
    element.addEventListener('click', handler, true);
                                              ↑
                                            捕获阶段
  `,
  
  useCase: [
    '事件委托的高级用法',
    '在事件到达目标前拦截',
    '实现事件过滤器'
  ]
};

// 示例：在捕获阶段拦截
document.addEventListener('click', (e) => {
  console.log('捕获阶段：点击了', e.target.tagName);
  
  // 可以在这里统一处理或阻止
  if (e.target.classList.contains('disabled')) {
    e.stopPropagation();  // 阻止继续传播
    console.log('已禁用，阻止点击');
  }
}, true);  // true = 捕获阶段
```

### 阶段2：目标阶段（Target Phase）

```javascript
/**
 * 事件到达目标元素
 */

const targetPhase = {
  description: '事件到达被点击的元素本身',
  
  behavior: `
    - 目标元素上的捕获监听器先执行
    - 然后是目标元素上的冒泡监听器
    - 执行顺序按添加顺序
  `,
  
  example: `
    button.addEventListener('click', () => {
      console.log('监听器1');
    }, true);  // 捕获
    
    button.addEventListener('click', () => {
      console.log('监听器2');
    }, false); // 冒泡
    
    button.addEventListener('click', () => {
      console.log('监听器3');
    }, true);  // 捕获
    
    // 点击 button 输出：
    // 监听器1（捕获，先添加）
    // 监听器3（捕获，后添加）
    // 监听器2（冒泡）
  `
};
```

### 阶段3：冒泡阶段（Bubbling Phase）

```javascript
/**
 * 事件从目标元素向上传播回 window
 * 
 * 传播路径：
 * 目标元素 → ... → body → html → document → window
 */

const bubblingPhase = {
  direction: '从内到外（从目标到根）',
  
  trigger: '默认行为（第三个参数为 false 或不写）',
  
  example: `
    element.addEventListener('click', handler);
    // 或
    element.addEventListener('click', handler, false);
    ↑ 冒泡阶段（默认）
  `,
  
  useCase: [
    '✅ 事件委托（最常用）',
    '✅ 大多数事件处理',
    '✅ 父元素统一处理子元素事件'
  ]
};

// 示例：事件冒泡
document.body.addEventListener('click', (e) => {
  console.log('冒泡到 body，点击的是:', e.target.tagName);
  
  // e.target: 实际被点击的元素
  // e.currentTarget: 当前监听器绑定的元素（这里是 body）
});
```

---

## 🎯 event.target vs event.currentTarget

### 重要区别

```html
<div id="outer">
  <div id="inner">
    <button id="btn">点击</button>
  </div>
</div>

<script>
  document.getElementById('outer').addEventListener('click', (e) => {
    console.log('target:', e.target);              // button（被点击的元素）
    console.log('currentTarget:', e.currentTarget); // outer（监听器绑定的元素）
    
    // 判断点击的是否是 button
    if (e.target.tagName === 'BUTTON') {
      console.log('点击了按钮');
    }
  });
  
  /**
   * 点击 button 时：
   * - e.target: <button>（实际点击的）
   * - e.currentTarget: <div id="outer">（监听器所在）
   */
</script>
```

---

## 🛑 阻止事件传播

### stopPropagation（阻止传播）

```html
<div id="outer">
  <div id="inner">
    <button id="btn">点击</button>
  </div>
</div>

<script>
  outer.addEventListener('click', () => {
    console.log('outer 冒泡');
  });
  
  inner.addEventListener('click', (e) => {
    console.log('inner 冒泡');
    
    // 阻止事件继续传播
    e.stopPropagation();
    
    // 事件到这里就停止，不会继续冒泡到 outer
  });
  
  btn.addEventListener('click', () => {
    console.log('button 冒泡');
  });
  
  /**
   * 点击 button 输出：
   * button 冒泡
   * inner 冒泡
   * （outer 不会执行，因为被阻止了）
   */
</script>
```

### stopImmediatePropagation（立即停止）

```javascript
btn.addEventListener('click', (e) => {
  console.log('监听器1');
  e.stopImmediatePropagation();
  // 立即停止，连同一元素上的其他监听器也不执行
});

btn.addEventListener('click', () => {
  console.log('监听器2');
  // ❌ 不会执行（被上面阻止了）
});

outer.addEventListener('click', () => {
  console.log('outer');
  // ❌ 不会执行
});

/**
 * stopPropagation vs stopImmediatePropagation
 * 
 * stopPropagation:
 * - 阻止向上/下传播
 * - 同一元素的其他监听器仍会执行
 * 
 * stopImmediatePropagation:
 * - 阻止向上/下传播
 * - 同一元素的其他监听器也不执行
 */
```

### preventDefault（阻止默认行为）

```javascript
/**
 * 阻止浏览器的默认行为
 */

// 阻止链接跳转
link.addEventListener('click', (e) => {
  e.preventDefault();  // 阻止默认跳转
  console.log('链接被点击，但不会跳转');
});

// 阻止表单提交
form.addEventListener('submit', (e) => {
  e.preventDefault();  // 阻止默认提交
  console.log('表单不会提交，可以用 AJAX');
});

// 阻止右键菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();  // 阻止右键菜单
  console.log('显示自定义菜单');
});

/**
 * 注意：
 * preventDefault() 不影响事件传播
 * stopPropagation() 不影响默认行为
 * 
 * 两者独立！
 */
```

---

## 🎨 事件委托（Event Delegation）

### 原理：利用事件冒泡

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .item { padding: 10px; margin: 5px; background: #f0f0f0; cursor: pointer; }
    .item:hover { background: #e0e0e0; }
  </style>
</head>
<body>
  <div id="list">
    <div class="item" data-id="1">项目 1</div>
    <div class="item" data-id="2">项目 2</div>
    <div class="item" data-id="3">项目 3</div>
    <!-- 可能有 1000 个项目 -->
  </div>
  
  <button id="add">添加新项目</button>
  
  <script>
    const list = document.getElementById('list');
    
    // ❌ 不好的做法：给每个元素绑定事件
    const items = document.querySelectorAll('.item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        console.log('点击了:', e.target.dataset.id);
      });
    });
    
    // 问题：
    // - 1000 个元素 = 1000 个监听器（内存浪费）
    // - 新添加的元素没有监听器
    // - 性能差
    
    
    // ✅ 好的做法：事件委托（只绑定一个监听器）
    list.addEventListener('click', (e) => {
      // 检查点击的是否是 .item
      if (e.target.classList.contains('item')) {
        console.log('点击了:', e.target.dataset.id);
      }
    });
    
    // 优点：
    // - 只有 1 个监听器（内存节省）
    // - 新添加的元素自动有效（利用冒泡）
    // - 性能好
    
    
    // 添加新项目（事件委托仍然有效）
    document.getElementById('add').addEventListener('click', () => {
      const newItem = document.createElement('div');
      newItem.className = 'item';
      newItem.dataset.id = Date.now();
      newItem.textContent = '新项目 ' + newItem.dataset.id;
      
      list.appendChild(newItem);
      
      // ✅ 新元素的点击会冒泡到 list，自动处理
      // ❌ 如果用第一种方式，需要手动绑定事件
    });
  </script>
</body>
</html>
```

### 事件委托进阶

```javascript
/**
 * 使用 closest 简化事件委托
 */

// HTML
// <ul id="list">
//   <li class="item">
//     <span class="title">标题</span>
//     <button class="delete">删除</button>
//   </li>
// </ul>

list.addEventListener('click', (e) => {
  // 点击删除按钮
  if (e.target.matches('.delete')) {
    const item = e.target.closest('.item');
    item.remove();
  }
  
  // 点击项目任何位置
  const item = e.target.closest('.item');
  if (item) {
    console.log('点击了项目');
  }
});

/**
 * closest 的好处：
 * - 不用担心点击的是 li 还是里面的 span
 * - 自动向上查找最近的匹配元素
 */
```

---

## 🎭 捕获阶段的实际应用

### 场景1：全局事件拦截

```javascript
/**
 * 在捕获阶段统一处理权限检查
 */

document.addEventListener('click', (e) => {
  // 检查元素是否需要权限
  const requiresAuth = e.target.closest('[data-auth-required]');
  
  if (requiresAuth && !isUserLoggedIn()) {
    // 在捕获阶段阻止
    e.stopPropagation();
    e.preventDefault();
    
    console.log('需要登录才能访问');
    showLoginModal();
  }
}, true);  // 捕获阶段

/**
 * 优势：
 * - 在事件到达目标前拦截
 * - 统一的权限检查逻辑
 * - 不需要在每个元素上检查
 */
```

### 场景2：调试和监控

```javascript
/**
 * 在捕获阶段监控所有点击事件
 */

document.addEventListener('click', (e) => {
  // 记录所有点击
  console.log('捕获：点击了', e.target);
  
  // 上报埋点
  analytics.track('click', {
    element: e.target.tagName,
    id: e.target.id,
    class: e.target.className,
    timestamp: Date.now()
  });
}, true);

// 优势：不会被 stopPropagation 阻止（在之前就执行了）
```

---

## 🚫 不冒泡的事件

### 部分事件不会冒泡

```javascript
/**
 * 这些事件不会冒泡（只在目标元素触发）
 */

const nonBubblingEvents = {
  // 焦点事件（blur、focus 不冒泡）
  focus: {
    bubbles: false,
    alternative: 'focusin（会冒泡）'
  },
  
  blur: {
    bubbles: false,
    alternative: 'focusout（会冒泡）'
  },
  
  // 媒体事件
  load: {
    bubbles: false,
    note: 'img.onload, script.onload 等'
  },
  
  error: {
    bubbles: false,
    note: '资源加载错误'
  },
  
  // 鼠标事件
  mouseenter: {
    bubbles: false,
    alternative: 'mouseover（会冒泡）'
  },
  
  mouseleave: {
    bubbles: false,
    alternative: 'mouseout（会冒泡）'
  }
};

// 示例：focus 不冒泡
input.addEventListener('focus', () => {
  console.log('input 获得焦点');
});

// ❌ 这个不会触发（focus 不冒泡）
document.body.addEventListener('focus', () => {
  console.log('不会执行');
});

// ✅ 使用 focusin（会冒泡）
document.body.addEventListener('focusin', (e) => {
  console.log('某个元素获得焦点:', e.target);
});
```

---

## 🧪 完整示例：理解事件流

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    div { padding: 20px; margin: 10px; border: 2px solid; }
    #grand { border-color: red; }
    #parent { border-color: green; }
    #child { border-color: blue; }
  </style>
</head>
<body>
  <div id="grand">
    祖父元素
    <div id="parent">
      父元素
      <div id="child">
        子元素（点击这里）
      </div>
    </div>
  </div>
  
  <script>
    const grand = document.getElementById('grand');
    const parent = document.getElementById('parent');
    const child = document.getElementById('child');
    
    // 捕获阶段
    grand.addEventListener('click', () => {
      console.log('1. grand 捕获');
    }, true);
    
    parent.addEventListener('click', () => {
      console.log('2. parent 捕获');
    }, true);
    
    child.addEventListener('click', () => {
      console.log('3. child 捕获（目标）');
    }, true);
    
    // 冒泡阶段
    child.addEventListener('click', () => {
      console.log('4. child 冒泡（目标）');
    }, false);
    
    parent.addEventListener('click', () => {
      console.log('5. parent 冒泡');
    }, false);
    
    grand.addEventListener('click', () => {
      console.log('6. grand 冒泡');
    }, false);
    
    /**
     * 点击 child 输出：
     * 
     * 1. grand 捕获      ← 捕获阶段：从外到内
     * 2. parent 捕获
     * 3. child 捕获（目标）← 到达目标
     * 4. child 冒泡（目标）← 开始冒泡
     * 5. parent 冒泡     ← 冒泡阶段：从内到外
     * 6. grand 冒泡
     */
  </script>
</body>
</html>
```

---

## 📋 事件对象的重要属性和方法

### 属性

```javascript
element.addEventListener('click', (event) => {
  // 事件类型
  console.log('type:', event.type);  // 'click'
  
  // 目标元素
  console.log('target:', event.target);  // 被点击的元素
  console.log('currentTarget:', event.currentTarget);  // 监听器绑定的元素
  
  // 事件阶段
  console.log('eventPhase:', event.eventPhase);
  // 1 = 捕获阶段（CAPTURING_PHASE）
  // 2 = 目标阶段（AT_TARGET）
  // 3 = 冒泡阶段（BUBBLING_PHASE）
  
  // 是否冒泡
  console.log('bubbles:', event.bubbles);  // true/false
  
  // 是否可取消
  console.log('cancelable:', event.cancelable);  // true/false
  
  // 时间戳
  console.log('timeStamp:', event.timeStamp);
  
  // 鼠标位置（鼠标事件）
  console.log('clientX:', event.clientX);
  console.log('clientY:', event.clientY);
});
```

### 方法

```javascript
element.addEventListener('click', (event) => {
  // 阻止事件传播
  event.stopPropagation();
  
  // 立即阻止（同一元素其他监听器也不执行）
  event.stopImmediatePropagation();
  
  // 阻止默认行为
  event.preventDefault();
  
  // 检查是否已阻止默认行为
  if (event.defaultPrevented) {
    console.log('默认行为已被阻止');
  }
});
```

---

## 🎯 实战应用

### 应用1：表格行点击（事件委托）

```html
<table id="table">
  <tbody>
    <tr data-id="1">
      <td>用户1</td>
      <td><button class="edit">编辑</button></td>
      <td><button class="delete">删除</button></td>
    </tr>
    <tr data-id="2">
      <td>用户2</td>
      <td><button class="edit">编辑</button></td>
      <td><button class="delete">删除</button></td>
    </tr>
    <!-- 可能有 1000 行 -->
  </tbody>
</table>

<script>
  const table = document.getElementById('table');
  
  // ✅ 事件委托：只绑定一个监听器
  table.addEventListener('click', (e) => {
    const target = e.target;
    
    // 点击编辑按钮
    if (target.classList.contains('edit')) {
      const row = target.closest('tr');
      const id = row.dataset.id;
      console.log('编辑用户:', id);
      editUser(id);
      return;
    }
    
    // 点击删除按钮
    if (target.classList.contains('delete')) {
      const row = target.closest('tr');
      const id = row.dataset.id;
      console.log('删除用户:', id);
      deleteUser(id);
      return;
    }
    
    // 点击行（但不是按钮）
    const row = target.closest('tr');
    if (row && !target.matches('button')) {
      console.log('查看用户详情:', row.dataset.id);
      viewUser(row.dataset.id);
    }
  });
  
  /**
   * 优势：
   * - 只有 1 个监听器（内存友好）
   * - 新添加的行自动有效
   * - 易于维护
   */
</script>
```

### 应用2：模态框点击外部关闭

```html
<div class="modal-overlay">
  <div class="modal-content">
    <h2>模态框</h2>
    <p>内容</p>
    <button>关闭</button>
  </div>
</div>

<script>
  const overlay = document.querySelector('.modal-overlay');
  const content = document.querySelector('.modal-content');
  
  // 点击遮罩层关闭
  overlay.addEventListener('click', (e) => {
    // 只有点击遮罩本身才关闭（不包括内容区域）
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // 或者：阻止内容区域的冒泡
  content.addEventListener('click', (e) => {
    e.stopPropagation();  // 阻止冒泡到 overlay
  });
  
  overlay.addEventListener('click', () => {
    closeModal();  // 点击 overlay 关闭
  });
</script>
```

### 应用3：拖拽实现

```javascript
/**
 * 拖拽利用事件冒泡
 */

let isDragging = false;
let dragElement = null;

// 在 document 上监听（捕获所有元素的拖拽）
document.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('draggable')) {
    isDragging = true;
    dragElement = e.target;
    
    console.log('开始拖拽:', dragElement);
  }
}, true);  // 捕获阶段

document.addEventListener('mousemove', (e) => {
  if (isDragging && dragElement) {
    dragElement.style.transform = 
      `translate(${e.clientX}px, ${e.clientY}px)`;
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    console.log('结束拖拽');
    isDragging = false;
    dragElement = null;
  }
});
```

---

## 🔍 深入理解

### 为什么需要事件流？

```javascript
/**
 * 如果没有事件流（只有目标阶段）
 */
const withoutEventFlow = {
  problem: `
    <div id="parent">
      <button id="btn">点击</button>
    </div>
    
    // 只能这样
    btn.addEventListener('click', handler);  // ❌ 必须给每个元素绑定
    
    // 不能这样
    parent.addEventListener('click', handler);  // ❌ 点击 btn 不会触发
  `,
  
  issues: [
    '无法实现事件委托',
    '每个元素都要绑定（内存浪费）',
    '动态元素需要重新绑定'
  ]
};

/**
 * 有了事件流（冒泡机制）
 */
const withEventFlow = {
  benefit: `
    // 只需要绑定一次
    parent.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        handler(e);  // ✅ 点击任何按钮都会触发
      }
    });
  `,
  
  advantages: [
    '✅ 事件委托',
    '✅ 减少监听器数量',
    '✅ 动态元素自动有效'
  ]
};
```

### 事件流的执行顺序细节

```javascript
/**
 * 同一元素上多个监听器的执行顺序
 */

element.addEventListener('click', () => {
  console.log('1. 冒泡监听器1');
}, false);

element.addEventListener('click', () => {
  console.log('2. 冒泡监听器2');
}, false);

element.addEventListener('click', () => {
  console.log('3. 捕获监听器1');
}, true);

element.addEventListener('click', () => {
  console.log('4. 捕获监听器2');
}, true);

/**
 * 点击 element（目标元素）输出：
 * 
 * 3. 捕获监听器1  ← 捕获的按添加顺序
 * 4. 捕获监听器2
 * 1. 冒泡监听器1  ← 冒泡的按添加顺序
 * 2. 冒泡监听器2
 * 
 * 规则：
 * - 目标元素上，捕获监听器先执行
 * - 同类型按添加顺序执行
 */
```

---

## 📊 完整的事件流图解

```
事件流完整路径（点击 <button>）：

═══════════════════════════════════════════════════════════
阶段1：捕获阶段（Capture Phase）- 从外到内
═══════════════════════════════════════════════════════════

window（捕获监听器）
  ↓
document（捕获监听器）
  ↓
<html>（捕获监听器）
  ↓
<body>（捕获监听器）
  ↓
<div id="outer">（捕获监听器）
  ↓
<div id="inner">（捕获监听器）
  ↓

═══════════════════════════════════════════════════════════
阶段2：目标阶段（Target Phase）- 到达目标
═══════════════════════════════════════════════════════════

<button>（目标元素）
  - 捕获监听器（如果有）
  - 冒泡监听器（如果有）
  ↓

═══════════════════════════════════════════════════════════
阶段3：冒泡阶段（Bubbling Phase）- 从内到外
═══════════════════════════════════════════════════════════

<div id="inner">（冒泡监听器）
  ↑
<div id="outer">（冒泡监听器）
  ↑
<body>（冒泡监听器）
  ↑
<html>（冒泡监听器）
  ↑
document（冒泡监听器）
  ↑
window（冒泡监听器）
```

---

## 💡 最佳实践

### 推荐做法

```javascript
const bestPractices = {
  // 1. 默认使用冒泡（不写第三个参数）
  default: `
    element.addEventListener('click', handler);
    // 默认 false，冒泡阶段
    // 符合直觉，性能好
  `,
  
  // 2. 使用事件委托（减少监听器）
  delegation: `
    // ✅ 推荐
    parent.addEventListener('click', (e) => {
      if (e.target.matches('.item')) {
        handleItem(e.target);
      }
    });
    
    // ❌ 不推荐
    items.forEach(item => {
      item.addEventListener('click', handleItem);
    });
  `,
  
  // 3. 谨慎使用 stopPropagation
  stopPropagation: `
    // ⚠️ 可能影响其他功能
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      // 如果父元素也有监听器，会被阻止
    });
    
    // ✅ 更好的做法：检查 target
    parent.addEventListener('click', (e) => {
      if (e.target === parent) {
        // 只处理点击 parent 本身，不包括子元素
      }
    });
  `,
  
  // 4. 移除不需要的监听器
  cleanup: `
    function handler(e) {
      console.log('处理事件');
    }
    
    element.addEventListener('click', handler);
    
    // 不需要时移除（避免内存泄漏）
    element.removeEventListener('click', handler);
  `
};
```

---

## 📚 总结

### DOM 事件流三阶段

```
1️⃣ 捕获阶段（Capture）
   - 从 window 到目标元素
   - 从外到内
   - addEventListener(event, handler, true)

2️⃣ 目标阶段（Target）
   - 到达目标元素
   - 执行目标元素上的监听器

3️⃣ 冒泡阶段（Bubble）
   - 从目标元素到 window
   - 从内到外
   - addEventListener(event, handler, false)  ← 默认
```

### 关键概念

| 概念 | 说明 |
|------|------|
| **event.target** | 实际触发事件的元素 |
| **event.currentTarget** | 监听器绑定的元素 |
| **stopPropagation()** | 阻止事件传播（不影响默认行为） |
| **preventDefault()** | 阻止默认行为（不影响传播） |
| **事件委托** | 利用冒泡，在父元素统一处理 |

### 最佳实践

1. ✅ **默认使用冒泡**（不写第三个参数或写 false）
2. ✅ **使用事件委托**（减少监听器，性能更好）
3. ✅ **区分 target 和 currentTarget**
4. ⚠️ **谨慎使用 stopPropagation**（可能影响其他功能）
5. ✅ **及时移除监听器**（避免内存泄漏）

### 记忆口诀

```
事件流三阶段：
捕获 → 目标 → 冒泡

捕获：从外到内（少用）
冒泡：从内到外（常用）

事件委托靠冒泡
统一处理更高效
```

文档位置：`DOM事件流模型详解.md`

包含：完整的事件流讲解、事件委托、stopPropagation、实战示例！🎉
