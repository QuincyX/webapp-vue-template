<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { priorityDotStyles, priorityI18nKeys, priorityStyles } from '@/constants/task'
import type { TaskPriority } from '@/types/task'

defineProps<{
  priority: TaskPriority
}>()

const { t } = useI18n()
</script>

<template>
  <span class="badge" :class="priorityStyles[priority]">
    <span class="size-1.5 rounded-full" :class="priorityDotStyles[priority]" aria-hidden="true" />
    {{ t('task.priority.badge', { priority: t(priorityI18nKeys[priority]) }) }}
  </span>
</template>
