import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

import { TASKS_STORAGE_KEY, compareTasks, createSeedTasks, useTaskStore } from '@/stores/tasks'
import type { TaskDraft } from '@/types/task'

function makeDraft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: '准备发布说明',
    description: '整理变更记录与升级指引。',
    status: 'todo',
    priority: 'high',
    dueDate: null,
    tags: ['发布'],
    ...overrides,
  }
}

describe('task store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 26, 9, 0, 0))
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hydrates the demo tasks on first visit', () => {
    const store = useTaskStore()

    expect(store.tasks).toHaveLength(createSeedTasks().length)
    expect(store.stats.total).toBe(8)
    expect(store.stats.done).toBe(3)
    expect(store.stats.pending).toBe(5)
    expect(store.focusTasks[0]?.status).not.toBe('done')
    expect(store.weeklyActivity).toHaveLength(7)
  })

  it('creates a task and persists it to localStorage', async () => {
    const store = useTaskStore()
    const created = store.createTask(makeDraft({ dueDate: '2026-10-28' }))

    expect(created.id).toBeTruthy()
    expect(store.tasks).toHaveLength(9)
    expect(store.stats.total).toBe(9)

    await nextTick()

    const persisted = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) ?? '[]') as unknown[]
    expect(persisted).toHaveLength(9)
    expect(store.tasks.find((task) => task.id === created.id)?.dueDate).toBe('2026-10-28')
  })

  it('toggles a task to done and updates the completion rate', async () => {
    const store = useTaskStore()
    const target = store.tasks.find((task) => task.status !== 'done')

    expect(target).toBeDefined()
    if (!target) return

    store.toggleTask(target.id)

    expect(store.tasks.find((task) => task.id === target.id)?.status).toBe('done')
    expect(store.stats.completionRate).toBe(50)

    await nextTick()
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toContain('"status":"done"')
  })

  it('removes a task', () => {
    const store = useTaskStore()
    const target = store.tasks[0]

    expect(target).toBeDefined()
    if (!target) return

    store.removeTask(target.id)
    expect(store.tasks).toHaveLength(7)
    expect(store.tasks.some((task) => task.id === target.id)).toBe(false)
  })

  it('round-trips exported data through the import boundary', () => {
    const store = useTaskStore()
    const exported = store.exportTasks()

    store.clearTasks()
    expect(store.tasks).toHaveLength(0)

    const count = store.importTasks(JSON.parse(exported))

    expect(count).toBe(8)
    expect(store.tasks).toHaveLength(8)
  })

  it('rejects malformed imported data', () => {
    const store = useTaskStore()
    const task = { ...store.tasks[0], dueDate: 'not-a-date' }

    expect(() => store.importTasks([task])).toThrow(ZodError)
    expect(store.tasks).toHaveLength(8)
  })

  it('sorts unfinished tasks before completed tasks', () => {
    const store = useTaskStore()
    const sorted = [...store.tasks].sort(compareTasks)
    const firstCompletedIndex = sorted.findIndex((task) => task.status === 'done')

    expect(firstCompletedIndex).toBeGreaterThan(0)
    expect(sorted.slice(firstCompletedIndex).every((task) => task.status === 'done')).toBe(true)
  })

  it('resets the demo tasks', () => {
    const store = useTaskStore()
    store.clearTasks()
    store.resetDemoData()

    expect(store.tasks).toHaveLength(8)
    expect(store.stats.done).toBe(3)
  })
})
