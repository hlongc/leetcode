# JavaScript 事件中各种 Target 的详细区别

在 JavaScript 事件处理中，有几个与事件目标相关的重要属性：`event.target`、`event.currentTarget`、`event.relatedTarget`以及`this`关键字。它们各自有不同的用途和行为特点，下面将详细解释它们之间的区别。

## 1. event.target

`event.target`是**触发事件的最深层元素**（事件的真正来源）。

- 它指向实际被点击、悬停或以其他方式触发事件的具体 DOM 元素
- 在事件冒泡或捕获过程中，`event.target`始终保持不变
- 它代表事件最初发生的元素，无论事件处理器绑定在哪个元素上

**示例**：

```javascript
// 假设HTML结构：<div id="outer"><span id="inner">点击我</span></div>
document.getElementById("outer").addEventListener("click", function (event) {
  console.log(event.target); // 如果点击了span，这里会输出span元素
  console.log(event.currentTarget); // 始终是div#outer元素
});
```

## 2. event.currentTarget

`event.currentTarget`是**当前正在处理事件的元素**，也就是绑定了事件处理函数的元素。

- 它引用的是事件处理器被附加到的元素
- 在事件冒泡或捕获过程中，`event.currentTarget`会随着事件传播而变化
- 它表示当前事件流中正在执行事件处理程序的元素

**示例**：

```javascript
function handleClick(event) {
  console.log("target:", event.target.id); // 实际点击的元素
  console.log("currentTarget:", event.currentTarget.id); // 处理事件的元素
}

document.getElementById("parent").addEventListener("click", handleClick);
document.getElementById("child").addEventListener("click", handleClick);

// 点击child元素时:
// 第一次输出: target: child, currentTarget: child
// 第二次输出: target: child, currentTarget: parent
```

## 3. this 关键字（在事件处理函数中）

在传统的 DOM 事件处理函数中（非箭头函数），`this`与`event.currentTarget`是等价的。

- `this`指向绑定了事件处理函数的元素
- 它等同于`event.currentTarget`
- 但在箭头函数中，`this`不再指向当前元素，而是继承自外部作用域

**示例**：

```javascript
// 传统函数
element.addEventListener("click", function (event) {
  console.log(this === event.currentTarget); // true
});

// 箭头函数
element.addEventListener("click", (event) => {
  console.log(this === event.currentTarget); // false
  console.log(this); // 指向外部作用域的this
});
```

## 4. event.relatedTarget

`event.relatedTarget`是与事件相关的次要目标元素，主要用于鼠标移入/移出类事件。

- 在`mouseenter`、`mouseover`事件中，它指向鼠标来源的元素
- 在`mouseleave`、`mouseout`事件中，它指向鼠标去往的元素
- 在`focus`/`blur`事件中，它指向失去/获得焦点的元素
- 在其他类型的事件中，它通常为`null`

**示例**：

```javascript
element.addEventListener("mouseenter", function (event) {
  console.log("鼠标从这个元素进入:", event.relatedTarget);
  console.log("鼠标进入到这个元素:", event.target);
});

element.addEventListener("mouseleave", function (event) {
  console.log("鼠标离开这个元素:", event.target);
  console.log("鼠标去往这个元素:", event.relatedTarget);
});
```

## 5. 事件委托中的应用

事件委托（Event Delegation）是这些属性最常见的应用场景之一：

```javascript
document
  .getElementById("todo-list")
  .addEventListener("click", function (event) {
    // 检查是否点击了删除按钮
    if (event.target.className === "delete-btn") {
      // 获取最近的li元素并删除
      const listItem = event.target.closest("li");
      if (listItem) {
        listItem.remove();
      }
    }

    // 事件处理器绑定在ul上，但我们可以根据event.target判断实际点击的元素
    console.log("事件绑定在:", event.currentTarget.tagName); // UL
    console.log("实际点击的是:", event.target.tagName); // 可能是BUTTON、LI或其他子元素
  });
```

## 6. 兼容性和注意事项

- `event.target`和`event.currentTarget`在所有现代浏览器中都得到良好支持
- `event.relatedTarget`在某些事件类型中可能为`null`
- 在 IE8 及更早版本中，使用`event.srcElement`代替`event.target`，使用`event.toElement`和`event.fromElement`代替`event.relatedTarget`
- 在处理复杂的事件委托时，可能需要结合使用`event.target.closest()`方法来找到特定的祖先元素

## 7. 总结比较

| 属性                  | 描述                 | 值会变化吗？             | 主要用途                 |
| --------------------- | -------------------- | ------------------------ | ------------------------ |
| `event.target`        | 触发事件的原始元素   | 在事件传播过程中保持不变 | 确定事件的实际来源       |
| `event.currentTarget` | 当前处理事件的元素   | 在事件传播过程中会变化   | 确定当前处理事件的元素   |
| `this`(非箭头函数)    | 当前处理事件的元素   | 在事件传播过程中会变化   | 与 currentTarget 相同    |
| `event.relatedTarget` | 与事件相关的次要元素 | 取决于事件类型           | 跟踪鼠标移动的来源和目标 |

理解这些不同的目标属性对于正确处理事件、实现事件委托以及调试复杂的交互行为至关重要。
