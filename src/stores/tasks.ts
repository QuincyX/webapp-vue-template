import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { priorityRank } from '@/constants/task'
import { createSeedTasks } from '@/data/tasks'
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '@/types/task'
import { taskListSchema } from '@/types/task'
import { formatWeekday, isOverdue, toDateKey } from '@/utils/date'

export const TASKS_STORAGE_KEY = 'orbit.tasks.v1'

export { createSeedTasks }

function dueDateSortValue(task: Task): string {
  return task.dueDate ?? '9999-12-31'
}

export function compareTasks(left: Task, right: Task): number {
  const leftCompleted = left.status === 'done'
  const rightCompleted = right.status === 'done'
  if (leftCompleted !== rightCompleted) return leftCompleted ? 1 : -1

  const dueDateComparison = dueDateSortValue(left).localeCompare(dueDateSortValue(right))
  if (dueDateComparison !== 0) return dueDateComparison

  const priorityComparison = priorityRank[left.priority] - priorityRank[right.priority]
  if (priorityComparison !== 0) return priorityComparison

  return right.updatedAt.localeCompare(left.updatedAt)
}

function loadTasks(): Task[] {
  if (typeof localStorage === 'undefined') return createSeedTasks()

  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    if (!raw) return createSeedTasks()

    const parsed: unknown = JSON.parse(raw)
    const result = taskListSchema.safeParse(parsed)
    return result.success ? result.data : createSeedTasks()
  } catch {
    return createSeedTasks()
  }
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>(loadTasks())

  function persist(): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks.value))
    } catch {
      // Persistence is a progressive enhancement. The app remains usable without it.
    }
  }

  watch(tasks, persist, { deep: true })

  const statusCounts = computed<Record<TaskStatus, number>>(() => ({
    todo: tasks.value.filter((task) => task.status === 'todo').length,
    'in-progress': tasks.value.filter((task) => task.status === 'in-progress').length,
    done: tasks.value.filter((task) => task.status === 'done').length,
  }))

  const priorityCounts = computed<Record<TaskPriority, number>>(() => ({
    low: tasks.value.filter((task) => task.priority === 'low').length,
    medium: tasks.value.filter((task) => task.priority === 'medium').length,
    high: tasks.value.filter((task) => task.priority === 'high').length,
  }))

  const stats = computed(() => {
    const total = tasks.value.length
    const done = statusCounts.value.done
    const pendingTasks = tasks.value.filter((task) => task.status !== 'done')

    return {
      total,
      done,
      pending: total - done,
      inProgress: statusCounts.value['in-progress'],
      todo: statusCounts.value.todo,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
      overdue: pendingTasks.filter((task) => isOverdue(task.dueDate)).length,
      dueToday: pendingTasks.filter((task) => task.dueDate === toDateKey(new Date())).length,
    }
  })

  const pendingTasks = computed(() =>
    tasks.value.filter((task) => task.status !== 'done').sort(compareTasks),
  )

  const focusTasks = computed(() => pendingTasks.value.slice(0, 4))

  const upcomingTasks = computed(() =>
    tasks.value
      .filter((task) => task.status !== 'done' && task.dueDate)
      .sort(compareTasks)
      .slice(0, 4),
  )

  const recentActivity = computed(() =>
    [...tasks.value]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 5),
  )

  const weeklyActivity = computed(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))

      const dateKey = toDateKey(date)
      const count = tasks.value.filter(
        (task) => task.status === 'done' && toDateKey(task.updatedAt) === dateKey,
      ).length

      return {
        dateKey,
        label: formatWeekday(date),
        count,
      }
    })
  })

  const completedThisWeek = computed(() =>
    weeklyActivity.value.reduce((total, day) => total + day.count, 0),
  )

  function createTask(draft: TaskDraft): Task {
    const timestamp = new Date().toISOString()
    const task: Task = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    tasks.value.unshift(task)
    return task
  }

  function updateTask(id: string, draft: TaskDraft): Task | null {
    const index = tasks.value.findIndex((task) => task.id === id)
    const existing = tasks.value[index]

    if (!existing) return null

    const updated: Task = {
      ...existing,
      ...draft,
      updatedAt: new Date().toISOString(),
    }

    tasks.value.splice(index, 1, updated)
    return updated
  }

  function toggleTask(id: string): void {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return

    task.status = task.status === 'done' ? 'todo' : 'done'
    task.updatedAt = new Date().toISOString()
  }

  function removeTask(id: string): void {
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  function resetDemoData(): void {
    tasks.value = createSeedTasks()
  }

  function clearTasks(): void {
    tasks.value = []
  }

  function exportTasks(): string {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks: tasks.value,
      },
      null,
      2,
    )
  }

  function importTasks(payload: unknown): number {
    const candidate =
      payload && typeof payload === 'object' && 'tasks' in payload
        ? (payload as { tasks: unknown }).tasks
        : payload

    const parsed = taskListSchema.parse(candidate)
    tasks.value = parsed
    persist()
    return parsed.length
  }

  return {
    tasks,
    stats,
    statusCounts,
    priorityCounts,
    pendingTasks,
    focusTasks,
    upcomingTasks,
    recentActivity,
    weeklyActivity,
    completedThisWeek,
    createTask,
    updateTask,
    toggleTask,
    removeTask,
    resetDemoData,
    clearTasks,
    exportTasks,
    importTasks,
  }
})
