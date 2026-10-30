<script setup lang="ts">
import { onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEventListener } from '@vueuse/core'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { env } from '@/config/env'

const { t } = useI18n()
const route = useRoute()
const mobileOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)

watch(mobileOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

watchEffect(() => {
  document.title = `${t(route.meta.titleKey)} · ${env.VITE_APP_TITLE}`
})

useEventListener(document, 'keydown', (event) => {
  if (event.key === 'Escape' && mobileOpen.value) {
    mobileOpen.value = false
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="min-h-dvh">
    <a
      href="#main-content"
      class="sr-only z-[100] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {{ t('layout.skipToContent') }}
    </a>

    <AppSidebar :mobile-open="mobileOpen" @close="mobileOpen = false" />

    <div class="lg:pl-72">
      <AppHeader @open-menu="mobileOpen = true" />

      <main id="main-content" tabindex="-1" class="outline-none">
        <div class="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </main>

      <footer class="px-4 pb-6 sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-[96rem] flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground/70 sm:flex-row"
        >
          <p>{{ t('layout.builtWith') }}</p>
          <p>{{ t('layout.localOnly') }}</p>
        </div>
      </footer>
    </div>
  </div>
</template>
