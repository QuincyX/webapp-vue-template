import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_CACHE_TTL, localCache } from '@/utils/localCache'

const FOREIGN_KEY = 'some-other-app.key'

describe('localCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    localCache.clear()
    window.localStorage.setItem(FOREIGN_KEY, 'keep-me')
  })

  afterEach(() => {
    vi.useRealTimers()
    localCache.clear()
    window.localStorage.clear()
  })

  it('returns a value while it is fresh', () => {
    localCache.set('templates.list', { items: [1, 2] })

    expect(localCache.get('templates.list')).toEqual({ items: [1, 2] })
  })

  it('treats the value as missing after the TTL and evicts it', () => {
    localCache.set('templates.list', ['a'], { ttl: 1_000 })
    vi.advanceTimersByTime(1_001)

    expect(localCache.get('templates.list')).toBeNull()
    expect(window.localStorage.getItem('orbit.cache.v1.templates.list')).toBeNull()
  })

  it('peek still returns an expired entry for stale-while-revalidate', () => {
    localCache.set('templates.list', ['stale'], { ttl: 1_000 })
    vi.advanceTimersByTime(DEFAULT_CACHE_TTL)

    const entry = localCache.peek<string[]>('templates.list')

    expect(entry?.data).toEqual(['stale'])
    expect(entry?.stale).toBe(true)
  })

  it('reads entries written by a previous session (storage layer)', () => {
    window.localStorage.setItem(
      'orbit.cache.v1.templates.by-id',
      JSON.stringify({ data: { id: 7 }, expires: Date.now() + 60_000 }),
    )

    expect(localCache.get<{ id: number }>('templates.by-id')).toEqual({ id: 7 })
  })

  it('enumerates cached entries without leaking foreign storage keys', () => {
    localCache.set('one', 1)
    localCache.set('two', 2)

    const keys = localCache
      .entries()
      .map((entry) => entry.key)
      .sort()

    expect(keys).toEqual(['one', 'two'])
  })

  it('ignores corrupt payloads instead of throwing', () => {
    window.localStorage.setItem('orbit.cache.v1.corrupt', '{not-json')

    expect(localCache.get('corrupt')).toBeNull()
    expect(localCache.peek('corrupt')).toBeNull()
  })

  it('clear only removes entries owned by this module', () => {
    localCache.set('one', 1)
    localCache.clear()

    expect(localCache.get('one')).toBeNull()
    expect(window.localStorage.getItem(FOREIGN_KEY)).toBe('keep-me')
  })

  it('setMany writes several keys with the same TTL', () => {
    localCache.setMany(
      [
        { key: 1, data: { id: 1 } },
        { key: 2, data: { id: 2 } },
      ],
      { ttl: 5_000 },
    )

    expect(localCache.get<{ id: number }>(1)).toEqual({ id: 1 })
    expect(localCache.get<{ id: number }>('2')).toEqual({ id: 2 })

    vi.advanceTimersByTime(5_001)
    expect(localCache.get(1)).toBeNull()
  })
})
