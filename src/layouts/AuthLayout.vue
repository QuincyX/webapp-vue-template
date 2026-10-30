<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Check } from '@lucide/vue'

import AppLogo from '@/components/brand/AppLogo.vue'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { env } from '@/config/env'

const { t } = useI18n()
const route = useRoute()

watchEffect(() => {
  document.title = `${t(route.meta.titleKey)} · ${env.VITE_APP_TITLE}`
})
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-[1.02fr_1fr]">
    <a
      href="#auth-content"
      class="sr-only z-[100] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {{ t('layout.skipToContent') }}
    </a>

    <aside
      class="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col xl:p-14"
    >
      <div
        class="pointer-events-none absolute -top-32 -right-24 size-[30rem] rounded-full border border-primary-foreground/15"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-10 -bottom-40 size-[26rem] rounded-full border border-primary-foreground/10"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute top-1/3 -left-24 size-64 rounded-full bg-primary-foreground/5 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative z-10">
        <AppLogo inverse />
      </div>

      <div class="relative z-10 my-auto max-w-xl py-16">
        <p class="text-[11px] font-semibold tracking-[0.22em] uppercase opacity-70">
          {{ t('auth.brand.eyebrow') }}
        </p>
        <h1
          class="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-balance xl:text-5xl"
        >
          {{ t('auth.brand.title') }}
        </h1>
        <p class="mt-5 max-w-md text-sm leading-7 opacity-80">
          {{ t('auth.brand.description') }}
        </p>

        <ul class="mt-9 space-y-3 text-sm">
          <li v-for="index in 3" :key="index" class="flex items-start gap-3">
            <span
              class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-foreground/15"
            >
              <Check class="size-3" aria-hidden="true" />
            </span>
            <span class="opacity-85">{{ t(`auth.brand.point${index}`) }}</span>
          </li>
        </ul>
      </div>

      <p class="relative z-10 text-xs opacity-60">
        {{ t('auth.brand.footer') }}
      </p>
    </aside>

    <div class="flex min-h-dvh flex-col">
      <header class="flex items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-10">
        <div class="lg:hidden">
          <AppLogo />
        </div>
        <p class="hidden text-xs font-medium text-muted-foreground lg:block">
          {{ t('auth.header.hint') }}
        </p>
        <div class="ml-auto flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main
        id="auth-content"
        tabindex="-1"
        class="flex flex-1 items-center px-5 pb-10 sm:px-8 lg:px-10"
      >
        <div class="mx-auto w-full max-w-md">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </main>

      <footer class="px-5 pb-6 text-center text-[11px] text-muted-foreground sm:px-8">
        {{ t('auth.footer', { year: new Date().getFullYear() }) }}
      </footer>
    </div>
  </div>
</template>
