# CRM 客户查询 Block 实现指南

本文档记录 `telecom-query-customer` Block 的完整实现过程，包括配置页面设计、变量自动补全支持等关键功能。

---

## 目录

- [功能概述](#功能概述)
- [文件结构](#文件结构)
- [Block 定义](#block-定义)
- [编辑组件实现](#编辑组件实现)
- [变量自动补全支持](#变量自动补全支持)
- [Handler 实现](#handler-实现)
- [使用说明](#使用说明)
- [问题排查](#问题排查)

---

## 功能概述

`telecom-query-customer` Block 用于从企业 CRM 系统查询客户信息。

### 核心功能

1. **查询配置**：支持多种查询类型（接入号、客户编码等）
2. **变量赋值**：将查询结果保存到变量，支持 `{{variables.xxx}}` 语法引用
3. **自动补全**：配置的变量名会出现在其他 Block 的变量提示列表中

### 配置界面

```
┌─────────────────────────────────┐
│  查询条件                        │
│  ┌───────────────────────────┐  │
│  │ 查询类型: [接入号 ▼]       │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 查询值: [输入查询值...]     │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  ☑ 保存到变量                    │
│  ┌───────────────────────────┐  │
│  │ 变量名: [customerData]     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 文件结构

```
business/dev/blocks/
├── index.js                                 # Block 定义（含 autocomplete 配置）
├── backgroundHandler/
│   └── handlerCRMGetCustomer.js            # 后台执行逻辑
└── editComponents/
    ├── index.js                             # 组件注册
    └── EditCRMGetCustomer.vue               # 配置界面组件
```

---

## Block 定义

**文件**: `business/dev/blocks/index.js`

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

      // 关键：启用变量名自动补全
      autocomplete: ['variableName'],

      data: {
        disableBlock: false,
        description: '',
        searchType: 'accessNumber',    // 查询类型
        searchValue: '',               // 查询值（支持模板语法）
        assignVariable: true,         // 是否保存到变量
        variableName: '',             // 变量名
      },
    },
  };
}
```

### 关键配置说明

| 字段 | 说明 |
|------|------|
| `autocomplete: ['variableName']` | **必需**，启用变量名自动补全，让配置的变量名出现在提示列表中 |
| `searchValue` | 查询值输入框，支持 `{{ variable }}` 模板语法 |
| `assignVariable` | 布尔值，控制是否显示变量名输入框 |
| `variableName` | 变量名，其他 Block 可通过 `{{variables.xxx}}` 引用 |

---

## 编辑组件实现

**文件**: `business/dev/blocks/editComponents/EditCRMGetCustomer.vue`

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

      <ui-input
        :model-value="data.searchValue"
        label="查询值"
        placeholder="输入查询值，支持 {{ variable }}"
        @change="updateData({ searchValue: $event })"
      />
    </ui-card>

    <hr />

    <!-- 使用标准的变量赋值组件 -->
    <insert-workflow-data :data="data" variables @update="updateData" />
  </div>
</template>

<script setup>
import InsertWorkflowData from '@/components/newtab/workflow/edit/InsertWorkflowData.vue';

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
  // 可以添加更多查询类型
];

// 更新数据到 workflow 节点
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
```

### 组件说明

#### 1. InsertWorkflowData 组件

这是 Automa 内置的标准组件，用于处理变量赋值和表格数据保存：

```vue
<insert-workflow-data
  :data="data"        <!-- 传入当前 Block 数据 -->
  variables           <!-- 启用变量赋值功能 -->
  @update="updateData" <!-- 数据更新回调 -->
/>
```

**Props 说明**：
| Prop | 类型 | 说明 |
|------|------|------|
| `data` | Object | Block 配置数据 |
| `variables` | Boolean | 显示"保存到变量"选项 |
| `table` | Boolean | 显示"保存到表格列"选项（默认 true） |
| `extra-row` | Boolean | 显示额外行选项 |

#### 2. 查询值输入框

支持模板语法，用户可以输入：
- 固定值：`13800138000`
- 变量引用：`{{variables.phoneNumber}}`
- 混合使用：`前缀-{{variables.id}}`

---

## 变量自动补全支持

### 工作原理

Automa 的变量自动补全依赖两个机制：

1. **Block 定义中的 `autocomplete` 属性**：指定哪些字段的值应该被收集
2. **编辑器的自动补全数据收集**：从节点数据中提取配置的变量名

### 实现步骤

#### 步骤 1：在 Block 定义中添加 autocomplete

```javascript
// business/dev/blocks/index.js
{
  'telecom-query-customer': {
    // ... 其他配置
    autocomplete: ['variableName'],  // 收集 variableName 字段的值
    data: {
      variableName: '',  // 这个字段的值会被收集
    },
  },
}
```

#### 步骤 2：自动补全数据提取逻辑

**文件**: `src/utils/editor/editorAutocomplete.js`

```javascript
const autocompleteKeys = {
  loopId: 'loopData',
  refKey: 'googleSheets',
  variableName: 'variables',  // variableName -> variables 命名空间
};

function getData(blockName, blockData) {
  const keys = blocks[blockName]?.autocomplete;  // 获取 Block 的 autocomplete 配置
  const dataList = {};
  if (!keys) return dataList;

  keys.forEach((key) => {
    const value = blockData[key];  // 获取字段值（如 "customerData"）
    if (!value) return;

    const autocompleteKey = autocompleteKeys[key];  // 映射到命名空间（如 "variables"）
    if (!dataList[autocompleteKey]) dataList[autocompleteKey] = {};

    dataList[autocompleteKey][value] = '';  // 添加到自动补全列表
  });

  return dataList;
}
```

#### 步骤 3：编辑时实时更新（重要修复）

**文件**: `src/newtab/pages/workflows/[id].vue`

```javascript
const updateBlockData = debounce((data) => {
  // ... 其他代码

  // 修复：总是更新自动补全数据，包括新添加的节点
  const { id, blockId } = editState.blockData;
  Object.assign(
    autocompleteState.blocks,
    extractAutocopmleteData(id, { data, id: blockId })
  );

  // ... 其他代码
}, 250);
```

**修复说明**：原代码只在节点已存在于 `autocompleteState.blocks` 时才更新，导致新添加的节点配置变量名后不会出现在自动补全列表中。

---

## Handler 实现

**文件**: `business/dev/blocks/backgroundHandler/handlerCRMGetCustomer.js`

```javascript
export default function () {
  return {
    async crmGetCustomer({ data, id }) {
      try {
        const {
          searchType,
          searchValue,
          assignVariable,
          variableName,
        } = data;

        // 1. 解析查询值（支持模板语法）
        // searchValue 会被 Automa 自动解析，如 "{{variables.phone}}" -> "13800138000"

        // 2. 执行查询逻辑（实际场景中调用 CRM API）
        const customerData = await this.fetchCustomer(searchType, searchValue);

        // 3. 保存到变量
        if (assignVariable && variableName) {
          this.setVariable(variableName, customerData);
        }

        // 4. 返回结果
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

---

## 使用说明

### 基本使用

1. 在工作流中添加 `CRM - 查询客户` Block
2. 配置查询类型和查询值
3. 启用"保存到变量"并输入变量名（如 `customerData`）
4. 在后续 Block 中使用 `{{variables.customerData}}` 引用

### 变量引用示例

配置完成后，在其他 Block 中输入 `{{variables.` 会自动提示 `customerData`：

```
{{variables.customerData}}           # 完整对象
{{variables.customerData.name}}      # 客户名称
{{variables.customerData.phone}}     # 客户电话
```

---

## 问题排查

### 问题 1：变量名不出现在自动补全列表

**可能原因**：

1. Block 定义缺少 `autocomplete: ['variableName']`
2. 编辑器未实时更新自动补全数据（需要检查 `[id].vue` 中的更新逻辑）

**解决方案**：

```javascript
// 确保 Block 定义包含 autocomplete
{
  'telecom-query-customer': {
    autocomplete: ['variableName'],  // 必需
    // ...
  },
}
```

### 问题 2：新添加的节点配置变量后不生效

**原因**：原来的代码只更新已存在的节点

**解决方案**：修改 `src/newtab/pages/workflows/[id].vue`：

```javascript
// 修改前（有条件判断）
if (autocompleteState.blocks[autocompleteId]) {
  // 更新逻辑
}

// 修改后（总是更新）
const { id, blockId } = editState.blockData;
Object.assign(
  autocompleteState.blocks,
  extractAutocopmleteData(id, { data, id: blockId })
);
```

### 问题 3：InsertWorkflowData 组件找不到

**原因**：导入路径错误

**解决方案**：

```javascript
// 正确的导入路径
import InsertWorkflowData from '@/components/newtab/workflow/edit/InsertWorkflowData.vue';
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `business/dev/blocks/index.js` | Block 定义 |
| `business/dev/blocks/editComponents/EditCRMGetCustomer.vue` | 编辑组件 |
| `business/dev/blocks/backgroundHandler/handlerCRMGetCustomer.js` | Handler |
| `src/utils/editor/editorAutocomplete.js` | 自动补全数据提取 |
| `src/newtab/pages/workflows/[id].vue` | 工作流编辑器（自动补全状态管理） |
| `src/components/newtab/workflow/edit/InsertWorkflowData.vue` | 变量赋值通用组件 |

---

## 变更记录

### 2025-12-09

- 调整配置页面：去掉"查询值关联参数"，改为"查询值"输入框
- 去掉自定义数据保存配置，使用标准 `InsertWorkflowData` 组件
- 添加 `autocomplete: ['variableName']` 支持变量自动补全
- 修复新节点自动补全数据不更新的问题
