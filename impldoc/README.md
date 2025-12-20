# Automa Implementation Documentation

欢迎使用 Automa 实现文档。本目录包含了项目开发、迁移和最佳实践的完整文档。

---

## 📚 文档导航

### 🔧 [自定义 Block 开发指南](./guides/)

从零开始开发 Automa 自定义 Block 的完整文档：

- **[完整开发指南](./guides/custom-block-development.md)** - 详细的开发教程，包含架构说明、开发流程、数据交互详解和完整示例
- **[快速参考手册](./guides/quick-reference.md)** - 快速查找常用的 API、模式和代码片段
- **[CRM 客户查询实现指南](./guides/telecom-query-customer-implementation.md)** - telecom-query-customer Block 的完整实现记录，包含变量自动补全支持

**适合人群**：开发自定义 Block 的开发者

---

### 🌐 [Web 迁移项目文档](./web-migration/)

Automa 从浏览器扩展到独立 Web 应用的迁移记录：

- **[修复文档](./web-migration/fixes/)** - 迁移过程中遇到的问题及解决方案
- **[里程碑文档](./web-migration/milestones/)** - 各阶段完成情况总结

**适合人群**：了解 Web 迁移过程的开发者、维护者

---

## 快速开始

### 开发自定义 Block

如果你想快速创建一个简单的 Block，按照以下步骤：

#### 1. 定义 Block

在 `business/dev/blocks/index.js` 添加：

```javascript
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
```

#### 2. 创建 Handler

创建文件 `business/dev/blocks/backgroundHandler/handlerMyBlock.js`：

```javascript
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
```

#### 3. 创建编辑组件

创建文件 `business/dev/blocks/editComponents/EditMyBlock.vue`：

```vue
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
```

#### 4. 注册组件

在 `business/dev/blocks/editComponents/index.js` 添加：

```javascript
import EditMyBlock from './EditMyBlock.vue';

export default function () {
  return {
    EditMyBlock,
    // ... 其他组件
  };
}
```

#### 5. 重新启动开发服务器

```bash
pnpm dev:web
```

详细步骤请查看 **[完整开发指南](./guides/custom-block-development.md)**。

---

## 项目资源

- **Automa 项目**: [GitHub](https://github.com/AutomaApp/automa)
- **RemixIcon 图标**: [预览网站](https://preview-v-remixicon.vercel.app/)
- **Vue 3 文档**: [官网](https://vuejs.org/)
- **Automa 官方文档**: [docs.automa.site](https://docs.automa.site/)

---

## 技术栈

- **前端框架**: Vue 3 Composition API
- **工作流引擎**: WorkflowEngine（Automa 自研）
- **UI 组件**: Automa 内置组件（`ui-input`, `ui-select`, `ui-checkbox` 等）
- **HTTP 客户端**: Axios（通过 `@/apis/interceptor` 导入）
- **浏览器 API**: BrowserAPIService（Chrome/Firefox 兼容层）
- **构建工具**:
  - Extension Mode: Webpack 5
  - Web Mode: Vite 5

---

## 文档更新日志

### 2025-12-09
- 📝 新增 [CRM 客户查询实现指南](./guides/telecom-query-customer-implementation.md)
- 🔧 记录变量自动补全功能的实现细节
- 🐛 修复新节点自动补全数据不更新的问题

### 2025-12-08
- 🎯 重组文档结构，分离开发指南和 Web 迁移文档
- 📁 创建清晰的目录结构（guides/, web-migration/）

### 2025-12-05
- ✅ 创建完整开发指南
- ✅ 创建快速参考手册
- ✅ 添加 CRM 客户查询完整示例
- ✅ 添加数据交互详解章节

---

**祝你开发顺利！🚀**
