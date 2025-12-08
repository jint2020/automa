# Workflow Trigger Fix - Array Type Check

## Issue Fixed

**Error:** `TypeError: visitWebTriggers?.filter is not a function`
**Location:** [src/utils/workflowTrigger.js:110](src/utils/workflowTrigger.js#L110)
**Trigger:** Saving a workflow in web mode
**Cause:** `visitWebTriggers` from `browser.storage.local` was not an array

## Root Cause

When the code calls `browser.storage.local.get(['visitWebTriggers', ...])` in web mode:
1. If the key doesn't exist in localStorage, it's excluded from the result object
2. Destructuring assigns `undefined` to `visitWebTriggers`
3. The code used `visitWebTriggers?.filter()` assuming it would be `undefined` or an array
4. However, if corrupted data exists in localStorage (e.g., an object instead of array), the optional chain passes through but `.filter()` fails

## Solution

Added explicit array type checking before calling `.filter()`:

```javascript
// Before (line 110-112) - UNSAFE
const filteredVisitWebTriggers = visitWebTriggers?.filter(
  (item) => !item.id.includes(workflowId)
);

// After (line 111-117) - SAFE
const visitWebTriggersArray = Array.isArray(visitWebTriggers)
  ? visitWebTriggers
  : [];
const filteredVisitWebTriggers = visitWebTriggersArray.filter(
  (item) => !item.id.includes(workflowId)
);
```

## Why This Matters in Web Mode

In extension mode:
- `browser.storage.local` is a native API with guaranteed data consistency
- Values are always the correct type

In web mode (with our shim):
- Storage is backed by localStorage (JSON serialization)
- Data can become corrupted if:
  - User manually edits localStorage
  - Previous bugs stored wrong data type
  - Migration from old extension version

## Impact

**Before:** Saving workflows crashed with TypeError
**After:** Workflows save successfully even if storage data is corrupted

## Related Code Patterns

The same pattern was already correctly used elsewhere in the file:

```javascript
// Line 107-109 - Already safe
const startupTriggers = (onStartupTriggers || []).filter(
  (id) => !id.includes(workflowId)
);

// Line 225-227 - Already safe with fallback
const visitWebTriggers =
  (await browser.storage.local.get('visitWebTriggers'))?.visitWebTriggers || [];
```

## Testing

To test this fix:

```javascript
// In browser console, corrupt the data
localStorage.setItem('automa_local_visitWebTriggers', '{"corrupted": "object"}');

// Try to save a workflow - should not crash
// The corrupted data will be overwritten with correct empty array
```

## Status

✅ **Fixed** - 2025-11-26
- Array type checking added before `.filter()` call
- Workflow saving now works correctly in web mode
- Handles corrupted localStorage data gracefully

## Related Files

- ✅ [src/utils/workflowTrigger.js](src/utils/workflowTrigger.js#L111-L117) - Added array type check
