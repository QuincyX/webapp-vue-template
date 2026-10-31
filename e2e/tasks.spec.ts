import { expect, test } from '@playwright/test'

import { signInFresh } from './helpers'

test.beforeEach(async ({ page }) => {
  await signInFresh(page)
})

test('renders the dashboard and primary navigation', async ({ page }) => {
  await expect(page).toHaveTitle(/总览/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/早上好|下午好|晚上好|夜深了/)
  await expect(page.getByText('过去 7 天')).toBeVisible()
  await expect(page.getByText('最近动态')).toBeVisible()

  await page.getByRole('link', { name: /^任务/ }).click()
  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('任务清单')
})

test('creates, completes, and persists a task', async ({ page }) => {
  await page.goto('/tasks?new=1')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByLabel(/任务标题/).fill('E2E 验收任务')
  await dialog.getByLabel(/描述/).fill('由 Playwright 自动创建的验收任务。')
  await dialog.getByLabel('优先级').selectOption('high')
  await dialog.getByRole('button', { name: '创建任务' }).click()

  await expect(dialog).toBeHidden()

  const row = page.getByTestId('task-item').filter({ hasText: 'E2E 验收任务' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('待开始')

  await row.getByRole('checkbox').click()
  await expect(row).toContainText('已完成')

  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('orbit.tasks.v1') ?? ''))
    .toContain('E2E 验收任务')

  await page.reload()
  const persistedRow = page.getByTestId('task-item').filter({ hasText: 'E2E 验收任务' })
  await expect(persistedRow).toBeVisible()
  await expect(persistedRow).toContainText('已完成')
})

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens the drawer and navigates to tasks', async ({ page }) => {
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    await expect(page.getByRole('dialog', { name: '移动端导航' })).toBeVisible()

    await page
      .getByRole('navigation', { name: '主导航' })
      .getByRole('link', { name: /^任务/ })
      .click()
    await expect(page).toHaveURL(/\/tasks$/)
  })
})
