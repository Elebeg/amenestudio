'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { RoomId } from '@/content/projetos'
import {
  AUTO_ROTATE_IDLE_MS,
  AUTO_ROTATE_SPEED,
  FLIGHT_SECONDS,
  VIEWS,
  clampPhi,
  clampRadius,
  easeInOutCubic,
  lerpSpherical,
  roomAtPoint,
  sphericalToPosition,
  type Spherical,
  type ViewId,
} from './cameraMath'

export type RigApi = { zoom: (factor: number) => void }

type Props = {
  view: ViewId
  reducedMotion: boolean
  /** Deslocamento horizontal do centro da imagem (px), para o painel não cobrir o cômodo. */
  shiftPx: number
  /** Proporção largura/altura da área livre do palco (sem o painel): afasta a câmera em telas estreitas. */
  aspect: number
  /** A seção está na tela (sem auto-rotação fora dela). */
  active: boolean
  /** O canvas já apareceu: dispara a aproximação de abertura. */
  revealed: boolean
  onPick: (room: RoomId) => void
  apiRef: RefObject<RigApi | null>
}

/** Voo medido em tempo de relógio (t0 em ms): dura 1,6 s mesmo num aparelho que desenha poucos quadros. */
type Tween = { from: Spherical; to: Spherical; t0: number; dur: number }

const ROTATE_SPEED = 0.0055
const CLICK_SLOP = 6
/** Fator de afastamento para a proporção do palco (visão geral pede mais largura que um cômodo). */
function fitFor(view: ViewId, aspect: number): number {
  if (!(aspect > 0)) return 1
  const ref = view === 'overview' ? 1.25 : 1.0
  return Math.min(2.6, Math.max(1, ref / aspect))
}
const copy = (s: Spherical): Spherical => ({ ...s, target: [...s.target] as Spherical['target'] })

/**
 * Câmera orbital própria em coordenadas esféricas (alvo, raio, θ, φ), sem OrbitControls:
 *  - arrastar (mouse ou um dedo) gira; pinça, Ctrl+roda e os botões +/− dão zoom;
 *  - a roda sem Ctrl NUNCA é capturada: o listener sai antes de qualquer preventDefault,
 *    e a página (Lenis) continua rolando por cima do canvas;
 *  - trocar de vista é um voo de 1,6 s em easeInOutCubic pelo caminho angular mais curto;
 *  - na visão geral, 7 s sem interação → auto-rotação a 0,06 rad/s (nunca com reduced-motion).
 * Com frameloop "demand", cada mudança chama invalidate().
 */
export function OrbitRig({ view, reducedMotion, shiftPx, aspect, active, revealed, onPick, apiRef }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)

  // abertura: começa um pouco mais longe e girada; aproxima-se quando o canvas aparece
  const state = useRef<Spherical>(
    reducedMotion ? copy(VIEWS.overview) : { ...copy(VIEWS.overview), r: 34, theta: VIEWS.overview.theta - 0.5, phi: 0.82 },
  )
  const tween = useRef<Tween | null>(null)
  const zoomTo = useRef<number | null>(null)
  const shift = useRef(0)
  const fit = useRef(fitFor(view, aspect))
  const pos = useRef<[number, number, number]>([0, 0, 0])
  const dragging = useRef(false)
  const lastInteract = useRef(0)
  const idleTimer = useRef<number | undefined>(undefined)
  const props = useRef({ view, reducedMotion, active, onPick })
  useLayoutEffect(() => {
    props.current = { view, reducedMotion, active, onPick }
  })

  /** Reinicia a espera de 7 s e agenda um quadro para quando ela acabar. */
  const kick = useRef(() => {
    lastInteract.current = performance.now()
    window.clearTimeout(idleTimer.current)
    const p = props.current
    if (p.view === 'overview' && !p.reducedMotion && p.active) {
      idleTimer.current = window.setTimeout(() => invalidate(), AUTO_ROTATE_IDLE_MS + 30)
    }
  })

  const flyTo = (to: Spherical, dur: number) => {
    zoomTo.current = null
    if (props.current.reducedMotion) {
      tween.current = null
      state.current = copy(to)
    } else {
      tween.current = { from: copy(state.current), to, t0: performance.now(), dur }
    }
    kick.current()
    invalidate()
  }

  // troca de vista
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    flyTo(VIEWS[view] ?? VIEWS.overview, FLIGHT_SECONDS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // aproximação de abertura
  useEffect(() => {
    if (!revealed) return
    if (props.current.view === 'overview') flyTo(VIEWS.overview, 2.4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed])

  // auto-rotação só volta a contar quando a seção está na tela
  useEffect(() => {
    kick.current()
    return () => window.clearTimeout(idleTimer.current)
  }, [active, view, reducedMotion])

  useEffect(() => {
    invalidate()
  }, [shiftPx, aspect, invalidate])

  // API dos botões +/−
  useEffect(() => {
    apiRef.current = {
      zoom: (factor) => {
        const base = zoomTo.current ?? state.current.r
        tween.current = null
        const r = clampRadius(base * factor)
        if (props.current.reducedMotion) state.current.r = r
        else zoomTo.current = r
        kick.current()
        invalidate()
      },
    }
    return () => {
      apiRef.current = null
    }
  }, [apiRef, invalidate])

  // ponteiro, pinça e roda
  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map<number, { x: number; y: number }>()
    let down = { x: 0, y: 0, t: 0, id: -1 }
    let moved = 0
    let pinch = { dist: 0, r: 0 }
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    const distance = () => {
      const [a, b] = [...pointers.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }
    const interrupt = () => {
      tween.current = null
      zoomTo.current = null
      kick.current()
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)
      if (pointers.size === 1) {
        down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }
        moved = 0
        dragging.current = true
        el.style.cursor = 'grabbing'
      } else if (pointers.size === 2) {
        pinch = { dist: distance(), r: state.current.r }
        moved = CLICK_SLOP + 1
      }
      interrupt()
    }
    const onMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      if (pointers.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy)
        state.current.theta -= dx * ROTATE_SPEED
        state.current.phi = clampPhi(state.current.phi - dy * ROTATE_SPEED)
      } else if (pointers.size === 2 && pinch.dist > 0) {
        state.current.r = clampRadius((pinch.r * pinch.dist) / Math.max(1, distance()))
      }
      kick.current()
      invalidate()
    }
    const release = (e: PointerEvent, canceled: boolean) => {
      if (!pointers.delete(e.pointerId)) return
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      if (pointers.size === 1) {
        // terminou a pinça: o dedo que sobrou volta a girar a partir de onde está
        pinch.dist = 0
      }
      if (pointers.size > 0) return
      dragging.current = false
      el.style.cursor = ''
      kick.current()
      // clique curto sem arrasto: o cômodo sob o ponteiro (raio contra o plano do piso)
      if (canceled || e.pointerId !== down.id || moved > CLICK_SLOP || performance.now() - down.t > 450) return
      const rect = el.getBoundingClientRect()
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      if (raycaster.ray.intersectPlane(floor, hit)) {
        const room = roomAtPoint(hit.x, hit.z)
        if (room) props.current.onPick(room)
      }
    }
    const onUp = (e: PointerEvent) => release(e, false)
    const onCancel = (e: PointerEvent) => release(e, true)
    const onWheel = (e: WheelEvent) => {
      // roda comum: a página rola. Só Ctrl+roda (e a pinça do trackpad, que chega assim) dá zoom.
      if (!e.ctrlKey) return
      e.preventDefault()
      const base = zoomTo.current ?? state.current.r
      tween.current = null
      zoomTo.current = clampRadius(base * Math.exp(e.deltaY * 0.0025))
      kick.current()
      invalidate()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    // não passivo apenas para poder impedir o zoom do navegador no Ctrl+roda
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, camera, invalidate])

  useFrame((_, delta) => {
    // com frameloop "demand" o primeiro quadro depois de uma pausa traz um delta enorme
    const dt = Math.min(delta, 1 / 20)
    const s = state.current
    const p = props.current
    let animating = false

    const tw = tween.current
    if (tw) {
      const t = (performance.now() - tw.t0) / 1000
      const next = lerpSpherical(tw.from, tw.to, easeInOutCubic(t / tw.dur))
      s.target[0] = next.target[0]
      s.target[1] = next.target[1]
      s.target[2] = next.target[2]
      s.r = next.r
      s.theta = next.theta
      s.phi = next.phi
      if (t >= tw.dur) {
        tween.current = null
        kick.current()
      }
      animating = true
    } else if (zoomTo.current !== null) {
      const goal = zoomTo.current
      s.r += (goal - s.r) * (1 - Math.exp(-dt * 10))
      if (Math.abs(goal - s.r) < 0.01) {
        s.r = goal
        zoomTo.current = null
      }
      animating = true
    } else if (
      p.view === 'overview' &&
      !p.reducedMotion &&
      p.active &&
      !dragging.current &&
      performance.now() - lastInteract.current > AUTO_ROTATE_IDLE_MS
    ) {
      s.theta += AUTO_ROTATE_SPEED * dt
      animating = true
    }

    // painel aberto: desloca o centro óptico (setViewOffset) em vez de mexer no alvo
    const goalShift = p.reducedMotion ? shiftPx : shift.current + (shiftPx - shift.current) * (1 - Math.exp(-dt * 6))
    shift.current = Math.abs(goalShift - shiftPx) < 0.5 ? shiftPx : goalShift
    if (shift.current !== shiftPx) animating = true
    if (Math.abs(shift.current) < 0.5) {
      if (camera.view?.enabled) camera.clearViewOffset()
    } else {
      camera.setViewOffset(size.width, size.height, shift.current, 0, size.width, size.height)
    }

    // enquadramento: os VIEWS valem para um palco ~1,5:1; mais estreito → mais longe
    const goalFit = fitFor(p.view, aspect)
    if (fit.current !== goalFit) {
      fit.current = p.reducedMotion ? goalFit : fit.current + (goalFit - fit.current) * (1 - Math.exp(-dt * 3))
      if (Math.abs(fit.current - goalFit) < 0.002) fit.current = goalFit
      else animating = true
    }
    const r0 = s.r
    s.r = r0 * fit.current
    sphericalToPosition(s, pos.current)
    s.r = r0
    camera.position.set(pos.current[0], pos.current[1], pos.current[2])
    camera.lookAt(s.target[0], s.target[1], s.target[2])
    if (animating) invalidate()
  })

  return null
}
