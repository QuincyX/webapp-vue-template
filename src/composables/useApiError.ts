import { useI18n } from 'vue-i18n'

import { isApiError, type ApiErrorCode } from '@/api/errors'

/**
 * Turns `ApiError` into user-facing copy.
 *
 * Views and stores must not build i18n keys by hand (`t(\`apiError.\${code}\`)`):
 * a typo silently renders a missing key, and every call site repeats the `unknown`
 * fallback. This composable is the only place that maps a code to a message.
 */
export function useApiError() {
  const { t } = useI18n()

  function codeToMessage(code: ApiErrorCode | null | undefined): string {
    return t(`apiError.${code ?? 'unknown'}`)
  }

  function toMessage(error: unknown): string {
    return codeToMessage(isApiError(error) ? error.code : 'unknown')
  }

  return { codeToMessage, toMessage }
}
