# 电信 CRM 自定义 Blocks 实现文档

本文档记录了三个电信 CRM 自定义 blocks 的实现细节，便于后续改进和维护。

---

## 目录结构

```
business/dev/blocks/
├── index.js                                # Block 定义入口
├── backgroundHandler/
│   ├── handlerPackageSubscription.js       # 办理套餐 Handler
│   ├── handlerPackageOperate.js            # 套餐操作 Handler
│   └── handlerPreferenceSetParam.js        # 优惠参数设置 Handler
└── editComponents/
    ├── index.js                            # 编辑组件入口
    ├── EditPackageSubscription/
    │   ├── index.js                        # Block 定义
    │   └── index.vue                       # 编辑 UI
    ├── EditPackageOperate/
    │   ├── index.js
    │   └── index.vue
    └── EditPreferenceSetParam/
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
    icon: 'riCheckDoubleFill',
    component: 'BlockBasic',
    editComponent: 'EditPackageSubscription',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    data: { ... }
  }
}
```

### 数据结构 (`data`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableBlock` | Boolean | `false` | 是否禁用此块 |
| `description` | String | `""` | 块描述 |
| `productList` | Array | `[{...}]` | 产品列表（至少一项） |

### productList 数组项结构

| 字段 | 类型 | 交互方式 | 说明 |
|------|------|----------|------|
| `offerCode` | String | input（支持变量） | 销售品编码 |
| `productType` | String | select | 产品类型 |
| `productName` | String | select | 产品名称 |
| `action` | String | select | 具体动作 |
| `addAccessType` | String | select（动作含"加入"时显示） | 加入类型 |
| `relatedParam` | String | input（支持变量） | 关联参数 |

### action 具体动作选项

| 值 | 说明 |
|----|------|
| `订购:productAction` | 订购 |
| `加入:productAction` | 加入 |
| `其它:productAction` | 其它 |
| `清除:productAction` | 清除 |
| `点击+号后订购:productAction` | 点击+号后订购 |
| `点击+号后加入:productAction` | 点击+号后加入 |
| `点击+号后其它:productAction` | 点击+号后其它 |

### productType 产品类型选项（部分）

- 自动选择、基础有线宽带、基础移动电话、加装移动电话、基础ITV、基础智能组网、基础智能家居、基础固话...

### productName 产品名称选项（部分）

- 自动选择、天翼宽带拨号(原ADSL拨号)、中国电信移动电话、广东IPTV、智能组网、全屋WiFi...

### addAccessType 加入类型选项（部分）

- 销售品内产品-天翼宽带拨号(原ADSL拨号)、融合宽带接入号、融合ITV接入号、新装主卡接入号...

### 编辑组件关键逻辑

```vue
<!-- 加入类型：当动作包含"加入"时显示 -->
<ui-select
  v-if="product.action?.includes('加入')"
  :model-value="product.addAccessType"
  label="加入类型"
  ...
/>
```

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
    editComponent: 'EditPackageOperate',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    data: { ... }
  }
}
```

### 数据结构 (`data`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableBlock` | Boolean | `false` | 是否禁用此块 |
| `description` | String | `""` | 块描述 |
| `packageName` | String | `""` | 套餐名称（支持变量） |
| `packageCode` | String | `""` | 套餐编码（支持 `\|\|` 分隔多个） |
| `objectList` | String | `""` | 对象列表 |
| `packageType` | String | `""` | 套餐类型 |
| `operate` | String | `"退订:td"` | 操作类型 |
| `filterExpired` | Boolean | `true` | 是否过滤过期套餐 |
| `handleSkipValidation` | Boolean | `true` | 是否处理跳过校验 |
| `handleOfflineProduct` | Boolean | `true` | 是否处理下线产品提示 |

### operate 操作类型选项

| 值 | 说明 |
|----|------|
| `预存续约:preStoreRenewal` | 预存续约 |
| `退订:td` | 退订 |
| `拆机登记:disassembleRegister` | 拆机登记 |
| `极简订购:simplestBook` | 极简订购 |
| `变更:change` | 变更 |
| `客户资料变更:custInfoChange` | 客户资料变更 |
| `回执:receipt` | 回执 |
| `详情:details` | 详情 |

### packageType 套餐类型选项

| 值 | 说明 |
|----|------|
| `促销:salesPromotion` | 促销 |
| `套餐销售品:packSale` | 套餐销售品 |
| `可选包:optionalPack` | 可选包 |

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
    editComponent: 'EditPreferenceSetParam',
    category: 'integration',
    inputs: 1,
    outputs: 1,
    data: { ... }
  }
}
```

### 数据结构 (`data`)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableBlock` | Boolean | `false` | 是否禁用此块 |
| `description` | String | `""` | 块描述 |
| `preferenceSetParamList` | Array | `[]` | 参数组列表 |

### preferenceSetParamList 嵌套结构

```js
preferenceSetParamList: [
  {
    paramGroupName: "主套餐",           // 销售品名称
    preferenceSetParamList: [           // 参数项列表
      {
        parameterName: "合约期",        // 参数名称
        parameterType: "下拉选择:select", // 参数类型
        parameterValue: "24个月",       // 参数值
      }
    ]
  }
]
```

### parameterType 参数类型选项

| 值 | 说明 |
|----|------|
| `文本输入:input` | 文本输入框 |
| `下拉选择:select` | 下拉选择框 |

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

        // 4. 返回下一个块
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

// 更新数组项
function updateProduct(index, value) {
  const productList = [...(props.data.productList || [])];
  productList[index] = { ...productList[index], ...value };
  updateData({ productList });
}
</script>
```

---

## 图标参考

图标使用 v-remixicon，可在以下地址预览：
https://preview-v-remixicon.vercel.app/

当前使用的图标：
- `riCheckDoubleFill` - 办理套餐
- `riSettings3Line` - 套餐操作
- `riFileSettingsLine` - 优惠参数设置
- `riAddLine` - 添加按钮
- `riDeleteBin7Line` - 删除按钮
- `riCloseLine` - 关闭/移除按钮
