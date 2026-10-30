<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from '@lucide/vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'

import { useToast, type ToastVariant } from '@/composables/useToast'

const { t } = useI18n()
const { toasts, dismiss } = useToast()

const variantStyles: Record<ToastVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  info: 'text-sky-600 dark:text-sky-400',
}

const variantIcons: Record<ToastVariant, Component> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      tag="ol"
      name="toast"
      class="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      aria-live="polite"
      aria-atomic="false"
    >
      <li
        v-for="item in toasts"
        :key="item.id"
        class="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3.5 shadow-lg"
        data-testid="toast"
      >
        <component
          :is="variantIcons[item.variant]"
          class="mt-0.5 size-5 shrink-0"
          :class="variantStyles[item.variant]"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-foreground">{{ item.title }}</p>
          <p v-if="item.description" class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {{ item.description }}
          </p>
        </div>
        <button
          type="button"
          class="icon-btn icon-btn-sm -mt-1 -mr-1"
          :aria-label="t('toast.close')"
          @click="dismiss(item.id)"
        >
          <X />
        </button>
      </li>
    </TransitionGroup>
  </Teleport>
</template>
