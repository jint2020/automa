/**
 * Workflow Schema Definition for Web Architecture
 *
 * This schema defines the standard JSON data structure that represents
 * a workflow. In the Web architecture, when a user clicks "Run", the
 * frontend generates this JSON structure instead of directly executing
 * browser automation commands.
 *
 * The schema is designed to be:
 * 1. Platform-agnostic - Can be executed by backend, desktop agent, or extension
 * 2. Serializable - Pure JSON, no functions or browser-specific objects
 * 3. Self-describing - Contains all necessary metadata for execution
 */

/**
 * @typedef {Object} WorkflowMetadata
 * @property {string} id - Unique workflow identifier
 * @property {string} name - Human-readable workflow name
 * @property {string} version - Schema version for compatibility
 * @property {string} createdAt - ISO 8601 timestamp
 * @property {string} updatedAt - ISO 8601 timestamp
 * @property {string} [description] - Optional workflow description
 */

/**
 * @typedef {Object} WorkflowSettings
 * @property {boolean} saveLog - Whether to save execution logs
 * @property {number} blockDelay - Delay between blocks in ms
 * @property {number} tabLoadTimeout - Timeout for tab loading in ms
 * @property {string} onError - Error handling strategy: 'stop' | 'keep-running' | 'restart-workflow'
 * @property {number} [restartTimes] - Max restart attempts when onError is 'restart-workflow'
 * @property {boolean} [debugMode] - Enable debug mode
 * @property {boolean} [reuseLastState] - Reuse state from last execution
 */

/**
 * @typedef {Object} WorkflowVariable
 * @property {string} name - Variable name
 * @property {*} value - Variable value (any JSON-serializable type)
 * @property {string} [type] - Optional type hint: 'string' | 'number' | 'boolean' | 'array' | 'object'
 */

/**
 * @typedef {Object} WorkflowColumn
 * @property {string} id - Column identifier
 * @property {string} name - Column display name
 * @property {string} type - Column data type: 'any' | 'string' | 'number' | 'boolean' | 'array' | 'object'
 * @property {number} index - Column index for ordering
 */

/**
 * @typedef {Object} ActionData
 * @property {string} [description] - Action description
 * @property {boolean} [disableBlock] - Whether this action is disabled
 * @property {Object} [onError] - Error handling configuration for this action
 * @property {boolean} onError.enable - Enable custom error handling
 * @property {boolean} onError.retry - Enable retry on error
 * @property {number} onError.retryTimes - Number of retry attempts
 * @property {number} onError.retryInterval - Interval between retries in seconds
 * @property {string} onError.toDo - What to do on error: 'error' | 'continue' | 'fallback'
 */

/**
 * @typedef {Object} WorkflowAction
 * @property {string} id - Unique action/node identifier
 * @property {string} type - Action type (e.g., 'new-tab', 'click-element', 'delay')
 * @property {string} label - Human-readable action label
 * @property {ActionData} data - Action-specific configuration
 * @property {Object} position - Visual position in the editor
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 */

/**
 * @typedef {Object} WorkflowConnection
 * @property {string} id - Unique connection identifier
 * @property {string} source - Source action ID
 * @property {string} sourceHandle - Source output handle (e.g., 'node-id-output-1')
 * @property {string} target - Target action ID
 * @property {string} targetHandle - Target input handle
 */

/**
 * @typedef {Object} ExecutionContext
 * @property {string} executionId - Unique execution instance ID
 * @property {string} platform - Execution platform: 'extension' | 'web' | 'desktop-agent' | 'server'
 * @property {Object} variables - Runtime variables
 * @property {Array<Object>} table - Data table for collected data
 * @property {Object} loopData - Current loop iteration data
 * @property {*} prevBlockData - Data from previous block execution
 * @property {string} [activeTabUrl] - Current active tab URL (if applicable)
 */

/**
 * @typedef {Object} WorkflowSchema
 * @property {string} schemaVersion - Schema version identifier
 * @property {WorkflowMetadata} metadata - Workflow metadata
 * @property {WorkflowSettings} settings - Workflow execution settings
 * @property {WorkflowVariable[]} variables - Initial variables
 * @property {WorkflowColumn[]} columns - Data table columns
 * @property {*} globalData - Global data passed to workflow
 * @property {Object} drawflow - Visual flow definition
 * @property {WorkflowAction[]} drawflow.nodes - Array of workflow actions/nodes
 * @property {WorkflowConnection[]} drawflow.edges - Array of connections between nodes
 */

/**
 * Example workflow schema for reference
 */
export const exampleWorkflowSchema = {
  schemaVersion: '1.0.0',
  metadata: {
    id: 'workflow-123',
    name: 'Example Web Scraping Workflow',
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    description: 'An example workflow that demonstrates the schema structure',
  },
  settings: {
    saveLog: true,
    blockDelay: 100,
    tabLoadTimeout: 30000,
    onError: 'stop',
    restartTimes: 3,
    debugMode: false,
    reuseLastState: false,
  },
  variables: [
    { name: 'searchQuery', value: 'automa browser automation', type: 'string' },
    { name: 'maxResults', value: 10, type: 'number' },
  ],
  columns: [
    { id: 'title', name: 'title', type: 'string', index: 0 },
    { id: 'url', name: 'url', type: 'string', index: 1 },
  ],
  globalData: '{}',
  drawflow: {
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        label: 'trigger',
        data: {
          description: 'Start workflow',
          type: 'manual',
          disableBlock: false,
        },
        position: { x: 100, y: 100 },
      },
      {
        id: 'node-2',
        type: 'new-tab',
        label: 'new-tab',
        data: {
          description: 'Open search page',
          url: 'https://example.com/search?q={{variables.searchQuery}}',
          active: true,
          waitTabLoaded: true,
          disableBlock: false,
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'node-3',
        type: 'get-text',
        label: 'get-text',
        data: {
          description: 'Get result titles',
          selector: '.result-title',
          multiple: true,
          saveData: true,
          dataColumn: 'title',
          disableBlock: false,
        },
        position: { x: 100, y: 300 },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        sourceHandle: 'node-1-output-1',
        target: 'node-2',
        targetHandle: 'node-2-input-1',
      },
      {
        id: 'edge-2',
        source: 'node-2',
        sourceHandle: 'node-2-output-1',
        target: 'node-3',
        targetHandle: 'node-3-input-1',
      },
    ],
  },
};

/**
 * Creates a new empty workflow schema with default values
 * @param {Partial<WorkflowMetadata>} metadata - Optional metadata overrides
 * @returns {WorkflowSchema}
 */
export function createEmptyWorkflowSchema(metadata = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0.0',
    metadata: {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      description: '',
      ...metadata,
    },
    settings: {
      saveLog: true,
      blockDelay: 0,
      tabLoadTimeout: 30000,
      onError: 'stop',
      restartTimes: 3,
      debugMode: false,
      reuseLastState: false,
    },
    variables: [],
    columns: [{ id: 'column', name: 'column', type: 'any', index: 0 }],
    globalData: '{}',
    drawflow: {
      nodes: [],
      edges: [],
    },
  };
}

/**
 * Validates a workflow schema structure
 * @param {Object} schema - Schema to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWorkflowSchema(schema) {
  const errors = [];

  if (!schema) {
    errors.push('Schema is required');
    return { valid: false, errors };
  }

  if (!schema.schemaVersion) {
    errors.push('Schema version is required');
  }

  if (!schema.metadata) {
    errors.push('Metadata is required');
  } else {
    if (!schema.metadata.id) errors.push('Metadata.id is required');
    if (!schema.metadata.name) errors.push('Metadata.name is required');
  }

  if (!schema.drawflow) {
    errors.push('Drawflow is required');
  } else {
    if (!Array.isArray(schema.drawflow.nodes)) {
      errors.push('Drawflow.nodes must be an array');
    }
    if (!Array.isArray(schema.drawflow.edges)) {
      errors.push('Drawflow.edges must be an array');
    }
  }

  return { valid: errors.length === 0, errors };
}

export default {
  exampleWorkflowSchema,
  createEmptyWorkflowSchema,
  validateWorkflowSchema,
};
