/**
 * TTL cache for read-mostly data (lists, catalogs, lookup tables).
 *
 * Two layers: an in-memory `Map` for the current session, and `localStorage`
 * so a refresh can render immediately instead of waiting for the network.
 *
 * The API is intentionally small and synchronous:
 * - `get`    → fresh value or `null` (expired entries are removed)
 * - `peek`   → value even when expired, for stale-while-revalidate flows
 * - `entries`→ every cached record, so callers can sample across keys
 *
 * Callers own the decision to revalidate. This module never touches the network
 * and never decides whether stale data is acceptable.
 */

const CACHE_PREFIX = 'orbit.cache.v1.'

/** Default lifetime for cached entries: 30 minutes. */
export const DEFAULT_CACHE_TTL = 30 * 60 * 1000

interface CacheRecord {
  data: unknown
  expires: number
}

export interface CacheOptions {
  /** Lifetime in milliseconds. Defaults to `DEFAULT_CACHE_TTL`. */
  ttl?: number
}

export interface CacheEntry<T = unknown> {
  key: string
  data: T
  expires: number
  stale: boolean
}

const memory = new Map<string, CacheRecord>()

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function toKey(key: string | number): string {
  return String(key)
}

function readStorage(key: string): CacheRecord | null {
  if (!storageAvailable()) return null

  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const candidate = parsed as Partial<CacheRecord>
    if (typeof candidate.expires !== 'number') return null

    return { data: candidate.data, expires: candidate.expires }
  } catch {
    // Corrupt payloads and blocked storage both degrade to a cache miss.
    return null
  }
}

function writeStorage(key: string, record: CacheRecord): void {
  if (!storageAvailable()) return

  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(record))
  } catch {
    // Quota or privacy mode: the memory layer still serves this session.
  }
}

export const localCache = {
  set<T>(key: string | number, data: T, options: CacheOptions = {}): void {
    const id = toKey(key)
    const record: CacheRecord = {
      data,
      expires: Date.now() + (options.ttl ?? DEFAULT_CACHE_TTL),
    }

    memory.set(id, record)
    writeStorage(id, record)
  },

  /** Batch write; useful when a list response should also be indexed by id. */
  setMany<T>(items: { key: string | number; data: T }[], options: CacheOptions = {}): void {
    for (const item of items) this.set(item.key, item.data, options)
  },

  /** Fresh value or `null`. Expired entries are evicted from both layers. */
  get<T>(key: string | number): T | null {
    const id = toKey(key)
    const now = Date.now()
    const cached = memory.get(id) ?? readStorage(id)

    if (!cached) return null

    if (cached.expires <= now) {
      this.remove(id)
      return null
    }

    memory.set(id, cached)
    return cached.data as T
  },

  /**
   * Read a record regardless of expiry, for "render stale data, then revalidate".
   * Unlike `get`, it never deletes anything.
   */
  peek<T>(key: string | number): CacheEntry<T> | null {
    const id = toKey(key)
    const cached = memory.get(id) ?? readStorage(id)
    if (!cached) return null

    memory.set(id, cached)

    return {
      key: id,
      data: cached.data as T,
      expires: cached.expires,
      stale: cached.expires <= Date.now(),
    }
  },

  /** Every cached record (memory + storage, de-duplicated), including stale ones. */
  entries<T = unknown>(): CacheEntry<T>[] {
    const now = Date.now()
    const result = new Map<string, CacheEntry<T>>()

    for (const [key, record] of memory) {
      result.set(key, {
        key,
        data: record.data as T,
        expires: record.expires,
        stale: record.expires <= now,
      })
    }

    if (!storageAvailable()) return [...result.values()]

    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const fullKey = window.localStorage.key(index)
        if (!fullKey?.startsWith(CACHE_PREFIX)) continue

        const key = fullKey.slice(CACHE_PREFIX.length)
        if (result.has(key)) continue

        const record = readStorage(key)
        if (!record) continue

        result.set(key, {
          key,
          data: record.data as T,
          expires: record.expires,
          stale: record.expires <= now,
        })
      }
    } catch {
      // Storage iteration failing leaves the in-memory snapshot intact.
    }

    return [...result.values()]
  },

  remove(key: string | number): void {
    const id = toKey(key)
    memory.delete(id)

    if (!storageAvailable()) return

    try {
      window.localStorage.removeItem(CACHE_PREFIX + id)
    } catch {
      // Nothing actionable: the entry will expire on its own.
    }
  },

  /** Drop every entry written by this module; other storage keys are untouched. */
  clear(): void {
    memory.clear()
    if (!storageAvailable()) return

    try {
      const keys: string[] = []
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const fullKey = window.localStorage.key(index)
        if (fullKey?.startsWith(CACHE_PREFIX)) keys.push(fullKey)
      }

      for (const key of keys) window.localStorage.removeItem(key)
    } catch {
      // Best-effort cleanup only.
    }
  },
}
