/*
 * @Description: 
 * @Author: Jin Tang
 * @Date: 2025-11-25 18:33:40
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-19 16:07:15
 */
/* eslint-disable no-console */
/**
 * Web Mode Entry Point
 *
 * This is the main entry point for running Automa in web browser mode
 * (not as a browser extension).
 *
 * IMPORTANT: The Chrome API shim MUST be imported first to provide
 * mock implementations before any other code tries to access chrome APIs.
 */

// 1. Import Chrome API shim layer FIRST (critical!)
import './utils/shim-chrome';

// 2. Now import and initialize the Vue app (same as newtab/index.js)
import { createApp } from 'vue';
import { createHead } from '@vueuse/head';
import App from './newtab/App.vue';
import router from './newtab/router';
import pinia from './lib/pinia';
import compsUi from './lib/compsUi';
import vueI18n from './lib/vueI18n';
import vRemixicon, { icons } from './lib/vRemixicon';
import vueToastification from './lib/vue-toastification';

// Import styles
import './assets/css/tailwind.css';
import './assets/css/fonts.css';
import './assets/css/style.css';
import './assets/css/flow.css';

// Log environment info
console.log('Environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  browserType: 'web',
});

const head = createHead();

// Create and mount the Vue app
const app = createApp(App)
  .use(head)
  .use(router)
  .use(compsUi)
  .use(pinia)
  .use(vueI18n)
  .use(vueToastification)
  .use(vRemixicon, icons);

app.mount('#app');

// Vite HMR (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.accept();
}
