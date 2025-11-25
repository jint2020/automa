/**
 * Web Runner Module
 *
 * This module provides the architecture for running Automa workflows
 * in a web environment (without chrome.* APIs).
 *
 * Architecture Overview:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     UI Orchestration Layer                      │
 * │                  (Visual Editor / Workflow Designer)            │
 * └───────────────────────────┬─────────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Workflow Compiler                           │
 * │            (Converts visual flow to JSON schema)                │
 * └───────────────────────────┬─────────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Action Bridge                               │
 * │              (Platform abstraction layer)                       │
 * │  ┌──────────────┬───────────────┬─────────────────────────────┐ │
 * │  │ Extension    │ Web Adapter   │ Mock Adapter                │ │
 * │  │ Adapter      │ (Instructions)│ (Simulation)                │ │
 * │  │ (chrome.*)   │               │                             │ │
 * │  └──────────────┴───────────────┴─────────────────────────────┘ │
 * └───────────────────────────┬─────────────────────────────────────┘
 *                             │
 *              ┌──────────────┼──────────────┐
 *              ▼              ▼              ▼
 *        ┌──────────┐  ┌──────────┐  ┌──────────┐
 *        │ Browser  │  │ Backend  │  │ Desktop  │
 *        │ Extension│  │ Server   │  │ Agent    │
 *        └──────────┘  └──────────┘  └──────────┘
 *
 * Usage Examples:
 *
 * 1. Mock/Development Mode:
 *    import { MockRunner, exampleWorkflowSchema } from '@/web-runner';
 *    const runner = new MockRunner(exampleWorkflowSchema);
 *    await runner.run();
 *
 * 2. Web Mode (Generate Instructions):
 *    import { ActionBridge } from '@/web-runner';
 *    const bridge = ActionBridge.create('web', { remoteEndpoint: '/api/execute' });
 *    const result = await bridge.execute('new-tab', { url: 'https://...' }, context);
 *
 * 3. Compile Workflow:
 *    import { WorkflowCompiler } from '@/web-runner';
 *    const compiler = new WorkflowCompiler(workflow);
 *    const { compiled } = compiler.compile({ resolveTemplates: true });
 */

// Types
import * as workflowSchema from './types/workflow-schema';
import * as actionInterface from './types/action-interface';

// Bridge
import ActionBridge from './bridge/ActionBridge';

// Adapters
import ExtensionAdapter from './bridge/adapters/ExtensionAdapter';
import WebAdapter from './bridge/adapters/WebAdapter';
import MockAdapter from './bridge/adapters/MockAdapter';

// Runner
import MockRunner from './runner/MockRunner';
import WorkflowCompiler, { compileWorkflow } from './runner/WorkflowCompiler';

// Re-export schema utilities
export const {
  exampleWorkflowSchema,
  createEmptyWorkflowSchema,
  validateWorkflowSchema,
} = workflowSchema;

// Re-export action utilities
export const {
  ActionRegistry,
  getAction,
  getAllActionTypes,
  isValidActionType,
  // Individual actions
  NewTabAction,
  CloseTabAction,
  SwitchTabAction,
  ClickElementAction,
  FormsAction,
  GetTextAction,
  TriggerAction,
  DelayAction,
  InsertDataAction,
  ExportDataAction,
  ConditionsAction,
  LoopDataAction,
} = actionInterface;

// Export bridge and adapters
export { ActionBridge, ExtensionAdapter, WebAdapter, MockAdapter };

// Export runner components
export { MockRunner, WorkflowCompiler, compileWorkflow };

/**
 * Quick start helper: Create and run a mock execution
 * @param {Object} workflow - Workflow schema
 * @param {Object} [options] - MockRunner options
 * @returns {Promise<Object>}
 */
export async function runMockWorkflow(workflow, options = {}) {
  const runner = new MockRunner(workflow, options);
  return runner.run();
}

/**
 * Quick start helper: Compile a workflow
 * @param {Object} workflow - Workflow from editor
 * @param {Object} [options] - Compile options
 * @returns {Object}
 */
export function compile(workflow, options = {}) {
  return compileWorkflow(workflow, options);
}

/**
 * Quick start helper: Create a bridge for a specific platform
 * @param {'extension' | 'web' | 'mock'} platform
 * @param {Object} [options]
 * @returns {ActionBridge}
 */
export function createBridge(platform, options = {}) {
  return ActionBridge.create(platform, options);
}

// Default export
export default {
  // Types
  exampleWorkflowSchema,
  createEmptyWorkflowSchema,
  validateWorkflowSchema,
  ActionRegistry,
  getAction,
  getAllActionTypes,
  isValidActionType,

  // Bridge
  ActionBridge,
  ExtensionAdapter,
  WebAdapter,
  MockAdapter,
  createBridge,

  // Runner
  MockRunner,
  WorkflowCompiler,
  compileWorkflow,
  compile,
  runMockWorkflow,
};
