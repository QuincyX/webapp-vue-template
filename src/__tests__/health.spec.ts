import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'
import { systemApi } from '@/api/system'
import { useHealthStore } from '@/stores/health'

vi.mock('@/api/system', () => ({
  systemApi: {
    health: vi.fn<() => Promise<{ status: string }>>(),
  },
}))

describe('health store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts idle and stores the latency on success', async () => {
    vi.mocked(systemApi.health).mockResolvedValue({ status: 'ok' })
    const health = useHealthStore()

    expect(health.status).toBe('idle')

    await expect(health.check()).resolves.toBe(true)

    expect(health.status).toBe('success')
    expect(health.isHealthy).toBe(true)
    expect(health.latencyMs).toEqual(expect.any(Number))
    expect(health.errorCode).toBeNull()
    expect(health.checkedAt).toEqual(expect.any(String))
  })

  it('maps a failure to an error code instead of leaking the error object', async () => {
    vi.mocked(systemApi.health).mockRejectedValue(
      new ApiError('boom', { code: 'server', status: 503, requestId: 'req_1' }),
    )
    const health = useHealthStore()

    await expect(health.check()).resolves.toBe(false)

    expect(health.status).toBe('error')
    expect(health.errorCode).toBe('server')
    expect(health.requestId).toBe('req_1')
    expect(health.latencyMs).toBeNull()
    expect(health.isHealthy).toBe(false)
  })

  it('coalesces concurrent checks into one request', async () => {
    let resolveRequest: ((value: { status: string }) => void) | undefined
    vi.mocked(systemApi.health).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    const health = useHealthStore()

    const first = health.check()
    const second = health.check()

    expect(systemApi.health).toHaveBeenCalledTimes(1)

    resolveRequest?.({ status: 'ok' })

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
  })

  it('clears every field on reset', async () => {
    vi.mocked(systemApi.health).mockResolvedValue({ status: 'ok' })
    const health = useHealthStore()
    await health.check()

    health.reset()

    expect(health.status).toBe('idle')
    expect(health.latencyMs).toBeNull()
    expect(health.errorCode).toBeNull()
    expect(health.requestId).toBeNull()
  })
})
