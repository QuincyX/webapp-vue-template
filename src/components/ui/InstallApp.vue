<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Loader2, Share2, Smartphone } from '@lucide/vue'

import { useInstallPrompt } from '@/composables/useInstallPrompt'

/**
 * Install entry point for the PWA.
 *
 * Renders nothing when the app is already installed, running standalone, or when
 * the browser offers no path (e.g. Firefox desktop). Chromium gets a real button;
 * iOS gets instructions because `beforeinstallprompt` does not exist there.
 */
const { t } = useI18n()
const { canShowInstall, canInstall, needsManualInstall, install } = useInstallPrompt()

const busy = ref(false)

async function handleInstall(): Promise<void> {
  busy.value = true
  try {
    await install()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section v-if="canShowInstall" class="card animate-rise" style="animation-delay: 175ms">
    <div class="flex items-center gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
      <span
        class="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <Smartphone class="size-4" aria-hidden="true" />
      </span>
      <div>
        <h2 class="text-sm font-semibold">{{ t('settings.install.title') }}</h2>
        <p class="text-[11px] text-muted-foreground">
          {{ t('settings.install.description') }}
        </p>
      </div>
    </div>

    <div class="space-y-3 p-5 sm:p-6">
      <button
        v-if="canInstall"
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="busy"
        @click="handleInstall"
      >
        <Loader2 v-if="busy" class="animate-spin" aria-hidden="true" />
        <Download v-else aria-hidden="true" />
        {{ t('settings.install.action') }}
      </button>

      <p
        v-else-if="needsManualInstall"
        class="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"
      >
        <Share2 class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {{ t('settings.install.iosHint') }}
      </p>

      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('settings.install.hint') }}
      </p>
    </div>
  </section>
</template>
