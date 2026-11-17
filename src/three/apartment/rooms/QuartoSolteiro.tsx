'use client'

import { getMaterials } from '../materials'
import { B, Curtain, RoomGroup, Slats } from '../parts'
import { Bed, OrganicMirror, Tv, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Quarto de solteiro (IMG_4837, 4853, 4866, 4880, 4963): duas camas com cabeceira estofada
 * contínua arrematada em freijó, criado branco entre elas; na parede oposta, lambri ripado
 * branco, bancada suspensa de freijó, espelho orgânico e TV.
 * Local: x 0→3,4, z 0→3,6.
 */
export function QuartoSolteiro({ room }: { room: RoomLayout }) {
  const m = getMaterials()
  const { x0, z0 } = room.rect
  const E = 3.34
  return (
    <RoomGroup x0={x0} z0={z0}>
      <B s={[0.06, 1.0, 2.95]} r={0.03} p={[E - 0.03, 0, 1.95]} m={m.estofado} />
      <B s={[0.08, 0.04, 3.0]} r={0.01} p={[E - 0.04, 1.0, 1.95]} m={m.freijo} />
      <Bed p={[E - 0.07, 0, 1.08]} rotY={-Math.PI / 2} w={0.9} l={1.9} quilt={m.linhoBege} pillows={1} />
      <Bed p={[E - 0.07, 0, 2.82]} rotY={-Math.PI / 2} w={0.9} l={1.9} quilt={m.linhoBege} pillows={1} />
      <B s={[0.4, 0.5, 0.42]} r={0.01} p={[E - 0.27, 0, 1.95]} m={m.laca} />
      <B s={[0.42, 0.025, 0.44]} r={0.006} p={[E - 0.27, 0.5, 1.95]} m={m.freijo} />
      <Vase p={[E - 0.27, 0.525, 1.95]} s={0.6} m={m.vasoTerracota} />
      {/* parede oeste */}
      <Slats count={46} from={[0.08, 0, 0.55]} step={[0, 0, 0.0605]} size={[0.03, 0.92, 0.04]} m={m.laca} r={0.008} />
      <B s={[0.44, 0.07, 2.2]} r={0.01} p={[0.3, 0.74, 1.95]} m={m.freijo} />
      <OrganicMirror kind="seixo" p={[0.08, 1.5, 1.05]} rotY={Math.PI / 2} s={0.95} />
      <Tv p={[0.03, 1.55, 2.4]} rotY={Math.PI / 2} w={1.2} />
      <Curtain w={2.6} h={2.62} p={[1.9, 0, 3.46]} m={m.voile} />
    </RoomGroup>
  )
}
