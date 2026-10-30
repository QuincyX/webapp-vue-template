<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    compact?: boolean
    inverse?: boolean
  }>(),
  {
    compact: false,
    inverse: false,
  },
)

const { t } = useI18n()
</script>

<template>
  <RouterLink
    to="/"
    class="group flex items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
    :aria-label="`Orbit ${t('app.workspace')}`"
  >
    <span
      class="relative grid size-10 place-items-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:-rotate-6"
      :class="inverse ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3.1" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-28 12 12)" />
        <circle cx="18.6" cy="7.7" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    </span>

    <span v-if="!compact" class="min-w-0">
      <span
        class="block text-[17px] leading-none font-semibold tracking-tight"
        :class="inverse ? 'text-primary-foreground' : 'text-foreground'"
      >
        Orbit
      </span>
      <span
        class="mt-1 block text-[11px] font-medium tracking-[0.12em]"
        :class="inverse ? 'text-primary-foreground/65' : 'text-muted-foreground'"
      >
        {{ t('app.workspace') }}
      </span>
    </span>
  </RouterLink>
</template>
