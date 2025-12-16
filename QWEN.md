# Automa Browser Automation Extension

## Project Overview

Automa is a browser extension for automating browser actions by connecting blocks in a visual workflow editor. It's built with Vue 3 and supports both Chrome (MV3) and Firefox browsers. The project can run both as a browser extension and as a standalone web application.

The main purpose is to allow users to create visual workflows by connecting automation blocks in a node-based editor, similar to tools like Zapier or Integromat but for browser automation.

## Technologies Used

- **Framework**: Vue 3, Vue Router, Pinia for state management
- **UI Components**: Vue Flow for node-based graph editor, CodeMirror v6 for code editing
- **Styling**: Tailwind CSS, PostCSS
- **Build Tools**: Webpack 5 (for extension), Vite 5 (for web mode)
- **Storage**: browser.storage.local (extension), localStorage (web), IndexedDB (Dexie)
- **Internationalization**: vue-i18n (supports English and Chinese)
- **Icons**: v-remixicon

## Architecture

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

### Workflow Execution Engine

**Core Files**:
- `src/workflowEngine/WorkflowEngine.js` - Main orchestrator
- `src/workflowEngine/WorkflowWorker.js` - Executes individual blocks
- `src/workflowEngine/WorkflowState.js` - Manages execution states
- `src/workflowEngine/blocksHandler/` - Block handlers (over 50+ block types)

Workflows are stored as node/edge graphs (in vue-flow format) and the engine traverses the edges to determine execution order, dispatching each block to its respective handler.

## Building and Running

### Prerequisites
- Node.js 20.11.1 (managed via Volta as specified in package.json)
- pnpm package manager

### Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create the required passkey file:
   ```bash
   # Create src/utils/getPassKey.js with content:
   export default function() {
     return 'anything-you-want';
   }
   ```

### Development Commands

**Extension Development (hot-reload):**
```bash
pnpm dev              # Chrome extension
pnpm dev:firefox      # Firefox extension
```

**Web Mode Development:**
```bash
pnpm dev:web          # Vite dev server on localhost:3000
```

**Production Builds:**
```bash
pnpm build            # Chrome extension
pnpm build:firefox    # Firefox extension
pnpm build:web        # Web application (outputs to dist-web/)
pnpm build:zip        # Create zip from extension build folder
```

**Code Quality:**
```bash
pnpm lint             # Run ESLint
pnpm prettier         # Format code
```

### Git Hooks
Pre-commit hook runs ESLint via lint-staged (configured in package.json).

**Note**: This project has no automated test suite.

## Key Features

### Block System
Over 50+ block types organized by categories:
- Control Flow (conditions, loops, wait connections)
- Browser Interaction (click, type, screenshots, tab management)
- Data Operations (insert, delete, mapping, variables)
- Element Operations (exists check, creation, hover, scroll)
- I/O Operations (import/export, clipboard, assets)
- Integrations (Google Sheets, webhooks, AI workflows)

### Web Migration Project
The project has been refactored to run as a standalone web application in addition to the browser extension. The frontend now runs in standard browsers without extension context. Key changes:
- Chrome API shim layer implemented for web compatibility
- Build system migrated to support both Webpack (extension) and Vite (web)
- Storage adapter for localStorage in web mode

### Custom Block Development
Custom blocks can be added in the `business/dev/blocks/` directory with corresponding handlers and edit components.

## Directory Structure

```
src/
├── background/          # Service worker, workflow triggers, event listeners
├── content/            # Content scripts, DOM interaction, element selector
├── newtab/             # Dashboard UI (Vue 3 SPA)
│   ├── pages/          # Router pages
│   └── components/     # Reusable components
├── workflowEngine/     # Execution engine and block handlers
│   ├── blocksHandler/  # Block type handlers (handler*.js)
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

## Development Conventions

- All contexts communicate via `MessageListener` pattern located in `src/utils/message.js`
- Reference data object is shared across all blocks for maintaining state during workflow execution
- Dynamic module loading using either `require.context` (Webpack/extension) or `import.meta.glob` (Vite/web)
- Vue 3 Composition API is used throughout the application
- Components are auto-registered using dynamic imports
- File naming follows camelCase for JavaScript files and PascalCase for Vue components
- Git hooks enforce code formatting and linting before commits

## Important Notes

1. The `getPassKey.js` file must be created in `src/utils/` before building (the file is git-ignored)
2. Extension mode has full browser automation capabilities while web mode is limited to dashboard functionality
3. Different module systems are used depending on whether running as extension or web app
4. The project supports both manifest v2 (Firefox) and v3 (Chrome) with appropriate abstractions