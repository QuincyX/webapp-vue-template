import { expect, test } from './fixtures'
import { signInFresh } from './helpers'

test.beforeEach(async ({ page }) => {
  await signInFresh(page)
})

test('persists the selected theme', async ({ page }) => {
  await page.goto('/settings')

  await page.getByText('深色', { exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('switches language and persists it', async ({ page }) => {
  await page.goto('/settings')

  await page.getByTestId('locale-switcher').last().selectOption('en-US')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page).toHaveTitle(/Settings/)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
})

test('reports a healthy backend through the shared HTTP client', async ({ page }) => {
  await page.goto('/settings')

  await page.getByRole('button', { name: '测试连接' }).click()

  // The result appears twice by design: a toast and the inline card. Scope each
  // assertion so the check cannot pass on the toast alone.
  await expect(page.getByTestId('toast').getByText('连接成功')).toBeVisible()
  await expect(page.locator('#main-content').getByText(/后端服务响应正常/)).toBeVisible()
})

test('surfaces a backend failure with its request id', async ({ page, api }) => {
  await api.fail('**/api/health', 503, 'Service unavailable', { 'x-request-id': 'req_e2e_health' })

  await page.goto('/settings')
  await page.getByRole('button', { name: '测试连接' }).click()

  const card = page.locator('#main-content')
  await expect(card.getByText('服务器开小差了，请稍后重试。')).toBeVisible()
  await expect(card.getByText('请求 ID：req_e2e_health')).toBeVisible()
})
