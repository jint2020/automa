# Infinite Loading Spinner Fix - Window Type Issue

## Issue Fixed

**Problem:** App stuck on infinite loading spinner, never showing the main UI
**Location:** [src/newtab/App.vue:2-71](src/newtab/App.vue#L2-L71)
**Cause:** App initialization checks window type and early returns if not `'popup'`, preventing `retrieved` variable from being set to `true`

## Root Cause Analysis

The App.vue initialization flow at line 335-339 contains this check:

```javascript
const currentWindow = await browser.windows.getCurrent();
if (currentWindow.type !== 'popup') {
  await browser.tabs.remove([tabs[0].id]);
  return; // <-- Early return prevents retrieved.value = true
}
```

**What this code does:**
- Gets the current window object
- Checks if the window type is NOT a popup
- If it's a normal window (not popup), it removes the tab and exits early
- This prevents the initialization from reaching line 370: `retrieved.value = true`

**Why it failed in web mode:**
Our shim's `windows.getCurrent()` returned:
```javascript
{ id: 1, focused: true } // Missing 'type' property
```

Since `type` was `undefined`, the condition `currentWindow.type !== 'popup'` was `true`, causing the early return.

## Solution

Updated [src/utils/shim-chrome.ts:420-434](src/utils/shim-chrome.ts#L420-L434) to return a complete window object with `type: 'popup'`:

```typescript
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
}
```

## Why `type: 'popup'` Specifically?

The extension is designed to run in two contexts:
1. **Popup window** - When opened from the browser action icon
2. **New tab** - When opened as newtab.html

The check at App.vue:336 is trying to prevent duplicate tabs from existing. However, for web mode (running as a standard web app), we need to bypass this check entirely. Setting `type: 'popup'` makes the app think it's running in a popup, which:

- Bypasses the duplicate tab check
- Allows initialization to continue
- Reaches the critical `retrieved.value = true` statement at line 370
- Shows the main UI instead of the loading spinner

## App Initialization Flow

```
App.vue setup() IIFE (line 324)
  ↓
1. Load workflowStates from storage
  ↓
2. Query tabs for newtab.html
  ↓
3. Get current window ← THIS WAS FAILING
  ↓
4. Check if window.type === 'popup'
   ├─ NO (was undefined) → Remove tabs, RETURN EARLY ❌
   └─ YES (now 'popup') → Continue initialization ✅
  ↓
5. Load all stores (folders, workflows, settings, etc.)
  ↓
6. Load locale messages
  ↓
7. Run data migration
  ↓
8. Load user
  ↓
9. Run automa('app')
  ↓
10. Set retrieved.value = true ← SPINNER DISAPPEARS
  ↓
11. Fetch additional data (shared workflows, hosted workflows)
  ↓
12. Check recording mode and auto-delete logs
```

Without the `type: 'popup'` property, the flow stopped at step 4, never reaching step 10.

## Impact

**Before:** App stuck on loading spinner indefinitely
**After:** App completes initialization and shows main UI

**Affected Components:**
- App.vue (main template rendering)
- All child components (sidebar, router-view, logs, etc.)

## Testing

To verify the fix works:

```javascript
// In browser console after app loads
// Check that the window mock includes type: 'popup'
chrome.windows.getCurrent().then(win => {
  console.log('Window:', win);
  // Should show: { id: 1, focused: true, type: 'popup', incognito: false, alwaysOnTop: false }
});

// Verify the app is no longer in loading state
// Check the DOM - should see <app-sidebar> and <main>, not <ui-spinner>
document.querySelector('ui-spinner'); // Should be null
document.querySelector('app-sidebar'); // Should exist
```

## Related Files

- ✅ [src/utils/shim-chrome.ts](src/utils/shim-chrome.ts#L420-L434) - Updated windows.getCurrent()
- ✅ [src/newtab/App.vue](src/newtab/App.vue#L335-L339) - Window type check that was failing

## Additional Notes

### Extension vs Web Mode Context

In the real Chrome extension:
- Popup window: Opens when clicking the extension icon (`type: 'popup'`)
- New tab: Opens as a full tab (`type: 'normal'`)
- The app detects context to show different UI/features

In web mode:
- Always runs as a normal web page
- Should be treated as a "new tab" context logically
- But we return `type: 'popup'` to bypass the duplicate tab check

This is acceptable because the duplicate tab check logic only applies to the extension environment. In web mode, there's no concept of "duplicate extension tabs" since it's just a regular web app.

## Status

✅ **Fixed** - 2025-11-25
- Dev server HMR applied update successfully
- App should now bypass the early return and complete initialization
- Loading spinner should disappear and show main UI

---

**Next Step:** Verify in browser that the main UI appears. There may be additional errors after the spinner disappears that need to be addressed.
