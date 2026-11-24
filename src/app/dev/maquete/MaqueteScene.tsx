'use client'

import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ApartmentModel } from '@/three/apartment/ApartmentModel'
import { APARTMENT } from '@/three/apartment/layout'
import type { Lighting } from '@/three/apartment/materials'

/**
 * Cena de verificação da maquete (só desenvolvimento). As luzes daqui são PROVISÓRIAS:
 * a iluminação definitiva (manhã/noite, N8AO) é da Task 10.
 *
 * Parâmetros: ?view=overview|plano|<RoomId>  ?luz=manha|noite  ?ao=0
 */

type Params = { view: string; luz: Lighting; ao: boolean }

function readParams(): Params {
  const q = new URLSearchParams(window.location.search)
  return {
    view: q.get('view') ?? 'overview',
    luz: q.get('luz') === 'noite' ? 'noite' : 'manha',
    ao: q.get('ao') !== '0',
  }
}

function cameraFor(view: string): { pos: [number, number, number]; target: [number, number, number] } {
  if (view === 'plano') {
    // planta vista de cima (verificação da disposição)
    return { pos: [0, 30, 0.01], target: [0, 0, 0] }
  }
  const room = APARTMENT.rooms.find((r) => r.id === view)
  if (!room) {
    // visão geral: r 27, phi .95 (mesmos números da Task 10)
    const r = 27
    const phi = 0.95
    const theta = Math.PI - 0.62 // de nordeste: pedra e living à frente
    return { pos: [r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.cos(theta)], target: [0, 0, 0] }
  }
  const cx = (room.rect.x0 + room.rect.x1) / 2
  const cz = (room.rect.z0 + room.rect.z1) / 2
  const dim = Math.max(room.rect.x1 - room.rect.x0, room.rect.z1 - room.rect.z0)
  const r = Math.max(8, dim * 1.9)
  const phi = 0.68
  // cômodos da metade sul vistos do sul; os da metade norte, do norte — pela parede externa que some
  const dir = cz > 0 ? 1 : -1
  return {
    pos: [cx + r * Math.sin(phi) * 0.42, r * Math.cos(phi), cz + dir * r * Math.sin(phi) * 0.91],
    target: [cx, 0.5, cz],
  }
}

/** Reflexos suaves de interior (RoomEnvironment), criados uma vez no onCreated do Canvas. */
function setupEnvironment({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) {
  const pmrem = new THREE.PMREMGenerator(gl)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.45
  pmrem.dispose()
}

function TempLights({ luz }: { luz: Lighting }) {
  const night = luz === 'noite'
  return (
    <>
      <hemisphereLight args={[0xfff3e2, 0x8a7560, night ? 0.08 : 0.62]} />
      <directionalLight
        position={[-9, 16, -7]}
        intensity={night ? 0.15 : 2.6}
        color={0xfff1dc}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
      {night &&
        APARTMENT.rooms.map((r) => (
          <pointLight
            key={r.id}
            position={[(r.rect.x0 + r.rect.x1) / 2, 2.3, (r.rect.z0 + r.rect.z1) / 2]}
            intensity={6}
            distance={7}
            decay={2}
            color={0xffc98f}
          />
        ))}
    </>
  )
}

/**
 * frameloop "demand": desenha só quando algo muda. Nos primeiros segundos força alguns
 * quadros para as texturas assíncronas aparecerem (e o screenshot headless não travar).
 */
function Warmup() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let n = 0
    const id = window.setInterval(() => {
      invalidate()
      if (++n > 12) window.clearInterval(id)
    }, 700)
    return () => window.clearInterval(id)
  }, [invalidate])
  return null
}

/**
 * Fader PROVISÓRIO (o definitivo é o WallFader da Task 10): paredes externas voltadas
 * para a câmera ficam quase transparentes, para os quartos aparecerem nos screenshots.
 */
function DevWallFader() {
  const scene = useThree((s) => s.scene)
  const dir = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }) => {
    dir.copy(camera.position).setY(0).normalize()
    for (const side of ['n', 's', 'e', 'w']) {
      const g = scene.getObjectByName(`wall-${side}`)
      if (!g) continue
      const [nx, nz] = g.userData.normal as [number, number]
      const o = nx * dir.x + nz * dir.z > 0.3 ? 0.15 : 1
      g.traverse((c) => {
        const mesh = c as THREE.Mesh
        if (!mesh.isMesh) return
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (!mat.name.startsWith('wall-')) return
        const base = (mat.userData.baseOpacity ??= mat.opacity) as number
        mat.transparent = o < 1 || base < 1
        mat.opacity = base * o
        mat.depthWrite = o === 1 && base === 1
      })
    }
  })
  return null
}

/** Expõe estatísticas do renderer para a verificação (window.__maquete). */
function countMeshes(scene: THREE.Scene) {
  let meshes = 0
  let casters = 0
  scene.traverseVisible((o) => {
    if ((o as THREE.Mesh).isMesh) {
      meshes++
      if (o.castShadow) casters++
    }
  })
  return { meshes, casters }
}

function Stats() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const id = window.setInterval(() => {
      ;(window as unknown as { __maquete: unknown }).__maquete = {
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        ...countMeshes(scene),
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [gl, scene])
  return null
}

export default function MaqueteScene() {
  const [params] = useState(readParams)
  const cam = cameraFor(params.view)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#efebe5' }}>
      <Canvas
        shadows="percentage"
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: cam.pos, fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: params.luz === 'noite' ? 0.9 : 0.92, preserveDrawingBuffer: true }}
        onCreated={setupEnvironment}
      >
        <color attach="background" args={['#efebe5']} />
        <TempLights luz={params.luz} />
        <ApartmentModel source={{ kind: 'procedural' }} lighting={params.luz} />
        <OrbitControls target={cam.target} makeDefault />
        {params.ao && (
          <EffectComposer>
            <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} quality="medium" />
          </EffectComposer>
        )}
        <Stats />
        <Warmup />
        <DevWallFader />
      </Canvas>
    </div>
  )
}
