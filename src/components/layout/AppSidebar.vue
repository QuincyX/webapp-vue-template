<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from '@lucide/vue'

import SidebarContent from '@/components/layout/SidebarContent.vue'

const props = defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  if (!panel.value) return []

  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return

  const elements = focusableElements()
  const first = elements[0]
  const last = elements.at(-1)

  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.mobileOpen,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      closeButton.value?.focus()
    } else {
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
)
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border/70 bg-sidebar/90 backdrop-blur-xl lg:flex lg:flex-col"
  >
    <SidebarContent @navigate="emit('close')" />
  </aside>

  <Teleport to="body">
    <Transition name="drawer" appear>
      <div v-if="mobileOpen" class="fixed inset-0 z-50 lg:hidden">
        <div
          class="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="emit('close')"
        />

        <aside
          ref="panel"
          class="drawer-panel absolute inset-y-0 left-0 w-[min(19rem,88vw)] border-r border-border bg-sidebar shadow-2xl"
          role="dialog"
          aria-modal="true"
          :aria-label="t('nav.mobileLabel')"
          @keydown="handleKeydown"
        >
          <button
            ref="closeButton"
            type="button"
            class="icon-btn icon-btn-sm absolute top-5 right-3 z-10"
            :aria-label="t('header.closeMenu')"
            @click="emit('close')"
          >
            <X />
          </button>
          <SidebarContent @navigate="emit('close')" />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
