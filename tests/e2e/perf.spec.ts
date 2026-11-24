import { test, expect } from './fixtures'

// Roda no projeto "webgl" (playwright.config): SwiftShader conta como aparelho fraco,
// então `?maquete=1` força o canvas, como em house.spec.ts.

/**
 * Desempenho da home. A fixture compartilhada põe a visita em modo `short` da abertura
 * (`amene:intro-seen`): só o logo e o clarão tocam, e o Canvas do amanhecer não entra.
 */
test.describe('desempenho da home', () => {
  test.setTimeout(90_000)

  test('o chunk do three (maquete da #casa) só é pedido depois do clarão da abertura', async ({ page }) => {
    // Os chunks têm nome com hash, então a identidade vem do conteúdo: o chunk grande (> 200 KB)
    // que cria o contexto 'webgl2' é o do three/R3F da maquete. A sonda de qualidade, pequena,
    // também cita 'webgl2' e é ignorada pelo tamanho. Em modo short, HouseScene é o único Canvas.
    const threeChunks = new Set<string>()
    const pending: Promise<void>[] = []
    page.on('response', (res) => {
      const url = res.url()
      if (!/\/_next\/static\/chunks\/.+\.js/.test(url)) return
      pending.push(
        res
          .text()
          .then((body) => {
            if (body.length > 200_000 && body.includes('webgl2')) threeChunks.add(url)
          })
          .catch(() => {}),
      )
    })
    // Relógio único (performance.now da página): o instante em que a abertura chega ao clarão e
    // o início de cada requisição vêm do mesmo relógio, sem corrida entre eventos do Playwright.
    await page.addInitScript(() => {
      const w = window as unknown as { __flashAt?: number }
      new MutationObserver(() => {
        const phase = document.querySelector('[data-phase]')?.getAttribute('data-phase')
        if (w.__flashAt === undefined && (phase === 'flash' || phase === 'done')) w.__flashAt = performance.now()
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-phase'] })
    })

    await page.goto('/?maquete=1')
    await expect(page.locator('[data-casa-stage]')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    await Promise.all(pending)

    const timing = await page.evaluate(() => ({
      flashAt: (window as unknown as { __flashAt?: number }).__flashAt ?? null,
      starts: Object.fromEntries(performance.getEntriesByType('resource').map((e) => [e.name, e.startTime])) as Record<string, number>,
    }))

    expect(threeChunks.size, 'a maquete deveria ter carregado o three').toBeGreaterThan(0)
    expect(timing.flashAt, 'a abertura deveria ter chegado ao clarão').not.toBeNull()
    for (const url of threeChunks) {
      expect(timing.starts[url], `chunk ${url} sem entrada de desempenho`).toBeDefined()
      expect(timing.starts[url]).toBeGreaterThanOrEqual(timing.flashAt!)
    }
  })

  test('imagens acima da dobra somam menos de 600 KB', async ({ page }) => {
    let bytes = 0
    const pending: Promise<void>[] = []
    page.on('response', (res) => {
      if (!(res.headers()['content-type'] ?? '').startsWith('image/')) return
      pending.push(
        res
          .body()
          .then((b) => {
            bytes += b.length
          })
          .catch(() => {}),
      )
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await Promise.all(pending)
    expect(bytes).toBeGreaterThan(0)
    expect(bytes).toBeLessThan(600 * 1024)
  })
})
