# Automa Web 架构流程图

本文档包含 Automa Web 重构的所有架构流程图。

## 1. 整体架构分层图

```mermaid
graph TB
    subgraph "用户界面层 (Presentation Layer)"
        A1[Vue 3 可视化编辑器]
        A2[工作流管理界面]
        A3[执行监控界面]
    end

    subgraph "领域模型层 (Domain Layer)"
        B1[Workflow Entity<br/>工作流实体]
        B2[Node/Edge Graph<br/>节点图模型]
        B3[Action Definition<br/>动作定义]
        B4[Execution Context<br/>执行上下文]
    end

    subgraph "应用服务层 (Application Layer)"
        C1[Workflow Builder<br/>工作流构建器]
        C2[Workflow Compiler<br/>工作流编译器]
        C3[Validation Service<br/>验证服务]
        C4[Template Engine<br/>模板引擎]
    end

    subgraph "基础设施层 (Infrastructure Layer)"
        D1[Runtime Adapter<br/>运行时适配器接口]
        D2[Event Bus<br/>事件总线]
        D3[Storage Service<br/>存储服务]
    end

    subgraph "执行器实现 (Runtime Implementations)"
        E1[Mock Runner<br/>模拟执行器]
        E2[Extension Runner<br/>插件执行器]
        E3[Remote Runner<br/>远程执行器]
    end

    A1 --> B1
    A2 --> B2
    A3 --> D2

    B1 --> C1
    B2 --> C2
    B3 --> C2
    B4 --> C4

    C1 --> C2
    C2 --> C3
    C2 --> D1

    D1 --> E1
    D1 --> E2
    D1 --> E3

    C2 -.生成.-> JSON[WorkflowExecutionPlan<br/>标准 JSON]
    JSON -.输入.-> D1

    E1 -.输出.-> F1[控制台日志]
    E2 -.输出.-> F2[Chrome API]
    E3 -.输出.-> F3[HTTP/WebSocket]

    style JSON fill:#ff6b6b,stroke:#c92a2a,color:#fff,stroke-width:3px
    style D1 fill:#4ecdc4,stroke:#087f5b,color:#fff,stroke-width:3px
    style C2 fill:#ffd93d,stroke:#f08c00,color:#000,stroke-width:3px
```

---

## 2. 工作流编译流程

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant UI as 🖼️ Vue Editor
    participant Builder as 🏗️ Workflow Builder
    participant Compiler as ⚙️ Workflow Compiler
    participant Validator as ✅ Validator
    participant JSON as 📄 Execution Plan

    User->>UI: 拖拽节点、配置参数
    UI->>UI: 生成 Vue Flow Graph

    User->>UI: 点击"编译"按钮
    UI->>Builder: buildWorkflow(graph)

    Builder->>Builder: 遍历节点和边
    Builder->>Builder: 提取配置数据
    Builder->>Compiler: compile(workflow)

    Compiler->>Compiler: 分析节点依赖
    Compiler->>Compiler: 生成执行步骤
    Compiler->>Compiler: 处理条件分支
    Compiler->>Compiler: 注入上下文

    Compiler->>Validator: validate(plan)
    Validator->>Validator: 检查必填字段
    Validator->>Validator: 验证选择器格式
    Validator->>Validator: 检查循环引用

    alt 验证成功
        Validator-->>Compiler: ✅ Valid
        Compiler->>JSON: 生成 JSON
        JSON-->>UI: 返回执行计划
        UI->>User: 显示 JSON 预览
    else 验证失败
        Validator-->>Compiler: ❌ Errors
        Compiler-->>UI: 返回错误信息
        UI->>User: 显示错误提示
    end
```

---

## 3. 执行流程对比：旧 vs 新

### 3.1 旧架构（插件模式）

```mermaid
graph LR
    A[用户点击"运行"] --> B[UI 直接调用执行函数]
    B --> C[WorkflowEngine 初始化]
    C --> D[遍历节点]
    D --> E[调用 handlerClick.js]
    E --> F[直接操作 document.querySelector]
    F --> G[直接调用 chrome.tabs API]
    G --> H[返回结果到 UI]

    style E fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style F fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style G fill:#ff6b6b,stroke:#c92a2a,color:#fff

    note1[问题：强耦合<br/>无法在 Web 环境运行]
    style note1 fill:#ffe066,stroke:#f08c00
```

### 3.2 新架构（Web 模式）

```mermaid
graph TB
    A[用户点击"运行"] --> B[UI 触发编译]
    B --> C[生成 WorkflowExecutionPlan JSON]
    C --> D{选择执行器}

    D -->|开发模式| E1[Mock Runner]
    D -->|插件模式| E2[Extension Runner]
    D -->|生产模式| E3[Remote Runner]

    E1 --> F1[控制台输出彩色日志]
    E2 --> F2[调用 Chrome API]
    E3 --> F3[HTTP POST 到后端]

    F1 --> G[返回 ExecutionResult]
    F2 --> G
    F3 --> G

    G --> H[UI 显示执行结果]

    style C fill:#4ecdc4,stroke:#087f5b,color:#fff,stroke-width:3px
    style D fill:#ffd93d,stroke:#f08c00,color:#000,stroke-width:3px
    style G fill:#51cf66,stroke:#2b8a3e,color:#fff,stroke-width:3px

    note1[优势：完全解耦<br/>环境无关<br/>易于测试]
    style note1 fill:#c0eb75,stroke:#5c940d
```

---

## 4. Mock Runner 执行流程

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant UI as 🖼️ UI
    participant Runner as 🎭 Mock Runner
    participant Console as 🖥️ Console
    participant Context as 💾 Execution Context

    User->>UI: 点击"模拟运行"
    UI->>Runner: execute(plan)

    Runner->>Console: 输出标题和概览
    Runner->>Context: 初始化上下文

    loop 遍历每个步骤
        Runner->>Runner: 检查暂停状态
        Runner->>Console: 打印步骤信息

        alt 步骤类型: Navigate
            Runner->>Console: 🌐 Navigate to URL
            Runner->>Runner: await sleep(800)
            Runner->>Console: ✅ Page loaded
        else 步骤类型: Click
            Runner->>Console: 🖱️ Click element
            Runner->>Runner: await sleep(300)
            Runner->>Console: ✅ Element clicked
        else 步骤类型: Type
            Runner->>Console: ⌨️ Type text
            Runner->>Runner: await sleep(text.length * 50)
            Runner->>Console: ✅ Text typed
        else 步骤类型: Extract
            Runner->>Console: 📊 Extract data
            Runner->>Runner: 生成模拟数据
            Runner->>Console: ✅ Data extracted
        end

        Runner->>Context: 更新变量
        Runner->>Runner: 等待 stepDelay
    end

    Runner->>Console: 打印执行摘要
    Runner->>UI: 返回 ExecutionResult
    UI->>User: 显示执行报告
```

---

## 5. 动作抽象化流程（以 Click 为例）

```mermaid
graph TB
    subgraph "Step 1: UI 配置"
        A1[用户在编辑器中配置]
        A2[选择器: #submit-button]
        A3[点击类型: left]
        A4[延迟: 500ms]
    end

    subgraph "Step 2: 编译为 ActionDescriptor"
        B1[ClickActionCompiler]
        B2[提取配置参数]
        B3[构建 ElementSelector]
        B4[构建 ClickPayload]
        B5[生成 ActionDescriptor]
    end

    subgraph "Step 3: 标准化输出"
        C1[ActionDescriptor JSON]
        C2["type: 'click'"]
        C3["payload: ClickPayload"]
        C4["output: OutputDefinition"]
    end

    subgraph "Step 4: 执行器分发"
        D1{RuntimeAdapter Factory}
        D2[Mock Executor]
        D3[Extension Executor]
        D4[Remote Executor]
    end

    subgraph "Step 5: 具体实现"
        E1[console.log 模拟]
        E2[document.querySelector.click]
        E3[POST /api/execute]
    end

    A1 --> A2 --> A3 --> A4
    A4 --> B1
    B1 --> B2 --> B3 --> B4 --> B5
    B5 --> C1
    C1 --> C2 --> C3 --> C4
    C4 --> D1

    D1 -->|mode: mock| D2
    D1 -->|mode: extension| D3
    D1 -->|mode: remote| D4

    D2 --> E1
    D3 --> E2
    D4 --> E3

    style C1 fill:#ff6b6b,stroke:#c92a2a,color:#fff,stroke-width:3px
    style D1 fill:#4ecdc4,stroke:#087f5b,color:#fff,stroke-width:3px
```

---

## 6. 多环境执行器对比

```mermaid
graph LR
    subgraph "统一输入"
        A[ActionDescriptor<br/>标准动作描述符]
    end

    subgraph "Mock Runner"
        B1[解析 payload]
        B2[输出彩色日志]
        B3[模拟延迟]
        B4[返回模拟结果]
    end

    subgraph "Extension Runner"
        C1[解析 payload]
        C2[查询 active tab]
        C3[发送消息到 content script]
        C4[content script 操作 DOM]
        C5[返回真实结果]
    end

    subgraph "Remote Runner"
        D1[解析 payload]
        D2[序列化为 JSON]
        D3[HTTP POST 到后端]
        D4[后端执行任务]
        D5[等待响应]
        D6[返回执行结果]
    end

    A --> B1
    A --> C1
    A --> D1

    B1 --> B2 --> B3 --> B4
    C1 --> C2 --> C3 --> C4 --> C5
    D1 --> D2 --> D3 --> D4 --> D5 --> D6

    B4 --> R[ExecutionResult]
    C5 --> R
    D6 --> R

    style A fill:#ffd93d,stroke:#f08c00,color:#000,stroke-width:3px
    style R fill:#51cf66,stroke:#2b8a3e,color:#fff,stroke-width:3px
```

---

## 7. 条件分支和循环处理

```mermaid
graph TB
    A[当前步骤] --> B{检查 condition}

    B -->|无条件| C[直接执行动作]
    B -->|有条件| D[评估条件表达式]

    D -->|条件满足| C
    D -->|条件不满足| E[跳过步骤]

    C --> F[执行动作]
    F --> G[保存输出到变量]

    G --> H{检查 next 路由}

    H -->|default| I[跳转到默认下一步]
    H -->|branches| J{评估分支条件}
    H -->|onError| K[跳转到错误处理步骤]

    J -->|分支1满足| L[跳转到 target1]
    J -->|分支2满足| M[跳转到 target2]
    J -->|无分支满足| I

    E --> I

    I --> N[继续执行下一步]
    L --> N
    M --> N
    K --> N

    style B fill:#ffd93d,stroke:#f08c00,color:#000
    style H fill:#4ecdc4,stroke:#087f5b,color:#fff
    style J fill:#ff6b6b,stroke:#c92a2a,color:#fff
```

---

## 8. 变量和模板系统

```mermaid
sequenceDiagram
    participant Step as 📍 Execution Step
    participant Template as 🔤 Template Engine
    participant Context as 💾 Context Variables
    participant Runner as 🎭 Runner

    Note over Step: payload.text = "Hello {{username}}"

    Step->>Template: interpolateVariables(text)
    Template->>Template: 匹配 {{...}} 模式
    Template->>Context: 查询变量 "username"
    Context-->>Template: 返回 "Alice"
    Template->>Template: 替换模板
    Template-->>Step: 返回 "Hello Alice"

    Step->>Runner: executeAction(action)
    Runner->>Runner: 执行实际操作

    Note over Runner: 执行成功，产生输出

    Runner->>Step: 返回 ActionResult
    Step->>Step: 检查 output 定义
    Step->>Context: 保存到 variables["lastResult"]

    Note over Context: variables = {<br/>  username: "Alice",<br/>  lastResult: {...}<br/>}
```

---

## 9. 错误处理和重试策略

```mermaid
graph TB
    A[执行步骤] --> B{执行成功?}

    B -->|成功| C[记录日志]
    C --> D[保存输出]
    D --> E[继续下一步]

    B -->|失败| F{检查配置}

    F -->|onError: stop| G[停止执行]
    F -->|onError: continue| H[记录错误]
    F -->|onError: retry| I{检查重试次数}

    H --> E
    G --> Z[返回失败结果]

    I -->|未达到上限| J[等待延迟]
    I -->|达到上限| G

    J --> K{backoff 策略}

    K -->|fixed| L[固定延迟]
    K -->|exponential| M[指数延迟]
    K -->|linear| N[线性延迟]

    L --> A
    M --> A
    N --> A

    style F fill:#ffd93d,stroke:#f08c00,color:#000
    style I fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style K fill:#4ecdc4,stroke:#087f5b,color:#fff
```

---

## 10. 完整的用户使用流程

```mermaid
journey
    title Automa Web 用户使用流程
    section 创建工作流
      打开可视化编辑器: 5: User
      拖拽节点: 4: User
      配置节点参数: 3: User
      连接节点: 4: User
    section 调试工作流
      点击"模拟运行": 5: User
      查看控制台日志: 4: User
      发现问题并修改: 3: User
      重新模拟运行: 4: User
    section 导出执行计划
      点击"导出 JSON": 5: User
      查看生成的 JSON: 4: User
      保存到本地: 3: User
    section 实际执行
      选择执行环境: 4: User
      上传执行计划: 3: User
      监控执行状态: 5: User
      查看执行结果: 5: User
```

---

## 11. 数据流转全景图

```mermaid
graph TB
    subgraph "前端 UI"
        A[Vue Flow 编辑器]
        B[节点配置面板]
    end

    subgraph "领域模型"
        C[Workflow Entity]
        D[Node Graph]
    end

    subgraph "编译层"
        E[Workflow Compiler]
        F[Validator]
    end

    subgraph "标准输出"
        G[WorkflowExecutionPlan<br/>标准 JSON]
    end

    subgraph "执行层"
        H[Runtime Adapter]
    end

    subgraph "执行器"
        I1[Mock Runner]
        I2[Extension Runner]
        I3[Remote Runner]
    end

    subgraph "输出"
        J1[Console Logs]
        J2[Browser Actions]
        J3[HTTP Response]
    end

    subgraph "结果"
        K[ExecutionResult]
        L[Execution Logs]
        M[Final Context]
    end

    A --> C
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H

    H --> I1
    H --> I2
    H --> I3

    I1 --> J1
    I2 --> J2
    I3 --> J3

    J1 --> K
    J2 --> K
    J3 --> K

    K --> L
    K --> M

    L --> A
    M --> A

    style G fill:#ff6b6b,stroke:#c92a2a,color:#fff,stroke-width:4px
    style H fill:#4ecdc4,stroke:#087f5b,color:#fff,stroke-width:4px
    style K fill:#51cf66,stroke:#2b8a3e,color:#fff,stroke-width:4px
```

---

## 12. 技术栈和依赖关系

```mermaid
graph LR
    subgraph "UI 层技术栈"
        A1[Vue 3]
        A2[Vue Router]
        A3[Pinia]
        A4[vue-flow]
        A5[Tailwind CSS]
    end

    subgraph "编译层技术栈"
        B1[TypeScript]
        B2[JSON Schema]
        B3[Ajv Validator]
    end

    subgraph "执行层技术栈"
        C1[Promise/Async]
        C2[EventEmitter]
        C3[WebSocket Client]
    end

    subgraph "浏览器 API"
        D1[Chrome Extensions API]
        D2[webextension-polyfill]
    end

    subgraph "后端集成"
        E1[Fetch API]
        E2[WebSocket]
        E3[REST API]
    end

    A1 --> B1
    A4 --> B1
    B1 --> B2
    B2 --> B3

    B1 --> C1
    C1 --> C2
    C2 --> C3

    C1 --> D1
    D1 --> D2

    C1 --> E1
    C3 --> E2
    E1 --> E3
```

---

## 使用说明

这些流程图展示了 Automa Web 重构的完整架构设计。

### 如何查看

1. **在 GitHub 上查看**：GitHub 原生支持 Mermaid 渲染
2. **在 VSCode 中查看**：安装 Mermaid Preview 插件
3. **在线查看**：复制到 https://mermaid.live/

### 图表索引

- **图 1**: 整体架构分层图 - 理解系统的宏观结构
- **图 2**: 工作流编译流程 - 理解如何从 UI 生成 JSON
- **图 3**: 执行流程对比 - 理解新旧架构的差异
- **图 4**: Mock Runner 执行流程 - 理解模拟执行的细节
- **图 5**: 动作抽象化流程 - 理解如何抽象具体动作
- **图 6**: 多环境执行器对比 - 理解不同执行器的实现
- **图 7**: 条件分支和循环 - 理解控制流的处理
- **图 8**: 变量和模板系统 - 理解动态数据的处理
- **图 9**: 错误处理和重试 - 理解容错机制
- **图 10**: 用户使用流程 - 理解用户体验设计
- **图 11**: 数据流转全景 - 理解完整的数据流动
- **图 12**: 技术栈依赖 - 理解技术选型

### 建议阅读顺序

1. 首先阅读 **图 1** 和 **图 11**，理解整体架构
2. 然后阅读 **图 2** 和 **图 3**，理解核心流程
3. 接着阅读 **图 4** 到 **图 6**，理解执行细节
4. 最后阅读其他图表，理解高级特性

---

**这些流程图是架构设计的可视化表达，建议结合 README.md 和代码一起阅读。**
