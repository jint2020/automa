# TelecomPackageOperateHandler - 电信 CRM 套餐操作处理器

## 概述

TelecomPackageOperateHandler 是一个专门用于在中国电信 CRM 系统中对套餐进行各种操作的块处理器。它支持根据多种条件定位套餐，并能够执行退订、变更、预存续约、客户资料变更等操作，同时自动处理校验、弹窗和下线产品提示等复杂交互。

## 参数说明

### 输入参数（Node Data）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `packageName` | String | `""` | 套餐名称 |
| `packageCode` | String | `""` | 套餐编码（支持"||"分隔多个编码） |
| `objectList` | String | `""` | 对象列表 |
| `packageType` | String | `""` | 套餐类型 |
| `operate` | String | `退订:td` | 操作类型（退订:td、变更:change、预存续约:preStoreRenewal、客户资料变更:custInfoChange） |
| `filterExpired` | Boolean | `true` | 是否过滤过期套餐 |
| `handleSkipValidation` | Boolean | `true` | 是否处理跳过校验 |
| `handleOfflineProduct` | Boolean | `true` | 是否处理下线产品提示 |
| `saveIdCode` | Boolean | `true` | 是否保存证件号码 |
| `idCodeVariable` | String | `idCode` | 证件号码保存变量名 |

### 输出数据（Result Data）

该处理器不返回额外的数据，操作成功或失败通过执行结果表示。

## 使用示例

### 示例 1：退订指定套餐

```json
{
  "label": "telecom-package-operate",
  "data": {
    "packageName": "5G畅享套餐",
    "packageCode": "YD5G01-001-1-1",
    "objectList": "主套餐",
    "packageType": "主套餐:main",
    "operate": "退订:td",
    "filterExpired": true,
    "handleSkipValidation": true,
    "handleOfflineProduct": true,
    "saveIdCode": true,
    "idCodeVariable": "customerIdCode"
  }
}
```

**行为**：
1. 定位同时满足以下条件的套餐：
   - 套餐名称包含"5G畅享套餐"
   - 套餐编码为"YD5G01-001-1-1"
   - 对象列表包含"主套餐"
   - 套餐类型包含"主套餐"
2. 执行退订操作
3. 过滤过期套餐
4. 处理跳过校验流程
5. 处理下线产品提示
6. 提取并保存证件号码到变量"customerIdCode"

### 示例 2：变更套餐

```json
{
  "label": "telecom-package-operate",
  "data": {
    "packageCode": "YD5G01-002-1-1||YD5G01-003-1-1",
    "operate": "变更:change",
    "filterExpired": false,
    "handleSkipValidation": true,
    "handleOfflineProduct": true
  }
}
```

**行为**：
1. 定位套餐编码为"YD5G01-002-1-1"或"YD5G01-003-1-1"的套餐
2. 执行变更操作
3. 不过滤过期套餐
4. 处理跳过校验流程
5. 处理下线产品提示

### 示例 3：预存续约

```json
{
  "label": "telecom-package-operate",
  "data": {
    "packageName": "预存优惠",
    "operate": "预存续约:preStoreRenewal"
  }
}
```

