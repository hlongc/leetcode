# JavaScript 项目重构升级为 TypeScript 完整方案

## 问题：一个大型项目之前使用的是 JS 开发，现在想重构升级为 TS，你会怎么设计升级？

---

## 零、如何说服业务方认可升级 TypeScript

### 0.1 业务方最关心的问题

在向业务方提出技术升级时，他们通常会关注以下核心问题：

1. **需要多长时间？** 会不会影响现有需求交付？
2. **需要多少成本？** 人力、时间、风险成本是多少？
3. **能带来什么收益？** 是否能用数据量化？
4. **有什么风险？** 如何保证不影响线上业务？
5. **为什么现在做？** 不做的话会有什么后果？

### 0.2 如何论证收益（业务语言版）

#### 💰 **1. 直接降低线上故障率 → 减少经济损失**

**业务痛点：** 线上 Bug 导致用户流失、交易失败、品牌形象受损

**TypeScript 的价值：**

```
统计数据表明：TypeScript 可减少 15-38% 的线上 Bug（来自 Airbnb 和微软的实际数据）

假设场景：
- 当前每月平均 5 次线上故障，每次故障平均损失：
  - 紧急修复人力成本：2 人 × 4 小时 = 8 人时
  - 客户投诉处理：客服 10 人时
  - 业务损失：订单/流量损失

引入 TS 后预期：
- 减少 20% 的类型相关错误（如 undefined、null 访问）
- 每月减少 1-2 次线上故障
- 年化收益：减少 12-24 次故障 = 节省数十万元损失
```

**举例说明：**

```javascript
// ❌ JavaScript - 线上常见 Bug
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
// 如果 items 意外为 null/undefined，直接报错，影响用户

// ✅ TypeScript - 编译期就能发现问题
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
// 调用时如果传 null，编译时就会报错，开发阶段就能修复
```

#### ⚡ **2. 提升开发效率 → 加快需求交付速度**

**业务痛点：** 新需求开发慢、改一处牵扯多处、上线时间延后

**TypeScript 的价值：**

```
提效数据：
- IDE 智能提示减少 30% 的代码查找时间
- 重构效率提升 50%（有类型保护，放心重构）
- 新人上手速度提升 40%（类型即文档）

实际场景：
- 当前：修改一个 API 接口，需要人工查找所有调用方 → 2 小时
- 升级后：编译器自动检查，1 秒找出所有需要修改的地方 → 10 分钟

时间就是金钱：
- 团队 10 人，每人每天节省 30 分钟 = 每天节省 5 人时
- 一年节省约 1200 人时 = 相当于 1.5 个人力成本
```

#### 🛡️ **3. 降低维护成本 → 减少技术债务**

**业务痛点：** 老代码没人敢动、维护成本越来越高、技术债务累积

**TypeScript 的价值：**

```
维护成本对比：
- JavaScript 项目 1 年后代码可读性下降 60%
- TypeScript 项目由于类型约束，代码更规范，可读性保持在 80% 以上

具体表现：
1. 减少 "这个参数是什么类型？" 的沟通时间
2. 减少 "这个函数怎么用？" 的文档查阅时间
3. 减少 "改了这里会不会影响其他地方？" 的担忧

长期价值：
- 降低新人培训成本
- 降低代码 Review 成本
- 降低项目交接成本
```

#### 📈 **4. 提升代码质量 → 支撑业务规模增长**

**业务痛点：** 业务快速扩张，代码质量跟不上，技术成为业务发展瓶颈

**TypeScript 的价值：**

```
可扩展性：
- 大型项目（10 万行以上）维护难度：TS 比 JS 低 40%
- 多人协作效率：TS 团队沟通成本降低 30%
- 代码重用率：提升 25%

实际案例：
- Slack：迁移 TS 后代码库增长 3 倍，但维护成本仅增长 1.5 倍
- Airbnb：38% 的 Bug 本可通过 TS 避免
- Google：内部大规模使用 TS，提升大型项目开发效率
```

### 0.3 风险控制策略（打消业务顾虑）

#### **顾虑 1：会不会影响现有业务开发？**

**应对策略：**

```
✅ 渐进式迁移方案
- 不需要一次性全部重写
- JS 和 TS 代码可以共存
- 新功能用 TS，老代码排期逐步迁移
- 不影响现有需求的正常交付

具体执行：
- 第 1-2 周：基础设施搭建（不影响业务）
- 第 3 周起：新需求用 TS 开发，旧代码不动
- 每个迭代预留 20% 时间迁移 1-2 个模块
- 预计 6 个月完成核心模块迁移
```

#### **顾虑 2：团队成员不会 TS 怎么办？**

**应对策略：**

```
✅ 培训与实战结合
- 第 1 周：集中培训（2 天，学习基础语法）
- 第 2-4 周：结对编程（老带新）
- 第 5 周起：独立开发（代码 Review 把关）

学习曲线：
- 基础上手：2-3 天（会 JS 的话）
- 熟练使用：2-3 周
- 高级特性：1-2 个月（边用边学）

降低难度：
- 初期使用宽松模式，减少学习负担
- 提供最佳实践文档和代码模板
- 建立内部 Q&A 机制
```

#### **顾虑 3：如果迁移失败怎么办？**

**应对策略：**

```
✅ 分阶段回退机制
- 每个模块迁移前打 Git Tag
- 每个阶段都有回退方案
- 灰度发布，先迁移非核心模块

风险等级分类：
- 低风险模块（工具函数）：优先迁移，失败影响小
- 中风险模块（公共组件）：第二阶段迁移，充分测试
- 高风险模块（核心业务）：最后迁移，双重保障

实际上很难失败：
- TS 完全兼容 JS，最坏情况就是把类型去掉回到 JS
- 业界成功案例众多，方案成熟
```

### 0.4 ROI 计算（投入产出比）

#### **投入成本估算（10 人团队，10 万行代码项目）**

| 成本项         | 时间          | 人力投入      | 折算成本                   |
| -------------- | ------------- | ------------- | -------------------------- |
| 环境搭建与配置 | 1 周          | 1 人全职      | 5 人日                     |
| 团队培训       | 2 天          | 10 人         | 20 人日                    |
| 基础设施迁移   | 2 周          | 2 人全职      | 20 人日                    |
| 业务模块迁移   | 6 个月        | 每人 20% 时间 | 240 人日                   |
| **总投入**     | **约 7 个月** | —             | **≈ 285 人日（1.4 人年）** |

#### **收益估算（第一年）**

| 收益项       | 量化指标                      | 折算收益          |
| ------------ | ----------------------------- | ----------------- |
| 减少线上故障 | 减少 15 次/年 × 20 人时/次    | 300 人日          |
| 提升开发效率 | 10 人 × 30 分钟/天 × 250 天   | 156 人日          |
| 减少维护成本 | 代码可读性提升，节省 10% 时间 | 250 人日          |
| 降低培训成本 | 新人上手快 40%                | 50 人日           |
| **总收益**   | —                             | **≈ 756 人日/年** |

#### **ROI 分析**

```
第一年 ROI = (收益 - 成本) / 成本 × 100%
          = (756 - 285) / 285 × 100%
          = 165%

投资回收期 = 285 / (756 / 12) ≈ 4.5 个月

第二年起，纯收益约 756 人日/年（无额外投入）
```

### 0.5 数据支撑（业界案例）

#### **知名公司的迁移实践**

| 公司          | 项目规模      | 迁移效果                  |
| ------------- | ------------- | ------------------------- |
| **Airbnb**    | 300 万行代码  | 38% 的 Bug 可通过 TS 避免 |
| **Slack**     | 10 万+ 行代码 | 重构效率提升 50%          |
| **Google**    | 数千万行代码  | 大规模项目标准技术栈      |
| **微软**      | VSCode 等项目 | 完全使用 TS 开发          |
| **Bloomberg** | 金融交易系统  | 类型安全提升系统稳定性    |

#### **公开研究数据**

```
来自《To Type or Not to Type: Quantifying Detectable Bugs in JavaScript》论文：
- 分析了 400 个 GitHub 项目
- 结论：TypeScript 可以检测出 15% 的潜在 Bug
- 这些 Bug 在 JavaScript 中只能在运行时发现

来自 Stack Overflow 2023 开发者调查：
- TypeScript 满意度：84.1%（排名第 4）
- TypeScript 使用率：同比增长 25%
- 开发者最想学习的技术：TypeScript 排名第 2
```

### 0.6 沟通话术参考

#### **面对老板/决策者**

> "目前我们每月平均有 X 次线上故障，而根据 Airbnb 的实践，升级到 TypeScript 可以减少 38% 的 Bug。假设我们能减少 20% 的故障，每年可以节省 XX 万元的损失和维护成本。
>
> 我们采用渐进式方案，不影响现有需求交付，预计投入 1.4 人年，但第一年就能收回成本，第二年起每年纯收益约 3 个人月的效率提升。"

#### **面对产品经理**

> "升级到 TypeScript 后，开发在写代码时就能发现很多低级错误，减少了测试环节发现 Bug 的时间。同时智能提示更强，开发效率提升 30%，意味着需求可以更快交付。
>
> 我们会渐进式迁移，每个迭代只用 20% 时间做迁移，不会影响你排需求。"

#### **面对测试团队**

> "TypeScript 的类型检查相当于在编译期自动做了一部分测试工作，可以减少 15% 左右的基础 Bug，你们可以把精力放在更有价值的业务逻辑测试上。
>
> 而且代码质量提升后，回归测试的工作量也会降低。"

#### **面对开发团队**

> "TS 不是为了增加工作量，而是为了让我们写代码更爽：
>
> - 再也不用担心改了一个地方，影响了其他地方
> - 再也不用猜这个参数是什么类型
> - 重构代码时有类型保护，放心大胆地改
>
> 学习成本很低，会 JS 的话 2-3 天就能上手，我们会提供培训和文档支持。"

### 0.7 推进时机选择

**最佳推进时机：**

✅ **技术层面**

- 项目进入稳定期，没有紧急的大需求
- 刚经历过线上故障，业务方痛点明显
- 技术债务累积到一定程度，维护成本高

✅ **业务层面**

- 公司处于快速发展期，需要提升技术能力
- 准备招新人，需要降低培训成本
- 竞争对手已经在用 TS，技术落后有压力

✅ **团队层面**

- 团队有 1-2 个熟悉 TS 的人可以带
- 团队成员技术意愿强，愿意学习新技术
- 团队稳定，近期没有人员调整计划

**不建议推进的时机：**

❌ 正在进行重大版本迭代
❌ 团队人员大幅变动期
❌ 公司业务面临重大挑战，需求压力极大

### 0.8 总结：说服业务方的核心要点

#### **三个必须讲清楚的点**

1. **能带来什么价值**（用数据说话）

   - 减少线上故障 15-38%
   - 提升开发效率 30%
   - ROI 165%，4.5 个月回本

2. **怎么控制风险**（打消顾虑）

   - 渐进式迁移，不影响业务
   - 培训跟上，学习曲线平缓
   - 分阶段验证，可随时回退

3. **为什么现在做**（必要性 + 紧迫性）
   - 技术债务持续累积，越晚越难改
   - 业界趋势，竞争对手已在用
   - 团队成长需要，提升技术竞争力

#### **关键成功因素**

- ✅ 找到业务痛点，将技术收益翻译成业务语言
- ✅ 准备充分的数据和案例，增强说服力
- ✅ 提供详细的实施方案，降低决策风险
- ✅ 先做小范围试点，用结果说话
- ✅ 获得团队支持，形成内部推动力

---

## 一、前期准备与评估阶段

### 1.1 项目调研与评估

- **项目规模评估**

  - 统计项目总文件数、代码行数
  - 识别核心模块、公共库、工具函数
  - 评估第三方依赖的 TypeScript 支持情况
  - 评估团队成员的 TypeScript 熟悉程度

- **风险评估**

  - 识别关键业务模块（优先级低，风险高）
  - 识别边缘模块（优先级高，风险低）
  - 评估现有测试覆盖率
  - 评估项目构建工具的兼容性

- **收益分析**
  - 类型安全带来的错误减少
  - 代码可维护性提升
  - IDE 智能提示改善
  - 重构成本与时间投入

### 1.2 制定迁移策略

选择以下任一策略或组合：

**策略一：渐进式迁移（推荐）**

- 新代码使用 TypeScript 编写
- 旧代码逐步迁移，优先级从低到高
- JavaScript 和 TypeScript 代码共存
- 适合大型项目，风险可控

**策略二：模块化迁移**

- 按模块或功能域逐一迁移
- 先迁移底层公共模块，再迁移上层业务模块
- 每个模块迁移后进行充分测试
- 适合模块化程度高的项目

**策略三：大爆炸式迁移（不推荐）**

- 一次性将所有 JS 文件重命名为 TS
- 逐一修复类型错误
- 风险高，仅适合小型项目

---

## 二、技术准备阶段

### 2.1 配置 TypeScript 环境

#### 安装依赖

```bash
# 安装 TypeScript
npm install --save-dev typescript

# 安装类型定义
npm install --save-dev @types/node
npm install --save-dev @types/react @types/react-dom  # 如果是 React 项目

# 安装其他工具
npm install --save-dev ts-node  # 用于直接运行 TS 文件
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

#### 创建 tsconfig.json

**初期配置（宽松，便于迁移）**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "outDir": "./dist",
    "rootDir": "./src",

    // 允许 JS 和 TS 混合编译
    "allowJs": true,
    "checkJs": false,

    // 宽松的类型检查（初期）
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,

    // 模块解析
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    // 其他配置
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // 路径别名
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**目标配置（严格，逐步启用）**

```json
{
  "compilerOptions": {
    // ... 其他配置保持不变

    // 逐步启用严格模式
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // 额外的检查
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2.2 配置构建工具

#### Webpack 配置

```javascript
// webpack.config.js
module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
};
```

#### 配置 ESLint

```javascript
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint"],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn", // 初期设为 warn
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
```

### 2.3 准备类型声明

#### 为第三方库安装类型定义

```bash
# 检查并安装缺失的类型定义
npm install --save-dev @types/lodash
npm install --save-dev @types/axios
npm install --save-dev @types/express
# ... 根据项目依赖安装
```

#### 为没有类型定义的库创建声明文件

```typescript
// types/custom.d.ts
declare module "some-untyped-library" {
  export function someFunction(param: string): void;
}

// 声明全局变量
declare global {
  interface Window {
    __APP_CONFIG__: {
      apiUrl: string;
      env: string;
    };
  }
}

export {};
```

---

## 三、迁移实施阶段

### 3.1 迁移优先级规划

**优先级排序：**

1. **第一优先级：基础设施层**

   - 工具函数（utils）
   - 常量定义（constants）
   - 配置文件
   - 类型定义文件

2. **第二优先级：公共模块层**

   - 公共组件
   - 公共 Hooks
   - API 接口层
   - 数据模型定义

3. **第三优先级：业务模块层**
   - 边缘业务模块（使用频率低）
   - 次要业务模块
   - 核心业务模块（最后迁移，风险最低）

### 3.2 迁移具体步骤

#### Step 1: 重命名文件

```bash
# 批量重命名（谨慎使用）
find src -name "*.js" -exec bash -c 'mv "$0" "${0%.js}.ts"' {} \;
find src -name "*.jsx" -exec bash -c 'mv "$0" "${0%.jsx}.tsx"' {} \;
```

或者手动逐个重命名，确保 Git 能追踪到文件重命名。

#### Step 2: 修复编译错误

**常见错误及解决方案：**

```typescript
// 1. 隐式 any 类型
// ❌ 错误
function add(a, b) {
  return a + b;
}

// ✅ 修复
function add(a: number, b: number): number {
  return a + b;
}

// 2. 可能为 null 或 undefined
// ❌ 错误
const user = getUserById(id);
console.log(user.name); // Object is possibly 'null'

// ✅ 修复方案 1: 可选链
console.log(user?.name);

// ✅ 修复方案 2: 类型守卫
if (user) {
  console.log(user.name);
}

// ✅ 修复方案 3: 非空断言（确定不为 null 时）
console.log(user!.name);

// 3. 导入/导出问题
// ❌ 错误
import utils from "./utils"; // Module has no default export

// ✅ 修复
import * as utils from "./utils";
// 或
import { specificUtil } from "./utils";

// 4. 事件处理类型
// ❌ 错误
const handleClick = (e) => {
  console.log(e.target.value);
};

// ✅ 修复
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log((e.target as HTMLButtonElement).value);
};

// 5. 第三方库缺少类型
// ❌ 错误
import someLib from "untyped-lib"; // Could not find declaration file

// ✅ 修复：创建类型声明
// types/untyped-lib.d.ts
declare module "untyped-lib" {
  export default function someLib(): void;
}
```

#### Step 3: 添加类型定义

**定义数据模型**

```typescript
// models/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string; // API 返回的是字符串
}

// 类型转换函数
export function toUser(dto: UserDTO): User {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
  };
}
```

**定义 API 接口**

```typescript
// api/user.ts
import { User, UserDTO, toUser } from "@/models/user";

export interface GetUserResponse {
  code: number;
  data: UserDTO;
  message: string;
}

export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const json: GetUserResponse = await response.json();
  return toUser(json.data);
}
```

**定义 React 组件**

```typescript
// components/UserCard.tsx
import React from "react";
import { User } from "@/models/user";

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className = "",
}) => {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && <button onClick={() => onEdit(user)}>编辑</button>}
    </div>
  );
};
```

#### Step 4: 渐进式启用严格模式

在 tsconfig.json 中逐步启用严格检查：

```json
{
  "compilerOptions": {
    // 第一阶段：基础类型检查
    "noImplicitAny": true,

    // 第二阶段：空值检查
    "strictNullChecks": true,

    // 第三阶段：函数类型检查
    "strictFunctionTypes": true,

    // 第四阶段：全部严格模式
    "strict": true
  }
}
```

或者使用文件级别的严格模式：

```typescript
// 在文件顶部添加
// @ts-strict

// 或临时关闭某个文件的严格检查
// @ts-nocheck
```

### 3.3 处理复杂场景

#### 场景 1: 动态属性访问

```typescript
// ❌ 问题代码
const data: any = {};
data[dynamicKey] = value;

// ✅ 解决方案 1: 使用索引签名
interface DynamicData {
  [key: string]: string | number | boolean;
}
const data: DynamicData = {};
data[dynamicKey] = value;

// ✅ 解决方案 2: 使用 Record
const data: Record<string, unknown> = {};
data[dynamicKey] = value;
```

#### 场景 2: 高阶组件

```typescript
// HOC 类型定义
import React from "react";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface InjectedProps {
  user: User;
  isLoading: boolean;
}

export function withUser<P extends InjectedProps>(
  Component: React.ComponentType<P>
) {
  return class extends React.Component<Omit<P, keyof InjectedProps>> {
    render() {
      const injected = {
        user: {
          /* ... */
        },
        isLoading: false,
      } as InjectedProps;

      return <Component {...injected} {...(this.props as P)} />;
    }
  };
}
```

#### 场景 3: Redux 状态管理

```typescript
// store/types.ts
export interface RootState {
  user: UserState;
  posts: PostsState;
}

export interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

// actions/user.ts
export enum UserActionTypes {
  FETCH_USER_REQUEST = "FETCH_USER_REQUEST",
  FETCH_USER_SUCCESS = "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE = "FETCH_USER_FAILURE",
}

interface FetchUserRequestAction {
  type: typeof UserActionTypes.FETCH_USER_REQUEST;
}

interface FetchUserSuccessAction {
  type: typeof UserActionTypes.FETCH_USER_SUCCESS;
  payload: User;
}

interface FetchUserFailureAction {
  type: typeof UserActionTypes.FETCH_USER_FAILURE;
  payload: string;
}

export type UserAction =
  | FetchUserRequestAction
  | FetchUserSuccessAction
  | FetchUserFailureAction;

// 使用 TypeScript 的类型推断
export const fetchUserRequest = (): FetchUserRequestAction => ({
  type: UserActionTypes.FETCH_USER_REQUEST,
});

// reducers/user.ts
import { UserState, UserAction, UserActionTypes } from "../types";

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

export function userReducer(
  state = initialState,
  action: UserAction
): UserState {
  switch (action.type) {
    case UserActionTypes.FETCH_USER_REQUEST:
      return { ...state, isLoading: true };
    case UserActionTypes.FETCH_USER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        currentUser: action.payload, // TypeScript 知道这里有 payload
      };
    case UserActionTypes.FETCH_USER_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}
```

#### 场景 4: 泛型工具函数

```typescript
// utils/array.ts

// 数组去重
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// 数组分组
export function groupBy<T, K extends keyof any>(
  arr: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = key(item);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

// 使用示例
const users: User[] = [
  /* ... */
];
const groupedByRole = groupBy(users, (user) => user.role);
```

---

## 四、质量保证阶段

### 4.1 测试策略

#### 单元测试

```typescript
// __tests__/utils.test.ts
import { add } from "../utils";

describe("add", () => {
  it("should add two numbers correctly", () => {
    expect(add(1, 2)).toBe(3);
  });

  it("should handle negative numbers", () => {
    expect(add(-1, -2)).toBe(-3);
  });
});
```

#### 类型测试

```typescript
// __tests__/types.test.ts

// 使用 dtslint 或自定义类型测试
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

// 测试类型推导
type TestCase1 = Equals<ReturnType<typeof getUserById>, Promise<User>>;
const test1: TestCase1 = true; // 如果类型不匹配会报错
```

### 4.2 代码审查清单

**审查要点：**

- [ ] 是否有使用 `any` 类型？能否替换为更具体的类型？
- [ ] 是否正确处理了 `null` 和 `undefined`？
- [ ] 数组、对象的类型是否明确？
- [ ] 函数参数和返回值是否有类型注解？
- [ ] 是否有类型断言？是否合理？
- [ ] 接口定义是否准确反映数据结构？
- [ ] 是否充分利用了类型推断，避免冗余类型注解？
- [ ] 是否有循环依赖问题？

### 4.3 性能检查

```bash
# 检查编译时间
tsc --diagnostics

# 检查项目引用，提升编译速度
# tsconfig.json
{
  "references": [
    { "path": "./packages/common" },
    { "path": "./packages/utils" }
  ]
}
```

---

## 五、持续改进阶段

### 5.1 建立规范

#### 编码规范

```typescript
// 1. 优先使用 interface 而非 type（用于对象类型）
// ✅ 推荐
interface User {
  id: string;
  name: string;
}

// ❌ 不推荐（除非需要联合类型等高级功能）
type User = {
  id: string;
  name: string;
};

// 2. 使用 readonly 保护不可变数据
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// 3. 明确标注可选属性
interface UserProfile {
  name: string;
  bio?: string; // 明确标注可选
}

// 4. 避免过度使用类型断言
// ❌ 不好
const user = data as User;

// ✅ 更好：使用类型守卫
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" && data !== null && "id" in data && "name" in data
  );
}

if (isUser(data)) {
  console.log(data.name); // TypeScript 知道这里是 User 类型
}
```

#### Git 提交规范

```
feat(ts): migrate utils module to TypeScript
fix(ts): resolve type errors in UserCard component
refactor(ts): improve type definitions for API layer
```

### 5.2 团队培训

**培训内容：**

1. TypeScript 基础语法
2. 常见类型定义模式
3. 泛型的使用
4. 高级类型（联合类型、交叉类型、条件类型）
5. 实战案例分享

### 5.3 持续监控

#### 使用工具监控类型覆盖率

```bash
# 安装 type-coverage
npm install --save-dev type-coverage

# 检查类型覆盖率
npx type-coverage --detail

# 设置最低覆盖率要求
npx type-coverage --at-least 95
```

#### 在 CI/CD 中集成类型检查

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npm run type-check
      - name: Check type coverage
        run: npx type-coverage --at-least 90
```

---

## 六、常见问题与解决方案

### 6.1 第三方库兼容性问题

**问题：** 第三方库没有类型定义

**解决方案：**

```typescript
// 1. 查找 @types 包
npm install --save-dev @types/library-name

// 2. 如果没有，创建自定义声明文件
// types/library-name.d.ts
declare module 'library-name' {
  export function method(param: string): void;
}

// 3. 临时方案：使用 any
declare module 'library-name';
```

### 6.2 构建工具兼容性

**问题：** Webpack loader 配置冲突

**解决方案：**

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          "babel-loader",
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true, // 加快编译速度
            },
          },
        ],
      },
    ],
  },
};
```

### 6.3 性能问题

**问题：** 大型项目编译速度慢

**优化方案：**

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true, // 启用增量编译
    "skipLibCheck": true // 跳过声明文件检查
  },
  // 使用项目引用
  "references": [{ "path": "./packages/core" }, { "path": "./packages/utils" }]
}
```

```javascript
// webpack.config.js - 使用 fork-ts-checker-webpack-plugin
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: true, // 异步类型检查
    }),
  ],
};
```

---

## 七、迁移时间规划（示例）

### 阶段 1: 准备阶段（1-2 周）

- 环境配置
- 团队培训
- 工具链搭建
- 迁移方案确定

### 阶段 2: 基础设施迁移（2-3 周）

- 工具函数迁移
- 类型定义创建
- 公共组件迁移

### 阶段 3: 业务模块迁移（4-8 周）

- 边缘模块迁移
- 核心模块迁移
- 持续测试与修复

### 阶段 4: 优化与收尾（1-2 周）

- 代码审查
- 性能优化
- 文档完善

---

## 八、总结与最佳实践

### 核心原则

1. **渐进式迁移**：不要一次性改动过大
2. **从底层到上层**：先迁移公共模块
3. **测试驱动**：每次迁移后充分测试
4. **严格度逐步提升**：先宽松后严格
5. **团队协作**：统一规范，定期 Review

### 成功关键

- ✅ 充分的前期规划
- ✅ 清晰的迁移路径
- ✅ 完善的测试覆盖
- ✅ 团队的技术支持
- ✅ 持续的质量监控

### 避免的陷阱

- ❌ 过度使用 `any` 类型
- ❌ 忽略编译警告
- ❌ 缺少类型测试
- ❌ 迁移过快导致业务风险
- ❌ 团队成员技能参差不齐

---

## 附录：工具与资源

### 推荐工具

- **TypeScript Playground**: 在线测试 TS 代码
- **ts-migrate**: Airbnb 开源的迁移工具
- **type-coverage**: 类型覆盖率检查
- **dts-gen**: 自动生成类型定义

### 学习资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### 迁移案例参考

- Airbnb 的 TS 迁移实践
- Slack 的渐进式迁移
- Google 内部大规模 TS 应用
