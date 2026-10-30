import { expect, test, type Page } from '@playwright/test'

const DEMO_EMAIL = 'demo@orbit.app'
const DEMO_PASSWORD = 'OrbitDemo123!'

async function loginAsDemo(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(DEMO_EMAIL)
  await page.getByLabel('密码', { exact: true }).fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('/')
}

async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => window.localStorage.clear())
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await clearSession(page)
  await page.reload()
  await loginAsDemo(page)
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

test('redirects anonymous users and returns to the requested page', async ({ page }) => {
  await clearSession(page)
  await page.goto('/tasks')

  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)tasks$/)
  await page.getByLabel('邮箱').fill(DEMO_EMAIL)
  await page.getByLabel('密码', { exact: true }).fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('任务清单')
})

test('registers an account, updates profile, and signs out', async ({ page }) => {
  await clearSession(page)
  await page.goto('/register')

  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  await page.getByLabel('昵称').fill('E2E 账号')
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码', { exact: true }).fill('OrbitE2E123!')
  await page.getByLabel('确认密码').fill('OrbitE2E123!')
  await page.getByRole('button', { name: '创建账号' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText('E2E 账号').first()).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL('/')
  await expect(page.getByText('E2E 账号').first()).toBeVisible()

  await page.goto('/settings')
  await page.getByLabel('显示名称').fill('E2E 新名称')
  await page.getByRole('button', { name: '保存名称' }).click()
  await expect(page.getByText('账号名称已保存')).toBeVisible()

  await page.reload()
  await expect(page.getByText('E2E 新名称').first()).toBeVisible()

  await page.getByRole('button', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/settings')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)settings$/)
})

test('changes the password and rejects the old credential', async ({ page }) => {
  await clearSession(page)
  await page.goto('/register')

  const email = `e2e-password-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  await page.getByLabel('昵称').fill('E2E 密码')
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码', { exact: true }).fill('OrbitE2E123!')
  await page.getByLabel('确认密码').fill('OrbitE2E123!')
  await page.getByRole('button', { name: '创建账号' }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/settings')
  await page.getByLabel('当前密码').fill('OrbitE2E123!')
  await page.getByLabel('新密码', { exact: true }).fill('OrbitE2E456!')
  await page.getByLabel('确认新密码').fill('OrbitE2E456!')
  await page.getByRole('button', { name: '更新密码' }).click()

  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码', { exact: true }).fill('OrbitE2E123!')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByText('邮箱或密码不正确，请重试。')).toBeVisible()

  await page.getByLabel('密码', { exact: true }).fill('OrbitE2E456!')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('/')
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
