import { test, expect, type Page } from '@playwright/test'
import { getProject } from '../../src/content/projetos'

const ROOMS = getProject('apartamento-pedra')!.rooms

// Roda em dois projetos: "no-webgl" (Chrome sem WebGL: cai sozinho no fallback) e "chromium",
// onde `?3d=0` força o mesmo caminho.

async function expectFallback(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  const grid = page.locator('#casa [data-house-fallback]')
  await expect(grid).toBeVisible()
  await expect(grid.getByRole('button')).toHaveCount(ROOMS.length)
  await expect(page.locator('#casa [data-house-canvas]')).toHaveCount(0)
  await expect(page.locator('#casa img[src*="maquete-fallback"]')).toBeVisible()

  const living = grid.getByRole('button', { name: /Living/ })
  await living.click()
  const panel = page.locator('[data-room-panel="living"]')
  await expect(panel.getByRole('heading', { level: 3, name: 'Living' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(living).toBeFocused()

  // sem rolagem horizontal
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  expect(errors).toEqual([])
}

test.describe('home sem 3D', () => {
  test('?3d=0 mostra a grade, abre o painel e não gera erro', async ({ page }) => {
    await page.goto('/?3d=0')
    await expectFallback(page)
  })

  test('em 375px não há rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/?3d=0')
    await expectFallback(page)
  })

  test('sem WebGL no navegador cai no fallback', async ({ page, browserName }, info) => {
    test.skip(info.project.name !== 'no-webgl', 'só no projeto sem WebGL')
    expect(browserName).toBe('chromium')
    await page.goto('/')
    await expectFallback(page)
  })
})
