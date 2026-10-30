import { z } from 'zod'

export const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export const taskStatusSchema = z.enum(TASK_STATUSES)
export const taskPrioritySchema = z.enum(TASK_PRIORITIES)

const datePattern = /^\d{4}-\d{2}-\d{2}$/

const sharedTaskFields = {
  title: z.string().trim().min(2, 'validation.taskTitleMin').max(80, 'validation.taskTitleMax'),
  description: z.string().trim().max(300, 'validation.descriptionMax').default(''),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  tags: z.array(z.string().trim().min(1).max(20)).max(5, 'validation.tagsMax').default([]),
}

const dueDateInputSchema = z
  .string()
  .refine((value) => value === '' || datePattern.test(value), 'validation.dueDateInvalid')
  .transform((value) => value || null)

export const taskDraftSchema = z.object({
  ...sharedTaskFields,
  dueDate: dueDateInputSchema,
})

export const taskSchema = z.object({
  id: z.string().min(1),
  ...sharedTaskFields,
  dueDate: z.union([z.string().regex(datePattern), z.null()]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const taskListSchema = z.array(taskSchema)

export type TaskStatus = z.infer<typeof taskStatusSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export type TaskDraft = z.infer<typeof taskDraftSchema>
export type Task = z.infer<typeof taskSchema>
