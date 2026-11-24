'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'
import { startIntroClock, type IntroClock } from '@/lib/introClock'
import { site } from '@/config/site'
import { useLenis } from '@/components/providers/SmoothScroll'
import { detectTierInBrowser } from '@/lib/quality'
import {
  introMode,
  introReducer,
  introSceneKind,
  markIntroSeen,
  phaseStart,
  readIntroSeen,
  type IntroMode,
} from '@/lib/introMachine'
import { FallingLetters } from './FallingLetters'
import { IntroDawnScene, type DawnKind, type StillPhoto } from './IntroDawnScene'
import { INTRO_LAYER_ID, setIntroGone, setIntroPhase } from './introStore'
import s from './intro.module.css'

/** Amanhecer: começa no marco `dawn` e a rampa inteira dura até pouco depois do clarão. */
const DAWN_START = phaseStart('full', 'dawn') ?? 0.6
const DAWN_DURATION = 10
/** Quanto tempo o relógio espera, no preto, a cena ficar pronta (s). */
const MAX_HOLD = 2.5
/** Nenhuma abertura passa disto, aconteça o que acontecer (ms). */
const FAILSAFE_MS = 20_000
/** Saídas: tempo até desmontar a camada (ms), igual às transições do CSS. */
const EXIT_MS = { skip: 420, natural: 900, fade: 650 } as const

type Exit = keyof typeof EXIT_MS

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/** Primeiro elemento focável da página fora da abertura (o que viria depois do botão). */
function firstFocusableAfterIntro(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE))
  return all.find((el) => !el.closest('[data-intro-root]') && el.offsetParent !== null) ?? null
}

/**
 * `?abertura=6` congela a abertura completa em 6 s (revisão visual e capturas de tela).
 * Só fora de produção, ou com NEXT_PUBLIC_INTRO_DEBUG definido no build.
 */
const INTRO_DEBUG = process.env.NODE_ENV !== 'production' || !!process.env.NEXT_PUBLIC_INTRO_DEBUG
function frozenTime(): number | null {
  if (!INTRO_DEBUG) return null
  const v = new URLSearchParams(window.location.search).get('abertura')
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * 00 · Abertura. Camada por cima do site, que existe inteiro no HTML desde o primeiro byte.
 * Só na home e só na primeira carga do documento (navegar de volta para a home não repete).
 */
export function Intro({ still }: { still: StillPhoto }) {
  const pathname = usePathname()
  const [active] = useState(() => pathname === '/')
  useEffect(() => {
    if (!active) {
      setIntroPhase('done')
      setIntroGone()
    }
  }, [active])
  if (!active) return null
  return <IntroRun still={still} />
}

type IntroConfig = { mode: IntroMode; kind: DawnKind; frozen: number | null }

function sessionStore(): Storage | undefined {
  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}

let config: IntroConfig | null = null
/** Modo e tipo de cena: decididos uma vez por carga do documento, só no cliente. */
function readConfig(): IntroConfig {
  if (config) return config
  const frozen = frozenTime()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mode = frozen !== null ? 'full' : introMode({ seenThisSession: readIntroSeen(sessionStore()), reducedMotion: reduced })
  // a sonda de WebGL (cria um contexto) só roda quando o canvas ainda é uma opção
  const hasVideo = !!site.intro.videoSrc
  const kind: DawnKind = introSceneKind({
    mode,
    hasVideo,
    tier: mode === 'full' && !hasVideo ? detectTierInBrowser() : 'none',
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  })
  // o chunk da cena começa a baixar já (a espera no preto é curta); se falhar, o
  // dynamic() da cena tenta de novo e o DawnBoundary cai no quadro estático
  if (kind === 'canvas') void import('@/three/intro/DawnCanvas').catch(() => {})
  return (config = { mode, kind, frozen })
}
const noSubscribe = () => () => {}

function IntroRun({ still }: { still: StillPhoto }) {
  // null no servidor e na hidratação: a camada nasce preta e neutra
  const cfg = useSyncExternalStore(noSubscribe, readConfig, () => null)
  const mode = cfg?.mode ?? null
  const [failed, setFailed] = useState(false)
  const kind: DawnKind = failed ? 'still' : (cfg?.kind ?? 'still')
  const [phase, dispatch] = useReducer(introReducer, 'black')
  const [sceneReady, setSceneReady] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [gone, setGone] = useState(false)
  const clock = useRef(0)
  const ready = useRef(false)
  const button = useRef<HTMLButtonElement>(null)
  const lenis = useLenis()
  const done = phase === 'done'
  const exit: Exit | null = !done || !mode ? null : skipped ? 'skip' : mode === 'reduced' ? 'fade' : 'natural'

  // a visita conta como vista assim que a abertura começa (recarregar → versão curta)
  useEffect(() => {
    if (cfg && cfg.frozen === null) markIntroSeen(sessionStore())
  }, [cfg])

  // relógio: avança com o tempo dos quadros, segura no preto até a cena ficar pronta e para
  // sozinho em `done` (sai do gsap.ticker e cancela o tempo-limite)
  const clockApi = useRef<IntroClock | null>(null)
  useEffect(() => {
    if (!mode || !cfg) return
    const c = startIntroClock({
      mode,
      frozen: cfg.frozen,
      ticker: gsap.ticker,
      isReady: () => ready.current,
      onTick: (t) => {
        clock.current = t
        dispatch({ type: 'tick', t, mode })
      },
      onFallback: () => setFailed(true),
      onFailsafe: () => dispatch({ type: 'skip' }),
      maxHold: MAX_HOLD,
      failsafeMs: FAILSAFE_MS,
    })
    clockApi.current = c
    return () => c.stop()
  }, [mode, cfg])

  // fase compartilhada (maquete da #casa e botão do WhatsApp esperam por ela)
  useEffect(() => {
    setIntroPhase(phase)
  }, [phase])

  // rolagem parada durante a abertura
  useEffect(() => {
    if (!lenis) return
    if (done) lenis.start()
    else lenis.stop()
  }, [lenis, done])

  // saída: pulo (fade rápido), clarão (o branco se dissolve) ou fade simples (reduced)
  useEffect(() => {
    if (!exit) return
    const id = window.setTimeout(() => setGone(true), EXIT_MS[exit])
    return () => window.clearTimeout(id)
  }, [exit])

  const lenisRef = useRef(lenis)
  useEffect(() => {
    lenisRef.current = lenis
  }, [lenis])
  const layer = useRef<HTMLDivElement>(null)

  const skip = useCallback((moveFocus: boolean) => {
    // destrava a rolagem já neste evento: a mesma roda/toque que pula também rola a página
    lenisRef.current?.start()
    layer.current?.setAttribute('data-active', 'false')
    clockApi.current?.stop()
    setSkipped(true)
    dispatch({ type: 'skip' })
    const a = document.activeElement
    if (moveFocus || a === button.current) firstFocusableAfterIntro()?.focus()
  }, [])

  // Esc, Tab, roda do mouse, arrastar no toque ou teclas de rolagem pulam a abertura
  useEffect(() => {
    if (done) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip(false)
      else if (e.key === 'Tab') {
        e.preventDefault()
        skip(true)
      } else if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].includes(e.key)) skip(false)
      else if (e.key === ' ' && e.target === document.body) skip(false)
    }
    const onWheel = () => skip(false)
    const onTouch = () => skip(false)
    window.addEventListener('keydown', onKey)
    // captura: roda antes do Lenis, que cancelaria o evento enquanto está parado
    const opts = { passive: true, capture: true } as const
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('touchmove', onTouch, opts)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel, opts)
      window.removeEventListener('touchmove', onTouch, opts)
    }
  }, [done, skip])

  const onSceneReady = useCallback(() => {
    ready.current = true
    setSceneReady(true)
  }, [])
  const onSceneFail = useCallback(() => setFailed(true), [])

  // camada fora do DOM (e o canvas do amanhecer desmontado): a maquete pode abrir o seu contexto
  useEffect(() => {
    if (gone) setIntroGone()
  }, [gone])

  if (gone) return null
  const showScene = mode === 'full' || mode === 'reduced'
  return (
    <div data-intro-root className={s.root}>
      <button
        ref={button}
        type="button"
        className={s.skip}
        data-intro-skip
        data-live={mode ? 'true' : undefined}
        data-phase={phase}
        onClick={() => skip(true)}
      >
        Pular abertura
      </button>
      <div
        id={INTRO_LAYER_ID}
        ref={layer}
        className={s.layer}
        aria-hidden="true"
        data-live={mode ? 'true' : undefined}
        data-active={done ? 'false' : 'true'}
        data-mode={mode ?? undefined}
        data-phase={phase}
        data-exit={exit ?? undefined}
        data-scene-ready={sceneReady}
      >
        <noscript>
          <style>{`#${INTRO_LAYER_ID},[data-intro-skip]{display:none!important}html{overflow:visible!important}`}</style>
        </noscript>
        {mode && showScene && (
          <div className={s.scene}>
            <IntroDawnScene
              kind={mode === 'reduced' ? 'still' : kind}
              clock={clock}
              start={DAWN_START}
              duration={DAWN_DURATION}
              // canvas só em aparelho `high` sem toque (introSceneKind): qualidade cheia
              quality="high"
              onReady={onSceneReady}
              onFail={onSceneFail}
              animateStill={mode === 'full'}
              still={still}
            />
          </div>
        )}
        <div className={s.veil} />
        <div className={s.scrim} />
        {mode && <FallingLetters mode={mode} clock={clock} />}
        <div className={s.flash} />
      </div>
    </div>
  )
}
