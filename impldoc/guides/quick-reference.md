# 自定义 Block 开发快速参考

快速查找常用的 API、模式和代码片段。

## 文件模板

### Block 定义模板

```javascript
// business/dev/blocks/index.js
export default function () {
  return {
    'my-custom-block': {
      name: 'My Custom Block',
      description: 'Block description',
      icon: 'riIconName',
      component: 'BlockBasic',
      editComponent: 'EditMyCustomBlock',
      category: 'integration',
      inputs: 1,
      outputs: 1,
      data: {
        disableBlock: false,
        description: '',
        // 自定义字段
        myField: 'default value',
      },
    },
  };
}
```

### Handler 模板

```javascript
// business/dev/blocks/backgroundHandler/handlerMyCustomBlock.js
export default function () {
  return {
    async myCustomBlock({ data, id }, { prevBlockData }) {
      try {
        // 1. 获取配置
        const { myField } = data;

        // 2. 业务逻辑
        const result = await doSomething(myField);

        // 3. 保存数据
        if (data.assignVariable) {
          this.setVariable(data.variableName, result);
        }

        // 4. 返回
        return {
          data: result,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`Custom block error: ${error.message}`);
      }
    },
  };
}
```

### EditComponent 模板

```vue
<!-- business/dev/blocks/editComponents/EditMyCustomBlock.vue -->
<template>
  <div>
    <ui-card class="mb-4">
      <p class="font-semibold mb-2">配置</p>

      <ui-input
        :model-value="data.myField"
        label="My Field"
        placeholder="Enter value"
        @change="updateData({ myField: $event })"
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

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
```

---

## 常用 API

### WorkflowWorker Context API

```javascript
// 设置变量
this.setVariable(name, value)
this.setVariable('myVar', 'value')
this.setVariable('$push:myArray', item)    // 追加到数组
this.setVariable('$$persistent', 'value')  // 持久化变量

// 添加数据到表格
this.addDataToColumn(columnName, value)
this.addDataToColumn('myColumn', { key: 'value' })
this.addDataToColumn([
  { columnA: 'value1' },
  { columnB: 'value2' }
])

// 获取下一个 Block
this.getBlockConnections(blockId)
this.getBlockConnections(blockId, 1)  // 第 1 个输出
this.getBlockConnections(blockId, 2)  // 第 2 个输出

// 访问 referenceData
this.engine.referenceData.variables      // 所有变量
this.engine.referenceData.table         // 表格数据
this.engine.referenceData.secrets       // 加密凭证
this.engine.referenceData.loopData      // 循环数据
this.engine.referenceData.globalData    // 全局数据

// 访问 Workflow 信息
this.engine.workflow                    // Workflow 配置
this.engine.blocks                      // 所有 Block
this.engine.columns                     // 数据列定义
this.activeTab                          // 当前活动 Tab
this.settings                           // Workflow 设置
```

### Browser API Service

```javascript
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

// Tabs API
await BrowserAPIService.tabs.query({ active: true })
await BrowserAPIService.tabs.create({ url: 'https://...' })
await BrowserAPIService.tabs.sendMessage(tabId, message)

// Storage API
await BrowserAPIService.storage.local.get(key)
await BrowserAPIService.storage.local.set({ key: value })

// Notifications API
await BrowserAPIService.notifications.create(id, options)

// Runtime API
BrowserAPIService.runtime.getURL('icon-128.png')
await BrowserAPIService.runtime.sendMessage(message)
```

### 模板字符串渲染

```javascript
import renderString from '@/workflowEngine/templating/renderString';

// 渲染模板字符串
const rendered = await renderString(
  '{{variables.userName}}',
  this.engine.referenceData,
  this
);

// 示例：
// 如果 variables.userName = 'John'
// 则 rendered = 'John'
```

---

## 常用模式

### 1. 从前一个 Block 获取数据

```javascript
async myBlock({ data, id }, { prevBlockData }) {
  // 直接访问前一个 Block 的输出
  const userId = prevBlockData?.userId;
  const userInfo = prevBlockData?.data;

  // 使用数据...
}
```

### 2. 保存数据到变量和表格

```javascript
async myBlock({ data, id }) {
  const result = { id: 123, name: 'John' };

  // 保存到变量
  if (data.assignVariable && data.variableName) {
    this.setVariable(data.variableName, result);
  }

  // 保存到表格列
  if (data.dataColumn) {
    this.addDataToColumn(data.dataColumn, result);
  }

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

### 3. 条件分支（多个输出）

```javascript
// Block 定义
{
  outputs: 2,  // 配置 2 个输出
  // ...
}

// Handler
async conditionalBlock({ data, id }) {
  const result = await checkCondition();

  let nextBlockId;
  if (result.success) {
    nextBlockId = this.getBlockConnections(id, 1); // 输出 1
  } else {
    nextBlockId = this.getBlockConnections(id, 2); // 输出 2
  }

  return {
    data: result,
    nextBlockId,
  };
}
```

### 4. API 调用（使用 Axios）

```javascript
import { http } from '@/apis/interceptor';

async myBlock({ data, id }) {
  try {
    // GET 请求
    const response = await http.get('/api/endpoint');
    const result = response.data?.data || response.data;

    // POST 请求
    const postResponse = await http.post('/api/endpoint', {
      key: 'value'
    });

    return {
      data: result,
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    throw new Error(`API 调用失败: ${error.message}`);
  }
}
```

### 5. 访问环境变量

```javascript
async myBlock({ data, id }) {
  // 访问 Vite 环境变量
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // 访问 Workflow 全局数据
  const globalConfig = JSON.parse(this.engine.workflow.globalData || '{}');
  const customSetting = globalConfig.mySetting;
}
```

### 6. 循环处理数据

```javascript
async processArrayBlock({ data, id }) {
  const items = data.items || [];
  const results = [];

  for (const item of items) {
    const processed = await processItem(item);
    results.push(processed);

    // 保存每个结果到表格
    this.addDataToColumn('processedItems', processed);
  }

  // 保存整个数组到变量
  this.setVariable('allResults', results);

  return {
    data: results,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

### 7. 使用模板变量

```javascript
import renderString from '@/workflowEngine/templating/renderString';

async myBlock({ data, id }) {
  // data.url 可能是 "https://api.example.com/users/{{variables.userId}}"
  const actualUrl = await renderString(
    data.url,
    this.engine.referenceData,
    this
  );

  // 如果 variables.userId = 123
  // actualUrl = "https://api.example.com/users/123"

  const response = await fetch(actualUrl);
  // ...
}
```

### 8. 发送消息到 Content Script

```javascript
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

async myBlock({ data, id }) {
  // 获取活动 Tab
  const [tab] = await BrowserAPIService.tabs.query({
    active: true,
    currentWindow: true
  });

  // 发送消息到 Content Script
  const response = await BrowserAPIService.tabs.sendMessage(tab.id, {
    action: 'extractData',
    selector: data.selector
  });

  return {
    data: response,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

---

## UI 组件使用

### ui-input

```vue
<ui-input
  :model-value="data.field"
  label="Label"
  placeholder="Placeholder"
  type="text"
  class="mb-2"
  @change="updateData({ field: $event })"
/>

<!-- 支持的 type: text, number, email, url, password -->
```

### ui-select

```vue
<ui-select
  :model-value="data.field"
  label="Label"
  placeholder="Select..."
  @change="updateData({ field: $event })"
>
  <option value="value1">Label 1</option>
  <option value="value2">Label 2</option>
</ui-select>

<!-- 或使用循环 -->
<ui-select
  :model-value="data.type"
  label="Type"
  @change="updateData({ type: $event })"
>
  <option v-for="item in options" :key="item.value" :value="item.value">
    {{ item.label }}
  </option>
</ui-select>
```

### ui-checkbox

```vue
<ui-checkbox
  :model-value="data.enabled"
  @change="updateData({ enabled: $event })"
>
  Enable feature
</ui-checkbox>
```

### ui-textarea

```vue
<ui-textarea
  :model-value="data.text"
  label="Text"
  placeholder="Enter text..."
  rows="4"
  @change="updateData({ text: $event })"
/>
```

### ui-card

```vue
<ui-card class="mb-4">
  <p class="font-semibold mb-2">Section Title</p>
  <!-- 内容 -->
</ui-card>
```

---

## 变量模板语法

在编辑组件中，用户可以使用以下模板语法：

```
{{variables.variableName}}           # 访问变量
{{variables.user.name}}              # 访问嵌套属性
{{table.columnName}}                 # 访问表格列
{{globalData.key}}                   # 访问全局数据
{{loopData.0}}                       # 访问循环数据（索引）
{{loopData.item}}                    # 访问循环数据（键）
{{secrets.apiKey}}                   # 访问加密凭证
```

示例：

```vue
<ui-input
  :model-value="data.apiUrl"
  label="API URL"
  placeholder="https://api.example.com/users/{{variables.userId}}"
  @change="updateData({ apiUrl: $event })"
/>
```

---

## 错误处理模式

### 基本错误处理

```javascript
async myBlock({ data, id }) {
  try {
    const result = await riskyOperation();

    return {
      data: result,
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    throw new Error(`操作失败: ${error.message}`);
  }
}
```

### 自定义错误

```javascript
async myBlock({ data, id }) {
  if (!data.requiredField) {
    const error = new Error('required-field-missing');
    error.data = { field: 'requiredField' };
    throw error;
  }

  // 继续处理...
}
```

### 静默失败（返回错误信息而不抛出异常）

```javascript
async myBlock({ data, id }) {
  try {
    const result = await operation();

    return {
      data: { success: true, result },
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    console.error('[MyBlock] Error:', error);

    // 返回错误信息但不中断 Workflow
    return {
      data: { success: false, error: error.message },
      nextBlockId: this.getBlockConnections(id),
    };
  }
}
```

---

## 调试技巧

### 1. 日志输出

```javascript
async myBlock({ data, id }) {
  console.log('[MyBlock] 开始执行', {
    blockId: id,
    config: data
  });

  const result = await operation();

  console.log('[MyBlock] 执行完成', {
    result,
    variables: this.engine.referenceData.variables
  });

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

### 2. 检查 referenceData 状态

```javascript
async myBlock({ data, id }) {
  console.log('当前变量:', this.engine.referenceData.variables);
  console.log('当前表格:', this.engine.referenceData.table);
  console.log('全局数据:', this.engine.workflow.globalData);

  // 业务逻辑...
}
```

### 3. 使用浏览器开发者工具

- 打开 Chrome DevTools (F12)
- 在 Console 面板查看日志
- 使用 debugger 语句设置断点

```javascript
async myBlock({ data, id }) {
  debugger; // 代码会在这里暂停

  const result = await operation();

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

---

## Block 分类参考

| Category | 说明 | 示例 |
|----------|------|------|
| `general` | 通用功能 | Trigger, Delay |
| `browser-interaction` | 浏览器交互 | New Tab, Close Tab |
| `data` | 数据处理 | Insert Data, Export Data |
| `integration` | 集成/API | Webhook, Google Sheets, **自定义 API Block** |
| `control-flow` | 控制流 | Conditions, Loop |
| `element-interaction` | 元素交互 | Click, Type, Extract Data |

---

## 命名约定

| 项目 | 约定 | 示例 |
|------|------|------|
| Block ID | kebab-case | `telecom-query-customer` |
| Handler 文件名 | handler + PascalCase | `handlerCRMGetCustomer.js` |
| Handler 函数名 | camelCase | `crmGetCustomer` |
| EditComponent 文件名 | Edit + PascalCase | `EditCRMGetCustomer.vue` |
| EditComponent 导出名 | 与文件名一致 | `EditCRMGetCustomer` |
| 变量名 | camelCase | `customerData` |
| 表格列名 | camelCase 或 snake_case | `customerInfo` 或 `customer_info` |

---

## 常见场景速查

### API 集成 Block

```javascript
// Handler
import { http } from '@/apis/interceptor';

export default function () {
  return {
    async apiIntegrationBlock({ data, id }) {
      try {
        const response = await http.post(data.endpoint, {
          key: data.value
        });

        const result = response.data?.data || response.data;

        this.setVariable(data.variableName, result);

        return {
          data: result,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`API 调用失败: ${error.message}`);
      }
    },
  };
}
```

### 数据转换 Block

```javascript
export default function () {
  return {
    async dataTransformBlock({ data, id }, { prevBlockData }) {
      const inputData = prevBlockData;

      // 转换逻辑
      const transformed = inputData.map(item => ({
        ...item,
        newField: transformValue(item.oldField)
      }));

      this.setVariable(data.outputVariable, transformed);

      return {
        data: transformed,
        nextBlockId: this.getBlockConnections(id),
      };
    },
  };
}
```

### 条件判断 Block

```javascript
// Block 定义
{
  outputs: 2,  // 真/假两个输出
  // ...
}

// Handler
export default function () {
  return {
    async conditionalBlock({ data, id }, { prevBlockData }) {
      const value = prevBlockData?.value;
      const condition = data.condition;

      const isTrue = evaluateCondition(value, condition);

      const nextBlockId = this.getBlockConnections(id, isTrue ? 1 : 2);

      return {
        data: { condition: isTrue, value },
        nextBlockId,
      };
    },
  };
}
```

---

## 快速检查清单

开发完成后，检查以下项目：

- [ ] Block ID 在整个项目中唯一
- [ ] Handler 函数名使用 camelCase
- [ ] EditComponent 正确导出
- [ ] Block 定义中的 `data` 包含所有必需字段
- [ ] Handler 正确返回 `{ data, nextBlockId }`
- [ ] 错误处理完善
- [ ] 日志输出清晰
- [ ] 变量和表格列命名规范
- [ ] UI 组件使用 `@change` 更新数据
- [ ] 参数验证充分

---

## 相关文档

- [完整开发指南](./custom-block-development.md)
- [Automa 官方文档](https://docs.automa.site/)
- [RemixIcon 图标库](https://preview-v-remixicon.vercel.app/)
- [Vue 3 文档](https://vuejs.org/)
