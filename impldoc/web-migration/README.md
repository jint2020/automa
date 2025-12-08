# Automa Web 迁移项目文档

本目录记录了 Automa 从浏览器扩展迁移到独立 Web 应用的完整过程。

---

## 🎯 项目目标

将 Automa 从 Chrome/Firefox 浏览器扩展重构为可在标准浏览器中运行的独立 Web 应用，同时保持扩展模式的完整功能。

### 核心特性
- ✅ **双模式运行**：同时支持扩展模式和 Web 模式
- ✅ **Chrome API 兼容层**：通过 shim 层抽象浏览器扩展 API
- ✅ **零破坏性迁移**：扩展模式功能保持 100% 兼容
- ✅ **模块化架构**：为未来的远程执行、云存储等功能打下基础

---

## 📊 项目进度

### ✅ Phase 1: 前端基础迁移（已完成）

**目标**：让 Automa UI 在标准浏览器中成功运行

**完成内容**：
- ✅ 构建系统迁移到 Vite
- ✅ Chrome API shim 层实现（18 个 API，30+ 事件，80+ 方法）
- ✅ 模块系统转换（require.context → import.meta.glob）
- ✅ 存储适配器（chrome.storage → localStorage）
- ✅ i18n 国际化修复
- ✅ UI 完整渲染无错误

**详细文档**：[milestones/PHASE1-FINAL-STATUS.md](./milestones/PHASE1-FINAL-STATUS.md)

---

### 🔄 Phase 2: UI 层重构（计划中）

**目标**：组件环境无关化，抽象存储和执行

**计划内容**：
- 环境检测和功能开关
- 存储抽象层 (StorageService)
- 组件审计和重构
- WorkflowCompiler（JSON 导出功能）

---

### 🔄 Phase 3+: 执行抽象（规划中）

**目标**：支持远程执行和多平台部署

**计划内容**：
- RuntimeAdapter 接口设计
- ExtensionRuntimeAdapter（扩展模式）
- RemoteRuntimeAdapter（远程执行）
- 云存储集成

---

## 📚 文档索引

### 🏆 [里程碑文档](./milestones/)

记录各阶段的完成情况和总结：

- **[PHASE1-FINAL-STATUS.md](./milestones/PHASE1-FINAL-STATUS.md)** - Phase 1 完整总结（推荐阅读）
  - 已修复的问题清单
  - Shim 层能力说明
  - 架构亮点
  - 性能指标
  - 已知限制

- **[PHASE1-COMPLETE.md](./milestones/PHASE1-COMPLETE.md)** - Phase 1 概览
  - 快速总结
  - 主要成就

---

### 🔧 [修复文档](./fixes/)

迁移过程中遇到的具体问题及解决方案：

#### 核心系统修复

- **[MODULE-SYSTEM-MIGRATION.md](./fixes/MODULE-SYSTEM-MIGRATION.md)** - 模块系统迁移
  - require.context → import.meta.glob 转换
  - 影响文件：5 个核心文件
  - 动态组件加载修复

- **[SHIM-LAYER-ENHANCEMENT.md](./fixes/SHIM-LAYER-ENHANCEMENT.md)** - Chrome API Shim 层技术详解
  - 18 个 API 命名空间
  - 30+ 事件对象
  - 80+ 方法实现
  - 事件系统设计

#### 功能性修复

- **[STORAGE-ONCHANGED-FIX.md](./fixes/STORAGE-ONCHANGED-FIX.md)** - 存储事件处理修复
  - `browser.storage.local.onChanged` 缺失问题
  - webextension-polyfill 兼容性

- **[I18N-LOCALE-FIX.md](./fixes/I18N-LOCALE-FIX.md)** - 国际化加载修复
  - 翻译键未替换问题（显示 `Common.Workflow` 等原始键）
  - Webpack 动态导入迁移到 Vite
  - 仅加载 en 和 zh 语言包

- **[INFINITE-LOADING-FIX.md](./fixes/INFINITE-LOADING-FIX.md)** - 无限加载修复
  - 应用卡在加载状态问题
  - window.type 属性缺失

- **[WORKFLOW-TRIGGER-FIX.md](./fixes/WORKFLOW-TRIGGER-FIX.md)** - 工作流触发器修复
  - Array.isArray 类型检查问题
  - 触发器数据结构兼容性

---

## 🚀 快速开始

### 运行 Web 模式

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev:web

# 访问 http://localhost:3000
```

### 构建 Web 应用

```bash
# 生产构建
pnpm build:web

# 预览构建结果
pnpm preview:web
```

### 运行扩展模式（保持不变）

```bash
# Chrome 扩展开发
pnpm dev

# Firefox 扩展开发
pnpm dev:firefox
```

---

## 🏗️ 核心架构

### 环境检测

```javascript
import { isWebMode, isExtensionMode } from '@/utils/shim-chrome';

if (isWebMode) {
  // Web 模式特定逻辑
} else if (isExtensionMode) {
  // 扩展模式特定逻辑
}
```

### Chrome API Shim

```javascript
// src/main-web.js
import './utils/shim-chrome'; // 必须最先导入！

// 现在可以使用 Chrome API
await chrome.storage.local.set({ key: 'value' });
const data = await chrome.storage.local.get('key');
```

### 存储映射

| Chrome API | Web 模式 | 前缀 |
|-----------|---------|------|
| `chrome.storage.local` | `localStorage` | `automa_local_` |
| `chrome.storage.sync` | `localStorage` | `automa_sync_` |
| `chrome.storage.session` | `localStorage` | `automa_session_` |

---

## ⚠️ 已知限制

### 1. 无真实浏览器自动化
Web 模式下的 `chrome.tabs.*`、`chrome.debugger.*` 等 API 仅返回模拟数据，不能进行实际的浏览器自动化操作。

**解决方案**：Phase 3 将实现 RuntimeAdapter，通过后端服务执行真实的浏览器操作。

### 2. 仅加载部分语言包
目前只加载 `en` 和 `zh` 语言包，其他语言文件存在语法错误。

**解决方案**：待其他语言文件修复后可以添加。

### 3. 无 Background/Content Script
Web 模式仅运行 Dashboard UI，没有后台脚本和内容脚本上下文。

**解决方案**：通过 RuntimeAdapter 将执行逻辑移至后端服务。

---

## 📈 性能指标

- **初始加载**：~2-3 秒（Vite 开发服务器）
- **HMR 更新**：< 500ms
- **存储操作**：< 1ms（localStorage）
- **事件订阅**：0ms（同步操作）

---

## 🧪 测试方法

### 测试存储 API

```javascript
// 浏览器控制台
await chrome.storage.local.set({ test: 'hello' });
await chrome.storage.local.get('test'); // { test: 'hello' }

// 检查 localStorage
localStorage.getItem('automa_local_test'); // '"hello"' (JSON 格式)
```

### 测试事件系统

```javascript
// 订阅事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId);
});

// 手动触发（仅用于测试）
chrome.tabs.onUpdated._trigger(123, { status: 'complete' }, { id: 123 });
```

### 查看 Shim 信息

```javascript
import { getShimInfo } from '@/utils/shim-chrome';
console.log(getShimInfo());
```

---

## 🎓 关键经验

### 1. 保留字处理
JavaScript 保留字（如 `debugger`）不能用作变量名，但可以用作对象属性名。

```javascript
// ❌ 错误
const debugger = {};

// ✅ 正确
const chromeDebugger = {};
window.chrome = { debugger: chromeDebugger };
```

### 2. 作用域管理
函数在定义的作用域外不可访问，需要在作用域内导出。

```javascript
// ❌ 错误
if (condition) {
  function myFunc() {}
}
window.fn = myFunc; // ReferenceError

// ✅ 正确
if (condition) {
  function myFunc() {}
  window.fn = myFunc; // 在作用域内
}
```

### 3. 通用事件模式
Chrome 事件都遵循相同的模式，可以用工厂函数统一创建。

```javascript
function createMockEvent(name) {
  const listeners = [];
  return {
    addListener: cb => listeners.push(cb),
    removeListener: cb => { /* ... */ },
    hasListener: cb => listeners.includes(cb),
    _trigger: (...args) => listeners.forEach(cb => cb(...args))
  };
}
```

---

## 📚 相关资源

- **主项目文档**：[../CLAUDE.md](../../CLAUDE.md)
- **架构设计文档**：[../../architecture-design/](../../architecture-design/)
- **开发指南**：[../guides/](../guides/)

---

## 🔄 更新日志

### 2025-12-08
- 📁 创建 web-migration 文档目录
- 📝 整理迁移文档结构（fixes/, milestones/）

### 2025-11-26
- ✅ 修复 workflow trigger 数组类型检查问题

### 2025-11-25
- ✅ Phase 1 完成！
- ✅ 修复所有核心问题（模块系统、存储、i18n、加载状态）
- ✅ 完善 Shim 层，支持 18 个 Chrome API
- ✅ Web 模式成功运行，零运行时错误

---

**迁移进展顺利！Phase 1 已圆满完成！** 🎉
