'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { APARTMENT } from '@/three/apartment/layout'
import { siteBounds } from './cameraMath'
import type { Lighting as LightingMode } from '@/three/apartment/materials'

/** Os dois climas de luz. `mix` 0 = manhã, 1 = noite; tudo é interpolado entre eles. */
const MANHA = {
  // valor linear acima de 1: depois do ACES do pós-processamento resulta ~#e9e4dc (papel quente)
  bg: new THREE.Color().setRGB(1.04, 0.88, 0.72, THREE.LinearSRGBColorSpace),
  hemi: 0.62,
  sun: 2.7,
  sunColor: new THREE.Color('#ffe9cc'),
  env: 0.45,
  point: 0,
  ao: 2.2,
}
const NOITE = {
  bg: new THREE.Color('#3b3630'),
  hemi: 0.07,
  sun: 0.22,
  sunColor: new THREE.Color('#9fb0c8'),
  env: 0.1,
  point: 7,
  ao: 1.4,
}
const FADE_SECONDS = 1.1

type Props = { lighting: LightingMode; reducedMotion: boolean; quality: 'high' | 'low' }

/**
 * Iluminação definitiva da maquete:
 *  - manhã: sol direcional quente vindo de nordeste (único que projeta sombra, PCF) + hemisfério;
 *  - noite: luzes pontuais quentes, uma por cômodo, SEM sombra (orçamento de draw calls),
 *    o sol vira um luar frio e fraco;
 *  - pós: N8AO leve e tone mapping ACES (o EffectComposer desliga o tone mapping do renderer).
 * A troca é um cross-fade de ~1 s (instantâneo com reduced-motion). As luzes pontuais só
 * existem enquanto a noite está visível: assim os shaders da manhã não pagam por elas.
 */
export function Lighting({ lighting, reducedMotion, quality }: Props) {
  const get = useThree((s) => s.get)
  const invalidate = useThree((s) => s.invalidate)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const points = useRef<(THREE.PointLight | null)[]>([])
  const goal = lighting === 'noite' ? 1 : 0
  const mix = useRef(goal)
  // Luzes pontuais: montam quando a noite é pedida e só desmontam quando o fade de volta à
  // manhã termina (mix === 0). Sem piscar nem recompilar shaders no meio da transição.
  const [pointsOn, setPointsOn] = useState(goal > 0)
  if (goal > 0 && !pointsOn) setPointsOn(true) // ajuste de estado durante o render (padrão do React)
  const ao = useRef<{ configuration: { intensity: number } } | null>(null)
  const bg = useRef(new THREE.Color())
  // terreno inteiro (planta + varanda) dentro da câmera de sombra
  const f = useMemo(() => siteBounds(APARTMENT), [])
  const center = useMemo(() => new THREE.Vector3((f.x0 + f.x1) / 2, 0, (f.z0 + f.z1) / 2), [f])
  const half = Math.max(f.x1 - f.x0, f.z1 - f.z0) / 2 + 1.5

  useEffect(() => {
    if (reducedMotion) mix.current = goal
    invalidate()
  }, [goal, reducedMotion, invalidate])

  useEffect(() => {
    const scene = get().scene
    scene.background = bg.current
    return () => {
      scene.background = null
    }
  }, [get])

  useEffect(() => {
    if (sun.current) sun.current.target.position.copy(center)
  }, [center])

  useFrame(({ scene }, delta) => {
    const m0 = mix.current
    if (m0 !== goal) {
      // passo pelo tempo real (limitado a 0,25 s) para o fade não se arrastar em aparelho lento
      const step = Math.min(delta, 0.25) / FADE_SECONDS
      mix.current = goal > m0 ? Math.min(goal, m0 + step) : Math.max(goal, m0 - step)
      invalidate()
    } else if (m0 === 0 && pointsOn) {
      setPointsOn(false)
    }
    const m = mix.current
    // curva suave: a noite "acende" depois que o dia já baixou
    const e = m * m * (3 - 2 * m)
    bg.current.copy(MANHA.bg).lerp(NOITE.bg, e)
    scene.environmentIntensity = THREE.MathUtils.lerp(MANHA.env, NOITE.env, e)
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(MANHA.hemi, NOITE.hemi, e)
    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(MANHA.sun, NOITE.sun, e)
      sun.current.color.copy(MANHA.sunColor).lerp(NOITE.sunColor, e)
    }
    const pi = NOITE.point * Math.max(0, (m - 0.25) / 0.75)
    for (const p of points.current) if (p) p.intensity = pi
    if (ao.current) ao.current.configuration.intensity = THREE.MathUtils.lerp(MANHA.ao, NOITE.ao, e)
  })

  const shadowSize = quality === 'high' ? 4096 : 1024
  return (
    <>
      <hemisphereLight ref={hemi} args={[0xfff3e2, 0x8a7560, MANHA.hemi]} />
      <directionalLight
        ref={sun}
        position={[center.x + 10, 15, center.z - 9]}
        intensity={MANHA.sun}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={3}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      {pointsOn &&
        APARTMENT.rooms.map((r, i) => (
          <pointLight
            key={r.id}
            ref={(el) => {
              points.current[i] = el
            }}
            position={[(r.rect.x0 + r.rect.x1) / 2, 2.25, (r.rect.z0 + r.rect.z1) / 2]}
            intensity={0}
            distance={Math.max(5, Math.max(r.rect.x1 - r.rect.x0, r.rect.z1 - r.rect.z0) * 1.4)}
            decay={2}
            color={0xffc48a}
          />
        ))}
      {/* low: sem pós-processamento (o renderer aplica o tone mapping ACES do Canvas) */}
      {quality === 'high' && (
        <EffectComposer multisampling={4}>
          <N8AO ref={ao as never} aoRadius={0.6} intensity={MANHA.ao} distanceFalloff={0.6} quality="medium" />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  )
}
