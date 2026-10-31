import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

import { authMockPlugin } from './server/auth-mock.ts'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string; description: string }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Only the app title is needed at build time; runtime configuration still comes
  // from src/config/env.ts (which validates it with Zod).
  const env = loadEnv(mode, process.cwd(), '')
  const appTitle = env.VITE_APP_TITLE?.trim() || 'Orbit'

  return {
    plugins: [
      vue(),
      tailwindcss(),
      vueDevTools(),
      authMockPlugin(),
      // PWA is opt-in per project: the manifest ships with the starter so a
      // product can rename it in one place (VITE_APP_TITLE) instead of
      // rediscovering the icon/`start_url`/service-worker requirements.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/maskable-192.png',
          'icons/maskable-512.png',
        ],
        manifest: {
          id: '/',
          name: `${appTitle} · Webapp Starter`,
          short_name: appTitle,
          description: packageJson.description,
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f6f5f1',
          theme_color: '#f6f5f1',
          lang: 'zh-CN',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: '/icons/maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          // API calls must never be served from the precache.
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
        // A service worker in dev hides HMR updates and confuses E2E; test it with
        // `pnpm build && pnpm preview` instead.
        devOptions: { enabled: false },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    build: {
      reportCompressedSize: false,
    },
  }
})
