import { test as base, expect, type Route } from '@playwright/test'

/**
 * Network-layer API mocking for E2E.
 *
 * The template ships a Vite middleware mock (`server/auth-mock.ts`) so `pnpm dev`
 * works with no backend. That covers the happy path, but it cannot express
 * failures: timeouts, 5xx, business error codes, or a backend that lives on
 * another origin. `page.route` can, without touching application code.
 *
 * Usage:
 *
 * ```ts
 * import { expect, test } from './fixtures'
 *
 * test('shows an error when the API is down', async ({ page, api }) => {
 *   await api.fail('**\/api/health', 503, 'Service unavailable')
 *   ...
 * })
 * ```
 *
 * Handlers registered later take precedence, and every matcher is removed when
 * the test ends, so mocks never leak between tests.
 */

export interface MockResult {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

export type MockHandler = (route: Route) => MockResult | Promise<MockResult>

export interface ApiMock {
  /** Intercept requests matching `matcher`; OPTIONS preflights answer 204 automatically. */
  mock(matcher: string | RegExp, handler: MockHandler): Promise<void>
  /** Shorthand for a JSON error response carrying `{ message }`. */
  fail(
    matcher: string | RegExp,
    status: number,
    message: string,
    headers?: Record<string, string>,
  ): Promise<void>
}

/**
 * Cross-origin API calls need permissive CORS headers, and Axios's custom headers
 * (`X-Request-Id`, `Accept-Language`) trigger a preflight. Echoing the request's
 * origin and requested headers keeps mocks usable for both same-origin and
 * cross-origin `VITE_API_BASE_URL` values.
 */
function corsHeaders(route: Route): Record<string, string> {
  const headers = route.request().headers()

  return {
    'access-control-allow-origin': headers.origin ?? '*',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers':
      headers['access-control-request-headers'] ??
      'authorization,content-type,accept-language,x-request-id',
    'access-control-max-age': '600',
    'cache-control': 'no-store',
    vary: 'Origin',
  }
}

export const test = base.extend<{ api: ApiMock }>({
  api: async ({ page }, use) => {
    const matchers: (string | RegExp)[] = []

    const mock: ApiMock['mock'] = async (matcher, handler) => {
      matchers.push(matcher)

      await page.route(matcher, async (route) => {
        if (route.request().method() === 'OPTIONS') {
          await route.fulfill({ status: 204, headers: corsHeaders(route) })
          return
        }

        const result = await handler(route)

        await route.fulfill({
          status: result.status ?? 200,
          headers: {
            ...corsHeaders(route),
            'content-type': 'application/json; charset=utf-8',
            ...result.headers,
          },
          body: JSON.stringify(result.body ?? {}),
        })
      })
    }

    const api: ApiMock = {
      mock,
      fail: (matcher, status, message, headers) =>
        mock(matcher, () => ({ status, body: { message }, headers })),
    }

    await use(api)

    for (const matcher of matchers) {
      await page.unroute(matcher).catch(() => undefined)
    }
  },
})

export { expect }
