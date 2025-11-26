# Automa Web 重构架构设计文档

## 📋 目录
1. [架构概览](#架构概览)
2. [核心设计原则](#核心设计原则)
3. [插件模式 vs Web 架构对比](#插件模式-vs-web-架构对比)
4. [标准数据结构](#标准数据结构)
5. [执行环境抽象](#执行环境抽象)
6. [快速开始](#快速开始)
7. [实施路线图](#实施路线图)

---

## 架构概览

### 核心理念
将 **"UI 编排层"** 与 **"执行逻辑层"** 完全解耦，前端成为"指令生成器"而非"执行器"。

### 架构分层

```
┌─────────────────────────────────────────────────────┐
│          Presentation Layer (展示层)                 │
│   Vue 3 + vue-flow 可视化工作流编辑器                │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│          Domain Layer (领域层)                       │
│   Workflow Entity, Node Graph, Action Definition    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│        Application Layer (应用层)                    │
│   Workflow Compiler: 编译为标准 JSON 执行计划        │
└────────────────┬────────────────────────────────────┘
                 │
                 │ WorkflowExecutionPlan (JSON)
                 │
┌────────────────▼────────────────────────────────────┐
│      Infrastructure Layer (基础设施层)               │
│   Runtime Adapter Interface (执行器抽象接口)         │
└─┬──────────────┬──────────────┬─────────────────────┘
  │              │              │
  ▼              ▼              ▼
┌─────┐      ┌──────┐      ┌───────┐
│Mock │      │扩展版│      │远程版│
│执行器│      │执行器│      │执行器│
└─────┘      └──────┘      └───────┘
```

---

## 核心设计原则

### 1. 单一职责原则 (SRP)
- **UI 层**：只负责可视化编排和用户交互
- **领域层**：只负责业务模型定义
- **应用层**：只负责编译和验证
- **基础设施层**：只负责执行

### 2. 依赖倒置原则 (DIP)
- 高层模块（UI）不依赖低层模块（执行器）
- 两者都依赖于抽象接口（`ActionDescriptor`, `RuntimeAdapter`）

### 3. 开闭原则 (OCP)
- 对扩展开放：新增动作类型、新增执行器
- 对修改封闭：不修改核心接口

### 4. 接口隔离原则 (ISP)
- `ActionDescriptor`：描述"做什么"
- `RuntimeAdapter`：定义"怎么做"
- 两者完全解耦

---

## 插件模式 vs Web 架构对比

### 旧架构：浏览器插件模式

```typescript
// ❌ 旧代码：直接调用 Chrome API
class OldClickHandler {
  async execute(blockData) {
    // 1. 直接操作 DOM
    const element = document.querySelector(blockData.selector);
    element.click();

    // 2. 直接调用浏览器 API
    chrome.tabs.query({ active: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'click' });
    });

    return { data: 'clicked' };
  }
}
```

**问题**：
- ❌ UI 逻辑与执行逻辑强耦合
- ❌ 无法在 Web 环境运行
- ❌ 难以测试和模拟
- ❌ 难以迁移到其他平台

---

### 新架构：Web 模式（解耦设计）

```typescript
// ✅ 新架构：生成标准化的执行计划

// Step 1: UI 层 - 用户配置
const uiNodeData = {
  type: 'click',
  selector: '#submit-button',
  clickType: 'left'
};

// Step 2: 编译层 - 生成标准 ActionDescriptor
const action: ActionDescriptor = {
  type: ActionType.CLICK,
  payload: {
    selector: {
      type: 'css',
      value: '#submit-button'
    },
    clickType: 'left'
  }
};

// Step 3: 执行层 - 由适配器决定如何执行
const runner: RuntimeAdapter = new MockRuntimeAdapter();
const result = await runner.executeAction(action, context);
```

**优势**：
- ✅ UI 与执行完全解耦
- ✅ 可在任何环境运行（Web、桌面、移动端）
- ✅ 易于测试和模拟
- ✅ 支持多种执行器（Mock、Extension、Remote）

---

## 标准数据结构

### WorkflowExecutionPlan (核心 JSON Schema)

这是 **UI 编排层** 与 **执行逻辑层** 之间的契约。

```typescript
interface WorkflowExecutionPlan {
  // 基本信息
  id: string;
  name: string;
  version: string;
  createdAt: number;

  // 执行配置
  config: {
    mode: 'sequential' | 'parallel' | 'conditional';
    onError: 'stop' | 'continue' | 'retry';
    stepDelay?: number;
    timeout?: number;
  };

  // 执行步骤（核心）
  steps: ExecutionStep[];

  // 执行上下文
  context: {
    variables: Record<string, any>;
    table: any[];
    loopData: Record<string, any>;
    globalData: Record<string, any>;
  };

  // 元数据
  metadata: {
    sourceWorkflowId: string;
    compiler: string;
    compilerVersion: string;
  };
}
```

### ExecutionStep (单个步骤)

```typescript
interface ExecutionStep {
  id: string;
  name: string;
  type: string;

  // 核心：动作描述符
  action: ActionDescriptor;

  // 执行条件
  condition?: ConditionExpression;

  // 路由规则
  next: {
    default?: string;
    branches?: ConditionalBranch[];
    onError?: string;
  };

  // 配置
  config: {
    skippable?: boolean;
    timeout?: number;
    retry?: RetryPolicy;
  };
}
```

### ActionDescriptor (动作描述符)

```typescript
interface ActionDescriptor {
  // 动作类型（枚举）
  type: ActionType; // 'navigate' | 'click' | 'type' | 'extract' | ...

  // 动作参数（类型安全的联合类型）
  payload: ActionPayload;

  // 输出定义
  output?: {
    variable: string;
    path?: string;
    transform?: DataTransform[];
  };
}
```

### 完整示例：登录流程

```json
{
  "id": "wf-login-001",
  "name": "User Login Flow",
  "version": "1.0.0",
  "createdAt": 1704067200000,
  "config": {
    "mode": "sequential",
    "onError": "stop",
    "stepDelay": 1000,
    "saveLog": true
  },
  "steps": [
    {
      "id": "step-1",
      "name": "Navigate to Login Page",
      "type": "navigate",
      "action": {
        "type": "navigate",
        "payload": {
          "url": "https://example.com/login",
          "waitUntil": "load"
        }
      },
      "next": { "default": "step-2" },
      "config": {}
    },
    {
      "id": "step-2",
      "name": "Type Username",
      "type": "type",
      "action": {
        "type": "type",
        "payload": {
          "selector": { "type": "css", "value": "#username" },
          "text": "{{username}}",
          "clearBefore": true
        }
      },
      "next": { "default": "step-3" },
      "config": {}
    },
    {
      "id": "step-3",
      "name": "Click Login Button",
      "type": "click",
      "action": {
        "type": "click",
        "payload": {
          "selector": { "type": "css", "value": "#login-button" },
          "clickType": "left",
          "humanLike": true
        }
      },
      "next": { "default": null },
      "config": {}
    }
  ],
  "context": {
    "variables": {
      "username": "demo@example.com",
      "password": "SecurePass123!"
    },
    "table": [],
    "loopData": {},
    "globalData": {}
  },
  "metadata": {
    "sourceWorkflowId": "wf-login-001",
    "compiler": "AutomaWebCompiler",
    "compilerVersion": "2.0.0"
  }
}
```

---

## 执行环境抽象

### RuntimeAdapter 接口

```typescript
interface RuntimeAdapter {
  readonly name: string;
  readonly type: 'mock' | 'extension' | 'remote';

  // 执行整个工作流
  execute(plan: WorkflowExecutionPlan): Promise<ExecutionResult>;

  // 执行单个动作
  executeAction(
    action: ActionDescriptor,
    context: ExecutionContext
  ): Promise<ActionResult>;

  // 控制方法
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;

  // 状态查询
  getStatus(): ExecutionStatus;

  // 事件订阅
  on(event: ExecutionEvent, handler: EventHandler): void;
}
```

### 三种执行器实现

#### 1. MockRuntimeAdapter (模拟执行器)
- **用途**：前端开发、演示、测试
- **特点**：
  - 完全在前端运行
  - 控制台输出美化日志
  - 模拟执行延迟和结果
  - 无需后端支持

```typescript
const runner = new MockRuntimeAdapter();
const result = await runner.execute(workflowPlan);
// 控制台输出彩色日志，模拟执行过程
```

#### 2. ExtensionRuntimeAdapter (插件执行器)
- **用途**：作为浏览器扩展运行
- **特点**：
  - 调用 Chrome/Firefox API
  - 在 content script 中执行 DOM 操作
  - 真实的浏览器自动化

```typescript
const runner = new ExtensionRuntimeAdapter();
const result = await runner.execute(workflowPlan);
// 实际操作浏览器
```

#### 3. RemoteRuntimeAdapter (远程执行器)
- **用途**：连接到后端或桌面 Agent
- **特点**：
  - 通过 HTTP/WebSocket 通信
  - 由后端或桌面程序实际执行
  - 支持云端调度

```typescript
const runner = new RemoteRuntimeAdapter({
  apiEndpoint: 'https://api.example.com',
  websocket: 'wss://ws.example.com'
});
const result = await runner.execute(workflowPlan);
// 发送到远程执行
```

---

## 快速开始

### 1. 查看核心接口定义
```bash
# 查看完整的 TypeScript 接口定义
cat architecture-design/core-interfaces.ts
```

### 2. 查看点击动作的抽象化示例
```bash
# 查看如何将"点击元素"抽象化
cat architecture-design/example-click-abstraction.ts
```

### 3. 运行 Mock Runner
```typescript
// 在浏览器控制台中运行
import { runMockWorkflowExample } from './mock-runner';

// 执行示例工作流
const result = await runMockWorkflowExample();

// 查看执行结果
console.log('Execution Result:', result);
```

### 4. 创建自定义工作流
```typescript
import {
  WorkflowExecutionPlan,
  ActionType,
  MockRuntimeAdapter
} from './core-interfaces';

// 1. 定义执行计划
const plan: WorkflowExecutionPlan = {
  id: 'my-workflow',
  name: 'My Custom Workflow',
  version: '1.0.0',
  createdAt: Date.now(),
  config: {
    mode: 'sequential',
    onError: 'stop',
    stepDelay: 1000,
    saveLog: true
  },
  steps: [
    {
      id: 'step-1',
      name: 'Open Website',
      type: 'navigate',
      action: {
        type: ActionType.NAVIGATE,
        payload: {
          url: 'https://example.com',
          waitUntil: 'load'
        }
      },
      next: { default: 'step-2' },
      config: {}
    },
    // ... 更多步骤
  ],
  context: {
    variables: {},
    table: [],
    loopData: {},
    globalData: {}
  },
  metadata: {
    sourceWorkflowId: 'my-workflow',
    compiler: 'CustomCompiler',
    compilerVersion: '1.0.0'
  }
};

// 2. 执行工作流
const runner = new MockRuntimeAdapter();
const result = await runner.execute(plan);

console.log('Success:', result.success);
console.log('Logs:', result.logs);
```

---

## 实施路线图

### Phase 1: 基础架构搭建 (2-3 周)

**目标**：建立核心接口和 Mock Runner

- [ ] 实现 `core-interfaces.ts` 中的所有接口
- [ ] 实现 `MockRuntimeAdapter`
- [ ] 实现基础的 `WorkflowCompiler`
- [ ] 单元测试覆盖率 > 80%

**交付物**：
- 可运行的 Mock Runner
- 完整的 TypeScript 类型定义
- 单元测试套件

---

### Phase 2: UI 层重构 (3-4 周)

**目标**：重构 Vue 3 可视化编辑器

- [ ] 重构节点编辑器（基于 vue-flow）
- [ ] 实现 Block 组件库（对应 56 种动作类型）
- [ ] 实现 `WorkflowBuilder` 服务
- [ ] 实现"编译"和"预览 JSON"功能

**交付物**：
- 现代化的可视化编辑器
- 支持导出标准 JSON 执行计划

---

### Phase 3: 执行器实现 (4-5 周)

**目标**：实现真实的执行器

#### 3.1 插件执行器
- [ ] 实现 `ExtensionRuntimeAdapter`
- [ ] 适配 Chrome MV3 API
- [ ] 适配 Firefox API
- [ ] Content Script 通信层

#### 3.2 远程执行器
- [ ] 实现 `RemoteRuntimeAdapter`
- [ ] 设计 WebSocket 协议
- [ ] 实现重连和错误处理
- [ ] 实现执行状态同步

**交付物**：
- 可在浏览器插件中运行
- 可连接到远程后端/桌面 Agent

---

### Phase 4: 高级特性 (3-4 周)

**目标**：实现高级功能

- [ ] 条件分支和循环
- [ ] 变量系统和模板引擎
- [ ] 数据提取和转换管道
- [ ] 错误处理和重试策略
- [ ] 执行日志和调试工具

**交付物**：
- 完整的低代码平台功能
- 调试和监控工具

---

### Phase 5: 优化和发布 (2-3 周)

**目标**：性能优化和用户体验

- [ ] 性能优化（编译、执行）
- [ ] UI/UX 优化
- [ ] 文档和示例
- [ ] 部署和发布

**交付物**：
- 生产就绪的 Web 应用
- 完整的用户文档

---

## 关键技术决策

### 1. 为什么选择 JSON 作为执行计划格式？

**优势**：
- ✅ 语言无关（可被任何语言解析）
- ✅ 易于序列化和传输
- ✅ 易于存储和版本管理
- ✅ 易于调试和查看

**示例**：同一个 JSON 可以被：
- 前端 Mock Runner 模拟
- 浏览器插件执行
- Node.js 后端执行
- Python 桌面 Agent 执行

### 2. 为什么使用 ActionDescriptor 抽象？

**问题**：不同环境对"点击元素"的实现完全不同

**解决方案**：定义统一的"意图"描述

```typescript
// 统一的意图描述
const action: ActionDescriptor = {
  type: ActionType.CLICK,
  payload: {
    selector: { type: 'css', value: '#button' }
  }
};

// 不同的实现
// 1. Mock: console.log('Clicked #button')
// 2. Extension: document.querySelector('#button').click()
// 3. Remote: fetch('/api/click', { body: action })
```

### 3. 为什么需要 RuntimeAdapter 接口？

**问题**：执行环境多样化

**解决方案**：适配器模式

```typescript
interface RuntimeAdapter {
  execute(plan): Promise<Result>;
}

// 前端开发时
const runner = new MockRuntimeAdapter();

// 生产环境
const runner = new ExtensionRuntimeAdapter();

// 未来扩展
const runner = new ElectronRuntimeAdapter();
const runner = new PlaywrightRuntimeAdapter();
```

---

## 最佳实践

### 1. 动作设计原则

**描述"做什么"，而不是"怎么做"**

```typescript
// ❌ 错误：包含实现细节
{
  type: 'executeJavaScript',
  payload: {
    code: 'document.querySelector("#btn").click()'
  }
}

// ✅ 正确：描述意图
{
  type: 'click',
  payload: {
    selector: { type: 'css', value: '#btn' }
  }
}
```

### 2. 错误处理策略

**在执行层处理错误，而不是 UI 层**

```typescript
// ✅ 正确：在配置中声明策略
{
  config: {
    onError: 'retry',
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential'
    }
  }
}
```

### 3. 变量和模板

**支持动态数据引用**

```typescript
{
  action: {
    type: 'type',
    payload: {
      selector: { type: 'css', value: '#input' },
      text: '{{username}}' // 模板变量
    }
  }
}
```

---

## 总结

### 核心价值

1. **彻底解耦**：UI 编排与执行逻辑完全分离
2. **环境无关**：同一个工作流可在多种环境运行
3. **易于扩展**：新增动作类型和执行器无需修改核心代码
4. **易于测试**：Mock Runner 支持快速验证和调试
5. **面向未来**：为云端调度、分布式执行预留空间

### 对比总结

| 特性 | 旧架构（插件模式） | 新架构（Web 模式） |
|------|-------------------|-------------------|
| **UI 与执行** | 强耦合 | 完全解耦 |
| **执行环境** | 仅浏览器插件 | Mock/Extension/Remote |
| **测试难度** | 困难（需要浏览器环境） | 简单（Mock Runner） |
| **迁移性** | 差（依赖 Chrome API） | 优（标准 JSON） |
| **扩展性** | 低 | 高（适配器模式） |
| **调试体验** | 差 | 优（彩色日志、步骤追踪） |

---

## 文件清单

```
architecture-design/
├── README.md                         # 本文档
├── core-interfaces.ts                # 核心接口定义（200+ 行）
├── example-click-abstraction.ts      # 点击动作抽象化示例
└── mock-runner.ts                    # Mock Runner 完整实现
```

---

## 联系和贡献

如有疑问或建议，请联系架构团队。

**让我们一起构建下一代的浏览器自动化平台！** 🚀
