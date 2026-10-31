import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { isApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'
import { registerInputSchema, type RegisterInput } from '@/types/auth'

export interface RegisterFormState {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterFormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

/**
 * Sign-up form. The confirm-password field is form state only: it is validated
 * here and never sent to the API.
 */
export function useRegisterForm() {
  const { t } = useI18n()
  const auth = useAuthStore()

  const form = reactive<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const errors = reactive<RegisterFormErrors>({})
  const formError = ref('')
  const showPassword = ref(false)
  const submitting = computed(() => auth.pending)

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

  /** Resolves to whether the account was created; failures land in `formError`. */
  async function submit(): Promise<boolean> {
    if (!validate()) return false

    const input: RegisterInput = {
      name: form.name,
      email: form.email,
      password: form.password,
    }

    try {
      await auth.register(input)
      return true
    } catch (error) {
      formError.value = resolveSubmitError(error)
      return false
    }
  }

  function reset(): void {
    form.name = ''
    form.email = ''
    form.password = ''
    form.confirmPassword = ''
    showPassword.value = false
    resetErrors()
  }

  return {
    form,
    errors,
    formError,
    showPassword,
    submitting,
    validate,
    submit,
    reset,
  }
}
