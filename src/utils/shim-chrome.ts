/**
 * Chrome API Shim Layer for Web Mode
 *
 * This file provides comprehensive mock implementations of Chrome Extension APIs
 * to allow Automa UI to run in a standard web browser environment.
 *
 * KEY MAPPINGS:
 * - chrome.storage.local → localStorage (with Promise-based API)
 * - chrome.runtime.sendMessage → console.log (mock)
 * - All other APIs → deep mocks to prevent "undefined" errors
 *
 * This is a "defensive" shim that ensures BrowserAPIService can safely
 * access all chrome.* properties without throwing errors.
 */

// Detect if we're already in an extension context
const isExtensionContext = typeof chrome !== 'undefined' && chrome?.runtime?.id;

if (!isExtensionContext) {

  // ============================================================================
  // HELPER: Generic Event Mock
  // ============================================================================

  /**
   * Creates a mock Chrome event object
   * All Chrome events have addListener/removeListener/hasListener methods
   */
  function createMockEvent(eventName = 'unknown') {
    const listeners = [];

    return {
      addListener(callback) {
        if (typeof callback === 'function') {
          listeners.push(callback);
        }
      },
      removeListener(callback) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      },
      hasListener(callback) {
        return listeners.includes(callback);
      },
      hasListeners() {
        return listeners.length > 0;
      },
      // Internal: manually trigger event (for testing)
      _trigger(...args) {
        listeners.forEach((callback) => {
          try {
            callback(...args);
          } catch (error) {
            console.error(`[Shim] Error in ${eventName} listener:`, error);
          }
        });
      },
    };
  }

  // ============================================================================
  // Storage API - Map to localStorage
  // ============================================================================

  // ============================================================================
  // Storage Event Handling - Cross-tab synchronization
  // ============================================================================

  const storageOnChangedEvent = createMockEvent('storage.onChanged');

  // Listen to native storage events and convert to Chrome API format
  window.addEventListener('storage', (event) => {
    if (!event.key || !event.key.startsWith('automa_')) return;

    const cleanKey = event.key.replace(/^automa_(local|sync|session)_/, '');
    let storageArea = 'local';
    if (event.key.startsWith('automa_sync_')) {
      storageArea = 'sync';
    } else if (event.key.startsWith('automa_session_')) {
      storageArea = 'session';
    }

    const changes = {
      [cleanKey]: {
        oldValue: event.oldValue ? JSON.parse(event.oldValue) : undefined,
        newValue: event.newValue ? JSON.parse(event.newValue) : undefined,
      },
    };

    // eslint-disable-next-line no-console
    storageOnChangedEvent._trigger(changes, storageArea);
  });

  const createStorageArea = (storageType = 'local') => {
    const prefix = `automa_${storageType}_`;

    return {
      /**
       * Get items from storage
       * @param {string|string[]|object|null} keys
       * @param {Function} callback
       */
      get(keys, callback) {
        return new Promise((resolve) => {
          const result = {};

          try {
            if (keys === null || keys === undefined) {
              // Get all items
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                  const cleanKey = key.substring(prefix.length);
                  const value = localStorage.getItem(key);
                  try {
                    result[cleanKey] = JSON.parse(value);
                  } catch {
                    result[cleanKey] = value;
                  }
                }
              }
            } else if (typeof keys === 'string') {
              // Single key
              const value = localStorage.getItem(prefix + keys);
              if (value !== null) {
                try {
                  result[keys] = JSON.parse(value);
                } catch {
                  result[keys] = value;
                }
              }
            } else if (Array.isArray(keys)) {
              // Array of keys
              keys.forEach((key) => {
                const value = localStorage.getItem(prefix + key);
                if (value !== null) {
                  try {
                    result[key] = JSON.parse(value);
                  } catch {
                    result[key] = value;
                  }
                }
              });
            } else if (typeof keys === 'object') {
              // Object with default values
              Object.keys(keys).forEach((key) => {
                const value = localStorage.getItem(prefix + key);
                if (value !== null) {
                  try {
                    result[key] = JSON.parse(value);
                  } catch {
                    result[key] = value;
                  }
                } else {
                  result[key] = keys[key]; // Default value
                }
              });
            }

            if (callback) callback(result);
            resolve(result);
          } catch (error) {
            console.error(`[Shim] storage.${storageType}.get error:`, error);
            if (callback) callback({});
            resolve({});
          }
        });
      },

      /**
       * Set items in storage
       * @param {object} items
       * @param {Function} callback
       */
      set(items, callback) {
        return new Promise((resolve) => {
          try {
            Object.keys(items).forEach((key) => {
              const value = JSON.stringify(items[key]);
              localStorage.setItem(prefix + key, value);
            });

            if (callback) callback();
            resolve();
          } catch (error) {
            console.error(`[Shim] storage.${storageType}.set error:`, error);
            if (callback) callback();
            resolve();
          }
        });
      },

      /**
       * Remove items from storage
       * @param {string|string[]} keys
       * @param {Function} callback
       */
      remove(keys, callback) {
        return new Promise((resolve) => {
          try {
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach((key) => {
              localStorage.removeItem(prefix + key);
            });

            if (callback) callback();
            resolve();
          } catch (error) {
            console.error(`[Shim] storage.${storageType}.remove error:`, error);
            if (callback) callback();
            resolve();
          }
        });
      },

      /**
       * Clear all items from storage
       * @param {Function} callback
       */
      clear(callback) {
        return new Promise((resolve) => {
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));

            if (callback) callback();
            resolve();
          } catch (error) {
            console.error(`[Shim] storage.${storageType}.clear error:`, error);
            if (callback) callback();
            resolve();
          }
        });
      },

      /**
       * Get bytes in use (mock - always returns 0)
       */
      getBytesInUse(keys, callback) {
        const result = 0;
        if (callback) callback(result);
        return Promise.resolve(result);
      },

      /**
       * onChanged event for this storage area
       * Note: In real Chrome API, onChanged is only at chrome.storage.onChanged
       * But some code (like webextension-polyfill) expects it on each storage area
       */
      onChanged: createMockEvent(`storage.${storageType}.onChanged`),
    };
  };

  // ============================================================================
  // Runtime API
  // ============================================================================

  const runtime = {
    id: 'web-mode-shim',

    /**
     * Send message (mock - logs to console)
     */
    sendMessage(extensionId, message, options, callback) {
      // Handle both (message, callback) and (extensionId, message, callback)
      if (typeof extensionId === 'string' && typeof message === 'object') {
        if (callback) callback({ success: true, mode: 'web-mock' });
        return Promise.resolve({ success: true, mode: 'web-mock' });
      } else {
        // Short signature (message, callback)
        const actualMessage = extensionId;
        const actualCallback = message;
        if (actualCallback) actualCallback({ success: true, mode: 'web-mock' });
        return Promise.resolve({ success: true, mode: 'web-mock' });
      }
    },

    /**
     * Get URL (mock - returns data URL)
     */
    getURL(path) {
      return `/${path}`;
    },

    /**
     * Get manifest (mock)
     */
    getManifest() {
      return {
        version: '1.29.12',
        name: 'Automa',
        description: 'Browser automation tool',
        manifest_version: 3,
      };
    },

    /**
     * Message listener (mock)
     */
    onMessage: createMockEvent('runtime.onMessage'),

    /**
     * Connect (mock)
     */
    connect(extensionId, connectInfo) {
      return {
        postMessage: (message) => console.log('[Shim] port.postMessage', message),
        disconnect: () => console.log('[Shim] port.disconnect'),
        onMessage: createMockEvent('port.onMessage'),
        onDisconnect: createMockEvent('port.onDisconnect'),
      };
    },

    lastError: null,
  };

  // ============================================================================
  // Tabs API
  // ============================================================================

  const tabs = {
    query(queryInfo, callback) {
      const mockTabs = [
        {
          id: 100,
          windowId: 1,
          url: 'https://example.com',
          title: 'Mock Tab - Example',
          active: true,
          index: 0,
          pinned: false,
          highlighted: true,
          incognito: false,
        },
      ];
      if (callback) callback(mockTabs);
      return Promise.resolve(mockTabs);
    },

    get(tabId, callback) {
      const mockTab = { id: tabId, url: 'about:blank' };
      if (callback) callback(mockTab);
      return Promise.resolve(mockTab);
    },

    create(createProperties, callback) {
      const mockTab = {
        id: Date.now(),
        url: createProperties.url || 'about:blank',
      };
      if (callback) callback(mockTab);
      return Promise.resolve(mockTab);
    },

    update(tabId, updateProperties, callback) {
      if (callback) callback({});
      return Promise.resolve({});
    },

    remove(tabIds, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    reload(tabId, reloadProperties, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    goBack(tabId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    goForward(tabId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    setZoom(tabId, zoomFactor, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    group(options, callback) {
      const groupId = 1;
      if (callback) callback(groupId);
      return Promise.resolve(groupId);
    },

    captureTab(tabId, options, callback) {
      const dataUrl = 'data:image/png;base64,mock';
      if (callback) callback(dataUrl);
      return Promise.resolve(dataUrl);
    },

    captureVisibleTab(windowId, options, callback) {
      const dataUrl = 'data:image/png;base64,mock';
      if (callback) callback(dataUrl);
      return Promise.resolve(dataUrl);
    },

    sendMessage(tabId, message, options, callback) {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    },

    // Events
    onUpdated: createMockEvent('tabs.onUpdated'),
    onRemoved: createMockEvent('tabs.onRemoved'),
    onCreated: createMockEvent('tabs.onCreated'),
    onActivated: createMockEvent('tabs.onActivated'),
  };

  // ============================================================================
  // Windows API
  // ============================================================================

  const windows = {
    WINDOW_ID_CURRENT: -2,
    WINDOW_ID_NONE: -1,

    get(windowId, _getInfo, callback) {
      const mockWindow = { id: windowId, focused: true, type: 'normal' };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    getCurrent(_getInfo, callback) {
      // Mock window object for web mode
      // IMPORTANT: type must be 'popup' to bypass App.vue initialization checks
      // See src/newtab/App.vue:336 - if type !== 'popup', app early returns
      const mockWindow = {
        id: 1,
        focused: true,
        type: 'popup', // Critical for web mode initialization
        incognito: false,
        alwaysOnTop: false,
      };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    getLastFocused(_getInfo, callback) {
      // Return the last focused window (same as getCurrent for web mode)
      const mockWindow = {
        id: 1,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
        tabs: [
          {
            id: 100,
            windowId: 1,
            url: 'https://example.com',
            title: 'Mock Tab',
            active: true,
            index: 0,
          },
        ],
      };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    getAll(_getInfo, callback) {
      const mockWindows = [{ id: 1, focused: true, type: 'normal' }];
      if (callback) callback(mockWindows);
      return Promise.resolve(mockWindows);
    },

    create(createData, callback) {
      const mockWindow = { id: Date.now(), type: 'normal' };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    update(windowId, updateInfo, callback) {
      const mockWindow = { id: windowId, type: 'normal' };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    remove(windowId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    // Events
    onRemoved: createMockEvent('windows.onRemoved'),
    onCreated: createMockEvent('windows.onCreated'),
    onFocusChanged: createMockEvent('windows.onFocusChanged'),
    onBoundsChanged: createMockEvent('windows.onBoundsChanged'),
  };

  // ============================================================================
  // WebNavigation API
  // ============================================================================

  const webNavigation = {
    getAllFrames(details, callback) {
      const frames = [{ frameId: 0, parentFrameId: -1 }];
      if (callback) callback(frames);
      return Promise.resolve(frames);
    },

    // Events
    onCreatedNavigationTarget: createMockEvent(
      'webNavigation.onCreatedNavigationTarget'
    ),
    onErrorOccurred: createMockEvent('webNavigation.onErrorOccurred'),
    onBeforeNavigate: createMockEvent('webNavigation.onBeforeNavigate'),
    onCommitted: createMockEvent('webNavigation.onCommitted'),
    onCompleted: createMockEvent('webNavigation.onCompleted'),
  };

  // ============================================================================
  // Debugger API
  // ============================================================================

  const chromeDebugger = {
    attach(target, requiredVersion, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    detach(target, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    sendCommand(target, method, commandParams, callback) {
      const result = {};
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    // Events
    onEvent: createMockEvent('debugger.onEvent'),
    onDetach: createMockEvent('debugger.onDetach'),
  };

  // ============================================================================
  // Proxy API
  // ============================================================================

  const proxy = {
    settings: {
      get(details, callback) {
        const result = { levelOfControl: 'controllable_by_this_extension' };
        if (callback) callback(result);
        return Promise.resolve(result);
      },

      set(details, callback) {
        if (callback) callback();
        return Promise.resolve();
      },

      clear(details, callback) {
        if (callback) callback();
        return Promise.resolve();
      },
    },
  };

  // ============================================================================
  // Permissions API
  // ============================================================================

  const permissions = {
    contains(permissions, callback) {
      const result = true; // Mock: assume we have all permissions
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    request(permissions, callback) {
      const result = true; // Mock: assume request granted
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    remove(permissions, callback) {
      if (callback) callback(true);
      return Promise.resolve(true);
    },

    // Events
    onAdded: createMockEvent('permissions.onAdded'),
    onRemoved: createMockEvent('permissions.onRemoved'),
  };

  // ============================================================================
  // Cookies API
  // ============================================================================

  const cookies = {
    get(details, callback) {
      const cookie = null; // No cookies in web mode
      if (callback) callback(cookie);
      return Promise.resolve(cookie);
    },

    getAll(details, callback) {
      const cookies = []; // No cookies in web mode
      if (callback) callback(cookies);
      return Promise.resolve(cookies);
    },

    set(details, callback) {
      const cookie = { ...details };
      if (callback) callback(cookie);
      return Promise.resolve(cookie);
    },

    remove(details, callback) {
      const details_result = { url: details.url, name: details.name };
      if (callback) callback(details_result);
      return Promise.resolve(details_result);
    },

    // Events
    onChanged: createMockEvent('cookies.onChanged'),
  };

  // ============================================================================
  // Downloads API
  // ============================================================================

  const downloads = {
    search(query, callback) {
      const items = []; // No downloads in web mode
      if (callback) callback(items);
      return Promise.resolve(items);
    },

    download(options, callback) {
      const downloadId = Date.now();
      if (callback) callback(downloadId);
      return Promise.resolve(downloadId);
    },

    pause(downloadId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    resume(downloadId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    cancel(downloadId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    // Events
    onCreated: createMockEvent('downloads.onCreated'),
    onChanged: createMockEvent('downloads.onChanged'),
    onDeterminingFilename: createMockEvent('downloads.onDeterminingFilename'),
  };

  // ============================================================================
  // Action/BrowserAction API (MV3 uses 'action', MV2 uses 'browserAction')
  // ============================================================================

  const actionAPI = {
    setBadgeText(details, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    setBadgeBackgroundColor(details, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    setIcon(details, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    setTitle(details, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    // Events
    onClicked: createMockEvent('action.onClicked'),
  };

  // ============================================================================
  // Extension API
  // ============================================================================

  const extension = {
    isAllowedFileSchemeAccess(callback) {
      const result = false; // No file scheme access in web mode
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    getURL(path) {
      return `/${path}`;
    },

    getBackgroundPage() {
      return null;
    },
  };

  // ============================================================================
  // Scripting API
  // ============================================================================

  const scripting = {
    executeScript(injection, callback) {
      // Return empty results array to prevent crashes
      const results = [];
      if (callback) callback(results);
      return Promise.resolve(results);
    },

    insertCSS(injection, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    removeCSS(injection, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    registerContentScripts(_scripts, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    updateContentScripts(_scripts, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    unregisterContentScripts(_filter, callback) {
      if (callback) callback();
      return Promise.resolve();
    },

    getRegisteredContentScripts(_filter, callback) {
      const scripts = [];
      if (callback) callback(scripts);
      return Promise.resolve(scripts);
    },
  };

  // ============================================================================
  // Other APIs
  // ============================================================================

  const alarms = {
    create(name, alarmInfo) {
    },
    clear(name, callback) {
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    clearAll(callback) {
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    get(name, callback) {
      if (callback) callback(null);
      return Promise.resolve(null);
    },
    getAll(callback) {
      if (callback) callback([]);
      return Promise.resolve([]);
    },
    onAlarm: createMockEvent('alarms.onAlarm'),
  };

  const notifications = {
    create(notificationId, options, callback) {
      const id = notificationId || 'mock-id';
      if (callback) callback(id);
      return Promise.resolve(id);
    },
    clear(notificationId, callback) {
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    onClicked: createMockEvent('notifications.onClicked'),
    onClosed: createMockEvent('notifications.onClosed'),
  };

  const contextMenus = {
    create(createProperties, callback) {
      const id = createProperties.id || 'mock-menu-id';
      if (callback) callback();
      return id;
    },
    update(id, updateProperties, callback) {
      if (callback) callback();
      return Promise.resolve();
    },
    remove(menuItemId, callback) {
      if (callback) callback();
      return Promise.resolve();
    },
    removeAll(callback) {
      if (callback) callback();
      return Promise.resolve();
    },
    onClicked: createMockEvent('contextMenus.onClicked'),
  };

  const commands = {
    getAll(callback) {
      const commandsList = [];
      if (callback) callback(commandsList);
      return Promise.resolve(commandsList);
    },
    onCommand: createMockEvent('commands.onCommand'),
  };

  // ============================================================================
  // i18n API - Internationalization
  // ============================================================================

  const i18n = {
    getMessage(messageName, substitutions) {
      // Simple fallback: return the key itself if no translation available
      // In real extension, this would lookup from _locales/[lang]/messages.json
      let message = messageName;

      // Handle substitutions if provided
      if (substitutions) {
        const subs = Array.isArray(substitutions)
          ? substitutions
          : [substitutions];
        subs.forEach((sub, index) => {
          message = message.replace(`$${index + 1}`, sub);
        });
      }

      return message;
    },

    getUILanguage() {
      return navigator.language || 'en';
    },

    getAcceptLanguages(callback) {
      const languages = [navigator.language || 'en'];
      if (callback) callback(languages);
      return Promise.resolve(languages);
    },

    detectLanguage(_text, callback) {
      // eslint-disable-next-line no-console
      const result = { languages: [{ language: 'en', percentage: 100 }] };
      if (callback) callback(result);
      return Promise.resolve(result);
    },
  };

  // ============================================================================
  // Assemble the chrome object
  // ============================================================================

  // @ts-ignore - Cast to any to bypass TypeScript strict typing for mock layer
  window.chrome = {
    storage: {
      local: createStorageArea('local'),
      sync: createStorageArea('sync'),
      session: createStorageArea('session'),
      onChanged: storageOnChangedEvent,
    },
    runtime,
    tabs,
    windows,
    webNavigation,
    debugger: chromeDebugger,
    proxy,
    permissions,
    cookies,
    downloads,
    action: actionAPI,
    browserAction: actionAPI, // MV2 compatibility
    extension,
    scripting,
    alarms,
    notifications,
    contextMenus,
    commands,
    i18n,
  };

  // Also create 'browser' alias (for webextension-polyfill compatibility)
  if (typeof window.browser === 'undefined') {
    window.browser = window.chrome;
  }

  console.log('✅ [Shim] Chrome API shim layer initialized successfully');
  console.log('💡 [Shim] Storage mapped to localStorage with prefix "automa_"');
  console.log(
    '📦 [Shim] All Chrome APIs mocked (webNavigation, debugger, proxy, etc.)'
  );

  // Make createMockEvent available globally for testing
  window.__chromeMockEvent = createMockEvent;
} else {
  console.log('ℹ️  [Shim] Running in extension context, shim layer not needed');
}

// Export detection utilities
export const isWebMode = !isExtensionContext;
export const isExtensionMode = isExtensionContext;

// Export for debugging
export function getShimInfo() {
  return {
    isWebMode,
    isExtensionMode,
    chromeAvailable: typeof window.chrome !== 'undefined',
    localStorageAvailable: typeof window.localStorage !== 'undefined',
    shimmedAPIs: isWebMode
      ? [
          'storage',
          'runtime',
          'tabs',
          'windows',
          'webNavigation',
          'debugger',
          'proxy',
          'permissions',
          'cookies',
          'downloads',
          'action',
          'browserAction',
          'extension',
          'scripting',
          'alarms',
          'notifications',
          'contextMenus',
          'commands',
          'i18n',
        ]
      : [],
  };
}
