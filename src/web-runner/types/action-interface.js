/**
 * Action Interface Definitions for Web Architecture
 *
 * This module defines the abstract interfaces for all workflow actions.
 * Each action type has a corresponding interface that defines:
 * 1. The input data structure (what the action needs to execute)
 * 2. The output data structure (what the action produces)
 * 3. The execution context requirements
 *
 * In the Extension mode, these actions directly call chrome.* APIs.
 * In the Web mode, these actions generate JSON instructions for remote execution.
 */

/**
 * Base action result that all actions return
 * @typedef {Object} ActionResult
 * @property {boolean} success - Whether the action succeeded
 * @property {*} data - Output data from the action
 * @property {string} [error] - Error message if failed
 * @property {Object} [metadata] - Additional execution metadata
 * @property {number} metadata.duration - Execution duration in ms
 * @property {string} metadata.timestamp - ISO 8601 timestamp
 */

/**
 * Action execution context
 * @typedef {Object} ActionContext
 * @property {string} executionId - Current execution ID
 * @property {string} workerId - Current worker ID
 * @property {Object} variables - Current variables state
 * @property {Array} table - Current data table
 * @property {Object} loopData - Current loop data
 * @property {*} prevBlockData - Previous block output
 * @property {Object} activeTab - Active tab information
 * @property {number} [activeTab.id] - Tab ID (extension mode)
 * @property {string} [activeTab.url] - Tab URL
 */

/**
 * Base interface for all actions
 * @typedef {Object} ActionInterface
 * @property {string} type - Action type identifier
 * @property {string} name - Human-readable action name
 * @property {string} category - Action category
 * @property {Function} execute - Execute the action
 * @property {Function} validate - Validate action data
 * @property {Function} toInstruction - Convert to remote instruction
 */

// ============================================================================
// Browser Actions
// ============================================================================

/**
 * New Tab Action - Opens a new browser tab
 *
 * Extension Mode: Calls chrome.tabs.create() directly
 * Web Mode: Generates instruction for remote execution
 *
 * @typedef {Object} NewTabActionData
 * @property {string} url - URL to open
 * @property {boolean} [active=true] - Whether to make tab active
 * @property {boolean} [waitTabLoaded=false] - Wait for tab to fully load
 * @property {boolean} [updatePrevTab=false] - Update previous tab instead of creating new
 * @property {boolean} [inGroup=false] - Add tab to current group
 * @property {number} [tabZoom=1] - Tab zoom level
 * @property {boolean} [customUserAgent=false] - Use custom user agent
 * @property {string} [userAgent] - Custom user agent string
 */

/**
 * @typedef {Object} NewTabActionResult
 * @property {string} tabUrl - The opened URL
 * @property {number} [tabId] - Tab ID (extension mode only)
 * @property {number} [windowId] - Window ID (extension mode only)
 */

export const NewTabAction = {
  type: 'new-tab',
  name: 'New Tab',
  category: 'browser',

  /**
   * Default data for new tab action
   */
  defaultData: {
    url: '',
    active: true,
    waitTabLoaded: false,
    updatePrevTab: false,
    inGroup: false,
    tabZoom: 1,
    customUserAgent: false,
    userAgent: '',
  },

  /**
   * Validates the action data
   * @param {NewTabActionData} data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(data) {
    const errors = [];
    if (!data.url || data.url.trim() === '') {
      errors.push('URL is required');
    } else {
      try {
        // eslint-disable-next-line no-new
        new URL(data.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  /**
   * Converts to a remote execution instruction
   * @param {NewTabActionData} data
   * @param {ActionContext} context
   * @returns {Object}
   */
  toInstruction(data, context) {
    return {
      action: 'new-tab',
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
      context: {
        executionId: context.executionId,
        prevBlockData: context.prevBlockData,
      },
    };
  },
};

/**
 * Close Tab Action
 * @typedef {Object} CloseTabActionData
 * @property {boolean} [activeTab=true] - Close active tab
 * @property {string} [closeType='tab'] - 'tab' or 'window'
 * @property {string} [url] - Close tab matching this URL pattern
 * @property {boolean} [allWindows=false] - Close in all windows
 */

export const CloseTabAction = {
  type: 'close-tab',
  name: 'Close Tab',
  category: 'browser',

  defaultData: {
    activeTab: true,
    closeType: 'tab',
    url: '',
    allWindows: false,
  },

  validate(data) {
    const errors = [];
    if (!data.activeTab && !data.url) {
      errors.push('Either activeTab must be true or URL must be provided');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'close-tab',
      params: {
        activeTab: data.activeTab ?? true,
        closeType: data.closeType ?? 'tab',
        url: data.url ?? '',
        allWindows: data.allWindows ?? false,
      },
      context: {
        executionId: context.executionId,
      },
    };
  },
};

/**
 * Switch Tab Action
 * @typedef {Object} SwitchTabActionData
 * @property {string} findTabBy - 'match-patterns' | 'tab-index' | 'tab-title'
 * @property {string} [matchPattern] - URL match pattern
 * @property {number} [tabIndex] - Tab index to switch to
 * @property {string} [tabTitle] - Tab title to match
 * @property {boolean} [createIfNoMatch=false] - Create new tab if no match
 */

export const SwitchTabAction = {
  type: 'switch-tab',
  name: 'Switch Tab',
  category: 'browser',

  defaultData: {
    findTabBy: 'match-patterns',
    matchPattern: '',
    tabIndex: 0,
    tabTitle: '',
    url: '',
    activeTab: true,
    createIfNoMatch: false,
  },

  validate(data) {
    const errors = [];
    if (data.findTabBy === 'match-patterns' && !data.matchPattern) {
      errors.push('Match pattern is required');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'switch-tab',
      params: {
        findTabBy: data.findTabBy,
        matchPattern: data.matchPattern ?? '',
        tabIndex: data.tabIndex ?? 0,
        tabTitle: data.tabTitle ?? '',
        url: data.url ?? '',
        activeTab: data.activeTab ?? true,
        createIfNoMatch: data.createIfNoMatch ?? false,
      },
      context: {
        executionId: context.executionId,
      },
    };
  },
};

// ============================================================================
// Interaction Actions
// ============================================================================

/**
 * Click Element Action
 * @typedef {Object} ClickElementActionData
 * @property {string} selector - CSS selector or XPath
 * @property {string} [findBy='cssSelector'] - 'cssSelector' or 'xpath'
 * @property {boolean} [waitForSelector=false] - Wait for element
 * @property {number} [waitSelectorTimeout=5000] - Wait timeout in ms
 * @property {boolean} [multiple=false] - Click all matching elements
 * @property {boolean} [markEl=false] - Highlight element
 */

export const ClickElementAction = {
  type: 'event-click',
  name: 'Click Element',
  category: 'interaction',

  defaultData: {
    selector: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    multiple: false,
    markEl: false,
  },

  validate(data) {
    const errors = [];
    if (!data.selector || data.selector.trim() === '') {
      errors.push('Selector is required');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'event-click',
      params: {
        selector: data.selector,
        findBy: data.findBy ?? 'cssSelector',
        waitForSelector: data.waitForSelector ?? false,
        waitSelectorTimeout: data.waitSelectorTimeout ?? 5000,
        multiple: data.multiple ?? false,
        markEl: data.markEl ?? false,
      },
      context: {
        executionId: context.executionId,
        activeTabUrl: context.activeTab?.url,
      },
    };
  },
};

/**
 * Form Input Action
 * @typedef {Object} FormsActionData
 * @property {string} selector - Form element selector
 * @property {string} type - 'text-field' | 'select' | 'checkbox' | 'radio'
 * @property {string} value - Value to input
 * @property {boolean} [clearValue=true] - Clear existing value first
 * @property {number} [delay=0] - Typing delay in ms
 */

export const FormsAction = {
  type: 'forms',
  name: 'Forms',
  category: 'interaction',

  defaultData: {
    selector: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    type: 'text-field',
    value: '',
    clearValue: true,
    getValue: false,
    delay: 0,
    multiple: false,
    markEl: false,
  },

  validate(data) {
    const errors = [];
    if (!data.selector || data.selector.trim() === '') {
      errors.push('Selector is required');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'forms',
      params: {
        selector: data.selector,
        findBy: data.findBy ?? 'cssSelector',
        waitForSelector: data.waitForSelector ?? false,
        waitSelectorTimeout: data.waitSelectorTimeout ?? 5000,
        type: data.type ?? 'text-field',
        value: data.value ?? '',
        clearValue: data.clearValue ?? true,
        getValue: data.getValue ?? false,
        delay: data.delay ?? 0,
        multiple: data.multiple ?? false,
        markEl: data.markEl ?? false,
      },
      context: {
        executionId: context.executionId,
        activeTabUrl: context.activeTab?.url,
      },
    };
  },
};

/**
 * Get Text Action
 * @typedef {Object} GetTextActionData
 * @property {string} selector - Element selector
 * @property {boolean} [multiple=false] - Get text from all matching elements
 * @property {boolean} [saveData=true] - Save to data table
 * @property {string} [dataColumn] - Column to save data
 * @property {boolean} [assignVariable=false] - Assign to variable
 * @property {string} [variableName] - Variable name
 */

export const GetTextAction = {
  type: 'get-text',
  name: 'Get Text',
  category: 'interaction',

  defaultData: {
    selector: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    multiple: false,
    markEl: false,
    regex: '',
    prefixText: '',
    suffixText: '',
    regexExp: [],
    dataColumn: '',
    saveData: true,
    includeTags: false,
    addExtraRow: false,
    assignVariable: false,
    useTextContent: false,
    variableName: '',
    extraRowValue: '',
    extraRowDataColumn: '',
  },

  validate(data) {
    const errors = [];
    if (!data.selector || data.selector.trim() === '') {
      errors.push('Selector is required');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'get-text',
      params: {
        selector: data.selector,
        findBy: data.findBy ?? 'cssSelector',
        waitForSelector: data.waitForSelector ?? false,
        waitSelectorTimeout: data.waitSelectorTimeout ?? 5000,
        multiple: data.multiple ?? false,
        saveData: data.saveData ?? true,
        dataColumn: data.dataColumn ?? '',
        assignVariable: data.assignVariable ?? false,
        variableName: data.variableName ?? '',
        regex: data.regex ?? '',
        prefixText: data.prefixText ?? '',
        suffixText: data.suffixText ?? '',
      },
      context: {
        executionId: context.executionId,
        activeTabUrl: context.activeTab?.url,
      },
    };
  },
};

// ============================================================================
// General Actions
// ============================================================================

/**
 * Delay Action
 * @typedef {Object} DelayActionData
 * @property {number} time - Delay time in milliseconds
 */

export const DelayAction = {
  type: 'delay',
  name: 'Delay',
  category: 'general',

  defaultData: {
    time: 500,
  },

  validate(data) {
    const errors = [];
    if (typeof data.time !== 'number' || data.time < 0) {
      errors.push('Time must be a non-negative number');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'delay',
      params: {
        time: data.time ?? 500,
      },
      context: {
        executionId: context.executionId,
      },
    };
  },
};

/**
 * Trigger Action (Start of workflow)
 * @typedef {Object} TriggerActionData
 * @property {string} type - 'manual' | 'interval' | 'specific-day' | 'on-startup' | etc.
 * @property {number} [interval] - Interval in minutes (for interval trigger)
 * @property {string} [url] - URL pattern trigger
 * @property {Array} [parameters] - Workflow parameters
 */

export const TriggerAction = {
  type: 'trigger',
  name: 'Trigger',
  category: 'general',

  defaultData: {
    type: 'manual',
    interval: 60,
    delay: 5,
    date: '',
    time: '00:00',
    url: '',
    shortcut: '',
    activeInInput: false,
    isUrlRegex: false,
    days: [],
    contextMenuName: '',
    contextTypes: [],
    parameters: [],
    preferParamsInTab: false,
  },

  validate() {
    // Trigger is always valid
    return { valid: true, errors: [] };
  },

  toInstruction(data, context) {
    return {
      action: 'trigger',
      params: {
        type: data.type ?? 'manual',
        parameters: data.parameters ?? [],
      },
      context: {
        executionId: context.executionId,
      },
    };
  },
};

// ============================================================================
// Data Actions
// ============================================================================

/**
 * Insert Data Action
 * @typedef {Object} InsertDataActionData
 * @property {Array<{type: string, name: string, value: string}>} dataList
 */

export const InsertDataAction = {
  type: 'insert-data',
  name: 'Insert Data',
  category: 'data',

  defaultData: {
    dataList: [],
  },

  validate(data) {
    const errors = [];
    if (!Array.isArray(data.dataList)) {
      errors.push('dataList must be an array');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'insert-data',
      params: {
        dataList: data.dataList ?? [],
      },
      context: {
        executionId: context.executionId,
        variables: context.variables,
      },
    };
  },
};

/**
 * Export Data Action
 * @typedef {Object} ExportDataActionData
 * @property {string} type - 'json' | 'csv' | 'plain-text'
 * @property {string} dataToExport - 'data-columns' | 'variable' | 'google-sheets'
 * @property {string} name - Export file name
 */

export const ExportDataAction = {
  type: 'export-data',
  name: 'Export Data',
  category: 'general',

  defaultData: {
    name: '',
    refKey: '',
    type: 'json',
    variableName: '',
    csvDelimiter: ',',
    addBOMHeader: true,
    onConflict: 'uniquify',
    dataToExport: 'data-columns',
  },

  validate(data) {
    const errors = [];
    if (data.dataToExport === 'variable' && !data.variableName) {
      errors.push('Variable name is required when exporting variable');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'export-data',
      params: {
        name: data.name ?? '',
        type: data.type ?? 'json',
        dataToExport: data.dataToExport ?? 'data-columns',
        variableName: data.variableName ?? '',
        csvDelimiter: data.csvDelimiter ?? ',',
      },
      context: {
        executionId: context.executionId,
        table: context.table,
        variables: context.variables,
      },
    };
  },
};

// ============================================================================
// Control Flow Actions
// ============================================================================

/**
 * Conditions Action
 * @typedef {Object} ConditionsActionData
 * @property {Array} conditions - Array of condition rules
 */

export const ConditionsAction = {
  type: 'conditions',
  name: 'Conditions',
  category: 'conditions',

  defaultData: {
    conditions: [],
    retryConditions: false,
    retryCount: 10,
    retryTimeout: 1000,
  },

  validate(data) {
    const errors = [];
    if (!Array.isArray(data.conditions)) {
      errors.push('conditions must be an array');
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'conditions',
      params: {
        conditions: data.conditions ?? [],
        retryConditions: data.retryConditions ?? false,
        retryCount: data.retryCount ?? 10,
        retryTimeout: data.retryTimeout ?? 1000,
      },
      context: {
        executionId: context.executionId,
        variables: context.variables,
        prevBlockData: context.prevBlockData,
      },
    };
  },
};

/**
 * Loop Data Action
 * @typedef {Object} LoopDataActionData
 * @property {string} loopThrough - 'data-columns' | 'numbers' | 'custom-data' | etc.
 * @property {string} loopData - JSON array for custom data
 * @property {number} maxLoop - Maximum iterations (0 = unlimited)
 */

export const LoopDataAction = {
  type: 'loop-data',
  name: 'Loop Data',
  category: 'conditions',

  defaultData: {
    loopId: '',
    maxLoop: 0,
    toNumber: 10,
    fromNumber: 1,
    startIndex: 0,
    loopData: '[]',
    variableName: '',
    referenceKey: '',
    reverseLoop: false,
    elementSelector: '',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    resumeLastWorkflow: false,
    loopThrough: 'data-columns',
  },

  validate(data) {
    const errors = [];
    if (data.loopThrough === 'custom-data') {
      try {
        JSON.parse(data.loopData || '[]');
      } catch {
        errors.push('Invalid JSON in loopData');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  toInstruction(data, context) {
    return {
      action: 'loop-data',
      params: {
        loopId: data.loopId ?? '',
        loopThrough: data.loopThrough ?? 'data-columns',
        loopData: data.loopData ?? '[]',
        maxLoop: data.maxLoop ?? 0,
        startIndex: data.startIndex ?? 0,
        fromNumber: data.fromNumber ?? 1,
        toNumber: data.toNumber ?? 10,
        variableName: data.variableName ?? '',
        reverseLoop: data.reverseLoop ?? false,
      },
      context: {
        executionId: context.executionId,
        table: context.table,
        variables: context.variables,
      },
    };
  },
};

// ============================================================================
// Action Registry
// ============================================================================

/**
 * Registry of all available actions
 */
export const ActionRegistry = {
  // Browser actions
  'new-tab': NewTabAction,
  'close-tab': CloseTabAction,
  'switch-tab': SwitchTabAction,

  // Interaction actions
  'event-click': ClickElementAction,
  forms: FormsAction,
  'get-text': GetTextAction,

  // General actions
  trigger: TriggerAction,
  delay: DelayAction,

  // Data actions
  'insert-data': InsertDataAction,
  'export-data': ExportDataAction,

  // Control flow actions
  conditions: ConditionsAction,
  'loop-data': LoopDataAction,
};

/**
 * Get action definition by type
 * @param {string} type - Action type
 * @returns {ActionInterface|undefined}
 */
export function getAction(type) {
  return ActionRegistry[type];
}

/**
 * Get all action types
 * @returns {string[]}
 */
export function getAllActionTypes() {
  return Object.keys(ActionRegistry);
}

/**
 * Check if action type is valid
 * @param {string} type - Action type to check
 * @returns {boolean}
 */
export function isValidActionType(type) {
  return type in ActionRegistry;
}

export default {
  ActionRegistry,
  getAction,
  getAllActionTypes,
  isValidActionType,
  // Individual actions for direct access
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
};
