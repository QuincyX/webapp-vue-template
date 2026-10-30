import { createI18n } from 'vue-i18n'

import { enUS } from './messages/en-US'
import { zhCN } from './messages/zh-CN'

export const LOCALE_STORAGE_KEY = 'orbit.locale.v1'

export const SUPPORTED_LOCALES = [
  { value: 'zh-CN', label: '简体中文', shortLabel: '中文' },
  { value: 'en-US', label: 'English', shortLabel: 'EN' },
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['value']

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((locale) => locale.value === value)
}

function detectLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'zh-CN'

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isSupportedLocale(stored)) return stored
  } catch {
    // localStorage can be unavailable in hardened browser contexts.
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export function getCurrentLocale(): SupportedLocale {
  const locale = i18n.global.locale.value
  return isSupportedLocale(locale) ? locale : 'zh-CN'
}

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Persisting locale is optional; the in-memory switch still works.
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = getCurrentLocale()
}
