import { describe, expect, it, vi } from 'vitest'

import { useInstallPrompt } from '@/composables/useInstallPrompt'

describe('useInstallPrompt', () => {
  it('goes from unavailable to installable once the browser reports the event', async () => {
    const prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const install = useInstallPrompt()

    install.init()

    // Nothing is installable until the browser fires the event.
    expect(install.canInstall.value).toBe(false)
    expect(install.canShowInstall.value).toBe(false)

    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })

    window.dispatchEvent(event)

    expect(install.canInstall.value).toBe(true)
    expect(install.canShowInstall.value).toBe(true)

    await expect(install.install()).resolves.toBe('accepted')
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(install.canInstall.value).toBe(false)
  })
})
