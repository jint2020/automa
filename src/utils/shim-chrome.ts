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
  console.log('🔧 [Shim] Initializing Chrome API shim layer for web mode');

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
        console.log(`[Shim] ${eventName}.addListener`);
        if (typeof callback === 'function') {
          listeners.push(callback);
        }
      },
      removeListener(callback) {
        console.log(`[Shim] ${eventName}.removeListener`);
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

            console.log(`[Shim] storage.${storageType}.get:`, keys, '→', result);

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

            console.log(`[Shim] storage.${storageType}.set:`, Object.keys(items));

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

            console.log(`[Shim] storage.${storageType}.remove:`, keys);

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

            console.log(`[Shim] storage.${storageType}.clear`);

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
        // Full signature
        console.log('[Shim] runtime.sendMessage:', { extensionId, message, options });
        if (callback) callback({ success: true, mode: 'web-mock' });
        return Promise.resolve({ success: true, mode: 'web-mock' });
      } else {
        // Short signature (message, callback)
        const actualMessage = extensionId;
        const actualCallback = message;
        console.log('[Shim] runtime.sendMessage:', actualMessage);
        if (actualCallback) actualCallback({ success: true, mode: 'web-mock' });
        return Promise.resolve({ success: true, mode: 'web-mock' });
      }
    },

    /**
     * Get URL (mock - returns data URL)
     */
    getURL(path) {
      console.log('[Shim] runtime.getURL:', path);
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
      console.log('[Shim] runtime.connect:', { extensionId, connectInfo });
      return {
        postMessage: (message) => console.log('[Shim] port.postMessage:', message),
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
      console.log('[Shim] tabs.query:', queryInfo);
      const mockTabs = [{ id: 1, url: 'about:blank', active: true }];
      if (callback) callback(mockTabs);
      return Promise.resolve(mockTabs);
    },

    get(tabId, callback) {
      console.log('[Shim] tabs.get:', tabId);
      const mockTab = { id: tabId, url: 'about:blank' };
      if (callback) callback(mockTab);
      return Promise.resolve(mockTab);
    },

    create(createProperties, callback) {
      console.log('[Shim] tabs.create:', createProperties);
      const mockTab = { id: Date.now(), url: createProperties.url || 'about:blank' };
      if (callback) callback(mockTab);
      return Promise.resolve(mockTab);
    },

    update(tabId, updateProperties, callback) {
      console.log('[Shim] tabs.update:', { tabId, updateProperties });
      if (callback) callback({});
      return Promise.resolve({});
    },

    remove(tabIds, callback) {
      console.log('[Shim] tabs.remove:', tabIds);
      if (callback) callback();
      return Promise.resolve();
    },

    reload(tabId, reloadProperties, callback) {
      console.log('[Shim] tabs.reload:', { tabId, reloadProperties });
      if (callback) callback();
      return Promise.resolve();
    },

    goBack(tabId, callback) {
      console.log('[Shim] tabs.goBack:', tabId);
      if (callback) callback();
      return Promise.resolve();
    },

    goForward(tabId, callback) {
      console.log('[Shim] tabs.goForward:', tabId);
      if (callback) callback();
      return Promise.resolve();
    },

    setZoom(tabId, zoomFactor, callback) {
      console.log('[Shim] tabs.setZoom:', { tabId, zoomFactor });
      if (callback) callback();
      return Promise.resolve();
    },

    group(options, callback) {
      console.log('[Shim] tabs.group:', options);
      const groupId = 1;
      if (callback) callback(groupId);
      return Promise.resolve(groupId);
    },

    captureTab(tabId, options, callback) {
      console.log('[Shim] tabs.captureTab:', { tabId, options });
      const dataUrl = 'data:image/png;base64,mock';
      if (callback) callback(dataUrl);
      return Promise.resolve(dataUrl);
    },

    captureVisibleTab(windowId, options, callback) {
      console.log('[Shim] tabs.captureVisibleTab:', { windowId, options });
      const dataUrl = 'data:image/png;base64,mock';
      if (callback) callback(dataUrl);
      return Promise.resolve(dataUrl);
    },

    sendMessage(tabId, message, options, callback) {
      console.log('[Shim] tabs.sendMessage:', { tabId, message });
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
    get(windowId, getInfo, callback) {
      console.log('[Shim] windows.get:', windowId);
      const mockWindow = { id: windowId };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    getCurrent(getInfo, callback) {
      console.log('[Shim] windows.getCurrent');
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

    getAll(getInfo, callback) {
      console.log('[Shim] windows.getAll');
      const mockWindows = [{ id: 1, focused: true }];
      if (callback) callback(mockWindows);
      return Promise.resolve(mockWindows);
    },

    create(createData, callback) {
      console.log('[Shim] windows.create:', createData);
      const mockWindow = { id: Date.now() };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    update(windowId, updateInfo, callback) {
      console.log('[Shim] windows.update:', { windowId, updateInfo });
      const mockWindow = { id: windowId };
      if (callback) callback(mockWindow);
      return Promise.resolve(mockWindow);
    },

    remove(windowId, callback) {
      console.log('[Shim] windows.remove:', windowId);
      if (callback) callback();
      return Promise.resolve();
    },

    // Events
    onRemoved: createMockEvent('windows.onRemoved'),
    onCreated: createMockEvent('windows.onCreated'),
    onFocusChanged: createMockEvent('windows.onFocusChanged'),
  };

  // ============================================================================
  // WebNavigation API
  // ============================================================================

  const webNavigation = {
    getAllFrames(details, callback) {
      console.log('[Shim] webNavigation.getAllFrames:', details);
      const frames = [{ frameId: 0, parentFrameId: -1 }];
      if (callback) callback(frames);
      return Promise.resolve(frames);
    },

    // Events
    onCreatedNavigationTarget: createMockEvent('webNavigation.onCreatedNavigationTarget'),
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
      console.log('[Shim] debugger.attach:', { target, requiredVersion });
      if (callback) callback();
      return Promise.resolve();
    },

    detach(target, callback) {
      console.log('[Shim] debugger.detach:', target);
      if (callback) callback();
      return Promise.resolve();
    },

    sendCommand(target, method, commandParams, callback) {
      console.log('[Shim] debugger.sendCommand:', { target, method, commandParams });
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
        console.log('[Shim] proxy.settings.get');
        const result = { levelOfControl: 'controllable_by_this_extension' };
        if (callback) callback(result);
        return Promise.resolve(result);
      },

      set(details, callback) {
        console.log('[Shim] proxy.settings.set:', details);
        if (callback) callback();
        return Promise.resolve();
      },

      clear(details, callback) {
        console.log('[Shim] proxy.settings.clear');
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
      console.log('[Shim] permissions.contains:', permissions);
      const result = true; // Mock: assume we have all permissions
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    request(permissions, callback) {
      console.log('[Shim] permissions.request:', permissions);
      const result = true; // Mock: assume request granted
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    remove(permissions, callback) {
      console.log('[Shim] permissions.remove:', permissions);
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
      console.log('[Shim] cookies.get:', details);
      const cookie = null; // No cookies in web mode
      if (callback) callback(cookie);
      return Promise.resolve(cookie);
    },

    getAll(details, callback) {
      console.log('[Shim] cookies.getAll:', details);
      const cookies = []; // No cookies in web mode
      if (callback) callback(cookies);
      return Promise.resolve(cookies);
    },

    set(details, callback) {
      console.log('[Shim] cookies.set:', details);
      const cookie = { ...details };
      if (callback) callback(cookie);
      return Promise.resolve(cookie);
    },

    remove(details, callback) {
      console.log('[Shim] cookies.remove:', details);
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
      console.log('[Shim] downloads.search:', query);
      const items = []; // No downloads in web mode
      if (callback) callback(items);
      return Promise.resolve(items);
    },

    download(options, callback) {
      console.log('[Shim] downloads.download:', options);
      const downloadId = Date.now();
      if (callback) callback(downloadId);
      return Promise.resolve(downloadId);
    },

    pause(downloadId, callback) {
      console.log('[Shim] downloads.pause:', downloadId);
      if (callback) callback();
      return Promise.resolve();
    },

    resume(downloadId, callback) {
      console.log('[Shim] downloads.resume:', downloadId);
      if (callback) callback();
      return Promise.resolve();
    },

    cancel(downloadId, callback) {
      console.log('[Shim] downloads.cancel:', downloadId);
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
      console.log('[Shim] action.setBadgeText:', details);
      if (callback) callback();
      return Promise.resolve();
    },

    setBadgeBackgroundColor(details, callback) {
      console.log('[Shim] action.setBadgeBackgroundColor:', details);
      if (callback) callback();
      return Promise.resolve();
    },

    setIcon(details, callback) {
      console.log('[Shim] action.setIcon:', details);
      if (callback) callback();
      return Promise.resolve();
    },

    setTitle(details, callback) {
      console.log('[Shim] action.setTitle:', details);
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
      console.log('[Shim] extension.isAllowedFileSchemeAccess');
      const result = false; // No file scheme access in web mode
      if (callback) callback(result);
      return Promise.resolve(result);
    },

    getURL(path) {
      console.log('[Shim] extension.getURL:', path);
      return `/${path}`;
    },

    getBackgroundPage() {
      console.log('[Shim] extension.getBackgroundPage');
      return null;
    },
  };

  // ============================================================================
  // Scripting API
  // ============================================================================

  const scripting = {
    executeScript(injection, callback) {
      console.log('[Shim] scripting.executeScript (no-op in web mode)');
      if (callback) callback([]);
      return Promise.resolve([]);
    },

    insertCSS(injection, callback) {
      console.log('[Shim] scripting.insertCSS (no-op in web mode)');
      if (callback) callback();
      return Promise.resolve();
    },

    removeCSS(injection, callback) {
      console.log('[Shim] scripting.removeCSS (no-op in web mode)');
      if (callback) callback();
      return Promise.resolve();
    },
  };

  // ============================================================================
  // Other APIs
  // ============================================================================

  const alarms = {
    create(name, alarmInfo) {
      console.log('[Shim] alarms.create:', { name, alarmInfo });
    },
    clear(name, callback) {
      console.log('[Shim] alarms.clear:', name);
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    clearAll(callback) {
      console.log('[Shim] alarms.clearAll');
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    get(name, callback) {
      console.log('[Shim] alarms.get:', name);
      if (callback) callback(null);
      return Promise.resolve(null);
    },
    getAll(callback) {
      console.log('[Shim] alarms.getAll');
      if (callback) callback([]);
      return Promise.resolve([]);
    },
    onAlarm: createMockEvent('alarms.onAlarm'),
  };

  const notifications = {
    create(notificationId, options, callback) {
      console.log('[Shim] notifications.create:', { notificationId, options });
      const id = notificationId || 'mock-id';
      if (callback) callback(id);
      return Promise.resolve(id);
    },
    clear(notificationId, callback) {
      console.log('[Shim] notifications.clear:', notificationId);
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    onClicked: createMockEvent('notifications.onClicked'),
    onClosed: createMockEvent('notifications.onClosed'),
  };

  const contextMenus = {
    create(createProperties, callback) {
      console.log('[Shim] contextMenus.create:', createProperties);
      const id = createProperties.id || 'mock-menu-id';
      if (callback) callback();
      return id;
    },
    update(id, updateProperties, callback) {
      console.log('[Shim] contextMenus.update:', { id, updateProperties });
      if (callback) callback();
      return Promise.resolve();
    },
    remove(menuItemId, callback) {
      console.log('[Shim] contextMenus.remove:', menuItemId);
      if (callback) callback();
      return Promise.resolve();
    },
    removeAll(callback) {
      console.log('[Shim] contextMenus.removeAll');
      if (callback) callback();
      return Promise.resolve();
    },
    onClicked: createMockEvent('contextMenus.onClicked'),
  };

  const commands = {
    getAll(callback) {
      console.log('[Shim] commands.getAll');
      const commands = [];
      if (callback) callback(commands);
      return Promise.resolve(commands);
    },
    onCommand: createMockEvent('commands.onCommand'),
  };

  // ============================================================================
  // Assemble the chrome object
  // ============================================================================

  window.chrome = {
    storage: {
      local: createStorageArea('local'),
      sync: createStorageArea('sync'),
      session: createStorageArea('session'),
      onChanged: createMockEvent('storage.onChanged'),
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
  };

  // Also create 'browser' alias (for webextension-polyfill compatibility)
  if (typeof window.browser === 'undefined') {
    window.browser = window.chrome;
  }

  console.log('✅ [Shim] Chrome API shim layer initialized successfully');
  console.log('💡 [Shim] Storage mapped to localStorage with prefix "automa_"');
  console.log('📦 [Shim] All Chrome APIs mocked (webNavigation, debugger, proxy, etc.)');

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
        ]
      : [],
  };
}
