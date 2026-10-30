<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseModal from '@/components/ui/BaseModal.vue'
import { priorityOptions, statusOptions } from '@/constants/task'
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '@/types/task'
import { taskDraftSchema } from '@/types/task'

const props = withDefaults(
  defineProps<{
    open: boolean
    task?: Task | null
  }>(),
  {
    task: null,
  },
)

const emit = defineEmits<{
  close: []
  submit: [draft: TaskDraft]
}>()

interface TaskFormState {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  tags: string
}

const { t, locale } = useI18n()

const form = reactive<TaskFormState>({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tags: '',
})

const errors = reactive<Record<string, string>>({})
const titleInput = ref<HTMLInputElement | null>(null)

function resetForm(): void {
  const source = props.task
  const tagSeparator = locale.value.startsWith('zh') ? '，' : ', '

  form.title = source?.title ?? ''
  form.description = source?.description ?? ''
  form.status = source?.status ?? 'todo'
  form.priority = source?.priority ?? 'medium'
  form.dueDate = source?.dueDate ?? ''
  form.tags = source?.tags.join(tagSeparator) ?? ''

  for (const key of Object.keys(errors)) delete errors[key]
}

function normalizeTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 5)
}

function clearError(field: string): void {
  delete errors[field]
}

function handleSubmit(): void {
  const result = taskDraftSchema.safeParse({
    title: form.title,
    description: form.description,
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate,
    tags: normalizeTags(form.tags),
  })

  if (!result.success) {
    for (const key of Object.keys(errors)) delete errors[key]

    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !errors[field]) {
        errors[field] = t(issue.message)
      }
    }

    return
  }

  emit('submit', result.data)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return

    resetForm()
    await nextTick()
    titleInput.value?.focus()
  },
)
</script>

<template>
  <BaseModal
    :open="open"
    :title="task ? t('taskForm.editTitle') : t('taskForm.createTitle')"
    :description="task ? t('taskForm.editDescription') : t('taskForm.createDescription')"
    size="lg"
    @close="emit('close')"
  >
    <form id="task-form" class="space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="task-title" class="field-label">
          <span>{{ t('taskForm.title') }}</span>
          <span class="text-[11px] font-normal text-muted-foreground">
            {{ t('common.required') }}
          </span>
        </label>
        <input
          id="task-title"
          ref="titleInput"
          v-model="form.title"
          type="text"
          class="input"
          maxlength="80"
          :placeholder="t('taskForm.titlePlaceholder')"
          data-autofocus
          :aria-invalid="Boolean(errors.title)"
          :aria-describedby="errors.title ? 'task-title-error' : undefined"
          @input="clearError('title')"
        />
        <p v-if="errors.title" id="task-title-error" class="field-error">{{ errors.title }}</p>
      </div>

      <div>
        <label for="task-description" class="field-label">
          <span>{{ t('taskForm.description') }}</span>
          <span class="text-[11px] font-normal text-muted-foreground">
            {{ t('common.optional') }}
          </span>
        </label>
        <textarea
          id="task-description"
          v-model="form.description"
          class="textarea"
          maxlength="300"
          :placeholder="t('taskForm.descriptionPlaceholder')"
          @input="clearError('description')"
        />
        <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="task-due-date" class="field-label">{{ t('taskForm.dueDate') }}</label>
          <input
            id="task-due-date"
            v-model="form.dueDate"
            type="date"
            class="input"
            @input="clearError('dueDate')"
          />
          <p v-if="errors.dueDate" class="field-error">{{ errors.dueDate }}</p>
        </div>

        <div>
          <label for="task-priority" class="field-label">{{ t('taskForm.priority') }}</label>
          <select id="task-priority" v-model="form.priority" class="select">
            <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </option>
          </select>
        </div>

        <div>
          <label for="task-status" class="field-label">{{ t('taskForm.status') }}</label>
          <select id="task-status" v-model="form.status" class="select">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label for="task-tags" class="field-label">
          <span>{{ t('taskForm.tags') }}</span>
          <span class="text-[11px] font-normal text-muted-foreground">
            {{ t('taskForm.tagsMax') }}
          </span>
        </label>
        <input
          id="task-tags"
          v-model="form.tags"
          type="text"
          class="input"
          :placeholder="t('taskForm.tagsPlaceholder')"
          @input="clearError('tags')"
        />
        <p class="field-hint">{{ t('taskForm.tagsHint') }}</p>
        <p v-if="errors.tags" class="field-error">{{ errors.tags }}</p>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('close')">
        {{ t('common.cancel') }}
      </button>
      <button type="submit" form="task-form" class="btn btn-primary btn-sm">
        {{ task ? t('taskForm.save') : t('taskForm.create') }}
      </button>
    </template>
  </BaseModal>
</template>
