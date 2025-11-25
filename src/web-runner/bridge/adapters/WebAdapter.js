/**
 * Web Adapter - Web Platform Implementation
 *
 * This adapter generates JSON instructions instead of executing actions directly.
 * It is used when the workflow editor runs as a regular web application
 * without access to chrome.* APIs.
 *
 * In this mode, the frontend becomes an "Instruction Generator" that produces
 * a standardized JSON structure. These instructions can be:
 * 1. Sent to a backend server for execution
 * 2. Sent to a desktop agent (Electron app, native app, etc.)
 * 3. Stored for later execution
 * 4. Used for workflow validation/preview
 */

import { BasePlatformAdapter } from '../ActionBridge';
import { getAction, getAllActionTypes } from '../../types/action-interface';

/**
 * @typedef {Object} RemoteInstruction
 * @property {string} action - Action type
 * @property {Object} params - Action parameters
 * @property {Object} context - Execution context
 * @property {string} instructionId - Unique instruction ID
 * @property {string} timestamp - ISO timestamp
 */

/**
 * Web adapter for instruction generation
 */
class WebAdapter extends BasePlatformAdapter {
  constructor(options = {}) {
    super('web');
    this.options = options;
    this.instructionQueue = [];
    this.instructionCallbacks = {};
    this.remoteEndpoint = options.remoteEndpoint || null;
    this.batchMode = options.batchMode || false;
  }

  /**
   * "Execute" an action by generating a remote instruction
   * In Web mode, actions don't execute directly - they generate instructions
   *
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

    // Generate the instruction
    const instruction = this._generateInstruction(actionType, data, context);

    // If batch mode, queue the instruction
    if (this.batchMode) {
      this.instructionQueue.push(instruction);
      return {
        success: true,
        data: { queued: true, instruction },
        instruction,
      };
    }

    // If remote endpoint configured, send immediately
    if (this.remoteEndpoint) {
      try {
        const result = await this._sendInstruction(instruction);
        return {
          success: true,
          data: result,
          instruction,
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error.message,
          instruction,
        };
      }
    }

    // Otherwise, just return the instruction (for preview/mock mode)
    return {
      success: true,
      data: instruction,
      instruction,
    };
  }

  /**
   * Generate a standardized remote instruction
   * @private
   */
  _generateInstruction(actionType, data, context) {
    const action = getAction(actionType);
    const baseInstruction = action.toInstruction(data, context);

    return {
      ...baseInstruction,
      instructionId: this._generateInstructionId(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Generate unique instruction ID
   * @private
   */
  _generateInstructionId() {
    return `instr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Send instruction to remote endpoint
   * @private
   */
  async _sendInstruction(instruction) {
    if (!this.remoteEndpoint) {
      throw new Error('No remote endpoint configured');
    }

    const response = await fetch(this.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instruction),
    });

    if (!response.ok) {
      throw new Error(`Remote execution failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all queued instructions (batch mode)
   * @returns {RemoteInstruction[]}
   */
  getQueuedInstructions() {
    return [...this.instructionQueue];
  }

  /**
   * Clear instruction queue
   */
  clearQueue() {
    this.instructionQueue = [];
  }

  /**
   * Flush queued instructions to remote endpoint
   * @returns {Promise<Object[]>}
   */
  async flushQueue() {
    if (!this.remoteEndpoint) {
      const instructions = [...this.instructionQueue];
      this.instructionQueue = [];
      return instructions;
    }

    const results = [];
    for (const instruction of this.instructionQueue) {
      try {
        const result = await this._sendInstruction(instruction);
        results.push({ success: true, result, instruction });
      } catch (error) {
        results.push({ success: false, error: error.message, instruction });
      }
    }

    this.instructionQueue = [];
    return results;
  }

  /**
   * Set the remote execution endpoint
   * @param {string} endpoint - Remote endpoint URL
   */
  setRemoteEndpoint(endpoint) {
    this.remoteEndpoint = endpoint;
  }

  /**
   * Enable/disable batch mode
   * @param {boolean} enabled
   */
  setBatchMode(enabled) {
    this.batchMode = enabled;
  }

  /**
   * Get platform capabilities
   */
  getCapabilities() {
    return {
      platform: 'web',
      canExecuteDirectly: false,
      canGenerateInstructions: true,
      supportedActions: getAllActionTypes(),
      features: {
        remoteExecution: !!this.remoteEndpoint,
        batchMode: this.batchMode,
        instructionGeneration: true,
        validation: true,
      },
    };
  }
}

export default WebAdapter;
