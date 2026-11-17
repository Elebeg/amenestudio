'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ViewTransition } from 'react'
import { gsap } from 'gsap'

/**
 * Entrada da página do projeto.
 * Com View Transitions (React 19.3 + Next 16.4, sem flag) o navegador faz o crossfade;
 * sem suporte à API, cai num fade GSAP. Respeita prefers-reduced-motion.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supportsVT = typeof document.startViewTransition === 'function'
    if (reduced || supportsVT) return
    const tween = gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', clearProps: 'transform' })
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'opacity,transform' })
    }
  }, [])

  return (
    <ViewTransition default="page-fade">
      <div ref={ref}>{children}</div>
    </ViewTransition>
  )
}
