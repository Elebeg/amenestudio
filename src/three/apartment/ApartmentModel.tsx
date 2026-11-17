'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import {
  APARTMENT,
  baseboardPieces,
  exteriorWalls,
  footprint,
  interiorWallPieces,
  type Box,
  type ExteriorWall,
} from './layout'
import { applyLighting, getMaterials, getWallMaterials, type Lighting } from './materials'
import { ROOM_COMPONENTS } from './rooms'

export type ApartmentSource =
  | { kind: 'procedural' }
  | { kind: 'glb'; url: string; lightmaps: { manha: string; noite: string } }

type Props = { source: ApartmentSource; lighting: Lighting }

/** Maquete do apartamento, sem forro. Paredes externas em grupos `wall-${side}` (WallFader). */
export function ApartmentModel({ source, lighting }: Props) {
  if (source.kind === 'glb') return <GlbApartment url={source.url} />
  return <ProceduralApartment lighting={lighting} />
}

/**
 * Fase 2: modelo do escritório exportado em GLB. Por enquanto só carrega e exibe a cena;
 * a troca de lightmaps manhã/noite entra quando os mapas existirem.
 */
function GlbApartment({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

const unitBox = new THREE.BoxGeometry(1, 1, 1)
const CAP = 0.006
const BEDROOM_FLOOR = new Set(['suite-casal', 'quarto-solteiro', 'suite-ripada', 'quarto-escrivaninha', 'quarto-espelho'])

/** Caixas alinhadas aos eixos num único InstancedMesh (geometria unitária escalada). */
function BoxInstances({
  boxes,
  material,
  cast = true,
  receive = true,
  name,
}: {
  boxes: Box[]
  material: THREE.Material
  cast?: boolean
  receive?: boolean
  name?: string
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new THREE.Object3D()
    boxes.forEach((b, i) => {
      o.position.set(...b.center)
      o.scale.set(...b.size)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [boxes])
  if (boxes.length === 0) return null
  return <instancedMesh ref={ref} name={name} args={[unitBox, material, boxes.length]} castShadow={cast} receiveShadow={receive} />
}

/** Tampa fina de "corte" no topo das paredes: lê como planta de maquete vista de cima. */
function capsOf(pieces: Box[], h: number): Box[] {
  return pieces
    .filter((p) => Math.abs(p.center[1] + p.size[1] / 2 - h) < 1e-4)
    .map((p) => ({ center: [p.center[0], h + CAP / 2, p.center[2]], size: [p.size[0], CAP, p.size[2]] }))
}

/** Vidro + caixilho das janelas de uma parede externa. */
function windowsOf(wall: ExteriorWall) {
  const glass: Box[] = []
  const frames: Box[] = []
  const t = 0.02
  const along = wall.side === 'n' || wall.side === 's'
  const [cx, cz] = wall.center
  for (const o of wall.openings.filter((o) => o.kind === 'janela')) {
    const mid = (o.s + o.e) / 2
    const len = o.e - o.s
    const at = (a: number, y: number, sa: number, sy: number, d: number): Box =>
      along ? { center: [a, y, cz], size: [sa, sy, d] } : { center: [cx, y, a], size: [d, sy, sa] }
    glass.push(at(mid, (o.y0 + o.y1) / 2, len, o.y1 - o.y0, 0.01))
    frames.push(at(mid, o.y1 - 0.02, len, 0.04, 0.06), at(mid, o.y0 + 0.02, len, 0.04, 0.06))
    const n = Math.max(1, Math.round(len / 1.1))
    for (let i = 0; i <= n; i++) frames.push(at(o.s + (len / n) * i, (o.y0 + o.y1) / 2, t * 2, o.y1 - o.y0, 0.06))
  }
  return { glass, frames }
}

/**
 * Orçamento de draw calls: peças pequenas (< 0,6 m na maior dimensão) não projetam sombra.
 * O contato delas com o piso fica a cargo da oclusão de ambiente (N8AO, Task 10).
 */
const MIN_SHADOW_CASTER = 0.6
function trimShadowCasters(root: THREE.Object3D) {
  const box = new THREE.Box3()
  const size = new THREE.Vector3()
  root.updateWorldMatrix(true, true)
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.castShadow) return
    if (mesh.name === 'walls-interior' || mesh.parent?.name.startsWith('wall-')) return
    box.setFromObject(mesh).getSize(size)
    if (Math.max(size.x, size.y, size.z) < MIN_SHADOW_CASTER) mesh.castShadow = false
  })
}

function ProceduralApartment({ lighting }: { lighting: Lighting }) {
  const m = getMaterials()
  const root = useRef<THREE.Group>(null)
  useEffect(() => applyLighting(m, lighting), [m, lighting])
  useLayoutEffect(() => {
    if (root.current) trimShadowCasters(root.current)
  }, [])

  const data = useMemo(() => {
    const H = APARTMENT.height
    const interior = interiorWallPieces(APARTMENT)
    const ext = exteriorWalls(APARTMENT)
    const boards = baseboardPieces(APARTMENT)
    return {
      H,
      f: footprint(APARTMENT),
      interior,
      interiorCaps: capsOf(interior, H),
      interiorBoards: boards.filter((b) => b.side === null),
      exterior: ext.map((w) => ({
        wall: w,
        caps: capsOf(w.pieces, H),
        boards: boards.filter((b) => b.side === w.side),
        ...windowsOf(w),
      })),
    }
  }, [])

  const { f, H } = data
  const T = APARTMENT.wallThickness

  return (
    <group name="apartment" ref={root}>
      {/* base da maquete */}
      <mesh
        geometry={unitBox}
        material={m.base}
        position={[(f.x0 + f.x1) / 2, -0.16, (f.z0 + f.z1) / 2]}
        scale={[f.x1 - f.x0 + 2 * T + 0.3, 0.3, f.z1 - f.z0 + 2 * T + 0.3]}
        receiveShadow
      />

      {/* pisos: porcelanato na área social e circulação, vinílico amadeirado nos quartos */}
      {[...APARTMENT.rooms.map((r) => ({ key: r.id, rect: r.rect, wood: BEDROOM_FLOOR.has(r.id) })), ...APARTMENT.areas.map((a) => ({ key: a.name, rect: a.rect, wood: false }))].map(
        ({ key, rect, wood }) => (
          <FloorPlate key={key} rect={rect} material={wood ? m.vinilico : m.porcelanato} />
        ),
      )}

      {/* paredes internas, tampas de corte e rodapés */}
      <BoxInstances name="walls-interior" boxes={data.interior} material={m.gesso} />
      <BoxInstances boxes={data.interiorCaps} material={m.corte} cast={false} />
      <BoxInstances boxes={data.interiorBoards} material={m.rodape} cast={false} />

      {/* paredes externas: um grupo por lado, cada um com material próprio */}
      {data.exterior.map(({ wall, caps, boards, glass, frames }) => {
        const wm = getWallMaterials(wall.side)
        return (
          <group key={wall.side} name={`wall-${wall.side}`} userData={{ side: wall.side, normal: wall.normal }}>
            <BoxInstances boxes={wall.pieces} material={wm.wall} />
            <BoxInstances boxes={caps} material={wm.cap} cast={false} />
            <BoxInstances boxes={boards} material={wm.board} cast={false} />
            <BoxInstances boxes={frames} material={wm.frame} />
            <BoxInstances boxes={glass} material={wm.glass} cast={false} receive={false} />
          </group>
        )
      })}

      {/* mobiliário de cada cômodo */}
      {APARTMENT.rooms.map((room) => {
        const Room = ROOM_COMPONENTS[room.id]
        return <Room key={room.id} room={room} />
      })}

      {/* hall: aparador e planta junto à entrada */}
      <HallFurniture />
      <group name="ceiling-height" userData={{ height: H }} />
    </group>
  )
}

function FloorPlate({ rect, material }: { rect: { x0: number; z0: number; x1: number; z1: number }; material: THREE.Material }) {
  const geometry = useMemo(() => {
    const w = rect.x1 - rect.x0
    const d = rect.z1 - rect.z0
    const g = new THREE.PlaneGeometry(w, d)
    g.rotateX(-Math.PI / 2)
    // UV em metros, ancorado na origem do mundo para o rejunte alinhar entre cômodos
    const uv = g.attributes.uv
    const pos = g.attributes.position
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) + (rect.x0 + rect.x1) / 2, -(pos.getZ(i) + (rect.z0 + rect.z1) / 2))
    return g
  }, [rect])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[(rect.x0 + rect.x1) / 2, 0.001, (rect.z0 + rect.z1) / 2]}
      receiveShadow
    />
  )
}

/** Hall de entrada: aparador suspenso de freijó com espelho e planta (área de circulação). */
function HallFurniture() {
  const m = getMaterials()
  const hall = APARTMENT.areas.find((a) => a.name === 'hall')!
  const { x1, z0 } = hall.rect
  return (
    <group position={[x1, 0, z0]}>
      <mesh geometry={unitBox} material={m.freijo} position={[-0.2, 0.82, 0.75]} scale={[0.38, 0.12, 1.3]} castShadow receiveShadow />
      <mesh geometry={unitBox} material={m.espelho} position={[-0.012, 1.55, 0.75]} scale={[0.01, 0.9, 0.7]} />
      <mesh geometry={unitBox} material={m.vasoTerracota} position={[-0.2, 0.98, 0.45]} scale={[0.14, 0.2, 0.14]} castShadow />
    </group>
  )
}
