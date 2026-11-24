'use client'

import { useMats } from '../materialsContext'
import { ArcBand, B, C, Curtain, Cyl, Plant, RoomGroup, Slats } from '../parts'
import { Tv, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Living (IMG_4736, 4631, 4687, 4712, 4748, 4759, 4763, 5034).
 * Local: x 0→4,8 (oeste→leste), z 0→5,8 (norte→sul).
 * Oeste (z 0→3,5): a mesma pedra da churrasqueira, aqui com TV e rack flutuante ripado;
 * depois dela, o vão para a cozinha. Norte: porta de vidro para a varanda.
 * Sofá bouclê curvo voltado para a TV, com manta terracota. Leste: painel de freijó atrás
 * do sofá e estante com cristaleira. Sul: vão de entrada vindo do hall.
 */

// sofá: setor de anel com centro de curvatura junto à parede da TV, voltado para oeste
const SOFA_C: [number, number, number] = [0.25, 0, 2.0]
const HALF = 0.47 // meia abertura angular (rad) → ~2,7 m de corda
const A0 = -HALF
const A1 = HALF

/** ponto do arco (ângulo φ, raio r) no referencial do cômodo (mesma convenção do ArcBand) */
const onArc = (phi: number, r: number): [number, number] => [SOFA_C[0] + Math.cos(phi) * r, SOFA_C[2] - Math.sin(phi) * r]

export function Living({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0, x1 } = room.rect
  const W = 0.06 // face da parede oeste (pedra)
  const E = x1 - x0 - 0.06
  const STONE = 3.5

  const cushions: Array<[number, typeof m.boucle]> = [
    [A1 - 0.1, m.estofado],
    [0.14, m.terracota],
    [-0.1, m.linho],
    [A0 + 0.1, m.estofado],
  ]
  const TH = A0 + 0.16 // manta sobre a ponta sul do assento, caindo pela frente
  const [tx, tz] = onArc(TH, 2.74)
  const [fx, fz] = onArc(TH, 2.4)

  return (
    <RoomGroup x0={x0} z0={z0}>
      {/* parede de pedra natural, rack flutuante com ripado e TV (voltada para leste) */}
      <C s={[0.04, 2.7, STONE]} p={[W + 0.02, 1.35, STONE / 2]} m={m.pedra} cast={false} />
      <B s={[0.45, 0.34, 3.0]} r={0.012} p={[W + 0.265, 0.32, 2.0]} m={m.freijo} />
      <Slats count={64} from={[W + 0.5, 0.34, 0.57]} step={[0, 0, 0.0455]} size={[0.026, 0.3, 0.024]} m={m.freijoEscuro} />
      <Tv p={[W + 0.06, 1.62, 2.0]} w={1.65} rotY={Math.PI / 2} />
      <Vase p={[W + 0.28, 0.66, 0.75]} s={1.2} />
      <Vase p={[W + 0.3, 0.66, 1.0]} s={0.8} />

      {/* painel de freijó do piso ao teto atrás do sofá (parede leste) */}
      <C s={[0.03, 2.7, 2.7]} p={[E - 0.015, 1.35, 1.55]} m={m.freijo} cast={false} />

      {/* estante de freijó com nichos e cristaleira (parede leste, junto ao hall) */}
      <group position={[E - 0.21, 0, 4.35]}>
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
      <B s={[2.9, 0.012, 3.6]} r={0.005} p={[2.2, 0, 2.0]} m={m.tapete} cast={false} />
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
      <Cyl r={0.5} h={0.035} seg={64} p={[1.85, 0.36, 2.45]} scale={[0.66, 1, 1]} m={m.inox} />
      <Cyl r={0.2} r2={0.25} h={0.36} p={[1.85, 0, 2.45]} m={m.inox} />
      <Cyl r={0.37} h={0.04} seg={64} p={[2.0, 0.42, 1.45]} m={m.marmoreEscuro} />
      <Cyl r={0.21} h={0.42} p={[2.0, 0, 1.45]} m={m.freijo} />
      <B s={[0.22, 0.05, 0.3]} r={0.01} p={[1.8, 0.395, 2.55]} m={m.ceramica} />
      {/* mesa lateral de madeira na ponta sul do sofá */}
      <Cyl r={0.26} h={0.03} seg={48} p={[3.35, 0.55, 3.95]} m={m.freijo} />
      <Cyl r={0.05} r2={0.09} h={0.55} p={[3.35, 0, 3.95]} m={m.lacaCinza} />

      {/* porta de vidro para a varanda, com voile, e planta junto à TV */}
      <Curtain w={4.3} h={2.62} p={[2.4, 0, 0.14]} m={m.voile} />
      <Plant p={[0.95, 0, 0.42]} s={1.2} pot={m.ceramica} leaf={m.folha} />
    </RoomGroup>
  )
}
