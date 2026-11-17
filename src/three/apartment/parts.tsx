'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * Peças reutilizáveis da maquete. Toda geometria passa por um cache global
 * (mesma chave → mesma BufferGeometry), e recebe UV em metros por projeção
 * em caixa, para que um único material com textura sirva a qualquer tamanho.
 */

export type V3 = [number, number, number]

const geoCache = new Map<string, THREE.BufferGeometry>()
export function cachedGeometry(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key)
  if (!g) {
    g = metricUV(make())
    geoCache.set(key, g)
  }
  return g
}

/** UV em metros por projeção na caixa (eixo dominante da normal). */
export function metricUV(g: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!g.attributes.normal) g.computeVertexNormals()
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ax = Math.abs(nor.getX(i))
    const ay = Math.abs(nor.getY(i))
    const az = Math.abs(nor.getZ(i))
    let u: number
    let v: number
    if (ay >= ax && ay >= az) {
      u = x
      v = z
    } else if (ax >= az) {
      u = z
      v = y
    } else {
      u = x
      v = y
    }
    uv[i * 2] = u
    uv[i * 2 + 1] = v
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g
}

const k = (n: number) => n.toFixed(3)

/**
 * Formas descritas por função (Extruded/Flat) não têm parâmetros serializáveis: a chave é o
 * `id`. Para que um `id` repetido com outra forma não devolva a geometria errada do cache,
 * cada id fica registrado com o texto da função e os parâmetros numéricos. Se divergirem, lança erro.
 */
const shapeIds = new Map<string, string>()
export function assertUniqueShapeId(id: string, signature: string) {
  const prev = shapeIds.get(id)
  if (prev === undefined) shapeIds.set(id, signature)
  else if (prev !== signature) throw new Error(`id de forma repetido com parâmetros diferentes: ${id}`)
}

export function boxGeometry(w: number, h: number, d: number, r = 0) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)
  return cachedGeometry(`box:${k(w)}:${k(h)}:${k(d)}:${k(Math.max(0, rr))}`, () =>
    rr > 0.002 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d),
  )
}

type MeshProps = {
  m: THREE.Material
  p: V3
  rot?: V3
  scale?: V3
  cast?: boolean
  receive?: boolean
  name?: string
}

function Mesh({ geometry, m, p, rot, scale, cast = true, receive = true, name }: MeshProps & { geometry: THREE.BufferGeometry }) {
  return (
    <mesh
      name={name}
      geometry={geometry}
      material={m}
      position={p}
      rotation={rot}
      scale={scale}
      castShadow={cast}
      receiveShadow={receive}
    />
  )
}

/** Caixa (opcionalmente arredondada). `p` = centro em x/z e BASE em y. */
export function B({ s, r = 0, p, ...rest }: MeshProps & { s: V3; r?: number }) {
  return <Mesh geometry={boxGeometry(s[0], s[1], s[2], r)} p={[p[0], p[1] + s[1] / 2, p[2]]} {...rest} />
}

/** Caixa centrada (y = centro), útil para painéis em parede. */
export function C({ s, r = 0, ...rest }: MeshProps & { s: V3; r?: number }) {
  return <Mesh geometry={boxGeometry(s[0], s[1], s[2], r)} {...rest} />
}

/** Cilindro. `p` = centro em x/z e BASE em y. */
export function Cyl({
  r,
  r2,
  h,
  seg = 40,
  p,
  ...rest
}: MeshProps & { r: number; r2?: number; h: number; seg?: number }) {
  const g = cachedGeometry(`cyl:${k(r)}:${k(r2 ?? r)}:${k(h)}:${seg}`, () => new THREE.CylinderGeometry(r, r2 ?? r, h, seg))
  return <Mesh geometry={g} p={[p[0], p[1] + h / 2, p[2]]} {...rest} />
}

/** Peças repetidas (ripas, treliça) num único InstancedMesh. `from` = centro da 1ª peça (y = base). */
export function Slats({
  count,
  from,
  step,
  size,
  m,
  r = 0,
  cast = true,
}: {
  count: number
  from: V3
  step: V3
  size: V3
  m: THREE.Material
  r?: number
  cast?: boolean
}) {
  const positions = Array.from({ length: count }, (_, i): V3 => [
    from[0] + step[0] * i,
    from[1] + step[1] * i,
    from[2] + step[2] * i,
  ])
  return <Inst positions={positions} geometry={boxGeometry(size[0], size[1], size[2], r)} m={m} yOffset={size[1] / 2} cast={cast} />
}

/** Mesma geometria em várias posições (pés de cadeira, travesseiros). `positions` = centro x/z, base y. */
export function Inst({
  positions,
  geometry,
  m,
  yOffset = 0,
  cast = true,
}: {
  positions: V3[]
  geometry: THREE.BufferGeometry
  m: THREE.Material
  yOffset?: number
  cast?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const key = positions.map((p) => p.join(',')).join(';')
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new THREE.Object3D()
    positions.forEach((p, i) => {
      o.position.set(p[0], p[1] + yOffset, p[2])
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, yOffset])
  return <instancedMesh ref={ref} args={[geometry, m, positions.length]} castShadow={cast} receiveShadow />
}

/** Grade (treliça): barras verticais e horizontais num InstancedMesh cada. Plano XY local, base em y=0. */
export function Lattice({
  w,
  h,
  cell,
  bar,
  depth,
  m,
  p,
  rotY = 0,
}: {
  w: number
  h: number
  cell: number
  bar: number
  depth: number
  m: THREE.Material
  p: V3
  rotY?: number
}) {
  const nx = Math.round(w / cell) + 1
  const ny = Math.round(h / cell) + 1
  const sx = w / (nx - 1)
  const sy = h / (ny - 1)
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Slats count={nx} from={[-w / 2, 0, 0]} step={[sx, 0, 0]} size={[bar, h, depth]} m={m} />
      <Slats count={ny} from={[0, -bar / 2, -0.004]} step={[0, sy, 0]} size={[w + bar, bar, depth * 0.8]} m={m} />
    </group>
  )
}

/** Sólido de revolução (vasos, cuba, pendentes). Perfil em pares [raio, altura]. */
export function Lathe({ id, profile, p, m, seg = 36, ...rest }: MeshProps & { id: string; profile: Array<[number, number]>; seg?: number }) {
  const g = cachedGeometry(`lathe:${id}:${seg}:${profile.map(([r, y]) => `${k(r)},${k(y)}`).join(';')}`, () =>
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      seg,
    ),
  )
  return <Mesh geometry={g} p={p} m={m} {...rest} />
}

// ── formas orgânicas ────────────────────────────────────────────────────────

/** Curva fechada e suave passando pelos pontos (plano XY). */
export function smoothShape(points: Array<[number, number]>, divisions = 64): THREE.Shape {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    'centripetal',
  )
  return new THREE.Shape(curve.getPoints(divisions).map((v) => new THREE.Vector2(v.x, v.y)))
}

export function scalePts(points: Array<[number, number]>, sx: number, sy = sx): Array<[number, number]> {
  return points.map(([x, y]) => [x * sx, y * sy])
}

/** Forma extrudada no plano XY, espessura ao longo de +Z (para espelhos/peças na parede). */
export function Extruded({
  id,
  shape,
  depth,
  bevel = 0,
  ...rest
}: MeshProps & { id: string; shape: () => THREE.Shape; depth: number; bevel?: number }) {
  const sig = `${k(depth)}:${k(bevel)}:${shape.toString()}`
  assertUniqueShapeId(`ext:${id}`, sig)
  const g = cachedGeometry(`ext:${id}:${k(depth)}:${k(bevel)}`, () => {
    const geo = new THREE.ExtrudeGeometry(shape(), {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 48,
    })
    return geo
  })
  return <Mesh geometry={g} {...rest} />
}

/** Forma plana (vidro do espelho, tampos). */
export function Flat({ id, shape, ...rest }: MeshProps & { id: string; shape: () => THREE.Shape }) {
  assertUniqueShapeId(`flat:${id}`, shape.toString())
  const g = cachedGeometry(`flat:${id}`, () => new THREE.ShapeGeometry(shape(), 48))
  return <Mesh geometry={g} {...rest} />
}

/** Setor de anel (sofá curvo): ângulos em rad, centro no (0,0), extrudado em +Y (altura). */
export function ArcBand({
  id,
  ri,
  ro,
  a0,
  a1,
  h,
  bevel,
  ...rest
}: MeshProps & { id: string; ri: number; ro: number; a0: number; a1: number; h: number; bevel: number }) {
  const g = cachedGeometry(`arc:${id}:${[ri, ro, a0, a1, h, bevel].map(k).join(':')}`, () => {
    const s = new THREE.Shape()
    const b = bevel
    s.absarc(0, 0, ro - b, a0, a1, false)
    s.absarc(0, 0, ri + b, a1, a0, true)
    s.closePath()
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: h - 2 * b,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 5,
      curveSegments: 48,
    })
    // shape no XY, extrusão em +Z → girar para que a altura fique em +Y
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, b, 0)
    return geo
  })
  return <Mesh geometry={g} {...rest} />
}

/**
 * Cortinas de voile abertas: dois panos franzidos nas laterais do vão (a janela fica livre
 * para a luz e para a vista de cima). `p` = centro da base; largura `w` ao longo de x local.
 */
export function Curtain({ w, h, p, rotY = 0, m }: { w: number; h: number; p: V3; rotY?: number; m: THREE.Material }) {
  const pw = Math.min(0.75, Math.max(0.45, w * 0.18))
  const g = cachedGeometry(`curtain:${k(pw)}:${k(h)}`, () => {
    const geo = new THREE.PlaneGeometry(pw, h, Math.round(pw * 60), 1)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      pos.setZ(i, Math.sin(x * 38) * 0.04 + Math.sin(x * 9.1) * 0.012)
    }
    geo.computeVertexNormals()
    return geo
  })
  const off = w / 2 - pw / 2
  return (
    <group position={[p[0], p[1] + h / 2, p[2]]} rotation={[0, rotY, 0]}>
      <mesh geometry={g} material={m} position={[-off, 0, 0]} receiveShadow />
      <mesh geometry={g} material={m} position={[off, 0, 0]} receiveShadow />
    </group>
  )
}

/** Planta: vaso torneado + folhagem em blocos suaves. */
export function Plant({
  p,
  s = 1,
  pot,
  leaf,
}: {
  p: V3
  s?: number
  pot: THREE.Material
  leaf: THREE.Material
}) {
  const g = cachedGeometry('leaf', () => new THREE.IcosahedronGeometry(1, 2))
  return (
    <group position={p} scale={s}>
      <Lathe
        id="pot"
        profile={[
          [0, 0],
          [0.14, 0],
          [0.17, 0.08],
          [0.16, 0.34],
          [0.15, 0.36],
          [0, 0.36],
        ]}
        m={pot}
        p={[0, 0, 0]}
      />
      <mesh geometry={g} material={leaf} position={[0, 0.62, 0]} scale={[0.3, 0.32, 0.28]} castShadow receiveShadow />
      <mesh geometry={g} material={leaf} position={[0.14, 0.82, 0.05]} scale={[0.22, 0.24, 0.2]} castShadow receiveShadow />
      <mesh geometry={g} material={leaf} position={[-0.1, 0.9, -0.06]} scale={[0.18, 0.2, 0.18]} castShadow receiveShadow />
    </group>
  )
}

/** Grupo posicionado no canto noroeste do cômodo (x → leste, z → sul). */
export function RoomGroup({ x0, z0, children }: { x0: number; z0: number; children: ReactNode }) {
  return <group position={[x0, 0, z0]}>{children}</group>
}
