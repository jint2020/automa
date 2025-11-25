/**
 * Mock Runner - Workflow Execution Simulator
 *
 * The MockRunner provides a simulated execution environment that consumes
 * the workflow JSON schema and simulates the execution flow. It logs
 * each step to the console, making it useful for:
 *
 * 1. Development - Test workflows without a backend
 * 2. Debugging - Understand the execution flow
 * 3. Demonstrations - Show how workflows work
 * 4. Validation - Verify workflow structure before real execution
 *
 * Usage:
 *   const runner = new MockRunner(workflowSchema);
 *   await runner.run();
 */

import { ActionBridge } from '../bridge/ActionBridge';
import { validateWorkflowSchema } from '../types/workflow-schema';
import { getAction } from '../types/action-interface';

/**
 * @typedef {Object} RunnerOptions
 * @property {boolean} [logToConsole=true] - Log execution to console
 * @property {number} [stepDelay=100] - Delay between steps (ms)
 * @property {number} [maxIterations=1000] - Max loop iterations (safety)
 * @property {Function} [onStepStart] - Callback before each step
 * @property {Function} [onStepComplete] - Callback after each step
 * @property {Function} [onError] - Callback on error
 * @property {Function} [onComplete] - Callback on workflow complete
 */

/**
 * @typedef {Object} ExecutionState
 * @property {string} status - 'idle' | 'running' | 'paused' | 'completed' | 'error'
 * @property {number} currentNodeIndex - Current node being executed
 * @property {string} currentNodeId - ID of current node
 * @property {Object} variables - Current variables
 * @property {Array} table - Current data table
 * @property {Object} loopData - Current loop state
 * @property {Array} history - Execution history
 * @property {*} prevBlockData - Data from previous block
 */

/**
 * Mock Runner for simulating workflow execution
 */
class MockRunner {
  /**
   * @param {Object} workflowSchema - The workflow schema to execute
   * @param {RunnerOptions} [options] - Runner options
   */
  constructor(workflowSchema, options = {}) {
    this.schema = workflowSchema;
    this.options = {
      logToConsole: true,
      stepDelay: 100,
      maxIterations: 1000,
      ...options,
    };

    // Initialize execution state
    this.state = this._createInitialState();

    // Create a mock bridge for execution
    this.bridge = ActionBridge.create('mock', {
      mockDelay: this.options.stepDelay,
      logToConsole: this.options.logToConsole,
    });

    // Build connections map for efficient traversal
    this.connectionsMap = this._buildConnectionsMap();

    // Track loop iterations for safety
    this.loopIterations = {};
  }

  /**
   * Create initial execution state
   * @private
   */
  _createInitialState() {
    const variables = {};
    (this.schema?.variables || []).forEach((v) => {
      variables[v.name] = v.value;
    });

    return {
      status: 'idle',
      currentNodeIndex: 0,
      currentNodeId: null,
      variables,
      table: [],
      loopData: {},
      history: [],
      prevBlockData: null,
      globalData: this.schema?.globalData || '{}',
    };
  }

  /**
   * Build a map of node connections for efficient lookup
   * @private
   */
  _buildConnectionsMap() {
    const map = new Map();
    const edges = this.schema?.drawflow?.edges || [];

    edges.forEach((edge) => {
      if (!map.has(edge.source)) {
        map.set(edge.source, []);
      }
      map.get(edge.source).push({
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      });
    });

    return map;
  }

  /**
   * Get node by ID
   * @private
   */
  _getNodeById(nodeId) {
    return (this.schema?.drawflow?.nodes || []).find(
      (node) => node.id === nodeId
    );
  }

  /**
   * Get trigger node
   * @private
   */
  _getTriggerNode() {
    return (this.schema?.drawflow?.nodes || []).find(
      (node) => node.label === 'trigger' || node.type === 'trigger'
    );
  }

  /**
   * Get next nodes to execute
   * @private
   */
  _getNextNodes(currentNodeId, outputIndex = 1) {
    const connections = this.connectionsMap.get(currentNodeId) || [];
    const outputHandle = `${currentNodeId}-output-${outputIndex}`;

    return connections
      .filter(
        (conn) =>
          conn.sourceHandle === outputHandle ||
          !conn.sourceHandle.includes('-output-')
      )
      .map((conn) => this._getNodeById(conn.target))
      .filter(Boolean);
  }

  /**
   * Validate the workflow schema
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    return validateWorkflowSchema(this.schema);
  }

  /**
   * Run the workflow
   * @returns {Promise<Object>} Final execution state
   */
  async run() {
    const validation = this.validate();
    if (!validation.valid) {
      this._logError('Workflow validation failed:', validation.errors);
      return {
        success: false,
        state: this.state,
        errors: validation.errors,
      };
    }

    this.state.status = 'running';
    this._log('='.repeat(60));
    this._log(`Starting workflow: ${this.schema.metadata?.name || 'Unnamed'}`);
    this._log('='.repeat(60));

    const startTime = Date.now();

    try {
      // Find and execute trigger node
      const triggerNode = this._getTriggerNode();
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      await this._executeNode(triggerNode);

      this.state.status = 'completed';
      const duration = Date.now() - startTime;

      this._log('='.repeat(60));
      this._log(`Workflow completed in ${duration}ms`);
      this._log(`Total steps: ${this.state.history.length}`);
      this._log('='.repeat(60));

      if (this.options.onComplete) {
        this.options.onComplete(this.state);
      }

      return {
        success: true,
        state: this.state,
        duration,
      };
    } catch (error) {
      this.state.status = 'error';
      this._logError('Workflow execution failed:', error.message);

      if (this.options.onError) {
        this.options.onError(error, this.state);
      }

      return {
        success: false,
        state: this.state,
        error: error.message,
      };
    }
  }

  /**
   * Execute a single node
   * @private
   */
  async _executeNode(node) {
    if (!node) return;
    if (this.state.status !== 'running') return;

    // Check if node is disabled
    if (node.data?.disableBlock) {
      this._log(`[SKIP] Node ${node.id} (${node.label}) - disabled`);
      const nextNodes = this._getNextNodes(node.id);
      for (const nextNode of nextNodes) {
        await this._executeNode(nextNode);
      }
      return;
    }

    this.state.currentNodeId = node.id;

    // Emit step start event
    if (this.options.onStepStart) {
      this.options.onStepStart(node, this.state);
    }

    this._log('-'.repeat(40));
    this._log(`Executing: ${node.label} (${node.id})`);

    const action = getAction(node.type || node.label);
    if (!action) {
      this._log(`  [WARN] Unknown action type: ${node.type || node.label}`);
      // Continue to next node anyway
      const nextNodes = this._getNextNodes(node.id);
      for (const nextNode of nextNodes) {
        await this._executeNode(nextNode);
      }
      return;
    }

    // Build execution context
    const context = {
      executionId: `mock-${Date.now()}`,
      workerId: 'mock-worker',
      variables: this.state.variables,
      table: this.state.table,
      loopData: this.state.loopData,
      prevBlockData: this.state.prevBlockData,
      activeTab: {
        url: 'https://mock.example.com',
      },
    };

    // Execute through the bridge
    const result = await this.bridge.execute(
      node.type || node.label,
      node.data,
      context
    );

    // Record in history
    const historyEntry = {
      nodeId: node.id,
      nodeLabel: node.label,
      timestamp: new Date().toISOString(),
      result,
      data: node.data,
    };
    this.state.history.push(historyEntry);

    // Update state with result
    if (result.success) {
      this.state.prevBlockData = result.data;
      this._log(`  Result: ${JSON.stringify(result.data)}`);
    } else {
      this._log(`  Error: ${result.error}`);
    }

    // Emit step complete event
    if (this.options.onStepComplete) {
      this.options.onStepComplete(node, result, this.state);
    }

    // Handle special cases (loops, conditions)
    const nextOutputIndex = this._determineNextOutput(node, result);
    if (nextOutputIndex === null) {
      return; // End of branch
    }

    // Execute delay between steps
    if (this.options.stepDelay > 0) {
      await this._sleep(this.options.stepDelay);
    }

    // Execute next nodes
    const nextNodes = this._getNextNodes(node.id, nextOutputIndex);
    for (const nextNode of nextNodes) {
      await this._executeNode(nextNode);
    }
  }

  /**
   * Determine which output to follow based on result
   * @private
   */
  _determineNextOutput(node, result) {
    const nodeType = node.type || node.label;

    // Handle conditional nodes
    if (nodeType === 'conditions') {
      // In mock mode, always take first branch
      return 1;
    }

    // Handle element-exists (has true/false outputs)
    if (nodeType === 'element-exists') {
      return result.data?.exists ? 1 : 2;
    }

    // Handle loop-breakpoint
    if (nodeType === 'loop-breakpoint') {
      const loopId = node.data?.loopId || 'default';
      this.loopIterations[loopId] = (this.loopIterations[loopId] || 0) + 1;

      if (this.loopIterations[loopId] >= this.options.maxIterations) {
        this._log(`  [WARN] Loop ${loopId} reached max iterations`);
        return null;
      }
    }

    // Default: follow output 1
    return 1;
  }

  /**
   * Pause execution
   */
  pause() {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
      this._log('[PAUSED] Workflow execution paused');
    }
  }

  /**
   * Resume execution
   */
  resume() {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
      this._log('[RESUMED] Workflow execution resumed');
    }
  }

  /**
   * Stop execution
   */
  stop() {
    this.state.status = 'stopped';
    this._log('[STOPPED] Workflow execution stopped');
  }

  /**
   * Reset runner to initial state
   */
  reset() {
    this.state = this._createInitialState();
    this.loopIterations = {};
    this._log('[RESET] Runner reset to initial state');
  }

  /**
   * Get current execution state
   * @returns {ExecutionState}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get execution history
   * @returns {Array}
   */
  getHistory() {
    return [...this.state.history];
  }

  /**
   * Set a variable value
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   */
  setVariable(name, value) {
    this.state.variables[name] = value;
  }

  /**
   * Get a variable value
   * @param {string} name - Variable name
   * @returns {*}
   */
  getVariable(name) {
    return this.state.variables[name];
  }

  /**
   * Sleep helper
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Log message
   * @private
   */
  _log(...args) {
    if (this.options.logToConsole) {
      // eslint-disable-next-line no-console
      console.log('[MockRunner]', ...args);
    }
  }

  /**
   * Log error
   * @private
   */
  _logError(...args) {
    if (this.options.logToConsole) {
      // eslint-disable-next-line no-console
      console.error('[MockRunner]', ...args);
    }
  }
}

export default MockRunner;
