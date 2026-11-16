'use client'

import { ReactLenis, useLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, type ReactNode } from 'react'

gsap.registerPlugin(ScrollTrigger)

export { useLenis }

/**
 * Árvore estável: ReactLenis é sempre renderizado (sem remontar filhos).
 * Sob prefers-reduced-motion o Lenis é destruído e a rolagem fica nativa.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let destroyed = false
    let lenis: LenisRef['lenis']
    let attached = false

    const onScroll = () => ScrollTrigger.update()
    // A instância pode ainda não existir neste effect: lê-se a cada tick.
    const tick = (time: number) => {
      lenis = lenisRef.current?.lenis
      if (!lenis || destroyed) return
      if (mq.matches) {
        lenis.destroy()
        destroyed = true
        return
      }
      if (!attached) {
        lenis.on('scroll', onScroll)
        attached = true
      }
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis?.off('scroll', onScroll)
    }
  }, [])

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  )
}
