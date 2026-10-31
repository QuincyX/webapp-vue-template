import { expect, test } from '@playwright/test'

import { expectNoHorizontalOverflow, signInFresh } from './helpers'

/**
 * One layout implementation must work from 390px to 1440px (see AGENTS.md §4.9
 * and docs/architecture.md). These assertions catch the usual regressions: a
 * fixed-width card, an unwrapped long string, or a table that forces the page wide.
 */
test.describe('mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('has no horizontal overflow on the main routes', async ({ page }) => {
    await signInFresh(page)

    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('button', { name: '打开导航菜单' })).toBeVisible()

    for (const path of ['/tasks', '/settings']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })
})

test.describe('tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('has no horizontal overflow', async ({ page }) => {
    await signInFresh(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

test.describe('desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('centers the content and keeps the navigation visible', async ({ page }) => {
    await signInFresh(page)

    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()

    const contentWidth = await page.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return 0

      return main.getBoundingClientRect().width
    })

    expect(contentWidth).toBeGreaterThan(0)
    expect(contentWidth).toBeLessThanOrEqual(1440)
  })
})
