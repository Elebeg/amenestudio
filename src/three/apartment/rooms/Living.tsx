'use client'

import { getMaterials } from '../materials'
import { ArcBand, B, C, Curtain, Cyl, Plant, RoomGroup, Slats } from '../parts'
import { Tv, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Living (IMG_4736, 4631, 4687, 4712, 4748, 4759, 4763, 5034).
 * Local: x 0→6 (oeste→leste), z 0→5,6 (norte→sul).
 * Sul: parede de pedra com TV e rack flutuante ripado. Leste: estante com cristaleira + painel de freijó.
 * Sofá bouclê curvo voltado para a TV, com manta terracota.
 */

// sofá: setor de anel com centro de curvatura perto da parede da TV
const SOFA_C: [number, number, number] = [3.0, 0, 5.35]
const HALF = 0.47 // meia abertura angular (rad) → ~3 m de corda
const A0 = Math.PI / 2 - HALF
const A1 = Math.PI / 2 + HALF

/** ponto do arco (ângulo φ, raio r) no referencial do cômodo */
const onArc = (phi: number, r: number): [number, number] => [SOFA_C[0] + Math.cos(phi) * r, SOFA_C[2] - Math.sin(phi) * r]

export function Living({ room }: { room: RoomLayout }) {
  const m = getMaterials()
  const { x0, z0, x1 } = room.rect
  const W = x1 - x0
  const S = 5.54
  const E = W - 0.06

  const cushions: Array<[number, typeof m.boucle]> = [
    [A1 - 0.1, m.estofado],
    [Math.PI / 2 + 0.14, m.terracota],
    [Math.PI / 2 - 0.1, m.linho],
    [A0 + 0.1, m.estofado],
  ]
  const TH = A1 - 0.16 // manta sobre a ponta oeste do assento, caindo pela frente
  const [tx, tz] = onArc(TH, 2.74)
  const [fx, fz] = onArc(TH, 2.4)

  return (
    <RoomGroup x0={x0} z0={z0}>
      {/* parede de pedra natural, rack flutuante com ripado e TV */}
      <C s={[W, 2.7, 0.04]} p={[W / 2, 1.35, S - 0.02]} m={m.pedra} cast={false} />
      <B s={[5.0, 0.34, 0.45]} r={0.012} p={[3.0, 0.32, S - 0.265]} m={m.freijo} />
      <Slats count={104} from={[0.66, 0.66, S - 0.07]} step={[0.0455, 0, 0]} size={[0.024, 0.3, 0.026]} m={m.freijoEscuro} />
      <Tv p={[3.0, 1.62, S - 0.06]} w={1.65} rotY={Math.PI} />
      <Vase p={[0.95, 0.66, S - 0.28]} s={1.2} />
      <Vase p={[1.2, 0.66, S - 0.3]} s={0.8} />

      {/* painel de freijó do piso ao teto junto à pedra */}
      <C s={[0.03, 2.7, 1.1]} p={[E - 0.015, 1.35, S - 0.55]} m={m.freijo} cast={false} />

      {/* estante de freijó com nichos e cristaleira (parede leste) */}
      <group position={[E - 0.21, 0, 3.15]}>
        <B s={[0.42, 0.68, 2.5]} r={0.006} p={[0, 0, 0]} m={m.freijo} />
        <B s={[0.42, 0.04, 2.5]} p={[0, 2.42, 0]} m={m.freijo} />
        <B s={[0.42, 1.74, 0.04]} p={[0, 0.68, -1.23]} m={m.freijo} />
        <B s={[0.42, 1.74, 0.04]} p={[0, 0.68, 1.23]} m={m.freijo} />
        <B s={[0.02, 1.74, 2.42]} p={[0.2, 0.68, 0]} m={m.pedraBege} cast={false} />
        <Slats count={3} from={[0, 1.1, -0.5]} step={[0, 0.44, 0]} size={[0.38, 0.025, 1.4]} m={m.freijo} />
        <B s={[0.36, 0.3, 0.6]} r={0.006} p={[0, 1.13, -0.7]} m={m.freijo} />
        {/* cristaleira: caixilho branco + vidro + prateleiras de vidro */}
        <B s={[0.4, 1.72, 0.03]} p={[0, 0.69, 0.25]} m={m.laca} />
        <C s={[0.01, 1.66, 0.92]} p={[-0.2, 1.55, 0.74]} m={m.vidro} cast={false} />
        <Slats count={3} from={[0, 1.08, 0.74]} step={[0, 0.42, 0]} size={[0.36, 0.01, 0.9]} m={m.vidro} cast={false} />
        <Vase p={[0, 1.13, -0.15]} s={0.9} />
        <Vase p={[0, 1.57, 0.6]} s={0.6} />
      </group>

      {/* tapete, sofá curvo em bouclê, almofadas e manta terracota */}
      <B s={[3.8, 0.012, 2.9]} r={0.005} p={[3.0, 0, 3.55]} m={m.tapete} cast={false} />
      <group position={SOFA_C}>
        <ArcBand id="sofa-base" ri={2.42} ro={3.38} a0={A0} a1={A1} h={0.3} bevel={0.06} p={[0, 0, 0]} m={m.boucle} />
        <ArcBand id="sofa-seat" ri={2.44} ro={3.18} a0={A0 + 0.01} a1={A1 - 0.01} h={0.15} bevel={0.06} p={[0, 0.29, 0]} m={m.boucle} />
        <ArcBand id="sofa-back" ri={3.1} ro={3.38} a0={A0} a1={A1} h={0.78} bevel={0.12} p={[0, 0, 0]} m={m.boucle} />
      </group>
      {cushions.map(([phi, mat], i) => {
        const [x, z] = onArc(phi, 3.0)
        return <B key={i} s={[0.5, 0.44, 0.16]} r={0.07} p={[x, 0.42, z]} rot={[-0.22, phi - Math.PI / 2, 0]} m={mat} />
      })}
      <B s={[0.66, 0.025, 0.74]} r={0.01} p={[tx, 0.44, tz]} rot={[0, TH - Math.PI / 2, 0]} m={m.terracota} />
      <B s={[0.66, 0.36, 0.025]} r={0.01} p={[fx, 0.1, fz]} rot={[0, TH - Math.PI / 2, 0]} m={m.terracota} />

      {/* mesas de centro: inox oval + mármore escuro sobre base de madeira */}
      <Cyl r={0.5} h={0.035} seg={64} p={[2.5, 0.36, 3.95]} scale={[1, 1, 0.66]} m={m.inox} />
      <Cyl r={0.2} r2={0.25} h={0.36} p={[2.5, 0, 3.95]} m={m.inox} />
      <Cyl r={0.37} h={0.04} seg={64} p={[3.45, 0.42, 4.1]} m={m.marmoreEscuro} />
      <Cyl r={0.21} h={0.42} p={[3.45, 0, 4.1]} m={m.freijo} />
      <B s={[0.3, 0.05, 0.22]} r={0.01} p={[2.4, 0.395, 3.9]} m={m.ceramica} />
      {/* mesa lateral de madeira */}
      <Cyl r={0.26} h={0.03} seg={48} p={[1.0, 0.55, 2.95]} m={m.freijo} />
      <Cyl r={0.05} r2={0.09} h={0.55} p={[1.0, 0, 2.95]} m={m.lacaCinza} />

      {/* janela norte com voile e planta */}
      <Curtain w={4.5} h={2.62} p={[3.0, 0, 0.14]} m={m.voile} />
      <Plant p={[5.45, 0, 0.55]} s={1.4} pot={m.ceramica} leaf={m.folha} />
    </RoomGroup>
  )
}
