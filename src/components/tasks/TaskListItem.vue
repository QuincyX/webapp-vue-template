<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Pencil, Trash2 } from '@lucide/vue'

import PriorityBadge from '@/components/tasks/PriorityBadge.vue'
import StatusBadge from '@/components/tasks/StatusBadge.vue'
import TaskCheckbox from '@/components/tasks/TaskCheckbox.vue'
import type { Task } from '@/types/task'
import { formatCalendarDate, formatDueDate, isOverdue } from '@/utils/date'

const props = withDefaults(
  defineProps<{
    task: Task
    dense?: boolean
    showActions?: boolean
  }>(),
  {
    dense: false,
    showActions: true,
  },
)

defineEmits<{
  toggle: [id: string]
  edit: [task: Task]
  remove: [task: Task]
}>()

const { t } = useI18n()

const isTaskOverdue = computed(() => props.task.status !== 'done' && isOverdue(props.task.dueDate))
const dueLabel = computed(() => {
  if (props.task.status === 'done' && isOverdue(props.task.dueDate)) {
    return t('task.due.deadline', { date: formatCalendarDate(props.task.dueDate) })
  }

  return formatDueDate(props.task.dueDate)
})
</script>

<template>
  <article
    class="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition-colors hover:border-border/70 hover:bg-muted/40"
    data-testid="task-item"
  >
    <TaskCheckbox
      :checked="task.status === 'done'"
      :title="task.title"
      @toggle="$emit('toggle', task.id)"
    />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <button
          type="button"
          class="min-w-0 truncate text-left text-sm font-medium text-foreground hover:text-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
          :class="{ 'text-muted-foreground line-through': task.status === 'done' }"
          :aria-label="t('task.edit', { title: task.title })"
          @click="$emit('edit', task)"
        >
          {{ task.title }}
        </button>
        <PriorityBadge :priority="task.priority" />
      </div>

      <p
        v-if="task.description && !dense"
        class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
      >
        {{ task.description }}
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <StatusBadge :status="task.status" />
        <span
          class="inline-flex items-center gap-1 text-[11px] font-medium"
          :class="isTaskOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'"
        >
          <CalendarDays class="size-3.5" aria-hidden="true" />
          {{ dueLabel }}
        </span>
        <span v-for="tag in dense ? task.tags.slice(0, 1) : task.tags" :key="tag" class="chip">
          {{ tag }}
        </span>
      </div>
    </div>

    <div
      v-if="showActions"
      class="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
    >
      <button
        type="button"
        class="icon-btn icon-btn-sm"
        :aria-label="t('task.edit', { title: task.title })"
        @click="$emit('edit', task)"
      >
        <Pencil />
      </button>
      <button
        type="button"
        class="icon-btn icon-btn-sm hover:text-rose-600 dark:hover:text-rose-400"
        :aria-label="t('task.remove', { title: task.title })"
        @click="$emit('remove', task)"
      >
        <Trash2 />
      </button>
    </div>
  </article>
</template>
