<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Menu, Plus } from '@lucide/vue'

import LocaleSwitcher from '@/components/ui/LocaleSwitcher.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useCurrentTime } from '@/composables/useCurrentTime'
import { useAuthStore } from '@/stores/auth'
import { formatLongDate } from '@/utils/date'

const emit = defineEmits<{
  openMenu: []
}>()

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const now = useCurrentTime()

const displayName = computed(() => auth.user?.name ?? t('auth.user.fallback'))
const displayEmail = computed(() => auth.user?.email ?? '')
const initials = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'O')
const dateLabel = computed(() => formatLongDate(now.value))
const pageTitle = computed(() => t(route.meta.titleKey))
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
  >
    <div class="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
      <button
        type="button"
        class="icon-btn -ml-1 lg:hidden"
        :aria-label="t('header.openMenu')"
        @click="emit('openMenu')"
      >
        <Menu />
      </button>

      <div class="min-w-0">
        <p class="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Orbit / {{ t('header.workspace') }}
        </p>
        <p class="truncate text-sm font-semibold tracking-tight text-foreground">
          {{ pageTitle }}
        </p>
      </div>

      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <span
          class="mr-1 hidden items-center gap-2 text-xs font-medium text-muted-foreground xl:flex"
        >
          <CalendarDays class="size-4" aria-hidden="true" />
          {{ dateLabel }}
        </span>

        <LocaleSwitcher />
        <ThemeToggle />

        <RouterLink
          to="/tasks?new=1"
          class="btn btn-primary btn-sm hidden sm:inline-flex"
          :aria-label="t('header.newTask')"
        >
          <Plus aria-hidden="true" />
          <span>{{ t('header.newTask') }}</span>
        </RouterLink>

        <div class="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

        <RouterLink
          to="/settings"
          class="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="t('header.openSettings')"
        >
          <span
            class="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
          >
            {{ initials }}
          </span>
          <span class="hidden text-left xl:block">
            <span class="block max-w-24 truncate text-xs font-semibold text-foreground">
              {{ displayName }}
            </span>
            <span class="block max-w-32 truncate text-[10px] text-muted-foreground">
              {{ displayEmail }}
            </span>
          </span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
