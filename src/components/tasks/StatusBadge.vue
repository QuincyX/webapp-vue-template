<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { statusI18nKeys, statusStyles } from '@/constants/task'
import type { TaskStatus } from '@/types/task'

defineProps<{
  status: TaskStatus
}>()

const { t } = useI18n()
</script>

<template>
  <span class="badge" :class="statusStyles[status]">
    <span class="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
    {{ t(statusI18nKeys[status]) }}
  </span>
</template>
