<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from '@lucide/vue'

import { isApiError } from '@/api/errors'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { registerInputSchema, type RegisterInput } from '@/types/auth'
import { getSafeRedirect } from '@/utils/redirect'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { toast } = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const errors = reactive<{
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}>({})
const formError = ref('')
const showPassword = ref(false)
const submitting = computed(() => auth.pending)

const loginLink = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  return redirect ? { name: 'login', query: { redirect } } : { name: 'login' }
})

function resetErrors(): void {
  errors.name = undefined
  errors.email = undefined
  errors.password = undefined
  errors.confirmPassword = undefined
  formError.value = ''
}

function validate(): boolean {
  resetErrors()
  const result = registerInputSchema.safeParse({
    name: form.name,
    email: form.email,
    password: form.password,
  })

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if ((field === 'name' || field === 'email' || field === 'password') && !errors[field]) {
        errors[field] = t(issue.message)
      }
    }
  }

  if (!errors.password && form.password !== form.confirmPassword) {
    errors.confirmPassword = t('auth.validation.passwordMismatch')
  }

  return !errors.name && !errors.email && !errors.password && !errors.confirmPassword
}

function resolveSubmitError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 409) return t('auth.error.emailInUse')
    if (error.status === 400) return t('auth.error.invalidRegistration')
    if (error.status === 429) return t('auth.error.tooManyAttempts')
    if (error.code === 'network' || error.code === 'timeout') return t('auth.error.network')
  }

  return t('auth.error.generic')
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  const input: RegisterInput = {
    name: form.name,
    email: form.email,
    password: form.password,
  }

  try {
    await auth.register(input)
    toast({ title: t('auth.register.success'), variant: 'success' })
    const target = getSafeRedirect(route.query.redirect, '/')
    await router.replace(target)
  } catch (error) {
    formError.value = resolveSubmitError(error)
  }
}
</script>

<template>
  <div class="animate-rise">
    <p class="eyebrow">{{ t('auth.register.eyebrow') }}</p>
    <h2 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">
      {{ t('auth.register.title') }}
    </h2>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      {{ t('auth.register.subtitle') }}
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="register-name" class="field-label">{{ t('auth.fields.name') }}</label>
        <div class="relative">
          <UserRound
            class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="register-name"
            v-model="form.name"
            type="text"
            name="name"
            autocomplete="name"
            class="input pl-10"
            :class="{ 'border-rose-500 focus:ring-rose-500/20': errors.name }"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'register-name-error' : undefined"
            :placeholder="t('auth.fields.namePlaceholder')"
            :disabled="submitting"
            @input="errors.name = undefined"
          />
        </div>
        <p v-if="errors.name" id="register-name-error" class="field-error" role="alert">
          {{ errors.name }}
        </p>
      </div>

      <div>
        <label for="register-email" class="field-label">{{ t('auth.fields.email') }}</label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="register-email"
            v-model="form.email"
            type="email"
            name="email"
            autocomplete="email"
            inputmode="email"
            class="input pl-10"
            :class="{ 'border-rose-500 focus:ring-rose-500/20': errors.email }"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'register-email-error' : undefined"
            :placeholder="t('auth.fields.emailPlaceholder')"
            :disabled="submitting"
            @input="errors.email = undefined"
          />
        </div>
        <p v-if="errors.email" id="register-email-error" class="field-error" role="alert">
          {{ errors.email }}
        </p>
      </div>

      <div>
        <label for="register-password" class="field-label">{{ t('auth.fields.password') }}</label>
        <div class="relative">
          <LockKeyhole
            class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="register-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            autocomplete="new-password"
            class="input pr-11 pl-10"
            :class="{ 'border-rose-500 focus:ring-rose-500/20': errors.password }"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="
              errors.password ? 'register-password-error' : 'register-password-hint'
            "
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
        <p v-if="errors.password" id="register-password-error" class="field-error" role="alert">
          {{ errors.password }}
        </p>
        <p v-else id="register-password-hint" class="field-hint">
          {{ t('auth.fields.passwordHint') }}
        </p>
      </div>

      <div>
        <label for="register-confirm-password" class="field-label">
          {{ t('auth.fields.confirmPassword') }}
        </label>
        <input
          id="register-confirm-password"
          v-model="form.confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          name="confirmPassword"
          autocomplete="new-password"
          class="input"
          :class="{ 'border-rose-500 focus:ring-rose-500/20': errors.confirmPassword }"
          :aria-invalid="Boolean(errors.confirmPassword)"
          :aria-describedby="errors.confirmPassword ? 'register-confirm-error' : undefined"
          :placeholder="t('auth.fields.confirmPasswordPlaceholder')"
          :disabled="submitting"
          @input="errors.confirmPassword = undefined"
        />
        <p
          v-if="errors.confirmPassword"
          id="register-confirm-error"
          class="field-error"
          role="alert"
        >
          {{ errors.confirmPassword }}
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
        <span>{{ submitting ? t('auth.register.submitting') : t('auth.register.submit') }}</span>
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      {{ t('auth.register.hasAccount') }}
      <RouterLink :to="loginLink" class="font-semibold text-foreground hover:underline">
        {{ t('auth.login.submit') }}
      </RouterLink>
    </p>
  </div>
</template>
