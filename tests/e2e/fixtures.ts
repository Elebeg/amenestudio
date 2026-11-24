import { test as base, expect } from '@playwright/test'

/**
 * Fixture compartilhada: as specs que não testam a abertura entram como visitante que já a viu
 * nesta sessão (modo curto) e cada `page.goto` espera a camada da abertura sair do DOM antes de
 * seguir. Quem testa a abertura (intro.spec.ts) importa direto de '@playwright/test'.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        window.sessionStorage.setItem('amene:intro-seen', '1')
      } catch {
        // sem sessionStorage: a abertura completa toca e o goto abaixo espera ela acabar
      }
    })
    const goto = page.goto.bind(page)
    page.goto = async (url, options) => {
      const res = await goto(url, options)
      await page.locator('[data-intro-root]').waitFor({ state: 'detached', timeout: 20_000 })
      return res
    }
    const reload = page.reload.bind(page)
    page.reload = async (options) => {
      const res = await reload(options)
      await page.locator('[data-intro-root]').waitFor({ state: 'detached', timeout: 20_000 })
      return res
    }
    await provide(page)
  },
})

export { expect }
