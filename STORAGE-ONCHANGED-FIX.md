# Storage API Enhancement - onChanged Event Fix

## Issue Fixed

**Error:** `TypeError: Cannot read properties of undefined (reading 'addListener')`
**Location:** [src/newtab/App.vue:261](src/newtab/App.vue#L261)
**Cause:** Code attempted to access `browser.storage.local.onChanged.addListener()`, but the shim only provided `chrome.storage.onChanged`

## Root Cause

The Chrome Extension API specification places the `onChanged` event at `chrome.storage.onChanged`, not on individual storage areas. However, the webextension-polyfill library (used by this codebase) allows accessing `onChanged` directly on each storage area:

```javascript
// Chrome API standard location
chrome.storage.onChanged.addListener(callback);

// webextension-polyfill pattern (also used in this codebase)
browser.storage.local.onChanged.addListener(callback);
browser.storage.sync.onChanged.addListener(callback);
```

## Solution

Added `onChanged` property to each storage area object returned by `createStorageArea()` function in [src/utils/shim-chrome.ts:240](src/utils/shim-chrome.ts#L240):

```typescript
const createStorageArea = (storageType = 'local') => {
  const prefix = `automa_${storageType}_`;

  return {
    get(keys, callback) { /* ... */ },
    set(items, callback) { /* ... */ },
    remove(keys, callback) { /* ... */ },
    clear(callback) { /* ... */ },
    getBytesInUse(keys, callback) { /* ... */ },

    // NEW: Add onChanged event to each storage area
    onChanged: createMockEvent(`storage.${storageType}.onChanged`),
  };
};
```

## Impact

Now both patterns work correctly in web mode:

```javascript
// Pattern 1: Standard Chrome API (already worked)
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log('Storage changed:', changes, areaName);
});

// Pattern 2: webextension-polyfill style (NOW WORKS)
browser.storage.local.onChanged.addListener((changes) => {
  console.log('Local storage changed:', changes);
});

browser.storage.sync.onChanged.addListener((changes) => {
  console.log('Sync storage changed:', changes);
});
```

## Affected Code

The App.vue component uses this pattern at setup time:

```javascript
// src/newtab/App.vue:261
browser.storage.local.onChanged.addListener(({ workflowStates }) => {
  if (!workflowStates) return;
  const states = Object.values(workflowStates.newValue);
  workflowStore.states = states;
});
```

This listener watches for changes to `workflowStates` in local storage and updates the Pinia store accordingly. This is a critical feature for synchronizing workflow execution state across the UI.

## Testing

To test the storage change events:

```javascript
// In browser console
// 1. Add a listener
chrome.storage.local.onChanged.addListener((changes) => {
  console.log('Local storage changed:', changes);
});

// 2. Trigger a change
await chrome.storage.local.set({ test: 'hello' });
// Should see: Local storage changed: { test: { newValue: 'hello' } }

// 3. Update the value
await chrome.storage.local.set({ test: 'world' });
// Should see: Local storage changed: { test: { oldValue: 'hello', newValue: 'world' } }
```

## Technical Notes

### Event Naming Convention

Each storage area now has its own named event:
- `storage.local.onChanged`
- `storage.sync.onChanged`
- `storage.session.onChanged`

This allows for better debugging and independent listener tracking per storage area.

### Real Chrome API Behavior

In the real Chrome Extension API:
- `chrome.storage.onChanged` fires for ALL storage areas
- The callback receives `(changes, areaName)` where `areaName` is 'local', 'sync', or 'session'
- Storage areas themselves don't have their own `onChanged` events

In webextension-polyfill:
- Provides convenience by allowing `browser.storage.local.onChanged`
- Automatically filters events to only fire for that specific area
- This is syntactic sugar over the Chrome API

Our shim now supports both patterns for maximum compatibility.

## Related Files

- ✅ [src/utils/shim-chrome.ts](src/utils/shim-chrome.ts) - Added onChanged to createStorageArea
- ✅ [src/newtab/App.vue](src/newtab/App.vue) - Uses storage.local.onChanged.addListener

## Status

✅ **Fixed** - 2025-11-25
- Dev server running successfully
- HMR applied update without errors
- App.vue can now mount without crashes
