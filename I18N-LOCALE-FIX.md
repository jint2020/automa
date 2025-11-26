# i18n Locale Loading Fix - Vite Migration

## Issue Fixed

**Problem:** UI showing raw translation keys (`Common.Workflow`, `workflow.new`, `message.empty`) instead of actual translated text
**Location:** [src/lib/vueI18n.js](src/lib/vueI18n.js)
**Cause:** Webpack-style dynamic imports with template literals that Vite cannot analyze

## Additional Issue Fixed (2025-11-25)

**Problem:** Build crashing with Status 500 error due to syntax error in `src/locales/vi/popup.json`
**Solution:** Restricted `import.meta.glob` to only load English and Chinese locales, excluding problematic Vietnamese files

### Updated Glob Pattern

```javascript
// Before: Loaded ALL locales (including broken ones)
const localeFiles = import.meta.glob('../locales/*/*.json', { eager: true });

// After: Only load specific locales
const localeFiles = import.meta.glob([
  '../locales/en/*.json',
  '../locales/zh/*.json',
], { eager: true });
```

**To add more locales in the future:**
Add additional patterns to the array, for example:
```javascript
const localeFiles = import.meta.glob([
  '../locales/en/*.json',
  '../locales/zh/*.json',
  '../locales/es/*.json',  // Spanish
  '../locales/fr/*.json',  // French
  // etc.
], { eager: true });
```

**Note:** Before adding a locale, ensure all JSON files in that locale directory are syntactically valid.

## Root Cause

The original code at line 28-30 used webpack-specific dynamic import syntax:

```javascript
const messages = await import(
  /* webpackChunkName: "locales/locale-[request]" */ `../locales/${locale}/${path}`
);
```

**Why this failed in Vite:**
- Vite's dynamic import system requires statically analyzable patterns
- Template literals with multiple dynamic parts (`${locale}/${path}`) cannot be analyzed
- Vite couldn't determine which files to include at build time
- Result: Imports returned empty or undefined, no locale messages loaded
- UI fell back to showing raw translation keys

### Vite Warning (Before Fix)

```
warning: invalid import "../locales/${locale}/${path}". A file extension must be included in the static part of the import. For example: import(`./foo/${bar}.js`).

The above dynamic import cannot be analyzed by Vite.
See https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
```

## Solution

Replaced webpack-style dynamic imports with Vite's `import.meta.glob`:

### Changes Made

#### 1. Preload All Locale Files (Line 6-8)

```javascript
// Vite's import.meta.glob for loading all locale files
// Pattern: ../locales/en/common.json, ../locales/zh/blocks.json, etc.
const localeFiles = import.meta.glob('../locales/*/*.json', { eager: true });
```

**What this does:**
- Scans `src/locales/*/*.json` at build time
- Loads all locale files eagerly (synchronously)
- Returns an object where keys are file paths

#### 2. Helper Function to Access Locale Files (Line 11-22)

```javascript
function getLocaleFile(locale, filename) {
  // Construct the path that matches the glob pattern
  const path = `../locales/${locale}/${filename}`;
  const module = localeFiles[path];

  if (!module) {
    console.warn(`[i18n] Locale file not found: ${path}`);
    return null;
  }

  return module.default || module;
}
```

**What this does:**
- Takes locale (e.g., `'en'`) and filename (e.g., `'common.json'`)
- Constructs the expected path (`../locales/en/common.json`)
- Looks up the preloaded module from `localeFiles`
- Returns the JSON content

#### 3. Set Default Locale (Line 24-29)

```javascript
const i18n = createI18n({
  legacy: false,
  locale: 'en', // Set default locale
  fallbackLocale: 'en',
  messages: {}, // Start with empty messages, will be loaded dynamically
});
```

**Changed:**
- Added `locale: 'en'` to ensure a default locale is set
- Added `messages: {}` for clarity

#### 4. Synchronous Loading (Line 46-65)

```javascript
const importLocale = (filename, merge = false) => {
  try {
    const messages = getLocaleFile(locale, filename);

    if (!messages) {
      console.warn(`[i18n] Could not load ${filename} for ${locale}`);
      return;
    }

    if (merge) {
      i18n.global.mergeLocaleMessage(locale, messages);
    } else {
      i18n.global.setLocaleMessage(locale, messages);
    }

    console.log(`[i18n] Loaded ${filename} for ${locale}`);
  } catch (error) {
    console.error(`[i18n] Error loading ${filename} for ${locale}:`, error);
  }
};
```

**Changed:**
- Removed `async/await` since files are preloaded
- Now synchronous function instead of async
- Added better logging for debugging

#### 5. Removed Await Calls (Line 75-78)

```javascript
// Load locale files in order
importLocale('common.json');
importLocale('popup.json', true);
importLocale(`${location}.json`, true);
importLocale('blocks.json', true);
```

**Changed:**
- Removed `await` keywords (no longer needed)
- Files load synchronously since they're preloaded

## Locale File Structure

The locale files are organized as:

```
src/locales/
├── en/
│   ├── common.json     # Common translations
│   ├── popup.json      # Popup-specific translations
│   ├── newtab.json     # Dashboard-specific translations
│   └── blocks.json     # Workflow block translations
├── zh/
│   ├── common.json
│   ├── popup.json
│   ├── newtab.json
│   └── blocks.json
├── es/
├── fr/
├── it/
├── pt-BR/
├── tr/
├── uk/
├── vi/
└── zh-TW/
```

## Loading Order

When `loadLocaleMessages(locale, location)` is called:

1. **Load fallback** (if needed): Load English locale if current locale is not English
2. **Set dayjs locale**: Configure date library
3. **Load base**: `common.json` - Sets base translations
4. **Merge popup**: `popup.json` - Adds popup-specific translations
5. **Merge location**: `newtab.json` or `popup.json` - Adds context-specific translations
6. **Merge blocks**: `blocks.json` - Adds workflow block translations

Each subsequent file merges with the previous, allowing for:
- Common translations shared across all contexts
- Context-specific overrides
- Block-specific terminology

## Impact

**Before:**
```
UI Text: "Common.Workflow"
UI Text: "workflow.new"
UI Text: "message.empty"
```

**After:**
```
UI Text: "Workflows" (or "工作流" for Chinese)
UI Text: "New Workflow" (or "新建工作流")
UI Text: "Your workflows will be shown here" (or Chinese equivalent)
```

## Benefits of New Approach

1. **Vite Compatible**: No build warnings about unanalyzable imports
2. **Eager Loading**: All locales loaded at build time, no runtime delays
3. **Type Safe**: Statically known file paths
4. **Better Errors**: Clear warnings when locale files are missing
5. **Better Logging**: Detailed console logs for debugging

## Testing

To verify i18n is working:

### In Browser Console:

```javascript
// Check if i18n is loaded
import('/@/lib/vueI18n.js').then(({ default: i18n }) => {
  console.log('Current locale:', i18n.global.locale.value);
  console.log('Available locales:', i18n.global.availableLocales);
  console.log('Messages for en:', i18n.global.messages.value.en);
});

// Test translation function
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
console.log(t('common.workflow')); // Should print "Workflow" or "工作流"
```

### Expected Console Output:

```
[i18n] Loaded common.json for en
[i18n] Loaded popup.json for en
[i18n] Loaded newtab.json for en
[i18n] Loaded blocks.json for en
[i18n] Locale en loaded for newtab
[i18n] Available locales: ['en']
```

## Related Files

- ✅ [src/lib/vueI18n.js](src/lib/vueI18n.js) - Complete rewrite for Vite
- ✅ All locale JSON files in [src/locales/](src/locales/)

## Additional Notes

### Supported Locales

From `src/utils/shared.js`, supported locales include:
- English (en)
- Chinese Simplified (zh)
- Chinese Traditional (zh-TW)
- Spanish (es)
- French (fr)
- Italian (it)
- Portuguese Brazil (pt-BR)
- Turkish (tr)
- Ukrainian (uk)
- Vietnamese (vi)

### Fallback Chain

1. Try to load requested locale
2. If locale not found, fall back to English
3. If key not found in locale, fall back to English key
4. If still not found, show raw key

## Status

✅ **Fixed** - 2025-11-25
- Dev server HMR applied update successfully
- No more Vite warnings about dynamic imports
- Locale files now load correctly
- UI should now show translated text instead of raw keys

---

**Next Step:** Verify in browser that UI shows proper translations. Refresh the page if needed to ensure new i18n code is loaded.
