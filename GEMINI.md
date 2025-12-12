# Automa Project Context

## Project Overview
**Automa** is a powerful browser automation tool that allows users to connect blocks to create automated workflows.
It is primarily a **Browser Extension** (Chrome/Firefox) but is currently undergoing an architectural evolution to also support a standalone **Web Application** mode.

**Key Features:**
*   **Visual Workflow Editor:** Built with Vue 3 and `vue-flow`.
*   **Block-Based Automation:** Users connect blocks (e.g., Click, Scroll, Extract Data) to define logic.
*   **Dual-Runtime Architecture:**
    *   **Extension Mode:** Runs directly in the browser with full access to Chrome/Firefox APIs (DOM manipulation, tabs, storage).
    *   **Web Mode (In Progress):** A standalone web version that decouples the UI from the execution environment, using a standard JSON "WorkflowExecutionPlan".

## Tech Stack
*   **Frontend Framework:** Vue 3 (Composition API)
*   **Styling:** Tailwind CSS
*   **State Management:** Pinia (primary), Vuex / Vuex ORM (legacy/transitioning)
*   **Build Tools:**
    *   **Webpack 5:** For building the Browser Extension (`src/manifest.*.json`).
    *   **Vite 5:** For building the Web Application (`vite.config.ts`).
*   **Core Libraries:**
    *   `vue-flow`: For the node-based editor.
    *   `codemirror`: For code editing within blocks.
    *   `dayjs`: Date manipulation.
    *   `axios`: HTTP requests.

## Architecture & Directory Structure

### Key Directories
*   **`src/`**: Main source code for the extension and shared logic.
    *   `background/`: Extension background service worker (event listeners, workflow triggers).
    *   `content/`: Content scripts injected into web pages (DOM interaction, element selection).
    *   `popup/`, `newtab/`, `options/`: UI entry points for the extension.
    *   `workflowEngine/`: The core engine responsible for executing the workflow steps.
    *   `components/`: Shared Vue components (Blocks, UI elements).
    *   `locales/`: i18n translation files.
*   **`business/`**: Contains business logic and block definitions (e.g., `business/dev/blocks/`).
*   **`architecture-design/`**: Documentation and prototypes for the new decoupled architecture.
*   **`impldoc/`**: Implementation documentation, including guides for **Custom Block Development** and Web Migration.
*   **`utils/`**: Build scripts (`build.js`) and development servers (`webserver.js`).

### Architectural Concepts
*   **WorkflowExecutionPlan:** A standardized JSON format that describes a workflow, allowing it to be executed by different "Runtime Adapters" (Mock, Extension, Remote).
*   **Runtime Adapters:**
    *   `MockRuntimeAdapter`: For testing/dev in the web version.
    *   `ExtensionRuntimeAdapter`: For the actual browser extension.
    *   `RemoteRuntimeAdapter`: For future remote/cloud execution.

## Development Workflow

### Prerequisites
*   Node.js >= 14.18.1 (Recommended: v20.11.1 via Volta)
*   pnpm (implied by `pnpm-lock.yaml`)

### Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Dev (Web App)** | `npm run dev:web` | Starts the Vite dev server for the Web version (localhost:3000). |
| **Dev (Extension)** | `npm run dev` | Starts the Webpack dev server for the Chrome extension. |
| **Build (Extension)**| `npm run build` | Builds the extension for Chrome into `build/`. |
| **Build (Firefox)** | `npm run build:firefox` | Builds the extension for Firefox. |
| **Build (Web)** | `npm run build:web` | Builds the Web App into `dist-web/`. |
| **Lint** | `npm run lint` | Runs ESLint. |
| **Format** | `npm run prettier` | Runs Prettier. |

### Creating Custom Blocks
Refer to `impldoc/guides/custom-block-development.md` for a complete guide.
1.  **Define:** Add block metadata in `business/dev/blocks/index.js`.
2.  **Logic:** Create a handler in `business/dev/blocks/backgroundHandler/`.
3.  **UI:** Create an edit component in `business/dev/blocks/editComponents/`.

## Key Files
*   `package.json`: Dependencies and scripts.
*   `vite.config.ts`: Configuration for the Web App build.
*   `webpack.config.js`: Configuration for the Extension build.
*   `src/manifest.chrome.json`: Manifest V3 configuration for Chrome.
*   `architecture-design/README.md`: High-level architecture docs.
