import { test, expect } from './fixtures'

test('home responde 200, pt-BR e um único h1', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBe(200)
  await expect(page.locator('html[lang="pt-BR"]')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)
})
