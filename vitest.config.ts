import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'

import viteConfigSource from './vite.config.ts'

// `vite.config.ts` exports a function because it reads `VITE_APP_TITLE` for the
// PWA manifest. `mergeConfig` needs a resolved object, so resolve it once here.
const viteConfig =
  typeof viteConfigSource === 'function'
    ? viteConfigSource({ command: 'serve', mode: 'test' })
    : viteConfigSource

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.d.ts', 'src/main.ts', 'src/__tests__/**'],
      },
    },
  }),
)
