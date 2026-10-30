import type { Task, TaskDraft } from '@/types/task'
import { taskListSchema, taskSchema } from '@/types/task'
import { request } from './http'

/**
 * Expected backend contract: JSON arrays/objects that match the local Zod
 * schemas. Adapt the paths or envelope here if your API differs.
 */
export const taskApi = {
  list: async (signal?: AbortSignal): Promise<Task[]> => {
    const payload = await request<unknown>({
      url: '/tasks',
      method: 'GET',
      signal,
    })

    return taskListSchema.parse(payload)
  },

  create: async (draft: TaskDraft): Promise<Task> => {
    const payload = await request<unknown>({
      url: '/tasks',
      method: 'POST',
      data: draft,
    })

    return taskSchema.parse(payload)
  },

  update: async (id: string, draft: TaskDraft): Promise<Task> => {
    const payload = await request<unknown>({
      url: `/tasks/${encodeURIComponent(id)}`,
      method: 'PUT',
      data: draft,
    })

    return taskSchema.parse(payload)
  },

  remove: async (id: string): Promise<void> => {
    await request<void>({
      url: `/tasks/${encodeURIComponent(id)}`,
      method: 'DELETE',
    })
  },
}
