'use client'

import { useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { RoomId } from '@/content/projetos'
import { ApartmentModel } from '@/three/apartment/ApartmentModel'
import { Lighting } from './Lighting'
import { OrbitRig, type RigApi } from './OrbitRig'
import { RoomLabels, type RoomLabel } from './RoomLabels'
import { WallFader } from './WallFader'
import { VIEWS, sphericalToPosition, type HouseState } from './cameraMath'

export type HouseSceneProps = {
  state: HouseState
  labels: RoomLabel[]
  labelLayer: RefObject<HTMLDivElement | null>
  /** O contexto WebGL foi perdido: a HouseSection desmonta o canvas e fica na capa. */
  onContextLost: () => void
  reducedMotion: boolean
  shiftPx: number
  aspect: number
  active: boolean
  revealed: boolean
  quality: 'high' | 'low'
  onSelect: (id: RoomId) => void
  onReady: () => void
  apiRef: RefObject<RigApi | null>
}

/** Reflexos suaves de interior (RoomEnvironment), criados uma vez. */
function setupEnvironment({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) {
  const pmrem = new THREE.PMREMGenerator(gl)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.45
  pmrem.dispose()
}

/**
 * Pronto = já houve quadros desenhados e as texturas (DefaultLoadingManager) terminaram de
 * carregar; com frameloop "demand" as texturas assíncronas não pedem quadro sozinhas, então
 * nos primeiros segundos invalidamos periodicamente. Tempo-limite de 6 s para não travar a capa.
 */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  const frames = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    frames.current++
  })
  useEffect(() => {
    const t0 = performance.now()
    let ticks = 0
    const id = window.setInterval(() => {
      invalidate()
      ticks++
      const loaded = !useProgress.getState().active
      if (!done.current && frames.current > 2 && (loaded || performance.now() - t0 > 6000)) {
        done.current = true
        onReady()
      }
      // continua alguns quadros depois de pronto (texturas reprocessadas em canvas)
      if (done.current && ticks > 24) window.clearInterval(id)
    }, 250)
    return () => window.clearInterval(id)
  }, [invalidate, onReady])
  return null
}

/**
 * `?stats` liga as estatísticas abaixo. Como o `?abertura` da abertura, só fora de produção ou
 * com NEXT_PUBLIC_INTRO_DEBUG definido no build (preserveDrawingBuffer custa desempenho).
 */
const STATS_DEBUG = process.env.NODE_ENV !== 'production' || !!process.env.NEXT_PUBLIC_INTRO_DEBUG

/**
 * Estatísticas do renderer para verificação (`?stats` na URL): draw calls somando todas as
 * passagens do quadro (sombra, cena, N8AO, tone mapping).
 */
function Stats() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const info = get().gl.info
    info.autoReset = false
    return () => {
      info.autoReset = true
    }
  }, [get])
  const frames = useRef(0)
  useFrame(({ gl }) => {
    ;(window as unknown as { __house: unknown }).__house = {
      frames: ++frames.current,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    }
    gl.info.reset()
  }, 2)
  return null
}

const initialPosition = sphericalToPosition(VIEWS.overview)

export default function HouseScene(p: HouseSceneProps) {
  const stats = STATS_DEBUG && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats')
  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={p.quality === 'high' ? [1, 2] : [1, 1.5]}
      camera={{ position: initialPosition, fov: 35, near: 0.1, far: 200 }}
      // low não tem composer (MSAA do EffectComposer): liga o antialias do próprio canvas
      gl={{ antialias: p.quality === 'low', powerPreference: 'high-performance', preserveDrawingBuffer: stats }}
      onCreated={(st) => {
        setupEnvironment(st)
        st.gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault()
            p.onContextLost()
          },
          { once: true },
        )
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <Lighting lighting={p.state.lighting} reducedMotion={p.reducedMotion} quality={p.quality} />
      <ApartmentModel source={{ kind: 'procedural' }} lighting={p.state.lighting} />
      <OrbitRig
        view={p.state.view}
        reducedMotion={p.reducedMotion}
        shiftPx={p.shiftPx}
        aspect={p.aspect}
        active={p.active}
        revealed={p.revealed}
        onPick={(id) => p.onSelect(id)}
        apiRef={p.apiRef}
      />
      <WallFader />
      <RoomLabels labels={p.labels} layer={p.labelLayer} />
      <ReadySignal onReady={p.onReady} />
      {stats && <Stats />}
    </Canvas>
  )
}
