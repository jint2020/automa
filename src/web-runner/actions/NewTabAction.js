/**
 * New Tab Action - Example Implementation
 *
 * This file demonstrates the architectural difference between
 * Extension Mode and Web Mode for the "Open New Tab" action.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    EXTENSION MODE (Original)                    │
 * │  - Directly calls chrome.tabs.create()                          │
 * │  - Has full access to browser APIs                              │
 * │  - Executes synchronously in browser context                    │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      WEB MODE (New)                             │
 * │  - Generates a JSON instruction                                 │
 * │  - No direct browser API access                                 │
 * │  - Instruction sent to backend/agent for execution              │
 * └─────────────────────────────────────────────────────────────────┘
 */

// ============================================================================
// PART 1: EXTENSION MODE - How it works in the browser extension
// ============================================================================

/**
 * Extension Mode Implementation (simplified from original codebase)
 *
 * This is similar to src/workflowEngine/blocksHandler/handlerNewTab.js
 * It directly uses chrome/browser APIs to create tabs.
 */
export async function extensionModeNewTab(data, context) {
  // In the actual extension, this uses webextension-polyfill
  // import Browser from 'webextension-polyfill';

  // Validate URL
  if (!data.url || !isValidURL(data.url)) {
    throw new Error('Invalid URL');
  }

  // Direct browser API call - THIS IS WHAT WE CAN'T DO IN WEB MODE
  // const tab = await Browser.tabs.create({
  //   url: data.url,
  //   active: data.active ?? true,
  //   windowId: context.windowId,
  // });

  // Simulated result for demonstration
  const tab = {
    id: Math.floor(Math.random() * 10000),
    url: data.url,
    active: data.active ?? true,
    windowId: context?.windowId || 1,
  };

  // Handle additional options
  if (data.waitTabLoaded) {
    // await waitTabLoaded({ tabId: tab.id, ms: 30000 });
  }

  if (data.customUserAgent) {
    // await Browser.debugger.attach({ tabId: tab.id }, '1.3');
    // await sendDebugCommand(tab.id, 'Network.setUserAgentOverride', {
    //   userAgent: data.userAgent
    // });
  }

  return {
    data: data.url,
    tabId: tab.id,
    nextBlockId: context?.getNextBlocks?.() || null,
  };
}

// ============================================================================
// PART 2: WEB MODE - How it works in the web architecture
// ============================================================================

/**
 * Web Mode Data Model for New Tab Action
 *
 * Instead of executing, we define a data model that can be:
 * 1. Sent to a backend server
 * 2. Sent to a desktop agent (Electron, native app)
 * 3. Stored for later execution
 */
export const NewTabActionModel = {
  /**
   * Action type identifier
   */
  type: 'new-tab',

  /**
   * Action schema definition
   */
  schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['url'],
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'URL to open in new tab',
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Whether to make the tab active',
      },
      waitTabLoaded: {
        type: 'boolean',
        default: false,
        description: 'Wait for the tab to fully load',
      },
      updatePrevTab: {
        type: 'boolean',
        default: false,
        description: 'Update previous tab instead of creating new',
      },
      inGroup: {
        type: 'boolean',
        default: false,
        description: 'Add tab to current tab group',
      },
      tabZoom: {
        type: 'number',
        default: 1,
        minimum: 0.25,
        maximum: 5,
        description: 'Tab zoom level',
      },
      customUserAgent: {
        type: 'boolean',
        default: false,
        description: 'Use custom user agent',
      },
      userAgent: {
        type: 'string',
        description: 'Custom user agent string',
      },
    },
  },

  /**
   * Convert action data to a remote execution instruction
   */
  toInstruction(data, context = {}) {
    return {
      // Instruction metadata
      instructionId: generateInstructionId(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',

      // Action identification
      action: 'browser.tabs.create',
      actionType: 'new-tab',
      category: 'browser',

      // Execution parameters
      params: {
        url: data.url,
        active: data.active ?? true,
        waitTabLoaded: data.waitTabLoaded ?? false,
        updatePrevTab: data.updatePrevTab ?? false,
        inGroup: data.inGroup ?? false,
        tabZoom: data.tabZoom ?? 1,
        customUserAgent: data.customUserAgent ?? false,
        userAgent: data.userAgent ?? '',
      },

      // Execution context
      context: {
        executionId: context.executionId,
        workflowId: context.workflowId,
        nodeId: context.nodeId,
        prevBlockData: context.prevBlockData,
        variables: context.variables || {},
      },

      // Expected response format
      expectedResponse: {
        tabId: 'number',
        url: 'string',
        windowId: 'number',
      },
    };
  },

  /**
   * Validate action data
   */
  validate(data) {
    const errors = [];

    if (!data.url) {
      errors.push('URL is required');
    } else if (!isValidURL(data.url)) {
      errors.push('Invalid URL format');
    }

    if (data.customUserAgent && !data.userAgent) {
      errors.push('User agent string required when customUserAgent is true');
    }

    if (data.tabZoom !== undefined && (data.tabZoom < 0.25 || data.tabZoom > 5)) {
      errors.push('Tab zoom must be between 0.25 and 5');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Web Mode Implementation
 *
 * This function generates an instruction instead of executing directly.
 * The instruction can be sent to any executor (backend, desktop agent, etc.)
 */
export function webModeNewTab(data, context) {
  // Validate the data
  const validation = NewTabActionModel.validate(data);
  if (!validation.valid) {
    return {
      success: false,
      instruction: null,
      errors: validation.errors,
    };
  }

  // Generate the instruction (NOT execute)
  const instruction = NewTabActionModel.toInstruction(data, context);

  return {
    success: true,
    instruction,
    // The instruction can now be:
    // 1. Sent to backend: await fetch('/api/execute', { body: JSON.stringify(instruction) })
    // 2. Sent to desktop agent: window.electronAPI.execute(instruction)
    // 3. Stored for batch execution: instructionQueue.push(instruction)
    errors: [],
  };
}

// ============================================================================
// PART 3: COMPARISON EXAMPLE
// ============================================================================

/**
 * Example showing the difference between extension and web mode
 */
export function demonstrateComparison() {
  const actionData = {
    url: 'https://example.com',
    active: true,
    waitTabLoaded: true,
    customUserAgent: false,
  };

  const context = {
    executionId: 'exec-123',
    workflowId: 'workflow-456',
    nodeId: 'node-789',
    prevBlockData: null,
    variables: { searchQuery: 'test' },
  };

  console.log('='.repeat(60));
  console.log('NEW TAB ACTION COMPARISON');
  console.log('='.repeat(60));

  // Extension Mode
  console.log('\n📱 EXTENSION MODE:');
  console.log('   Action: Directly call browser.tabs.create()');
  console.log('   Code: await Browser.tabs.create({ url, active, windowId })');
  console.log('   Result: Browser tab is immediately created');

  // Web Mode
  console.log('\n🌐 WEB MODE:');
  const webResult = webModeNewTab(actionData, context);
  console.log('   Action: Generate instruction JSON');
  console.log('   Instruction:');
  console.log(JSON.stringify(webResult.instruction, null, 2));
  console.log('   Result: Instruction ready to send to executor');

  console.log('\n' + '='.repeat(60));
  console.log('KEY DIFFERENCE:');
  console.log('Extension Mode = Direct Execution');
  console.log('Web Mode = Instruction Generation');
  console.log('='.repeat(60));

  return webResult;
}

// ============================================================================
// UTILITIES
// ============================================================================

function isValidURL(urlString) {
  try {
    // eslint-disable-next-line no-new
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

function generateInstructionId() {
  return `instr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export default {
  extensionModeNewTab,
  webModeNewTab,
  NewTabActionModel,
  demonstrateComparison,
};
