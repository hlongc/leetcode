# 封装只能输入数字的 React 组件

## 基础版本

### 1. 简单实现

```jsx
import React, { useState } from "react";

function NumberInput({ value, onChange, ...props }) {
  const handleChange = (e) => {
    const newValue = e.target.value;

    // 只允许数字
    if (/^\d*$/.test(newValue)) {
      onChange?.(newValue);
    }
  };

  return <input type="text" value={value} onChange={handleChange} {...props} />;
}

// 使用
function App() {
  const [value, setValue] = useState("");

  return (
    <div>
      <NumberInput value={value} onChange={setValue} placeholder="请输入数字" />
      <p>输入的值: {value}</p>
    </div>
  );
}
```

### 2. 支持小数

```jsx
function DecimalInput({ value, onChange, decimals = 2, ...props }) {
  const handleChange = (e) => {
    const newValue = e.target.value;

    // 允许数字和一个小数点
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);

    if (regex.test(newValue) || newValue === "") {
      onChange?.(newValue);
    }
  };

  return <input type="text" value={value} onChange={handleChange} {...props} />;
}

// 使用
function App() {
  const [value, setValue] = useState("");

  return (
    <div>
      <DecimalInput
        value={value}
        onChange={setValue}
        decimals={2}
        placeholder="请输入金额（保留2位小数）"
      />
    </div>
  );
}
```

---

## 进阶版本：功能完善的组件

### 完整实现

```jsx
import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * 数字输入组件
 * @param {Object} props
 * @param {string|number} props.value - 当前值
 * @param {Function} props.onChange - 值变化回调
 * @param {number} props.min - 最小值
 * @param {number} props.max - 最大值
 * @param {number} props.decimals - 小数位数（0 表示整数）
 * @param {boolean} props.allowNegative - 是否允许负数
 * @param {string} props.placeholder - 占位符
 * @param {boolean} props.disabled - 是否禁用
 * @param {Function} props.onBlur - 失焦回调
 * @param {string} props.className - 自定义样式类
 */
function NumberInput({
  value,
  onChange,
  min,
  max,
  decimals = 0,
  allowNegative = false,
  placeholder = "请输入数字",
  disabled = false,
  onBlur,
  className = "",
  ...restProps
}) {
  const inputRef = useRef(null);

  /**
   * 构建正则表达式
   */
  const getPattern = () => {
    const negativePrefix = allowNegative ? "-?" : "";
    const decimalPart = decimals > 0 ? `\\.?\\d{0,${decimals}}` : "";

    return new RegExp(`^${negativePrefix}\\d*${decimalPart}$`);
  };

  /**
   * 验证输入是否合法
   */
  const isValidInput = (input) => {
    // 空值允许
    if (input === "" || input === "-") {
      return true;
    }

    // 正则验证
    const pattern = getPattern();
    if (!pattern.test(input)) {
      return false;
    }

    return true;
  };

  /**
   * 验证数值范围
   */
  const isInRange = (numValue) => {
    if (min !== undefined && numValue < min) return false;
    if (max !== undefined && numValue > max) return false;
    return true;
  };

  /**
   * 输入处理
   */
  const handleChange = (e) => {
    const newValue = e.target.value;

    // 验证格式
    if (!isValidInput(newValue)) {
      return;
    }

    // 更新值
    onChange?.(newValue);
  };

  /**
   * 失焦处理（格式化和范围检查）
   */
  const handleBlur = (e) => {
    let finalValue = value;

    // 如果只输入了负号，清空
    if (finalValue === "-") {
      finalValue = "";
    }

    // 转换为数字并检查范围
    if (finalValue !== "") {
      let numValue = parseFloat(finalValue);

      // 检查范围
      if (min !== undefined && numValue < min) {
        numValue = min;
      }
      if (max !== undefined && numValue > max) {
        numValue = max;
      }

      // 格式化小数位
      if (decimals > 0) {
        numValue = parseFloat(numValue.toFixed(decimals));
      }

      finalValue = String(numValue);
    }

    // 如果值改变了，更新
    if (finalValue !== value) {
      onChange?.(finalValue);
    }

    // 调用外部 onBlur
    onBlur?.(e);
  };

  /**
   * 键盘事件处理
   */
  const handleKeyDown = (e) => {
    // 上下箭头调整值
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentValue = parseFloat(value) || 0;
      const step = decimals > 0 ? Math.pow(10, -decimals) : 1;
      const newValue =
        e.key === "ArrowUp" ? currentValue + step : currentValue - step;

      // 检查范围
      if (!isInRange(newValue)) {
        return;
      }

      onChange?.(String(newValue));
    }
  };

  /**
   * 粘贴处理
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // 验证粘贴的内容
    if (isValidInput(pastedText)) {
      onChange?.(pastedText);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputMode="decimal"
      autoComplete="off"
      {...restProps}
    />
  );
}

NumberInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  decimals: PropTypes.number,
  allowNegative: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  onBlur: PropTypes.func,
  className: PropTypes.string,
};

export default NumberInput;
```

---

## 使用示例

### 基础使用

```jsx
import React, { useState } from "react";
import NumberInput from "./NumberInput";

function Example1() {
  const [value, setValue] = useState("");

  return (
    <div>
      <h3>基础示例：只能输入整数</h3>
      <NumberInput value={value} onChange={setValue} placeholder="输入整数" />
      <p>当前值: {value}</p>
    </div>
  );
}
```

### 支持小数

```jsx
function Example2() {
  const [price, setPrice] = useState("");

  return (
    <div>
      <h3>价格输入（保留2位小数）</h3>
      <NumberInput
        value={price}
        onChange={setPrice}
        decimals={2}
        placeholder="0.00"
      />
      <p>价格: ¥{price || "0.00"}</p>
    </div>
  );
}
```

### 范围限制

```jsx
function Example3() {
  const [age, setAge] = useState("");

  return (
    <div>
      <h3>年龄输入（0-150）</h3>
      <NumberInput
        value={age}
        onChange={setAge}
        min={0}
        max={150}
        placeholder="请输入年龄"
      />
      <p>年龄: {age}</p>
    </div>
  );
}
```

### 允许负数

```jsx
function Example4() {
  const [temperature, setTemperature] = useState("");

  return (
    <div>
      <h3>温度输入（允许负数，1位小数）</h3>
      <NumberInput
        value={temperature}
        onChange={setTemperature}
        decimals={1}
        allowNegative={true}
        min={-273.1}
        max={100}
        placeholder="输入温度"
      />
      <p>温度: {temperature}°C</p>
    </div>
  );
}
```

---

## TypeScript 版本

```typescript
import React, { useState, useRef, ClipboardEvent, KeyboardEvent } from "react";

interface NumberInputProps {
  value: string | number;
  onChange?: (value: string) => void;
  min?: number;
  max?: number;
  decimals?: number;
  allowNegative?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  decimals = 0,
  allowNegative = false,
  placeholder = "请输入数字",
  disabled = false,
  onBlur,
  className = "",
  style,
  ...restProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const getPattern = (): RegExp => {
    const negativePrefix = allowNegative ? "-?" : "";
    const decimalPart = decimals > 0 ? `\\.?\\d{0,${decimals}}` : "";
    return new RegExp(`^${negativePrefix}\\d*${decimalPart}$`);
  };

  const isValidInput = (input: string): boolean => {
    if (input === "" || input === "-") return true;
    return getPattern().test(input);
  };

  const isInRange = (numValue: number): boolean => {
    if (min !== undefined && numValue < min) return false;
    if (max !== undefined && numValue > max) return false;
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isValidInput(newValue)) {
      onChange?.(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let finalValue = String(value);

    if (finalValue === "-") {
      finalValue = "";
    }

    if (finalValue !== "") {
      let numValue = parseFloat(finalValue);

      if (min !== undefined && numValue < min) {
        numValue = min;
      }
      if (max !== undefined && numValue > max) {
        numValue = max;
      }

      if (decimals > 0) {
        numValue = parseFloat(numValue.toFixed(decimals));
      }

      finalValue = String(numValue);
    }

    if (finalValue !== String(value)) {
      onChange?.(finalValue);
    }

    onBlur?.(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentValue = parseFloat(String(value)) || 0;
      const step = decimals > 0 ? Math.pow(10, -decimals) : 1;
      const newValue =
        e.key === "ArrowUp" ? currentValue + step : currentValue - step;

      if (!isInRange(newValue)) return;

      onChange?.(String(newValue));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    if (isValidInput(pastedText)) {
      onChange?.(pastedText);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      style={style}
      inputMode="decimal"
      autoComplete="off"
      {...restProps}
    />
  );
};

export default NumberInput;
```

---

## 增强版本：带样式和验证提示

```jsx
import React, { useState } from "react";
import "./NumberInput.css";

function NumberInputEnhanced({
  value,
  onChange,
  min,
  max,
  decimals = 0,
  allowNegative = false,
  label,
  error,
  required = false,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [internalError, setInternalError] = useState("");

  const getPattern = () => {
    const negativePrefix = allowNegative ? "-?" : "";
    const decimalPart = decimals > 0 ? `\\.?\\d{0,${decimals}}` : "";
    return new RegExp(`^${negativePrefix}\\d*${decimalPart}$`);
  };

  const validate = (val) => {
    if (required && val === "") {
      return "此字段为必填项";
    }

    if (val !== "" && val !== "-") {
      const numValue = parseFloat(val);

      if (isNaN(numValue)) {
        return "请输入有效数字";
      }

      if (min !== undefined && numValue < min) {
        return `最小值为 ${min}`;
      }

      if (max !== undefined && numValue > max) {
        return `最大值为 ${max}`;
      }
    }

    return "";
  };

  const handleChange = (e) => {
    const newValue = e.target.value;

    if (!getPattern().test(newValue) && newValue !== "") {
      return;
    }

    onChange?.(newValue);
    setInternalError("");
  };

  const handleBlur = (e) => {
    setFocused(false);

    let finalValue = value;

    if (finalValue === "-") {
      finalValue = "";
    }

    if (finalValue !== "") {
      let numValue = parseFloat(finalValue);

      if (min !== undefined && numValue < min) {
        numValue = min;
      }
      if (max !== undefined && numValue > max) {
        numValue = max;
      }

      if (decimals > 0) {
        numValue = parseFloat(numValue.toFixed(decimals));
      }

      finalValue = String(numValue);
    }

    const validationError = validate(finalValue);
    setInternalError(validationError);

    if (finalValue !== value) {
      onChange?.(finalValue);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    setInternalError("");
  };

  const displayError = error || internalError;

  return (
    <div className={`number-input-wrapper ${className}`}>
      {label && (
        <label className="number-input-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}

      <div
        className={`number-input-container ${focused ? "focused" : ""} ${
          displayError ? "error" : ""
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="number-input"
          inputMode="decimal"
          autoComplete="off"
          {...props}
        />

        {min !== undefined && max !== undefined && (
          <span className="number-input-hint">
            {min} - {max}
          </span>
        )}
      </div>

      {displayError && <div className="number-input-error">{displayError}</div>}
    </div>
  );
}

export default NumberInputEnhanced;
```

### 样式文件（NumberInput.css）

```css
.number-input-wrapper {
  margin-bottom: 16px;
}

.number-input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.required-star {
  color: #f5222d;
  margin-left: 4px;
}

.number-input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 11px;
  transition: all 0.3s;
}

.number-input-container:hover {
  border-color: #40a9ff;
}

.number-input-container.focused {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.number-input-container.error {
  border-color: #f5222d;
}

.number-input-container.error.focused {
  box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
}

.number-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  padding: 0;
  color: #333;
}

.number-input::placeholder {
  color: #bfbfbf;
}

.number-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #00000040;
}

.number-input-hint {
  font-size: 12px;
  color: #8c8c8c;
  margin-left: 8px;
  white-space: nowrap;
}

.number-input-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f5222d;
  line-height: 1.5;
}
```

---

## 高级功能

### 1. 支持千位分隔符

```jsx
function FormattedNumberInput({ value, onChange, ...props }) {
  const [displayValue, setDisplayValue] = useState("");

  // 格式化显示（添加千位分隔符）
  const formatDisplay = (val) => {
    if (!val) return "";
    const parts = val.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  // 移除格式（用于存储原始值）
  const unformat = (val) => {
    return val.replace(/,/g, "");
  };

  useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    const unformatted = unformat(input);

    // 验证
    if (/^\d*\.?\d*$/.test(unformatted)) {
      onChange?.(unformatted);
    }
  };

  const handleFocus = () => {
    // 聚焦时显示原始值（不带分隔符）
    setDisplayValue(value);
  };

  const handleBlur = () => {
    // 失焦时显示格式化值
    setDisplayValue(formatDisplay(value));
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}

// 使用
function App() {
  const [amount, setAmount] = useState("");

  return (
    <div>
      <FormattedNumberInput
        value={amount}
        onChange={setAmount}
        placeholder="输入金额"
      />
      <p>金额: {amount ? `¥${formatDisplay(amount)}` : "¥0.00"}</p>
    </div>
  );
}
```

### 2. 支持单位和前缀

```jsx
function NumberInputWithUnit({ value, onChange, prefix, suffix, ...props }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #d9d9d9",
        borderRadius: "4px",
        padding: "4px 11px",
      }}
    >
      {prefix && (
        <span style={{ marginRight: "8px", color: "#8c8c8c" }}>{prefix}</span>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (/^\d*\.?\d*$/.test(val)) {
            onChange?.(val);
          }
        }}
        style={{ flex: 1, border: "none", outline: "none" }}
        {...props}
      />

      {suffix && (
        <span style={{ marginLeft: "8px", color: "#8c8c8c" }}>{suffix}</span>
      )}
    </div>
  );
}

// 使用
function App() {
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <div>
      <NumberInputWithUnit
        value={price}
        onChange={setPrice}
        prefix="¥"
        placeholder="0.00"
      />

      <NumberInputWithUnit
        value={weight}
        onChange={setWeight}
        suffix="kg"
        placeholder="0"
      />
    </div>
  );
}
```

### 3. 支持步进器（Stepper）

```jsx
function NumberInputWithStepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}) {
  const handleIncrease = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + step;

    if (max === undefined || newValue <= max) {
      onChange?.(String(newValue));
    }
  };

  const handleDecrease = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue - step;

    if (min === undefined || newValue >= min) {
      onChange?.(String(newValue));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        onClick={handleDecrease}
        disabled={min !== undefined && parseFloat(value) <= min}
        style={{
          width: "32px",
          height: "32px",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          cursor: "pointer",
          background: "white",
        }}
      >
        -
      </button>

      <input
        type="text"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (/^\d*$/.test(val)) {
            onChange?.(val);
          }
        }}
        style={{
          width: "80px",
          textAlign: "center",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          padding: "6px 11px",
          outline: "none",
        }}
      />

      <button
        onClick={handleIncrease}
        disabled={max !== undefined && parseFloat(value) >= max}
        style={{
          width: "32px",
          height: "32px",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          cursor: "pointer",
          background: "white",
        }}
      >
        +
      </button>
    </div>
  );
}
```

---

## 完整 Demo 页面

```jsx
import React, { useState } from "react";
import NumberInput from "./NumberInput";

function Demo() {
  const [intValue, setIntValue] = useState("");
  const [decimalValue, setDecimalValue] = useState("");
  const [rangeValue, setRangeValue] = useState("");
  const [negativeValue, setNegativeValue] = useState("");

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>数字输入组件 Demo</h1>

      <div style={{ marginBottom: "24px" }}>
        <h3>1. 整数输入</h3>
        <NumberInput
          value={intValue}
          onChange={setIntValue}
          placeholder="只能输入整数"
        />
        <p style={{ color: "#666" }}>输入值: {intValue || "空"}</p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h3>2. 小数输入（保留2位）</h3>
        <NumberInput
          value={decimalValue}
          onChange={setDecimalValue}
          decimals={2}
          placeholder="0.00"
        />
        <p style={{ color: "#666" }}>输入值: {decimalValue || "0.00"}</p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h3>3. 范围限制（0-100）</h3>
        <NumberInput
          value={rangeValue}
          onChange={setRangeValue}
          min={0}
          max={100}
          placeholder="0-100之间"
        />
        <p style={{ color: "#666" }}>输入值: {rangeValue || "空"}</p>
        <p style={{ fontSize: "12px", color: "#999" }}>
          提示: 失焦时自动限制范围，使用上下箭头调整
        </p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h3>4. 允许负数</h3>
        <NumberInput
          value={negativeValue}
          onChange={setNegativeValue}
          decimals={1}
          allowNegative={true}
          min={-100}
          max={100}
          placeholder="温度 (-100 ~ 100)"
        />
        <p style={{ color: "#666" }}>温度: {negativeValue || "0"}°C</p>
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "16px",
          background: "#f0f2f5",
          borderRadius: "4px",
        }}
      >
        <h4>功能特性：</h4>
        <ul>
          <li>✅ 只允许输入数字</li>
          <li>✅ 支持整数和小数</li>
          <li>✅ 支持负数</li>
          <li>✅ 范围自动限制</li>
          <li>✅ 上下箭头调整值</li>
          <li>✅ 粘贴验证</li>
          <li>✅ 失焦自动格式化</li>
          <li>✅ 完整的 TypeScript 类型支持</li>
        </ul>
      </div>
    </div>
  );
}

export default Demo;
```

---

## 关键技术点

### 1. 正则表达式构建

```javascript
// 整数
/^\d*$/

// 小数（2位）
/^\d*\.?\d{0,2}$/

// 允许负数的整数
/^-?\d*$/

// 允许负数的小数（3位）
/^-?\d*\.?\d{0,3}$/

// 动态构建
function buildPattern(decimals, allowNegative) {
  const negativePrefix = allowNegative ? "-?" : "";
  const decimalPart = decimals > 0 ? `\\.?\\d{0,${decimals}}` : "";
  return new RegExp(`^${negativePrefix}\\d*${decimalPart}$`);
}
```

### 2. 输入事件处理

```javascript
// onChange: 实时验证
const handleChange = (e) => {
  const newValue = e.target.value;
  if (isValid(newValue)) {
    onChange(newValue);
  }
  // 如果不合法，不更新 state，用户看到的是旧值
};

// onBlur: 格式化和范围检查
const handleBlur = (e) => {
  // 1. 格式化（如保留小数位）
  // 2. 范围限制（min/max）
  // 3. 验证提示
};

// onPaste: 粘贴验证
const handlePaste = (e) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData("text");
  if (isValid(pastedText)) {
    onChange(pastedText);
  }
};

// onKeyDown: 特殊按键处理
const handleKeyDown = (e) => {
  // 上下箭头调整值
  // 回车键提交
  // Escape 键取消
};
```

### 3. 移动端优化

```jsx
<input
  inputMode="decimal" // 移动端显示数字键盘
  pattern="[0-9]*" // iOS Safari 优化
  autoComplete="off" // 禁用自动完成
/>
```

---

## 常见问题和解决方案

### Q1: 为什么用 type="text" 而不是 type="number"？

**原因**：

```jsx
// ❌ type="number" 的问题
<input type="number" />

// 问题1: 无法输入前导零 (01, 001)
// 问题2: 无法输入小数点后的零 (1.0, 2.00)
// 问题3: 滚轮会改变值（用户体验差）
// 问题4: e、E、+、- 等字符可以输入
// 问题5: 科学计数法 (1e5)

// ✅ type="text" + 自定义验证
<input type="text" inputMode="decimal" />
// 优点: 完全控制输入行为
```

### Q2: 如何处理复制粘贴？

```javascript
const handlePaste = (e) => {
  e.preventDefault(); // 阻止默认粘贴

  const pastedText = e.clipboardData.getData("text");

  // 清理非数字字符
  const cleaned = pastedText.replace(/[^\d.-]/g, "");

  if (isValidInput(cleaned)) {
    onChange(cleaned);
  }
};
```

### Q3: 如何防止科学计数法？

```javascript
// 用户输入 1e5
const handleChange = (e) => {
  const val = e.target.value;

  // 排除 e 和 E
  if (/[eE]/.test(val)) {
    return; // 不更新
  }

  if (/^\d*\.?\d*$/.test(val)) {
    onChange(val);
  }
};
```

### Q4: 如何处理非受控组件？

```jsx
function UncontrolledNumberInput({ defaultValue = "", onValueChange }) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue) => {
    setValue(newValue);
    onValueChange?.(newValue);
  };

  return <NumberInput value={value} onChange={handleChange} />;
}
```

---

## 测试用例

```jsx
import { render, fireEvent, screen } from "@testing-library/react";
import NumberInput from "./NumberInput";

describe("NumberInput", () => {
  test("只允许输入数字", () => {
    const onChange = jest.fn();
    const { container } = render(<NumberInput value="" onChange={onChange} />);
    const input = container.querySelector("input");

    // 输入数字
    fireEvent.change(input, { target: { value: "123" } });
    expect(onChange).toHaveBeenCalledWith("123");

    // 输入字母
    fireEvent.change(input, { target: { value: "abc" } });
    expect(onChange).not.toHaveBeenCalledWith("abc");
  });

  test("支持小数", () => {
    const onChange = jest.fn();
    const { container } = render(
      <NumberInput value="" onChange={onChange} decimals={2} />
    );
    const input = container.querySelector("input");

    fireEvent.change(input, { target: { value: "12.34" } });
    expect(onChange).toHaveBeenCalledWith("12.34");

    fireEvent.change(input, { target: { value: "12.345" } });
    expect(onChange).not.toHaveBeenCalledWith("12.345");
  });

  test("范围限制", () => {
    const onChange = jest.fn();
    const { container } = render(
      <NumberInput value="50" onChange={onChange} min={0} max={100} />
    );
    const input = container.querySelector("input");

    // 失焦时检查范围
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("100"); // 自动限制为 max
  });
});
```

---

## 总结

### 核心功能清单

✅ **基础功能**

- 只允许输入数字
- 支持小数位数控制
- 支持负数
- 范围限制（min/max）

✅ **用户体验**

- 上下箭头调整值
- 失焦自动格式化
- 粘贴内容验证
- 移动端数字键盘
- 错误提示

✅ **高级功能**

- 千位分隔符
- 前缀/后缀（单位）
- 步进器（Stepper）
- 验证提示
- TypeScript 支持

### 实现要点

| 技术点       | 实现方式                 |
| ------------ | ------------------------ |
| **输入限制** | 正则验证 + onChange 拦截 |
| **格式化**   | onBlur 时处理            |
| **范围限制** | min/max + 失焦检查       |
| **键盘支持** | onKeyDown 监听箭头键     |
| **粘贴处理** | onPaste + 验证           |
| **移动优化** | inputMode="decimal"      |

### 使用建议

```javascript
// ✅ 推荐：使用 type="text" + 自定义验证
<NumberInput type="text" inputMode="decimal" />

// ❌ 不推荐：使用 type="number"
<input type="number" />  // 有很多限制和问题
```

这个组件适用于各种需要数字输入的场景，如价格、数量、年龄、分数等！
