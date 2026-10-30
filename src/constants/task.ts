import type { TaskPriority, TaskStatus } from '@/types/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/task'

export const statusI18nKeys: Record<TaskStatus, string> = {
  todo: 'task.status.todo',
  'in-progress': 'task.status.inProgress',
  done: 'task.status.done',
}

export const statusStyles: Record<TaskStatus, string> = {
  todo: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
  'in-progress': 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
  done: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
}

export const priorityI18nKeys: Record<TaskPriority, string> = {
  low: 'task.priority.low',
  medium: 'task.priority.medium',
  high: 'task.priority.high',
}

export const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
  medium: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
  high: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
}

export const priorityDotStyles: Record<TaskPriority, string> = {
  low: 'bg-sky-500',
  medium: 'bg-violet-500',
  high: 'bg-rose-500',
}

export const priorityRank: Record<TaskPriority, number> = {
  low: 2,
  medium: 1,
  high: 0,
}

export const statusOptions = TASK_STATUSES.map((value) => ({
  value,
  labelKey: statusI18nKeys[value],
}))

export const priorityOptions = TASK_PRIORITIES.map((value) => ({
  value,
  labelKey: priorityI18nKeys[value],
}))
