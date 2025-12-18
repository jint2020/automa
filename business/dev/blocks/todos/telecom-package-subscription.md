# 办理套餐块 (telecom-package-subscription)

## 概述

办理套餐块（销售品配置）用于在广东电信CRM系统中配置销售品的订购、加入、其它等各种操作，支持多种产品类型和复杂的业务场景。这是订单流程中的核心环节，相当于原RPA系统中的"销售品配置"模块。

**块标签**: `telecom-package-subscription`
**分类**: 电信CRM (telecom-crm)
**图标**: riSettings4Line

## 配置参数

### 基础配置

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `disableBlock` | Boolean | false | 是否禁用此块 |
| `description` | String | "" | 块描述信息 |
| `isZtSource` | Boolean | false | 是否为中台来源数据（跳过黄金/白金会员） |
| `mutualExclusionCheck` | Boolean | false | 是否通过销售品互斥校验 |
| `skipValidation` | Boolean | false | 是否跳过校验 |

### 产品列表配置 (productList)

`productList` 是一个数组，每个元素包含以下字段：

| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `offerCode` | String | 销售品编码（支持"自动获取"） | "YD5G02-211-1-1" |
| `productName` | String | 产品名称（下拉选项值） | "中国电信移动电话" |
| `productType` | String | 产品类型（用于JS定位销售品行） | "基础移动电话" |
| `addAccessNo` | String | 加入的号码（支持key-变量引用） | "13800138000" 或 "key-phone" |
| `addAccessType` | String | 加入的业务名称 | "天翼宽带拨号(原ADSL拨号)" |
| `otherAccessNo` | String | 其它操作的查询号码 | "13800138000" |
| `otherQryType` | String | 其它操作的查询类型 | "接入号" |
| `minusNo` | String | 清除操作的号码 | "13800138000" |
| `handlerType` | String | 操作类型（详见下表） | "订购:productAction" |
| `mutualExclusionCheck` | Boolean | 该产品是否通过互斥校验（可覆盖全局设置） | false |

### 操作类型 (handlerType)

| 操作类型 | 说明 | 必需参数 |
|----------|------|----------|
| `订购:productAction` | 点击订购按钮 | offerCode, productType, productName |
| `加入:productAction` | 点击加入按钮，根据号码/业务名称加入 | offerCode, addAccessNo 或 addAccessType |
| `关联参数不为空则加入:productAction` | 仅当addAccessNo不为空时加入 | offerCode, addAccessNo |
| `加入类型存在则加入:productAction` | 加入时若类型不存在则跳过 | offerCode, addAccessNo |
| `其它:productAction` | 点击其它按钮，输入号码查询 | offerCode, otherAccessNo, otherQryType |
| `关联参数不为空则其它:productAction` | 仅当otherAccessNo不为空时执行 | offerCode, otherAccessNo |
| `清除:productAction` | 点击清除按钮删除号码 | minusNo |
| `不处理:productAction` | 取消选中状态 | offerCode |

## 使用示例

### 示例1：订购基础移动电话

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "订购主卡套餐",
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础移动电话",
        "productName": "中国电信移动电话",
        "handlerType": "订购:productAction"
      }
    ]
  }
}
```

### 示例2：加入已有宽带号码

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "加入宽带到套餐",
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础有线宽带",
        "productName": "天翼宽带拨号(原ADSL拨号)",
        "addAccessNo": "020-12345678",
        "handlerType": "加入:productAction"
      }
    ]
  }
}
```

### 示例3：使用变量引用

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "使用变量加入号码",
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础移动电话",
        "productName": "中国电信移动电话",
        "addAccessNo": "key-phone",
        "handlerType": "加入:productAction"
      }
    ]
  }
}
```

> 注：`key-phone` 将从工作流变量 `phone` 中获取值

### 示例4：自动获取销售品编码

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "自动获取办理套餐编码",
    "productList": [
      {
        "offerCode": "自动获取",
        "productType": "基础移动电话",
        "productName": "中国电信移动电话",
        "handlerType": "订购:productAction"
      }
    ]
  }
}
```

### 示例5：其它操作（查询接入号）

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "通过接入号查询并加入",
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础移动电话",
        "productName": "中国电信移动电话",
        "otherAccessNo": "13800138000",
        "otherQryType": "接入号",
        "handlerType": "其它:productAction"
      }
    ]
  }
}
```

### 示例6：批量配置多个产品

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "配置主卡、宽带、IPTV",
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础移动电话",
        "productName": "中国电信移动电话",
        "handlerType": "订购:productAction"
      },
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础有线宽带",
        "productName": "天翼宽带拨号(原ADSL拨号)",
        "addAccessNo": "key-wideband",
        "handlerType": "加入:productAction"
      },
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础ITV",
        "productName": "广东IPTV",
        "handlerType": "订购:productAction"
      }
    ]
  }
}
```

### 示例7：处理销售品互斥校验

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "配置并确认互斥校验",
    "mutualExclusionCheck": true,
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productType": "基础移动电话",
        "productName": "中国电信移动电话",
        "handlerType": "订购:productAction",
        "mutualExclusionCheck": true
      }
    ]
  }
}
```

### 示例8：中台来源数据

```json
{
  "label": "telecom-package-order",
  "data": {
    "description": "中台数据订购",
    "isZtSource": true,
    "productList": [
      {
        "offerCode": "YD5G02-211-1-1",
        "productName": "畅享套餐",
        "productType": "基础移动电话",
        "handlerType": "订购:productAction"
      },
      {
        "offerCode": "YD5G02-211-1-2",
        "productName": "黄金会员",
        "productType": "基础移动电话",
        "handlerType": "订购:productAction"
      }
    ]
  }
}
```

