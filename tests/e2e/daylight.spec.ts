import { test, expect } from '@playwright/test'

const baseURL = `http://localhost:${process.env.E2E_PORT ?? '3000'}`

test.use({ baseURL })

test('a paleta escurece ao rolar até o fim e há um único <main> conectado', async ({ page }) => {
  await page.goto('/')
  // espera o controller montar (hidratação concluída) antes de mexer no DOM
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--daylight-smoothing') !== '' && document.documentElement.style.getPropertyValue('--bg') !== '')
  await page.evaluate(() => {
    const spacer = document.createElement('div')
    spacer.style.height = '6000px'
    document.querySelector('main')!.appendChild(spacer)
    window.dispatchEvent(new Event('resize'))
  })
  const bg = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase())
  await expect.poll(bg).toBe('#efebe5')
  await page.waitForTimeout(600) // ScrollTrigger refresca o resize com debounce
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(bg, { timeout: 10_000 }).toBe('#1c1916')
  await expect(page.locator('main')).toHaveCount(1)
  expect(await page.evaluate(() => document.querySelector('main')!.isConnected)).toBe(true)
})
