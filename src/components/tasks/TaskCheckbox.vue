<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Check } from '@lucide/vue'

defineProps<{
  checked: boolean
  title: string
}>()

defineEmits<{
  toggle: []
}>()

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :aria-label="checked ? t('task.markIncomplete', { title }) : t('task.markComplete', { title })"
    class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    :class="
      checked
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card text-transparent hover:border-primary/60 hover:text-primary/40'
    "
    @click.stop="$emit('toggle')"
  >
    <Check class="size-3.5" stroke-width="3" aria-hidden="true" />
  </button>
</template>
