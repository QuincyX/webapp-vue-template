import axios, { type AxiosRequestConfig } from 'axios'

import { env } from '@/config/env'
import { getCurrentLocale } from '@/i18n'
import { normalizeApiError, type ApiError } from './errors'
import { clearAccessToken, getAccessToken } from './token'

const REQUEST_ID_HEADER = 'X-Request-Id'

const UNAUTHORIZED_EVENT = 'orbit:unauthorized'

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Single decision point for "the session is gone, sign the user out".
 *
 * Every backend states this differently: HTTP 401, HTTP 200 with a business code,
 * a redirect to a login page, or an expired cookie. Keep that knowledge here so
 * no page or store has to re-implement it, and so switching to HttpOnly cookies
 * means editing this file plus `token.ts` — not grepping for 401 checks.
 *
 * Defaults to the HTTP 401 convention used by this template. When a backend wraps
 * errors (see `./envelope.ts`), narrow it here, e.g.:
 *
 * ```ts
 * return error.status === 401 && (error.details as { code?: string })?.code === 'TOKEN_EXPIRED'
 * ```
 */
function shouldClearSession(error: ApiError): boolean {
  return error.status === 401
}

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use(
  (config) => {
    config.headers.set(REQUEST_ID_HEADER, createRequestId())
    config.headers.set('Accept-Language', getCurrentLocale())

    const token = getAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }

    return config
  },
  (error: unknown) => Promise.reject(normalizeApiError(error)),
)

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error)

    if (shouldClearSession(apiError)) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }

    return Promise.reject(apiError)
  },
)

/**
 * Typed convenience wrapper around the configured Axios instance.
 * Interceptors still apply, while callers only deal with the response body.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config)
  return response.data
}

export { REQUEST_ID_HEADER, UNAUTHORIZED_EVENT }
