/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-25 18:35:53
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-03 12:00:23
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
// Use --mode dev or --mode production to load .env.dev or .env.production
export default defineConfig(() => {
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {},
        },
      }),
    ],
    base: './',

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@business': fileURLToPath(new URL('./business/dev', import.meta.url)),
        // Point to blank secrets for web mode
        secrets: fileURLToPath(new URL('./secrets.blank.js', import.meta.url)),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },

    // Development server configuration
    server: {
      port: 3000,
      open: true,
      cors: true,
    },

    // Build configuration
    build: {
      outDir: 'dist-web',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },

    // Define global constants
    define: {
      // Vue feature flags (matching webpack config)
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_I18N_FULL_INSTALL__: true,
      __INTLIFY_PROD_DEVTOOLS__: false,
      __VUE_I18N_LEGACY_API__: false,

      // Custom flags for environment detection
      BROWSER_TYPE: JSON.stringify('web'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },

    // CSS configuration
    css: {
      postcss: './postcss.config.js',
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        '@vue-flow/core',
        '@vue-flow/background',
        '@vue-flow/minimap',
      ],
    },

    // Environment mode for loading .env files
    envDir: '.',
  };
});
