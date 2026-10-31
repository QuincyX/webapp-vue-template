import type { AxiosRequestConfig } from 'axios'
import { z } from 'zod'

import { ApiError } from './errors'
import { request } from './http'

/**
 * Adapter for backends that wrap every payload in an envelope such as
 * `{ code, data, message }` or `{ error, msg, data }`.
 *
 * Why not unwrap in the Axios response interceptor: the envelope only applies to
 * *some* endpoints, and the unwrapped body still needs a per-call Zod schema. Here
 * the unwrap and the validation happen together, so callers receive a typed value
 * or a normalized `ApiError`, never a half-checked object.
 *
 * Endpoints that already return bare JSON should keep using `request()` directly.
 */

/** Envelope shape accepted by this module. Unknown extra fields are ignored. */
export const envelopeSchema = z.object({
  code: z.union([z.number(), z.string()]).optional(),
  error: z.union([z.number(), z.string()]).optional(),
  message: z.string().optional(),
  msg: z.string().optional(),
  data: z.unknown().optional(),
})

export type Envelope = z.infer<typeof envelopeSchema>

export interface EnvelopeOptions {
  /**
   * Business codes that mean success. Defaults to `0`, `'0'`, `'ok'` and `'success'`,
   * which covers the common `{ code: 0 }` / `{ code: 'ok' }` conventions.
   */
  successCodes?: readonly (string | number)[]
  /**
   * Read the business code from a custom field. Defaults to `code`, then `error`.
   * Set this when the backend nests it, e.g. `{ meta: { code } }`.
   */
  codeSelector?: (payload: unknown) => unknown
}

const DEFAULT_SUCCESS_CODES: readonly (string | number)[] = [0, '0', 'ok', 'success']

function resolveCode(payload: Envelope, options: EnvelopeOptions): string | number | undefined {
  const custom = options.codeSelector?.(payload)
  if (typeof custom === 'string' || typeof custom === 'number') return custom

  return payload.code ?? payload.error
}

function resolveMessage(payload: Envelope): string | undefined {
  const message = payload.message ?? payload.msg
  return message?.trim() ? message : undefined
}

/**
 * Validates `payload` as an envelope, rejects business failures, and validates
 * `data` with the caller's schema.
 */
export function unwrapEnvelope<T>(
  payload: unknown,
  schema: z.ZodType<T>,
  options: EnvelopeOptions = {},
): T {
  const parsed = envelopeSchema.safeParse(payload)

  if (!parsed.success) {
    throw new ApiError('Unexpected API envelope', { code: 'unknown', details: parsed.error })
  }

  const envelope = parsed.data
  const code = resolveCode(envelope, options)
  const successCodes = options.successCodes ?? DEFAULT_SUCCESS_CODES

  if (code !== undefined && !successCodes.includes(code)) {
    throw new ApiError(resolveMessage(envelope) ?? 'Request failed', {
      code: 'business',
      details: envelope,
    })
  }

  const data = schema.safeParse(envelope.data)
  if (!data.success) {
    throw new ApiError('Unexpected API payload', { code: 'unknown', details: data.error })
  }

  return data.data
}

/** Envelope + `request()` + Zod validation, in one call. */
export async function envelopeRequest<T>(
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
  options: EnvelopeOptions = {},
): Promise<T> {
  const payload = await request<unknown>(config)
  return unwrapEnvelope(payload, schema, options)
}
