'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { Photo, RoomId } from '@/content/projetos'
import type { RigApi } from '@/three/camera/OrbitRig'
import type { HouseState, ViewId } from '@/three/camera/cameraMath'
import { RoomNav, StageControls, type NavRoom } from './RoomNav'
import { RoomPanel, type PanelRoom } from './RoomPanel'
import s from './house.module.css'

// O canvas (three, R3F, pós-processamento) só existe no cliente e chega depois da capa.
const HouseScene = dynamic(() => import('@/three/camera/HouseScene'), { ssr: false })

export type HouseRoom = { id: RoomId; nome: string; descricao: string; fotos: Photo[] }

type Props = {
  projeto: { nome: string; slug: string }
  rooms: HouseRoom[]
  cover: Photo
  coverAlt: string
  /** Classes da grade da home (home.module.css) para o palco e a coluna de informações. */
  stageClassName: string
  infoClassName: string
  eyebrow: React.ReactNode
  h2ClassName: string
  linkClassName: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Rótulo curto para a maquete: "Quarto com espelho orgânico" → "Espelho orgânico". */
function shortLabel(nome: string): string {
  if (nome.length <= 16) return nome
  const cut = nome.replace(/^(quarto|suíte)\s+(com|de)\s+/i, '')
  return cut.charAt(0).toUpperCase() + cut.slice(1)
}

function useMedia(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  )
}

/**
 * A maquete só monta com WebGL de verdade. Renderizador por software (SwiftShader, llvmpipe…)
 * conta como "aparelho muito fraco": fica a imagem estática e a lista de ambientes com as fotos.
 * `?maquete=1` força o canvas (testes e2e com SwiftShader).
 */
function canRunMaquete(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('maquete') === '1') return true
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  }
}

/**
 * 01 · A casa: a maquete 3D interativa no lugar da capa estática.
 * A capa continua por baixo até o canvas ficar pronto (sem salto de layout nem caixa vazia);
 * sem WebGL ela permanece, e a lista de ambientes continua abrindo o painel com as fotos.
 */
export function HouseSection({ projeto, rooms, cover, coverAlt, stageClassName, infoClassName, eyebrow, h2ClassName, linkClassName }: Props) {
  const [state, setState] = useState<HouseState>({ view: 'overview', lighting: 'manha', panelOpen: false })
  const [mount, setMount] = useState(false)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [focusOnOpen, setFocusOnOpen] = useState(false)
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)')
  const desktop = useMedia('(min-width: 900px)')
  const coarse = useMedia('(pointer: coarse)')
  const stage = useRef<HTMLDivElement>(null)
  const rig = useRef<RigApi | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const pendingFocus = useRef<{ room: RoomId } | null>(null)

  const projectHref = `/projetos/${projeto.slug}`
  const navRooms: NavRoom[] = useMemo(() => rooms.map((r, i) => ({ id: r.id, nome: r.nome, num: pad(i + 1) })), [rooms])
  const labels = useMemo(() => rooms.map((r, i) => ({ id: r.id, num: pad(i + 1), label: shortLabel(r.nome) })), [rooms])
  const panelRoom: PanelRoom | null = useMemo(() => {
    if (!state.panelOpen || state.view === 'overview') return null
    const i = rooms.findIndex((r) => r.id === state.view)
    return i < 0 ? null : { ...rooms[i], num: pad(i + 1) }
  }, [rooms, state.panelOpen, state.view])

  // carrega o canvas quando o navegador estiver ocioso (a capa é o LCP)
  useEffect(() => {
    if (!canRunMaquete()) return
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const cic = window.cancelIdleCallback ?? window.clearTimeout
    const id = ric(() => setMount(true), { timeout: 1500 })
    return () => cic(id)
  }, [])

  // fora da tela: sem auto-rotação; largura do palco para o deslocamento do painel
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 })
    const viewport = el.firstElementChild ?? el
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    io.observe(el)
    ro.observe(viewport)
    return () => {
      io.disconnect()
      ro.disconnect()
    }
  }, [])

  const select = useCallback((view: ViewId, el?: HTMLElement, viaArrows = false) => {
    if (view === 'overview') {
      setState((st) => ({ ...st, view, panelOpen: false }))
      return
    }
    opener.current = el ?? null
    setFocusOnOpen(!viaArrows && !!el)
    setState((st) => ({ ...st, view, panelOpen: true }))
  }, [])

  const close = useCallback(() => {
    setState((st) => {
      if (st.view !== 'overview') pendingFocus.current = { room: st.view }
      return { ...st, view: 'overview', panelOpen: false }
    })
  }, [])

  // devolve o foco a quem abriu o painel (ou ao botão do cômodo na lista)
  useEffect(() => {
    const p = pendingFocus.current
    if (!p || state.panelOpen) return
    pendingFocus.current = null
    const el = opener.current
    const usable = el?.isConnected && el.tabIndex >= 0 && el.getAttribute('aria-hidden') !== 'true'
    const target = usable ? el : document.querySelector<HTMLElement>(`button[data-view="${p.room}"]`)
    target?.focus({ preventScroll: true })
    opener.current = null
  }, [state.panelOpen])

  const onReady = useCallback(() => setReady(true), [])
  // mesma regra do CSS: clamp(300px, 36%, 400px)
  const panelW = desktop && panelRoom ? Math.min(400, Math.max(300, box.w * 0.36)) : 0
  const shiftPx = panelW / 2
  const aspect = box.h > 0 ? (box.w - panelW) / box.h : 0
  const quality = coarse ? 'low' : 'high'

  return (
    <>
      <div className={`${stageClassName} ${s.stage}`} data-casa-stage ref={stage} data-ready={ready} data-lighting={state.lighting}>
        <div className={s.viewport}>
          <Image
            className={s.cover}
            src={cover.src}
            width={cover.width}
            height={cover.height}
            placeholder="blur"
            blurDataURL={cover.blurDataURL}
            alt={coverAlt}
            sizes="(min-width: 900px) 60vw, 100vw"
            preload
          />
          {mount && (
            <div className={s.canvasLayer} data-house-canvas>
              <HouseScene
                state={state}
                labels={labels}
                labelClassName={s.label}
                reducedMotion={reducedMotion}
                shiftPx={shiftPx}
                aspect={aspect}
                active={active}
                revealed={ready}
                quality={quality}
                onSelect={(id, el) => select(id, el)}
                onReady={onReady}
                apiRef={rig}
              />
            </div>
          )}
          {mount && (
            <>
              <StageControls
                lighting={state.lighting}
                onLighting={(lighting) => setState((st) => ({ ...st, lighting }))}
                onZoom={(f) => rig.current?.zoom(f)}
                zoomEnabled
              />
              <p className={s.hint} aria-hidden="true" data-hidden={!!panelRoom}>
                <span className={s.hintPointer}>Arraste para girar · Ctrl + roda para aproximar</span>
                <span className={s.hintTouch}>Arraste para girar · pinça para aproximar</span>
              </p>
            </>
          )}
        </div>
        {panelRoom && (
          <RoomPanel room={panelRoom} total={rooms.length} projectHref={`${projectHref}#room-${panelRoom.id}`} focusOnOpen={focusOnOpen} onClose={close} />
        )}
      </div>

      <div className={infoClassName}>
        {eyebrow}
        <h2 id="casa-titulo" className={h2ClassName}>
          {projeto.nome}
        </h2>
        <RoomNav rooms={navRooms} view={state.view} onSelect={select} />
        <Link href={projectHref} className={linkClassName}>
          Ver projeto completo
        </Link>
      </div>
    </>
  )
}
