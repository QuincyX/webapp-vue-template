import { i18n } from '@/i18n'

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

function currentLocale(): string {
  return i18n.global.locale.value
}

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null

  const match = dateOnlyPattern.exec(value)
  if (!match) return null

  const [, yearValue, monthValue, dayValue] = match
  if (!yearValue || !monthValue || !dayValue) return null

  const date = new Date(Number(yearValue), Number(monthValue) - 1, Number(dayValue))
  return Number.isNaN(date.getTime()) ? null : date
}

export function startOfDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toDateKey(date: Date | string): string {
  return toDateInputValue(typeof date === 'string' ? new Date(date) : date)
}

export function isOverdue(dueDate: string | null): boolean {
  const date = parseDateOnly(dueDate)
  if (!date) return false
  return startOfDay(date).getTime() < startOfDay().getTime()
}

export function isToday(dueDate: string | null): boolean {
  const date = parseDateOnly(dueDate)
  if (!date) return false
  return toDateInputValue(date) === toDateInputValue(new Date())
}

export function formatDueDate(dueDate: string | null): string {
  const date = parseDateOnly(dueDate)
  if (!date) return i18n.global.t('task.due.noDate')

  const today = startOfDay()
  const difference = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000)

  if (difference < 0) {
    const days = Math.abs(difference)
    return i18n.global.t('task.due.overdue', { days }, days)
  }
  if (difference === 0) return i18n.global.t('task.due.today')
  if (difference === 1) return i18n.global.t('task.due.tomorrow')
  if (difference <= 7) {
    return i18n.global.t('task.due.inDays', { days: difference }, difference)
  }

  return formatCalendarDate(dueDate)
}

export function formatCalendarDate(dueDate: string | null): string {
  const date = parseDateOnly(dueDate)
  if (!date) return i18n.global.t('task.due.noDate')

  return new Intl.DateTimeFormat(currentLocale(), { month: 'short', day: 'numeric' }).format(date)
}

export function formatLongDate(date = new Date()): string {
  return new Intl.DateTimeFormat(currentLocale(), {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return i18n.global.t('task.due.noDate')

  return new Intl.DateTimeFormat(currentLocale(), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'short' }).format(date)
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 6) return i18n.global.t('greeting.night')
  if (hour < 12) return i18n.global.t('greeting.morning')
  if (hour < 18) return i18n.global.t('greeting.afternoon')
  return i18n.global.t('greeting.evening')
}
