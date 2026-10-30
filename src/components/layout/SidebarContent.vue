<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, LayoutDashboard, ListTodo, Settings, Sparkles } from '@lucide/vue'

import AppLogo from '@/components/brand/AppLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'

defineEmits<{
  navigate: []
}>()

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const taskStore = useTaskStore()

const navItems = [
  { labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { labelKey: 'nav.tasks', to: '/tasks', icon: ListTodo },
  { labelKey: 'nav.settings', to: '/settings', icon: Settings },
] as const

const displayName = computed(() => auth.user?.name ?? t('auth.user.fallback'))
const displayEmail = computed(() => auth.user?.email ?? '')
const initials = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'O')
const appVersion = __APP_VERSION__

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="px-5 pt-6 pb-5">
      <AppLogo />
    </div>

    <nav class="min-h-0 flex-1 overflow-y-auto px-3" :aria-label="t('nav.mainLabel')">
      <p
        class="px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/70 uppercase"
      >
        {{ t('nav.section') }}
      </p>

      <ul class="space-y-1">
        <li v-for="item in navItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="nav-link"
            :class="{ 'nav-link-active': isActive(item.to) }"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            @click="$emit('navigate')"
          >
            <component :is="item.icon" aria-hidden="true" />
            <span class="flex-1">{{ t(item.labelKey) }}</span>
            <span
              v-if="item.to === '/tasks' && taskStore.stats.pending > 0"
              class="min-w-5 rounded-full bg-muted px-1.5 py-0.5 text-center text-[10px] font-semibold text-muted-foreground"
              :class="{ 'bg-primary-foreground/15 text-primary-foreground': isActive(item.to) }"
            >
              {{ taskStore.stats.pending }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <div class="mt-6 rounded-2xl border border-border/70 bg-accent/35 p-4">
        <div class="flex items-center gap-2 text-xs font-semibold text-accent-foreground">
          <Sparkles class="size-4" aria-hidden="true" />
          {{ t('nav.focusTitle') }}
        </div>
        <p class="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {{
            t('nav.focusDescription', { count: taskStore.stats.pending }, taskStore.stats.pending)
          }}
        </p>
        <div
          class="mt-3 h-1.5 overflow-hidden rounded-full bg-background/70"
          role="progressbar"
          :aria-valuenow="taskStore.stats.completionRate"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="t('dashboard.progress.aria', { rate: taskStore.stats.completionRate })"
        >
          <div
            class="h-full rounded-full bg-primary transition-[width] duration-500"
            :style="{ width: `${taskStore.stats.completionRate}%` }"
          />
        </div>
        <RouterLink
          to="/tasks"
          class="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-foreground hover:underline"
          @click="$emit('navigate')"
        >
          {{ t('nav.viewTasks') }}
          <ChevronRight class="size-3.5" aria-hidden="true" />
        </RouterLink>
      </div>
    </nav>

    <div class="border-t border-border/70 p-3">
      <RouterLink
        to="/settings"
        class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        @click="$emit('navigate')"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
        >
          {{ initials }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-xs font-semibold text-foreground">
            {{ displayName }}
          </span>
          <span class="block truncate text-[11px] text-muted-foreground">
            {{ displayEmail }}
          </span>
        </span>
        <ChevronRight class="size-4 text-muted-foreground" aria-hidden="true" />
      </RouterLink>
      <p class="mt-2 px-2 text-[10px] text-muted-foreground/70">
        {{ t('nav.localFirst', { version: appVersion }) }}
      </p>
    </div>
  </div>
</template>
