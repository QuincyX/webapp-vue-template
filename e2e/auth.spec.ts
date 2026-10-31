import { expect, test } from '@playwright/test'

import { clearSession, DEMO_EMAIL, DEMO_PASSWORD, signInFresh } from './helpers'

test('redirects anonymous users and returns to the requested page', async ({ page }) => {
  await page.goto('/login')
  await clearSession(page)
  await page.goto('/tasks')

  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)tasks$/)

  await page.getByLabel('邮箱').fill(DEMO_EMAIL)
  await page.getByLabel('密码', { exact: true }).fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('任务清单')
})

test('shows an inline error for invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await clearSession(page)
  await page.reload()

  await page.getByLabel('邮箱').fill(DEMO_EMAIL)
  await page.getByLabel('密码', { exact: true }).fill('definitely-wrong')
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page.getByText('邮箱或密码不正确，请重试。')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('validates the sign-up form before submitting', async ({ page }) => {
  await page.goto('/register')
  await clearSession(page)
  await page.reload()

  await page.getByLabel('昵称').fill('E2E 校验')
  await page.getByLabel('邮箱').fill('e2e-validation@example.com')
  await page.getByLabel('密码', { exact: true }).fill('OrbitE2E123!')
  await page.getByLabel('确认密码').fill('OrbitE2E456!')
  await page.getByRole('button', { name: '创建账号' }).click()

  await expect(page.getByText('两次输入的密码不一致')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('registers an account, updates profile, and signs out', async ({ page }) => {
  await page.goto('/register')
  await clearSession(page)
  await page.reload()

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
  await page.goto('/register')
  await clearSession(page)
  await page.reload()

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

test('keeps the session across a reload', async ({ page }) => {
  await signInFresh(page)

  await page.reload()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/早上好|下午好|晚上好|夜深了/)
})
