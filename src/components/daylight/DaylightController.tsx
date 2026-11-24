'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { paletteAt } from '@/lib/daylight'

gsap.registerPlugin(ScrollTrigger)

/**
 * O <main> da página visível. Com Cache Components o Next guarda as rotas visitadas num
 * <Activity> escondido (`display: none`, ainda no DOM): pode haver mais de um <main>.
 */
function visibleMain(): HTMLElement | null {
  return Array.from(document.querySelectorAll('main')).find((m) => m.getClientRects().length > 0) ?? null
}

const isLive = (el: Element | undefined | null) => !!el && el.isConnected && el.getClientRects().length > 0

/**
 * Escreve --bg/--fg/--muted/--accent/--line em <html> conforme a rolagem do <main>.
 * Montado uma vez no layout: a cada navegação no cliente (pathname novo) o <main> é outro,
 * então o gatilho é refeito sobre ele e o ScrollTrigger recalcula as posições.
 */
export function DaylightController() {
  const pathname = usePathname()
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    // A cor muda mesmo com reduced-motion; apenas sem suavização.
    const setSmoothing = () =>
      root.style.setProperty('--daylight-smoothing', mq.matches ? '0s' : '0.15s')
    setSmoothing()
    mq.addEventListener('change', setSmoothing)

    const apply = (t: number) => {
      const p = paletteAt(t)
      root.style.setProperty('--bg', p.bg)
      root.style.setProperty('--fg', p.fg)
      root.style.setProperty('--muted', p.muted)
      root.style.setProperty('--accent', p.accent)
      root.style.setProperty('--line', p.line)
    }

    let st: ScrollTrigger | undefined
    // a altura do <main> muda depois da montagem (imagens, fontes, maquete): recalcula no quadro seguinte
    let pending = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    // <main> resolvido aqui, a cada setup (e no próximo frame, após a hidratação/remontagens).
    const setup = () => {
      const main = visibleMain()
      if (!main) return
      st?.kill()
      ro.disconnect()
      ro.observe(main)
      st = ScrollTrigger.create({
        trigger: main,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      })
      apply(st.progress)
      ScrollTrigger.refresh()
    }
    // o <main> novo pode aparecer depois do pathname (transição, Suspense): tenta de novo nos
    // próximos quadros até achá-lo conectado, e então recalcula as posições com o layout final
    let raf = 0
    let tries = 0
    const settle = () => {
      if (!isLive(st?.trigger)) setup()
      else ScrollTrigger.refresh()
      if (!isLive(st?.trigger) && ++tries < 30) raf = requestAnimationFrame(settle)
    }
    setup()
    raf = requestAnimationFrame(settle)

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pending)
      ro.disconnect()
      st?.kill()
      mq.removeEventListener('change', setSmoothing)
    }
  }, [pathname])

  return null
}
