# Web Runner Architecture

The `web-runner` module provides the architectural foundation for running Automa workflows in environments where Chrome extension APIs (`chrome.*`) are not available.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     UI Orchestration Layer                      │
│                  (Visual Editor / Workflow Designer)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Workflow Compiler                           │
│            (Converts visual flow to JSON schema)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Action Bridge                               │
│              (Platform abstraction layer)                       │
│  ┌──────────────┬───────────────┬─────────────────────────────┐ │
│  │ Extension    │ Web Adapter   │ Mock Adapter                │ │
│  │ Adapter      │ (Instructions)│ (Simulation)                │ │
│  │ (chrome.*)   │               │                             │ │
│  └──────────────┴───────────────┴─────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ Browser  │  │ Backend  │  │ Desktop  │
       │ Extension│  │ Server   │  │ Agent    │
       └──────────┘  └──────────┘  └──────────┘
```

## Key Components

### 1. Workflow Schema (`types/workflow-schema.js`)

Defines the standard JSON data structure for workflows. When a user clicks "Run" in web mode, this schema is generated instead of direct execution.

```javascript
const schema = {
  schemaVersion: '1.0.0',
  metadata: { id, name, version, ... },
  settings: { saveLog, blockDelay, ... },
  variables: [...],
  drawflow: { nodes: [...], edges: [...] }
};
```

### 2. Action Interface (`types/action-interface.js`)

Defines abstract interfaces for all workflow actions:
- `validate()` - Validates action data
- `toInstruction()` - Converts to remote instruction

### 3. Action Bridge (`bridge/ActionBridge.js`)

The platform abstraction layer with three adapters:

- **ExtensionAdapter**: Direct `chrome.*` API calls (browser extension)
- **WebAdapter**: Generates JSON instructions for remote execution
- **MockAdapter**: Simulates execution for development/testing

### 4. Mock Runner (`runner/MockRunner.js`)

Simulates workflow execution by consuming the JSON schema and logging steps.

### 5. Workflow Compiler (`runner/WorkflowCompiler.js`)

Converts visual flow from the editor to executable JSON.

## Usage Examples

### Mock Mode (Development)

```javascript
import { MockRunner, exampleWorkflowSchema } from '@/web-runner';

const runner = new MockRunner(exampleWorkflowSchema, {
  logToConsole: true,
  stepDelay: 100
});
await runner.run();
```

### Web Mode (Production)

```javascript
import { ActionBridge } from '@/web-runner';

const bridge = ActionBridge.create('web', {
  remoteEndpoint: '/api/execute'
});

const result = await bridge.execute('new-tab', {
  url: 'https://example.com',
  active: true
}, context);

// result.instruction contains the JSON to send to backend
```

### Compile Workflow

```javascript
import { WorkflowCompiler } from '@/web-runner';

const compiler = new WorkflowCompiler(workflow);
const { compiled, errors } = compiler.compile({
  resolveTemplates: true,
  validateActions: true
});
```

## Extension Mode vs Web Mode

### Extension Mode (Original)
```javascript
// Directly calls browser API
const tab = await browser.tabs.create({
  url: 'https://example.com',
  active: true
});
```

### Web Mode (New Architecture)
```javascript
// Generates instruction JSON
const instruction = {
  action: 'browser.tabs.create',
  params: { url: 'https://example.com', active: true },
  context: { executionId, workflowId }
};
// Send to backend/agent for execution
await fetch('/api/execute', { body: JSON.stringify(instruction) });
```

## Adding New Actions

1. Define action in `types/action-interface.js`:
   - Add validation logic
   - Add `toInstruction()` method
   - Register in `ActionRegistry`

2. For extension mode, add handler in `bridge/adapters/ExtensionAdapter.js`

3. Mock responses can be customized in `MockAdapter`

## Directory Structure

```
src/web-runner/
├── types/
│   ├── workflow-schema.js    # JSON schema definition
│   └── action-interface.js   # Action type interfaces
├── bridge/
│   ├── ActionBridge.js       # Main bridge class
│   └── adapters/
│       ├── ExtensionAdapter.js
│       ├── WebAdapter.js
│       └── MockAdapter.js
├── runner/
│   ├── MockRunner.js         # Simulation runner
│   └── WorkflowCompiler.js   # Flow to JSON compiler
├── actions/
│   └── NewTabAction.js       # Example implementation
└── index.js                  # Module exports
```
