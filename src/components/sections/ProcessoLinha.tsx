'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Traço que se desenha ao longo das etapas com a rolagem. Repouso (e reduced-motion): inteiro. */
export function ProcessoLinha({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = ref.current
        if (!el?.parentElement) return
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return <span ref={ref} className={className} aria-hidden="true" />
}
