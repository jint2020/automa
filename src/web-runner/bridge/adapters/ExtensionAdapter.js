/**
 * Extension Adapter - Chrome Extension Implementation
 *
 * This adapter provides direct execution of actions using chrome.* APIs.
 * It is used when the workflow runs inside the browser extension context.
 *
 * Note: This adapter directly calls browser APIs and is only available
 * in the extension environment.
 */

import { BasePlatformAdapter } from '../ActionBridge';
import { getAction, getAllActionTypes } from '../../types/action-interface';

/**
 * Extension adapter for direct browser API execution
 */
class ExtensionAdapter extends BasePlatformAdapter {
  constructor(options = {}) {
    super('extension');
    this.options = options;
    this.browserAPI = options.browserAPI || null;
  }

  /**
   * Execute an action using browser APIs
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

    // For extension mode, we would call the actual browser handlers
    // This is a simplified implementation showing the pattern
    try {
      const result = await this._executeAction(actionType, data, context);
      return {
        success: true,
        data: result,
        instruction: action.toInstruction(data, context),
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Execute action using browser APIs
   * In a real implementation, this would map to the existing blocksHandler
   * @private
   */
  async _executeAction(actionType, data, context) {
    // This is a placeholder that shows how extension execution would work
    // In the actual implementation, this would integrate with the existing
    // blocksHandler functions in src/workflowEngine/blocksHandler/

    switch (actionType) {
      case 'new-tab':
        return this._executeNewTab(data, context);
      case 'close-tab':
        return this._executeCloseTab(data, context);
      case 'delay':
        return this._executeDelay(data);
      default:
        // For other actions, return the instruction as data
        // The actual execution would be handled by the workflow engine
        return { actionType, data, context };
    }
  }

  /**
   * Execute new tab action
   * @private
   */
  async _executeNewTab(data) {
    // In real implementation:
    // const tab = await browser.tabs.create({
    //   url: data.url,
    //   active: data.active,
    // });
    // return { tabId: tab.id, url: data.url };

    // Placeholder for extension-less environments
    return {
      url: data.url,
      message: 'New tab would be created in extension mode',
    };
  }

  /**
   * Execute close tab action
   * @private
   */
  async _executeCloseTab(data) {
    // In real implementation:
    // await browser.tabs.remove(context.activeTab.id);

    return {
      closed: true,
      message: 'Tab would be closed in extension mode',
      data,
    };
  }

  /**
   * Execute delay action
   * @private
   */
  async _executeDelay(data) {
    await new Promise((resolve) => {
      setTimeout(resolve, data.time || 500);
    });
    return { delayed: data.time || 500 };
  }

  /**
   * Get platform capabilities
   */
  getCapabilities() {
    return {
      platform: 'extension',
      canExecuteDirectly: true,
      canGenerateInstructions: true,
      supportedActions: getAllActionTypes(),
      features: {
        tabManagement: true,
        domInteraction: true,
        fileDownload: true,
        notifications: true,
        debugger: true,
        proxy: true,
      },
    };
  }
}

export default ExtensionAdapter;
