import axios, { type AxiosError } from 'axios'

export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'server'
  | 'business'
  | 'unknown'

export interface ApiErrorOptions {
  code?: ApiErrorCode
  status?: number
  requestId?: string
  details?: unknown
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status?: number
  readonly requestId?: string
  readonly details?: unknown

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code ?? 'unknown'
    this.status = options.status
    this.requestId = options.requestId
    this.details = options.details
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function getResponseMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined

  const candidate = data as { message?: unknown; error?: unknown }
  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error
  }

  return undefined
}

function getRequestId(error: AxiosError): string | undefined {
  const responseId = error.response?.headers?.['x-request-id']
  if (typeof responseId === 'string') return responseId

  const requestId = error.config?.headers?.get('X-Request-Id')
  return typeof requestId === 'string' ? requestId : undefined
}

function resolveErrorCode(error: AxiosError): ApiErrorCode {
  if (!error.response) {
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' ? 'timeout' : 'network'
  }

  const status = error.response.status
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  if (status >= 500) return 'server'
  return 'unknown'
}

/**
 * Normalizes transport, HTTP, and backend errors into one shape that the UI
 * can translate without depending on Axios internals.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (!axios.isAxiosError(error)) {
    return new ApiError(error instanceof Error ? error.message : 'Unknown API error')
  }

  const status = error.response?.status
  const code = resolveErrorCode(error)
  const backendMessage = getResponseMessage(error.response?.data)

  return new ApiError(backendMessage ?? error.message, {
    code,
    status,
    requestId: getRequestId(error),
    details: error.response?.data,
  })
}
