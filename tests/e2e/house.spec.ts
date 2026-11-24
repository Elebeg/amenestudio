import { test, expect } from './fixtures'
import { getProject } from '../../src/content/projetos'

const ROOMS = getProject('apartamento-pedra')!.rooms

// Roda no projeto "webgl" (playwright.config): chromium com SwiftShader para o canvas renderizar.
// SwiftShader conta como aparelho fraco (fica a capa estática); `?maquete=1` força o canvas.

test.describe('home: maquete 3D', () => {
  // um canvas por vez: WebGL por software é pesado
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(90_000)

  test('Living na lista abre o painel com fotos; Esc fecha e devolve o foco', async ({ page }) => {
    await page.goto('/?maquete=1')
    const nav = page.getByRole('navigation', { name: 'Ambientes da maquete' })
    const living = nav.getByRole('button', { name: 'Living', exact: true })
    await living.click()

    const panel = page.locator('[data-room-panel="living"]')
    await expect(panel.getByRole('heading', { level: 3, name: 'Living' })).toBeVisible()
    expect(await panel.locator('img').count()).toBeGreaterThanOrEqual(3)
    await expect(panel.getByRole('link', { name: 'Ver projeto completo' })).toHaveAttribute('href', '/projetos/apartamento-pedra#room-living')
    await expect(living).toHaveAttribute('aria-current', 'true')

    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(living).toBeFocused()
  })

  test('a lista tem Visão geral + um botão por cômodo do projeto', async ({ page }) => {
    await page.goto('/?maquete=1')
    const nav = page.getByRole('navigation', { name: 'Ambientes da maquete' })
    await expect(nav.getByRole('button')).toHaveCount(ROOMS.length + 1)
  })

  test('o rótulo do canvas abre o cômodo e o foco volta a ele ao fechar', async ({ page }) => {
    await page.goto('/?maquete=1')
    await expect(page.locator('[data-casa-stage]')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    const label = page.locator('button[data-room-label="living"]')
    await label.click()
    await expect(page.locator('[data-room-panel="living"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-room-panel]')).toHaveCount(0)
    await expect(label).toBeFocused()
  })

  test('setas na lista trocam de cômodo', async ({ page }) => {
    await page.goto('/?maquete=1')
    const nav = page.getByRole('navigation', { name: 'Ambientes da maquete' })
    await nav.getByRole('button', { name: 'Visão geral' }).focus()
    await page.keyboard.press('ArrowDown')
    const first = nav.getByRole('button').nth(1)
    await expect(first).toBeFocused()
    await expect(first).toHaveAttribute('aria-current', 'true')
    await expect(page.locator('[data-room-panel]')).toHaveCount(1)
  })

  test('a capa fica no lugar até o canvas ficar pronto; depois os rótulos são botões', async ({ page }) => {
    await page.goto('/?maquete=1')
    const stage = page.locator('[data-casa-stage]')
    await expect(stage.locator('img').first()).toBeVisible()
    await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    // um rótulo por cômodo do projeto (7 na planta atual)
    await expect(page.locator('button[data-room-label]')).toHaveCount(ROOMS.length)
    await expect(page.locator('button[data-room-label="living"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dia' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Noite' }).click()
    await expect(page.getByRole('button', { name: 'Noite' })).toHaveAttribute('aria-pressed', 'true')
    await expect(stage).toHaveAttribute('data-lighting', 'noite')
  })

  test('sem ?maquete=1, WebGL por software fica na capa estática e a lista ainda abre o painel', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2500)
    await expect(page.locator('[data-house-canvas]')).toHaveCount(0)
    await expect(page.locator('[data-casa-stage] img').first()).toBeVisible()
    // o painel mostra min(4, fotos do cômodo): esperado derivado do conteúdo, não fixo
    const lavabo = getProject('apartamento-pedra')!.rooms.find((r) => r.id === 'lavabo')!
    await page.getByRole('navigation', { name: 'Ambientes da maquete' }).getByRole('button', { name: lavabo.nome }).click()
    await expect(page.locator('[data-room-panel="lavabo"] img')).toHaveCount(Math.min(4, lavabo.fotos.length))
  })

  test('a roda do mouse sobre o canvas rola a página', async ({ page }) => {
    await page.goto('/?maquete=1')
    const canvas = page.locator('[data-house-canvas] canvas')
    await expect(canvas).toBeVisible({ timeout: 60_000 })
    const box = (await canvas.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 600)
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(before + 100)
  })
})
