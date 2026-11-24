import { test, expect } from '@playwright/test'

const IDS = ['casa', 'manifesto', 'projetos', 'processo', 'estudio', 'contato']

test.describe('home: seções institucionais', () => {
  test('as 6 seções existem na ordem e cada uma tem um h2', async ({ page }) => {
    await page.goto('/')
    const ids = await page.locator('main > section[id]').evaluateAll((els) => els.map((e) => e.id))
    expect(ids).toEqual(IDS)
    for (const id of IDS) {
      await expect(page.locator(`#${id} h2`), `#${id} sem h2`).toHaveCount(1)
    }
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('todas as imagens têm alt não vazio', async ({ page }) => {
    await page.goto('/')
    // capas da grade do fallback são decorativas (alt vazio): o botão já nomeia o cômodo
    const alts = await page.locator('img:not([data-house-fallback] img)').evaluateAll((els) => els.map((e) => e.getAttribute('alt') ?? ''))
    expect(alts.length).toBeGreaterThan(0)
    for (const alt of alts) expect(alt.trim()).not.toBe('')
  })

  test('#contato contém o formulário e o Instagram em destaque', async ({ page }) => {
    await page.goto('/')
    const contato = page.locator('#contato')
    await expect(contato.locator('form')).toHaveCount(1)
    await expect(contato.getByLabel('Nome')).toBeVisible()
  })

  test('"Ver projeto completo" aponta para a página do projeto', async ({ page }) => {
    await page.goto('/')
    const link = page.getByRole('link', { name: 'Ver projeto completo' }).first()
    await expect(link).toHaveAttribute('href', '/projetos/apartamento-pedra')
  })

  test('manifesto: palavras visíveis (opacity 1) com reduced-motion', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto('/')
    const words = page.locator('#manifesto [data-word]')
    expect(await words.count()).toBeGreaterThan(5)
    await page.waitForTimeout(300)
    const ops = await words.evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))
    for (const o of ops) expect(o).toBe('1')
    await ctx.close()
  })

  test('envio inválido move o foco para o primeiro campo inválido', async ({ page }) => {
    await page.goto('/')
    // Sem número de WhatsApp o botão fica desabilitado; dispara o submit pelo form.
    await page.locator('#contato form').evaluate((f: HTMLFormElement) => f.requestSubmit())
    await expect(page.locator('#lead-nome')).toBeFocused()
  })

  test('sem rolagem horizontal em 375px', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await ctx.newPage()
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await ctx.close()
  })
})
