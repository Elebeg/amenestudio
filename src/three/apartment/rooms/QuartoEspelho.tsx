'use client'

import { useMats } from '../materialsContext'
import { B, C, Curtain, RoomGroup, Slats } from '../parts'
import { Bed, Chair, Nightstand, OrganicMirror, Tv, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Quarto com espelho orgânico (IMG_5055, 5061, 5070): cama com cabeceira ripada baixa na
 * parede externa; meia-parede de freijó com cômoda curva e TV entre as duas portas (entrada e
 * banheiro); escrivaninha com cadeira de couro e espelho orgânico alto na parede norte.
 * Local: x 0→3,2, z 0→4,0 (parede leste e sul externas).
 */
export function QuartoEspelho({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0 } = room.rect
  const E = 3.2 // face da parede leste (externa)
  const Z = 2.2 // eixo da cama
  return (
    <RoomGroup x0={x0} z0={z0}>
      <Slats count={26} from={[E - 0.025, 0, Z - 0.85]} step={[0, 0, 0.068]} size={[0.03, 1.05, 0.04]} m={m.freijo} />
      <Bed p={[E - 0.06, 0, Z]} rotY={-Math.PI / 2} w={1.6} quilt={m.cinzaManta} />
      <Nightstand p={[E - 0.24, 0, Z - 1.08]} rotY={-Math.PI / 2} w={0.4} />
      <Nightstand p={[E - 0.24, 0, Z + 1.08]} rotY={-Math.PI / 2} w={0.4} />
      {/* parede oeste, entre as portas: meia-parede de freijó, cômoda curva e TV */}
      <C s={[0.02, 1.0, 1.5]} p={[0.07, 0.5, 2.23]} m={m.freijo} cast={false} />
      <B s={[0.5, 0.78, 1.4]} r={0.14} p={[0.33, 0, 2.23]} m={m.freijo} />
      <Slats count={3} from={[0.583, 0.2, 2.23]} step={[0, 0.2, 0]} size={[0.006, 0.012, 1.2]} m={m.freijoEscuro} cast={false} />
      <Vase p={[0.33, 0.78, 2.7]} s={1.1} m={m.ceramica} />
      <Tv p={[0.09, 1.6, 2.23]} rotY={Math.PI / 2} w={1.3} />
      {/* parede norte: escrivaninha, cadeira e espelho orgânico */}
      <B s={[1.0, 0.05, 0.45]} r={0.02} p={[1.2, 0.74, 0.29]} m={m.freijo} />
      <Chair p={[1.2, 0, 0.78]} rotY={Math.PI} />
      <OrganicMirror kind="seixo" p={[1.2, 1.62, 0.08]} s={1.05} />
      <Curtain w={2.4} h={2.62} p={[1.6, 0, 3.86]} m={m.voile} />
    </RoomGroup>
  )
}
