import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, describe, expect, it } from 'vitest'

import { http } from '@/api/http'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/token'
import { setLocale } from '@/i18n'

function responseAdapter(
  payload: unknown,
  onRequest?: (config: InternalAxiosRequestConfig) => void,
): AxiosAdapter {
  return async (config) => {
    onRequest?.(config)

    return {
      data: payload,
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config,
    }
  }
}

function errorAdapter(error: AxiosError): AxiosAdapter {
  return async (config) => {
    error.config = config
    throw error
  }
}

describe('HTTP client interceptors', () => {
  afterEach(() => {
    clearAccessToken()
    setLocale('zh-CN')
  })

  it('adds auth, locale, and request id headers', async () => {
    let captured: InternalAxiosRequestConfig | undefined
    setAccessToken('test-token')
    setLocale('en-US')

    await http.get('/health', {
      adapter: responseAdapter({ status: 'ok' }, (config) => {
        captured = config
      }),
    })

    expect(captured?.headers.get('Authorization')).toBe('Bearer test-token')
    expect(captured?.headers.get('Accept-Language')).toBe('en-US')
    expect(captured?.headers.get('X-Request-Id')).toEqual(expect.any(String))
  })

  it('normalizes an unauthorized response and clears the token', async () => {
    setAccessToken('expired-token')

    const response = {
      data: { message: 'Session expired' },
      status: 401,
      statusText: 'Unauthorized',
      headers: new AxiosHeaders(),
      config: {} as InternalAxiosRequestConfig,
    } satisfies AxiosResponse

    const error = new AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      response,
    )

    await expect(http.get('/private', { adapter: errorAdapter(error) })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'unauthorized',
      status: 401,
    })
    expect(getAccessToken()).toBeNull()
  })

  it('maps transport failures to a network error', async () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')

    await expect(http.get('/offline', { adapter: errorAdapter(error) })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'network',
    })
  })
})
