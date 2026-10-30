<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  AlarmClock,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from '@lucide/vue'

import TaskListItem from '@/components/tasks/TaskListItem.vue'
import { useCurrentTime } from '@/composables/useCurrentTime'
import { priorityDotStyles, priorityI18nKeys, statusI18nKeys, statusStyles } from '@/constants/task'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import type { Task, TaskPriority } from '@/types/task'
import { formatCalendarDate, formatDateTime, formatLongDate, getGreeting } from '@/utils/date'

const { t } = useI18n()
const router = useRouter()
const taskStore = useTaskStore()
const auth = useAuthStore()
const now = useCurrentTime()

const greeting = computed(() => getGreeting(now.value))
const dateLabel = computed(() => formatLongDate(now.value))
const weekTotal = computed(() => taskStore.completedThisWeek)
const maxActivity = computed(() => Math.max(1, ...taskStore.weeklyActivity.map((day) => day.count)))

const radius = 52
const circumference = 2 * Math.PI * radius
const progressOffset = computed(
  () => circumference - (taskStore.stats.completionRate / 100) * circumference,
)

const statCards = computed(() => [
  {
    label: t('dashboard.stats.allTasks'),
    value: String(taskStore.stats.total),
    note: t('dashboard.stats.completed', { count: taskStore.stats.done }),
    icon: ListTodo,
    iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  {
    label: t('dashboard.stats.inProgress'),
    value: String(taskStore.stats.inProgress),
    note: t('dashboard.stats.waiting', { count: taskStore.stats.todo }),
    icon: TrendingUp,
    iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    label: t('dashboard.stats.completion'),
    value: `${taskStore.stats.completionRate}%`,
    note: t('dashboard.stats.pending', { count: taskStore.stats.pending }),
    icon: Target,
    iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    label: t('dashboard.stats.overdue'),
    value: String(taskStore.stats.overdue),
    note:
      taskStore.stats.overdue > 0
        ? t('dashboard.stats.needsAttention')
        : t('dashboard.stats.healthy'),
    icon: AlarmClock,
    iconClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
])

const priorityRows = computed(() =>
  (['high', 'medium', 'low'] as TaskPriority[]).map((priority) => {
    const count = taskStore.priorityCounts[priority]
    const percentage =
      taskStore.stats.total === 0 ? 0 : Math.round((count / taskStore.stats.total) * 100)

    return {
      priority,
      count,
      percentage,
      label: t(priorityI18nKeys[priority]),
      dotClass: priorityDotStyles[priority],
    }
  }),
)

function openTask(task: Task): void {
  router.push({ name: 'tasks', query: { edit: task.id } })
}
</script>

<template>
  <div class="space-y-6 sm:space-y-8">
    <section class="animate-rise flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <p class="eyebrow">
          <span class="relative flex size-2" aria-hidden="true">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary/40" />
            <span class="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          {{ dateLabel }}
        </p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {{
            t('dashboard.greeting', { greeting, name: auth.user?.name ?? t('auth.user.fallback') })
          }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <i18n-t
            keypath="dashboard.dueToday"
            :plural="taskStore.stats.dueToday"
            tag="span"
            scope="global"
          >
            <template #count>
              <strong class="font-semibold text-foreground">
                {{ taskStore.stats.dueToday }}
              </strong>
            </template>
          </i18n-t>
          <template v-if="taskStore.stats.overdue > 0">
            <i18n-t
              keypath="dashboard.overdue"
              :plural="taskStore.stats.overdue"
              tag="span"
              scope="global"
              class="ml-1"
            >
              <template #count>
                <strong class="font-semibold text-rose-600 dark:text-rose-400">
                  {{ taskStore.stats.overdue }}
                </strong>
              </template>
            </i18n-t>
          </template>
          <span v-else class="ml-1">{{ t('dashboard.healthy') }}</span>
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <RouterLink to="/tasks" class="btn btn-secondary">
          {{ t('dashboard.viewTasks') }}
          <ArrowRight aria-hidden="true" />
        </RouterLink>
        <RouterLink to="/tasks?new=1" class="btn btn-primary">
          <Plus aria-hidden="true" />
          {{ t('dashboard.newTask') }}
        </RouterLink>
      </div>
    </section>

    <section :aria-label="t('dashboard.stats.aria')" class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div
        v-for="(card, index) in statCards"
        :key="card.label"
        class="card card-pad animate-rise"
        :style="{ animationDelay: `${60 + index * 40}ms` }"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="text-xs font-medium text-muted-foreground">{{ card.label }}</p>
          <span class="grid size-9 place-items-center rounded-xl" :class="card.iconClass">
            <component :is="card.icon" class="size-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-2xl font-semibold tracking-tight">{{ card.value }}</p>
        <p class="mt-1 text-[11px] text-muted-foreground">{{ card.note }}</p>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
      <div class="space-y-6">
        <div class="card card-pad animate-rise" style="animation-delay: 220ms">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="section-title">{{ t('dashboard.week.title') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('dashboard.week.subtitle') }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-semibold tracking-tight">{{ weekTotal }}</p>
              <p class="text-[11px] text-muted-foreground">{{ t('dashboard.week.total') }}</p>
            </div>
          </div>

          <div
            class="mt-6 flex h-40 items-end gap-1.5 sm:gap-3"
            role="img"
            :aria-label="t('dashboard.week.aria', { count: weekTotal })"
          >
            <div
              v-for="day in taskStore.weeklyActivity"
              :key="day.dateKey"
              class="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span class="text-[10px] font-medium text-muted-foreground">{{ day.count }}</span>
              <div class="flex w-full flex-1 items-end">
                <div
                  class="w-full rounded-lg transition-[height] duration-500"
                  :class="
                    day.count > 0
                      ? 'bg-gradient-to-t from-primary to-primary/55'
                      : 'bg-muted-foreground/15'
                  "
                  :style="{
                    height: `${day.count > 0 ? Math.max(10, (day.count / maxActivity) * 100) : 5}%`,
                  }"
                  :title="
                    t('dashboard.week.tooltip', {
                      date: formatCalendarDate(day.dateKey),
                      count: day.count,
                    })
                  "
                />
              </div>
              <span class="text-[10px] font-medium text-muted-foreground">{{ day.label }}</span>
            </div>
          </div>
        </div>

        <div class="card animate-rise" style="animation-delay: 280ms">
          <div class="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <p class="section-title">{{ t('dashboard.focus.title') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('dashboard.focus.subtitle') }}
              </p>
            </div>
            <RouterLink
              to="/tasks"
              class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {{ t('dashboard.focus.all') }}
              <ArrowUpRight class="size-3.5" aria-hidden="true" />
            </RouterLink>
          </div>

          <div v-if="taskStore.focusTasks.length > 0" class="mt-3 px-2 pb-3 sm:px-3">
            <TaskListItem
              v-for="task in taskStore.focusTasks"
              :key="task.id"
              :task="task"
              dense
              :show-actions="false"
              @toggle="taskStore.toggleTask"
              @edit="openTask"
            />
          </div>

          <div v-else class="flex flex-col items-center px-6 py-10 text-center">
            <span class="grid size-11 place-items-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2 class="size-5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <p class="mt-3 text-sm font-medium">{{ t('dashboard.focus.emptyTitle') }}</p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t('dashboard.focus.emptyDescription') }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card card-pad animate-rise" style="animation-delay: 240ms">
          <div class="flex items-center justify-between">
            <div>
              <p class="section-title">{{ t('dashboard.progress.title') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('dashboard.progress.subtitle') }}
              </p>
            </div>
            <Sparkles class="size-4 text-accent-foreground" aria-hidden="true" />
          </div>

          <div class="mt-5 flex items-center justify-center">
            <div
              class="relative"
              role="img"
              :aria-label="t('dashboard.progress.aria', { rate: taskStore.stats.completionRate })"
            >
              <svg viewBox="0 0 120 120" class="size-36 -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  :r="radius"
                  fill="none"
                  stroke-width="10"
                  class="stroke-muted"
                />
                <circle
                  cx="60"
                  cy="60"
                  :r="radius"
                  fill="none"
                  stroke-width="10"
                  stroke-linecap="round"
                  class="stroke-primary transition-[stroke-dashoffset] duration-700"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="progressOffset"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-semibold tracking-tight">
                  {{ taskStore.stats.completionRate }}%
                </span>
                <span class="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  {{ t('dashboard.progress.rate') }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div v-for="row in priorityRows" :key="row.priority">
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-1.5 text-muted-foreground">
                  <span class="size-1.5 rounded-full" :class="row.dotClass" aria-hidden="true" />
                  {{ t('dashboard.priority.label', { priority: row.label }) }}
                </span>
                <span class="font-medium text-foreground">{{ row.count }}</span>
              </div>
              <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-[width] duration-500"
                  :class="row.dotClass"
                  :style="{ width: `${row.percentage}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card animate-rise" style="animation-delay: 320ms">
          <div class="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <p class="section-title">{{ t('dashboard.activity.title') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('dashboard.activity.subtitle') }}
              </p>
            </div>
          </div>

          <ol class="mt-3 px-5 pb-5 sm:px-6 sm:pb-6">
            <li
              v-for="task in taskStore.recentActivity"
              :key="task.id"
              class="relative flex gap-3 pb-4 last:pb-0"
            >
              <div class="relative flex flex-col items-center">
                <span
                  class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full"
                  :class="statusStyles[task.status]"
                >
                  <CheckCircle2 v-if="task.status === 'done'" class="size-3.5" aria-hidden="true" />
                  <CircleDashed v-else class="size-3.5" aria-hidden="true" />
                </span>
                <span
                  v-if="task.id !== taskStore.recentActivity.at(-1)?.id"
                  class="mt-1 w-px flex-1 bg-border"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0 flex-1 pt-0.5">
                <p class="truncate text-xs font-medium text-foreground">{{ task.title }}</p>
                <p
                  class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground"
                >
                  <span>{{ t(statusI18nKeys[task.status]) }}</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ formatDateTime(task.updatedAt) }}</span>
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  </div>
</template>
