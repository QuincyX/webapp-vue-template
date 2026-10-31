import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { isApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'
import { loginInputSchema, type LoginInput } from '@/types/auth'

/**
 * Email/password sign-in form: one implementation of validation and error
 * normalization, reusable by the login page and by any future inline sign-in
 * surface (dialog, drawer, expired-session prompt).
 *
 * The caller owns what happens after success (toast, redirect, closing a dialog).
 */
export function useLoginForm() {
  const { t } = useI18n()
  const auth = useAuthStore()

  const form = reactive<LoginInput>({ email: '', password: '' })
  const errors = reactive<{ email?: string; password?: string }>({})
  const formError = ref('')
  const showPassword = ref(false)
  const submitting = computed(() => auth.pending)

  function resetErrors(): void {
    errors.email = undefined
    errors.password = undefined
    formError.value = ''
  }

  function validate(): boolean {
    resetErrors()

    const result = loginInputSchema.safeParse(form)
    if (result.success) return true

    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if ((field === 'email' || field === 'password') && !errors[field]) {
        errors[field] = t(issue.message)
      }
    }

    return false
  }

  function resolveSubmitError(error: unknown): string {
    if (isApiError(error)) {
      if (error.status === 401 || error.status === 400) return t('auth.error.invalidCredentials')
      if (error.status === 429) return t('auth.error.tooManyAttempts')
      if (error.code === 'network' || error.code === 'timeout') return t('auth.error.network')
    }

    return t('auth.error.generic')
  }

  /** Resolves to whether the sign-in succeeded; failures land in `formError`. */
  async function submit(): Promise<boolean> {
    if (!validate()) return false

    try {
      await auth.login(form)
      return true
    } catch (error) {
      formError.value = resolveSubmitError(error)
      return false
    }
  }

  function reset(): void {
    form.email = ''
    form.password = ''
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
