/**
 * Action Bridge - Abstraction Layer for Cross-Platform Execution
 *
 * The Bridge is the core abstraction that separates the "UI Orchestration Layer"
 * from the "Execution Logic Layer". It provides a unified interface for
 * executing actions regardless of the underlying platform.
 *
 * In Extension Mode: Actions directly call chrome.* APIs
 * In Web Mode: Actions generate JSON instructions for remote execution
 *
 * Usage:
 *   const bridge = ActionBridge.create('web'); // or 'extension'
 *   const result = await bridge.execute('new-tab', { url: 'https://...' }, context);
 */

import { getAction, isValidActionType } from '../types/action-interface';

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} success - Whether the action succeeded
 * @property {*} data - Action output data
 * @property {string} [error] - Error message if failed
 * @property {Object} [instruction] - Generated instruction (web mode)
 * @property {Object} metadata - Execution metadata
 * @property {number} metadata.duration - Execution duration in ms
 * @property {string} metadata.timestamp - ISO timestamp
 * @property {string} metadata.platform - Execution platform
 */

/**
 * @typedef {'extension' | 'web' | 'mock'} PlatformType
 */

/**
 * Abstract base class for platform adapters
 */
class BasePlatformAdapter {
  constructor(platform) {
    this.platform = platform;
  }

  /**
   * Execute an action on this platform
   * @param {string} actionType - The action type to execute
   * @param {Object} data - Action data/parameters
   * @param {Object} context - Execution context
   * @returns {Promise<ExecutionResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async execute(actionType, data, context) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Check if this adapter can execute a specific action
   * @param {string} actionType - The action type to check
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  canExecute(actionType) {
    return isValidActionType(actionType);
  }

  /**
   * Get platform capabilities
   * @returns {Object}
   */
  getCapabilities() {
    return {
      platform: this.platform,
      canExecuteDirectly: false,
      canGenerateInstructions: false,
      supportedActions: [],
    };
  }
}

/**
 * ActionBridge - Main entry point for cross-platform action execution
 *
 * This class implements the Bridge pattern to decouple workflow orchestration
 * from actual execution. It delegates to platform-specific adapters.
 */
class ActionBridge {
  /**
   * @param {BasePlatformAdapter} adapter - Platform adapter to use
   */
  constructor(adapter) {
    this.adapter = adapter;
    this.eventListeners = {};
    this.executionHistory = [];
    this.maxHistoryLength = 1000;
  }

  /**
   * Factory method to create a bridge for a specific platform
   * @param {PlatformType} platform - Target platform
   * @param {Object} [options] - Platform-specific options
   * @returns {ActionBridge}
   */
  static create(platform, options = {}) {
    let adapter;

    switch (platform) {
      case 'extension':
        // Dynamic import to avoid bundling extension-specific code in web builds
        // eslint-disable-next-line global-require
        adapter = new (require('./adapters/ExtensionAdapter').default)(options);
        break;
      case 'web':
        // eslint-disable-next-line global-require
        adapter = new (require('./adapters/WebAdapter').default)(options);
        break;
      case 'mock':
        // eslint-disable-next-line global-require
        adapter = new (require('./adapters/MockAdapter').default)(options);
        break;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    return new ActionBridge(adapter);
  }

  /**
   * Execute an action through the bridge
   * @param {string} actionType - Action type to execute
   * @param {Object} data - Action data/parameters
   * @param {Object} context - Execution context
   * @returns {Promise<ExecutionResult>}
   */
  async execute(actionType, data, context) {
    const startTime = Date.now();
    const action = getAction(actionType);

    if (!action) {
      return this._createErrorResult(
        `Unknown action type: ${actionType}`,
        startTime
      );
    }

    // Validate action data
    const validation = action.validate(data);
    if (!validation.valid) {
      return this._createErrorResult(
        `Validation failed: ${validation.errors.join(', ')}`,
        startTime
      );
    }

    // Check if adapter can execute this action
    if (!this.adapter.canExecute(actionType)) {
      return this._createErrorResult(
        `Platform "${this.adapter.platform}" cannot execute action "${actionType}"`,
        startTime
      );
    }

    try {
      // Emit pre-execute event
      this._emit('beforeExecute', { actionType, data, context });

      // Execute through adapter
      const result = await this.adapter.execute(actionType, data, context);

      // Add metadata
      result.metadata = {
        ...result.metadata,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        platform: this.adapter.platform,
        actionType,
      };

      // Record in history
      this._recordHistory(actionType, data, result);

      // Emit post-execute event
      this._emit('afterExecute', { actionType, data, context, result });

      return result;
    } catch (error) {
      const errorResult = this._createErrorResult(error.message, startTime);
      errorResult.metadata.actionType = actionType;

      this._emit('executeError', { actionType, data, context, error });
      this._recordHistory(actionType, data, errorResult);

      return errorResult;
    }
  }

  /**
   * Execute multiple actions in sequence
   * @param {Array<{type: string, data: Object}>} actions - Actions to execute
   * @param {Object} context - Shared execution context
   * @returns {Promise<ExecutionResult[]>}
   */
  async executeSequence(actions, context) {
    const results = [];
    let currentContext = { ...context };

    for (const action of actions) {
      const result = await this.execute(
        action.type,
        action.data,
        currentContext
      );
      results.push(result);

      if (!result.success) {
        // Stop sequence on error (can be made configurable)
        break;
      }

      // Update context with result for next action
      currentContext = {
        ...currentContext,
        prevBlockData: result.data,
      };
    }

    return results;
  }

  /**
   * Convert an action to a remote instruction without executing
   * @param {string} actionType - Action type
   * @param {Object} data - Action data
   * @param {Object} context - Execution context
   * @returns {Object|null} The instruction or null if action not found
   */
  toInstruction(actionType, data, context) {
    const action = getAction(actionType);
    if (!action) return null;

    return action.toInstruction(data, context);
  }

  /**
   * Get the current platform
   * @returns {string}
   */
  getPlatform() {
    return this.adapter.platform;
  }

  /**
   * Get platform capabilities
   * @returns {Object}
   */
  getCapabilities() {
    return this.adapter.getCapabilities();
  }

  /**
   * Get execution history
   * @param {number} [limit] - Max number of entries to return
   * @returns {Array}
   */
  getHistory(limit) {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Subscribe to bridge events
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Emit an event
   * @private
   */
  _emit(event, payload) {
    const listeners = this.eventListeners[event] || [];
    listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in bridge event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Create an error result
   * @private
   */
  _createErrorResult(message, startTime) {
    return {
      success: false,
      data: null,
      error: message,
      metadata: {
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        platform: this.adapter?.platform || 'unknown',
      },
    };
  }

  /**
   * Record execution in history
   * @private
   */
  _recordHistory(actionType, data, result) {
    this.executionHistory.push({
      actionType,
      data,
      result,
      timestamp: new Date().toISOString(),
    });

    // Trim history if too long
    if (this.executionHistory.length > this.maxHistoryLength) {
      this.executionHistory = this.executionHistory.slice(
        -this.maxHistoryLength
      );
    }
  }
}

export { ActionBridge, BasePlatformAdapter };
export default ActionBridge;
