<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    description: undefined,
    size: 'md',
  },
)

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const panel = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
} as const

let previouslyFocused: HTMLElement | null = null
let previousOverflow = ''

function focusableElements(): HTMLElement[] {
  if (!panel.value) return []

  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getAttribute('aria-hidden') !== 'true')
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const elements = focusableElements()
  const first = elements[0]
  const last = elements.at(-1)

  if (!first || !last) {
    event.preventDefault()
    panel.value?.focus()
    return
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function restorePage(): void {
  document.body.style.overflow = previousOverflow
  previouslyFocused?.focus()
  previouslyFocused = null
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      await nextTick()
      const preferred = panel.value?.querySelector<HTMLElement>('[data-autofocus]')
      const firstFocusable = focusableElements()[0]
      const target = preferred ?? firstFocusable ?? panel.value
      target?.focus()
    } else {
      restorePage()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.open) restorePage()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="open"
        class="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
        @keydown="handleKeydown"
      >
        <div
          class="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="emit('close')"
        />

        <section
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          class="modal-panel relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-card-foreground shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-card"
          :class="sizeClasses[size]"
        >
          <header class="flex items-start gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
            <div class="min-w-0 flex-1">
              <h2 :id="titleId" class="text-base font-semibold tracking-tight">
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="descriptionId"
                class="mt-1 text-xs leading-relaxed text-muted-foreground"
              >
                {{ description }}
              </p>
            </div>
            <button
              type="button"
              class="icon-btn icon-btn-sm -mt-1 -mr-1"
              :aria-label="t('modal.close')"
              @click="emit('close')"
            >
              <X />
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/30 px-5 py-3.5 sm:px-6"
          >
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
