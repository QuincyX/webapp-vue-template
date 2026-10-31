import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { ApiError } from '@/api/errors'
import { authApi } from '@/api/auth'
import { useLoginForm } from '@/composables/useLoginForm'
import { i18n } from '@/i18n'
import type { AuthSession, AuthUser } from '@/types/auth'

vi.mock('@/api/auth', () => ({
  authApi: {
    register: vi.fn<() => Promise<AuthSession>>(),
    login: vi.fn<() => Promise<AuthSession>>(),
    me: vi.fn<() => Promise<{ user: AuthUser }>>(),
    updateProfile: vi.fn<() => Promise<{ user: AuthUser }>>(),
    changePassword: vi.fn<() => Promise<void>>(),
    logout: vi.fn<() => Promise<void>>(),
  },
}))

function mountForm() {
  let form: ReturnType<typeof useLoginForm> | undefined

  mount(
    defineComponent({
      setup() {
        form = useLoginForm()
        return () => null
      },
    }),
    {}, // i18n is installed globally in src/__tests__/setup.ts
  )

  if (!form) throw new Error('useLoginForm did not initialize')
  return form
}

describe('useLoginForm', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    i18n.global.locale.value = 'zh-CN'
  })

  it('blocks submission and reports field errors for an empty form', async () => {
    const form = mountForm()

    await expect(form.submit()).resolves.toBe(false)

    expect(form.errors.email).toBe('请输入邮箱')
    expect(form.errors.password).toBe('请输入密码')
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('rejects an invalid email before calling the API', async () => {
    const form = mountForm()
    form.form.email = 'not-an-email'
    form.form.password = 'OrbitDemo123!'

    await expect(form.submit()).resolves.toBe(false)

    expect(form.errors.email).toBe('请输入有效的邮箱地址')
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('returns true and clears errors on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'token',
      user: { id: 'usr_1', name: 'Demo', email: 'demo@orbit.app' },
    })
    const form = mountForm()
    form.form.email = 'demo@orbit.app'
    form.form.password = 'OrbitDemo123!'

    await expect(form.submit()).resolves.toBe(true)

    expect(form.formError.value).toBe('')
    expect(form.submitting.value).toBe(false)
  })

  it('maps a 401 to the invalid-credentials message', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError('nope', { code: 'unauthorized', status: 401 }),
    )
    const form = mountForm()
    form.form.email = 'demo@orbit.app'
    form.form.password = 'wrong'

    await expect(form.submit()).resolves.toBe(false)

    expect(form.formError.value).toBe('邮箱或密码不正确，请重试。')
  })

  it('maps a transport failure to the network message', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError('offline', { code: 'network' }))
    const form = mountForm()
    form.form.email = 'demo@orbit.app'
    form.form.password = 'OrbitDemo123!'

    await expect(form.submit()).resolves.toBe(false)

    expect(form.formError.value).toBe('网络连接失败，请检查开发服务或后端地址。')
  })

  it('reset clears the fields and the password visibility toggle', async () => {
    const form = mountForm()
    form.form.email = 'demo@orbit.app'
    form.form.password = 'secret'
    form.showPassword.value = true
    form.errors.email = 'stale'

    form.reset()

    expect(form.form.email).toBe('')
    expect(form.form.password).toBe('')
    expect(form.showPassword.value).toBe(false)
    expect(form.errors.email).toBeUndefined()
  })
})
