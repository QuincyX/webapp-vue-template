const ACCESS_TOKEN_KEY = 'orbit.access-token.v1'

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } catch {
    // The interceptor simply sends an unauthenticated request when storage fails.
  }
}

export function clearAccessToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // Ignore storage failures while cleaning up an expired session.
  }
}
