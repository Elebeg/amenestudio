'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import { gsap } from 'gsap'
import { INTRO_LETTERS, letterSchedule, phaseStart, type IntroMode } from '@/lib/introMachine'
import s from './intro.module.css'

type Props = {
  mode: IntroMode
  /** relógio da abertura (s): a linha do tempo das letras é posicionada por ele a cada quadro */
  clock: RefObject<number>
}

const FALL = 0.82 // queda (s), acelerando: peso
const SPREAD = 0.2 // afastamento extra entre as letras durante a queda (em em)

/**
 * As letras A·M·E·N·E: HTML (aria-hidden, neutras para SEO), Cormorant.
 * Modo completo: caem do céu uma a uma (`y: -120vh → 0`, leve rotação, quique curto e
 * amortecido no pouso) e depois deslizam até o desenho do logo (espaçamento do cabeçalho).
 * Modos curto e reduzido: o logo já formado aparece (o curto com um leve assentamento,
 * o reduzido só com fade), sem nenhuma `.falling-letter`.
 */
export function FallingLetters({ mode, clock }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (mode !== 'full' || !root.current) return
    const el = root.current
    const letters = gsap.utils.toArray<HTMLElement>('[data-letter]', el)
    const rule = el.querySelector<HTMLElement>('[data-rule]')
    const caption = el.querySelector<HTMLElement>('[data-caption]')
    const fs = parseFloat(getComputedStyle(letters[0]).fontSize) || 100
    const mid = (letters.length - 1) / 2
    const spreadX = (i: number) => (i - mid) * SPREAD * fs
    const logoAt = phaseStart('full', 'logo') ?? 9

    const tl = gsap.timeline({ paused: true })
    gsap.set(letters, { opacity: 0, y: () => -1.2 * window.innerHeight, transformOrigin: '50% 100%' })
    gsap.set(rule, { scaleX: 0, opacity: 0 })
    gsap.set(caption, { opacity: 0, y: 8 })

    letterSchedule().forEach(({ at }, i) => {
      const l = letters[i]
      const tilt = (i % 2 ? 1 : -1) * (5 + ((i * 37) % 5))
      gsap.set(l, { x: spreadX(i), rotation: tilt })
      tl.to(l, { opacity: 1, duration: 0.22, ease: 'none' }, at)
      tl.to(l, { y: 0, rotation: tilt * 0.2, duration: FALL, ease: 'power3.in' }, at)
      // pouso: amassa de leve, sobe um pouco e assenta (o "bounce" suavizado)
      tl.to(l, { scaleY: 0.93, scaleX: 1.03, duration: 0.07, ease: 'power1.out' }, at + FALL)
      tl.to(l, { y: -0.06 * fs, scaleY: 1, scaleX: 1, rotation: 0, duration: 0.18, ease: 'power2.out' }, at + FALL + 0.07)
      tl.to(l, { y: 0, duration: 0.3, ease: 'bounce.out' }, at + FALL + 0.25)
    })
    // encaixe no logo: as letras deslizam até o espaçamento do cabeçalho
    tl.to(letters, { x: 0, duration: 1.0, ease: 'power3.inOut' }, logoAt)
    tl.to(rule, { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power2.out' }, logoAt + 0.45)
    tl.to(caption, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, logoAt + 0.6)

    const tick = () => {
      tl.time(Math.min(clock.current ?? 0, tl.duration()), false)
    }
    tick()
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      tl.kill()
    }
  }, [mode, clock])

  const letterClass = mode === 'full' ? `falling-letter ${s.letter}` : s.letter
  return (
    <div ref={root} className={s.lockup} data-mode={mode} aria-hidden="true">
      <div className={s.word}>
        {INTRO_LETTERS.map((l, i) => (
          <span key={i} className={letterClass} data-letter>
            {l}
          </span>
        ))}
      </div>
      <span className={s.rule} data-rule />
      <span className={s.caption} data-caption>
        Arquitetura e interiores
      </span>
    </div>
  )
}
