'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { paletteAt } from '@/lib/daylight'

gsap.registerPlugin(ScrollTrigger)

/** Escreve --bg/--fg/--muted/--accent/--line em <html> conforme a rolagem do <main>. */
export function DaylightController() {
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
    // <main> resolvido aqui, a cada setup (e no próximo frame, após a hidratação/remontagens).
    const setup = () => {
      const main = document.querySelector('main')
      if (!main) return
      st?.kill()
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
    setup()
    const raf = requestAnimationFrame(() => {
      if (!st || !st.trigger?.isConnected) setup()
      else ScrollTrigger.refresh()
    })

    return () => {
      cancelAnimationFrame(raf)
      st?.kill()
      mq.removeEventListener('change', setSmoothing)
    }
  }, [])

  return null
}
