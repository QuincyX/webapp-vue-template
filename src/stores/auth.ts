import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi } from '@/api/auth'
import { isApiError } from '@/api/errors'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/token'
import type { AuthUser, LoginInput, PasswordInput, ProfileInput, RegisterInput } from '@/types/auth'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const status = ref<AuthStatus>('idle')
  const initialized = ref(false)
  const pending = ref(false)

  let bootstrapPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => status.value === 'authenticated' && user.value !== null)

  function applySession(session: { token: string; user: AuthUser }): AuthUser {
    setAccessToken(session.token)
    user.value = session.user
    status.value = 'authenticated'
    initialized.value = true
    return session.user
  }

  function clearSession(): void {
    clearAccessToken()
    user.value = null
    status.value = 'guest'
    initialized.value = true
  }

  async function bootstrap(): Promise<void> {
    if (initialized.value) return
    if (bootstrapPromise) return bootstrapPromise

    status.value = 'loading'
    bootstrapPromise = (async () => {
      const token = getAccessToken()
      if (!token) {
        clearSession()
        return
      }

      try {
        const response = await authApi.me()
        user.value = response.user
        status.value = 'authenticated'
      } catch (error) {
        if (isApiError(error) && error.status === 401) clearAccessToken()
        user.value = null
        status.value = 'guest'
      } finally {
        initialized.value = true
        bootstrapPromise = null
      }
    })()

    return bootstrapPromise
  }

  async function login(input: LoginInput): Promise<AuthUser> {
    pending.value = true
    try {
      return applySession(await authApi.login(input))
    } finally {
      pending.value = false
    }
  }

  async function register(input: RegisterInput): Promise<AuthUser> {
    pending.value = true
    try {
      return applySession(await authApi.register(input))
    } finally {
      pending.value = false
    }
  }

  async function logout(): Promise<void> {
    pending.value = true
    try {
      if (getAccessToken()) await authApi.logout()
    } catch {
      // Local session must be cleared even when the server is unreachable.
    } finally {
      pending.value = false
      clearSession()
    }
  }

  async function updateProfile(input: ProfileInput): Promise<AuthUser> {
    if (!user.value) throw new Error('Authentication required.')

    pending.value = true
    try {
      const response = await authApi.updateProfile(input)
      user.value = response.user
      return response.user
    } finally {
      pending.value = false
    }
  }

  async function changePassword(input: PasswordInput): Promise<void> {
    pending.value = true
    try {
      await authApi.changePassword(input)
      clearSession()
    } finally {
      pending.value = false
    }
  }

  function handleUnauthorized(): void {
    clearSession()
  }

  return {
    user,
    status,
    initialized,
    pending,
    isAuthenticated,
    bootstrap,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    handleUnauthorized,
  }
})
