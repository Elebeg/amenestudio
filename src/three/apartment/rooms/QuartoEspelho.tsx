'use client'

import { getMaterials } from '../materials'
import { B, C, Curtain, RoomGroup, Slats } from '../parts'
import { Bed, Chair, Nightstand, OrganicMirror, Tv, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Quarto com espelho orgânico (IMG_5055, 5061, 5070): meia-parede de freijó, cômoda curva
 * com gavetas, escrivaninha integrada com cadeira de couro, espelho orgânico alto e TV;
 * cama com cabeceira ripada baixa.
 * Local: x 0→3,2, z 0→3,6 (parede leste é externa).
 */
export function QuartoEspelho({ room }: { room: RoomLayout }) {
  const m = getMaterials()
  const { x0, z0 } = room.rect
  const E = 3.2
  return (
    <RoomGroup x0={x0} z0={z0}>
      <Slats count={26} from={[E - 0.025, 0, 1.15]} step={[0, 0, 0.068]} size={[0.03, 1.05, 0.04]} m={m.freijo} />
      <Bed p={[E - 0.06, 0, 2.0]} rotY={-Math.PI / 2} w={1.6} quilt={m.cinzaManta} />
      <Nightstand p={[E - 0.24, 0, 0.92]} rotY={-Math.PI / 2} w={0.4} />
      <Nightstand p={[E - 0.24, 0, 3.08]} rotY={-Math.PI / 2} w={0.4} />
      {/* parede oeste: meia-parede de freijó, escrivaninha, cômoda curva, espelho, TV */}
      <C s={[0.02, 1.0, 3.48]} p={[0.07, 0.5, 1.8]} m={m.freijo} cast={false} />
      <B s={[0.45, 0.05, 1.0]} r={0.02} p={[0.31, 0.74, 0.85]} m={m.freijo} />
      <B s={[0.5, 0.78, 1.7]} r={0.14} p={[0.33, 0, 2.45]} m={m.freijo} />
      <Slats count={3} from={[0.583, 0.2, 2.45]} step={[0, 0.2, 0]} size={[0.006, 0.012, 1.5]} m={m.freijoEscuro} cast={false} />
      <Vase p={[0.33, 0.78, 2.9]} s={1.1} m={m.ceramica} />
      <Chair p={[0.82, 0, 0.85]} rotY={-Math.PI / 2} />
      <OrganicMirror kind="seixo" p={[0.09, 1.62, 0.85]} rotY={Math.PI / 2} s={1.05} />
      <Tv p={[0.09, 1.6, 2.45]} rotY={Math.PI / 2} w={1.3} />
      <Curtain w={2.4} h={2.62} p={[1.8, 0, 3.46]} m={m.voile} />
    </RoomGroup>
  )
}
