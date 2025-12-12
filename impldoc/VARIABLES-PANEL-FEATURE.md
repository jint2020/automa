# 变量面板功能开发文档

## 功能概述

变量面板是一个右侧抽屉式面板，用于展示当前工作流中定义的所有变量。用户可以：

1. 查看所有变量及其分组
2. 查看变量类型、默认值、描述等信息
3. 复制变量名或引用语法
4. 点击来源标签定位到对应的 block 节点

## 文件结构

```
src/
├── components/newtab/workflow/
│   └── WorkflowVariables.vue      # 变量面板主组件
├── newtab/pages/workflows/
│   └── [id].vue                   # 工作流编辑页面（集成面板）
├── locales/
│   ├── en/newtab.json            # 英文翻译
│   └── zh/newtab.json            # 中文翻译
└── components/newtab/workflow/editor/
    └── EditorLocalActions.vue     # 工具栏按钮
```

## 架构设计

### 1. 面板容器 ([id].vue)

面板使用固定定位的右侧抽屉实现：

```vue
<!-- 遮罩层 - 点击关闭面板 -->
<div
  v-if="variablesPanelOpen"
  class="fixed inset-0 top-10 z-30"
  @click="variablesPanelOpen = false"
/>

<!-- 面板主体 -->
<transition name="slide-right">
  <div
    v-if="variablesPanelOpen"
    class="variables-panel fixed right-0 top-10 z-40 ..."
  >
    <workflow-variables :workflow="workflow" />
  </div>
</transition>
```

**关键点：**
- 使用 `z-30` 遮罩层实现点击外部关闭
- 使用 `z-40` 确保面板在遮罩层之上
- 使用 CSS transition 实现滑入/滑出动画

### 2. 面板状态管理

```javascript
// 面板开关状态
const variablesPanelOpen = ref(false);

// 处理工具栏按钮点击
function handleModalAction(modalName) {
  if (modalName === 'variables') {
    variablesPanelOpen.value = !variablesPanelOpen.value;
  } else {
    modalState.name = modalName;
    modalState.show = true;
  }
}
```

### 3. 变量提取逻辑 (WorkflowVariables.vue)

变量按来源分为 6 个分组：

| 分组 ID | 名称 | 来源 | 有 sourceBlock |
|---------|------|------|----------------|
| `global` | 全局变量 | `$$` 前缀变量 | ❌ |
| `trigger` | 触发器参数 | trigger block 的 parameters | ✅ |
| `contextMenu` | 右键菜单变量 | context-menu trigger | ✅ |
| `insertData` | 插入数据变量 | insert-data block | ✅ |
| `blockOutput` | 块输出变量 | 任何有 variableName 的 block | ✅ |
| `other` | 其他变量 | autocomplete 中未匹配的 | ❌ |

#### 变量提取流程

```javascript
const variableGroups = computed(() => {
  const groups = [...]; // 6 个分组
  const addedNames = new Set();
  const drawflow = props.workflow?.drawflow;

  // 1. 提取全局变量 ($$prefix)
  if (autocomplete.variables) {
    Object.keys(autocomplete.variables).forEach((name) => {
      if (name.startsWith('$$')) {
        groups[0].variables.push({ name, isGlobal: true });
      }
    });
  }

  // 2. 遍历所有节点
  if (drawflow?.nodes) {
    drawflow.nodes.forEach((node) => {
      // 2.1 触发器参数
      if (node.label === 'trigger' && node.data?.parameters) {
        node.data.parameters.forEach((param) => {
          groups[1].variables.push({
            name: param.name,
            type: paramTypeLabels[param.type],
            defaultValue: param.defaultValue,
            sourceBlock: getSourceBlock(node),
          });
        });
      }

      // 2.2 右键菜单变量
      if (node.data?.type === 'context-menu') {
        // $ctxElSelector, $ctxTextSelection, etc.
      }

      // 2.3 insert-data 变量
      if (node.label === 'insert-data') {
        node.data.dataList.forEach((item) => {
          if (item.type === 'variable') {
            groups[3].variables.push({ ... });
          }
        });
      }

      // 2.4 块输出变量 (variableName 字段)
      if (node.data?.variableName && node.data?.assignVariable !== false) {
        groups[4].variables.push({
          name: node.data.variableName,
          sourceBlock: getSourceBlock(node),
        });
      }
    });
  }

  // 3. 剩余变量归入 "其他" 分组
  // ...

  return groups;
});
```

### 4. Block 定位功能

```javascript
function locateBlock(nodeId) {
  if (!editor?.value) return;

  const block = editor.value.getNode.value(nodeId);
  if (!block) return;

  // 选中节点
  editor.value.addSelectedNodes([block]);

  // 居中视图
  setTimeout(() => {
    const editorContainer = document.querySelector('.vue-flow');
    const { height, width } = editorContainer.getBoundingClientRect();
    const { x, y } = block.position;

    editor.value.setTransform({
      y: -(y - height / 2),
      x: -(x - width / 2) - 200,
      zoom: 1,
    });
  }, 200);
}
```

## 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                      [id].vue                                │
│  ┌─────────────────┐    provide     ┌────────────────────┐  │
│  │ workflow        │ ─────────────► │ WorkflowVariables  │  │
│  │ autocompleteData│                │                    │  │
│  │ workflow-editor │                │ - 提取变量         │  │
│  └─────────────────┘                │ - 分组渲染         │  │
│                                     │ - 定位 block       │  │
│                                     └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 样式

### 滑入动画

```css
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
.variables-panel {
  will-change: transform;
}
```

## 国际化

### 需要的翻译 key

```json
{
  "workflow.variables": {
    "clickToCopy": "点击复制变量名",
    "copyRef": "复制引用语法",
    "copied": "已复制 \"{name}\" 到剪贴板",
    "copiedRef": "引用语法已复制到剪贴板",
    "global": "全局",
    "source": "来源",
    "clickToLocate": "点击定位到编辑器",
    "empty": "暂无定义的变量",
    "emptyHint": "使用「插入数据」块来创建变量",
    "defaultValue": "默认值",
    "usage": {
      "title": "变量使用方法",
      "access": "访问变量",
      "altSyntax": "替代语法",
      "nested": "嵌套访问"
    },
    "groups": {
      "global": "全局变量",
      "triggerParams": "触发器参数",
      "contextMenu": "右键菜单变量",
      "insertData": "插入数据变量",
      "blockOutput": "块输出变量",
      "other": "其他变量"
    },
    "ctxDesc": {
      "elSelector": "元素的 CSS 选择器",
      "textSelection": "页面选中的文本",
      "link": "链接 URL（点击链接时）",
      "mediaUrl": "媒体 URL（图片/视频/音频）"
    }
  }
}
```

## 扩展指南

### 添加新的变量分组

1. 在 `variableGroups` computed 中添加新分组：

```javascript
{
  id: 'newGroup',
  name: t('workflow.variables.groups.newGroup'),
  icon: 'riIconName',
  variables: [],
}
```

2. 添加提取逻辑：

```javascript
if (node.label === 'new-block-type') {
  const sourceBlock = getSourceBlock(node);
  groups[NEW_INDEX].variables.push({
    name: '...',
    sourceBlock,
  });
}
```

3. 添加翻译 key。

### 添加新的变量属性

在变量对象中添加新属性：

```javascript
groups[X].variables.push({
  name: varName,
  type: 'String',           // 类型
  description: '...',       // 描述
  defaultValue: '...',      // 默认值
  sourceBlock: { ... },     // 来源 block
  newProperty: '...',       // 新属性
});
```

然后在模板中渲染：

```vue
<p v-if="item.newProperty">
  {{ item.newProperty }}
</p>
```

### 支持新的 Block 类型

如果新 block 使用 `variableName` 字段，会自动被检测到。

如果使用其他方式定义变量，需要在 `variableGroups` computed 中添加特殊处理逻辑。

## 已知限制

1. **全局变量无来源信息** - `$$` 前缀的全局变量来自存储，无法追踪到具体 block
2. **其他变量无来源信息** - autocomplete 中的变量在合并后丢失了 block ID
3. **动态变量未显示** - JavaScript 代码中通过 `automaSetVariable` 创建的变量无法静态分析

## 相关文件

- [VARIABLE-SYSTEM-ANALYSIS.md](./VARIABLE-SYSTEM-ANALYSIS.md) - 变量系统完整分析
- [src/utils/editor/editorAutocomplete.js](../src/utils/editor/editorAutocomplete.js) - 自动补全数据提取
- [src/utils/shared.js](../src/utils/shared.js) - Block 定义（含 `autocomplete` 配置）
