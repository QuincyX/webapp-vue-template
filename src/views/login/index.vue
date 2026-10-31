<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from '@lucide/vue'

import { useLoginForm } from '@/composables/useLoginForm'
import { useToast } from '@/composables/useToast'
import { getSafeRedirect } from '@/utils/redirect'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { toast } = useToast()

const { form, errors, formError, showPassword, submitting, submit } = useLoginForm()
const showDemoHint = import.meta.env.DEV

const registerLink = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  return redirect ? { name: 'register', query: { redirect } } : { name: 'register' }
})

async function handleSubmit(): Promise<void> {
  if (!(await submit())) return

  toast({ title: t('auth.login.success'), variant: 'success' })
  await router.replace(getSafeRedirect(route.query.redirect, '/'))
}
</script>

<template>
  <div class="animate-rise">
    <p class="eyebrow">{{ t('auth.login.eyebrow') }}</p>
    <h2 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">
      {{ t('auth.login.title') }}
    </h2>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      {{ t('auth.login.subtitle') }}
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="login-email" class="field-label">{{ t('auth.fields.email') }}</label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            name="email"
            autocomplete="email"
            inputmode="email"
            class="input pl-10"
            :class="{ 'border-rose-500 focus:ring-rose-500/20': errors.email }"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'login-email-error' : undefined"
            :placeholder="t('auth.fields.emailPlaceholder')"
            :disabled="submitting"
            @input="errors.email = undefined"
          />
        </div>
        <p v-if="errors.email" id="login-email-error" class="field-error" role="alert">
          {{ errors.email }}
        </p>
      </div>

      <div>
        <label for="login-password" class="field-label">{{ t('auth.fields.password') }}</label>
        <div class="relative">
          <LockKeyhole
            class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            autocomplete="current-password"
            class="input pr-11 pl-10"
            :class="{ 'border-rose-500 focus:ring-rose-500/20': errors.password }"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'login-password-error' : undefined"
            :placeholder="t('auth.fields.passwordPlaceholder')"
            :disabled="submitting"
            @input="errors.password = undefined"
          />
          <button
            type="button"
            class="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="
              showPassword ? t('auth.fields.hidePassword') : t('auth.fields.showPassword')
            "
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-4" aria-hidden="true" />
            <Eye v-else class="size-4" aria-hidden="true" />
          </button>
        </div>
        <p v-if="errors.password" id="login-password-error" class="field-error" role="alert">
          {{ errors.password }}
        </p>
      </div>

      <p
        v-if="formError"
        class="rounded-xl border border-rose-500/25 bg-rose-500/5 px-3.5 py-3 text-xs font-medium text-rose-700 dark:text-rose-300"
        role="alert"
      >
        {{ formError }}
      </p>

      <button type="submit" class="btn btn-primary w-full" :disabled="submitting">
        <LoaderCircle v-if="submitting" class="animate-spin" aria-hidden="true" />
        <span>{{ submitting ? t('auth.login.submitting') : t('auth.login.submit') }}</span>
      </button>
    </form>

    <p
      v-if="showDemoHint"
      class="mt-5 rounded-xl border border-border/70 bg-muted/50 px-3.5 py-3 text-xs leading-5 text-muted-foreground"
    >
      {{ t('auth.login.demoHint') }}
      <code class="font-mono text-[11px] text-foreground">demo@orbit.app</code> /
      <code class="font-mono text-[11px] text-foreground">OrbitDemo123!</code>
    </p>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      {{ t('auth.login.noAccount') }}
      <RouterLink :to="registerLink" class="font-semibold text-foreground hover:underline">
        {{ t('auth.login.createAccount') }}
      </RouterLink>
    </p>
  </div>
</template>
