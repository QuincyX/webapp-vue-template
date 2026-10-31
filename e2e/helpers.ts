import { expect, type Page } from '@playwright/test'

export const DEMO_EMAIL = 'demo@orbit.app'
export const DEMO_PASSWORD = 'OrbitDemo123!'

export async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => window.localStorage.clear())
}

export async function loginWith(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码', { exact: true }).fill(password)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('/')
}

export async function loginAsDemo(page: Page): Promise<void> {
  await loginWith(page, DEMO_EMAIL, DEMO_PASSWORD)
}

/** Start every test from a clean browser session, then sign in as the demo account. */
export async function signInFresh(page: Page): Promise<void> {
  await page.goto('/login')
  await clearSession(page)
  await page.reload()
  await loginAsDemo(page)
}

/**
 * Guards the most common mobile-first regression: a single element wider than the
 * viewport. One pixel of tolerance absorbs sub-pixel rounding.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth - root.clientWidth
  })

  expect(overflow).toBeLessThanOrEqual(1)
}
