# Automa 自定义 Block 开发指南

本文档详细说明如何在 Automa 中开发自定义 Block，重点讲解数据交互机制。

## 目录

- [概述](#概述)
- [架构说明](#架构说明)
- [开发流程](#开发流程)
- [数据交互详解](#数据交互详解)
- [完整示例：CRM 客户查询 Block](#完整示例crm-客户查询-block)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 概述

### 什么是自定义 Block？

自定义 Block 是扩展 Automa 功能的标准化组件。每个 Block 包含三个核心部分：

1. **Block 定义**：配置 Block 的元数据、UI 组件、默认数据
2. **Handler（处理器）**：实现 Block 的业务逻辑
3. **EditComponent（编辑组件）**：提供 Block 的配置界面

### 文件结构

```
business/dev/blocks/
├── index.js                           # Block 定义
├── backgroundHandler/                 # Background 环境的 Handler
│   └── handlerCRMGetCustomer.js
├── contentHandler/                    # Content Script 环境的 Handler（可选）
│   └── handlerCRMGetCustomer.js
└── editComponents/                    # 编辑界面组件
    ├── index.js                       # 导出所有组件
    └── EditCRMGetCustomer.vue
```

---

## 架构说明

### Workflow 执行流程

```
┌─────────────────┐
│  Workflow 开始  │
└────────┬────────┘
         ↓
┌─────────────────────────────┐
│  WorkflowEngine 初始化      │
│  - 加载 workflow 配置       │
│  - 创建 referenceData       │
│  - 构建 connectionsMap      │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│  WorkflowWorker 执行 Block  │
│  - 调用对应的 Handler       │
│  - 传递 context (this)      │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│  Handler 处理业务逻辑       │
│  - 读取 block.data          │
│  - 操作 referenceData       │
│  - 返回结果和下一个 Block   │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│  执行下一个 Block           │
│  或结束 Workflow            │
└─────────────────────────────┘
```

### ReferenceData 结构

`referenceData` 是整个 Workflow 执行过程中共享的数据对象：

```javascript
{
  variables: {},      // 用户定义的变量
  table: [],          // 数据表格行
  secrets: {},        // 加密凭证
  loopData: {},       // 当前循环迭代数据
  globalData: {}      // Workflow 全局数据
}
```

---

## 开发流程

### 步骤 1：定义 Block

在 `business/dev/blocks/index.js` 中添加 Block 定义：

```javascript
export default function () {
  return {
    // Block ID（kebab-case，必须唯一）
    'telecom-query-customer': {
      // 基本信息
      name: 'CRM - 查询客户',                    // Block 显示名称
      description: '从企业CRM系统查询客户信息',  // Block 描述
      icon: 'riAccountCircleLine',               // RemixIcon 图标名

      // UI 组件配置
      component: 'BlockBasic',                   // Block 渲染组件（通常使用 BlockBasic）
      editComponent: 'EditCRMGetCustomer',       // 编辑界面组件名

      // 分类和连接配置
      category: 'integration',                   // 分类：general/browser-interaction/data/...
      inputs: 1,                                 // 输入连接数
      outputs: 1,                                // 输出连接数
      maxConnection: 1,                          // 最大输出连接数（可选）
      allowedInputs: true,                       // 是否允许输入连接

      // 默认数据（会保存在 workflow 节点中）
      data: {
        disableBlock: false,                     // 是否禁用
        description: '',                         // Block 描述（用户可编辑）
        searchType: 'accessNumber',               // 自定义字段：查询类型
        queryParams: 'accessNumber:orient',      // 自定义字段：查询参数
        dataColumn: 'customerInfo',              // 保存到表格列
        assignVariable: true,                    // 是否赋值给变量
        variableName: 'customerData',            // 变量名
      },
    },
  };
}
```

#### 配置字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | String | ✅ | Block 显示名称（支持 i18n） |
| `description` | String | ✅ | Block 功能描述 |
| `icon` | String | ✅ | RemixIcon 图标名（参考 https://preview-v-remixicon.vercel.app/） |
| `component` | String | ✅ | 渲染组件，通常使用 `BlockBasic` |
| `editComponent` | String | ✅ | 编辑组件名，需在 `editComponents/index.js` 中导出 |
| `category` | String | ✅ | 分类：`general`, `browser-interaction`, `data`, `integration` 等 |
| `inputs` | Number | ✅ | 输入连接数（0-多个） |
| `outputs` | Number | ✅ | 输出连接数（0-多个） |
| `maxConnection` | Number | ❌ | 限制最大输出连接数 |
| `allowedInputs` | Boolean | ❌ | 是否允许动态输入连接 |
| `data` | Object | ✅ | Block 的默认数据结构 |

---

### 步骤 2：创建 Handler

Handler 是 Block 的核心业务逻辑实现。

#### 2.1 Handler 文件命名规则

- **文件路径**：`business/dev/blocks/backgroundHandler/handlerCRMGetCustomer.js`
- **命名规则**：
  - 文件名：`handler` + PascalCase（例如 `handlerCRMGetCustomer.js`）
  - 导出函数：使用 camelCase（例如 `crmGetCustomer`）

#### 2.2 Handler 基本结构

```javascript
export default function () {
  return {
    // Handler 名称（必须使用 camelCase）
    async crmGetCustomer({ data, id }) {
      // 业务逻辑实现

      return {
        data: result,                           // 传递给下一个 Block 的数据
        nextBlockId: this.getBlockConnections(id), // 下一个要执行的 Block ID
      };
    },
  };
}
```

#### 2.3 Handler 参数

Handler 函数接收一个对象参数，包含：

```javascript
{
  data: {},      // Block 配置数据（来自 workflow 节点的 data 字段）
  id: 'xxx',     // Block 的唯一 ID
  // ... 其他 Automa 内置字段
}
```

#### 2.4 Handler Context（this）

Handler 执行时，`this` 指向 `WorkflowWorker` 实例，提供以下常用方法和属性：

##### 核心方法

```javascript
// 1. 设置变量
this.setVariable(name, value)
// 示例：
this.setVariable('customerData', { id: 123, name: 'John' });

// 支持特殊前缀：
// - 普通变量：直接赋值
this.setVariable('myVar', 'value');

// - 数组追加：使用 $push: 前缀
this.setVariable('$push:myArray', newItem);

// - 持久化变量：使用 $$ 前缀（保存到 IndexedDB）
this.setVariable('$$persistentVar', 'value');

// 2. 添加数据到表格列
this.addDataToColumn(columnName, value)
// 示例：
this.addDataToColumn('customerInfo', { name: 'John', age: 30 });

// 支持批量添加：
this.addDataToColumn([
  { columnA: 'value1' },
  { columnB: 'value2' }
]);

// 3. 获取下一个连接的 Block
this.getBlockConnections(blockId, outputIndex = 1)
// 返回：Array<string> | null（下一个 Block 的 ID 列表）
```

##### 访问共享数据

```javascript
// 访问 referenceData（所有 Block 共享的数据）
this.engine.referenceData = {
  variables: {},      // 所有变量
  table: [],          // 数据表格
  secrets: {},        // 加密凭证
  loopData: {},       // 循环数据
  globalData: {}      // 全局数据
};

// 示例：读取变量
const userName = this.engine.referenceData.variables.userName;

// 示例：访问表格数据
const tableRows = this.engine.referenceData.table;
```

##### 其他有用属性

```javascript
this.engine.workflow         // Workflow 配置对象
this.engine.blocks           // 所有 Block 的映射表
this.engine.columns          // 数据列定义
this.activeTab               // 当前活动的浏览器 Tab
this.settings                // Workflow 设置
```

#### 2.5 Handler 返回值

Handler **必须返回** 一个对象：

```javascript
return {
  data: result,                           // 传递给下一个 Block 的数据（任意类型）
  nextBlockId: this.getBlockConnections(id), // 下一个 Block ID（数组或 null）
};
```

- **`data`**：传递给下一个 Block 的数据，下一个 Block 可以通过 `prevBlockData` 访问
- **`nextBlockId`**：
  - 通常使用 `this.getBlockConnections(id)` 获取
  - 可以手动指定（例如条件分支）
  - 返回 `null` 表示结束当前执行链

---

### 步骤 3：创建编辑组件

编辑组件是 Block 的配置界面，使用 Vue 3 编写。

#### 3.1 创建 Vue 组件

**文件路径**：`business/dev/blocks/editComponents/EditCRMGetCustomer.vue`

```vue
<template>
  <div class="edit-telecom-query-customer">
    <!-- 查询条件配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">查询条件</p>

      <ui-select
        :model-value="data.searchType"
        label="查询类型"
        placeholder="请选择查询类型"
        class="mb-2"
        @change="updateData({ searchType: $event })"
      >
        <option v-for="item in qType" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </ui-select>

      <ui-select
        :model-value="data.queryParams"
        label="查询值关联参数"
        placeholder="请选择查询值关联参数"
        @change="updateData({ queryParams: $event })"
      >
        <option
          v-for="item in valueFlect"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </ui-select>
    </ui-card>

    <!-- 数据保存配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">数据保存</p>

      <ui-input
        :model-value="data.dataColumn"
        label="保存到表格列"
        placeholder="例如: customerInfo"
        class="mb-2"
        @change="updateData({ dataColumn: $event })"
      />

      <ui-checkbox
        :model-value="data.assignVariable"
        class="mb-2"
        @change="updateData({ assignVariable: $event })"
      >
        保存到变量
      </ui-checkbox>

      <ui-input
        v-if="data.assignVariable"
        :model-value="data.variableName"
        label="变量名"
        placeholder="例如: customerData"
        @change="updateData({ variableName: $event })"
      />
    </ui-card>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

// 查询类型选项
const qType = [
  { label: '接入号', value: 'accessNumber' },
  { label: '客户编码', value: 'cusNumber' },
];

// 查询值关联参数选项
const valueFlect = [
  { label: '接入号:accessNumber', value: 'accessNumber:orient' },
  { label: '客户编码:cusNumber', value: 'cusNumber:orient' },
];

// 更新数据到 workflow 节点
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
```

#### 3.2 组件 Props 和 Emits

编辑组件必须遵循以下规范：

```javascript
// Props
defineProps({
  data: {               // Block 的配置数据（来自 workflow 节点）
    type: Object,
    default: () => ({}),
  },
});

// Emits
defineEmits(['update:data']);  // 更新数据的事件
```

#### 3.3 可用的 UI 组件

Automa 提供了一套内置 UI 组件：

| 组件 | 用途 | 示例 |
|------|------|------|
| `ui-input` | 文本输入框 | `<ui-input :model-value="data.field" @change="updateData({ field: $event })" />` |
| `ui-select` | 下拉选择框 | `<ui-select :model-value="data.field" @change="..."><option>...</option></ui-select>` |
| `ui-checkbox` | 复选框 | `<ui-checkbox :model-value="data.field" @change="...">Label</ui-checkbox>` |
| `ui-textarea` | 多行文本框 | `<ui-textarea :model-value="data.field" @change="..." />` |
| `ui-card` | 卡片容器 | `<ui-card>...</ui-card>` |

#### 3.4 注册编辑组件

在 `business/dev/blocks/editComponents/index.js` 中导出组件：

```javascript
import EditCRMGetCustomer from './EditCRMGetCustomer.vue';

export default function () {
  return {
    EditCRMGetCustomer,
    // ... 其他组件
  };
}
```

---

## 数据交互详解

### 数据流向图

```
┌──────────────────────────────────────────────────────────────────┐
│                     Block A (前一个 Block)                        │
│  Handler 返回: { data: { userId: 123 }, nextBlockId: [...] }    │
└─────────────────────────────┬────────────────────────────────────┘
                              ↓
                    传递 prevBlockData
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                 Block B (telecom-query-customer)                        │
│                                                                   │
│  1. 读取 block.data（用户配置）                                   │
│     - searchType: 'accessNumber'                                  │
│     - variableName: 'customerData'                               │
│                                                                   │
│  2. 处理业务逻辑                                                  │
│     - 使用 prevBlockData 获取前一个 Block 的输出                  │
│     - 执行查询逻辑                                                │
│                                                                   │
│  3. 操作 referenceData                                           │
│     this.setVariable('customerData', result)                     │
│     ↓                                                            │
│     engine.referenceData.variables.customerData = result         │
│                                                                   │
│     this.addDataToColumn('customerInfo', result)                 │
│     ↓                                                            │
│     engine.referenceData.table[currentRow].customerInfo = result │
│                                                                   │
│  4. 返回数据给下一个 Block                                        │
│     return { data: result, nextBlockId: [...] }                  │
└─────────────────────────────┬────────────────────────────────────┘
                              ↓
                    传递给 Block C
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     Block C (下一个 Block)                        │
│  可以通过 prevBlockData 访问 Block B 返回的 result               │
└──────────────────────────────────────────────────────────────────┘
```

### 核心数据交互机制

#### 1. 读取前一个 Block 的输出

```javascript
async crmGetCustomer({ data, id }, { prevBlockData }) {
  // prevBlockData 包含前一个 Block 的返回数据
  const previousOutput = prevBlockData;

  console.log('前一个 Block 的输出:', previousOutput);

  // 使用前一个 Block 的数据
  const userId = previousOutput?.userId;
}
```

#### 2. 设置变量（跨 Block 共享）

```javascript
// 设置普通变量
this.setVariable('customerData', {
  id: 123,
  name: 'John Doe',
  email: 'john@example.com'
});

// 其他 Block 可以访问：
// {{variables.customerData.name}} -> 'John Doe'

// 追加到数组变量
this.setVariable('$push:customerList', newCustomer);

// 持久化变量（保存到 IndexedDB）
this.setVariable('$$token', 'abc123');
```

#### 3. 添加数据到表格

```javascript
// 添加到指定列
this.addDataToColumn('customerInfo', {
  name: 'John',
  age: 30
});

// 批量添加到多列
this.addDataToColumn([
  { customerName: 'John' },
  { customerAge: 30 },
  { customerEmail: 'john@example.com' }
]);
```

#### 4. 访问 Workflow 全局数据

```javascript
// 读取 Workflow 全局数据
const globalConfig = JSON.parse(this.engine.workflow.globalData || '{}');
const apiEndpoint = globalConfig.apiEndpoint;

// 读取变量
const userName = this.engine.referenceData.variables.userName;

// 读取表格数据
const currentRow = this.engine.referenceData.table;
const previousData = currentRow.someColumn;
```

#### 5. 传递数据给下一个 Block

```javascript
return {
  data: {
    success: true,
    customer: customerData,
    timestamp: Date.now()
  },
  nextBlockId: this.getBlockConnections(id)
};

// 下一个 Block 可以通过 prevBlockData 访问这些数据
```

### 变量模板语法

在编辑组件中，用户可以使用模板语法引用变量：

```
{{variables.variableName}}           # 访问变量
{{table.columnName}}                 # 访问表格列
{{globalData.key}}                   # 访问全局数据
{{loopData.0}}                       # 访问循环数据
```

Handler 中的字符串会自动解析这些模板（通过 `renderString` 函数）。

---

## 完整示例：CRM 客户查询 Block

### 场景说明

创建一个 CRM 客户查询 Block，支持：
1. 配置查询类型（接入号、客户编码等）
2. 从前一个 Block 获取查询参数
3. 将查询结果保存到变量和表格列
4. 传递结果给下一个 Block

### 实现步骤

#### 1. Block 定义

**文件**：`business/dev/blocks/index.js`

```javascript
export default function () {
  return {
    'telecom-query-customer': {
      name: 'CRM - 查询客户',
      description: '从企业CRM系统查询客户信息',
      icon: 'riAccountCircleLine',
      component: 'BlockBasic',
      editComponent: 'EditCRMGetCustomer',
      category: 'integration',
      inputs: 1,
      outputs: 1,
      maxConnection: 1,
      allowedInputs: true,
      data: {
        disableBlock: false,
        description: '',
        searchType: 'accessNumber',        // 查询类型
        queryParams: 'accessNumber:orient', // 查询参数映射
        dataColumn: 'customerInfo',        // 保存到表格列
        assignVariable: true,              // 是否赋值给变量
        variableName: 'customerData',      // 变量名
      },
    },
  };
}
```

#### 2. Handler 实现

**文件**：`business/dev/blocks/backgroundHandler/handlerCRMGetCustomer.js`

```javascript
export default function () {
  return {
    async crmGetCustomer({ data, id }) {
      try {
        // 1. 获取用户配置
        const {
          searchType,       // 查询类型
          queryParams,     // 查询参数映射
          dataColumn,      // 保存到表格列
          assignVariable,  // 是否赋值给变量
          variableName,    // 变量名
        } = data;

        // 2. 构建查询配置（实际场景中这里会调用 API）
        const queryConfig = {
          searchType,
          queryParams,
          timestamp: new Date().toISOString(),
        };

        // 模拟 API 调用返回的数据
        const customerData = {
          id: 123456,
          name: '张三',
          phone: '13800138000',
          email: 'zhangsan@example.com',
          address: '北京市朝阳区',
          searchType,
          queryParams,
        };

        // 3. 保存到表格列（如果配置了）
        if (dataColumn) {
          await this.addDataToColumn(dataColumn, customerData);
        }

        // 4. 保存到变量（如果配置了）
        if (assignVariable && variableName) {
          this.setVariable(variableName, customerData);
        }

        // 5. 返回数据给下一个 Block
        return {
          data: customerData,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`CRM 查询失败: ${error.message}`);
      }
    },
  };
}
```

#### 3. 编辑组件

**文件**：`business/dev/blocks/editComponents/EditCRMGetCustomer.vue`

```vue
<template>
  <div class="edit-telecom-query-customer">
    <!-- 查询条件配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">查询条件</p>

      <ui-select
        :model-value="data.searchType"
        label="查询类型"
        placeholder="请选择查询类型"
        class="mb-2"
        @change="updateData({ searchType: $event })"
      >
        <option v-for="item in qType" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </ui-select>

      <ui-select
        :model-value="data.queryParams"
        label="查询值关联参数"
        placeholder="请选择查询值关联参数"
        @change="updateData({ queryParams: $event })"
      >
        <option
          v-for="item in valueFlect"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </ui-select>
    </ui-card>

    <!-- 数据保存配置 -->
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">数据保存</p>

      <ui-input
        :model-value="data.dataColumn"
        label="保存到表格列"
        placeholder="例如: customerInfo"
        class="mb-2"
        @change="updateData({ dataColumn: $event })"
      />

      <ui-checkbox
        :model-value="data.assignVariable"
        class="mb-2"
        @change="updateData({ assignVariable: $event })"
      >
        保存到变量
      </ui-checkbox>

      <ui-input
        v-if="data.assignVariable"
        :model-value="data.variableName"
        label="变量名"
        placeholder="例如: customerData"
        @change="updateData({ variableName: $event })"
      />
    </ui-card>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

// 查询类型选项
const qType = [
  { label: '接入号', value: 'accessNumber' },
  { label: '客户编码', value: 'cusNumber' },
];

// 查询值关联参数选项
const valueFlect = [
  { label: '接入号:accessNumber', value: 'accessNumber:orient' },
  { label: '客户编码:cusNumber', value: 'cusNumber:orient' },
];

// 更新数据到 workflow 节点
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
```

#### 4. 注册组件

**文件**：`business/dev/blocks/editComponents/index.js`

```javascript
import EditCRMGetCustomer from './EditCRMGetCustomer.vue';

export default function () {
  return {
    EditCRMGetCustomer,
  };
}
```

### 使用示例

在 Workflow 中使用该 Block：

```
[Trigger] → [设置变量: accessNumber="13800138000"] → [CRM 查询客户] → [显示通知]
                                                            ↓
                                          变量: customerData = {
                                            id: 123456,
                                            name: '张三',
                                            phone: '13800138000'
                                          }
```

下一个 Block 可以访问：
- 变量：`{{variables.customerData.name}}` → "张三"
- 表格列：`{{table.customerInfo.phone}}` → "13800138000"

---

## 最佳实践

### 1. 错误处理

```javascript
async crmGetCustomer({ data, id }) {
  try {
    // 业务逻辑
    const result = await fetchCustomerData(data.searchType);

    return {
      data: result,
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    // 清晰的错误信息
    throw new Error(`CRM 查询失败: ${error.message}`);
  }
}
```

### 2. 参数验证

```javascript
async crmGetCustomer({ data, id }) {
  // 验证必需参数
  if (!data.searchType) {
    throw new Error('查询类型不能为空');
  }

  if (!data.variableName && !data.dataColumn) {
    throw new Error('请至少配置一个数据保存方式（变量或表格列）');
  }

  // 继续处理...
}
```

### 3. 条件分支

如果 Block 需要根据条件执行不同的路径：

```javascript
async conditionalBlock({ data, id }) {
  const result = await someOperation();

  // 根据条件返回不同的下一个 Block
  let nextBlockId;
  if (result.success) {
    nextBlockId = this.getBlockConnections(id, 1); // 输出 1：成功路径
  } else {
    nextBlockId = this.getBlockConnections(id, 2); // 输出 2：失败路径
  }

  return {
    data: result,
    nextBlockId,
  };
}
```

对应的 Block 定义需要配置多个输出：

```javascript
{
  outputs: 2,  // 两个输出连接
  // ...
}
```

### 4. 使用模板字符串

Handler 中可以使用模板语法引用变量：

```javascript
import renderString from '@/workflowEngine/templating/renderString';

async myBlock({ data, id }) {
  // data.searchValue 可能是 "{{variables.userId}}"
  const actualValue = await renderString(
    data.searchValue,
    this.engine.referenceData,
    this
  );

  // actualValue 将是实际的变量值
  console.log(actualValue); // 假设 variables.userId = 123，输出 "123"
}
```

### 5. 访问 Browser API

在 Background Handler 中可以访问浏览器 API：

```javascript
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

async myBlock({ data, id }) {
  // 获取当前 Tab
  const [currentTab] = await BrowserAPIService.tabs.query({
    active: true,
    currentWindow: true
  });

  // 发送消息到 Content Script
  const response = await BrowserAPIService.tabs.sendMessage(
    currentTab.id,
    { action: 'getData' }
  );

  return {
    data: response,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

### 6. 日志记录

```javascript
async myBlock({ data, id }) {
  console.log('[CRM Block] 开始查询', {
    searchType: data.searchType,
    blockId: id
  });

  const result = await query();

  console.log('[CRM Block] 查询完成', result);

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

---

## 常见问题

### Q1: Handler 中如何访问前一个 Block 的输出？

A: Handler 函数的第二个参数包含 `prevBlockData`：

```javascript
async myBlock({ data, id }, { prevBlockData }) {
  console.log('前一个 Block 的输出:', prevBlockData);

  // 使用 prevBlockData
  const userId = prevBlockData?.userId;
}
```

### Q2: 如何在多个 Block 之间共享数据？

A: 使用变量或表格列：

```javascript
// Block A：设置变量
this.setVariable('sharedData', { key: 'value' });

// Block B：读取变量
const sharedData = this.engine.referenceData.variables.sharedData;
```

### Q3: 编辑组件如何访问 Workflow 的其他数据？

A: 编辑组件只接收 `data` prop，如果需要访问 Workflow 其他信息，可以通过 `inject`：

```vue
<script setup>
import { inject } from 'vue';

const workflow = inject('workflow', {});
const globalData = JSON.parse(workflow.globalData || '{}');
</script>
```

### Q4: Handler 和 EditComponent 的文件名规则是什么？

A:
- **Handler 文件名**：`handler` + PascalCase（如 `handlerCRMGetCustomer.js`）
- **Handler 函数名**：camelCase（如 `crmGetCustomer`）
- **EditComponent 文件名**：`Edit` + PascalCase（如 `EditCRMGetCustomer.vue`）
- **EditComponent 导出名**：与文件名一致（如 `EditCRMGetCustomer`）

### Q5: 如何调试自定义 Block？

A:
1. 在 Handler 中使用 `console.log` 输出调试信息
2. 在浏览器开发者工具的 Console 中查看日志
3. 使用 Workflow 的调试模式（在 Workflow 设置中启用）
4. 检查 `this.engine.referenceData` 的当前状态

### Q6: Block 定义中的 `category` 有哪些可选值？

A: 常用的 category 包括：
- `general` - 通用
- `browser-interaction` - 浏览器交互
- `data` - 数据处理
- `integration` - 集成/API
- `control-flow` - 控制流
- `element-interaction` - 元素交互

### Q7: 如何处理异步操作？

A: Handler 函数是 async 的，可以直接使用 await：

```javascript
async myBlock({ data, id }) {
  // 异步 API 调用
  const result = await fetch('https://api.example.com/data').then(r => r.json());

  // 异步浏览器 API
  const tabs = await BrowserAPIService.tabs.query({});

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

### Q8: 自定义 Block 是否支持 Content Script 环境？

A: 是的，可以创建 Content Script Handler：

**文件路径**：`business/dev/blocks/contentHandler/handlerMyBlock.js`

```javascript
export default function () {
  return {
    async myBlock({ data, id }) {
      // Content Script 环境的实现
      // 可以直接操作 DOM
      const element = document.querySelector(data.selector);

      return {
        data: element?.textContent,
        nextBlockId: this.getBlockConnections(id),
      };
    },
  };
}
```

---

## 总结

开发自定义 Block 的核心要点：

1. **Block 定义**：在 `index.js` 中配置元数据和默认数据
2. **Handler**：实现业务逻辑，操作 `referenceData`，返回结果
3. **EditComponent**：提供用户友好的配置界面
4. **数据交互**：
   - 使用 `this.setVariable()` 设置变量
   - 使用 `this.addDataToColumn()` 添加表格数据
   - 通过 `return { data }` 传递数据给下一个 Block
   - 通过 `prevBlockData` 接收前一个 Block 的数据

遵循这些规范，你就可以创建功能强大、易于维护的自定义 Block！
