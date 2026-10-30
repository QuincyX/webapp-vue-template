import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setLocale } from '@/i18n'
import {
  formatDueDate,
  getGreeting,
  isOverdue,
  isToday,
  parseDateOnly,
  toDateInputValue,
} from '@/utils/date'

describe('date utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 26, 9, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    setLocale('zh-CN')
  })

  it('parses date-only values as local dates', () => {
    const date = parseDateOnly('2026-10-26')

    expect(date).not.toBeNull()
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(9)
    expect(date?.getDate()).toBe(26)
    expect(toDateInputValue(date as Date)).toBe('2026-10-26')
  })

  it('returns null for invalid values', () => {
    expect(parseDateOnly('')).toBeNull()
    expect(parseDateOnly('2026/10/26')).toBeNull()
    expect(parseDateOnly(null)).toBeNull()
  })

  it('formats relative due dates', () => {
    expect(formatDueDate('2026-10-26')).toBe('今天')
    expect(formatDueDate('2026-10-27')).toBe('明天')
    expect(formatDueDate('2026-10-29')).toBe('3 天后')
    expect(formatDueDate('2026-10-25')).toBe('已逾期 1 天')
    expect(formatDueDate(null)).toBe('未设置日期')
  })

  it('detects overdue and today values', () => {
    expect(isOverdue('2026-10-25')).toBe(true)
    expect(isOverdue('2026-10-26')).toBe(false)
    expect(isToday('2026-10-26')).toBe(true)
    expect(isToday('2026-10-27')).toBe(false)
  })

  it('formats relative dates in English with plural forms', () => {
    setLocale('en-US')

    expect(formatDueDate('2026-10-24')).toBe('2 days overdue')
    expect(formatDueDate('2026-10-25')).toBe('1 day overdue')
    expect(formatDueDate('2026-10-26')).toBe('Today')
    expect(formatDueDate('2026-10-29')).toBe('In 3 days')
    expect(getGreeting(new Date(2026, 9, 26, 9))).toBe('Good morning')
  })

  it('returns a greeting based on the local hour', () => {
    expect(getGreeting(new Date(2026, 9, 26, 3))).toBe('夜深了')
    expect(getGreeting(new Date(2026, 9, 26, 9))).toBe('早上好')
    expect(getGreeting(new Date(2026, 9, 26, 15))).toBe('下午好')
    expect(getGreeting(new Date(2026, 9, 26, 21))).toBe('晚上好')
  })
})
