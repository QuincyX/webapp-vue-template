import { request } from './http'
import {
  authMeResponseSchema,
  authProfileResponseSchema,
  authSessionSchema,
  type LoginInput,
  type PasswordInput,
  type ProfileInput,
  type RegisterInput,
} from '@/types/auth'

export const authApi = {
  register: async (input: RegisterInput) => {
    const payload = await request<unknown>({
      url: '/auth/register',
      method: 'POST',
      data: input,
    })
    return authSessionSchema.parse(payload)
  },

  login: async (input: LoginInput) => {
    const payload = await request<unknown>({
      url: '/auth/login',
      method: 'POST',
      data: input,
    })
    return authSessionSchema.parse(payload)
  },

  me: async () => {
    const payload = await request<unknown>({ url: '/auth/me', method: 'GET' })
    return authMeResponseSchema.parse(payload)
  },

  updateProfile: async (input: ProfileInput) => {
    const payload = await request<unknown>({
      url: '/auth/profile',
      method: 'PATCH',
      data: input,
    })
    return authProfileResponseSchema.parse(payload)
  },

  changePassword: async (input: PasswordInput): Promise<void> => {
    await request<void>({
      url: '/auth/password',
      method: 'PUT',
      data: input,
    })
  },

  logout: async (): Promise<void> => {
    await request<void>({ url: '/auth/logout', method: 'POST' })
  },
}
