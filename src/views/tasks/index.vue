<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Inbox, Plus, Search, Sparkles } from '@lucide/vue'

import BaseModal from '@/components/ui/BaseModal.vue'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import TaskListItem from '@/components/tasks/TaskListItem.vue'
import { priorityOptions, priorityRank, statusI18nKeys } from '@/constants/task'
import { useToast } from '@/composables/useToast'
import { compareTasks, useTaskStore } from '@/stores/tasks'
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '@/types/task'

type StatusFilter = 'all' | TaskStatus
type SortOption = 'due' | 'priority' | 'updated'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const { toast } = useToast()

const statusFilter = ref<StatusFilter>('all')
const priorityFilter = ref<'all' | TaskPriority>('all')
const sortBy = ref<SortOption>('due')
const searchQuery = ref('')

const showForm = ref(false)
const editingTask = ref<Task | null>(null)
const taskToDelete = ref<Task | null>(null)

const statusFilters = computed<{ value: StatusFilter; label: string; count: number }[]>(() => [
  { value: 'all', label: t('tasks.statusAll'), count: taskStore.stats.total },
  { value: 'todo', label: t(statusI18nKeys.todo), count: taskStore.statusCounts.todo },
  {
    value: 'in-progress',
    label: t(statusI18nKeys['in-progress']),
    count: taskStore.statusCounts['in-progress'],
  },
  { value: 'done', label: t(statusI18nKeys.done), count: taskStore.statusCounts.done },
])

const filteredTasks = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase()

  const result = taskStore.tasks.filter((task) => {
    if (statusFilter.value !== 'all' && task.status !== statusFilter.value) return false
    if (priorityFilter.value !== 'all' && task.priority !== priorityFilter.value) return false
    if (!normalizedQuery) return true

    const searchable = [task.title, task.description, ...task.tags].join(' ').toLowerCase()
    return searchable.includes(normalizedQuery)
  })

  return result.sort((left, right) => {
    if (sortBy.value === 'priority') {
      return priorityRank[left.priority] - priorityRank[right.priority] || compareTasks(left, right)
    }

    if (sortBy.value === 'updated') {
      return right.updatedAt.localeCompare(left.updatedAt)
    }

    return compareTasks(left, right)
  })
})

const hasActiveFilters = computed(
  () =>
    statusFilter.value !== 'all' ||
    priorityFilter.value !== 'all' ||
    searchQuery.value.trim().length > 0,
)

function openCreate(): void {
  editingTask.value = null
  showForm.value = true
}

function openEdit(task: Task): void {
  editingTask.value = task
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editingTask.value = null
}

function handleSave(draft: TaskDraft): void {
  if (editingTask.value) {
    taskStore.updateTask(editingTask.value.id, draft)
    toast({ title: t('tasks.toastUpdated'), variant: 'success' })
  } else {
    taskStore.createTask(draft)
    toast({
      title: t('tasks.toastCreated'),
      description: t('tasks.toastCreatedDescription'),
      variant: 'success',
    })
  }

  closeForm()
}

function handleToggle(id: string): void {
  taskStore.toggleTask(id)
}

function requestDelete(task: Task): void {
  taskToDelete.value = task
}

function confirmDelete(): void {
  if (!taskToDelete.value) return

  const title = taskToDelete.value.title
  taskStore.removeTask(taskToDelete.value.id)
  taskToDelete.value = null
  toast({
    title: t('tasks.toastDeleted'),
    description: t('tasks.toastDeletedDescription', { title }),
    variant: 'success',
  })
}

function clearFilters(): void {
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  searchQuery.value = ''
}

function removeQueryKey(key: string): void {
  if (!(key in route.query)) return

  const query = { ...route.query }
  delete query[key]
  void router.replace({ query })
}

function consumeRouteQuery(): void {
  const editId = route.query.edit

  if (typeof editId === 'string') {
    const task = taskStore.tasks.find((item) => item.id === editId)
    if (task) openEdit(task)
    removeQueryKey('edit')
  }

  if (route.query.new === '1') {
    openCreate()
    removeQueryKey('new')
  }
}

onMounted(consumeRouteQuery)
watch(() => route.fullPath, consumeRouteQuery)
</script>

<template>
  <div class="space-y-6 sm:space-y-8">
    <section class="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="eyebrow">
          <Sparkles class="size-3.5" aria-hidden="true" />
          {{ t('tasks.eyebrow') }}
        </p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {{ t('tasks.title') }}
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {{
            t('tasks.summary', {
              total: taskStore.stats.total,
              pending: taskStore.stats.pending,
              done: taskStore.stats.done,
            })
          }}
        </p>
      </div>

      <button type="button" class="btn btn-primary shrink-0" @click="openCreate">
        <Plus aria-hidden="true" />
        {{ t('tasks.newTask') }}
      </button>
    </section>

    <section class="card animate-rise overflow-hidden" style="animation-delay: 80ms">
      <div class="border-b border-border/70 p-3 sm:p-4">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div
            class="flex w-full gap-1 overflow-x-auto rounded-xl bg-muted/70 p-1 xl:w-auto"
            role="group"
            :aria-label="t('tasks.filtersLabel')"
          >
            <button
              v-for="filter in statusFilters"
              :key="filter.value"
              type="button"
              :aria-pressed="statusFilter === filter.value"
              class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              :class="
                statusFilter === filter.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="statusFilter = filter.value"
            >
              {{ filter.label }}
              <span
                class="min-w-4 rounded-full px-1 text-center text-[10px]"
                :class="
                  statusFilter === filter.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground/70'
                "
              >
                {{ filter.count }}
              </span>
            </button>
          </div>

          <div class="flex flex-1 flex-col gap-2 sm:flex-row xl:justify-end">
            <label class="relative block flex-1 xl:max-w-64">
              <span class="sr-only">{{ t('tasks.searchLabel') }}</span>
              <Search
                class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                v-model="searchQuery"
                type="search"
                class="input h-10 pl-9"
                :placeholder="t('tasks.searchPlaceholder')"
              />
            </label>

            <select
              v-model="priorityFilter"
              class="select h-10 w-full py-0 sm:w-36"
              :aria-label="t('tasks.priorityFilterLabel')"
            >
              <option value="all">{{ t('tasks.priorityAll') }}</option>
              <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>

            <select
              v-model="sortBy"
              class="select h-10 w-full py-0 sm:w-32"
              :aria-label="t('tasks.sortLabel')"
            >
              <option value="due">{{ t('tasks.sortDue') }}</option>
              <option value="priority">{{ t('tasks.sortPriority') }}</option>
              <option value="updated">{{ t('tasks.sortUpdated') }}</option>
            </select>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-10 items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground"
      >
        <span>
          {{ t('tasks.showing', { shown: filteredTasks.length, total: taskStore.stats.total }) }}
        </span>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="font-medium text-primary hover:underline"
          @click="clearFilters"
        >
          {{ t('tasks.clearFilters') }}
        </button>
      </div>

      <div v-if="filteredTasks.length > 0" class="p-2 sm:p-3">
        <TaskListItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @edit="openEdit"
          @remove="requestDelete"
        />
      </div>

      <div v-else class="flex flex-col items-center px-6 py-16 text-center">
        <span class="grid size-12 place-items-center rounded-2xl bg-muted">
          <Inbox class="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <template v-if="taskStore.tasks.length === 0">
          <p class="mt-4 text-sm font-semibold">{{ t('tasks.emptyTitle') }}</p>
          <p class="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {{ t('tasks.emptyDescription') }}
          </p>
          <button type="button" class="btn btn-primary btn-sm mt-4" @click="openCreate">
            <Plus aria-hidden="true" />
            {{ t('tasks.emptyAction') }}
          </button>
        </template>
        <template v-else>
          <p class="mt-4 text-sm font-semibold">{{ t('tasks.noMatchTitle') }}</p>
          <p class="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {{ t('tasks.noMatchDescription') }}
          </p>
          <button type="button" class="btn btn-secondary btn-sm mt-4" @click="clearFilters">
            {{ t('tasks.noMatchAction') }}
          </button>
        </template>
      </div>
    </section>

    <TaskFormModal :open="showForm" :task="editingTask" @close="closeForm" @submit="handleSave" />

    <BaseModal
      :open="Boolean(taskToDelete)"
      :title="t('tasks.deleteTitle')"
      :description="t('tasks.deleteDescription')"
      size="sm"
      @close="taskToDelete = null"
    >
      <div class="rounded-xl border border-border/70 bg-muted/50 p-3 text-sm font-medium">
        {{ taskToDelete?.title }}
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost btn-sm" @click="taskToDelete = null">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-danger btn-sm" @click="confirmDelete">
          {{ t('tasks.deleteConfirm') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
