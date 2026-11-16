'use client'

import { ReactLenis, useLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState, type ReactNode } from 'react'

gsap.registerPlugin(ScrollTrigger)

export { useLenis }

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)
  const [enabled, setEnabled] = useState(false)

  // Lenis desligado com prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled(!mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const lenis = lenisRef.current?.lenis
    if (!lenis) return
    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
    }
  }, [enabled])

  if (!enabled) return <>{children}</>
  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  )
}
