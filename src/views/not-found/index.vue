<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Compass } from '@lucide/vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center py-10">
    <div class="animate-rise max-w-md text-center">
      <span
        class="mx-auto grid size-16 place-items-center rounded-3xl bg-accent text-accent-foreground"
      >
        <Compass class="size-7" aria-hidden="true" />
      </span>
      <p class="mt-6 font-mono text-xs font-semibold tracking-[0.2em] text-muted-foreground">
        {{ t('notFound.eyebrow') }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight text-balance">
        {{ t('notFound.title') }}
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        {{ t('notFound.description') }}
      </p>
      <RouterLink to="/" class="btn btn-primary mt-6">
        <ArrowLeft aria-hidden="true" />
        {{ t('notFound.back') }}
      </RouterLink>
    </div>
  </div>
</template>
