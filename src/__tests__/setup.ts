import { config } from '@vue/test-utils'

import { i18n } from '@/i18n'

i18n.global.locale.value = 'zh-CN'
config.global.plugins = [i18n]

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList,
})

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => undefined,
})

Element.prototype.scrollIntoView = () => undefined

if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: () => `test-${Math.random().toString(36).slice(2)}`,
  })
}
