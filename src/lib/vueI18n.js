/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-25 19:26:27
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-19 16:09:09
 */
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n/dist/vue-i18n.esm-bundler';
import { supportLocales } from '@/utils/shared';
import dayjs from './dayjs';

// Vite's import.meta.glob for loading locale files
// IMPORTANT: Only load specific locales to avoid syntax errors in other locale files
// Currently loading: en (English) and zh (Chinese Simplified)
// To add more locales, add patterns like '../locales/es/*.json' for Spanish
const localeFiles = import.meta.glob(
  ['../locales/en/*.json', '../locales/zh/*.json'],
  { eager: true }
);

// Helper function to get locale file content
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

const i18n = createI18n({
  legacy: false,
  locale: 'en', // Set default locale
  fallbackLocale: 'en',
  messages: {}, // Start with empty messages, will be loaded dynamically
});

export function setI18nLanguage(locale) {
  i18n.global.locale.value = locale;

  document.querySelector('html').setAttribute('lang', locale);
}

export async function loadLocaleMessages(locale, location) {
  const isLocaleSupported = supportLocales.some(({ id }) => id === locale);

  if (!isLocaleSupported) {
    console.error(`[i18n] ${locale} locale is not supported`);

    return null;
  }

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
    } catch (error) {
      console.error(`[i18n] Error loading ${filename} for ${locale}:`, error);
    }
  };

  // Load English as fallback if not already loaded
  if (locale !== 'en' && !i18n.global.availableLocales.includes('en')) {
    await loadLocaleMessages('en', location);
  }

  dayjs.locale(locale);

  // Load locale files in order
  importLocale('common.json');
  importLocale('popup.json', true);
  importLocale(`${location}.json`, true);
  importLocale('blocks.json', true);

  return nextTick();
}

export default i18n;
