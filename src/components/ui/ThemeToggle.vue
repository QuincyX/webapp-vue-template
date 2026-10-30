<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Moon, Sun } from '@lucide/vue'

import { useTheme } from '@/composables/useTheme'

const { t } = useI18n()
const { isDark, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    :aria-label="isDark ? t('theme.toLight') : t('theme.toDark')"
    :title="isDark ? t('theme.toLight') : t('theme.toDark')"
    @click="toggle"
  >
    <Sun v-if="isDark" />
    <Moon v-else />
  </button>
</template>
