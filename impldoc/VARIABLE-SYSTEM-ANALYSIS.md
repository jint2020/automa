# Automa 变量系统完整分析文档

> 文档创建时间：2025-12-11
> 分析范围：Automa 浏览器自动化扩展的自定义变量系统
> 分析深度：源码级完整探索

---

## 目录

1. [变量系统概述](#变量系统概述)
2. [变量类型详解](#变量类型详解)
3. [变量管理核心方法](#变量管理核心方法)
4. [变量块处理程序](#变量块处理程序)
5. [模板引擎和变量替换](#模板引擎和变量替换)
6. [前端读取变量的方式](#前端读取变量的方式)
7. [调试日志中的变量查看](#调试日志中的变量查看)
8. [JavaScript 代码块中的变量访问](#javascript-代码块中的变量访问)
9. [关键文件汇总](#关键文件汇总)
10. [完整使用示例](#完整使用示例)

---

## 变量系统概述

### referenceData 对象结构

变量系统的核心是 `referenceData` 对象，在 **WorkflowEngine.js** 中定义和管理。

**文件位置**：`src/workflowEngine/WorkflowEngine.js` (lines 81-89)

```javascript
this.referenceData = {
  variables,           // 用户定义和流程中创建的变量
  table: [],          // 数据表行数据
  secrets: {},        // 加密的凭证
  loopData: {},       // 当前循环的迭代数据
  workflow: {},       // 子工作流返回的数据
  googleSheets: {},   // Google Sheets 数据
  globalData: parseJSON(globalData, globalData),  // 全局设置数据
};
```

**主要特点**：
- `referenceData` 在工作流执行期间由 WorkflowEngine 维护
- 所有块处理程序都可以访问 `this.engine.referenceData`
- 数据在执行过程中动态更新和扩展
- 通过块之间的连接线传递数据

---

## 变量类型详解

### 1. 流程变量 (variables)

**存储位置**：`referenceData.variables`

**生命周期**：工作流执行期间临时存储，执行结束后销毁

**访问语法**：`{{ variables.variableName }}`

**特性**：
- 支持任意数据类型（字符串、数字、数组、对象）
- 支持嵌套访问：`{{ variables.user.name }}`
- 支持数组操作：`$push:variableName` 追加到数组

**示例**：
```javascript
variables: {
  userName: 'John Doe',
  counter: 42,
  results: ['a', 'b', 'c'],
  user: {
    id: 1,
    name: 'Alice',
    roles: ['admin', 'user']
  }
}
```

**创建方式**：
- Insert Data 块
- JavaScript Code 块中的 `automaSetVariable()`
- 块处理程序中的 `this.setVariable()`

---

### 2. 全局变量 (以 $$ 为前缀)

**存储位置**：IndexedDB (`dbStorage.variables`)

**生命周期**：持久化存储，跨工作流共享

**访问语法**：`{{ variables.$$globalVar }}`

**数据库定义**：`src/db/storage.js` (line 7)
```javascript
dbStorage.version(2).stores({
  variables: '++id, &name',  // name 是唯一索引
  // ...
});
```

**初始化加载**：`src/workflowEngine/WorkflowEngine.js` (lines 303-306)
```javascript
const variables = await dbStorage.variables.toArray();
variables.forEach(({ name, value }) => {
  this.referenceData.variables[`$$${name}`] = value;  // 使用 $$ 前缀
});
```

**自动持久化**：
- 当变量名以 `$$` 开头时，`setVariable` 自动保存到 IndexedDB
- 更新或插入操作自动执行

**用途**：
- API 密钥和令牌
- 配置信息
- 跨工作流共享的数据

---

### 3. 表格数据 (table)

**存储位置**：`referenceData.table`

**数据结构**：数组，每行是一个对象

**访问语法**：
- `{{ table.0.columnName }}` - 访问第一行的列
- `{{ table.$last.columnName }}` - 访问最后一行的列
- `{{ table.5.price }}` - 访问第 6 行（索引从 0 开始）

**示例**：
```javascript
table: [
  { productName: 'Item A', price: 100, stock: 50 },
  { productName: 'Item B', price: 200, stock: 30 },
  { productName: 'Item C', price: 150, stock: 0 }
]
```

**列管理**：
- `this.engine.columns` 存储列定义
- `this.engine.columnsId` 存储列 ID 映射
- 每列有 `index` 属性跟踪当前插入位置

**操作方法**：
- `this.addDataToColumn(key, value)` - 添加数据到列
- Delete Data 块 - 删除列或清空表格

**用途**：
- 网页数据抓取结果
- 批量处理的数据集
- 导出为 CSV/JSON

---

### 4. 循环变量 (loopData)

**存储位置**：`referenceData.loopData`

**生命周期**：循环块执行期间

**访问语法**：
- `{{ loopData.data.$index }}` - 当前索引（从 0 开始）
- `{{ loopData.data.$item }}` - 当前项目（数组循环）
- `{{ loopData.data.propertyName }}` - 当前对象的属性

**创建块**：
- Loop Data - 遍历数组或对象
- Loop Elements - 遍历网页元素
- While Loop - 条件循环

**特殊变量**：
```javascript
loopData: {
  loopId: 'block-abc123',    // 循环块的 ID
  data: {
    $index: 0,               // 当前迭代索引
    $item: 'current value',  // 当前项（原始值）
    // ... 当前项的所有属性展开
  }
}
```

**嵌套循环**：
- 外层循环：`{{ loopData@outerLoopId.data.$index }}`
- 内层循环：`{{ loopData@innerLoopId.data.$index }}`

---

### 5. 密钥变量 (secrets)

**存储位置**：`referenceData.secrets`

**用途**：加密凭证（如 API 密钥、密码）

**访问语法**：`{{ secrets.credentialName }}`

**数据库定义**：`src/db/storage.js`
```javascript
dbStorage.version(2).stores({
  credentials: '++id, &name',
  // ...
});
```

**特性**：
- 加密存储
- 不会在日志中明文显示
- 通常与 HTTP 请求、Webhook 等集成块配合使用

---

### 6. 工作流变量 (workflow)

**存储位置**：`referenceData.workflow`

**用途**：存储子工作流返回的数据

**访问语法**：`{{ workflow.returnedData }}`

**创建方式**：Execute Workflow 块

**示例**：
```javascript
workflow: {
  status: 'success',
  result: {
    processedCount: 42,
    errors: []
  }
}
```

**用途**：
- 模块化工作流设计
- 子流程间的数据传递
- 复用工作流逻辑

---

### 7. Google Sheets 变量 (googleSheets)

**存储位置**：`referenceData.googleSheets`

**用途**：从 Google Sheets 读取的数据

**访问语法**：`{{ googleSheets.sheetName }}`

**创建块**：Google Sheets 集成块

**数据格式**：
```javascript
googleSheets: {
  'Sheet1': [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ]
}
```

---

### 8. 全局数据 (globalData)

**存储位置**：`referenceData.globalData`

**用途**：工作流级别的全局配置

**访问语法**：`{{ globalData.key }}`

**定义位置**：工作流编辑器 → Global Data 标签

**格式**：JSON 字符串

**示例**：
```json
{
  "apiBaseUrl": "https://api.example.com",
  "timeout": 5000,
  "retryCount": 3
}
```

**解析**：在 WorkflowEngine 初始化时自动解析
```javascript
globalData: parseJSON(globalData, globalData)
```

---

## 变量管理核心方法

### setVariable(name, value)

**文件位置**：`src/workflowEngine/WorkflowWorker.js` (lines 112-141)

**功能**：设置流程变量或全局变量

**源码**：
```javascript
async setVariable(name, value) {
  let variableName = name;
  const vars = this.engine.referenceData.variables;

  // 支持 $push: 前缀用于数组追加
  if (name.startsWith('$push:')) {
    const { 1: varName } = name.split('$push:');

    if (!objectHasKey(vars, varName)) vars[varName] = [];
    else if (!Array.isArray(vars[varName])) vars[varName] = [vars[varName]];

    vars[varName].push(value);
    variableName = varName;
  } else {
    vars[name] = value;
  }

  // 如果是全局变量（$$前缀），同步到数据库
  if (variableName.startsWith('$$')) {
    variableName = variableName.slice(2);

    const findStorageVar = await dbStorage.variables.get({
      name: variableName,
    });

    if (findStorageVar)
      await dbStorage.variables.update(findStorageVar.id, { value });
    else await dbStorage.variables.add({ name: variableName, value });
  }

  // 创建变量快照用于日志
  this.engine.addRefDataSnapshot('variables');
}
```

**特性**：
1. **数组追加语法**：`$push:variableName`
   - 自动创建数组（如果不存在）
   - 将非数组值转换为数组
   - 追加新值到数组末尾

2. **全局变量持久化**：`$$variableName`
   - 自动保存到 IndexedDB
   - 更新已存在的变量或插入新变量

3. **快照机制**：
   - 每次修改后创建快照
   - 用于调试日志和回溯

**调用示例**：
```javascript
// 普通变量
await this.setVariable('userName', 'Alice');

// 数组追加
await this.setVariable('$push:results', 'item1');
await this.setVariable('$push:results', 'item2');
// results = ['item1', 'item2']

// 全局变量
await this.setVariable('$$apiKey', 'secret-123');
```

---

### addDataToColumn(key, value)

**文件位置**：`src/workflowEngine/WorkflowWorker.js` (lines 77-110)

**功能**：向表格列添加数据

**源码**：
```javascript
addDataToColumn(key, value) {
  if (Array.isArray(key)) {
    key.forEach((item) => {
      if (!isObject(item)) return;
      Object.entries(item).forEach(([itemKey, itemValue]) => {
        this.addDataToColumn(itemKey, itemValue);
      });
    });
    return;
  }

  const insertDefault = this.settings.insertDefaultColumn ?? true;
  const columnId = (this.engine.columns[key] ? key : this.engine.columnsId[key]) || 'column';

  if (columnId === 'column' && !insertDefault) return;

  const currentColumn = this.engine.columns[columnId];
  const columnName = currentColumn.name || 'column';
  const convertedValue = convertData(value, currentColumn.type);

  if (objectHasKey(this.engine.referenceData.table, currentColumn.index)) {
    // 更新已存在的行
    this.engine.referenceData.table[currentColumn.index][columnName] = convertedValue;
  } else {
    // 创建新行
    this.engine.referenceData.table.push({
      [columnName]: convertedValue,
    });
  }

  currentColumn.index += 1;
}
```

**特性**：
1. **递归处理数组和对象**
2. **列索引自动管理**：每列维护独立的插入位置
3. **类型转换**：根据列定义自动转换数据类型
4. **默认列处理**：可配置是否插入到默认列

**使用场景**：
- 网页数据抓取
- Get Text 块的输出
- Element Attribute 块的结果

---

### addRefDataSnapshot(key)

**文件位置**：`src/workflowEngine/WorkflowEngine.js` (lines 324-330)

**功能**：创建变量快照用于调试

**源码**：
```javascript
addRefDataSnapshot(key) {
  this.refDataSnapshotsKeys[key].index += 1;
  this.refDataSnapshotsKeys[key].key = key;

  const keyName = this.refDataSnapshotsKeys[key].key;
  this.refDataSnapshots[keyName] = cloneDeep(this.referenceData[key]);
}
```

**用途**：
- 调试日志中查看变量状态
- 追踪变量修改历史
- 回溯执行过程

---

## 变量块处理程序

### 1. Insert Data（插入数据）

**块 ID**：`insert-data`

**文件位置**：
- 处理程序：`src/workflowEngine/blocksHandler/handlerInsertData.js`
- 块定义：`src/utils/shared.js` (lines 951-967)

**块配置**：
```javascript
'insert-data': {
  name: 'Insert data',
  description: 'Insert data into table or variable',
  icon: 'riDatabase2Line',
  component: 'BlockBasic',
  category: 'data',
  editComponent: 'EditInsertData',
  inputs: 1,
  outputs: 1,
  data: {
    disableBlock: false,
    description: '',
    dataList: [
      {
        type: 'variable',    // 或 'table'
        name: 'variableName',
        value: 'some value',
        isFile: false
      }
    ],
  },
}
```

**处理逻辑**：
```javascript
async function insertData({ id, data }, { refData }) {
  const replacedValueList = {};

  for (const item of data.dataList) {
    let value = '';

    if (item.isFile) {
      // 处理文件导入
      const fileData = await chrome.runtime.sendMessage({
        type: 'fetch:text',
        data: { resource: item.value },
      });
      value = parseJSON(fileData, fileData);
    } else {
      // 渲染模板字符串
      const replacedValue = await renderString(item.value, refData, this.engine.isPopup);
      value = parseJSON(replacedValue.value, replacedValue.value);
    }

    // 插入到表或变量
    if (item.type === 'table') {
      const values = typeof value === 'string' ? value.split('||') : [value];
      values.forEach((tableValue) => {
        this.addDataToColumn(item.name, tableValue);
      });
    } else {
      const variableName = await renderString(item.name, refData, this.engine.isPopup);
      await this.setVariable(variableName.value, value);
    }
  }

  return {
    data: '',
    replacedValue: replacedValueList,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

**特性**：
- 支持文件导入（本地文件或 URL）
- 支持模板变量替换
- 支持批量插入（dataList 数组）
- 表格插入支持 `||` 分隔符（一次插入多个值）

---

### 2. Delete Data（删除数据）

**块 ID**：`delete-data`

**文件位置**：`src/workflowEngine/blocksHandler/handlerDeleteData.js`

**块配置**：
```javascript
data: {
  deleteList: [
    {
      type: 'variable',     // 或 'table'
      variableName: 'varToDelete',
      columnId: '[all]'     // 对于表格
    }
  ]
}
```

**处理逻辑**：
```javascript
function deleteData({ data, id }) {
  return new Promise((resolve) => {
    let variableDeleted = false;

    data.deleteList.forEach((item) => {
      if (item.type === 'table') {
        if (item.columnId === '[all]') {
          // 清空整个表格
          this.engine.referenceData.table = [];
          Object.keys(this.engine.columns).forEach((key) => {
            this.engine.columns[key].index = 0;
          });
        } else {
          // 删除指定列
          const columnName = this.engine.columns[item.columnId].name;
          this.engine.referenceData.table.forEach((_, index) => {
            const row = this.engine.referenceData.table[index];
            delete row[columnName];
            if (!row || Object.keys(row).length === 0) {
              this.engine.referenceData.table[index] = {};
            }
          });
          this.engine.columns[item.columnId].index = 0;
        }
      } else if (item.variableName) {
        // 删除变量
        delete this.engine.referenceData.variables[item.variableName];
        variableDeleted = true;
      }
    });

    if (variableDeleted) this.engine.addRefDataSnapshot('variables');

    resolve({
      data: '',
      nextBlockId: this.getBlockConnections(id),
    });
  });
}
```

**特性**：
- 支持删除单个或多个变量
- 支持删除表格列或清空整个表格
- 删除列时保留表格结构（空对象）
- 自动重置列索引

---

### 3. Increase Variable（递增变量）

**块 ID**：`increase-variable`

**文件位置**：`src/workflowEngine/blocksHandler/handlerIncreaseVariable.js`

**块配置**：
```javascript
data: {
  variableName: 'counter',
  increaseBy: 1
}
```

**处理逻辑**：
```javascript
export async function increaseVariable({ id, data }) {
  const refVariables = this.engine.referenceData.variables;
  const variableExist = objectPath.has(refVariables, data.variableName);

  if (!variableExist) {
    throw new Error(`Cant find "${data.variableName}" variable`);
  }

  const currentVar = +objectPath.get(refVariables, data.variableName);
  if (Number.isNaN(currentVar)) {
    throw new Error(`The "${data.variableName}" variable value is not a number`);
  }

  objectPath.set(
    this.engine.referenceData.variables,
    data.variableName,
    currentVar + data.increaseBy
  );

  return {
    data: refVariables[data.variableName],
    nextBlockId: this.getBlockConnections(id),
  };
}
```

**特性**：
- 支持正负数递增/递减
- 支持嵌套变量路径：`user.age`
- 自动类型检查（必须是数字）
- 返回更新后的值

**使用场景**：
- 计数器
- 迭代索引
- 分页参数

---

### 4. Regex Variable（正则表达式）

**块 ID**：`regex-variable`

**文件位置**：`src/workflowEngine/blocksHandler/handlerRegexVariable.js`

**块配置**：
```javascript
data: {
  variableName: 'text',
  method: 'match',         // 或 'replace'
  expression: '\\d+',
  flag: ['g', 'i'],        // 正则标志
  replaceVal: ''           // 替换值（method=replace 时）
}
```

**处理逻辑**：
```javascript
export async function regexVariable({ id, data }) {
  const refVariables = this.engine.referenceData.variables;
  const variableExist = objectPath.has(refVariables, data.variableName);

  if (!variableExist) {
    throw new Error(`Cant find "${data.variableName}" variable`);
  }

  const str = objectPath.get(refVariables, data.variableName);
  if (typeof str !== 'string') {
    throw new Error(`The value of the "${data.variableName}" variable is not a string/text`);
  }

  const method = data.method || 'match';
  const regex = new RegExp(data.expression, data.flag.join(''));

  let newValue = '';

  if (method === 'match') {
    const matches = str.match(regex);
    newValue = matches && !data.flag.includes('g') ? matches[0] : matches;
  } else if (method === 'replace') {
    newValue = str.replace(regex, data.replaceVal ?? '');
  }

  objectPath.set(
    this.engine.referenceData.variables,
    data.variableName,
    newValue
  );

  return {
    data: newValue,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

**特性**：
- 支持全局匹配（g 标志）
- 支持大小写不敏感（i 标志）
- match 方法：返回匹配数组或首个匹配
- replace 方法：替换匹配的文本

**使用场景**：
- 提取数字、日期、邮箱
- 清理文本格式
- 数据验证

---

### 5. Slice Variable（切片）

**块 ID**：`slice-variable`

**文件位置**：`src/workflowEngine/blocksHandler/handlerSliceVariable.js`

**块配置**：
```javascript
data: {
  variableName: 'array',
  startIdxEnabled: true,
  startIndex: 0,
  endIdxEnabled: true,
  endIndex: 5
}
```

**处理逻辑**：
```javascript
export async function sliceData({ id, data }) {
  const variable = objectPath.get(
    this.engine.referenceData.variables,
    data.variableName
  );

  const payload = {
    data: variable,
    nextBlockId: this.getBlockConnections(id),
  };

  if (!variable || !variable?.slice) return payload;

  let startIndex = 0;
  let endIndex = variable.length;

  if (data.startIdxEnabled) {
    startIndex = data.startIndex;
  }
  if (data.endIdxEnabled) {
    endIndex = data.endIndex;
  }

  const slicedVariable = variable.slice(startIndex, endIndex);
  payload.data = slicedVariable;

  objectPath.set(
    this.engine.referenceData.variables,
    data.variableName,
    slicedVariable
  );

  return payload;
}
```

**特性**：
- 支持字符串和数组
- 可选的起始/结束索引
- 负数索引支持
- 直接修改原变量

**使用场景**：
- 截取字符串
- 数组分页
- 移除前缀/后缀

---

### 6. Data Mapping（数据映射）

**块 ID**：`data-mapping`

**文件位置**：`src/workflowEngine/blocksHandler/handlerDataMapping.js`

**块配置**：
```javascript
data: {
  dataSource: 'table',      // 或 'variable'
  varSourceName: 'sourceVar',
  sources: [
    {
      name: 'oldKey',
      destinations: [
        { name: 'newKey' }
      ]
    }
  ],
  assignVariable: true,
  variableName: 'mappedData',
  saveData: false,
  dataColumn: 'column1'
}
```

**处理逻辑**：
```javascript
export async function dataMapping({ id, data }) {
  let dataToMap = null;

  // 获取源数据
  if (data.dataSource === 'table') {
    dataToMap = this.engine.referenceData.table;
  } else if (data.dataSource === 'variable') {
    const { variables } = this.engine.referenceData;

    if (!objectHasKey(variables, data.varSourceName)) {
      throw new Error(`Cant find "${data.varSourceName}" variable`);
    }

    dataToMap = variables[data.varSourceName];
  }

  if (!isObject(dataToMap) && !Array.isArray(dataToMap)) {
    const dataType = dataToMap === null ? 'null' : typeof dataToMap;
    throw new Error(`Can't map data with "${dataType}" data type`);
  }

  // 执行映射
  if (isObject(dataToMap)) {
    dataToMap = mapData(dataToMap, data.sources);
  } else {
    dataToMap = dataToMap.map((item) => mapData(item, data.sources));
  }

  // 保存结果
  if (data.assignVariable) {
    await this.setVariable(data.variableName, dataToMap);
  }
  if (data.saveData) {
    this.addDataToColumn(data.dataColumn, dataToMap);
  }

  return {
    data: dataToMap,
    nextBlockId: this.getBlockConnections(id),
  };
}
```

**mapData 函数**：
```javascript
function mapData(data, sources) {
  const result = {};

  sources.forEach(({ name, destinations }) => {
    const value = objectPath.get(data, name);

    destinations.forEach((dest) => {
      objectPath.set(result, dest.name, value);
    });
  });

  return result;
}
```

**特性**：
- 支持对象和数组映射
- 多源到多目标的映射
- 支持嵌套路径
- 可选地保存到变量或表格

**使用场景**：
- API 响应转换
- 数据结构重组
- 字段重命名

---

## 模板引擎和变量替换

### 变量语法概览

在块的字符串字段中使用 `{{ }}` 语法引用变量：

```javascript
// 基本变量引用
{{ variables.variableName }}
{{ table.0.columnName }}
{{ loopData.data.$index }}
{{ globalData.apiUrl }}
{{ secrets.apiKey }}
{{ workflow.result }}

// @ 替代 . （避免某些解析问题）
{{ variables@variableName }}
{{ table@0@columnName }}

// 特殊语法
{{ table.$last.price }}              // 访问最后一行
{{ loopData@loopId.data.$index }}   // 指定循环 ID

// JavaScript 表达式（使用 !! 前缀）
{{ !!variables.counter + 1 }}
{{ !!variables.price * 1.2 }}
{{ !!variables.age > 18 ? 'adult' : 'minor' }}

// 模板函数
{{ date('DD-MM-YYYY') }}
{{ randint(1, 100) }}
{{ getLength(variables.array) }}
{{ slice(variables.text, 0, 10) }}
{{ multiply(variables.price, 1.5) }}
{{ increment(variables.count, 5) }}
```

---

### 核心文件结构

**模板引擎目录**：`src/workflowEngine/templating/`

```
templating/
├── index.js                    # 主入口，块模板渲染
├── renderString.js             # 字符串模板渲染
├── mustacheReplacer.js         # Mustache 语法解析器
├── templatingFunctions.js      # 模板函数库
└── utils.js                    # 工具函数
```

---

### 模板渲染流程

#### 1. 块级渲染（index.js）

**文件位置**：`src/workflowEngine/templating/index.js`

```javascript
export default async function ({ block, refKeys, data, isPopup }) {
  if (!refKeys || refKeys.length === 0) return block;

  const copyBlock = cloneDeep(block);
  const addReplacedValue = (value) => {
    if (!copyBlock.replacedValue) copyBlock.replacedValue = {};
    copyBlock.replacedValue = { ...copyBlock.replacedValue, ...value };
  };

  // 遍历需要替换的字段
  for (const blockDataKey of refKeys) {
    const currentData = objectPath.get(copyBlock.data, blockDataKey);

    if (Array.isArray(currentData)) {
      // 数组：逐个渲染
      for (let index = 0; index < currentData.length; index += 1) {
        const value = currentData[index];
        const renderedValue = await renderString(value, data, isPopup);

        addReplacedValue(renderedValue.list);
        objectPath.set(copyBlock.data, `${blockDataKey}.${index}`, renderedValue.value);
      }
    } else if (typeof currentData === 'string') {
      // 字符串：直接渲染
      const renderedValue = await renderString(currentData, data, isPopup);

      addReplacedValue(renderedValue.list);
      objectPath.set(copyBlock.data, blockDataKey, renderedValue.value);
    }
  }

  return copyBlock;
}
```

**特性**：
- 根据块定义的 `refKeys` 字段确定需要渲染的属性
- 支持数组和字符串类型字段
- 保存替换前后的值映射（用于调试）

**refKeys 示例**：
```javascript
// 块定义中的 refKeys
'click-element': {
  refKeys: ['selector', 'description'],  // 这些字段支持模板变量
  data: {
    selector: '{{ variables.buttonId }}',
    description: 'Click {{ variables.target }}'
  }
}
```

---

#### 2. 字符串渲染（renderString.js）

**文件位置**：`src/workflowEngine/templating/renderString.js`

**主函数**：
```javascript
export default async function renderString(str, data = {}, isPopup = false) {
  if (typeof str !== 'string') return { value: str, list: {} };

  let result = str;
  const replacedList = {};

  try {
    // 处理 JavaScript 表达式（!! 前缀）
    if (str.startsWith('!!')) {
      const code = str.slice(2);
      result = evalJavaScriptCode(code, data);

      replacedList[str] = result;

      return { value: result, list: replacedList };
    }

    // 处理 Mustache 模板
    const mustacheResult = await mustacheReplacer({
      str,
      data,
      isPopup,
    });

    result = mustacheResult.value;
    Object.assign(replacedList, mustacheResult.list);

  } catch (error) {
    console.error('Template rendering error:', error);
  }

  return { value: result, list: replacedList };
}
```

**特性**：
1. **JavaScript 表达式评估**：
   - 以 `!!` 开头的字符串作为 JS 代码执行
   - 可访问 `referenceData` 中的所有数据
   - 支持算术运算、条件表达式等

2. **Mustache 模板处理**：
   - 标准的 `{{ variable }}` 语法
   - 支持函数调用
   - 支持嵌套访问

---

#### 3. Mustache 替换器（mustacheReplacer.js）

**文件位置**：`src/workflowEngine/templating/mustacheReplacer.js`

**keyParser 函数** - 核心路径解析器：
```javascript
export function keyParser(key, data) {
  let [dataKey, path] = key.split(/[@.](.+)/);

  // 映射别名到实际键
  dataKey = refKeys[dataKey] ?? dataKey;

  if (!path) return { dataKey, path: '' };

  // 特殊处理：loopData 自动插入 .data
  if (dataKey === 'loopData' && !path.endsWith('.$index')) {
    const pathArr = path.split('.');
    pathArr.splice(1, 0, 'data');
    path = pathArr.join('.');
  }

  // 特殊处理：table 的路径解析
  if (dataKey !== 'table') {
    return { dataKey, path };
  }

  const [firstPath, restPath] = path.split(/\.(.+)/);

  if (firstPath === '$last') {
    // $last 转换为实际索引
    const lastIndex = data.table.length - 1;
    path = `${lastIndex}.${restPath || ''}`;
  } else if (!restPath) {
    // 默认访问第一行
    path = `0.${firstPath}`;
  } else if (typeof +firstPath !== 'number' || Number.isNaN(+firstPath)) {
    // 非数字路径，自动补充索引 0
    path = `0.${firstPath}.${restPath}`;
  }

  path = path.replace(/\.$/, '');

  return { dataKey: 'table', path };
}
```

**mustacheReplacer 函数**：
```javascript
export default async function ({ str, data, isPopup }) {
  const replacedList = {};

  // 匹配所有 {{ ... }} 标记
  const regex = /\{\{(.+?)\}\}/g;
  const matches = [...str.matchAll(regex)];

  for (const match of matches) {
    const [fullMatch, expression] = match;

    // 解析表达式
    let value;
    if (expression.includes('(') && expression.includes(')')) {
      // 函数调用
      value = await evaluateFunction(expression, data, isPopup);
    } else {
      // 变量访问
      const { dataKey, path } = keyParser(expression, data);
      value = objectPath.get(data[dataKey], path);
    }

    // 替换
    str = str.replace(fullMatch, value ?? '');
    replacedList[fullMatch] = value;
  }

  return { value: str, list: replacedList };
}
```

**refKeys 别名映射**：
```javascript
const refKeys = {
  vars: 'variables',
  var: 'variables',
  variable: 'variables',
  secret: 'secrets',
  loop: 'loopData',
  global: 'globalData',
  sheet: 'googleSheets',
};
```

使用示例：
```javascript
{{ vars.counter }}        // 等同于 {{ variables.counter }}
{{ var@userName }}        // 等同于 {{ variables@userName }}
{{ secret.apiKey }}       // 等同于 {{ secrets.apiKey }}
{{ loop.data.$index }}    // 等同于 {{ loopData.data.$index }}
```

---

### 模板函数库

**文件位置**：`src/workflowEngine/templating/templatingFunctions.js`

#### 日期函数

```javascript
date(...args)
```

**功能**：格式化日期

**参数**：
- `date()` - 返回当前日期，默认格式 `DD-MM-YYYY`
- `date('YYYY-MM-DD')` - 返回指定格式的当前日期
- `date('2023-12-25', 'YYYY-MM-DD')` - 格式化指定日期
- `date('relative')` - 返回相对时间（如 "2 hours ago"）
- `date('timestamp')` - 返回时间戳（毫秒）

**使用示例**：
```javascript
{{ date('YYYY-MM-DD HH:mm:ss') }}
{{ date('relative') }}
{{ date(variables.startDate, 'DD/MM/YYYY') }}
```

---

#### 随机数函数

```javascript
randint(min = 0, max = 100)
```

**功能**：生成随机整数

**使用示例**：
```javascript
{{ randint(1, 100) }}
{{ randint(0, 10) }}
```

---

#### 长度函数

```javascript
getLength(str)
```

**功能**：获取字符串或数组长度

**使用示例**：
```javascript
{{ getLength(variables.array) }}
{{ getLength(table) }}
```

---

#### 切片函数

```javascript
slice(value, start, end)
```

**功能**：切片字符串或数组

**使用示例**：
```javascript
{{ slice(variables.text, 0, 10) }}
{{ slice(variables.array, -5) }}
```

---

#### 数学函数

```javascript
multiply(value, multiplyBy)
increment(value, incrementBy)
divide(value, divideBy)
modulo(value, modBy)
```

**使用示例**：
```javascript
{{ multiply(variables.price, 1.2) }}
{{ increment(variables.counter, 5) }}
{{ divide(variables.total, variables.count) }}
{{ modulo(loopData.data.$index, 2) }}
```

---

#### JSONPath 过滤

```javascript
filter(data, expression)
```

**功能**：使用 JSONPath 表达式过滤数据

**使用示例**：
```javascript
{{ filter(table, '$[?(@.price > 100)]') }}
{{ filter(variables.users, '$[?(@.active == true)]') }}
```

---

#### 字符串函数

```javascript
replace(str, search, replacement)
substring(str, start, length)
toLowerCase(str)
toUpperCase(str)
```

**使用示例**：
```javascript
{{ replace(variables.text, 'old', 'new') }}
{{ substring(variables.title, 0, 50) }}
{{ toLowerCase(variables.name) }}
{{ toUpperCase(variables.code) }}
```

---

#### 编码函数

```javascript
encodeURI(str)
decodeURI(str)
btoa(str)        // Base64 编码
atob(str)        // Base64 解码
```

**使用示例**：
```javascript
{{ encodeURI(variables.searchQuery) }}
{{ btoa(variables.credentials) }}
```

---

### JavaScript 表达式评估

**语法**：`{{ !!expression }}`

**功能**：执行任意 JavaScript 代码

**可用上下文**：
```javascript
{
  variables: { ... },
  table: [ ... ],
  loopData: { ... },
  globalData: { ... },
  secrets: { ... },
  workflow: { ... },
  googleSheets: { ... }
}
```

**使用示例**：

1. **算术运算**：
```javascript
{{ !!variables.price * 1.2 }}
{{ !!variables.total - variables.discount }}
{{ !!(variables.subtotal + variables.tax).toFixed(2) }}
```

2. **条件表达式**：
```javascript
{{ !!variables.age >= 18 ? 'adult' : 'minor' }}
{{ !!variables.score > 60 ? 'pass' : 'fail' }}
```

3. **数组操作**：
```javascript
{{ !!variables.items.length }}
{{ !!variables.prices.reduce((a, b) => a + b, 0) }}
{{ !!variables.names.join(', ') }}
```

4. **对象访问**：
```javascript
{{ !!variables.user.profile.name }}
{{ !!Object.keys(variables.config).length }}
```

5. **字符串操作**：
```javascript
{{ !!variables.text.split(' ').length }}
{{ !!variables.url.replace('http://', 'https://') }}
```

6. **JSON 操作**：
```javascript
{{ !!JSON.stringify(variables.data) }}
{{ !!JSON.parse(variables.jsonString).id }}
```

---

## 前端读取变量的方式

### 方式 1：模板语法 `{{ }}` （最常用）

**适用场景**：所有块的字符串字段

**工作原理**：
1. 用户在块配置中输入 `{{ variables.myVar }}`
2. 工作流执行时，块处理程序调用 `renderString()`
3. 模板引擎解析并替换变量
4. 块接收替换后的值

**示例**：

**Click Element 块**：
```javascript
{
  selector: '#button-{{ variables.buttonId }}',
  description: 'Click {{ variables.targetName }}'
}
```

渲染后：
```javascript
{
  selector: '#button-submit',
  description: 'Click Submit Button'
}
```

**HTTP Request 块**：
```javascript
{
  url: '{{ globalData.apiUrl }}/users/{{ variables.userId }}',
  headers: {
    'Authorization': 'Bearer {{ secrets.apiToken }}'
  }
}
```

---

### 方式 2：自动完成组件（编辑时）

**文件位置**：`src/components/newtab/workflow/edit/EditAutocomplete.vue`

**工作流程**：

1. **收集自动完成数据**（`src/utils/editor/editorAutocomplete.js`）：
   ```javascript
   const autocompleteKeys = {
     loopId: 'loopData',
     refKey: 'googleSheets',
     variableName: 'variables',
   };

   function getData(blockName, blockData) {
     const keys = blocks[blockName]?.autocomplete;
     const dataList = {};

     if (!keys) return dataList;

     keys.forEach((key) => {
       const value = blockData[key];
       if (!value) return;

       const autocompleteKey = autocompleteKeys[key];
       if (!dataList[autocompleteKey]) dataList[autocompleteKey] = {};

       dataList[autocompleteKey][value] = '';
     });

     return dataList;
   }
   ```

2. **提取块创建的变量**：
   ```javascript
   const extractBlocksAutocomplete = {
     trigger(blockId, data) {
       if (!this[blockId].variables) this[blockId].variables = {};

       // 触发器参数
       data.parameters?.forEach((param) => {
         this[blockId].variables[param.name] = '';
       });

       // 上下文菜单特殊变量
       if (data.type === 'context-menu') {
         Object.assign(this[blockId].variables, {
           $ctxElSelector: '',
           $ctxTextSelection: '',
           $ctxLink: '',
           $ctxMediaUrl: '',
         });
       }
     },

     'insert-data'(blockId, data) {
       if (!this[blockId].variables) this[blockId].variables = {};

       data.dataList.forEach((item) => {
         if (item.type !== 'variable' || !item.name.trim()) return;
         this[blockId].variables[item.name] = '';
       });
     },

     'loop-data'(blockId, data) {
       const loopId = data.loopId || blockId;

       if (!this[blockId].loopData) this[blockId].loopData = {};

       this[blockId].loopData[loopId] = {
         data: {
           $index: '',
           $item: '',
         },
       };
     },
   };
   ```

3. **组件使用**：
   ```vue
   <template>
     <ui-autocomplete
       :items="autocompleteList"
       :trigger-char="['{{', '}}']"
       :custom-filter="autocompleteFilter"
       :replace-after="['@', '.']"
       block
       @search="onSearch"
     >
       <slot />
     </ui-autocomplete>
   </template>

   <script setup>
   import { inject, shallowReactive, computed } from 'vue';
   import objectPath from 'object-path';

   const autocompleteData = inject('autocompleteData', {});

   const state = shallowReactive({
     path: '',
     pathLen: -1,
   });

   function autocompleteFilter({ text, item }) {
     if (!text) return true;

     const query = text.replace('@', '.').split('.').pop();
     return item.toLocaleLowerCase().includes(query);
   }

   function onSearch(value) {
     const pathArr = (value ?? '').replace('@', '.').split('.');

     state.path = (pathArr.length > 1 ? pathArr.slice(0, -1) : pathArr).join('.');
     state.pathLen = pathArr.length;
   }

   const autocompleteList = computed(() => {
     const data =
       !state.path || state.pathLen <= 1
         ? autocompleteData.value
         : objectPath.get(autocompleteData.value, state.path);

     const list = typeof data === 'string' ? [] : Object.keys(data || {});

     return list;
   });
   </script>
   ```

**使用示例**：

在任何编辑组件中包装输入框：
```vue
<template>
  <edit-autocomplete>
    <ui-input
      v-model="data.selector"
      label="CSS Selector"
      placeholder="Enter selector or {{ variable }}"
    />
  </edit-autocomplete>
</template>
```

**交互流程**：
1. 用户输入 `{{` → 显示根级键：`variables`, `table`, `loopData`, etc.
2. 用户继续输入 `variables.` → 显示所有变量名
3. 用户输入 `user.` → 显示 `user` 对象的属性
4. 支持 `@` 替代 `.`：`variables@userName`

---

### 方式 3：JavaScript 代码块中访问

**文件位置**：`src/workflowEngine/blocksHandler/handlerJavascriptCode.js`

**注入脚本生成**：
```javascript
function getAutomaScript({ varName, refData, everyNewTab, isEval = false }) {
  let str = `
const ${varName} = ${JSON.stringify(refData)};

${automaRefDataStr(varName)}

// 设置变量
function automaSetVariable(name, value) {
  const variables = ${varName}.variables;
  if (!variables) ${varName}.variables = {};
  ${varName}.variables[name] = value;
}

// 执行下一个块
function automaNextBlock(data, insert = true) {
  if (${isEval}) {
    $automaResolve({
      columns: { data, insert },
      variables: ${varName}.variables,
    });
  } else {
    document.body.dispatchEvent(new CustomEvent('__automa-next-block__', {
      detail: { data, insert, refData: ${varName} }
    }));
  }
}

// 重置超时
function automaResetTimeout() {
  if (${isEval}) {
    clearTimeout($automaTimeout);
    $automaTimeout = setTimeout(() => resolve(), $automaTimeoutMs);
  } else {
    document.body.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
  }
}

${automaFetchClient.toString()}

function automaFetch(type, resource) {
  return automaFetchClient('${varName}', { type, resource });
}
  `;

  if (everyNewTab) str = automaRefDataStr(varName);

  return str;
}
```

**automaRefData 辅助函数**（`src/workflowEngine/helper.js`）：
```javascript
export function automaRefDataStr(varName) {
  return `
function findData(obj, path) {
  const paths = path.split('.');
  const isWhitespace = paths.length === 1 && !/\\S/.test(paths[0]);

  // 支持 $last 特殊语法
  if (path.startsWith('$last') && Array.isArray(obj)) {
    paths[0] = obj.length - 1;
  }

  if (paths.length === 0 || isWhitespace) return obj;
  else if (paths.length === 1) return obj[paths[0]];

  let result = obj;

  // 递归访问嵌套属性
  for (let i = 0; i < paths.length; i++) {
    if (result[paths[i]] == undefined) {
      return undefined;
    } else {
      result = result[paths[i]];
    }
  }

  return result;
}

function automaRefData(keyword, path = '') {
  const data = ${varName}[keyword];  // keyword: variables, table, loopData, etc.

  if (!data) return;

  return findData(data, path);
}
  `;
}
```

**可用 API**：

1. **读取变量**：
```javascript
const value = automaRefData('variables', 'myVar');
const nested = automaRefData('variables', 'user.name');
const tableRow = automaRefData('table', '0.columnName');
const lastRow = automaRefData('table', '$last.price');
const loopIndex = automaRefData('loopData', 'data.$index');
```

2. **设置变量**：
```javascript
automaSetVariable('result', 'hello world');
automaSetVariable('data', { id: 1, name: 'Alice' });
automaSetVariable('items', ['a', 'b', 'c']);
```

3. **继续到下一个块**：
```javascript
// 传递数据到下一个块
automaNextBlock({ status: 'success', count: 42 });

// 不插入到表格
automaNextBlock(data, false);
```

4. **重置超时**：
```javascript
// 防止长时间执行时块超时
automaResetTimeout();

// 在循环中使用
for (let i = 0; i < 1000; i++) {
  // 每 100 次迭代重置一次
  if (i % 100 === 0) automaResetTimeout();

  // 处理逻辑...
}
```

5. **网络请求**：
```javascript
// 获取文本
const html = await automaFetch('text', 'https://example.com');

// 获取 JSON
const jsonText = await automaFetch('text', 'https://api.example.com/data');
const data = JSON.parse(jsonText);

// 使用变量
const apiUrl = automaRefData('globalData', 'apiUrl');
const response = await automaFetch('text', `${apiUrl}/users`);
```

**完整示例**：
```javascript
// 从变量读取配置
const config = automaRefData('variables', 'config');
const apiUrl = automaRefData('globalData', 'apiUrl');

// 执行 API 请求
const response = await automaFetch('text', `${apiUrl}/users/${config.userId}`);
const users = JSON.parse(response);

// 处理数据
const activeUsers = users.filter(user => user.active);

// 保存结果
automaSetVariable('activeUsers', activeUsers);
automaSetVariable('activeCount', activeUsers.length);

// 继续到下一个块
automaNextBlock({
  count: activeUsers.length,
  names: activeUsers.map(u => u.name)
});
```

---

### 方式 4：块处理程序中直接访问

**适用场景**：自定义块开发

**访问方式**：
```javascript
// 在块处理程序中
export default async function (block, { refData }) {
  // 读取变量
  const userName = refData.variables.userName;
  const tableData = refData.table;
  const loopIndex = refData.loopData.data.$index;

  // 使用 objectPath 访问嵌套属性
  const nested = objectPath.get(refData.variables, 'user.profile.name');

  // 修改变量（通过 WorkflowWorker）
  await this.setVariable('result', 'success');

  // 添加到表格
  this.addDataToColumn('columnName', 'value');

  return {
    data: result,
    nextBlockId: this.getBlockConnections(block.id),
  };
}
```

---

## 调试日志中的变量查看

### LogsVariables 组件

**文件位置**：`src/components/newtab/logs/LogsVariables.vue`

**组件代码**：
```vue
<template>
  <div v-if="Object.keys(variables).length === 0" class="text-center">
    <img src="@/assets/svg/files-and-folder.svg" class="mx-auto max-w-sm" />
    <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
  </div>

  <template v-else>
    <ui-tabs v-model="state.activeTab" type="fill" class="mb-4">
      <ui-tab value="gui">GUI</ui-tab>
      <ui-tab value="raw">Raw</ui-tab>
    </ui-tabs>

    <!-- GUI 视图：显示为网格 -->
    <div v-if="state.activeTab === 'gui'" class="mt-4">
      <ul class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <li v-for="(varValue, varName) in variables" :key="varName">
          <ui-input
            :model-value="varName"
            label="Name"
            readonly
          />
          <ui-input
            :model-value="
              typeof varValue === 'string' ? varValue : JSON.stringify(varValue)
            "
            label="Value"
            readonly
          />
        </li>
      </ul>
    </div>

    <!-- Raw 视图：JSON 编辑器 -->
    <shared-codemirror
      v-else
      :model-value="JSON.stringify(variables, null, 2)"
      class="mt-4"
      lang="json"
      readonly
    />
  </template>
</template>

<script setup>
import { computed, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  currentLog: {
    type: Object,
    default: () => ({}),
  },
});

const state = shallowReactive({
  activeTab: 'gui',
});

// 从日志的 ctxData 中提取变量快照
const variables = computed(() => props.currentLog.data?.variables || {});
</script>
```

**功能**：
1. **GUI 模式**：
   - 网格布局显示所有变量
   - 每个变量显示名称和值
   - 只读模式

2. **Raw 模式**：
   - JSON 编辑器显示原始数据
   - 语法高亮
   - 格式化显示

---

### 变量快照系统

**文件位置**：`src/workflowEngine/WorkflowEngine.js`

**快照创建**（lines 324-330）：
```javascript
addRefDataSnapshot(key) {
  this.refDataSnapshotsKeys[key].index += 1;
  this.refDataSnapshotsKeys[key].key = key;

  const keyName = this.refDataSnapshotsKeys[key].key;
  this.refDataSnapshots[keyName] = cloneDeep(this.referenceData[key]);
}
```

**快照存储到日志**（lines 359-375）：
```javascript
addLogHistory(detail) {
  this.logHistoryId += 1;

  const { variables, loopData } = this.refDataSnapshotsKeys;

  // 存储快照引用
  this.historyCtxData[this.logHistoryId] = {
    referenceData: {
      loopData: loopData.key,
      variables: variables.key,
      activeTabUrl: detail.activeTabUrl,
      prevBlockData: detail.prevBlockData || '',
    },
    replacedValue: cloneDeep(detail.replacedValue),
    ...(detail?.ctxData || {}),
  };

  // 添加日志条目
  this.logger.add({
    id: this.logHistoryId,
    type: detail.type || 'default',
    name: detail.name,
    description: detail.description,
    duration: detail.duration,
    timestamp: Date.now(),
    logId: detail.logId,
    replacedValue: detail.replacedValue,
  });
}
```

**快照触发时机**：
1. 变量被设置或修改（`setVariable`）
2. 表格数据更新（`addDataToColumn`）
3. 循环迭代开始
4. 块执行完成

**快照数据结构**：
```javascript
{
  logId: 123,
  timestamp: 1702387200000,
  type: 'block',
  name: 'Insert Data',
  data: {
    variables: {
      userName: 'Alice',
      counter: 5,
      results: ['a', 'b', 'c']
    },
    loopData: {
      data: {
        $index: 2,
        $item: 'current'
      }
    },
    replacedValue: {
      '{{ variables.userName }}': 'Alice'
    }
  }
}
```

---

## JavaScript 代码块中的变量访问

### 执行模式

JavaScript Code 块支持三种执行模式：

1. **在网页上下文中执行**（默认）
2. **在后台脚本中执行**
3. **在弹出窗口中执行**

---

### 网页上下文模式

**注入过程**：
1. 序列化 `referenceData` 为 JSON
2. 生成辅助函数字符串
3. 通过 `chrome.scripting.executeScript` 注入到网页
4. 执行用户代码
5. 通过 `CustomEvent` 返回结果

**完整示例**：
```javascript
// 块配置
{
  code: `
    // 读取变量
    const searchQuery = automaRefData('variables', 'query');
    const maxResults = automaRefData('globalData', 'maxResults');

    // 从网页获取数据
    const results = Array.from(document.querySelectorAll('.search-result'))
      .slice(0, maxResults)
      .map(el => ({
        title: el.querySelector('h3').textContent,
        url: el.querySelector('a').href,
        description: el.querySelector('p').textContent
      }));

    // 保存到变量
    automaSetVariable('searchResults', results);
    automaSetVariable('resultCount', results.length);

    // 传递到下一个块
    automaNextBlock({
      count: results.length,
      firstTitle: results[0]?.title
    });
  `,
  everyNewTab: false,
  timeout: 5000
}
```

---

### 后台脚本模式

**特点**：
- 在扩展的后台脚本中执行
- 无法访问网页 DOM
- 可以使用完整的浏览器 API

**示例**：
```javascript
// 在后台执行
const tabs = await chrome.tabs.query({ active: true });
const currentTab = tabs[0];

// 读取变量
const url = automaRefData('variables', 'targetUrl');

// 创建新标签页
const newTab = await chrome.tabs.create({ url });

// 保存结果
automaSetVariable('newTabId', newTab.id);

automaNextBlock({ tabId: newTab.id });
```

---

### 高级用法示例

#### 1. 批量数据处理

```javascript
// 读取表格数据
const table = automaRefData('table', '');

// 处理每一行
const processed = table.map((row, index) => {
  // 每 50 行重置超时
  if (index % 50 === 0) automaResetTimeout();

  return {
    ...row,
    fullName: `${row.firstName} ${row.lastName}`,
    total: row.price * row.quantity
  };
});

// 保存结果
automaSetVariable('processedData', processed);

// 传递统计信息
automaNextBlock({
  count: processed.length,
  total: processed.reduce((sum, item) => sum + item.total, 0)
});
```

---

#### 2. API 数据聚合

```javascript
// 读取配置
const apiUrl = automaRefData('globalData', 'apiUrl');
const apiKey = automaRefData('secrets', 'apiKey');
const userIds = automaRefData('variables', 'userIds');

// 批量获取用户数据
const users = [];

for (const userId of userIds) {
  automaResetTimeout();

  const response = await automaFetch(
    'text',
    `${apiUrl}/users/${userId}?key=${apiKey}`
  );

  const user = JSON.parse(response);
  users.push(user);
}

// 保存结果
automaSetVariable('users', users);

automaNextBlock({
  count: users.length,
  names: users.map(u => u.name)
});
```

---

#### 3. 条件逻辑

```javascript
// 读取循环索引
const index = automaRefData('loopData', 'data.$index');
const item = automaRefData('loopData', 'data.item');

// 条件处理
if (item.status === 'active') {
  // 点击元素
  const button = document.querySelector(`#item-${index} button`);
  if (button) button.click();

  automaSetVariable('lastActiveIndex', index);
}

automaNextBlock({ processed: true });
```

---

#### 4. 错误处理

```javascript
try {
  const data = automaRefData('variables', 'apiResponse');
  const parsed = JSON.parse(data);

  if (parsed.error) {
    automaSetVariable('errorMessage', parsed.error);
    automaNextBlock({ success: false, error: parsed.error });
  } else {
    automaSetVariable('result', parsed.data);
    automaNextBlock({ success: true, data: parsed.data });
  }
} catch (error) {
  automaSetVariable('errorMessage', error.message);
  automaNextBlock({ success: false, error: error.message });
}
```

---

## 关键文件汇总

### 核心引擎

| 文件路径 | 功能 | 代码行 |
|---------|------|--------|
| `src/workflowEngine/WorkflowEngine.js` | referenceData 初始化和管理 | 81-89, 303-306, 324-330 |
| `src/workflowEngine/WorkflowWorker.js` | setVariable, addDataToColumn 核心方法 | 77-141 |
| `src/workflowEngine/WorkflowState.js` | 执行状态管理 | - |

---

### 模板引擎

| 文件路径 | 功能 |
|---------|------|
| `src/workflowEngine/templating/index.js` | 块级模板渲染入口 |
| `src/workflowEngine/templating/renderString.js` | 字符串模板渲染 |
| `src/workflowEngine/templating/mustacheReplacer.js` | Mustache 语法解析器和 keyParser |
| `src/workflowEngine/templating/templatingFunctions.js` | 模板函数库（date, randint, etc.） |
| `src/workflowEngine/templating/utils.js` | 工具函数 |

---

### 变量块处理程序

| 文件路径 | 块 ID | 功能 |
|---------|-------|------|
| `src/workflowEngine/blocksHandler/handlerInsertData.js` | insert-data | 插入变量和表数据 |
| `src/workflowEngine/blocksHandler/handlerDeleteData.js` | delete-data | 删除变量和列 |
| `src/workflowEngine/blocksHandler/handlerIncreaseVariable.js` | increase-variable | 递增数字变量 |
| `src/workflowEngine/blocksHandler/handlerRegexVariable.js` | regex-variable | 正则表达式处理 |
| `src/workflowEngine/blocksHandler/handlerSliceVariable.js` | slice-variable | 切片字符串/数组 |
| `src/workflowEngine/blocksHandler/handlerDataMapping.js` | data-mapping | 映射变量数据结构 |
| `src/workflowEngine/blocksHandler/handlerJavascriptCode.js` | javascript-code | JavaScript 执行 |

---

### 数据库和存储

| 文件路径 | 功能 |
|---------|------|
| `src/db/storage.js` | IndexedDB 定义（variables, credentials 表） |
| `src/stores/workflow.js` | Pinia 工作流状态管理 |
| `src/stores/main.js` | Pinia 全局设置 |

---

### 前端组件

| 文件路径 | 功能 |
|---------|------|
| `src/utils/editor/editorAutocomplete.js` | 自动完成数据提取逻辑 |
| `src/components/newtab/workflow/edit/EditAutocomplete.vue` | 自动完成 UI 组件 |
| `src/components/newtab/logs/LogsVariables.vue` | 日志变量查看器 |
| `src/components/newtab/workflow/WorkflowEditor.vue` | 工作流编辑器主组件 |

---

### 工具函数

| 文件路径 | 功能 |
|---------|------|
| `src/workflowEngine/helper.js` | automaRefDataStr 和其他辅助函数 |
| `src/utils/shared.js` | 块定义和共享数据 |
| `src/utils/helper.js` | 通用工具函数 |

---

## 完整使用示例

### 示例 1：简单变量管理

**场景**：创建计数器并在循环中使用

**流程配置**：
1. **Insert Data** - 初始化计数器
   ```javascript
   {
     dataList: [
       {
         type: 'variable',
         name: 'counter',
         value: '0'
       }
     ]
   }
   ```

2. **Loop Data** - 循环 10 次
   ```javascript
   {
     loopData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
     loopId: 'mainLoop'
   }
   ```

3. **Increase Variable** - 每次循环递增
   ```javascript
   {
     variableName: 'counter',
     increaseBy: 1
   }
   ```

4. **HTTP Request** - 使用变量
   ```javascript
   {
     url: 'https://api.example.com/items?page={{ variables.counter }}',
     method: 'GET'
   }
   ```

---

### 示例 2：表格数据抓取和处理

**场景**：抓取商品列表并计算总价

**流程配置**：
1. **Loop Elements** - 遍历商品
   ```javascript
   {
     selector: '.product-item',
     loopId: 'productLoop'
   }
   ```

2. **Get Text** - 提取商品名称
   ```javascript
   {
     selector: '.product-name',
     saveData: true,
     dataColumn: 'productName'
   }
   ```

3. **Get Text** - 提取价格
   ```javascript
   {
     selector: '.product-price',
     saveData: true,
     dataColumn: 'price'
   }
   ```

4. **JavaScript Code** - 计算总价
   ```javascript
   const table = automaRefData('table', '');

   const total = table.reduce((sum, item) => {
     const price = parseFloat(item.price.replace('$', ''));
     return sum + price;
   }, 0);

   automaSetVariable('totalPrice', total.toFixed(2));
   automaSetVariable('productCount', table.length);

   automaNextBlock({
     total: total.toFixed(2),
     count: table.length
   });
   ```

5. **Insert Data** - 保存统计信息
   ```javascript
   {
     dataList: [
       {
         type: 'table',
         name: 'summary',
         value: 'Total: ${{ variables.totalPrice }}, Count: {{ variables.productCount }}'
       }
     ]
   }
   ```

---

### 示例 3：全局变量和凭证管理

**场景**：使用全局 API 配置进行多次请求

**流程配置**：
1. **Insert Data** - 设置全局变量（只需执行一次）
   ```javascript
   {
     dataList: [
       {
         type: 'variable',
         name: '$$apiBaseUrl',
         value: 'https://api.example.com'
       },
       {
         type: 'variable',
         name: '$$apiKey',
         value: 'your-secret-key'
       }
     ]
   }
   ```

2. **HTTP Request** - 获取用户列表
   ```javascript
   {
     url: '{{ variables.$$apiBaseUrl }}/users',
     headers: {
       'Authorization': 'Bearer {{ variables.$$apiKey }}'
     }
   }
   ```

3. **Data Mapping** - 提取用户 ID
   ```javascript
   {
     dataSource: 'variable',
     varSourceName: 'httpResponse',
     sources: [
       {
         name: 'users',
         destinations: [{ name: 'userIds' }]
       }
     ],
     assignVariable: true,
     variableName: 'userIds'
   }
   ```

4. **Loop Data** - 遍历用户
   ```javascript
   {
     loopData: '{{ variables.userIds }}',
     loopId: 'userLoop'
   }
   ```

5. **HTTP Request** - 获取用户详情
   ```javascript
   {
     url: '{{ variables.$$apiBaseUrl }}/users/{{ loopData.data.id }}',
     headers: {
       'Authorization': 'Bearer {{ variables.$$apiKey }}'
     }
   }
   ```

---

### 示例 4：数据映射和转换

**场景**：将 API 响应转换为所需格式

**API 响应**（存储在 `variables.apiResponse`）：
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "profile": {
          "age": 30,
          "city": "New York"
        }
      }
    ]
  }
}
```

**流程配置**：
1. **Data Mapping** - 提取和转换数据
   ```javascript
   {
     dataSource: 'variable',
     varSourceName: 'apiResponse',
     sources: [
       {
         name: 'data.users',
         destinations: [
           { name: 'users' }
         ]
       }
     ],
     assignVariable: true,
     variableName: 'users'
   }
   ```

2. **JavaScript Code** - 进一步转换
   ```javascript
   const users = automaRefData('variables', 'users');

   const transformed = users.map(user => ({
     id: user.id,
     fullName: `${user.firstName} ${user.lastName}`,
     email: user.email,
     age: user.profile.age,
     location: user.profile.city
   }));

   automaSetVariable('transformedUsers', transformed);

   automaNextBlock({
     count: transformed.length
   });
   ```

---

### 示例 5：条件分支和错误处理

**场景**：根据变量值执行不同的分支

**流程配置**：
1. **HTTP Request** - API 调用
   ```javascript
   {
     url: 'https://api.example.com/data',
     saveData: false,
     assignVariable: true,
     variableName: 'apiResponse'
   }
   ```

2. **JavaScript Code** - 检查响应
   ```javascript
   try {
     const response = automaRefData('variables', 'apiResponse');
     const data = JSON.parse(response);

     if (data.status === 'success') {
       automaSetVariable('hasError', 'false');
       automaSetVariable('result', data.data);
     } else {
       automaSetVariable('hasError', 'true');
       automaSetVariable('errorMessage', data.error);
     }
   } catch (error) {
     automaSetVariable('hasError', 'true');
     automaSetVariable('errorMessage', error.message);
   }

   automaNextBlock();
   ```

3. **Conditions** - 条件判断
   ```javascript
   {
     conditions: [
       {
         type: 'variable',
         value: {
           variableName: 'hasError',
           operator: 'equal',
           compareValue: 'false'
         }
       }
     ]
   }
   ```

4a. **成功分支** - 处理数据
4b. **错误分支** - 记录错误

---

### 示例 6：循环和嵌套变量

**场景**：嵌套循环处理多维数据

**流程配置**：
1. **Insert Data** - 初始化数据
   ```javascript
   {
     dataList: [
       {
         type: 'variable',
         name: 'categories',
         value: JSON.stringify([
           { id: 1, name: 'Electronics', items: ['Phone', 'Laptop'] },
           { id: 2, name: 'Books', items: ['Fiction', 'Non-fiction'] }
         ])
       }
     ]
   }
   ```

2. **Loop Data** - 外层循环（分类）
   ```javascript
   {
     loopData: '{{ variables.categories }}',
     loopId: 'categoryLoop'
   }
   ```

3. **Loop Data** - 内层循环（项目）
   ```javascript
   {
     loopData: '{{ loopData@categoryLoop.data.items }}',
     loopId: 'itemLoop'
   }
   ```

4. **JavaScript Code** - 处理嵌套数据
   ```javascript
   const categoryName = automaRefData('loopData@categoryLoop', 'data.name');
   const item = automaRefData('loopData@itemLoop', 'data.$item');
   const categoryIndex = automaRefData('loopData@categoryLoop', 'data.$index');
   const itemIndex = automaRefData('loopData@itemLoop', 'data.$index');

   console.log(`Category ${categoryIndex}: ${categoryName}, Item ${itemIndex}: ${item}`);

   automaNextBlock();
   ```

---

### 示例 7：数组操作

**场景**：构建和操作数组变量

**流程配置**：
1. **Insert Data** - 初始化空数组
   ```javascript
   {
     dataList: [
       {
         type: 'variable',
         name: 'results',
         value: '[]'
       }
     ]
   }
   ```

2. **Loop Elements** - 遍历元素
   ```javascript
   {
     selector: '.item',
     loopId: 'itemLoop'
   }
   ```

3. **JavaScript Code** - 追加到数组
   ```javascript
   const text = document.querySelector('.item-text').textContent;
   const price = document.querySelector('.item-price').textContent;

   // 读取当前数组
   const results = automaRefData('variables', 'results');

   // 追加新项
   results.push({
     text: text.trim(),
     price: parseFloat(price.replace('$', ''))
   });

   // 更新变量
   automaSetVariable('results', results);

   automaNextBlock();
   ```

4. **或者使用 $push: 语法**（在 Insert Data 块中）
   ```javascript
   {
     dataList: [
       {
         type: 'variable',
         name: '$push:results',
         value: '{{ variables.currentItem }}'
       }
     ]
   }
   ```

---

### 示例 8：复杂数据处理管道

**场景**：完整的数据提取、转换、加载流程

**流程步骤**：

1. **Extract（提取）**
   - Loop Elements - 遍历商品
   - Get Text - 提取多个字段到表格

2. **Transform（转换）**
   - Data Mapping - 重组数据结构
   - Regex Variable - 清理文本
   - JavaScript Code - 自定义转换逻辑

3. **Load（加载）**
   - Export Data - 导出为 CSV
   - HTTP Request - 发送到 API
   - Google Sheets - 保存到电子表格

**详细配置**：
```javascript
// 1. 提取阶段
{
  type: 'loop-elements',
  data: {
    selector: '.product-card',
    loopId: 'productLoop'
  }
}

// 2. 提取字段
{
  type: 'get-text',
  data: {
    selector: '.product-name',
    saveData: true,
    dataColumn: 'name'
  }
}

// 3. 转换阶段 - 数据映射
{
  type: 'data-mapping',
  data: {
    dataSource: 'table',
    sources: [
      {
        name: 'name',
        destinations: [{ name: 'productName' }]
      },
      {
        name: 'price',
        destinations: [{ name: 'unitPrice' }]
      }
    ],
    assignVariable: true,
    variableName: 'cleanData'
  }
}

// 4. 转换阶段 - JavaScript 处理
{
  type: 'javascript-code',
  data: {
    code: `
      const data = automaRefData('variables', 'cleanData');

      const enhanced = data.map(item => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity,
        category: item.productName.split(' ')[0],
        timestamp: Date.now()
      }));

      automaSetVariable('finalData', enhanced);

      automaNextBlock({
        count: enhanced.length,
        total: enhanced.reduce((sum, item) => sum + item.totalPrice, 0)
      });
    `
  }
}

// 5. 加载阶段 - 导出
{
  type: 'export-data',
  data: {
    type: 'json',
    name: 'products_{{ date("YYYY-MM-DD") }}.json',
    data: '{{ variables.finalData }}'
  }
}
```

---

## 最佳实践和注意事项

### 变量命名规范

1. **普通变量**：小驼峰命名
   ```javascript
   userName
   productList
   apiResponse
   ```

2. **全局变量**：使用 $$ 前缀
   ```javascript
   $$apiKey
   $$baseUrl
   $$userConfig
   ```

3. **临时变量**：使用前缀标识
   ```javascript
   temp_counter
   tmp_result
   _internal
   ```

---

### 性能优化

1. **避免大量快照**：
   - 只在必要时创建快照
   - 清理不需要的变量

2. **大数组处理**：
   ```javascript
   // 分批处理
   const batchSize = 100;
   for (let i = 0; i < array.length; i += batchSize) {
     automaResetTimeout();
     const batch = array.slice(i, i + batchSize);
     // 处理批次...
   }
   ```

3. **避免深层嵌套**：
   ```javascript
   // 不好
   variables.user.profile.settings.preferences.theme

   // 好
   variables.userTheme  // 扁平化数据
   ```

---

### 错误处理

1. **检查变量存在性**：
   ```javascript
   const value = automaRefData('variables', 'userName');
   if (!value) {
     automaSetVariable('error', 'userName not found');
     automaNextBlock({ success: false });
     return;
   }
   ```

2. **Try-Catch 包装**：
   ```javascript
   try {
     const data = JSON.parse(automaRefData('variables', 'jsonString'));
     // 处理数据...
   } catch (error) {
     automaSetVariable('parseError', error.message);
   }
   ```

3. **提供默认值**：
   ```javascript
   const timeout = automaRefData('globalData', 'timeout') || 5000;
   const retryCount = automaRefData('variables', 'retries') || 3;
   ```

---

### 调试技巧

1. **使用描述字段**：
   ```javascript
   {
     description: 'Current value: {{ variables.counter }}'
   }
   ```

2. **日志变量**：
   ```javascript
   automaSetVariable('debug_step1', 'Completed');
   automaSetVariable('debug_data', JSON.stringify(data));
   ```

3. **查看快照**：
   - 在日志面板中查看每个块的变量状态
   - 使用 Raw 模式查看完整 JSON

---

### 安全注意事项

1. **敏感数据**：
   - 使用 `secrets` 存储密钥
   - 不要在日志中记录敏感信息
   - 使用全局变量时考虑加密

2. **输入验证**：
   ```javascript
   const userInput = automaRefData('variables', 'userInput');

   // 验证和清理
   if (typeof userInput !== 'string' || userInput.length > 1000) {
     throw new Error('Invalid input');
   }

   const cleaned = userInput.replace(/[<>]/g, '');
   ```

3. **XSS 防护**：
   ```javascript
   // 避免直接插入 HTML
   element.textContent = automaRefData('variables', 'userText');

   // 而不是
   element.innerHTML = automaRefData('variables', 'userText');  // 危险！
   ```

---

## 总结

Automa 的变量系统是一个强大而灵活的数据管理解决方案，提供：

### 核心特性
- **8 种变量类型**：覆盖各种使用场景
- **统一的 referenceData 接口**：简化数据访问
- **强大的模板引擎**：支持复杂的变量替换
- **自动完成支持**：提升编辑体验
- **快照机制**：便于调试和追踪

### 主要优势
1. **灵活性**：支持任意数据类型和嵌套结构
2. **持久化**：全局变量自动保存到数据库
3. **跨块传递**：通过连接线自动线程数据
4. **调试友好**：完整的日志和快照系统
5. **扩展性**：易于添加新的变量操作块

### 使用场景
- 网页数据抓取和处理
- API 集成和数据转换
- 工作流状态管理
- 循环和批处理
- 条件逻辑和分支

### 关键技术
- Pinia 状态管理
- IndexedDB 持久化
- Mustache 模板引擎
- Object-path 嵌套访问
- Vue 3 响应式系统

---

## 附录

### 常用代码片段

#### 读取嵌套变量
```javascript
const value = objectPath.get(
  this.engine.referenceData.variables,
  'user.profile.name'
);
```

#### 设置嵌套变量
```javascript
objectPath.set(
  this.engine.referenceData.variables,
  'user.profile.name',
  'New Name'
);
```

#### 数组推送
```javascript
await this.setVariable('$push:results', newItem);
```

#### 表格最后一行
```javascript
const lastRow = this.engine.referenceData.table[
  this.engine.referenceData.table.length - 1
];
```

---

### 相关资源

- **官方文档**：https://docs.automa.site/
- **GitHub 仓库**：https://github.com/AutomaApp/automa
- **图标资源**：https://preview-v-remixicon.vercel.app/

---

**文档结束**

> 本文档基于 Automa 源码深度分析生成，涵盖了变量系统的所有核心概念和实现细节。
> 如有疑问或需要补充，请参考源码或提交 Issue。
