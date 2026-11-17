'use client'

import { getMaterials } from '../materials'
import { B, C, Curtain, Lattice, RoomGroup } from '../parts'
import { Bed, Chair, Nightstand, Tv, Vase, Wardrobe } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Suíte casal (IMG_4796, 4810, 4823): cabeceira em treliça de freijó, roupa de cama sálvia,
 * criados suspensos, guarda-roupa branco, penteadeira com espelho alto e TV em frente à cama.
 * Local: x 0→3,8, z 0→3,6. Cabeceira na parede leste, pés para oeste.
 */
export function SuiteCasal({ room }: { room: RoomLayout }) {
  const m = getMaterials()
  const { x0, z0 } = room.rect
  const E = 3.74
  return (
    <RoomGroup x0={x0} z0={z0}>
      <Lattice w={2.7} h={1.3} cell={0.17} bar={0.026} depth={0.03} m={m.freijo} p={[E - 0.02, 0, 1.95]} rotY={-Math.PI / 2} />
      <Bed p={[E - 0.05, 0, 1.95]} rotY={-Math.PI / 2} w={1.6} quilt={m.salvia} />
      <Nightstand p={[E - 0.25, 0, 0.82]} rotY={-Math.PI / 2} />
      <Nightstand p={[E - 0.25, 0, 3.08]} rotY={-Math.PI / 2} />
      <Vase p={[E - 0.25, 0.62, 3.08]} s={0.7} />
      <Wardrobe p={[1.25, 0, 0.36]} w={2.4} />
      {/* penteadeira, espelho alto e TV na parede oeste */}
      <B s={[0.5, 0.05, 1.25]} r={0.01} p={[0.25, 0.74, 1.95]} m={m.freijo} />
      <B s={[0.46, 0.14, 1.2]} r={0.01} p={[0.25, 0.6, 1.95]} m={m.freijo} />
      <Chair p={[0.78, 0, 1.95]} rotY={-Math.PI / 2} upholstery={m.estofado} />
      <Tv p={[0.03, 1.55, 1.95]} rotY={Math.PI / 2} w={1.2} />
      <C s={[0.03, 1.7, 0.52]} r={0.008} p={[0.02, 1.2, 2.95]} m={m.freijo} />
      <C s={[0.01, 1.6, 0.44]} p={[0.04, 1.2, 2.95]} m={m.espelho} cast={false} />
      <Curtain w={2.9} h={2.62} p={[1.7, 0, 3.46]} m={m.voile} />
    </RoomGroup>
  )
}
