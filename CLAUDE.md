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

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (hot-reload)
pnpm dev              # Chrome
pnpm dev:firefox      # Firefox

# Production builds
pnpm build            # Chrome
pnpm build:firefox    # Firefox
pnpm build:zip        # Create zip from build folder

# Code quality
pnpm lint             # ESLint
pnpm prettier         # Format code
```

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
- `src/workflowEngine/blocksHandler/` - 56 block handlers (handler*.js)

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

**Adding New Blocks**: Create `handlerXxx.js` in `blocksHandler/` - automatically discovered via webpack context.

### State Management

**Pinia Stores** (`src/stores/`) - Primary state management:
- `workflow.js` - Workflow CRUD, local workflows
- `main.js` - Global settings, editor preferences
- `user.js` - Authentication, teams, cloud sync

**Additional Storage**:
- `browser.storage.local` - Persisted workflows/settings
- IndexedDB (Dexie) - Large data structures (`src/db/`)
- In-memory Maps - Active execution states

### Key Architectural Patterns

1. **Singleton Services**: `WorkflowManager`, `BackgroundWorkflowUtils`, `BrowserAPIService` - ensure single instances per extension lifecycle

2. **Dynamic Handler Registry**: Block handlers auto-loaded via webpack `require.context`

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

6. **Browser API Abstraction**: `src/service/browser-api/BrowserAPIService.js` masks Chrome/Firefox differences

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
│   ├── blocksHandler/  # 56 block type handlers (handler*.js)
│   └── templating/     # Variable substitution engine
├── stores/             # Pinia state management
├── composable/         # Vue 3 composables (reusable logic)
├── service/            # Browser API abstraction
├── db/                 # IndexedDB (Dexie) definitions
├── utils/              # Shared utilities, message passing
└── assets/             # Icons, styles, locales
```

## Technology Stack

- **Framework**: Vue 3, Vue Router, Pinia
- **Workflow Editor**: vue-flow (node-based graph editor)
- **Code Editor**: CodeMirror v6
- **Build**: Webpack 5, Babel, PostCSS, Tailwind CSS
- **Browser APIs**: webextension-polyfill (Chrome/Firefox abstraction)
- **Storage**: browser.storage.local, IndexedDB (Dexie)

## Important Development Notes

- **Webpack Entry Points**: `background`, `contentScript`, `newtab`, `popup` (see `webpack.config.js`)
- **Manifest**: Chrome uses `manifest.chrome.json` (MV3), Firefox uses `manifest.firefox.json`
- **Permissions**: Requires `<all_urls>`, `tabs`, `debugger`, `scripting`, `storage`, `webNavigation`
- **Browser Compatibility**: Content scripts run at `document_start` for early injection
- **Performance**: WorkflowWorker uses async/await for non-blocking execution
- **Message Flow**: Trace `sendMessage()` calls to understand cross-context communication
- **State Inspection**: Check `WorkflowState.states` Map for active execution debugging

## Block System Details

56 block types organized by category:
- **Control Flow**: trigger, conditions, loops (loopData, loopElements, whileLoop), waitConnections
- **Browser Interaction**: click, type, attribute, screenshot, tab management
- **Data Operations**: insertData, deleteData, dataMapping, variables
- **Element Operations**: elementExists, createElement, hoverElement, scrollElement
- **I/O**: importData, exportData, clipboard, saveAssets
- **Integration**: googleSheets, webhook, aiWorkflow, executeWorkflow

Block definitions in `src/utils/getSharedData.js` - contains metadata for each block type.

## Workflow Storage Format

Workflows stored in browser.storage.local:
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

## Common Development Tasks

When modifying workflow execution logic, test across all contexts:
1. Background script (check console in `chrome://extensions` → Inspect service worker)
2. Content script (check page console)
3. Dashboard (check newtab console)

When adding new block types:
1. Create handler in `src/workflowEngine/blocksHandler/handlerXxx.js`
2. Add block definition to `src/utils/getSharedData.js`
3. Create UI component in `src/components/block/Block*.vue` if needed

## Icon Resources

Icons use v-remixicon. Preview available at: https://preview-v-remixicon.vercel.app/

---

## Web Migration Project (In Progress)

### Overview
Automa is being refactored to run as a standalone web application in addition to the browser extension. The goal is to decouple the UI layer from execution logic, making the frontend a "workflow designer" that generates standardized JSON execution plans.

### Architecture Design
See `architecture-design/` directory for complete architectural documentation:
- `README.md` - Complete architecture overview and design principles
- `core-interfaces.ts` - TypeScript interface definitions for execution plans
- `mock-runner.ts` - Mock execution engine for frontend testing
- `architecture-diagrams.md` - Mermaid diagrams of the new architecture

### Migration Phases

**Phase 1: Environment Migration (Current)**
- Migrate build system from Webpack to Vite
- Create Chrome API shim layer (`src/utils/shim-chrome.ts`)
- Enable frontend to run in standard browser environment without extension context
- Map `chrome.storage.local` → `localStorage` for UI persistence

**Phase 2: UI Layer Refactoring**
- Refactor Vue 3 components to be environment-agnostic
- Implement `WorkflowCompiler` to generate execution plans
- Create JSON export/preview functionality

**Phase 3: Execution Abstraction**
- Implement `RuntimeAdapter` interface
- Create `ExtensionRuntimeAdapter` for current extension mode
- Create `RemoteRuntimeAdapter` for future backend integration

**Phase 4+: Advanced Features**
- Remote execution support
- Cloud workflow storage
- Multi-platform deployment

### Key Migration Principles

1. **Backward Compatibility**: Extension mode must continue working during migration
2. **Gradual Refactoring**: UI components refactored incrementally
3. **Environment Detection**: Code detects if running in extension vs web context
4. **Dual Build**: Maintain both Webpack (extension) and Vite (web) builds temporarily

### Running in Web Mode (After Phase 1)

```bash
# Development server (web mode)
npm run dev:web

# Build web application
npm run build:web
```

### Chrome API Shim Layer

When running in web mode, `src/utils/shim-chrome.ts` provides:
- `chrome.storage.local` → `localStorage` adapter
- `chrome.runtime.sendMessage` → console logging
- Other extension APIs as no-ops or mocks

Import shim before Vue app initialization:
```js
// src/main.js (web entry point)
import './utils/shim-chrome'; // Must be first
import { createApp } from 'vue';
// ... rest of app
```

### Development Guidelines for Migration

- **New Components**: Design to be environment-agnostic from the start
- **Storage Access**: Use abstraction layer, not direct `chrome.storage` calls
- **Message Passing**: Prepare for migration to event bus pattern
- **Testing**: Test in both extension and web contexts
- **Feature Flags**: Use environment detection for mode-specific features
