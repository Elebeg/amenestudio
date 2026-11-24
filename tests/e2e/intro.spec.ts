import { test, expect } from '@playwright/test'

// Abertura (00): sem a fixture compartilhada, cada teste entra como primeira visita da sessão.

const layer = '#amene-intro'

test.describe('abertura', () => {
  test('primeira visita: botão "Pular abertura" é o primeiro focável; Esc encerra em < 1 s', async ({ page }) => {
    await page.goto('/')
    const skip = page.getByRole('button', { name: 'Pular abertura' })
    await expect(skip).toBeVisible()
    await expect(page.locator(layer)).toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator(layer)).toHaveAttribute('data-mode', 'full')
    // o botão fica fora da camada aria-hidden e é o primeiro focável do <body>
    expect(await page.locator(`${layer} button, ${layer} a`).count()).toBe(0)
    const firstFocusable = await page.evaluate(() => {
      const el = document.body.querySelector<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')
      return el?.textContent?.trim()
    })
    expect(firstFocusable).toBe('Pular abertura')
    // <main> nunca fica inerte
    await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/)

    await page.keyboard.press('Escape')
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 1000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('recarregar na mesma sessão: modo curto, some em < 2 s sem clicar', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Escape')
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 1000 })
    await page.reload()
    const l = page.locator(layer)
    await expect(l).toHaveAttribute('data-mode', 'short')
    await expect(page.locator('.falling-letter')).toHaveCount(0)
    // "some": a abertura termina (clarão dissolvendo) em menos de 2 s
    await expect(page.locator(`${layer}:not([data-phase='done'])`)).toHaveCount(0, { timeout: 2000 })
    await expect(l).toHaveCount(0, { timeout: 1500 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('prefers-reduced-motion: sem letras caindo, logo com fade', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator(layer)).toHaveAttribute('data-mode', 'reduced')
    await expect(page.locator('.falling-letter')).toHaveCount(0)
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 3000 })
  })

  test('um único evento de roda encerra a abertura e já rola a página', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(layer)).toHaveAttribute('data-mode', 'full')
    await page.mouse.move(600, 400)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.mouse.wheel(0, 500)
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 1000 })
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })

  test('clicar em "Pular abertura" leva o foco ao cabeçalho', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Pular abertura' }).click()
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 1000 })
    await expect(page.getByRole('link', { name: 'Amene, página inicial' })).toBeFocused()
  })

  test('Tab também pula a abertura', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(layer)).toHaveAttribute('data-mode', 'full')
    await page.keyboard.press('Tab')
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 1000 })
  })

  test('sessionStorage bloqueado: trata como primeira visita, sem erro', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('bloqueado', 'SecurityError')
        },
      })
    })
    await page.goto('/')
    await expect(page.locator(layer)).toHaveAttribute('data-mode', 'full')
    await page.keyboard.press('Escape')
    await expect(page.locator(layer)).toHaveCount(0, { timeout: 1000 })
    expect(errors).toEqual([])
  })

  test('páginas internas não têm abertura', async ({ page }) => {
    await page.goto('/projetos/apartamento-pedra')
    await expect(page.locator('[data-intro-root]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Pular abertura' })).toHaveCount(0)
  })
})

test.describe('abertura sem JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('a home rola e o conteúdo fica visível (a camada nunca prende a página)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(layer)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Pular abertura' })).toBeHidden()
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden')
    await page.mouse.move(600, 400)
    await page.mouse.wheel(0, 800)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })
})
