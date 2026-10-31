import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)
const isIos = ref(false)
const isStandalone = ref(false)
let initialized = false

/**
 * Install flow for the PWA.
 *
 * Browsers expose `beforeinstallprompt` once, early, and only on Chromium. Init
 * from `main.ts` before mounting so the event is not missed. iOS Safari has no
 * such event: the only path is Share → “Add to Home Screen”, so the UI falls back
 * to instructions instead of a button that cannot work.
 */
export const useInstallPrompt = createGlobalState(() => {
  function init(): void {
    if (initialized || typeof window === 'undefined') return
    initialized = true

    isIos.value =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)

    const standaloneQuery = window.matchMedia('(display-mode: standalone)')
    isStandalone.value = standaloneQuery.matches
    standaloneQuery.addEventListener('change', (event) => {
      isStandalone.value = event.matches
    })

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      deferredPrompt.value = event as BeforeInstallPromptEvent
    })

    window.addEventListener('appinstalled', () => {
      installed.value = true
      deferredPrompt.value = null
    })
  }

  async function install(): Promise<'accepted' | 'dismissed' | null> {
    const event = deferredPrompt.value
    if (!event) return null

    await event.prompt()
    const choice = await event.userChoice
    deferredPrompt.value = null

    if (choice.outcome === 'accepted') installed.value = true
    return choice.outcome
  }

  const needsManualInstall = computed(() => isIos.value && !isStandalone.value && !installed.value)

  const canInstall = computed(() => deferredPrompt.value !== null && !installed.value)

  /** Whether an install entry point is worth rendering at all. */
  const canShowInstall = computed(
    () => !installed.value && !isStandalone.value && (canInstall.value || needsManualInstall.value),
  )

  return {
    canInstall,
    canShowInstall,
    needsManualInstall,
    isStandalone: computed(() => isStandalone.value),
    init,
    install,
  }
})
