import { computed, watchEffect } from 'vue'
import { createGlobalState, useLocalStorage, usePreferredDark } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'orbit.theme.v1'
const themeModes: ThemeMode[] = ['light', 'dark', 'system']

function applyTheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark)

  const themeColor = isDark ? '#111318' : '#f6f5f1'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
}

/**
 * `createGlobalState` keeps every consumer on the same theme refs and effect
 * scope, so toggling in Settings also updates the header icon immediately.
 */
export const useTheme = createGlobalState(() => {
  const storedMode = useLocalStorage<string>(THEME_STORAGE_KEY, 'system')
  const prefersDark = usePreferredDark()

  const mode = computed<ThemeMode>({
    get: () => {
      return themeModes.includes(storedMode.value as ThemeMode)
        ? (storedMode.value as ThemeMode)
        : 'system'
    },
    set: (value) => {
      storedMode.value = value
    },
  })

  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'system' && prefersDark.value),
  )

  watchEffect(() => applyTheme(isDark.value))

  function setMode(nextMode: ThemeMode): void {
    mode.value = nextMode
  }

  function toggle(): void {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, setMode, toggle }
})
