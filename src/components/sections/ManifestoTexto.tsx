'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Frase com palavras que acendem com a rolagem (opacity .2 → 1).
 * O estado de repouso (CSS/SSR) é opacity 1: com reduced-motion ou sem JS nada fica apagado.
 */
export function ManifestoTexto({ texto, className }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const palavras = texto.split(' ')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = ref.current
        if (!el) return
        gsap.fromTo(
          el.querySelectorAll('[data-word]'),
          { opacity: 0.2 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <p ref={ref} className={className}>
      {palavras.map((w, i) => (
        <span key={i} data-word>
          {w}
          {i < palavras.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  )
}
