# Automa 自定义 Block 开发文档

欢迎使用 Automa 自定义 Block 开发文档。本目录包含了从零开始开发自定义 Block 所需的所有资料。

## 文档目录

### 📚 [完整开发指南](./custom-block-development.md)

详细的开发教程，包含：
- 架构说明
- 完整的开发流程
- **数据交互详解**（重点）
- 完整的 CRM 客户查询 Block 示例
- 最佳实践
- 常见问题解答

**适合人群**：首次开发自定义 Block 的开发者，需要深入理解数据交互机制。

---

### ⚡ [快速参考](./quick-reference.md)

快速查找常用的 API、模式和代码片段，包含：
- 文件模板（Block 定义、Handler、EditComponent）
- 常用 API 速查
- 常用模式（条件分支、API 调用、循环处理等）
- UI 组件使用示例
- 错误处理模式
- 调试技巧
- 快速检查清单

**适合人群**：已经熟悉基本概念，需要快速查找 API 或代码示例的开发者。

---

## 快速开始

### 1. 创建最小化 Block

如果你想快速创建一个简单的 Block，按照以下步骤：

#### 步骤 1：定义 Block

在 \`business/dev/blocks/index.js\` 添加：

\`\`\`javascript
'my-block': {
  name: 'My Block',
  description: 'My block description',
  icon: 'riStarLine',
  component: 'BlockBasic',
  editComponent: 'EditMyBlock',
  category: 'integration',
  inputs: 1,
  outputs: 1,
  data: {
    disableBlock: false,
    description: '',
    myField: '',
  },
},
\`\`\`

#### 步骤 2：创建 Handler

创建文件 \`business/dev/blocks/backgroundHandler/handlerMyBlock.js\`：

\`\`\`javascript
export default function () {
  return {
    async myBlock({ data, id }) {
      console.log('My block is running!', data);

      return {
        data: { success: true },
        nextBlockId: this.getBlockConnections(id),
      };
    },
  };
}
\`\`\`

#### 步骤 3：创建编辑组件

创建文件 \`business/dev/blocks/editComponents/EditMyBlock.vue\`：

\`\`\`vue
<template>
  <div>
    <ui-input
      :model-value="data.myField"
      label="My Field"
      @change="updateData({ myField: $event })"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
\`\`\`

#### 步骤 4：注册组件

在 \`business/dev/blocks/editComponents/index.js\` 添加：

\`\`\`javascript
import EditMyBlock from './EditMyBlock.vue';

export default function () {
  return {
    EditMyBlock,
    // ... 其他组件
  };
}
\`\`\`

#### 步骤 5：重新启动开发服务器

\`\`\`bash
pnpm dev:web
\`\`\`

现在你可以在 Workflow 编辑器中看到你的自定义 Block！

---

## 数据交互核心概念

### ReferenceData（共享数据）

\`\`\`javascript
this.engine.referenceData = {
  variables: {},      // 变量（跨 Block 共享）
  table: [],          // 数据表格
  secrets: {},        // 加密凭证
  loopData: {},       // 循环数据
  globalData: {}      // 全局数据
};
\`\`\`

### 核心 API

\`\`\`javascript
// 设置变量
this.setVariable('varName', value);

// 添加数据到表格列
this.addDataToColumn('columnName', value);

// 获取下一个 Block
this.getBlockConnections(id);
\`\`\`

### Block 之间的数据传递

\`\`\`
Block A → 返回 data → Block B 通过 prevBlockData 接收
\`\`\`

详细说明请查看[完整开发指南](./custom-block-development.md#数据交互详解)。

---

## 示例 Block：CRM 客户查询

完整的实现示例请参考：
- [完整开发指南 - CRM 示例章节](./custom-block-development.md#完整示例crm-客户查询-block)

该示例展示了：
✅ 如何配置查询参数  
✅ 如何保存数据到变量和表格  
✅ 如何将数据传递给下一个 Block  
✅ 如何创建用户友好的配置界面  

---

## 常见问题

### Q: 如何在 Block 之间传递数据？

A: 使用 Handler 的返回值：

\`\`\`javascript
return {
  data: { userId: 123 },  // 传递给下一个 Block
  nextBlockId: this.getBlockConnections(id),
};
\`\`\`

下一个 Block 通过 \`prevBlockData\` 接收：

\`\`\`javascript
async nextBlock({ data, id }, { prevBlockData }) {
  const userId = prevBlockData.userId;
}
\`\`\`

### Q: 如何在多个 Block 之间共享数据？

A: 使用变量：

\`\`\`javascript
// Block A 设置
this.setVariable('sharedData', { key: 'value' });

// Block B 读取
const sharedData = this.engine.referenceData.variables.sharedData;
\`\`\`

### Q: Handler 报错如何调试？

A: 使用 \`console.log\` 和浏览器开发者工具：

\`\`\`javascript
async myBlock({ data, id }) {
  console.log('[MyBlock] 输入数据:', data);
  console.log('[MyBlock] 当前变量:', this.engine.referenceData.variables);

  // 业务逻辑...
}
\`\`\`

更多问题请查看[完整开发指南 - 常见问题](./custom-block-development.md#常见问题)。

---

## 技术栈

- **前端框架**: Vue 3 Composition API
- **工作流引擎**: WorkflowEngine（Automa 自研）
- **UI 组件**: Automa 内置组件（\`ui-input\`, \`ui-select\`, \`ui-checkbox\` 等）
- **HTTP 客户端**: Axios（通过 \`@/apis/interceptor\` 导入）
- **浏览器 API**: BrowserAPIService（Chrome/Firefox 兼容层）

---

## 开发规范

### 命名规范

| 项目 | 规范 | 示例 |
|------|------|------|
| Block ID | kebab-case | \`crm-get-customer\` |
| Handler 文件 | handler + PascalCase | \`handlerCRMGetCustomer.js\` |
| Handler 函数 | camelCase | \`crmGetCustomer\` |
| EditComponent | Edit + PascalCase | \`EditCRMGetCustomer.vue\` |

### 文件结构

\`\`\`
business/dev/blocks/
├── index.js                              # Block 定义
├── backgroundHandler/                    # Background 环境 Handler
│   └── handlerMyBlock.js
├── contentHandler/                       # Content Script 环境 Handler（可选）
│   └── handlerMyBlock.js
└── editComponents/                       # 编辑组件
    ├── index.js                          # 导出所有组件
    └── EditMyBlock.vue
\`\`\`

---

## 资源链接

- **Automa 项目**: [GitHub](https://github.com/AutomaApp/automa)
- **RemixIcon 图标**: [预览网站](https://preview-v-remixicon.vercel.app/)
- **Vue 3 文档**: [官网](https://vuejs.org/)
- **Automa 官方文档**: [docs.automa.site](https://docs.automa.site/)

---

## 更新日志

### 2025-12-05
- ✅ 创建完整开发指南
- ✅ 创建快速参考手册
- ✅ 添加 CRM 客户查询完整示例
- ✅ 添加数据交互详解章节

---

**祝你开发顺利！🚀**
