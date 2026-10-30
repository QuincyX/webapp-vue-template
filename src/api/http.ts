import axios, { type AxiosRequestConfig } from 'axios'

import { env } from '@/config/env'
import { getCurrentLocale } from '@/i18n'
import { normalizeApiError } from './errors'
import { clearAccessToken, getAccessToken } from './token'

const REQUEST_ID_HEADER = 'X-Request-Id'

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
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

    if (apiError.status === 401) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('orbit:unauthorized'))
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

export { REQUEST_ID_HEADER }
