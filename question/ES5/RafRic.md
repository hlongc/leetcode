# requestAnimationFrame 与 requestIdleCallback 详解

## requestAnimationFrame (rAF)

### 基本概念

`requestAnimationFrame` 是浏览器提供的一个用于优化动画渲染的 API，它会告诉浏览器在下一次重绘之前调用指定的回调函数来更新动画。

### 语法

```javascript
const requestId = window.requestAnimationFrame(callback);
```

- `callback`：在下一次重绘之前调用的函数
- `requestId`：请求的 ID，可用于通过 `cancelAnimationFrame()` 取消回调

### 执行时机

- **执行时间点**：在浏览器下一次重绘之前执行
- **执行帧**：在调用 rAF 的**下一帧**执行，而非当前帧
- **频率**：通常与显示器的刷新率同步（大多数显示器为 60Hz，约 16.7ms 一次）
- **执行顺序**：在当前帧的布局和绘制操作之前

### 浏览器渲染流水线中的位置

浏览器一帧的渲染流程大致为：

1. 处理 JavaScript
2. 计算样式
3. 布局
4. 绘制
5. 合成

`requestAnimationFrame` 回调在下一帧的第 1 步（JavaScript 处理阶段）执行，在样式计算和布局之前，这使得它能够在视觉变化发生之前进行 DOM 修改。

### 适用场景

- 视觉动画效果
- 基于时间的 DOM 更新
- 游戏渲染循环
- 需要与屏幕刷新同步的视觉效果

### 示例代码

```javascript
function animate() {
  // 更新动画状态
  element.style.transform = `translateX(${position}px)`;
  position += 5;

  // 继续下一帧动画
  if (position < 600) {
    requestAnimationFrame(animate);
  }
}

// 开始动画
let position = 0;
requestAnimationFrame(animate);
```

## requestIdleCallback (rIC)

### 基本概念

`requestIdleCallback` 是一个允许开发者在浏览器空闲时期执行低优先级任务的 API，而不会影响关键事件如动画和用户交互。

### 语法

```javascript
const requestId = window.requestIdleCallback(callback, options);
```

- `callback`：在浏览器空闲时调用的函数
- `options`：可选配置对象，包含 `timeout` 属性
- `requestId`：请求的 ID，可用于通过 `cancelIdleCallback()` 取消回调

### 执行时机

- **执行时间点**：在浏览器完成当前帧的所有必要工作后，如果还有剩余时间则执行
- **执行帧**：通常在当前帧的末尾执行，如果当前帧没有空闲时间，则推迟到后续帧
- **超时机制**：可以设置 `timeout` 参数，确保回调在指定时间内被执行，即使浏览器一直很忙
- **执行顺序**：在当前帧的所有高优先级任务（包括渲染）完成后执行

### 浏览器渲染流水线中的位置

在浏览器的一帧中，`requestIdleCallback` 回调会在以下所有工作完成后执行：

1. 处理 JavaScript
2. 计算样式
3. 布局
4. 绘制
5. 合成

只有当以上所有步骤完成后，且帧还有剩余时间，`requestIdleCallback` 的回调才会被触发。

### 空闲时间的计算

浏览器会计算当前帧的剩余时间，`requestIdleCallback` 的回调函数会接收一个 `IdleDeadline` 对象，包含：

- `timeRemaining()`：返回当前空闲时段剩余的估计毫秒数
- `didTimeout`：布尔值，表示回调是否因超时而被调用

### 适用场景

- 非关键数据的延迟加载
- 数据预取
- 长任务分割执行
- 后台数据处理和计算
- 垃圾回收

### 示例代码

```javascript
requestIdleCallback(
  function processData(deadline) {
    // 检查是否有足够的空闲时间
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      processNextTask();
    }

    // 如果还有任务，继续在下一个空闲时间执行
    if (tasks.length > 0) {
      requestIdleCallback(processData);
    }
  },
  { timeout: 2000 }
);
```

## rAF 与 rIC 的关键区别

| 特性       | requestAnimationFrame          | requestIdleCallback          |
| ---------- | ------------------------------ | ---------------------------- |
| 执行优先级 | 高（与渲染同步）               | 低（在空闲时执行）           |
| 执行时机   | 下一帧的渲染前                 | 当前帧或后续帧的空闲时间     |
| 适用场景   | 视觉更新、动画                 | 非关键后台任务               |
| 执行保证   | 每帧都会执行                   | 不保证执行，除非设置超时     |
| 执行频率   | 通常每秒 60 次（与刷新率同步） | 不确定，取决于浏览器空闲状态 |
| 回调参数   | 时间戳                         | IdleDeadline 对象            |

## 执行时机总结

### requestAnimationFrame

- 在**下一帧**开始时、渲染流程之前执行
- 保证在视觉变化之前运行
- 与显示器刷新率同步

### requestIdleCallback

- 在**当前帧**结束时如有剩余时间则执行
- 如当前帧没有空闲时间，可能推迟到后续多个帧
- 不保证何时执行，除非设置了超时参数

## 最佳实践

### requestAnimationFrame

1. 保持回调函数简短高效
2. 避免在回调中进行布局操作（会触发强制重排）
3. 使用 rAF 替代 setTimeout/setInterval 实现动画
4. 记得在不需要时通过 cancelAnimationFrame 取消

### requestIdleCallback

1. 将任务分解为小块，每块执行时间不超过 50ms
2. 始终检查 timeRemaining() 确保不占用过多空闲时间
3. 为关键任务设置合理的超时时间
4. 不要在回调中执行视觉更新（可能导致额外的渲染）
5. 考虑使用 Web Workers 处理计算密集型任务

## 浏览器支持

- requestAnimationFrame：所有现代浏览器都支持
- requestIdleCallback：Chrome 47+、Firefox 55+、Edge 79+，Safari 不支持（可使用 polyfill）

## 总结

- **requestAnimationFrame** 适用于与视觉更新相关的高优先级任务，在下一帧渲染前执行
- **requestIdleCallback** 适用于非关键的后台任务，在浏览器空闲时执行
- 两者结合使用可以创建高性能、响应迅速的 Web 应用，既能保证流畅的视觉体验，又能高效处理后台任务
