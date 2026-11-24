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
import { SceneBoundary } from './SceneBoundary'
import { HouseFallback } from './HouseFallback'
import { detectTierInBrowser, type Tier } from '@/lib/quality'
import { useIntroReleased } from '@/components/intro/introStore'
import { APARTMENT } from '@/three/apartment/layout'
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
 * 01 · A casa: a maquete 3D interativa no lugar da capa estática.
 * A capa continua por baixo até o canvas ficar pronto (sem salto de layout nem caixa vazia);
 * sem WebGL ela permanece, e a lista de ambientes continua abrindo o painel com as fotos.
 */
export function HouseSection({ projeto, rooms, cover, coverAlt, stageClassName, infoClassName, eyebrow, h2ClassName, linkClassName }: Props) {
  const [state, setState] = useState<HouseState>({ view: 'overview', lighting: 'manha', panelOpen: false })
  const [mount, setMount] = useState(false)
  // a maquete só começa a carregar no clarão da abertura (ou quando não há abertura)
  const introReleased = useIntroReleased()
  // null só no servidor/hidratação; no cliente a sonda barata roda logo após a montagem
  const tier = useSyncExternalStore<Tier | null>(() => () => {}, detectTierInBrowser, () => null)
  // o canvas caiu (chunk, contexto WebGL ou exceção do R3F): volta para a capa estática
  const [failed, setFailed] = useState(false)
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
  const nav = useRef<HTMLDivElement>(null)
  const labelLayer = useRef<HTMLDivElement>(null)

  const projectHref = `/projetos/${projeto.slug}`
  const navRooms: NavRoom[] = useMemo(() => rooms.map((r, i) => ({ id: r.id, nome: r.nome, num: pad(i + 1) })), [rooms])
  // uma única fonte de cômodos: os do conteúdo que também existem na planta
  const labels = useMemo(
    () =>
      rooms.flatMap((r, i) => {
        const at = APARTMENT.rooms.find((a) => a.id === r.id)?.labelAt
        return at ? [{ id: r.id, num: pad(i + 1), label: shortLabel(r.nome), at }] : []
      }),
    [rooms],
  )
  const panelRoom: PanelRoom | null = useMemo(() => {
    if (!state.panelOpen || state.view === 'overview') return null
    const i = rooms.findIndex((r) => r.id === state.view)
    return i < 0 ? null : { ...rooms[i], num: pad(i + 1) }
  }, [rooms, state.panelOpen, state.view])

  // carrega o canvas quando o navegador estiver ocioso (a capa é o LCP), depois da abertura
  useEffect(() => {
    if (!tier || tier === 'none' || !introReleased) return
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const cic = window.cancelIdleCallback ?? window.clearTimeout
    const id = ric(() => setMount(true), { timeout: 1500 })
    return () => cic(id)
  }, [tier, introReleased])

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
    // clique na varanda, num banheiro ou na circulação: nada (só cômodos com conteúdo)
    if (view !== 'overview' && !rooms.some((r) => r.id === view)) return
    if (view === 'overview') {
      setState((st) => ({ ...st, view, panelOpen: false }))
      return
    }
    opener.current = el ?? null
    setFocusOnOpen(!viaArrows && !!el)
    setState((st) => ({ ...st, view, panelOpen: true }))
  }, [rooms])

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
  const onFail = useCallback(() => {
    setFailed(true)
    setReady(false)
  }, [])
  // Esc só vale quando o foco está na maquete, no painel ou na lista (ou em lugar nenhum)
  const escapeInScope = useCallback(() => {
    const a = document.activeElement
    return !a || a === document.body || !!stage.current?.contains(a) || !!nav.current?.contains(a)
  }, [])
  // sem WebGL, `?3d=0` ou contexto perdido: imagem estática + grade de cômodos
  const noCanvas = tier === 'none' || failed
  const live = mount && !failed && tier !== 'none'
  const labelsOn = live && ready && state.view === 'overview'
  // mesma regra do CSS: clamp(300px, 36%, 400px)
  const panelW = desktop && panelRoom ? Math.min(400, Math.max(300, box.w * 0.36)) : 0
  const shiftPx = panelW / 2
  const aspect = box.h > 0 ? (box.w - panelW) / box.h : 0
  // toque (ponteiro grosso) também é `low`: ver o comentário em lib/quality.ts
  const quality = coarse || tier === 'low' ? 'low' : 'high'

  return (
    <>
      <div className={`${stageClassName} ${s.stage}`} data-casa-stage ref={stage} data-ready={ready} data-lighting={state.lighting}>
        <div className={s.viewport}>
          {noCanvas ? (
            <Image
              className={s.fbImage}
              src="/maquete-fallback.webp"
              width={1600}
              height={1000}
              alt="Planta do apartamento em maquete: visão geral dos sete ambientes"
              sizes="(min-width: 900px) 60vw, 100vw"
            />
          ) : (
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
              fetchPriority="high"
            />
          )}
          {live && (
            <div className={s.canvasLayer} data-house-canvas>
              <SceneBoundary onError={onFail}>
                <HouseScene
                state={state}
                labels={labels}
                labelLayer={labelLayer}
                onContextLost={onFail}
                reducedMotion={reducedMotion}
                shiftPx={shiftPx}
                aspect={aspect}
                active={active}
                revealed={ready}
                quality={quality}
                onSelect={(id) => select(id)}
                onReady={onReady}
                apiRef={rig}
                />
              </SceneBoundary>
            </div>
          )}
          {live && (
            // rótulos: botões DOM comuns; o canvas só escreve a posição projetada (RoomLabels).
            // Só existem depois de pronto: antes disso nada focável sobre a capa.
            <div className={s.labelLayer} ref={labelLayer}>
              {ready && labels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={s.label}
                  data-room-label={l.id}
                  data-visible={labelsOn}
                  tabIndex={labelsOn ? 0 : -1}
                  aria-hidden={labelsOn ? undefined : true}
                  onClick={(e) => select(l.id, e.currentTarget)}
                >
                  <span aria-hidden="true">{l.num}</span>
                  {l.label}
                </button>
              ))}
            </div>
          )}
          {live && (
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
          <RoomPanel
            room={panelRoom}
            total={rooms.length}
            projectHref={`${projectHref}#room-${panelRoom.id}`}
            focusOnOpen={focusOnOpen}
            onClose={close}
            escapeInScope={escapeInScope}
          />
        )}
      </div>

      <div className={infoClassName}>
        {eyebrow}
        <h2 id="casa-titulo" className={h2ClassName}>
          {projeto.nome}
        </h2>
        <div ref={nav}>
          {noCanvas ? (
            <HouseFallback rooms={rooms} view={state.view} onSelect={select} />
          ) : (
            <RoomNav rooms={navRooms} view={state.view} onSelect={select} />
          )}
        </div>
        <Link href={projectHref} className={linkClassName}>
          Ver projeto completo
        </Link>
      </div>
    </>
  )
}
