import { test, expect } from '@playwright/test'

test('robots.txt e sitemap.xml respondem 200', async ({ request }) => {
  const r = await request.get('/robots.txt')
  expect(r.status()).toBe(200)
  expect(await r.text()).toContain('Sitemap: ')
  const s = await request.get('/sitemap.xml')
  expect(s.status()).toBe(200)
  expect(await s.text()).toContain('/projetos/apartamento-pedra')
})

test('home tem canonical, og:image e JSON-LD válido', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /opengraph-image/)
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(blocks.length).toBeGreaterThan(0)
  for (const b of blocks) expect(JSON.parse(b)['@type']).toBe('ProfessionalService')
})

test('página do projeto tem canonical próprio, og:image e JSON-LD CreativeWork', async ({ page }) => {
  await page.goto('/projetos/apartamento-pedra')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/projetos\/apartamento-pedra$/)
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /opengraph-image/)
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b)['@type'])
  expect(types).toContain('CreativeWork')
})

test('imagens OG respondem com PNG 200', async ({ request }) => {
  for (const u of ['/opengraph-image', '/projetos/apartamento-pedra/opengraph-image']) {
    const r = await request.get(u)
    expect(r.status()).toBe(200)
    expect(r.headers()['content-type']).toContain('image/png')
  }
})
