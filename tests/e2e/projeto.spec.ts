import { test, expect } from './fixtures'

test('página do projeto: 200, h1 com o nome e um h2 por cômodo', async ({ page }) => {
  const res = await page.goto('/projetos/apartamento-pedra')
  expect(res?.status()).toBe(200)
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText('Apartamento Pedra')
  // 7 cômodos no conteúdo (4 quartos)
  await expect(page.locator('main h2')).toHaveCount(7)
  await expect(page.getByRole('link', { name: /contato|conversar/i }).first()).toHaveAttribute(
    'href',
    '/#contato',
  )
})

test('página do projeto: sem rolagem horizontal em 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/projetos/apartamento-pedra')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('projeto inexistente responde 404 com link para a home', async ({ page }) => {
  const res = await page.goto('/projetos/xyz')
  expect(res?.status()).toBe(404)
  await expect(page.locator('main a[href="/"]')).toHaveCount(1)
})
