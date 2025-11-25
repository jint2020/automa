/**
 * Mock Adapter - Simulation Implementation
 *
 * This adapter provides a mock execution environment for testing and
 * development. It simulates workflow execution by logging actions
 * to the console and producing mock results.
 *
 * Use cases:
 * 1. Frontend development without a backend
 * 2. Unit testing workflow logic
 * 3. Demonstrating workflow behavior
 * 4. Debugging workflow design
 */

import { BasePlatformAdapter } from '../ActionBridge';
import { getAction, getAllActionTypes } from '../../types/action-interface';

/**
 * Mock adapter for simulation and testing
 */
class MockAdapter extends BasePlatformAdapter {
  constructor(options = {}) {
    super('mock');
    this.options = options;
    this.executionLog = [];
    this.mockDelay = options.mockDelay ?? 100; // Simulated execution delay
    this.logToConsole = options.logToConsole ?? true;
    this.mockResponses = options.mockResponses || {};
  }

  /**
   * Mock execute an action
   * @param {string} actionType - Action type
   * @param {Object} data - Action data
   * @param {Object} context - Execution context
   * @returns {Promise<Object>}
   */
  async execute(actionType, data, context) {
    const action = getAction(actionType);
    if (!action) {
      return {
        success: false,
        data: null,
        error: `Unknown action type: ${actionType}`,
      };
    }

    const startTime = Date.now();
    const instruction = action.toInstruction(data, context);

    // Log execution
    this._logExecution(actionType, data, context, instruction);

    // Simulate execution delay
    if (this.mockDelay > 0) {
      await this._sleep(this.mockDelay);
    }

    // Generate mock result
    const mockResult = this._getMockResult(actionType, data, context);

    const logEntry = {
      timestamp: new Date().toISOString(),
      actionType,
      data,
      instruction,
      result: mockResult,
      duration: Date.now() - startTime,
    };

    this.executionLog.push(logEntry);

    return {
      success: true,
      data: mockResult,
      instruction,
      mock: true,
    };
  }

  /**
   * Generate mock result based on action type
   * @private
   */
  _getMockResult(actionType, data, context) {
    // Check for custom mock response
    if (this.mockResponses[actionType]) {
      return typeof this.mockResponses[actionType] === 'function'
        ? this.mockResponses[actionType](data, context)
        : this.mockResponses[actionType];
    }

    // Default mock results for each action type
    switch (actionType) {
      case 'trigger':
        return { triggered: true, type: data.type || 'manual' };

      case 'new-tab':
        return {
          tabId: Math.floor(Math.random() * 10000),
          url: data.url,
          windowId: 1,
        };

      case 'close-tab':
        return { closed: true };

      case 'switch-tab':
        return {
          tabId: Math.floor(Math.random() * 10000),
          url: data.url || 'https://example.com',
        };

      case 'event-click':
        return { clicked: true, selector: data.selector };

      case 'forms':
        if (data.getValue) {
          return { value: 'mock-form-value' };
        }
        return { filled: true, selector: data.selector, value: data.value };

      case 'get-text':
        return data.multiple
          ? ['Mock text 1', 'Mock text 2', 'Mock text 3']
          : 'Mock extracted text';

      case 'delay':
        return { delayed: data.time || 500 };

      case 'insert-data':
        return { inserted: data.dataList?.length || 0 };

      case 'export-data':
        return {
          exported: true,
          format: data.type,
          filename: data.name || 'export',
        };

      case 'conditions':
        return { matched: true, branchIndex: 0 };

      case 'loop-data':
        return {
          loopId: data.loopId,
          iterating: true,
          currentIndex: 0,
          totalItems: 5,
        };

      default:
        return { executed: true, actionType };
    }
  }

  /**
   * Log execution details
   * @private
   */
  _logExecution(actionType, data, context, instruction) {
    if (!this.logToConsole) return;

    const styles = {
      action: 'color: #2563eb; font-weight: bold;',
      data: 'color: #059669;',
      instruction: 'color: #7c3aed;',
    };

    console.group(`%c[Mock Runner] ${actionType}`, styles.action);
    console.log('%cData:', styles.data, data);
    console.log('%cContext:', styles.data, context);
    console.log('%cInstruction:', styles.instruction, instruction);
    console.groupEnd();
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
   * Get execution log
   * @param {number} [limit] - Max entries to return
   * @returns {Array}
   */
  getExecutionLog(limit) {
    if (limit) {
      return this.executionLog.slice(-limit);
    }
    return [...this.executionLog];
  }

  /**
   * Clear execution log
   */
  clearLog() {
    this.executionLog = [];
  }

  /**
   * Set custom mock response for an action
   * @param {string} actionType - Action type
   * @param {*|Function} response - Mock response or generator function
   */
  setMockResponse(actionType, response) {
    this.mockResponses[actionType] = response;
  }

  /**
   * Enable/disable console logging
   * @param {boolean} enabled
   */
  setLogToConsole(enabled) {
    this.logToConsole = enabled;
  }

  /**
   * Set simulated execution delay
   * @param {number} delay - Delay in milliseconds
   */
  setMockDelay(delay) {
    this.mockDelay = delay;
  }

  /**
   * Get platform capabilities
   */
  getCapabilities() {
    return {
      platform: 'mock',
      canExecuteDirectly: false,
      canGenerateInstructions: true,
      supportedActions: getAllActionTypes(),
      features: {
        simulation: true,
        logging: true,
        customResponses: true,
        delaySimulation: true,
      },
    };
  }
}

export default MockAdapter;
