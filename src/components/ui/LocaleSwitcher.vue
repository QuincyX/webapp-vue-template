<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Globe } from '@lucide/vue'

import { SUPPORTED_LOCALES, setLocale, type SupportedLocale } from '@/i18n'

withDefaults(
  defineProps<{
    variant?: 'compact' | 'card'
  }>(),
  {
    variant: 'compact',
  },
)

const { t, locale } = useI18n()

const currentLocale = computed(() => locale.value as SupportedLocale)

function handleChange(event: Event): void {
  const select = event.target as HTMLSelectElement
  if (SUPPORTED_LOCALES.some((item) => item.value === select.value)) {
    setLocale(select.value as SupportedLocale)
  }
}
</script>

<template>
  <label
    class="flex items-center gap-2"
    :class="
      variant === 'card'
        ? 'h-11 w-full rounded-xl border border-border bg-background/80 px-3 shadow-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
        : 'h-10 rounded-xl px-2 text-muted-foreground transition-colors focus-within:bg-muted focus-within:ring-2 focus-within:ring-ring hover:bg-muted hover:text-foreground'
    "
  >
    <Globe class="size-[18px] shrink-0" aria-hidden="true" />
    <span class="sr-only">{{ t('common.language') }}</span>
    <select
      :value="currentLocale"
      class="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-xs font-medium outline-none"
      :class="variant === 'compact' ? 'w-auto' : 'w-full'"
      data-testid="locale-switcher"
      @change="handleChange"
    >
      <option v-for="item in SUPPORTED_LOCALES" :key="item.value" :value="item.value">
        {{ variant === 'card' ? item.label : item.shortLabel }}
      </option>
    </select>
    <ChevronDown class="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
  </label>
</template>
