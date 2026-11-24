import { type Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { site } from '../../src/config/site'

// Navegação no cliente (Link do Next): o layout persiste entre as páginas, então o que ele monta
// uma vez (DaylightController, abertura, cabeçalho, botão do WhatsApp) tem de acompanhar o <main> novo.

const PROJECT = '/projetos/apartamento-pedra'

const bg = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase())

/** Rola a janela até a fração `f` da altura rolável. */
const scrollToFraction = (page: Page, f: number) =>
  page.evaluate((frac) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, Math.round(max * frac))
  }, f)

async function waitDaylightReady(page: Page) {
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--bg') !== '')
}

test('daylight volta a funcionar na home depois de entrar por um projeto e clicar no logo', async ({ page }) => {
  await page.goto(PROJECT)
  await waitDaylightReady(page)
  // no fim da página do projeto o fundo já anoiteceu: um gatilho preso ao <main> antigo deixaria assim
  await scrollToFraction(page, 1)
  await expect.poll(() => bg(page), { timeout: 10_000 }).toBe('#1c1916')

  await page.getByRole('link', { name: 'Amene, página inicial' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('main #casa')).toBeVisible()

  await scrollToFraction(page, 0.5)
  await expect.poll(() => bg(page), { timeout: 10_000 }).not.toBe('#1c1916')
  await scrollToFraction(page, 1)
  await expect.poll(() => bg(page), { timeout: 10_000 }).toBe('#1c1916')
  // a página do projeto continua no DOM, escondida pelo <Activity> do Next: só um <main> visível
  await expect(page.locator('main:visible')).toHaveCount(1)
})

test('home → projeto → home: a abertura não repete, cabeçalho e botão do WhatsApp continuam certos', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')
  await page.locator(`main a[href="${PROJECT}"]`).first().click()
  await expect(page).toHaveURL(new RegExp(`${PROJECT}$`))
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Amene, página inicial' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('main #casa')).toBeVisible()

  // a abertura é só da primeira carga do documento
  await expect(page.locator('[data-intro-root]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pular abertura' })).toHaveCount(0)

  // cabeçalho fixo e navegável
  const header = page.locator('header').first()
  await expect(header).toBeVisible()
  await expect(header.getByRole('navigation', { name: 'Principal' }).getByRole('link')).toHaveCount(5)

  // botão do WhatsApp: visível quando há número; sem número (placeholder) não existe
  const fab = page.getByRole('link', { name: 'Conversar pelo WhatsApp' })
  if (site.whatsapp.number) await expect(fab).toBeVisible()
  else await expect(fab).toHaveCount(0)

  // daylight ligado ao <main> da home
  await waitDaylightReady(page)
  await scrollToFraction(page, 1)
  await expect.poll(() => bg(page), { timeout: 10_000 }).toBe('#1c1916')
  expect(errors).toEqual([])
})

test.describe('cabeçalhos de cache', () => {
  test('a página do projeto não herda o cache longo das fotos; a foto herda', async ({ request }) => {
    const doc = await request.get(PROJECT)
    expect(doc.status()).toBe(200)
    expect(doc.headers()['cache-control'] ?? '').not.toContain('max-age=86400')

    const photo = await request.get(`${PROJECT}/IMG_4736.webp`)
    expect(photo.status()).toBe(200)
    expect(photo.headers()['cache-control'] ?? '').toContain('max-age=86400')

    const texture = await request.get('/textures/stone.webp')
    expect(texture.headers()['cache-control'] ?? '').toContain('max-age=86400')
  })

  test('o payload RSC do projeto e o 404 de projeto também ficam fora', async ({ request }) => {
    const rsc = await request.get(PROJECT, { headers: { RSC: '1' } })
    expect(rsc.headers()['cache-control'] ?? '').not.toContain('max-age=86400')
    const missing = await request.get('/projetos/nao-existe')
    expect(missing.status()).toBe(404)
    expect(missing.headers()['cache-control'] ?? '').not.toContain('max-age=86400')
  })
})
