'use client'

import * as THREE from 'three'
import { getMaterials } from './materials'
import { ArcBand, B, C, Cyl, Extruded, Flat, Inst, Lathe, boxGeometry, scalePts, smoothShape, type V3 } from './parts'

/** Peças de mobiliário que se repetem entre cômodos. */

/** Cadeira de madeira com assento e encosto curvo estofados (jantar, bancada, escrivaninha). */
export function Chair({
  p,
  rotY = 0,
  seat = 0.46,
  upholstery,
}: {
  p: V3
  rotY?: number
  seat?: number
  upholstery?: THREE.Material
}) {
  const m = getMaterials()
  const u = upholstery ?? m.couro
  const leg = boxGeometry(0.035, seat, 0.035, 0.01)
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B s={[0.46, 0.07, 0.44]} r={0.03} p={[0, seat, 0]} m={u} />
      <ArcBand id="chair-back" ri={0.32} ro={0.37} a0={Math.PI / 2 - 0.62} a1={Math.PI / 2 + 0.62} h={0.2} bevel={0.018} p={[0, seat + 0.22, 0.12]} m={u} />
      <Inst
        geometry={leg}
        m={m.freijo}
        yOffset={seat / 2}
        positions={[
          [-0.19, 0, -0.17],
          [0.19, 0, -0.17],
          [-0.19, 0, 0.18],
          [0.19, 0, 0.18],
        ]}
      />
    </group>
  )
}

/**
 * Cama no referencial local: cabeceira em z = 0, pés em +z, largura em x.
 * Gire com `rotY` (−π/2 → pés para oeste).
 */
export function Bed({
  p,
  rotY = 0,
  w,
  l = 2.0,
  quilt,
  pillows = 2,
}: {
  p: V3
  rotY?: number
  w: number
  l?: number
  quilt: THREE.Material
  pillows?: number
}) {
  const m = getMaterials()
  const pw = w / pillows - 0.12
  const pillow = boxGeometry(pw, 0.16, 0.42, 0.07)
  const pos: V3[] = Array.from({ length: pillows }, (_, i) => [-w / 2 + (w / pillows) * (i + 0.5), 0.6, 0.32])
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B s={[w + 0.04, 0.3, l]} r={0.02} p={[0, 0, l / 2]} m={m.linhoBege} />
      <B s={[w, 0.3, l - 0.04]} r={0.08} p={[0, 0.3, l / 2]} m={m.linho} />
      <B s={[w + 0.1, 0.07, l * 0.62]} r={0.035} p={[0, 0.56, l * 0.66]} m={quilt} />
      <Inst positions={pos} geometry={pillow} m={m.linho} yOffset={0.08} />
    </group>
  )
}

/** Criado-mudo suspenso de freijó. */
export function Nightstand({ p, rotY = 0, w = 0.45 }: { p: V3; rotY?: number; w?: number }) {
  const m = getMaterials()
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B s={[w, 0.26, 0.4]} r={0.012} p={[0, 0.36, 0]} m={m.freijo} />
      <C s={[w - 0.06, 0.012, 0.005]} p={[0, 0.49, 0.2]} m={m.freijoEscuro} cast={false} />
    </group>
  )
}

/** TV fina na parede; `p` é o centro, face voltada para +z local. */
export function Tv({ p, rotY = 0, w = 1.3 }: { p: V3; rotY?: number; w?: number }) {
  const m = getMaterials()
  return <C s={[w, w * 0.565, 0.035]} r={0.006} p={p} rot={[0, rotY, 0]} m={m.tela} />
}

/** Pendente de palha (lavabo, suíte ripada). `p` = ponto mais baixo. */
export function StrawPendant({ p, s = 1, squash = 1 }: { p: V3; s?: number; squash?: number }) {
  const m = getMaterials()
  const cord = 2.7 - p[1] - 0.26 * s * squash
  return (
    <group position={p}>
      <Lathe
        id="straw-pendant"
        profile={[
          [0.001, 0],
          [0.07, 0.015],
          [0.115, 0.09],
          [0.12, 0.15],
          [0.09, 0.22],
          [0.035, 0.26],
          [0.001, 0.262],
        ]}
        scale={[s, s * squash, s]}
        p={[0, 0, 0]}
        m={m.palha}
      />
      <Cyl r={0.035} h={0.02} p={[0, 0.02, 0]} m={m.luz} cast={false} />
      {cord > 0 && <Cyl r={0.003} h={cord} seg={6} p={[0, 0.26 * s * squash, 0]} m={m.metalEscuro} cast={false} />}
    </group>
  )
}

/** Pendente de disco (jantar). */
export function DiscPendant({ p }: { p: V3 }) {
  const m = getMaterials()
  return (
    <group position={p}>
      <Lathe
        id="disc-pendant"
        profile={[
          [0.001, 0.06],
          [0.06, 0.055],
          [0.2, 0.012],
          [0.21, 0],
          [0.2, 0.004],
          [0.05, 0.05],
        ]}
        p={[0, 0, 0]}
        m={m.laca}
      />
      <Cyl r={0.045} h={0.01} p={[0, 0.005, 0]} m={m.luz} cast={false} />
      <Cyl r={0.003} h={2.7 - p[1] - 0.06} seg={6} p={[0, 0.06, 0]} m={m.metalEscuro} cast={false} />
    </group>
  )
}

const PEBBLE: Array<[number, number]> = [
  [0, 0.55],
  [0.21, 0.46],
  [0.27, 0.08],
  [0.21, -0.38],
  [0, -0.52],
  [-0.22, -0.36],
  [-0.25, 0.18],
  [-0.17, 0.46],
]
const PAISLEY: Array<[number, number]> = [
  [-0.5, 0.06],
  [-0.33, 0.28],
  [0.06, 0.3],
  [0.42, 0.12],
  [0.52, -0.2],
  [0.3, -0.12],
  [0, -0.27],
  [-0.4, -0.22],
]

/**
 * Espelho orgânico na parede. Plano XY local, espessura para +z (para dentro do cômodo).
 * `kind`: 'seixo' (quartos, vertical) ou 'gota' (lavabo, horizontal com moldura larga).
 */
export function OrganicMirror({ p, rotY = 0, kind, s = 1 }: { p: V3; rotY?: number; kind: 'seixo' | 'gota'; s?: number }) {
  const m = getMaterials()
  const pts = kind === 'seixo' ? PEBBLE : PAISLEY
  const inner = kind === 'seixo' ? 0.9 : 0.78
  const frame = kind === 'seixo' ? m.estofado : m.pedraBege
  const id = `${kind}:${s}`
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Extruded
        id={`mirror-frame:${id}`}
        shape={() => {
          const outer = smoothShape(scalePts(pts, s))
          outer.holes.push(new THREE.Path(smoothShape(scalePts(pts, s * inner)).getPoints(64)))
          return outer
        }}
        depth={kind === 'seixo' ? 0.03 : 0.05}
        bevel={0.012}
        p={[0, 0, 0]}
        m={frame}
      />
      <Flat id={`mirror-glass:${id}`} shape={() => smoothShape(scalePts(pts, s * inner))} p={[0, 0, 0.01]} m={m.espelho} cast={false} />
    </group>
  )
}

/** Vaso torneado pequeno de cerâmica. */
export function Vase({ p, s = 1, m }: { p: V3; s?: number; m?: THREE.Material }) {
  const mats = getMaterials()
  return (
    <Lathe
      id="vase"
      profile={[
        [0.001, 0],
        [0.05, 0],
        [0.075, 0.06],
        [0.08, 0.13],
        [0.05, 0.22],
        [0.03, 0.27],
        [0.035, 0.3],
        [0.001, 0.3],
      ]}
      p={p}
      scale={[s, s, s]}
      m={m ?? mats.ceramica}
      cast={false}
    />
  )
}

/** Guarda-roupa de laca branca com frisos de porta. Frente voltada para +z local. */
export function Wardrobe({ p, rotY = 0, w, h = 2.6, d = 0.6 }: { p: V3; rotY?: number; w: number; h?: number; d?: number }) {
  const m = getMaterials()
  const doors = Math.max(2, Math.round(w / 0.55))
  const seam = boxGeometry(0.006, h - 0.1, 0.004)
  const pos: V3[] = Array.from({ length: doors - 1 }, (_, i) => [-w / 2 + (w / doors) * (i + 1), 0.05, d / 2 + 0.002])
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B s={[w, h, d]} r={0.008} p={[0, 0, 0]} m={m.laca} />
      <Inst positions={pos} geometry={seam} m={m.corte} yOffset={(h - 0.1) / 2} cast={false} />
    </group>
  )
}
