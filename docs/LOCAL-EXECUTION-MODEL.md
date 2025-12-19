# 本地调试执行模型设计文档

## 概述

本文档描述了 Automa Web 应用的工作流本地调试执行模型设计。该模型支持两种执行环境：
1. **本地调试执行** - 通过本地 .exe 服务执行，用于开发调试
2. **服务器正式环境执行** - 由外部系统触发，不在画布中手动触发

## 架构设计

### 执行环境

```
┌─────────────────────────────────────────────────────────────────┐
│                        Automa Web 应用                           │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  工作流编辑器     │    │  执行状态面板    │                     │
│  │  (画布/节点)     │    │  (日志/状态)     │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────┐                    │
│  │         LocalExecutionService           │                    │
│  │  - 健康检查                              │                    │
│  │  - 执行工作流                            │                    │
│  │  - 停止执行                              │                    │
│  │  - 获取执行状态                          │                    │
│  └────────────────────┬────────────────────┘                    │
└───────────────────────│─────────────────────────────────────────┘
                        │ HTTP
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              本地调试服务 (localhost:8583)                        │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  /actuator/health│   │  /workflow/execute│                   │
│  │  健康检查        │    │  执行工作流       │                    │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. LocalExecutionService (`src/services/localExecution.js`)

本地执行服务，负责与本地调试服务通信。

**功能：**
- `checkHealth()` - 健康检查
- `executeWorkflow(workflowData)` - 执行工作流
- `stopExecution(executionId)` - 停止执行
- `getExecutionStatus(executionId)` - 获取执行状态

**配置：**
```javascript
const LOCAL_SERVICE_URL = 'http://localhost:8583';
const HEALTH_CHECK_ENDPOINT = '/actuator/health';
const EXECUTE_ENDPOINT = '/workflow/execute';
```

#### 2. ExecutionStore (`src/stores/execution.js`)

执行状态管理 Store。

**状态：**
```javascript
{
  // 本地服务状态
  localServiceStatus: 'unknown', // 'unknown' | 'healthy' | 'unhealthy'
  lastHealthCheck: null,

  // 当前执行
  currentExecution: null,
  executionHistory: [],

  // 执行日志
  logs: [],
}
```

#### 3. EditorLocalActions 组件增强

在右上角操作栏添加运行按钮，包含以下逻辑：
- 检查工作流是否已保存（`dataChanged` 状态）
- 检查本地服务健康状态
- 执行工作流并显示执行状态

### 用户操作流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   编辑工作流  │ ──▶ │   保存工作流  │ ──▶ │  点击运行按钮 │ ──▶ │  执行工作流   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │                      │
                                                ▼                      ▼
                                         ┌──────────────┐     ┌──────────────┐
                                         │ 健康检查失败  │     │  显示执行日志 │
                                         │ 提示启动服务  │     │  实时更新状态 │
                                         └──────────────┘     └──────────────┘
```

### 执行按钮状态

| 状态 | 按钮显示 | 是否可点击 | 提示信息 |
|------|---------|----------|---------|
| 未保存 | 运行 | 否 | "请先保存工作流" |
| 服务未启动 | 运行 | 否 | "本地服务未启动" |
| 服务健康 | 运行 | 是 | - |
| 执行中 | 停止 | 是 | - |

## API 接口设计

### 健康检查

**请求：**
```
GET http://localhost:8583/actuator/health
```

**响应：**
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP", ... },
    "diskSpace": { "status": "UP", ... },
    "ping": { "status": "UP" },
    "ssl": { "status": "UP", ... }
  }
}
```

### 执行工作流

**请求：**
```
POST http://localhost:8583/workflow/execute
Content-Type: application/json

{
  "workflowId": "string",
  "workflowData": {
    "id": "string",
    "name": "string",
    "drawflow": { nodes: [], edges: [] },
    "globalData": "{}",
    "table": [],
    "settings": { ... }
  },
  "options": {
    "debug": true
  }
}
```

**响应：**
```json
{
  "executionId": "string",
  "status": "started",
  "message": "工作流执行已启动"
}
```

### 获取执行状态

**请求：**
```
GET http://localhost:8583/workflow/execution/{executionId}/status
```

**响应：**
```json
{
  "executionId": "string",
  "status": "running", // running | completed | failed | stopped
  "currentBlock": "block-id",
  "progress": 50,
  "logs": [
    { "timestamp": "2024-01-01T00:00:00Z", "level": "info", "message": "..." }
  ]
}
```

### 停止执行

**请求：**
```
POST http://localhost:8583/workflow/execution/{executionId}/stop
```

**响应：**
```json
{
  "executionId": "string",
  "status": "stopped",
  "message": "执行已停止"
}
```

## 文件结构

```
src/
├── services/
│   └── localExecution.js          # 本地执行服务
├── stores/
│   └── execution.js               # 执行状态 Store
├── components/newtab/workflow/
│   ├── editor/
│   │   ├── EditorLocalActions.vue # 修改：添加运行按钮
│   │   └── EditorExecutionPanel.vue # 新增：执行状态面板
│   └── ...
└── ...
```

## 实现计划

### Phase 1: 基础设施
1. 创建 `LocalExecutionService` 服务
2. 创建 `ExecutionStore` 状态管理
3. 实现健康检查逻辑

### Phase 2: UI 集成
4. 修改 `EditorLocalActions` 添加运行按钮
5. 实现执行状态面板
6. 添加执行日志显示

### Phase 3: 执行流程
7. 实现工作流执行调用
8. 实现执行状态轮询
9. 实现停止执行功能

## 注意事项

1. **跨域问题**：本地服务需要配置 CORS 允许 `localhost:3000` 访问
2. **保存前置**：必须先保存工作流才能执行，防止执行未保存的版本
3. **健康检查间隔**：建议每 5 秒检查一次本地服务状态
4. **错误处理**：网络超时、服务不可用等情况需要友好提示

## 配置项

在 `.env.development` 和 `.env.production` 中配置：

```env
# 本地调试服务地址
VITE_LOCAL_SERVICE_URL=http://localhost:8583

# API 基础地址（用于正式环境）
VITE_API_BASE_URL=https://api.example.com
```

## 已实现的文件

### 服务层
- `src/service/local-execution/LocalExecutionService.js` - 本地执行服务

### 状态管理
- `src/stores/execution.js` - 执行状态 Store

### UI 组件
- `src/components/newtab/workflow/editor/EditorLocalActions.vue` - 右上角操作栏（已修改，添加运行按钮）
- `src/components/newtab/workflow/editor/EditorExecutionPanel.vue` - 执行日志面板

### 页面集成
- `src/newtab/pages/workflows/[id].vue` - 工作流编辑页面（已修改，添加执行日志模态框）

### 图标
- `src/lib/vRemixicon.js` - 添加了 `riServerLine` 和 `riTerminalBoxLine` 图标

## 使用方式

### 1. 启动本地调试服务

确保本地调试服务 `.exe` 已启动并运行在 `http://localhost:8583`。

### 2. 编辑工作流

在工作流编辑器中编辑你的工作流。

### 3. 保存工作流

点击右上角的 **保存** 按钮保存工作流。注意：必须先保存才能执行。

### 4. 检查服务状态

观察右上角的服务状态图标：
- 绿色：本地服务已连接
- 红色：本地服务未连接
- 灰色：正在检查状态

### 5. 执行工作流

点击绿色的 **播放** 按钮执行工作流。执行日志面板会自动打开。

### 6. 查看执行日志

执行日志面板会实时显示：
- 执行状态（准备中、执行中、已完成、失败、已停止）
- 执行进度
- 详细日志（支持 info、warn、error、debug 级别）

### 7. 停止执行

在执行过程中，可以点击红色的 **停止** 按钮终止执行。

## 后端接口要求

后端服务需要实现以下接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/actuator/health` | GET | 健康检查 |
| `/workflow/execute` | POST | 执行工作流 |
| `/workflow/execution/{id}/status` | GET | 获取执行状态 |
| `/workflow/execution/{id}/stop` | POST | 停止执行 |
| `/workflow/execution/{id}/logs` | SSE | 执行日志流（可选） |

## CORS 配置

后端服务需要配置 CORS 允许以下来源：
- `http://localhost:3000`（开发环境）
- 你的生产环境域名
