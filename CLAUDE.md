# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Automa is a browser automation extension (Chrome MV3 & Firefox) built with Vue 3. Users create visual workflows by connecting automation blocks in a node-based editor. Each workflow executes across multiple browser contexts (background service worker, content scripts, and dashboard UI).

## Critical Setup Requirement

**Before running any dev/build commands**, you must create `src/utils/getPassKey.js`:

```js
export default function() {
  return 'anything-you-want';
}
```

This file is git-ignored and required for the extension to build.

## Node Version

This project uses Node.js 20.11.1 (managed via Volta). See `package.json` for Volta config.

## Development Commands

```bash
# Install dependencies
pnpm install

# Extension Development (hot-reload)
pnpm dev              # Chrome extension
pnpm dev:firefox      # Firefox extension

# Web Mode Development (standalone web app)
pnpm dev:web          # Vite dev server on localhost:3000

# Production builds
pnpm build            # Chrome extension
pnpm build:firefox    # Firefox extension
pnpm build:web        # Web application (dist-web/)
pnpm build:zip        # Create zip from extension build folder

# Code quality
pnpm lint             # ESLint
pnpm prettier         # Format code
```

**Git Hooks**: Pre-commit hook runs ESLint via lint-staged (configured in package.json).

**Note**: This project has no automated test suite.

## Architecture Overview

### Multi-Context Extension Architecture

Automa runs across three independent JavaScript contexts that communicate via message passing:

1. **Background Script** (`src/background/`) - Service worker (MV3)
   - Orchestrates workflow execution
   - Handles browser events (alarms, navigation, commands)
   - Manages workflow triggers (scheduled, manual, event-based)
   - Acts as message hub between content scripts and dashboard

2. **Content Script** (`src/content/`) - Injected into web pages
   - Executes DOM interactions (click, type, extract data)
   - Element selection and finding (CSS/XPath/ShadowDOM)
   - Form filling and interaction
   - Communicates with background via `MessageListener`

3. **Newtab Dashboard** (`src/newtab/`) - Vue 3 SPA
   - Visual workflow editor (vue-flow based node editor)
   - Workflow CRUD operations
   - Execution logs and storage management
   - No direct browser API access; proxies through background script

**Key Pattern**: All contexts communicate via `MessageListener` pattern (`src/utils/message.js`):
```js
// Sender
sendMessage('workflow:execute', data, 'background');

// Receiver
message.on('workflow:execute', (data) => { ... });
```

### Workflow Execution Engine

**Core Files**:
- `src/workflowEngine/WorkflowEngine.js` - Main orchestrator
- `src/workflowEngine/WorkflowWorker.js` - Executes individual blocks
- `src/workflowEngine/WorkflowState.js` - Manages execution states
- `src/workflowEngine/blocksHandler/` - 56+ block handlers (handler*.js)

**Execution Flow**:
1. Workflow stored as node/edge graph (vue-flow format)
2. WorkflowEngine traverses edges to determine execution order
3. Each block dispatches to its handler in `blocksHandler/`
4. Handlers return Promises; output threads to next block
5. `referenceData` object shared across all blocks for state

**Block Handler Pattern**:
```js
// Example: src/workflowEngine/blocksHandler/handlerClick.js
export default function (blockData, { handleSelector }) {
  return new Promise((resolve, reject) => {
    // Execute block logic
    resolve({ data: result });
  });
}
```

**Adding New Blocks**:
- Create `handlerXxx.js` in `blocksHandler/` - automatically discovered via `import.meta.glob`
- In web mode (Vite), handlers are loaded via `import.meta.glob('./blocksHandler/*.js', { eager: true })`
- In extension mode (Webpack), handlers use `require.context`

### State Management

**Pinia Stores** (`src/stores/`) - Primary state management:
- `workflow.js` - Workflow CRUD, local workflows
- `main.js` - Global settings, editor preferences
- `user.js` - Authentication, teams, cloud sync

**Additional Storage**:
- `browser.storage.local` - Persisted workflows/settings (maps to localStorage in web mode)
- IndexedDB (Dexie) - Large data structures (`src/db/`)
- In-memory Maps - Active execution states

### Key Architectural Patterns

1. **Singleton Services**: `WorkflowManager`, `BackgroundWorkflowUtils`, `BrowserAPIService` - ensure single instances per extension lifecycle

2. **Dynamic Module Loading**:
   - Extension mode: `require.context` (Webpack)
   - Web mode: `import.meta.glob` (Vite)
   - Auto-discovery of blocks, handlers, and UI components

3. **Reference Data Threading**: `WorkflowEngine.referenceData` object shared across all blocks:
   ```js
   {
     variables: {},    // User-defined variables
     table: [],        // Data table rows
     secrets: {},      // Encrypted credentials
     loopData: {},     // Current loop iteration
     globalData: {}    // Workflow globals
   }
   ```

4. **Templating Engine**: All string fields support `{{ variable }}` syntax via `src/workflowEngine/templating/renderString.js`

5. **Element Selection Abstraction**: Unified querying (`src/content/handleSelector.js`) supports CSS, XPath, ShadowDOM piercing

6. **Browser API Abstraction**:
   - Extension mode: `src/service/browser-api/BrowserAPIService.js` masks Chrome/Firefox differences
   - Web mode: `src/utils/shim-chrome.ts` provides mock APIs

7. **Event-Driven State**: `WorkflowState` emits events (`update`, `stop`, `resume`) for state changes

## Directory Structure

```
src/
├── background/          # Service worker, workflow triggers, event listeners
├── content/            # Content scripts, DOM interaction, element selector
├── newtab/             # Dashboard UI (Vue 3 SPA)
│   ├── pages/          # Router pages
│   └── components/     # Reusable components
├── workflowEngine/     # Execution engine and block handlers
│   ├── blocksHandler/  # 56+ block type handlers (handler*.js)
│   └── templating/     # Variable substitution engine
├── stores/             # Pinia state management
├── composable/         # Vue 3 composables (reusable logic)
├── service/            # Browser API abstraction
├── db/                 # IndexedDB (Dexie) definitions
├── utils/              # Shared utilities, message passing
│   └── shim-chrome.ts  # Chrome API mock layer (web mode)
└── assets/             # Icons, styles, locales

business/dev/           # Custom business blocks
├── blocks/
│   ├── index.js                    # Custom block definitions
│   ├── backgroundHandler/          # Background execution handlers
│   ├── contentHandler/             # Content script handlers
│   └── editComponents/             # Block editing UI components
└── parameters/         # Custom parameter types
```

## Technology Stack

- **Framework**: Vue 3, Vue Router, Pinia
- **Workflow Editor**: vue-flow (node-based graph editor)
- **Code Editor**: CodeMirror v6
- **Build**:
  - Extension: Webpack 5, Babel
  - Web: Vite 5
- **Styling**: PostCSS, Tailwind CSS
- **Browser APIs**: webextension-polyfill (Chrome/Firefox abstraction)
- **Storage**: browser.storage.local, IndexedDB (Dexie)
- **i18n**: vue-i18n (supports en, zh locales)

## Important Development Notes

### Extension Mode
- **Entry Points**: `background`, `contentScript`, `newtab`, `popup` (see `webpack.config.js`)
- **Manifest**: Chrome uses `manifest.chrome.json` (MV3), Firefox uses `manifest.firefox.json`
- **Permissions**: Requires `<all_urls>`, `tabs`, `debugger`, `scripting`, `storage`, `webNavigation`
- **Browser Compatibility**: Content scripts run at `document_start` for early injection
- **Message Flow**: Trace `sendMessage()` calls to understand cross-context communication

### Web Mode
- **Entry Point**: `index.html` → `src/main-web.js`
- **Chrome API Shim**: `src/utils/shim-chrome.ts` MUST be imported first in main-web.js
- **Storage**: `chrome.storage.local` maps to `localStorage` with prefix `automa_local_`
- **No Extension APIs**: All chrome.* calls are mocked or no-ops
- **Locales**: Only en and zh locales loaded (to avoid build errors from invalid locale files)

### Module System Differences

**Files using dynamic imports** (differ between Webpack and Vite):
- `src/lib/compsUi.js` - UI component auto-registration
- `src/lib/vueI18n.js` - Locale file loading
- `src/workflowEngine/blocksHandler.js` - Background handlers
- `src/content/blocksHandler.js` - Content script handlers
- `src/components/newtab/workflow/WorkflowEditBlock.vue` - Edit components
- `src/components/newtab/workflow/WorkflowEditor.vue` - Block visual components

**Pattern used**:
```js
// Vite (web mode)
const modules = import.meta.glob('./path/*.ext', { eager: true });
const handlers = Object.keys(modules).reduce((acc, path) => {
  const name = path.split('/').pop().replace(/\.ext$/, '');
  acc[name] = modules[path].default;
  return acc;
}, {});

// Webpack (extension mode) - not shown, but uses require.context
```

## Block System Details

56+ block types organized by category:
- **Control Flow**: trigger, conditions, loops (loopData, loopElements, whileLoop), waitConnections
- **Browser Interaction**: click, type, attribute, screenshot, tab management
- **Data Operations**: insertData, deleteData, dataMapping, variables
- **Element Operations**: elementExists, createElement, hoverElement, scrollElement
- **I/O**: importData, exportData, clipboard, saveAssets
- **Integration**: googleSheets, webhook, aiWorkflow, executeWorkflow
- **Custom**: CRM blocks and other business-specific blocks in `business/dev/blocks/`

Block definitions in `src/utils/getSharedData.js` - contains metadata for each block type.

## Workflow Storage Format

Workflows stored in browser.storage.local (or localStorage in web mode):
```js
{
  id, name, icon,
  drawflow: { nodes: [...], edges: [...] },  // vue-flow format
  settings: { saveLog, debugMode, onError, blockDelay, notification },
  globalData: "{ \"key\": \"value\" }",      // JSON string
  table: [],                                  // Data table
  dataColumns: [],                            // Column definitions
  version, createdAt, updatedAt, isDisabled
}
```

Converted to traversable format by WorkflowEngine before execution.

## Custom Block Development

Custom blocks are defined in `business/dev/blocks/`. To add a new block:

1. **Define Block** in `business/dev/blocks/index.js`:
```js
export default function () {
  return {
    'block-id': {
      name: 'Block Name',
      description: 'Block description',
      icon: 'riIconName',
      component: 'BlockBasic',
      editComponent: 'EditMyBlock',
      category: 'integration',
      inputs: 1,
      outputs: 1,
      data: { /* default data */ },
    },
  };
}
```

2. **Create Handler** in `business/dev/blocks/backgroundHandler/handlerMyBlock.js`:
```js
export default async function (block, { refData }) {
  const { data } = block;
  // Execute block logic
  return {
    data: result,
    nextBlockId: block.id,
  };
}
```

3. **Create Edit Component** in `business/dev/blocks/editComponents/EditMyBlock.vue`:
```vue
<template>
  <!-- Block configuration UI -->
</template>

<script setup>
const props = defineProps({
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:data']);
</script>
```

4. **Register Edit Component** in `business/dev/blocks/editComponents/index.js`:
```js
import EditMyBlock from './EditMyBlock.vue';
export default function () {
  return { EditMyBlock };
}
```

## Icon Resources

Icons use v-remixicon. Preview available at: https://preview-v-remixicon.vercel.app/

---

## Web Migration Project

### Overview
Automa is being refactored to run as a standalone web application in addition to the browser extension. **Phase 1 is COMPLETE**. The frontend now runs in standard browsers without extension context.

### Current Status: Phase 1 Complete ✅

**Completed Work**:
1. ✅ Build system migrated to Vite for web mode
2. ✅ Chrome API shim layer implemented (`src/utils/shim-chrome.ts`)
3. ✅ Module system converted (require.context → import.meta.glob)
4. ✅ Storage adapter (chrome.storage.local → localStorage)
5. ✅ i18n locale loading fixed for Vite
6. ✅ UI fully renders in web mode

**Running Web Mode**:
```bash
pnpm dev:web          # Development server on localhost:3000
pnpm build:web        # Production build to dist-web/
pnpm preview:web      # Preview production build
```

**Key Files**:
- `vite.config.ts` - Vite configuration for web mode
- `index.html` - Web app entry point
- `src/main-web.js` - Web initialization (imports shim first!)
- `src/utils/shim-chrome.ts` - Chrome API mock layer (880+ lines)

### Architecture Design

Complete architectural documentation in `architecture-design/`:
- `README.md` - DDD principles, design patterns
- `core-interfaces.ts` - TypeScript interfaces for execution plans
- `mock-runner.ts` - Mock execution engine
- `architecture-diagrams.md` - Mermaid diagrams

### Migration Documentation

Detailed fix documentation:
- `MODULE-SYSTEM-MIGRATION.md` - require.context → import.meta.glob conversion
- `STORAGE-ONCHANGED-FIX.md` - Storage event handling fix
- `INFINITE-LOADING-FIX.md` - Window type property fix
- `I18N-LOCALE-FIX.md` - Locale loading for Vite
- `WORKFLOW-TRIGGER-FIX.md` - Array type checking fix
- `PHASE1-FINAL-STATUS.md` - Complete Phase 1 status and metrics

### Known Limitations (Web Mode)

1. **No Real Browser Automation**: chrome.tabs.*, chrome.debugger.* are mocked
2. **Limited Locales**: Only en and zh loaded (other locales have syntax errors)
3. **No Background/Content Scripts**: Only dashboard UI runs
4. **Storage Events**: Limited cross-tab synchronization

### Migration Principles

1. **Backward Compatibility**: Extension mode continues working unchanged
2. **Environment Detection**: Code detects extension vs web context
3. **Dual Build**: Webpack (extension) and Vite (web) coexist
4. **Gradual Migration**: UI refactored incrementally in future phases

### Next Phases (Planned)

**Phase 2: UI Layer Refactoring**
- Environment-agnostic components
- WorkflowCompiler for JSON export
- Storage abstraction layer

**Phase 3: Execution Abstraction**
- RuntimeAdapter interface
- ExtensionRuntimeAdapter
- RemoteRuntimeAdapter for backend

**Phase 4+: Advanced Features**
- Remote execution
- Cloud storage
- Multi-platform deployment
