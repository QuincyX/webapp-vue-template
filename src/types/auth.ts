import { z } from 'zod'

export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
})

export const authSessionSchema = z.object({
  token: z.string().min(1),
  user: authUserSchema,
})

export const authMeResponseSchema = z.object({
  user: authUserSchema,
})

export const authProfileResponseSchema = z.object({
  user: authUserSchema,
})

const emailSchema = z
  .string()
  .trim()
  .min(1, 'auth.validation.emailRequired')
  .email('auth.validation.emailInvalid')

const passwordSchema = z
  .string()
  .min(8, 'auth.validation.passwordMin')
  .max(128, 'auth.validation.passwordMax')

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'auth.validation.passwordRequired'),
})

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, 'auth.validation.nameMin').max(40, 'auth.validation.nameMax'),
  email: emailSchema,
  password: passwordSchema,
})

export const profileInputSchema = z.object({
  name: z.string().trim().min(2, 'auth.validation.nameMin').max(40, 'auth.validation.nameMax'),
})

export const passwordInputSchema = z.object({
  currentPassword: z.string().min(1, 'auth.validation.currentPasswordRequired'),
  newPassword: passwordSchema,
})

export type AuthUser = z.infer<typeof authUserSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
export type RegisterInput = z.infer<typeof registerInputSchema>
export type ProfileInput = z.infer<typeof profileInputSchema>
export type PasswordInput = z.infer<typeof passwordInputSchema>
