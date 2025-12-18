# TelecomPreferenceSetParamHandler - 电信 CRM 优惠参数设置处理器

## 概述

TelecomPreferenceSetParamHandler 是一个专门用于在中国电信 CRM 系统中设置优惠参数的块处理器。它支持两种模式（普通模式和中台来源模式），能够处理文本输入和下拉选择两种参数类型，并自动处理错误弹窗。

## 参数说明

### 输入参数（Node Data）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isZtSource` | Boolean | `false` | 是否为中台来源模式 |
| `waitTimeout` | Integer | `5` | 等待元素超时时间（秒） |
| `handleErrorDialog` | Boolean | `true` | 是否处理错误弹窗 |
| `preferenceSetParamList` | Array | `[]` | 优惠参数设置列表 |

#### preferenceSetParamList 参数组配置

每个参数组对象包含以下字段：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `paramGroupName` | String | 是 | 参数组名称（销售品名称） |
| `preferenceSetParamList` | Array | 是 | 参数项列表 |

#### 参数项配置

每个参数项对象包含以下字段：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `parameterName` | String | 是 | 参数名称 |
| `parameterType` | String | 否 | 参数类型（文本输入:input 或 下拉选择:select），仅普通模式使用 |
| `parameterValue` | String | 是 | 参数值 |
| `parameterCode` | String | 否 | 参数编码，仅中台来源模式使用 |

### 输出数据（Result Data）

该处理器不返回额外的数据，设置成功或失败通过执行结果表示。

## 使用示例

### 示例 1：普通模式设置优惠参数

```json
{
  "label": "telecom-preference-set-param",
  "data": {
    "isZtSource": false,
    "waitTimeout": 5,
    "handleErrorDialog": true,
    "preferenceSetParamList": [
      {
        "paramGroupName": "主套餐",
        "preferenceSetParamList": [
          {
            "parameterName": "合约期",
            "parameterType": "下拉选择:select",
            "parameterValue": "24个月"
          },
          {
            "parameterName": "预存金额",
            "parameterType": "文本输入:input",
            "parameterValue": "1000"
          }
        ]
      }
    ]
  }
}
```

**行为**：
1. 使用普通模式处理优惠参数
2. 在"主套餐"参数组中设置两个参数：
   - "合约期"下拉选择"24个月"
   - "预存金额"文本输入"1000"
3. 处理错误弹窗
4. 5秒超时等待元素

### 示例 2：中台来源模式设置优惠参数

```json
{
  "label": "telecom-preference-set-param",
  "data": {
    "isZtSource": true,
    "waitTimeout": 10,
    "handleErrorDialog": true,
    "preferenceSetParamList": [
      {
        "paramGroupName": "YD5G01-018-1-1",
        "preferenceSetParamList": [
          {
            "parameterName": "终端型号",
            "parameterValue": "iPhone 12",
            "parameterCode": "termModel"
          },
          {
            "parameterName": "颜色",
            "parameterValue": "黑色",
            "parameterCode": "color"
          }
        ]
      }
    ]
  }
}
```

