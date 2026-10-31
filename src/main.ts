import { createApp } from 'vue'

import App from './App.vue'
import { UNAUTHORIZED_EVENT } from './api/http'
import { useInstallPrompt } from './composables/useInstallPrompt'
import { i18n } from './i18n'
import router from './router'
import { useAuthStore } from './stores/auth'
import { pinia } from './stores/pinia'
import '@/assets/main.css'

// Register before mounting: `beforeinstallprompt` fires early and only once.
useInstallPrompt().init()

const app = createApp(App)

app.use(pinia)
app.use(i18n)
app.use(router)

window.addEventListener(UNAUTHORIZED_EVENT, () => {
  const auth = useAuthStore(pinia)
  // Bootstrap handles its own 401 without racing the initial navigation guard.
  if (!auth.initialized) return

  auth.handleUnauthorized()
  const current = router.currentRoute.value
  if (current.name === 'login' || current.name === 'register') return

  void router.replace({
    name: 'login',
    query: { redirect: current.fullPath },
  })
})

app.config.errorHandler = (error, instance, info) => {
  console.error('[Orbit] Unhandled application error', { error, instance, info })
}

await router.isReady()
app.mount('#app')
