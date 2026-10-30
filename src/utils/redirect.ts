/**
 * Only allow same-origin absolute paths as post-login destinations.
 * Reject protocol-relative and external URLs to avoid open redirects.
 */
export function getSafeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback

  const path = value.split(/[?#]/)[0]
  if (path === '/login' || path === '/register') return fallback

  return value
}
