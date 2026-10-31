import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { isApiError, type ApiErrorCode } from '@/api/errors'
import { systemApi } from '@/api/system'

/**
 * Reference implementation of a *remote* store for this template.
 *
 * The task store is deliberately local-first, so it does not demonstrate the
 * patterns a real API needs. This store does, with the smallest useful surface:
 *
 * 1. `inFlight` single-flight — repeated clicks reuse one request;
 * 2. `errorCode` instead of the raw error — views translate it, never inspect Axios;
 * 3. derived `computed` state (`isHealthy`) instead of recomputing in components;
 * 4. no persistence — a health probe is meaningless after a reload.
 *
 * Copy this shape when adding a store backed by HTTP; keep list caching and
 * request-race handling in the caller when it owns filters or pagination
 * (see `docs/architecture.md` 6.2).
 */
export type HealthStatus = 'idle' | 'loading' | 'success' | 'error'

export const useHealthStore = defineStore('health', () => {
  const status = ref<HealthStatus>('idle')
  const latencyMs = ref<number | null>(null)
  const errorCode = ref<ApiErrorCode | null>(null)
  const requestId = ref<string | null>(null)
  const checkedAt = ref<string | null>(null)

  let inFlight: Promise<boolean> | null = null

  const isHealthy = computed(() => status.value === 'success')
  const isLoading = computed(() => status.value === 'loading')

  /** Resolves to whether the backend answered successfully; never throws. */
  async function check(): Promise<boolean> {
    if (inFlight) return inFlight

    status.value = 'loading'
    errorCode.value = null
    requestId.value = null

    const startedAt = performance.now()

    inFlight = (async () => {
      try {
        await systemApi.health()
        latencyMs.value = Math.round(performance.now() - startedAt)
        status.value = 'success'
        return true
      } catch (error) {
        latencyMs.value = null
        status.value = 'error'
        errorCode.value = isApiError(error) ? error.code : 'unknown'
        requestId.value = isApiError(error) ? (error.requestId ?? null) : null
        return false
      } finally {
        checkedAt.value = new Date().toISOString()
        inFlight = null
      }
    })()

    return inFlight
  }

  function reset(): void {
    status.value = 'idle'
    latencyMs.value = null
    errorCode.value = null
    requestId.value = null
    checkedAt.value = null
  }

  return {
    status,
    latencyMs,
    errorCode,
    requestId,
    checkedAt,
    isHealthy,
    isLoading,
    check,
    reset,
  }
})
