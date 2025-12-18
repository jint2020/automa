# 电信 CRM 自定义 Blocks 实现文档

本文档记录了三个电信 CRM 自定义 blocks 的实现细节，便于后续改进和维护。

---

## 目录结构

```
business/dev/blocks/
├── index.js                                    # Block 定义入口
├── backgroundHandler/
│   ├── handlerTelecomPackageSubscription.js   # 办理套餐 Handler
│   ├── handlerTelecomPackageOperate.js        # 套餐操作 Handler
│   └── handlerTelecomPreferenceSetParam.js    # 优惠参数设置 Handler
└── editComponents/
    ├── index.js                                # 编辑组件入口
    ├── EditTelecomPackageSubscription/
    │   ├── index.js                            # Block 定义
    │   └── index.vue                           # 编辑 UI
    ├── EditTelecomPackageOperate/
    │   ├── index.js
    │   └── index.vue
    └── EditTelecomPreferenceSetParam/
        ├── index.js
        └── index.vue
```

---

## 1. 办理套餐块 (telecom-package-subscription)

### Block 定义 (`index.js`)

```js
{
  'telecom-package-subscription': {
    name: '办理套餐',
    description: '电信CRM销售品配置，支持订购、加入、其它等操作',
    icon: 'riSettings4Line',
    component: 'BlockBasic',
    editComponent: 'EditTelecomPackageSubscription',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: { ... }  // 默认数据
  }
}
```

### 数据结构 (`data`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableBlock` | Boolean | `false` | 是否禁用此块 |
| `description` | String | `""` | 块描述 |
| `isZtSource` | Boolean | `false` | 是否中台来源（跳过黄金/白金会员） |
| `mutualExclusionCheck` | Boolean | `false` | 通过销售品互斥校验 |
| `skipValidation` | Boolean | `false` | 跳过校验 |
| `productList` | Array | `[]` | 产品列表 |

### productList 数组项结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `offerCode` | String | 销售品编码，支持"自动获取" |
| `productName` | String | 产品名称 |
| `productType` | String | 产品类型 |
| `handlerType` | String | 操作类型（见下表） |
| `addAccessNo` | String | 加入的号码（支持变量如 `key-phone`） |
| `addAccessType` | String | 加入的业务名称 |
| `otherAccessNo` | String | 其它操作的查询号码 |
| `otherQryType` | String | 其它操作的查询类型 |
| `minusNo` | String | 清除操作的号码 |
| `mutualExclusionCheck` | Boolean | 该产品是否通过互斥校验 |

### handlerType 操作类型

| 值 | 说明 | 相关字段 |
|----|------|----------|
| `订购:productAction` | 点击订购按钮 | offerCode, productType, productName |
| `加入:productAction` | 点击加入按钮 | offerCode, addAccessNo/addAccessType |
| `关联参数不为空则加入:productAction` | 仅当 addAccessNo 不为空时加入 | addAccessNo |
| `加入类型存在则加入:productAction` | 加入时若类型不存在则跳过 | addAccessNo |
| `其它:productAction` | 点击其它按钮查询 | otherAccessNo, otherQryType |
| `关联参数不为空则其它:productAction` | 仅当 otherAccessNo 不为空时执行 | otherAccessNo |
| `清除:productAction` | 点击清除按钮删除号码 | minusNo |
| `不处理:productAction` | 取消选中状态 | offerCode |

### 编辑组件关键逻辑

```vue
<!-- 根据 handlerType 动态显示不同的输入字段 -->
<template v-if="product.handlerType?.includes('加入')">
  <!-- 显示 addAccessNo, addAccessType -->
</template>

<template v-if="product.handlerType?.includes('其它')">
  <!-- 显示 otherAccessNo, otherQryType -->
</template>

<template v-if="product.handlerType === '清除:productAction'">
  <!-- 显示 minusNo -->
</template>
```

### 待改进点

- [ ] `productName` 和 `productType` 可改为下拉选择，数据源从配置或 API 获取
- [ ] 添加产品列表的拖拽排序功能
- [ ] 添加产品模板功能，快速添加常用配置
- [ ] 增加批量导入产品列表功能（如从 Excel）

---

## 2. 套餐操作块 (telecom-package-operate)

### Block 定义 (`index.js`)

```js
{
  'telecom-package-operate': {
    name: '套餐操作',
    description: '电信CRM套餐操作，支持退订、变更、预存续约等',
    icon: 'riSettings3Line',
    component: 'BlockBasic',
    editComponent: 'EditTelecomPackageOperate',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: { ... }
  }
}
```

### 数据结构 (`data`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableBlock` | Boolean | `false` | 是否禁用此块 |
| `description` | String | `""` | 块描述 |
| `packageName` | String | `""` | 套餐名称 |
| `packageCode` | String | `""` | 套餐编码（支持 `\|\|` 分隔多个） |
| `objectList` | String | `""` | 对象列表 |
| `packageType` | String | `""` | 套餐类型 |
| `operate` | String | `"退订:td"` | 操作类型 |
| `filterExpired` | Boolean | `true` | 是否过滤过期套餐 |
| `handleSkipValidation` | Boolean | `true` | 是否处理跳过校验 |
| `handleOfflineProduct` | Boolean | `true` | 是否处理下线产品提示 |
| `saveIdCode` | Boolean | `true` | 是否保存证件号码 |
| `idCodeVariable` | String | `"idCode"` | 证件号码保存的变量名 |

### operate 操作类型

| 值 | 说明 |
|----|------|
| `退订:td` | 退订套餐 |
| `变更:change` | 变更套餐 |
| `预存续约:preStoreRenewal` | 预存续约 |
| `客户资料变更:custInfoChange` | 客户资料变更 |

### packageType 套餐类型

| 值 | 说明 |
|----|------|
| `主套餐:main` | 主套餐 |
| `附加套餐:additional` | 附加套餐 |
| `可选包:optional` | 可选包 |

### 待改进点

- [ ] `packageCode` 支持多选或数组形式，而不是 `||` 分隔
- [ ] 添加套餐搜索/选择功能
- [ ] `packageType` 从配置或 API 动态获取
- [ ] 增加操作前的套餐预览功能

---

## 3. 优惠参数设置块 (telecom-preference-set-param)

### Block 定义 (`index.js`)

```js
{
  'telecom-preference-set-param': {
    name: '优惠参数设置',
    description: '电信CRM优惠参数设置，支持文本输入和下拉选择',
    icon: 'riFileSettingsLine',
    component: 'BlockBasic',
    editComponent: 'EditTelecomPreferenceSetParam',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    maxConnection: 1,
    allowedInputs: true,
    data: { ... }
  }
}
```

### 数据结构 (`data`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableBlock` | Boolean | `false` | 是否禁用此块 |
| `description` | String | `""` | 块描述 |
| `isZtSource` | Boolean | `false` | 是否中台来源模式 |
| `waitTimeout` | Number | `5` | 等待超时时间（秒） |
| `handleErrorDialog` | Boolean | `true` | 是否处理错误弹窗 |
| `preferenceSetParamList` | Array | `[]` | 参数组列表 |

### preferenceSetParamList 嵌套结构

```
preferenceSetParamList: [
  {
    paramGroupName: "主套餐",           // 参数组名称（普通模式）或销售品编码（中台模式）
    preferenceSetParamList: [           // 参数项列表
      {
        parameterName: "合约期",        // 参数名称
        parameterType: "下拉选择:select", // 参数类型（仅普通模式）
        parameterValue: "24个月",       // 参数值
        parameterCode: "contractPeriod" // 参数编码（仅中台模式）
      }
    ]
  }
]
```

### parameterType 参数类型（普通模式）

| 值 | 说明 |
|----|------|
| `文本输入:input` | 文本输入框 |
| `下拉选择:select` | 下拉选择框 |

### 编辑组件关键逻辑

```vue
<!-- 根据 isZtSource 显示不同字段 -->

<!-- 参数组名称标签 -->
:label="data.isZtSource ? '销售品编码' : '销售品名称'"

<!-- 普通模式显示参数类型选择 -->
<ui-select v-if="!data.isZtSource" ...>

<!-- 中台模式显示参数编码 -->
<ui-input v-if="data.isZtSource" ...>
```

### 待改进点

- [ ] 添加参数组和参数项的拖拽排序
- [ ] 参数值支持从预定义列表选择（如合约期选项）
- [ ] 添加参数模板功能
- [ ] 中台模式下 `parameterCode` 可从 API 获取可选值
- [ ] 支持参数值的表达式/变量引用

---

## Handler 实现说明

所有 Handler 目前仅实现数据流转，核心结构如下：

```js
export default function () {
  return {
    async handlerName({ data, id }) {
      try {
        // 1. 解构配置数据
        const { field1, field2, ... } = data;

        // 2. 构建配置对象
        const config = { ... };

        // 3. 业务逻辑（待实现）
        // - CRM API 调用
        // - 页面元素操作
        // - 数据提取等

        // 4. 变量赋值（如需要）
        if (saveToVariable) {
          this.setVariable(variableName, value);
        }

        // 5. 返回下一个块
        return {
          data: config,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`操作失败: ${error.message}`);
      }
    },
  };
}
```

### Handler 可用的 this 方法

| 方法 | 说明 |
|------|------|
| `this.getBlockConnections(id)` | 获取下一个连接的块 ID |
| `this.setVariable(name, value)` | 设置工作流变量 |
| `this.addDataToColumn(column, data)` | 添加数据到表格列 |
| `this.referenceData.variables` | 访问工作流变量 |

---

## 通用组件使用

### EditAutocomplete

用于支持 `{{ variable }}` 变量引用的输入框：

```vue
<edit-autocomplete class="mb-2 w-full">
  <ui-input
    :model-value="data.field"
    label="标签"
    placeholder="支持 {{ variable }}"
    @change="updateData({ field: $event })"
  />
</edit-autocomplete>
```

### InsertWorkflowData

用于标准的变量赋值配置：

```vue
<insert-workflow-data :data="data" variables @update="updateData" />
```

---

## 数据更新模式

所有编辑组件使用相同的数据更新模式：

```vue
<script setup>
const props = defineProps({
  data: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:data']);

// 更新单个字段
function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

// 更新数组项（以 productList 为例）
function updateProduct(index, value) {
  const productList = [...(props.data.productList || [])];
  productList[index] = { ...productList[index], ...value };
  updateData({ productList });
}

// 添加数组项
function addProduct() {
  const productList = [...(props.data.productList || [])];
  productList.push({ /* 默认值 */ });
  updateData({ productList });
}

// 删除数组项
function removeProduct(index) {
  const productList = [...(props.data.productList || [])];
  productList.splice(index, 1);
  updateData({ productList });
}
</script>
```

---

## 图标参考

图标使用 v-remixicon，可在以下地址预览：
https://preview-v-remixicon.vercel.app/

当前使用的图标：
- `riSettings4Line` - 办理套餐
- `riSettings3Line` - 套餐操作
- `riFileSettingsLine` - 优惠参数设置
- `riAddLine` - 添加按钮
- `riDeleteBin7Line` - 删除按钮
- `riCloseLine` - 关闭/移除按钮
