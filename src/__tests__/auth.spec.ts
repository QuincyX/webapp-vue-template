import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'
import { authApi } from '@/api/auth'
import { getAccessToken, setAccessToken } from '@/api/token'
import { useAuthStore } from '@/stores/auth'
import {
  loginInputSchema,
  passwordInputSchema,
  registerInputSchema,
  type AuthSession,
  type AuthUser,
} from '@/types/auth'

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

const user = {
  id: 'usr_test',
  name: 'Test User',
  email: 'test@example.com',
}

const session = {
  token: 'session-token',
  user,
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('bootstraps as guest when no token exists', async () => {
    const auth = useAuthStore()

    await auth.bootstrap()

    expect(auth.status).toBe('guest')
    expect(auth.initialized).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(authApi.me).not.toHaveBeenCalled()
  })

  it('logs in and persists the session token', async () => {
    vi.mocked(authApi.login).mockResolvedValue(session)
    const auth = useAuthStore()

    await auth.login({ email: user.email, password: 'OrbitDemo123!' })

    expect(auth.user).toEqual(user)
    expect(auth.isAuthenticated).toBe(true)
    expect(getAccessToken()).toBe(session.token)
    expect(auth.pending).toBe(false)
  })

  it('restores a session from a stored token', async () => {
    setAccessToken(session.token)
    vi.mocked(authApi.me).mockResolvedValue({ user })
    const auth = useAuthStore()

    await auth.bootstrap()

    expect(auth.user).toEqual(user)
    expect(auth.status).toBe('authenticated')
    expect(auth.initialized).toBe(true)
  })

  it('clears an expired session during bootstrap', async () => {
    setAccessToken('expired')
    vi.mocked(authApi.me).mockRejectedValue(
      new ApiError('Unauthorized', { code: 'unauthorized', status: 401 }),
    )
    const auth = useAuthStore()

    await auth.bootstrap()

    expect(auth.status).toBe('guest')
    expect(auth.user).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('clears local state even when logout request fails', async () => {
    setAccessToken(session.token)
    vi.mocked(authApi.logout).mockRejectedValue(new ApiError('Network', { code: 'network' }))
    const auth = useAuthStore()
    auth.user = user
    auth.status = 'authenticated'

    await auth.logout()

    expect(auth.status).toBe('guest')
    expect(auth.user).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('clears the session after a password change', async () => {
    setAccessToken(session.token)
    vi.mocked(authApi.changePassword).mockResolvedValue()
    const auth = useAuthStore()
    auth.user = user
    auth.status = 'authenticated'

    await auth.changePassword({
      currentPassword: 'OrbitDemo123!',
      newPassword: 'OrbitDemo456!',
    })

    expect(auth.status).toBe('guest')
    expect(auth.user).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('updates the profile and clears session on unauthorized', async () => {
    vi.mocked(authApi.updateProfile).mockResolvedValue({
      user: { ...user, name: 'Updated User' },
    })
    const auth = useAuthStore()
    auth.user = user
    auth.status = 'authenticated'

    await auth.updateProfile({ name: 'Updated User' })
    expect(auth.user?.name).toBe('Updated User')

    auth.handleUnauthorized()
    expect(auth.user).toBeNull()
    expect(auth.status).toBe('guest')
  })
})

describe('auth validation', () => {
  it('rejects malformed login and register input', () => {
    expect(loginInputSchema.safeParse({ email: 'not-an-email', password: '' }).success).toBe(false)
    expect(
      registerInputSchema.safeParse({
        name: 'A',
        email: 'not-an-email',
        password: 'short',
      }).success,
    ).toBe(false)
    expect(
      registerInputSchema.safeParse({
        name: 'Valid User',
        email: 'valid@example.com',
        password: 'OrbitDemo123!',
      }).success,
    ).toBe(true)
  })

  it('rejects a password change without the current password', () => {
    expect(
      passwordInputSchema.safeParse({
        currentPassword: '',
        newPassword: 'OrbitDemo456!',
      }).success,
    ).toBe(false)
  })
})
