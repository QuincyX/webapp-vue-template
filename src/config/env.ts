import { z } from 'zod'

const fallbackEnvironment = import.meta.env.PROD ? 'production' : 'development'

const envSchema = z.object({
  VITE_APP_TITLE: z.string().trim().min(1).default('Orbit'),
  VITE_APP_ENV: z.enum(['development', 'preview', 'production']).default(fallbackEnvironment),
  VITE_API_BASE_URL: z.string().trim().min(1).default('/api'),
  VITE_API_TIMEOUT: z.coerce.number().int().positive().max(120_000).default(10_000),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  throw new Error(`Invalid environment configuration:\n${message.join('\n')}`)
}

export const env = parsed.data
