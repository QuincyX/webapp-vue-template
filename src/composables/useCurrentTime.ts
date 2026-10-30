import { useIntervalFn, useNow } from '@vueuse/core'

/**
 * A reactive clock that ticks once a minute instead of every animation frame.
 */
export function useCurrentTime(interval = 60_000) {
  return useNow({
    scheduler: (update) => useIntervalFn(update, interval),
  })
}
