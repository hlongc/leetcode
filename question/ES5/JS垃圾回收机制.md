# JavaScript 垃圾回收机制

## 1. 垃圾回收的基本概念

JavaScript 是一种具有自动内存管理的高级语言，开发者无需手动分配和释放内存。JavaScript 引擎通过垃圾回收（Garbage Collection，简称 GC）机制来自动管理内存，回收不再使用的内存空间。

垃圾回收的主要目标是识别并清除那些不再被程序引用的对象，从而释放它们占用的内存空间。

## 2. 内存生命周期

JavaScript 中的内存生命周期通常包括三个阶段：

1. **分配内存**：当我们创建变量、函数、对象等时，JavaScript 引擎会自动分配内存
2. **使用内存**：程序读取和写入已分配的内存
3. **释放内存**：不再需要的内存被回收，这一过程由垃圾回收器自动完成

## 3. 垃圾回收算法

JavaScript 引擎主要使用两种垃圾回收算法：

### 3.1 引用计数（Reference Counting）

**基本原理**：跟踪记录每个对象被引用的次数，当引用计数为 0 时，对象被认为是垃圾，可以被回收。

```javascript
let obj = { name: "示例对象" }; // 引用计数为1
let anotherRef = obj; // 引用计数为2
obj = null; // 引用计数减为1
anotherRef = null; // 引用计数减为0，对象可被回收
```

**问题**：引用计数无法解决循环引用问题。

```javascript
function createCycle() {
  let obj1 = {};
  let obj2 = {};
  obj1.ref = obj2; // obj1引用obj2
  obj2.ref = obj1; // obj2引用obj1
}

createCycle(); // 即使函数执行完毕，由于循环引用，对象无法被回收
```

### 3.2 标记-清除（Mark and Sweep）

**基本原理**：从根对象（如全局对象）开始，递归标记所有可达的对象，然后清除所有未被标记的对象。

**执行步骤**：

1. 垃圾回收器创建一个「根」列表，根可以是全局对象，或当前执行的函数中的变量和参数
2. 所有根被检查并标记为活动的，从根可以访问到的所有对象也被递归地标记为活动的
3. 未被标记的内存被视为垃圾，将被回收

这种方法能有效解决循环引用问题。

### 3.3 分代收集（Generational Collection）

现代 JavaScript 引擎（如 V8）采用分代收集策略：

- **新生代**：存活时间短的对象，使用 Scavenge 算法（基于 Cheney 算法的复制收集）
- **老生代**：存活时间长的对象，使用标记-清除、标记-整理等算法

对象在新生代区域经过两次垃圾回收后，如果仍然存活，会被提升到老生代区域。

## 4. V8 引擎的垃圾回收

V8 引擎（Chrome 和 Node.js 使用的 JavaScript 引擎）的垃圾回收机制：

### 4.1 新生代（Young Generation）

- 使用 Scavenge 算法，将内存分为 From 和 To 两个相等大小的空间
- 新分配的对象被放入 From 空间
- 垃圾回收时，将 From 空间中存活的对象复制到 To 空间，然后交换 From 和 To 的角色
- 复制过程中可能发生对象晋升（Promotion）：某些对象会被移动到老生代区域

### 4.2 老生代（Old Generation）

- 主要使用标记-清除（Mark-Sweep）和标记-整理（Mark-Compact）算法
- 标记-清除：标记活动对象，清除非活动对象
- 标记-整理：在标记-清除的基础上增加整理步骤，将存活对象移动到一起，减少内存碎片

### 4.3 增量标记（Incremental Marking）

V8 引擎使用增量标记来减少垃圾回收造成的停顿：

- 将完整的标记过程分解为小步骤
- 穿插在 JavaScript 代码执行的间隙执行
- 减少了垃圾回收对应用性能的影响

## 5. 常见的内存泄漏问题

尽管有自动垃圾回收，JavaScript 程序仍然可能发生内存泄漏：

### 5.1 意外的全局变量

```javascript
function leak() {
  leakyVar = "我会泄漏"; // 没有声明，成为全局变量
}
```

### 5.2 被遗忘的定时器和回调函数

```javascript
function setupTimer() {
  const hugeData = new Array(100000).fill("x");
  setInterval(() => {
    // 引用了hugeData，导致hugeData无法被回收
    console.log(hugeData.length);
  }, 1000);
}
```

### 5.3 闭包导致的泄漏

```javascript
function createLeak() {
  const largeObj = new Array(1000000).fill("x");
  return function () {
    // 闭包引用了外部函数的变量，阻止了垃圾回收
    console.log(largeObj[0]);
  };
}
const leakyFunction = createLeak(); // largeObj被保留在内存中
```

### 5.4 DOM 引用

```javascript
let elements = [];
function addElement() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  elements.push(element); // 数组持有对DOM的引用
}
// 即使删除了DOM节点，数组中的引用仍然存在
function removeElement() {
  document.body.removeChild(document.querySelector("div"));
  // 但没有清除elements数组中的引用
}
```

## 6. 浏览器内存监控 API

浏览器提供了多种 API 用于监控内存使用情况：

### 6.1 Performance API

```javascript
// 获取当前内存使用情况
const memory = performance.memory;
console.log(memory.usedJSHeapSize); // 已使用的JS堆大小（字节）
console.log(memory.totalJSHeapSize); // 当前JS堆大小（字节）
console.log(memory.jsHeapSizeLimit); // JS堆大小限制（字节）
```

注意：`performance.memory` 仅在 Chrome 浏览器中可用，且需要开启特定标志才能在跨域环境访问。

### 6.2 Performance Timeline API

```javascript
function checkMemoryUsage() {
  const perfEntries = performance.getEntriesByType("resource");
  perfEntries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.decodedBodySize} bytes`);
  });
}
```

### 6.3 Performance Observer API

```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`Memory used: ${entry.usedJSHeapSize / (1024 * 1024)} MB`);
  });
});

observer.observe({ entryTypes: ["resource", "mark", "measure"] });
```

### 6.4 开发者工具

浏览器开发者工具提供了更直观的内存监控：

1. **Chrome 任务管理器**：查看各个选项卡和扩展的内存使用
2. **性能面板**：记录和分析页面性能，包括内存使用情况
3. **内存面板**：提供堆快照（Heap Snapshot）、分配时间轴（Allocation Timeline）和分配抽样（Allocation Sampling）等功能

### 6.5 堆内存快照分析

```javascript
// 手动触发垃圾回收（仅在开发者工具中有效）
console.log("开始分析内存");
console.profile(); // 开始性能分析

// 执行可能导致内存泄漏的代码

console.profileEnd(); // 结束性能分析
console.log("内存分析完成");
```

### 6.6 使用 Memory-stats.js 库

这个轻量级库可以在页面上显示内存使用情况：

```javascript
// 引入库文件后
const stats = new MemoryStats();
stats.domElement.style.position = "fixed";
stats.domElement.style.right = "0px";
stats.domElement.style.top = "0px";
document.body.appendChild(stats.domElement);

requestAnimationFrame(function rAFloop() {
  stats.update();
  requestAnimationFrame(rAFloop);
});
```

## 7. 优化内存使用的最佳实践

1. **减少全局变量使用**：使用局部变量和闭包来限制变量的作用域
2. **及时清除事件监听器**：使用完毕的事件监听器应该被移除
3. **注意闭包使用**：避免在闭包中引用大对象
4. **使用弱引用（WeakMap/WeakSet）**：适用于需要将键映射到值，但又不妨碍垃圾回收的场景
5. **避免内存泄漏**：定期检查应用的内存使用情况，找出并修复泄漏
6. **使用对象池**：对于频繁创建和销毁的对象，考虑使用对象池模式
7. **注意 DOM 操作**：操作 DOM 时注意清理相关引用

## 8. 总结

JavaScript 的垃圾回收机制自动管理内存，使开发者能够专注于代码逻辑而非内存管理。了解垃圾回收原理有助于编写更高效、更可靠的 JavaScript 程序，避免内存泄漏问题。虽然垃圾回收过程是自动的，但开发者仍然需要遵循最佳实践，合理使用内存，并利用浏览器提供的工具监控应用的内存使用情况。
